import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AIAnalysisDisplay from '../components/AIAnalysisDisplay';
import './FeaturePage.css';

interface User {
  id: number;
  email: string;
  name: string;
}

interface WaterData {
  id: number;
  source_name: string;
  location: string;
  sample_date: string;
  ph_level: number;
  turbidity: number;
  dissolved_oxygen: number;
  nitrate_level: number;
  lead_level: number;
  bacteria_count: number;
  quality_index: string;
  ai_analysis?: string;
  treatment_recommendations?: string;
  created_at: string;
}

interface WaterQualityProps {
  user: User;
  onLogout: () => void;
}

const WaterQuality: React.FC<WaterQualityProps> = ({ user, onLogout }) => {
  const [items, setItems] = useState<WaterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<WaterData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    source_name: '',
    location: '',
    sample_date: new Date().toISOString().split('T')[0],
    ph_level: '',
    turbidity: '',
    dissolved_oxygen: '',
    nitrate_level: '',
    lead_level: '',
    bacteria_count: '',
    quality_index: 'Good'
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await axios.get('/api/water');
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching water data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEditing && selectedItem) {
        await axios.put(`/api/water/${selectedItem.id}`, formData);
      } else {
        const createResponse = await axios.post('/api/water', formData);
        const newItem = createResponse.data;
        await axios.post(`/api/water/${newItem.id}/analyze`);
      }
      fetchItems();
      closeModal();
    } catch (error) {
      console.error('Error saving water data:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await axios.delete(`/api/water/${id}`);
        fetchItems();
        setShowDetailModal(false);
      } catch (error) {
        console.error('Error deleting water data:', error);
      }
    }
  };

  const openCreateModal = () => {
    setFormData({
      source_name: '',
      location: '',
      sample_date: new Date().toISOString().split('T')[0],
      ph_level: '',
      turbidity: '',
      dissolved_oxygen: '',
      nitrate_level: '',
      lead_level: '',
      bacteria_count: '',
      quality_index: 'Good'
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = () => {
    if (selectedItem) {
      setFormData({
        source_name: selectedItem.source_name,
        location: selectedItem.location,
        sample_date: selectedItem.sample_date?.split('T')[0] || '',
        ph_level: String(selectedItem.ph_level),
        turbidity: String(selectedItem.turbidity),
        dissolved_oxygen: String(selectedItem.dissolved_oxygen),
        nitrate_level: String(selectedItem.nitrate_level),
        lead_level: String(selectedItem.lead_level),
        bacteria_count: String(selectedItem.bacteria_count),
        quality_index: selectedItem.quality_index
      });
      setIsEditing(true);
      setShowDetailModal(false);
      setShowModal(true);
    }
  };

  const openDetailModal = (item: WaterData) => {
    setSelectedItem(item);
    if (item.ai_analysis) {
      let recs: string[] = [];
      try { recs = JSON.parse(item.treatment_recommendations || '[]'); } catch {}
      setAiAnalysis({ success: true, analysis: item.ai_analysis, recommendations: recs, confidence: 0.85 });
    } else {
      setAiAnalysis(null);
    }
    setShowDetailModal(true);
  };

  const loadSampleData = () => {
    setFormData({
      source_name: 'City Municipal Supply',
      location: 'Downtown Station',
      sample_date: new Date().toISOString().split('T')[0],
      ph_level: '7.2',
      turbidity: '0.45',
      dissolved_oxygen: '8.5',
      nitrate_level: '3.2',
      lead_level: '0.001',
      bacteria_count: '0',
      quality_index: 'Good'
    });
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const qualityLevels = ['Excellent', 'Good', 'Fair', 'Poor', 'Critical'];

  const getQualityBadge = (level: string) => {
    const classes: Record<string, string> = {
      'Excellent': 'badge-success',
      'Good': 'badge-info',
      'Fair': 'badge-warning',
      'Poor': 'badge-danger',
      'Critical': 'badge-critical'
    };
    return `badge ${classes[level] || 'badge-info'}`;
  };

  const getQualityClass = (level: string) => {
    const classes: Record<string, string> = {
      'Excellent': 'quality-excellent',
      'Good': 'quality-good',
      'Fair': 'quality-fair',
      'Poor': 'quality-poor',
      'Critical': 'quality-critical'
    };
    return classes[level] || '';
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
          <span>Water Quality Monitor</span>
        </div>

        <div className="page-header">
          <h1 className="page-title">
            <span className="page-title-icon">💧</span>
            AI Water Quality Monitor
          </h1>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <span>+</span> Add New Sample
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading water quality data...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">💧</span>
            <h2 className="empty-state-title">No Water Samples Yet</h2>
            <p className="empty-state-text">Start monitoring water quality</p>
            <button className="btn btn-primary" onClick={openCreateModal}>
              <span>+</span> Add First Sample
            </button>
          </div>
        ) : (
          <div className="card">
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Location</th>
                    <th>pH</th>
                    <th>Turbidity</th>
                    <th>Lead (mg/L)</th>
                    <th>Bacteria</th>
                    <th>Quality</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} onClick={() => openDetailModal(item)}>
                      <td><strong>{item.source_name}</strong></td>
                      <td>{item.location}</td>
                      <td className="number-cell">{item.ph_level}</td>
                      <td className="number-cell">{item.turbidity} NTU</td>
                      <td className="number-cell">{item.lead_level}</td>
                      <td className="number-cell">{item.bacteria_count} CFU</td>
                      <td>
                        <span className={getQualityBadge(item.quality_index)}>{item.quality_index}</span>
                      </td>
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
              <h2 className="modal-title">{isEditing ? 'Edit Water Sample' : 'Add Water Sample'}</h2>
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
                    <label className="form-label">Source Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.source_name}
                      onChange={(e) => setFormData({ ...formData, source_name: e.target.value })}
                      placeholder="e.g., City Municipal Supply"
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
                      placeholder="e.g., Downtown Station"
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Sample Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.sample_date}
                      onChange={(e) => setFormData({ ...formData, sample_date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Quality Index</label>
                    <select
                      className="form-select"
                      value={formData.quality_index}
                      onChange={(e) => setFormData({ ...formData, quality_index: e.target.value })}
                    >
                      {qualityLevels.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">pH Level</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={formData.ph_level}
                      onChange={(e) => setFormData({ ...formData, ph_level: e.target.value })}
                      placeholder="7.0"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Turbidity (NTU)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={formData.turbidity}
                      onChange={(e) => setFormData({ ...formData, turbidity: e.target.value })}
                      placeholder="0.5"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Dissolved Oxygen (mg/L)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={formData.dissolved_oxygen}
                      onChange={(e) => setFormData({ ...formData, dissolved_oxygen: e.target.value })}
                      placeholder="8.5"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Nitrate Level (mg/L)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={formData.nitrate_level}
                      onChange={(e) => setFormData({ ...formData, nitrate_level: e.target.value })}
                      placeholder="3.2"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Lead Level (mg/L)</label>
                    <input
                      type="number"
                      step="0.0001"
                      className="form-input"
                      value={formData.lead_level}
                      onChange={(e) => setFormData({ ...formData, lead_level: e.target.value })}
                      placeholder="0.001"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bacteria Count (CFU/100mL)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.bacteria_count}
                      onChange={(e) => setFormData({ ...formData, bacteria_count: e.target.value })}
                      placeholder="0"
                    />
                  </div>
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
              <h2 className="modal-title">Water Quality Details</h2>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-label">Source Name</div>
                  <div className="detail-value">{selectedItem.source_name}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Location</div>
                  <div className="detail-value">{selectedItem.location}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Sample Date</div>
                  <div className="detail-value">{selectedItem.sample_date ? new Date(selectedItem.sample_date).toLocaleDateString() : '-'}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Quality Index</div>
                  <div className="detail-value">
                    <span className={getQualityBadge(selectedItem.quality_index)}>{selectedItem.quality_index}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">pH Level</div>
                  <div className="detail-value">{selectedItem.ph_level}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Turbidity</div>
                  <div className="detail-value">{selectedItem.turbidity} NTU</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Dissolved Oxygen</div>
                  <div className="detail-value">{selectedItem.dissolved_oxygen} mg/L</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Nitrate Level</div>
                  <div className="detail-value">{selectedItem.nitrate_level} mg/L</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Lead Level</div>
                  <div className="detail-value" style={{ color: selectedItem.lead_level > 0.01 ? 'var(--accent-danger)' : 'inherit' }}>
                    {selectedItem.lead_level} mg/L
                  </div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Bacteria Count</div>
                  <div className="detail-value">{selectedItem.bacteria_count} CFU/100mL</div>
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

export default WaterQuality;
