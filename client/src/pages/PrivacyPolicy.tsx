import React from 'react';
import { Link } from 'react-router-dom';
import './FeaturePage.css';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="feature-page">
      <header className="nav-header">
        <div className="nav-logo">
          <span className="nav-logo-icon">🌍</span>
          <span>AI Environment Monitor</span>
        </div>
      </header>

      <main className="page-container" style={{ maxWidth: '800px' }}>
        <div className="breadcrumb">
          <Link to="/dashboard">Dashboard</Link>
          <span>/</span>
          <span>Privacy Policy</span>
        </div>

        <h1 className="page-title" style={{ marginBottom: '30px' }}>
          <span className="page-title-icon">🔒</span>
          Privacy Policy
        </h1>

        <div className="card" style={{ lineHeight: '1.8', color: 'var(--text-secondary)' }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>1. Information We Collect</h2>
          <p style={{ marginBottom: '20px' }}>We collect information you provide directly, including your name, email address, and environmental data you input into the platform. We also collect usage data such as login times and feature usage patterns.</p>

          <h2 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>2. How We Use Your Information</h2>
          <p style={{ marginBottom: '20px' }}>Your information is used to provide and improve our environmental monitoring services, generate AI-powered analysis and recommendations, and communicate important updates about the platform.</p>

          <h2 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>3. Data Security</h2>
          <p style={{ marginBottom: '20px' }}>We implement industry-standard security measures including encryption in transit (HTTPS), secure password hashing (bcrypt), JWT-based authentication, and rate limiting to protect your data.</p>

          <h2 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>4. AI Analysis</h2>
          <p style={{ marginBottom: '20px' }}>Environmental data you submit may be processed by our AI analysis service to generate insights and recommendations. This data is processed securely and is not shared with third parties.</p>

          <h2 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>5. Data Retention</h2>
          <p style={{ marginBottom: '20px' }}>Your data is retained as long as your account is active. You may request deletion of your account and associated data at any time through the Contact & Support page.</p>

          <h2 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>6. Your Rights</h2>
          <p style={{ marginBottom: '20px' }}>You have the right to access, correct, export, and delete your personal data. You can manage your data preferences in the Settings page.</p>

          <h2 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>7. Contact Us</h2>
          <p>If you have questions about this privacy policy, please contact us through the <Link to="/contact">Support</Link> page.</p>

          <p style={{ marginTop: '30px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Last updated: January 2024</p>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
