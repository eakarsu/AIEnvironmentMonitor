/**
 * Apply pass 5 — backlog UI for AIEnvironmentMonitor.
 * Surfaces /api/ai/smart-meter, /api/ai/offset-marketplace, /api/ai/leaderboard.
 */
import React, { useState } from 'react';
import axios from 'axios';
import './FeaturePage.css';

interface User { id: number; email: string; name: string; }
interface Props { user: User; onLogout: () => void; }

type Tool = 'smart-meter' | 'offsets' | 'leaderboard';

const AIBacklog: React.FC<Props> = ({ user, onLogout }) => {
  const [tool, setTool] = useState<Tool>('smart-meter');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // smart-meter
  const [readings, setReadings] = useState<string>('[{"utility":"PG&E","meter_id":"M1","reading_at":"2026-05-08T00:00:00Z","kwh":12.5}]');

  // offsets
  const [tonnes, setTonnes] = useState<number>(2);
  const [vendorId, setVendorId] = useState<string>('verra-vcs');
  const [intentNotes, setIntentNotes] = useState<string>('');

  // leaderboard
  const [metric, setMetric] = useState<string>('lowest-carbon');

  const headers = () => {
    const t = localStorage.getItem('token');
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const handle = async (fn: () => Promise<any>) => {
    setLoading(true); setError(null); setResult(null);
    try {
      const r = await fn();
      setResult(r);
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.error || err?.message || 'Request failed';
      const missing = err?.response?.data?.missing;
      if (status === 503) setError(`${msg}${missing ? ` (missing: ${missing})` : ''}`);
      else setError(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="feature-page">
      <header className="feature-header">
        <div className="header-left">
          <h1>AI Backlog Tools</h1>
          <p className="subtitle">Smart-meter ingest, carbon offsets, opt-in leaderboards.</p>
        </div>
        <div className="header-right">
          <span>{user.name || user.email}</span>
          <button onClick={onLogout}>Logout</button>
        </div>
      </header>

      <div style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {(['smart-meter', 'offsets', 'leaderboard'] as Tool[]).map((t) => (
            <button key={t} onClick={() => { setTool(t); setError(null); setResult(null); }} style={{ padding: '6px 12px', background: tool === t ? '#10b981' : '#374151', color: '#fff', border: 0, borderRadius: 4 }}>
              {t}
            </button>
          ))}
        </div>

        {tool === 'smart-meter' && (
          <div>
            <h3>Smart-meter ingest (no creds needed)</h3>
            <p style={{ color: '#888', fontSize: 12 }}>Live Green Button sync gated behind GREEN_BUTTON_API_KEY + GREEN_BUTTON_BASE_URL (returns 503).</p>
            <textarea value={readings} onChange={(e) => setReadings(e.target.value)} rows={6} style={{ width: '100%', fontFamily: 'monospace', fontSize: 12 }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={() => handle(async () => {
                let parsed;
                try { parsed = JSON.parse(readings); } catch { throw new Error('Invalid JSON'); }
                const r = await axios.post('/api/ai/smart-meter/ingest', { readings: parsed }, { headers: headers() });
                return r.data;
              })} disabled={loading}>Ingest</button>
              <button onClick={() => handle(async () => (await axios.get('/api/ai/smart-meter/readings', { headers: headers() })).data)} disabled={loading}>List readings</button>
              <button onClick={() => handle(async () => (await axios.get('/api/ai/smart-meter/status', { headers: headers() })).data)} disabled={loading}>Status</button>
              <button onClick={() => handle(async () => (await axios.post('/api/ai/smart-meter/sync', {}, { headers: headers() })).data)} disabled={loading}>Live sync (503 if no creds)</button>
            </div>
          </div>
        )}

        {tool === 'offsets' && (
          <div>
            <h3>Carbon offset marketplace (intent only)</h3>
            <p style={{ color: '#888', fontSize: 12 }}>Curated vendors only. NO payment / KYC / settlement.</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <select value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
                <option value="verra-vcs">Verra (VCS)</option>
                <option value="gold-standard">Gold Standard</option>
                <option value="climate-action-r">Climate Action Reserve</option>
                <option value="puro-earth">Puro.earth</option>
                <option value="cdr-fyi">CDR.fyi</option>
              </select>
              <input type="number" value={tonnes} onChange={(e) => setTonnes(Number(e.target.value))} placeholder="tonnes_co2e" />
              <input value={intentNotes} onChange={(e) => setIntentNotes(e.target.value)} placeholder="notes (optional)" />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handle(async () => (await axios.get('/api/ai/offset-marketplace/vendors', { headers: headers() })).data)} disabled={loading}>List vendors</button>
              <button onClick={() => handle(async () => (await axios.post('/api/ai/offset-marketplace/match', { tonnes_co2e: tonnes, preferences: {} }, { headers: headers() })).data)} disabled={loading}>AI rank (503 w/o key)</button>
              <button onClick={() => handle(async () => (await axios.post('/api/ai/offset-marketplace/intent', { vendor_id: vendorId, tonnes_co2e: tonnes, notes: intentNotes }, { headers: headers() })).data)} disabled={loading}>Record intent</button>
              <button onClick={() => handle(async () => (await axios.get('/api/ai/offset-marketplace/intents', { headers: headers() })).data)} disabled={loading}>My intents</button>
            </div>
          </div>
        )}

        {tool === 'leaderboard' && (
          <div>
            <h3>Anonymized opt-in leaderboard</h3>
            <p style={{ color: '#888', fontSize: 12 }}>Email/name never exposed. Opt out anytime.</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <select value={metric} onChange={(e) => setMetric(e.target.value)}>
                <option value="lowest-carbon">Lowest carbon</option>
                <option value="most-recycling">Most recycling</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handle(async () => (await axios.post('/api/ai/leaderboard/opt-in', {}, { headers: headers() })).data)} disabled={loading}>Opt in</button>
              <button onClick={() => handle(async () => (await axios.delete('/api/ai/leaderboard/opt-in', { headers: headers() })).data)} disabled={loading}>Opt out</button>
              <button onClick={() => handle(async () => (await axios.get(`/api/ai/leaderboard/${metric}`, { headers: headers() })).data)} disabled={loading}>View ranking</button>
            </div>
          </div>
        )}

        {error && <div style={{ marginTop: 16, padding: 12, background: '#7f1d1d', color: '#fecaca', borderRadius: 4 }}>{error}</div>}
        {result && <pre style={{ marginTop: 16, padding: 12, background: '#1f2937', color: '#e5e7eb', borderRadius: 4, maxHeight: 480, overflow: 'auto' }}>{JSON.stringify(result, null, 2)}</pre>}
      </div>
    </div>
  );
};

export default AIBacklog;
