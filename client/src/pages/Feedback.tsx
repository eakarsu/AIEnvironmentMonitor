import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './FeaturePage.css';

interface User {
  id: number;
  email: string;
  name: string;
}

interface FeedbackProps {
  user: User;
  onLogout: () => void;
}

const Feedback: React.FC<FeedbackProps> = ({ user, onLogout }) => {
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [category, setCategory] = useState('general');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const response = await axios.get('/api/feedback');
      setFeedbackList(response.data.data);
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
      await axios.post('/api/feedback', { rating, comment, category }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Thank you for your feedback!');
      setComment('');
      setRating(5);
      fetchFeedback();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const renderStars = (value: number, interactive = false) => {
    return (
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} style={{ cursor: interactive ? 'pointer' : 'default', fontSize: interactive ? '2rem' : '1rem',
            color: star <= (interactive ? (hoveredStar || rating) : value) ? '#ffc107' : 'var(--text-muted)' }}
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoveredStar(star)}
            onMouseLeave={() => interactive && setHoveredStar(0)}>
            ★
          </span>
        ))}
      </div>
    );
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
          <span>Feedback</span>
        </div>

        <div className="page-header">
          <h1 className="page-title">
            <span className="page-title-icon">💬</span>
            Feedback
          </h1>
        </div>

        {success && <div className="badge badge-success" style={{ padding: '12px 16px', marginBottom: '20px', display: 'block' }}>{success}</div>}

        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 className="card-title" style={{ marginBottom: '20px' }}>Share Your Feedback</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Rating</label>
              {renderStars(rating, true)}
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="general">General</option>
                <option value="feature">Feature</option>
                <option value="improvement">Improvement</option>
                <option value="design">Design</option>
                <option value="bug">Bug Report</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Comment</label>
              <textarea className="form-input" value={comment} onChange={(e) => setComment(e.target.value)}
                required placeholder="Tell us what you think..." rows={4} style={{ resize: 'vertical' }} />
            </div>
            <button type="submit" className="btn btn-primary">Submit Feedback</button>
          </form>
        </div>

        <div className="card">
          <h2 className="card-title" style={{ marginBottom: '16px' }}>Recent Feedback</h2>
          {loading ? (
            <div className="loading-state"><div className="loading-spinner"></div></div>
          ) : feedbackList.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No feedback yet. Be the first!</p>
          ) : (
            feedbackList.map((f) => (
              <div key={f.id} style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <strong>{f.user_name || 'Anonymous'}</strong>
                    {renderStars(f.rating)}
                    <span className="badge badge-info">{f.category}</span>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {new Date(f.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)' }}>{f.comment}</p>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Feedback;
