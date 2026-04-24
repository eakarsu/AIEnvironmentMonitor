import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './FeaturePage.css';

interface User {
  id: number;
  email: string;
  name: string;
}

interface AdminPanelProps {
  user: User;
  onLogout: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ user, onLogout }) => {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'audit'>('stats');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      if (activeTab === 'stats') {
        const response = await axios.get('/api/admin/stats', { headers });
        setStats(response.data);
      } else if (activeTab === 'users') {
        const response = await axios.get('/api/admin/users', { headers });
        setUsers(response.data.data);
      } else if (activeTab === 'audit') {
        const response = await axios.get('/api/admin/audit-logs', { headers });
        setAuditLogs(response.data.data);
      }
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Access denied or failed to load data');
    } finally {
      setLoading(false);
    }
  };

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
          <span>Admin Panel</span>
        </div>

        <div className="page-header">
          <h1 className="page-title">
            <span className="page-title-icon">🛡️</span>
            Admin Panel
          </h1>
        </div>

        {error && <div className="badge badge-danger" style={{ padding: '12px 16px', marginBottom: '20px', display: 'block' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {(['stats', 'users', 'audit'] as const).map((tab) => (
            <button key={tab} className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab(tab)}>
              {tab === 'stats' ? '📊 Statistics' : tab === 'users' ? '👥 Users' : '📋 Audit Logs'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-state"><div className="loading-spinner"></div></div>
        ) : activeTab === 'stats' && stats ? (
          <div className="stats-grid">
            {Object.entries(stats).map(([key, value]) => (
              <div key={key} className="stat-card">
                <div className="stat-label">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                <div className="stat-value">{String(value)}</div>
              </div>
            ))}
          </div>
        ) : activeTab === 'users' ? (
          <div className="card">
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Verified</th><th>Joined</th></tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td><strong>{u.name}</strong></td>
                      <td>{u.email}</td>
                      <td><span className={`badge ${u.role === 'admin' ? 'badge-critical' : 'badge-info'}`}>{u.role}</span></td>
                      <td><span className={`badge ${u.email_verified ? 'badge-success' : 'badge-warning'}`}>{u.email_verified ? 'Yes' : 'No'}</span></td>
                      <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'audit' ? (
          <div className="card">
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr><th>Time</th><th>User</th><th>Action</th><th>Entity</th><th>Entity ID</th></tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{new Date(log.created_at).toLocaleString()}</td>
                      <td>{log.user_name || log.user_email || 'System'}</td>
                      <td><span className="badge badge-info">{log.action}</span></td>
                      <td>{log.entity}</td>
                      <td>{log.entity_id || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default AdminPanel;
