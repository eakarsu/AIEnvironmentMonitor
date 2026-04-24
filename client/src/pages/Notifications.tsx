import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './FeaturePage.css';

interface User {
  id: number;
  email: string;
  name: string;
}

interface NotificationsProps {
  user: User;
  onLogout: () => void;
}

const Notifications: React.FC<NotificationsProps> = ({ user, onLogout }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/notifications?page=${page}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data.data);
      setTotalPages(response.data.totalPages);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = { alert: '🚨', warning: '⚠️', success: '✅', info: 'ℹ️' };
    return icons[type] || 'ℹ️';
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
          <span>Notifications</span>
        </div>

        <div className="page-header">
          <h1 className="page-title">
            <span className="page-title-icon">🔔</span>
            Notifications
          </h1>
          <button className="btn btn-secondary" onClick={markAllAsRead}>Mark All as Read</button>
        </div>

        {loading ? (
          <div className="loading-state"><div className="loading-spinner"></div></div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">🔔</span>
            <h2 className="empty-state-title">No Notifications</h2>
            <p className="empty-state-text">You are all caught up!</p>
          </div>
        ) : (
          <div className="card">
            {notifications.map((n) => (
              <div key={n.id} className={`notification-row ${!n.read ? 'unread' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                onClick={() => { markAsRead(n.id); if (n.link) navigate(n.link); }}>
                <span style={{ fontSize: '1.5rem' }}>{getTypeIcon(n.type)}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: n.read ? 400 : 600 }}>{n.title}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{n.message}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
                <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Notifications;
