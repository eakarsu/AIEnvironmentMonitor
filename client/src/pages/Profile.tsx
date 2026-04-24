import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './FeaturePage.css';

interface User {
  id: number;
  email: string;
  name: string;
}

interface ProfileProps {
  user: User;
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onLogout }) => {
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
      setName(response.data.name);
      setEmail(response.data.email);
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/profile', { name, email }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Profile updated successfully');
      setEditing(false);
      fetchProfile();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/profile/password', { currentPassword, newPassword }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Password changed successfully');
      setChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change password');
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
          <span>Profile</span>
        </div>

        <div className="page-header">
          <h1 className="page-title">
            <span className="page-title-icon">👤</span>
            User Profile
          </h1>
        </div>

        {message && <div className="badge badge-success" style={{ padding: '12px 16px', marginBottom: '20px', display: 'block' }}>{message}</div>}
        {error && <div className="badge badge-danger" style={{ padding: '12px 16px', marginBottom: '20px', display: 'block' }}>{error}</div>}

        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <h2 className="card-title">Profile Information</h2>
            {!editing && <button className="btn btn-primary btn-sm" onClick={() => setEditing(true)}>Edit Profile</button>}
          </div>

          {editing ? (
            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn btn-primary">Save Changes</button>
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </form>
          ) : profile ? (
            <div className="detail-grid">
              <div className="detail-item">
                <div className="detail-label">Name</div>
                <div className="detail-value">{profile.name}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Email</div>
                <div className="detail-value">{profile.email}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Role</div>
                <div className="detail-value"><span className="badge badge-info">{profile.role || 'user'}</span></div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Email Verified</div>
                <div className="detail-value">
                  <span className={`badge ${profile.email_verified ? 'badge-success' : 'badge-warning'}`}>
                    {profile.email_verified ? 'Verified' : 'Not Verified'}
                  </span>
                </div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Member Since</div>
                <div className="detail-value">{new Date(profile.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          ) : (
            <div className="loading-state"><div className="loading-spinner"></div></div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Security</h2>
            {!changingPassword && <button className="btn btn-secondary btn-sm" onClick={() => setChangingPassword(true)}>Change Password</button>}
          </div>

          {changingPassword ? (
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input className="form-input" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required minLength={6} />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input className="form-input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn btn-primary">Update Password</button>
                <button type="button" className="btn btn-secondary" onClick={() => setChangingPassword(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>Your password was last changed when it was created. Click "Change Password" to update it.</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;
