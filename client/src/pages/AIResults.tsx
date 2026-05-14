import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './FeaturePage.css';

interface User {
  id: number;
  email: string;
  name: string;
}

interface AIResultsProps {
  user: User;
  onLogout: () => void;
}

interface AIResultRow {
  id: number;
  analysis_type: string;
  domain: string | null;
  entity_id: string | null;
  result: any;
  model_used: string;
  confidence: number | null;
  created_at: string;
}

const AIResults: React.FC<AIResultsProps> = ({ user, onLogout }) => {
  const [results, setResults] = useState<AIResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [analysisType, setAnalysisType] = useState<string>('');
  const [domain, setDomain] = useState<string>('');
  const [selected, setSelected] = useState<AIResultRow | null>(null);

  useEffect(() => {
    fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, analysisType, domain]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
      });
      if (analysisType) params.append('analysis_type', analysisType);
      if (domain) params.append('domain', domain);

      const response = await axios.get(`/api/ai/results?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResults(response.data.data || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Error fetching AI results:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderResultPreview = (result: any) => {
    if (!result) return 'No result';
    if (typeof result === 'string') return result.substring(0, 200);
    if (result.analysis) {
      const a = typeof result.analysis === 'string' ? result.analysis : JSON.stringify(result.analysis);
      return a.substring(0, 200);
    }
    return JSON.stringify(result).substring(0, 200);
  };

  return (
    <div className="feature-page">
      <header className="feature-header">
        <div className="header-left">
          <Link to="/dashboard" className="back-link">← Back to Dashboard</Link>
          <h1>AI Results History</h1>
        </div>
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </header>

      <div className="feature-content">
        <div className="filters" style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <select
            value={analysisType}
            onChange={(e) => { setAnalysisType(e.target.value); setPage(1); }}
            className="form-input"
          >
            <option value="">All Analysis Types</option>
            <option value="trend-forecast">Trend Forecast</option>
            <option value="weekly-digest">Weekly Digest</option>
            <option value="community-benchmark">Community Benchmark</option>
          </select>

          <select
            value={domain}
            onChange={(e) => { setDomain(e.target.value); setPage(1); }}
            className="form-input"
          >
            <option value="">All Domains</option>
            <option value="weather">Weather</option>
            <option value="carbon">Carbon</option>
            <option value="energy">Energy</option>
            <option value="water">Water</option>
            <option value="recycling">Recycling</option>
            <option value="all">Cross-domain</option>
          </select>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : results.length === 0 ? (
          <p>No AI results yet. Generate analysis on any feature page.</p>
        ) : (
          <div className="results-list">
            {results.map((row) => (
              <div
                key={row.id}
                className="result-card"
                style={{
                  border: '1px solid var(--border-color, #444)',
                  padding: 15,
                  marginBottom: 12,
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
                onClick={() => setSelected(row)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{row.analysis_type}</strong>
                  <span>{new Date(row.created_at).toLocaleString()}</span>
                </div>
                {row.domain && <div>Domain: {row.domain}</div>}
                {row.confidence !== null && <div>Confidence: {row.confidence}</div>}
                <p>{renderResultPreview(row.result)}{(JSON.stringify(row.result).length > 200) ? '…' : ''}</p>
              </div>
            ))}
          </div>
        )}

        <div className="pagination" style={{ display: 'flex', gap: 10, marginTop: 20, alignItems: 'center' }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
            Next
          </button>
        </div>

        {selected && (
          <div
            className="modal-overlay"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setSelected(null)}
          >
            <div
              style={{
                background: 'var(--card-bg, #222)',
                color: 'var(--text-color, #fff)',
                padding: 20,
                borderRadius: 8,
                maxWidth: 800,
                maxHeight: '80vh',
                overflow: 'auto',
                width: '90%',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>{selected.analysis_type}</h3>
              <p>Generated: {new Date(selected.created_at).toLocaleString()}</p>
              {selected.domain && <p>Domain: {selected.domain}</p>}
              <p>Model: {selected.model_used}</p>
              {selected.confidence !== null && <p>Confidence: {selected.confidence}</p>}
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {JSON.stringify(selected.result, null, 2)}
              </pre>
              <button onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIResults;
