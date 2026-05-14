import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import './FeaturePage.css';

interface User { id: number; email: string; name: string; role?: string }
interface GoalsProps { user: User; onLogout: () => void }

interface Goal {
  id: number;
  domain: string;
  target_value: number;
  baseline_value: number | null;
  deadline: string;
  status: string;
  actions: any;
  progress_pct: number | null;
  last_coached_at: string | null;
  created_at: string;
}

const DOMAINS = ['weather', 'carbon', 'energy', 'water', 'recycling'];

const Goals: React.FC<GoalsProps> = ({ user, onLogout }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [domain, setDomain] = useState('carbon');
  const [target, setTarget] = useState('');
  const [baseline, setBaseline] = useState('');
  const [deadline, setDeadline] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const token = localStorage.getItem('token');
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const load = async () => {
    setLoading(true);
    try {
      const r = await axios.get('/api/goals', auth);
      setGoals(r.data?.data || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    await axios.post('/api/goals', {
      domain,
      target_value: Number(target),
      baseline_value: baseline ? Number(baseline) : undefined,
      deadline: deadline || undefined,
    }, auth);
    setTarget(''); setBaseline(''); setDeadline('');
    await load();
  };

  const remove = async (id: number) => {
    if (!window.confirm('Delete this goal?')) return;
    await axios.delete(`/api/goals/${id}`, auth);
    await load();
  };

  const coach = async (id: number) => {
    setBusyId(id);
    try {
      await axios.post(`/api/goals/${id}/coach`, {}, auth);
      await load();
    } finally { setBusyId(null); }
  };

  return (
    <div className="app-shell">
      <Sidebar user={user} onLogout={onLogout} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main id="main-content" className="feature-main">
        <header className="feature-header">
          <h1>AI Goal Coach</h1>
          <p>Set 90-day reduction targets and let AI suggest tailored micro-actions.</p>
        </header>

        <section className="feature-card">
          <h2>Create new goal</h2>
          <form onSubmit={create} className="feature-form">
            <label>Domain
              <select value={domain} onChange={e => setDomain(e.target.value)}>
                {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
            <label>Target value <input value={target} onChange={e => setTarget(e.target.value)} type="number" step="any" required /></label>
            <label>Baseline value (optional) <input value={baseline} onChange={e => setBaseline(e.target.value)} type="number" step="any" /></label>
            <label>Deadline (optional) <input value={deadline} onChange={e => setDeadline(e.target.value)} type="date" /></label>
            <button type="submit" className="btn-primary">Create goal</button>
          </form>
        </section>

        <section className="feature-card">
          <h2>Your goals</h2>
          {loading ? <p>Loading…</p> : goals.length === 0 ? <p>No goals yet.</p> : (
            <ul className="feature-list">
              {goals.map(g => (
                <li key={g.id} className="feature-list-item">
                  <div className="feature-list-row">
                    <strong>{g.domain.toUpperCase()}</strong>
                    <span>Target: {g.target_value}</span>
                    <span>Deadline: {g.deadline?.slice(0, 10)}</span>
                    <span>Progress: {g.progress_pct ?? '—'}%</span>
                  </div>
                  {Array.isArray(g.actions) && g.actions.length > 0 && (
                    <ul className="feature-sublist">
                      {g.actions.slice(0, 5).map((a: any, i: number) => (
                        <li key={i}><strong>{a.title}</strong> — {a.description} <em>({a.impact})</em></li>
                      ))}
                    </ul>
                  )}
                  <div className="feature-list-actions">
                    <button onClick={() => coach(g.id)} disabled={busyId === g.id} className="btn-secondary">
                      {busyId === g.id ? 'Coaching…' : 'Get AI coaching'}
                    </button>
                    <button onClick={() => remove(g.id)} className="btn-danger">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
};

export default Goals;
