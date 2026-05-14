import dotenv from 'dotenv';

dotenv.config();

interface AIResponse {
  success: boolean;
  analysis: string;
  recommendations: string[];
  severity?: string;
  confidence: number;
  rawResponse?: any;
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * parseAIJson — 3-strategy JSON parser for AI responses.
 * Strategy 1: Direct JSON.parse of the entire response.
 * Strategy 2: Strip ```json ... ``` markdown code fences and parse.
 * Strategy 3: Greedy extraction of first {...} block via regex.
 * Returns the parsed object or null if all 3 strategies fail.
 */
export function parseAIJson(content: string): any | null {
  if (!content || typeof content !== 'string') return null;

  // Strategy 1: direct parse
  try {
    return JSON.parse(content.trim());
  } catch {
    // continue
  }

  // Strategy 2: strip ```json ... ``` or ``` ... ``` fences
  try {
    const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced && fenced[1]) {
      return JSON.parse(fenced[1].trim());
    }
  } catch {
    // continue
  }

  // Strategy 3: greedy extraction of first JSON-like block
  try {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
  } catch {
    // continue
  }

  return null;
}

export const analyzeWithAI = async (prompt: string, context: string): Promise<AIResponse> => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    return {
      success: false,
      analysis: 'OpenRouter API key not configured. Please add your API key to the .env file.',
      recommendations: ['Configure OPENROUTER_API_KEY in .env file'],
      confidence: 0
    };
  }

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'https://api.example.com',
        'X-Title': 'AI Environment Monitor'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: `You are an expert environmental analyst AI assistant. Provide detailed, actionable analysis and recommendations. Always respond in JSON format with the following structure:
{
  "analysis": "detailed analysis text",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "severity": "low|medium|high|critical",
  "confidence": 0.0-1.0,
  "keyMetrics": {
    "metric1": "value1",
    "metric2": "value2"
  },
  "environmentalImpact": "description of environmental impact",
  "actionPriority": "immediate|short-term|long-term"
}`
          },
          {
            role: 'user',
            content: `${prompt}\n\nContext Data:\n${context}`
          }
        ],
        temperature: 0.7,
        max_tokens: 10000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data: any = await response.json();
    const aiContent = data.choices?.[0]?.message?.content || '';

    // Use 3-strategy parser
    const parsed = parseAIJson(aiContent);
    const parsedResponse = parsed || {
      analysis: aiContent,
      recommendations: [],
      severity: 'medium',
      confidence: 0.7
    };

    return {
      success: true,
      analysis: parsedResponse.analysis || aiContent,
      recommendations: parsedResponse.recommendations || [],
      severity: parsedResponse.severity,
      confidence: parsedResponse.confidence || 0.8,
      rawResponse: parsedResponse
    };
  } catch (error: any) {
    console.error('OpenRouter API error:', error);
    return {
      success: false,
      analysis: `AI analysis failed: ${error.message}`,
      recommendations: ['Please try again or check API configuration'],
      confidence: 0
    };
  }
};

// Weather-specific analysis
export const analyzeWeatherImpact = async (data: any): Promise<AIResponse> => {
  const prompt = `Analyze the weather impact on crops and provide agricultural recommendations.`;
  const context = `
Crop: ${data.crop_name}
Location: ${data.location}
Weather Condition: ${data.weather_condition}
Temperature: ${data.temperature}°C
Humidity: ${data.humidity}%
Rainfall: ${data.rainfall}mm
Current Impact Level: ${data.impact_level}

Please analyze:
1. How this weather affects the specific crop
2. Short-term and long-term impacts
3. Protective measures farmers should take
4. Expected yield impact
5. Alternative strategies`;

  return analyzeWithAI(prompt, context);
};

// Carbon footprint analysis
export const analyzeCarbonFootprint = async (data: any): Promise<AIResponse> => {
  const prompt = `Analyze the carbon footprint data and provide emission reduction recommendations.`;
  const context = `
Activity: ${data.activity_name}
Category: ${data.category}
Emission Source: ${data.emission_source}
CO2 Emissions: ${data.co2_kg} kg
CH4 Emissions: ${data.ch4_kg} kg
N2O Emissions: ${data.n2o_kg} kg
Total CO2 Equivalent: ${data.total_co2e} kg

Please analyze:
1. How significant this emission is compared to average
2. Environmental impact breakdown
3. Specific reduction strategies
4. Alternative low-carbon options
5. Long-term sustainability recommendations`;

  return analyzeWithAI(prompt, context);
};

// Recycling analysis
export const analyzeRecyclingItem = async (data: any): Promise<AIResponse> => {
  const prompt = `Analyze this item for recycling and provide proper disposal guidance.`;
  const context = `
Item: ${data.item_name}
Material Type: ${data.material_type}
Category: ${data.category}
Recyclable: ${data.recyclable ? 'Yes' : 'No'}
Special Instructions: ${data.special_instructions || 'None'}
Environmental Impact: ${data.environmental_impact}

Please analyze:
1. Best disposal/recycling method
2. Environmental impact if improperly disposed
3. Recycling process explanation
4. Alternatives to reduce waste
5. Local recycling tips`;

  return analyzeWithAI(prompt, context);
};

// Energy usage analysis
export const analyzeEnergyUsage = async (data: any): Promise<AIResponse> => {
  const prompt = `Analyze the energy consumption and provide optimization recommendations.`;
  const context = `
Device: ${data.device_name}
Category: ${data.category}
Power Consumption: ${data.power_watts} watts
Daily Usage: ${data.usage_hours} hours
Daily Energy: ${data.daily_kwh} kWh
Monthly Energy: ${data.monthly_kwh} kWh
Monthly Cost: $${data.monthly_cost}
Efficiency Rating: ${data.efficiency_rating}

Please analyze:
1. How this compares to average consumption
2. Energy efficiency assessment
3. Specific optimization strategies
4. Potential cost savings
5. Eco-friendly alternatives`;

  return analyzeWithAI(prompt, context);
};

// Water quality analysis
export const analyzeWaterQuality = async (data: any): Promise<AIResponse> => {
  const prompt = `Analyze the water quality data and provide safety and treatment recommendations.`;
  const context = `
Source: ${data.source_name}
Location: ${data.location}
Sample Date: ${data.sample_date}
pH Level: ${data.ph_level}
Turbidity: ${data.turbidity} NTU
Dissolved Oxygen: ${data.dissolved_oxygen} mg/L
Nitrate Level: ${data.nitrate_level} mg/L
Lead Level: ${data.lead_level} mg/L
Bacteria Count: ${data.bacteria_count} CFU/100mL
Quality Index: ${data.quality_index}

Please analyze:
1. Overall water safety assessment
2. Specific contaminant concerns
3. Health risk evaluation
4. Treatment recommendations
5. Prevention measures`;

  return analyzeWithAI(prompt, context);
};

export default {
  analyzeWithAI,
  analyzeWeatherImpact,
  analyzeCarbonFootprint,
  analyzeRecyclingItem,
  analyzeEnergyUsage,
  analyzeWaterQuality
};
