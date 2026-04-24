import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AIAnalysisDisplay from '../components/AIAnalysisDisplay';
import Charts from '../components/Charts';
import './FeaturePage.css';

interface User {
  id: number;
  email: string;
  name: string;
}

interface WeatherData {
  id: number;
  crop_name: string;
  location: string;
  weather_condition: string;
  temperature: number;
  humidity: number;
  rainfall: number;
  impact_level: string;
  ai_analysis?: string;
  recommendations?: string;
  created_at: string;
}

interface WeatherImpactProps {
  user: User;
  onLogout: () => void;
}

const WeatherImpact: React.FC<WeatherImpactProps> = ({ user, onLogout }) => {
  const [items, setItems] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<WeatherData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    crop_name: '',
    location: '',
    weather_condition: '',
    temperature: '',
    humidity: '',
    rainfall: '',
    impact_level: 'Low'
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await axios.get('/api/weather');
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching weather data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEditing && selectedItem) {
        await axios.put(`/api/weather/${selectedItem.id}`, formData);
      } else {
        const createResponse = await axios.post('/api/weather', formData);
        const newItem = createResponse.data;
        await axios.post(`/api/weather/${newItem.id}/analyze`);
      }
      fetchItems();
      closeModal();
    } catch (error) {
      console.error('Error saving weather data:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await axios.delete(`/api/weather/${id}`);
        fetchItems();
        setShowDetailModal(false);
      } catch (error) {
        console.error('Error deleting weather data:', error);
      }
    }
  };

  const openCreateModal = () => {
    setFormData({
      crop_name: '',
      location: '',
      weather_condition: '',
      temperature: '',
      humidity: '',
      rainfall: '',
      impact_level: 'Low'
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = () => {
    if (selectedItem) {
      setFormData({
        crop_name: selectedItem.crop_name,
        location: selectedItem.location,
        weather_condition: selectedItem.weather_condition,
        temperature: String(selectedItem.temperature),
        humidity: String(selectedItem.humidity),
        rainfall: String(selectedItem.rainfall),
        impact_level: selectedItem.impact_level
      });
      setIsEditing(true);
      setShowDetailModal(false);
      setShowModal(true);
    }
  };

  const openDetailModal = (item: WeatherData) => {
    setSelectedItem(item);
    if (item.ai_analysis) {
      let recs: string[] = [];
      try { recs = JSON.parse(item.recommendations || '[]'); } catch {}
      setAiAnalysis({ success: true, analysis: item.ai_analysis, recommendations: recs, confidence: 0.85 });
    } else {
      setAiAnalysis(null);
    }
    setShowDetailModal(true);
  };

  const loadSampleData = () => {
    setFormData({
      crop_name: 'Wheat',
      location: 'Kansas, USA',
      weather_condition: 'Drought',
      temperature: '38.5',
      humidity: '25',
      rainfall: '2.3',
      impact_level: 'High'
    });
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      crop_name: '',
      location: '',
      weather_condition: '',
      temperature: '',
      humidity: '',
      rainfall: '',
      impact_level: 'Low'
    });
  };

  const handleExportCSV = async () => {
    try {
      const response = await axios.get('/api/export/weather?format=csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'weather_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getChartData = () => {
    return items.slice(0, 10).map(item => ({
      name: item.crop_name,
      temperature: Number(item.temperature),
      humidity: Number(item.humidity),
      rainfall: Number(item.rainfall),
    }));
  };

  const getImpactBadge = (level: string) => {
    const classes: Record<string, string> = {
      'Low': 'badge-success',
      'Medium': 'badge-warning',
      'High': 'badge-danger',
      'Critical': 'badge-critical'
    };
    return `badge ${classes[level] || 'badge-info'}`;
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
          <span>Weather Impact Analyzer</span>
        </div>

        <div className="page-header">
          <h1 className="page-title">
            <span className="page-title-icon">🌤️</span>
            AI Weather Impact Analyzer
          </h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="export-btn" onClick={handleExportCSV} aria-label="Export weather data as CSV">
              📥 Export CSV
            </button>
            <button className="btn btn-primary" onClick={openCreateModal}>
              <span>+</span> Add New Record
            </button>
          </div>
        </div>

        {items.length > 0 && (
          <Charts data={getChartData()} type="bar" dataKey="temperature" nameKey="name" title="Temperature by Crop (°C)" color="#4facfe" />
        )}

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading weather data...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">🌤️</span>
            <h2 className="empty-state-title">No Weather Records Yet</h2>
            <p className="empty-state-text">Start tracking weather impacts on crops</p>
            <button className="btn btn-primary" onClick={openCreateModal}>
              <span>+</span> Add First Record
            </button>
          </div>
        ) : (
          <div className="card">
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Crop</th>
                    <th>Location</th>
                    <th>Weather</th>
                    <th>Temperature</th>
                    <th>Humidity</th>
                    <th>Rainfall</th>
                    <th>Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} onClick={() => openDetailModal(item)}>
                      <td><strong>{item.crop_name}</strong></td>
                      <td>{item.location}</td>
                      <td>{item.weather_condition}</td>
                      <td>{item.temperature}°C</td>
                      <td>{item.humidity}%</td>
                      <td>{item.rainfall}mm</td>
                      <td><span className={getImpactBadge(item.impact_level)}>{item.impact_level}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{isEditing ? 'Edit Weather Record' : 'Add Weather Record'}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {!isEditing && (
                  <button type="button" className="btn btn-sm btn-success" onClick={loadSampleData}>
                    Load Sample
                  </button>
                )}
                <button className="modal-close" onClick={closeModal}>&times;</button>
              </div>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Crop Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.crop_name}
                      onChange={(e) => setFormData({ ...formData, crop_name: e.target.value })}
                      placeholder="e.g., Wheat, Corn, Rice"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Kansas, USA"
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Weather Condition</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.weather_condition}
                    onChange={(e) => setFormData({ ...formData, weather_condition: e.target.value })}
                    placeholder="e.g., Drought, Heavy Rain, Normal"
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Temperature (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-input"
                      value={formData.temperature}
                      onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                      placeholder="25.5"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Humidity (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-input"
                      value={formData.humidity}
                      onChange={(e) => setFormData({ ...formData, humidity: e.target.value })}
                      placeholder="65"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rainfall (mm)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-input"
                      value={formData.rainfall}
                      onChange={(e) => setFormData({ ...formData, rainfall: e.target.value })}
                      placeholder="50"
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Impact Level</label>
                  <select
                    className="form-select"
                    value={formData.impact_level}
                    onChange={(e) => setFormData({ ...formData, impact_level: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating & Analyzing...' : isEditing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Weather Impact Details</h2>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-label">Crop Name</div>
                  <div className="detail-value">{selectedItem.crop_name}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Location</div>
                  <div className="detail-value">{selectedItem.location}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Weather Condition</div>
                  <div className="detail-value">{selectedItem.weather_condition}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Impact Level</div>
                  <div className="detail-value">
                    <span className={getImpactBadge(selectedItem.impact_level)}>{selectedItem.impact_level}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Temperature</div>
                  <div className="detail-value">{selectedItem.temperature}°C</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Humidity</div>
                  <div className="detail-value">{selectedItem.humidity}%</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Rainfall</div>
                  <div className="detail-value">{selectedItem.rainfall}mm</div>
                </div>
              </div>

              <div className="detail-actions">
                <button className="btn btn-secondary" onClick={openEditModal}>
                  <span>✏️</span> Edit
                </button>
                <button className="btn btn-danger" onClick={() => handleDelete(selectedItem.id)}>
                  <span>🗑️</span> Delete
                </button>
              </div>

              <AIAnalysisDisplay
                analysis={aiAnalysis}
                loading={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherImpact;
