import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './FeaturePage.css';

interface User {
  id: number;
  email: string;
  name: string;
}

interface ContactProps {
  user: User;
  onLogout: () => void;
}

const Contact: React.FC<ContactProps> = ({ user, onLogout }) => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/contact', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(response.data.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/contact', { subject, message, priority }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Support ticket created successfully!');
      setShowForm(false);
      setSubject('');
      setMessage('');
      fetchTickets();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = { open: 'badge-warning', in_progress: 'badge-info', resolved: 'badge-success', closed: 'badge-critical' };
    return `badge ${classes[status] || 'badge-info'}`;
  };

  const getPriorityBadge = (p: string) => {
    const classes: Record<string, string> = { low: 'badge-success', medium: 'badge-warning', high: 'badge-danger', critical: 'badge-critical' };
    return `badge ${classes[p] || 'badge-info'}`;
  };

  const faqItems = [
    { q: 'How does AI analysis work?', a: 'Our AI uses Claude to analyze your environmental data and provide personalized recommendations.' },
    { q: 'Is my data secure?', a: 'Yes, all data is encrypted in transit and at rest. We follow industry-standard security practices.' },
    { q: 'Can I export my data?', a: 'Yes! Use the export buttons on each feature page to download your data as CSV or JSON.' },
    { q: 'How often is data updated?', a: 'Data is updated in real-time as you add or modify records.' },
  ];

  return (
    <div className="feature-page">
      <header className="nav-header">
        <div className="nav-logo">
          <span className="nav-logo-icon">🌍</span>
          <span>AI Environment Monitor</span>
        </div>
        <div className="nav-user">
          <div className="nav-user-info">
            <div className="nav-user-name">{user.name}</div>
            <div className="nav-user-email">{user.email}</div>
          </div>
          <button className="btn-logout" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <main className="page-container">
        <div className="breadcrumb">
          <Link to="/dashboard">Dashboard</Link>
          <span>/</span>
          <span>Contact & Support</span>
        </div>

        <div className="page-header">
          <h1 className="page-title">
            <span className="page-title-icon">📧</span>
            Contact & Support
          </h1>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>New Ticket</button>
        </div>

        {success && <div className="badge badge-success" style={{ padding: '12px 16px', marginBottom: '20px', display: 'block' }}>{success}</div>}

        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 className="card-title" style={{ marginBottom: '16px' }}>Frequently Asked Questions</h2>
          {faqItems.map((faq, i) => (
            <div key={i} style={{ marginBottom: '16px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, marginBottom: '8px' }}>{faq.q}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{faq.a}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <h2 className="card-title" style={{ marginBottom: '16px' }}>Your Support Tickets</h2>
          {loading ? (
            <div className="loading-state"><div className="loading-spinner"></div></div>
          ) : tickets.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No support tickets yet.</p>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr><th>Subject</th><th>Priority</th><th>Status</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id}>
                      <td><strong>{t.subject}</strong></td>
                      <td><span className={getPriorityBadge(t.priority)}>{t.priority}</span></td>
                      <td><span className={getStatusBadge(t.status)}>{t.status}</span></td>
                      <td>{new Date(t.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">New Support Ticket</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input className="form-input" value={subject} onChange={(e) => setSubject(e.target.value)} required placeholder="Brief description of your issue" />
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea className="form-input" value={message} onChange={(e) => setMessage(e.target.value)} required
                    placeholder="Describe your issue in detail..." rows={5} style={{ resize: 'vertical' }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contact;
