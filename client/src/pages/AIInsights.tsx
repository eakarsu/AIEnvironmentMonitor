import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './FeaturePage.css';

interface User {
  id: number;
  email: string;
  name: string;
}

interface AIInsightsProps {
  user: User;
  onLogout: () => void;
}

type Tool = 'trend-forecast' | 'weekly-digest' | 'community-benchmark' | 'carbon-reduce-recommend' | 'recycling-sort';

const DOMAINS = ['weather', 'carbon', 'energy', 'water', 'recycling'];

const AIInsights: React.FC<AIInsightsProps> = ({ user, onLogout }) => {
  const [tool, setTool] = useState<Tool>('trend-forecast');
  const [domain, setDomain] = useState<string>('carbon');
  const [days, setDays] = useState<number>(7);
  const [percentile, setPercentile] = useState<number>(50);
  const [lookbackDays, setLookbackDays] = useState<number>(30);
  const [itemDescription, setItemDescription] = useState<string>('');
  const [municipality, setMunicipality] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      let url = '';
      let body: any = {};
      if (tool === 'trend-forecast') {
        url = '/api/ai/trend-forecast';
        body = { domain, days_to_forecast: days };
      } else if (tool === 'weekly-digest') {
        url = '/api/ai/weekly-digest';
        body = {};
      } else if (tool === 'community-benchmark') {
        url = '/api/ai/community-benchmark';
        body = { domain, percentile };
      } else if (tool === 'carbon-reduce-recommend') {
        url = '/api/ai/carbon-reduce-recommend';
        body = { lookback_days: lookbackDays };
      } else {
        url = '/api/ai/recycling-sort';
        body = { item_description: itemDescription, municipality: municipality || undefined };
      }
      const resp = await axios.post(url, body, { headers });
      setResult(resp.data);
    } catch (err: any) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Request failed';
      if (status === 503) {
        setError('AI not configured: OPENROUTER_API_KEY is missing on the server.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feature-page">
      <header className="feature-header">
        <div className="header-left">
          <Link to="/dashboard" className="back-link">← Back to Dashboard</Link>
          <h1>AI Insights</h1>
        </div>
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </header>

      <div className="feature-content">
        <p style={{ marginBottom: 16, opacity: 0.85 }}>
          Generate cross-domain AI insights from your environmental data: trend forecasts, weekly digests, and community benchmarks.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {(['trend-forecast', 'weekly-digest', 'community-benchmark', 'carbon-reduce-recommend', 'recycling-sort'] as Tool[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTool(t); setResult(null); setError(null); }}
              style={{
                padding: '8px 14px',
                borderRadius: 6,
                border: '1px solid #4f46e5',
                background: tool === t ? '#4f46e5' : 'transparent',
                color: tool === t ? '#fff' : 'inherit',
                cursor: 'pointer',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div style={{ border: '1px solid var(--border-color, #444)', padding: 16, borderRadius: 8, marginBottom: 20 }}>
          {tool === 'trend-forecast' && (
            <>
              <div style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', marginBottom: 4 }}>Domain</label>
                <select className="form-input" value={domain} onChange={(e) => setDomain(e.target.value)}>
                  {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', marginBottom: 4 }}>Days to forecast (1-90)</label>
                <input
                  type="number"
                  className="form-input"
                  min={1}
                  max={90}
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value, 10) || 7)}
                />
              </div>
            </>
          )}

          {tool === 'weekly-digest' && (
            <p style={{ opacity: 0.85 }}>
              Aggregates this week's data across all 5 domains (weather, carbon, energy, water, recycling) and asks the AI for a holistic environmental health digest.
            </p>
          )}

          {tool === 'community-benchmark' && (
            <>
              <div style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', marginBottom: 4 }}>Domain</label>
                <select className="form-input" value={domain} onChange={(e) => setDomain(e.target.value)}>
                  {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', marginBottom: 4 }}>Target percentile (1-99)</label>
                <input
                  type="number"
                  className="form-input"
                  min={1}
                  max={99}
                  value={percentile}
                  onChange={(e) => setPercentile(parseInt(e.target.value, 10) || 50)}
                />
              </div>
            </>
          )}

          {tool === 'carbon-reduce-recommend' && (
            <>
              <p style={{ opacity: 0.85, marginBottom: 10 }}>
                Reads your recent carbon footprint entries and returns ranked CO2e reduction strategies.
              </p>
              <div style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', marginBottom: 4 }}>Lookback window (days, 1-365)</label>
                <input
                  type="number"
                  className="form-input"
                  min={1}
                  max={365}
                  value={lookbackDays}
                  onChange={(e) => setLookbackDays(parseInt(e.target.value, 10) || 30)}
                />
              </div>
            </>
          )}

          {tool === 'recycling-sort' && (
            <>
              <p style={{ opacity: 0.85, marginBottom: 10 }}>
                Ask the AI which bin / disposal stream an item belongs in.
              </p>
              <div style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', marginBottom: 4 }}>Item description (required)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. greasy pizza box, lithium battery, broken ceramic mug"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', marginBottom: 4 }}>Municipality / region (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. San Francisco, CA"
                  value={municipality}
                  onChange={(e) => setMunicipality(e.target.value)}
                />
              </div>
            </>
          )}

          <button
            className="btn primary"
            type="button"
            onClick={run}
            disabled={loading}
            style={{
              padding: '10px 20px',
              borderRadius: 6,
              background: '#4f46e5',
              color: '#fff',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Running…' : `Run ${tool}`}
          </button>
        </div>

        {error && (
          <div style={{ background: '#7f1d1d', color: '#fee2e2', padding: 12, borderRadius: 6, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {result && (
          <div style={{ border: '1px solid var(--border-color, #444)', padding: 16, borderRadius: 8 }}>
            <h3>Result</h3>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '60vh', overflow: 'auto' }}>
              {JSON.stringify(result, null, 2)}
            </pre>
            <p style={{ marginTop: 8, fontSize: 13, opacity: 0.7 }}>
              See the <Link to="/ai-results">AI Results</Link> page for full history.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsights;
