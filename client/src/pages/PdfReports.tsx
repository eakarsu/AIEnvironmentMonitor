import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import './FeaturePage.css';

interface User { id: number; email: string; name: string; role?: string }
interface PdfReportsProps { user: User; onLogout: () => void }

const DOMAINS = ['all', 'weather', 'carbon', 'energy', 'water', 'recycling'];

const PdfReports: React.FC<PdfReportsProps> = ({ user, onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [domain, setDomain] = useState<'all' | 'weather' | 'carbon' | 'energy' | 'water' | 'recycling'>('all');
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      const token = localStorage.getItem('token');
      const r = await fetch(`/api/pdf-report/${domain}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) {
        alert('Failed to generate PDF');
        return;
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sustainability-${domain}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally { setBusy(false); }
  };

  return (
    <div className="app-shell">
      <Sidebar user={user} onLogout={onLogout} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main id="main-content" className="feature-main">
        <header className="feature-header">
          <h1>PDF Sustainability Report</h1>
          <p>Branded PDF with the latest records and your most recent AI weekly digest.</p>
        </header>
        <section className="feature-card">
          <label>Domain
            <select value={domain} onChange={e => setDomain(e.target.value as any)}>
              {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <button onClick={download} disabled={busy} className="btn-primary">{busy ? 'Generating…' : 'Download PDF'}</button>
        </section>
      </main>
    </div>
  );
};

export default PdfReports;
