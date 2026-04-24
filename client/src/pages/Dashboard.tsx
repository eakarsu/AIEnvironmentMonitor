import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

interface User {
  id: number;
  email: string;
  name: string;
  role?: string;
}

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const features = [
    {
      id: 'weather',
      title: 'AI Weather Impact Analyzer',
      description: 'Analyze weather effects on crops and agriculture with AI-powered insights',
      icon: '🌤️',
      path: '/weather',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      stats: 'Crop Weather Effects'
    },
    {
      id: 'carbon',
      title: 'AI Carbon Footprint Calculator',
      description: 'Track and analyze carbon emissions with intelligent recommendations',
      icon: '🏭',
      path: '/carbon',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      stats: 'Emissions Tracking'
    },
    {
      id: 'recycling',
      title: 'AI Recycling Sorter',
      description: 'Smart waste categorization and recycling guidance powered by AI',
      icon: '♻️',
      path: '/recycling',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      stats: 'Waste Categorization'
    },
    {
      id: 'energy',
      title: 'AI Energy Usage Optimizer',
      description: 'Optimize home energy consumption with intelligent analysis',
      icon: '⚡',
      path: '/energy',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      stats: 'Home Energy Savings'
    },
    {
      id: 'water',
      title: 'AI Water Quality Monitor',
      description: 'Detect contamination and monitor water quality with AI analysis',
      icon: '💧',
      path: '/water',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      stats: 'Contamination Detection'
    },
  ];

  const utilityFeatures = [
    { id: 'profile', title: 'User Profile', description: 'Manage your account and personal info', icon: '👤', path: '/profile', gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
    { id: 'settings', title: 'Settings', description: 'Theme, notifications, and preferences', icon: '⚙️', path: '/settings', gradient: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)' },
    { id: 'notifications', title: 'Notifications', description: 'View alerts and system notifications', icon: '🔔', path: '/notifications', gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)' },
    { id: 'search', title: 'Global Search', description: 'Search across all environmental data', icon: '🔍', path: '/search', gradient: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)' },
    { id: 'feedback', title: 'Feedback', description: 'Share your experience and suggestions', icon: '💬', path: '/feedback', gradient: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)' },
    { id: 'contact', title: 'Contact & Support', description: 'Get help and submit support tickets', icon: '📧', path: '/contact', gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  ];

  return (
    <div className="dashboard">
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
          <button className="btn-logout" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="page-container" id="main-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Welcome back, {user.name}!</h1>
          <p className="dashboard-subtitle">
            Select a feature to start monitoring and analyzing environmental data with AI
          </p>
        </div>

        <div className="feature-grid">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="feature-card"
              onClick={() => navigate(feature.path)}
              role="button"
              tabIndex={0}
              aria-label={`Open ${feature.title}`}
              onKeyDown={(e) => e.key === 'Enter' && navigate(feature.path)}
            >
              <div className="feature-card-bg" style={{ background: feature.gradient }}></div>
              <div className="feature-card-content">
                <div className="feature-icon-wrapper" style={{ background: feature.gradient }}>
                  <span className="feature-icon">{feature.icon}</span>
                </div>
                <h2 className="feature-title">{feature.title}</h2>
                <p className="feature-description">{feature.description}</p>
                <div className="feature-stats">
                  <span className="feature-stats-badge">{feature.stats}</span>
                </div>
                <div className="feature-action">
                  <span>Open Dashboard</span>
                  <span className="feature-arrow">→</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <h2 style={{ marginBottom: '20px', color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Tools & Settings</h2>
        <div className="utility-grid">
          {utilityFeatures.map((feature) => (
            <div
              key={feature.id}
              className="utility-card"
              onClick={() => navigate(feature.path)}
              role="button"
              tabIndex={0}
              aria-label={`Open ${feature.title}`}
              onKeyDown={(e) => e.key === 'Enter' && navigate(feature.path)}
            >
              <div className="utility-icon" style={{ background: feature.gradient }}>{feature.icon}</div>
              <div>
                <div className="utility-title">{feature.title}</div>
                <div className="utility-description">{feature.description}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="dashboard-info">
          <div className="info-card">
            <div className="info-icon">🤖</div>
            <h3>AI-Powered Analysis</h3>
            <p>Get intelligent insights and recommendations using Claude Haiku 4.5 via OpenRouter</p>
          </div>
          <div className="info-card">
            <div className="info-icon">📊</div>
            <h3>Real-Time Data</h3>
            <p>Track and monitor environmental metrics with up-to-date information</p>
          </div>
          <div className="info-card">
            <div className="info-icon">🎯</div>
            <h3>Actionable Insights</h3>
            <p>Receive specific recommendations to improve your environmental impact</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
