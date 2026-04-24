import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './FeaturePage.css';

interface User {
  id: number;
  email: string;
  name: string;
}

interface SearchResultsProps {
  user: User;
  onLogout: () => void;
}

const typeRoutes: Record<string, string> = {
  weather: '/weather',
  carbon: '/carbon',
  recycling: '/recycling',
  energy: '/energy',
  water: '/water',
};

const typeIcons: Record<string, string> = {
  weather: '🌤️',
  carbon: '🏭',
  recycling: '♻️',
  energy: '⚡',
  water: '💧',
};

const SearchResults: React.FC<SearchResultsProps> = ({ user, onLogout }) => {
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setQuery(q);
    if (q) searchData(q);
  }, [searchParams]);

  const searchData = async (q: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/search?q=${encodeURIComponent(q)}`);
      setResults(response.data.results);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
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
          <span>Search Results</span>
        </div>

        <div className="page-header">
          <h1 className="page-title">
            <span className="page-title-icon">🔍</span>
            Search Results
          </h1>
        </div>

        <form onSubmit={handleSearch} style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input className="form-input" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search all environmental data..." style={{ flex: 1 }} />
            <button type="submit" className="btn btn-primary">Search</button>
          </div>
        </form>

        {loading ? (
          <div className="loading-state"><div className="loading-spinner"></div><p>Searching...</p></div>
        ) : results.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">🔍</span>
            <h2 className="empty-state-title">No Results Found</h2>
            <p className="empty-state-text">Try different search terms</p>
          </div>
        ) : (
          <div className="card">
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>Found {results.length} results for "{searchParams.get('q')}"</p>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={`${result.type}-${result.id}-${index}`}>
                      <td><span className="badge badge-info">{typeIcons[result.type]} {result.type}</span></td>
                      <td><strong>{result.name}</strong></td>
                      <td>{result.description}</td>
                      <td>
                        <Link to={typeRoutes[result.type]} className="btn btn-sm btn-primary">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SearchResults;
