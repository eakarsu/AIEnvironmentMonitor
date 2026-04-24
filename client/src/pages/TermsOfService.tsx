import React from 'react';
import { Link } from 'react-router-dom';
import './FeaturePage.css';

const TermsOfService: React.FC = () => {
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
          <span>Terms of Service</span>
        </div>

        <h1 className="page-title" style={{ marginBottom: '30px' }}>
          <span className="page-title-icon">📜</span>
          Terms of Service
        </h1>

        <div className="card" style={{ lineHeight: '1.8', color: 'var(--text-secondary)' }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>1. Acceptance of Terms</h2>
          <p style={{ marginBottom: '20px' }}>By accessing and using the AI Environment Monitor platform, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>

          <h2 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>2. Use of Service</h2>
          <p style={{ marginBottom: '20px' }}>The AI Environment Monitor is provided for environmental data tracking, analysis, and educational purposes. You agree to use the service responsibly and not to misuse or abuse the platform.</p>

          <h2 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>3. User Accounts</h2>
          <p style={{ marginBottom: '20px' }}>You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.</p>

          <h2 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>4. Data Accuracy</h2>
          <p style={{ marginBottom: '20px' }}>While we strive to provide accurate AI analysis and recommendations, the platform is for informational purposes only. Environmental data and AI insights should not be the sole basis for critical decisions.</p>

          <h2 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>5. Intellectual Property</h2>
          <p style={{ marginBottom: '20px' }}>The AI Environment Monitor platform, including its design, features, and content, is protected by intellectual property laws. Your environmental data remains yours.</p>

          <h2 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>6. Limitation of Liability</h2>
          <p style={{ marginBottom: '20px' }}>The service is provided "as is" without warranties. We are not liable for any damages arising from the use of AI analysis or environmental data presented on the platform.</p>

          <h2 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>7. Changes to Terms</h2>
          <p>We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the updated terms.</p>

          <p style={{ marginTop: '30px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Last updated: January 2024</p>
        </div>
      </main>
    </div>
  );
};

export default TermsOfService;
