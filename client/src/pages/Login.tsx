import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';

interface LoginProps {
  onLogin: (user: any, token: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', { email, password });
      onLogin(response.data.user, response.data.token);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = async () => {
    try {
      const response = await axios.get('/api/auth/demo');
      setEmail(response.data.email);
      setPassword(response.data.password);
    } catch {
      setEmail('demo@example.com');
      setPassword('password123');
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-bg-gradient"></div>
        <div className="login-bg-pattern"></div>
      </div>

      <div className="login-content">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <span className="login-logo-icon">🌍</span>
              <span className="login-logo-text">AI Environment Monitor</span>
            </div>
            <p className="login-subtitle">Monitor and analyze environmental data with AI</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="login-error">
                <span>⚠️</span> {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="btn-spinner"></span>
                  Signing In...
                </>
              ) : (
                <>
                  <span>🔐</span>
                  Sign In
                </>
              )}
            </button>

            <button
              type="button"
              className="btn btn-secondary login-demo-btn"
              onClick={fillDemoCredentials}
            >
              <span>✨</span>
              Fill Demo Credentials
            </button>

            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <a href="/forgot-password" style={{ color: 'var(--accent-primary)', fontSize: '0.9rem' }}>Forgot Password?</a>
            </div>
          </form>

          <div className="login-features">
            <h3>Features</h3>
            <div className="login-features-grid">
              <div className="login-feature">
                <span className="login-feature-icon">🌤️</span>
                <span>Weather Impact</span>
              </div>
              <div className="login-feature">
                <span className="login-feature-icon">🏭</span>
                <span>Carbon Footprint</span>
              </div>
              <div className="login-feature">
                <span className="login-feature-icon">♻️</span>
                <span>Recycling Sorter</span>
              </div>
              <div className="login-feature">
                <span className="login-feature-icon">⚡</span>
                <span>Energy Optimizer</span>
              </div>
              <div className="login-feature">
                <span className="login-feature-icon">💧</span>
                <span>Water Quality</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
