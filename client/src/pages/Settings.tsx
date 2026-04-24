import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './FeaturePage.css';

interface User {
  id: number;
  email: string;
  name: string;
}

interface SettingsProps {
  user: User;
  onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onLogout }) => {
  const [settings, setSettings] = useState({
    theme: 'dark',
    notifications_enabled: true,
    email_notifications: true,
    language: 'en',
    data_sharing: false,
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(response.data);
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/settings', settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Apply theme
      document.documentElement.setAttribute('data-theme', settings.theme);
      localStorage.setItem('theme', settings.theme);
      setMessage('Settings saved successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  };

  const toggleTheme = () => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    setSettings({ ...settings, theme: newTheme });
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
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
          <span>Settings</span>
        </div>

        <div className="page-header">
          <h1 className="page-title">
            <span className="page-title-icon">⚙️</span>
            Settings
          </h1>
          <button className="btn btn-primary" onClick={handleSave}>Save Settings</button>
        </div>

        {message && <div className="badge badge-success" style={{ padding: '12px 16px', marginBottom: '20px', display: 'block' }}>{message}</div>}

        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 className="card-title" style={{ marginBottom: '20px' }}>Appearance</h2>
          <div className="form-group">
            <label className="form-label">Theme</label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button className={`btn ${settings.theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSettings({ ...settings, theme: 'dark' })}>
                🌙 Dark
              </button>
              <button className={`btn ${settings.theme === 'light' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSettings({ ...settings, theme: 'light' })}>
                ☀️ Light
              </button>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 className="card-title" style={{ marginBottom: '20px' }}>Notifications</h2>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: 'var(--text-primary)' }}>
              <input type="checkbox" checked={settings.notifications_enabled}
                onChange={(e) => setSettings({ ...settings, notifications_enabled: e.target.checked })} />
              Enable push notifications
            </label>
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: 'var(--text-primary)' }}>
              <input type="checkbox" checked={settings.email_notifications}
                onChange={(e) => setSettings({ ...settings, email_notifications: e.target.checked })} />
              Enable email notifications
            </label>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 className="card-title" style={{ marginBottom: '20px' }}>Language</h2>
          <div className="form-group">
            <select className="form-select" value={settings.language}
              onChange={(e) => setSettings({ ...settings, language: e.target.value })}>
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title" style={{ marginBottom: '20px' }}>Privacy</h2>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: 'var(--text-primary)' }}>
              <input type="checkbox" checked={settings.data_sharing}
                onChange={(e) => setSettings({ ...settings, data_sharing: e.target.checked })} />
              Allow anonymous data sharing for research
            </label>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <Link to="/privacy" className="btn btn-secondary btn-sm">Privacy Policy</Link>
            <Link to="/terms" className="btn btn-secondary btn-sm">Terms of Service</Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
