import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'request' | 'reset' | 'done'>('request');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('/api/auth/forgot-password', { email });
      if (response.data.token) {
        setToken(response.data.token);
      }
      setMessage('If this email exists, a reset link has been sent.');
      setStep('reset');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/auth/reset-password', { token, newPassword });
      setMessage('Password reset successfully! You can now login.');
      setStep('done');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
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
            <p className="login-subtitle">
              {step === 'done' ? 'Password Reset Complete' : step === 'reset' ? 'Enter New Password' : 'Reset Your Password'}
            </p>
          </div>

          {error && <div className="login-error"><span>⚠️</span> {error}</div>}
          {message && <div style={{ padding: '12px 16px', background: 'rgba(0, 217, 165, 0.1)', border: '1px solid rgba(0, 217, 165, 0.3)', borderRadius: '10px', color: 'var(--accent-success)', marginBottom: '20px', fontSize: '0.9rem' }}>{message}</div>}

          {step === 'request' && (
            <form onSubmit={handleRequestReset} className="login-form">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" placeholder="Enter your email" value={email}
                  onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="login-form">
              <div className="form-group">
                <label className="form-label">Reset Token</label>
                <input type="text" className="form-input" placeholder="Paste reset token" value={token}
                  onChange={(e) => setToken(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" className="form-input" placeholder="Enter new password" value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
              </div>
              <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Link to="/login" style={{ color: 'var(--accent-primary)' }}>Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
