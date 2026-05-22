import React, { useState } from 'react';

export default function CommunityCarbonBudget() {
  const [payload, setPayload] = useState('{"community":"Downtown campus","monthly_kwh":42000,"water_gal":180000,"waste_tons":12,"target_reduction_pct":18}');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const run = async () => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/community-carbon-budget/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(JSON.parse(payload || '{}')),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setResult(data);
    } catch (e: any) { setError(e.message); }
  };
  return (
    <main id="main-content" className="page-container">
      <h1>Community Carbon Budget</h1>
      <textarea rows={8} value={payload} onChange={(e) => setPayload(e.target.value)} />
      <button onClick={run}>Score Budget</button>
      {error && <div className="error-message">{error}</div>}
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </main>
  );
}
