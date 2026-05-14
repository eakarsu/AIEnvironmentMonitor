/**
 * New AI endpoints for AIEnvironmentMonitor:
 * - POST /api/ai/trend-forecast
 * - POST /api/ai/weekly-digest
 * - POST /api/ai/community-benchmark
 */
import express, { Request, Response } from 'express';
import pool from '../database/db';
import { analyzeWithAI } from '../services/openrouter';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { aiRateLimiter } from '../middleware/rateLimiter';

const router = express.Router();

/**
 * Auto-create ai_results table on first load (idempotent).
 */
pool.query(`
  CREATE TABLE IF NOT EXISTS ai_results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    analysis_type VARCHAR(100) NOT NULL,
    domain VARCHAR(100),
    entity_id VARCHAR(100),
    result JSONB NOT NULL,
    model_used VARCHAR(200) DEFAULT 'anthropic/claude-3-5-sonnet-20241022',
    confidence NUMERIC(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error('Failed to ensure ai_results table:', err.message));

async function persistAIResult(
  userId: number | null | undefined,
  analysisType: string,
  domain: string | null,
  entityId: string | null,
  result: any,
  confidence?: number | null
): Promise<number | null> {
  try {
    const insertResult = await pool.query(
      `INSERT INTO ai_results (user_id, analysis_type, domain, entity_id, result, model_used, confidence)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7) RETURNING id`,
      [
        userId || null,
        analysisType,
        domain || null,
        entityId || null,
        JSON.stringify(result || {}),
        process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
        confidence ?? null,
      ]
    );
    return insertResult.rows[0]?.id || null;
  } catch (err: any) {
    console.error('Failed to persist AI result:', err.message);
    return null;
  }
}

// Domain → table & columns config
// NOTE: `recycling.valueColumn` MUST be numeric for PERCENTILE_CONT in community-benchmark.
// `environmental_impact` is VARCHAR; we map an inline expression for benchmarking,
// and a separate fallback column for trend-forecast where any column type is fine.
const domainConfig: Record<
  string,
  { table: string; valueColumn: string; numericExpr?: string; dateColumn: string }
> = {
  weather: { table: 'weather_impacts', valueColumn: 'temperature', dateColumn: 'created_at' },
  carbon:  { table: 'carbon_footprints', valueColumn: 'total_co2e', dateColumn: 'created_at' },
  energy:  { table: 'energy_usages', valueColumn: 'monthly_kwh', dateColumn: 'created_at' },
  water:   { table: 'water_quality', valueColumn: 'quality_index', dateColumn: 'sample_date' },
  // Use a CASE expression mapping known severity strings to numeric scores so
  // community-benchmark + trend-forecast can run on the recycling domain.
  recycling: {
    table: 'recycling_items',
    valueColumn: 'environmental_impact',
    numericExpr: `CASE
      WHEN LOWER(COALESCE(environmental_impact, '')) IN ('high','severe','critical') THEN 3
      WHEN LOWER(COALESCE(environmental_impact, '')) IN ('medium','moderate') THEN 2
      WHEN LOWER(COALESCE(environmental_impact, '')) IN ('low','minimal','negligible') THEN 1
      ELSE 0
    END`,
    dateColumn: 'created_at'
  }
};

/**
 * POST /api/ai/trend-forecast
 * Accepts { domain, days_to_forecast }
 * Fetches last 30 days of data for the domain, uses AI to extrapolate trends
 * and flag projected threshold breaches.
 */
router.post('/trend-forecast', authenticateToken, aiRateLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { domain, days_to_forecast } = req.body;

    if (!domain || !domainConfig[domain]) {
      return res.status(400).json({
        error: `Invalid domain. Must be one of: ${Object.keys(domainConfig).join(', ')}`
      });
    }

    const forecastDays = parseInt(days_to_forecast) || 7;
    if (forecastDays < 1 || forecastDays > 90) {
      return res.status(400).json({ error: 'days_to_forecast must be between 1 and 90' });
    }

    const { table, valueColumn, dateColumn } = domainConfig[domain];

    // Fetch last 30 days of data — scoped per-user when a user_id column exists.
    // Falls back gracefully if the table has no user_id (legacy seed data).
    let historicalRows: any[] = [];
    try {
      const result = await pool.query(
        `SELECT * FROM ${table}
         WHERE ${dateColumn} >= NOW() - INTERVAL '30 days'
           AND (user_id IS NULL OR user_id = $1)
         ORDER BY ${dateColumn} ASC`,
        [req.user?.id || null]
      );
      historicalRows = result.rows;
    } catch (err: any) {
      // user_id column may not exist in older schemas — fall back to global query.
      const result = await pool.query(
        `SELECT * FROM ${table}
         WHERE ${dateColumn} >= NOW() - INTERVAL '30 days'
         ORDER BY ${dateColumn} ASC`,
      );
      historicalRows = result.rows;
    }
    const historicalData = historicalRows;

    if (historicalData.length === 0) {
      return res.json({
        domain,
        days_to_forecast: forecastDays,
        message: 'Insufficient historical data (0 records in last 30 days)',
        forecast: null,
        historicalCount: 0
      });
    }

    const prompt = `You are an AI environmental data analyst. Analyze the last 30 days of ${domain} monitoring data and generate a ${forecastDays}-day trend forecast.

Provide:
1. TREND ANALYSIS: Identify the underlying trend (increasing/decreasing/stable/cyclical) with statistical confidence
2. ${forecastDays}-DAY FORECAST: Day-by-day projected values for the primary metric (${valueColumn}) with uncertainty ranges
3. THRESHOLD BREACH ALERTS: Flag any projected values that exceed safe/normal thresholds, with specific days and estimated severity
4. ANOMALY DETECTION: Any unusual patterns in the historical data that could affect the forecast
5. SEASONAL PATTERNS: Any weekly or monthly patterns detected
6. CONFIDENCE SCORE: Overall forecast confidence (0-1) based on data quality and variability
7. RECOMMENDED ACTIONS: Proactive steps to take based on projected trends

Historical Data (last 30 days, ${historicalData.length} records): ${JSON.stringify(historicalData)}

Format the forecast as a structured JSON-compatible response with clear day-by-day projections.`;

    const analysis = await analyzeWithAI(prompt, `Domain: ${domain}, Forecast horizon: ${forecastDays} days`);

    const resultId = await persistAIResult(
      req.user?.id,
      'trend-forecast',
      domain,
      null,
      analysis,
      analysis?.confidence ?? null
    );

    res.json({
      id: resultId,
      domain,
      days_to_forecast: forecastDays,
      historicalCount: historicalData.length,
      analysis,
      generatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error generating trend forecast:', error);
    res.status(500).json({ error: 'Failed to generate trend forecast' });
  }
});

/**
 * POST /api/ai/weekly-digest
 * Fetches all 5 domain data for the current week, generates comprehensive
 * environmental health digest with AI recommendations.
 */
router.post('/weekly-digest', authenticateToken, aiRateLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || null;
    // Helper that scopes by user_id when the column exists, falls back otherwise.
    const scopedQuery = async (sql: string, dateClause: string) => {
      const userClause = ` AND (user_id IS NULL OR user_id = $1)`;
      try {
        return await pool.query(`${sql} WHERE ${dateClause}${userClause} ORDER BY created_at DESC`, [userId]);
      } catch (err) {
        return await pool.query(`${sql} WHERE ${dateClause} ORDER BY created_at DESC`);
      }
    };

    // Fetch current week data from all 5 domains in parallel — scoped per-user.
    const [weatherData, carbonData, energyData, waterData, recyclingData] = await Promise.all([
      scopedQuery(`SELECT * FROM weather_impacts`, `created_at >= NOW() - INTERVAL '7 days'`),
      scopedQuery(`SELECT * FROM carbon_footprints`, `created_at >= NOW() - INTERVAL '7 days'`),
      scopedQuery(`SELECT * FROM energy_usages`, `created_at >= NOW() - INTERVAL '7 days'`),
      (async () => {
        try {
          return await pool.query(
            `SELECT * FROM water_quality WHERE sample_date >= NOW() - INTERVAL '7 days' AND (user_id IS NULL OR user_id = $1) ORDER BY sample_date DESC`,
            [userId]
          );
        } catch {
          return await pool.query(
            `SELECT * FROM water_quality WHERE sample_date >= NOW() - INTERVAL '7 days' ORDER BY sample_date DESC`
          );
        }
      })(),
      scopedQuery(`SELECT * FROM recycling_items`, `created_at >= NOW() - INTERVAL '7 days'`)
    ]);

    const weeklyData = {
      weather: { count: weatherData.rows.length, records: weatherData.rows },
      carbon: { count: carbonData.rows.length, records: carbonData.rows },
      energy: { count: energyData.rows.length, records: energyData.rows },
      water: { count: waterData.rows.length, records: waterData.rows },
      recycling: { count: recyclingData.rows.length, records: recyclingData.rows }
    };

    const totalRecords = Object.values(weeklyData).reduce((sum, d) => sum + d.count, 0);

    const prompt = `You are an AI environmental health analyst. Generate a comprehensive weekly environmental health digest based on data from all 5 monitoring domains collected over the past 7 days.

Provide:
1. EXECUTIVE SUMMARY: Overall environmental health score (0-100) for the week with trend vs previous week
2. DOMAIN HIGHLIGHTS:
   - Weather Impact: Key weather events and their environmental effects
   - Carbon Footprint: Total emissions this week, trend, key contributors
   - Energy Usage: Total consumption, efficiency, top consuming devices/categories
   - Water Quality: Average quality index, any safety concerns, treatment needs
   - Recycling: Recycling rate, items processed, environmental impact prevented
3. TOP ALERTS: Up to 5 critical issues requiring immediate attention across all domains
4. WEEK-OVER-WEEK COMPARISON: Notable changes from typical patterns
5. POSITIVE ACHIEVEMENTS: Environmental wins and improvements this week
6. PRIORITY RECOMMENDATIONS: Top 5 actionable steps for the coming week, ranked by impact
7. ENVIRONMENTAL IMPACT SCORE: Estimated CO2e prevented, water saved, waste diverted this week

Weekly Data Summary (${totalRecords} total records): ${JSON.stringify(weeklyData)}

Format as a professional weekly environmental health digest report.`;

    const analysis = await analyzeWithAI(prompt, `Weekly digest covering ${totalRecords} records across 5 domains`);

    const resultId = await persistAIResult(
      req.user?.id,
      'weekly-digest',
      'all',
      null,
      analysis,
      analysis?.confidence ?? null
    );

    res.json({
      id: resultId,
      weekStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      weekEnd: new Date().toISOString(),
      domainCounts: {
        weather: weatherData.rows.length,
        carbon: carbonData.rows.length,
        energy: energyData.rows.length,
        water: waterData.rows.length,
        recycling: recyclingData.rows.length
      },
      totalRecords,
      analysis,
      generatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error generating weekly digest:', error);
    res.status(500).json({ error: 'Failed to generate weekly digest' });
  }
});

/**
 * POST /api/ai/community-benchmark
 * Accepts { domain, user_value }
 * Fetches anonymized aggregate averages across all users for that domain,
 * uses AI to generate personalized comparison and improvement suggestions.
 */
router.post('/community-benchmark', authenticateToken, aiRateLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { domain, user_value } = req.body;

    if (!domain || !domainConfig[domain]) {
      return res.status(400).json({
        error: `Invalid domain. Must be one of: ${Object.keys(domainConfig).join(', ')}`
      });
    }

    if (user_value === undefined || user_value === null) {
      return res.status(400).json({ error: 'user_value is required' });
    }

    const numericUserValue = parseFloat(user_value);
    if (isNaN(numericUserValue)) {
      return res.status(400).json({ error: 'user_value must be a number' });
    }

    const { table, valueColumn, numericExpr } = domainConfig[domain];

    // For non-numeric columns (e.g. recycling.environmental_impact VARCHAR),
    // use the configured numeric expression so PERCENTILE_CONT does not crash.
    const aggExpr = numericExpr || `${valueColumn}::numeric`;

    // Fetch anonymized aggregate stats across all users
    const statsResult = await pool.query(`
      SELECT
        AVG(${aggExpr}) as average,
        MIN(${aggExpr}) as minimum,
        MAX(${aggExpr}) as maximum,
        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY ${aggExpr}) as p25,
        PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY ${aggExpr}) as p50,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY ${aggExpr}) as p75,
        COUNT(*) as total_records
      FROM ${table}
      WHERE ${valueColumn} IS NOT NULL
    `);

    const communityStats = statsResult.rows[0];
    const average = parseFloat(communityStats.average) || 0;
    const percentileRank = average > 0
      ? Math.round((numericUserValue / average) * 100)
      : 0;

    const prompt = `You are an AI environmental coach. Compare a user's environmental metric to community averages and provide personalized, encouraging improvement suggestions.

User's ${domain} value: ${numericUserValue}
Community statistics for ${domain} (${valueColumn}):
- Community average: ${communityStats.average}
- 25th percentile (good performance): ${communityStats.p25}
- 50th percentile (median): ${communityStats.p50}
- 75th percentile (below average): ${communityStats.p75}
- Minimum recorded: ${communityStats.minimum}
- Maximum recorded: ${communityStats.maximum}
- Based on ${communityStats.total_records} community records

Provide:
1. PERFORMANCE ASSESSMENT: Where does this user stand relative to the community? (e.g., "Top 20%", "Above average", etc.)
2. CONTEXT: What does this value mean in real-world terms? (environmental impact, comparison to everyday references)
3. STRENGTHS: What the user is doing well based on this metric
4. IMPROVEMENT OPPORTUNITIES: 3-5 specific, actionable steps to improve their metric
5. QUICK WINS: 2-3 changes the user could make this week for immediate impact
6. LONG-TERM GOALS: Suggested target value to aim for (top 25% of community) and realistic timeline
7. MOTIVATIONAL INSIGHT: An encouraging, personalized message about their environmental journey

Keep the tone positive, specific, and actionable. Avoid generic advice.`;

    const analysis = await analyzeWithAI(
      prompt,
      `Domain: ${domain}, User value: ${numericUserValue}, Community average: ${average}`
    );

    const resultId = await persistAIResult(
      req.user?.id,
      'community-benchmark',
      domain,
      null,
      { ...analysis, userValue: numericUserValue, percentileApprox: percentileRank },
      analysis?.confidence ?? null
    );

    res.json({
      id: resultId,
      domain,
      userValue: numericUserValue,
      communityStats: {
        average: parseFloat(communityStats.average) || 0,
        minimum: parseFloat(communityStats.minimum) || 0,
        maximum: parseFloat(communityStats.maximum) || 0,
        p25: parseFloat(communityStats.p25) || 0,
        p50: parseFloat(communityStats.p50) || 0,
        p75: parseFloat(communityStats.p75) || 0,
        totalRecords: parseInt(communityStats.total_records) || 0
      },
      percentileApprox: percentileRank,
      analysis,
      generatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error generating community benchmark:', error);
    res.status(500).json({ error: 'Failed to generate community benchmark' });
  }
});

/**
 * POST /api/ai/carbon-reduce-recommend
 * Reads recent carbon entries for the authenticated user and returns
 * ranked reduction strategies.
 * Returns 503 when OPENROUTER_API_KEY is not configured.
 */
router.post('/carbon-reduce-recommend', authenticateToken, aiRateLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
      return res.status(503).json({ error: 'AI not configured: OPENROUTER_API_KEY missing on the server.' });
    }

    const lookbackDays = Math.max(1, Math.min(365, parseInt(String(req.body?.lookback_days || '30'), 10)));
    const userId = req.user?.id || null;

    let rows: any[] = [];
    try {
      const r = await pool.query(
        `SELECT * FROM carbon_footprints
         WHERE created_at >= NOW() - INTERVAL '${lookbackDays} days'
           AND (user_id IS NULL OR user_id = $1)
         ORDER BY created_at DESC LIMIT 200`,
        [userId]
      );
      rows = r.rows;
    } catch {
      const r = await pool.query(
        `SELECT * FROM carbon_footprints
         WHERE created_at >= NOW() - INTERVAL '${lookbackDays} days'
         ORDER BY created_at DESC LIMIT 200`
      );
      rows = r.rows;
    }

    const prompt = `You are an AI carbon-reduction coach. Based on the user's recent ${lookbackDays}-day carbon footprint history (${rows.length} records), produce ranked, concrete reduction strategies.

Provide:
1. TOP CONTRIBUTORS: Identify the highest-emitting activities/categories from the data
2. RANKED RECOMMENDATIONS: 5-10 reduction strategies ranked by estimated CO2e savings, each with:
   - Action description
   - Estimated annual CO2e reduction (kg)
   - Effort level (low/medium/high)
   - Time horizon (immediate/30 days/90 days/long-term)
3. QUICK WINS: 3 immediate actions for this week
4. BEHAVIORAL CHANGES: Habit shifts that compound over time
5. INVESTMENTS: Higher-cost upgrades (e.g. heat pump, EV) ranked by payback
6. EXPECTED TOTAL REDUCTION: Sum of estimated CO2e savings if all top recommendations are followed

Recent carbon footprint records: ${JSON.stringify(rows.slice(0, 50))}`;

    const analysis = await analyzeWithAI(prompt, `Carbon reduction for ${rows.length} records over ${lookbackDays} days`);

    const resultId = await persistAIResult(
      req.user?.id,
      'carbon-reduce-recommend',
      'carbon',
      null,
      analysis,
      analysis?.confidence ?? null
    );

    res.json({
      id: resultId,
      lookbackDays,
      recordCount: rows.length,
      analysis,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error generating carbon reduction recommendations:', error);
    res.status(500).json({ error: 'Failed to generate carbon reduction recommendations' });
  }
});

/**
 * POST /api/ai/recycling-sort
 * Accepts { item_description, municipality? } and returns bin / disposal guidance.
 * Returns 503 when OPENROUTER_API_KEY is not configured.
 */
router.post('/recycling-sort', authenticateToken, aiRateLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
      return res.status(503).json({ error: 'AI not configured: OPENROUTER_API_KEY missing on the server.' });
    }

    const itemDescription = String(req.body?.item_description || '').trim();
    if (!itemDescription) {
      return res.status(400).json({ error: 'item_description is required' });
    }
    const municipality = String(req.body?.municipality || '').trim() || null;

    const prompt = `You are an AI recycling assistant. The user wants disposal guidance for the following item.

Item: ${itemDescription}
${municipality ? `Municipality / region: ${municipality}` : 'Municipality: (not provided — give general best-practice guidance and note local-rule caveats.)'}

Provide:
1. BIN: Specific bin / stream (e.g. "blue curbside recycling", "compost", "e-waste drop-off", "hazardous waste", "trash") with confidence level
2. PREP STEPS: How to prepare the item (rinse, remove labels, separate components, etc.)
3. WHY: Brief explanation of why this routing is correct (material composition, contamination risk)
4. ALTERNATIVES: Reuse, donation, repair, or upcycle options before recycling
5. WATCH-OUTS: Common mistakes that cause this item to be landfilled even when binned correctly
6. LOCAL VARIATION NOTE: Where local rules commonly differ${municipality ? ` (consider ${municipality} guidelines)` : ''}
7. ENVIRONMENTAL IMPACT: Approximate CO2e / resource impact of correct vs incorrect disposal`;

    const analysis = await analyzeWithAI(
      prompt,
      `Item: ${itemDescription}${municipality ? `, Municipality: ${municipality}` : ''}`
    );

    const resultId = await persistAIResult(
      req.user?.id,
      'recycling-sort',
      'recycling',
      null,
      { ...analysis, item_description: itemDescription, municipality },
      analysis?.confidence ?? null
    );

    res.json({
      id: resultId,
      item_description: itemDescription,
      municipality,
      analysis,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error generating recycling sort guidance:', error);
    res.status(500).json({ error: 'Failed to generate recycling sort guidance' });
  }
});

/**
 * GET /api/ai/results
 * Paginated list of persisted AI results for the authenticated user.
 * Query: page, limit, analysis_type, domain
 */
router.get('/results', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'), 10)));
    const offset = (page - 1) * limit;
    const { analysis_type, domain } = req.query;

    const conditions: string[] = ['user_id = $1'];
    const params: any[] = [req.user?.id];

    if (analysis_type) {
      params.push(analysis_type);
      conditions.push(`analysis_type = $${params.length}`);
    }
    if (domain) {
      params.push(domain);
      conditions.push(`domain = $${params.length}`);
    }
    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM ai_results ${whereClause}`,
      params
    );
    const total = countResult.rows[0]?.count || 0;

    params.push(limit, offset);
    const dataResult = await pool.query(
      `SELECT id, user_id, analysis_type, domain, entity_id, result, model_used, confidence, created_at
         FROM ai_results ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (err: any) {
    console.error('Error listing AI results:', err);
    res.status(500).json({ error: 'Failed to list AI results' });
  }
});

/**
 * GET /api/ai/results/:id - retrieve a single persisted result
 */
router.get('/results/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const result = await pool.query(
      `SELECT id, user_id, analysis_type, domain, entity_id, result, model_used, confidence, created_at
         FROM ai_results WHERE id = $1 AND user_id = $2`,
      [id, req.user?.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('Error fetching AI result:', err);
    res.status(500).json({ error: 'Failed to fetch AI result' });
  }
});

export default router;
