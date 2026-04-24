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

interface EnergyData {
  id: number;
  device_name: string;
  category: string;
  power_watts: number;
  usage_hours: number;
  daily_kwh: number;
  monthly_kwh: number;
  monthly_cost: number;
  efficiency_rating: string;
  ai_analysis?: string;
  optimization_tips?: string;
  created_at: string;
}

interface EnergyOptimizerProps {
  user: User;
  onLogout: () => void;
}

const EnergyOptimizer: React.FC<EnergyOptimizerProps> = ({ user, onLogout }) => {
  const [items, setItems] = useState<EnergyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<EnergyData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    device_name: '',
    category: 'HVAC',
    power_watts: '',
    usage_hours: '',
    daily_kwh: '',
    monthly_kwh: '',
    monthly_cost: '',
    efficiency_rating: 'B'
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await axios.get('/api/energy');
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching energy data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEditing && selectedItem) {
        await axios.put(`/api/energy/${selectedItem.id}`, formData);
      } else {
        const createResponse = await axios.post('/api/energy', formData);
        const newItem = createResponse.data;
        await axios.post(`/api/energy/${newItem.id}/analyze`);
      }
      fetchItems();
      closeModal();
    } catch (error) {
      console.error('Error saving energy data:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this device?')) {
      try {
        await axios.delete(`/api/energy/${id}`);
        fetchItems();
        setShowDetailModal(false);
      } catch (error) {
        console.error('Error deleting energy data:', error);
      }
    }
  };

  const openCreateModal = () => {
    setFormData({
      device_name: '',
      category: 'HVAC',
      power_watts: '',
      usage_hours: '',
      daily_kwh: '',
      monthly_kwh: '',
      monthly_cost: '',
      efficiency_rating: 'B'
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = () => {
    if (selectedItem) {
      setFormData({
        device_name: selectedItem.device_name,
        category: selectedItem.category,
        power_watts: String(selectedItem.power_watts),
        usage_hours: String(selectedItem.usage_hours),
        daily_kwh: String(selectedItem.daily_kwh),
        monthly_kwh: String(selectedItem.monthly_kwh),
        monthly_cost: String(selectedItem.monthly_cost),
        efficiency_rating: selectedItem.efficiency_rating
      });
      setIsEditing(true);
      setShowDetailModal(false);
      setShowModal(true);
    }
  };

  const openDetailModal = (item: EnergyData) => {
    setSelectedItem(item);
    if (item.ai_analysis) {
      let recs: string[] = [];
      try { recs = JSON.parse(item.optimization_tips || '[]'); } catch {}
      setAiAnalysis({ success: true, analysis: item.ai_analysis, recommendations: recs, confidence: 0.85 });
    } else {
      setAiAnalysis(null);
    }
    setShowDetailModal(true);
  };

  const loadSampleData = () => {
    setFormData({
      device_name: 'Central Air Conditioner',
      category: 'HVAC',
      power_watts: '3500',
      usage_hours: '8',
      daily_kwh: '28',
      monthly_kwh: '840',
      monthly_cost: '126.00',
      efficiency_rating: 'B'
    });
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const categories = ['HVAC', 'Kitchen', 'Laundry', 'Entertainment', 'Office', 'Personal', 'Outdoor', 'Smart Home', 'Transportation', 'Water Heating'];
  const ratings = ['A+', 'A', 'B', 'C', 'D'];

  const getRatingClass = (rating: string) => {
    const classes: Record<string, string> = {
      'A+': 'rating-a-plus',
      'A': 'rating-a',
      'B': 'rating-b',
      'C': 'rating-c',
      'D': 'rating-d'
    };
    return classes[rating] || '';
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
          <span>Energy Optimizer</span>
        </div>

        <div className="page-header">
          <h1 className="page-title">
            <span className="page-title-icon">⚡</span>
            AI Energy Usage Optimizer
          </h1>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <span>+</span> Add New Device
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading energy data...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">⚡</span>
            <h2 className="empty-state-title">No Energy Devices Yet</h2>
            <p className="empty-state-text">Start tracking your energy consumption</p>
            <button className="btn btn-primary" onClick={openCreateModal}>
              <span>+</span> Add First Device
            </button>
          </div>
        ) : (
          <div className="card">
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Device</th>
                    <th>Category</th>
                    <th>Power (W)</th>
                    <th>Daily kWh</th>
                    <th>Monthly kWh</th>
                    <th>Monthly Cost</th>
                    <th>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} onClick={() => openDetailModal(item)}>
                      <td><strong>{item.device_name}</strong></td>
                      <td>{item.category}</td>
                      <td className="number-cell">{item.power_watts}</td>
                      <td className="number-cell">{item.daily_kwh}</td>
                      <td className="number-cell">{item.monthly_kwh}</td>
                      <td className="number-cell">${item.monthly_cost}</td>
                      <td>
                        <strong className={getRatingClass(item.efficiency_rating)}>
                          {item.efficiency_rating}
                        </strong>
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
              <h2 className="modal-title">{isEditing ? 'Edit Device' : 'Add Device'}</h2>
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
                    <label className="form-label">Device Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.device_name}
                      onChange={(e) => setFormData({ ...formData, device_name: e.target.value })}
                      placeholder="e.g., Central Air Conditioner"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Power (Watts)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={formData.power_watts}
                      onChange={(e) => setFormData({ ...formData, power_watts: e.target.value })}
                      placeholder="3500"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Usage Hours/Day</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-input"
                      value={formData.usage_hours}
                      onChange={(e) => setFormData({ ...formData, usage_hours: e.target.value })}
                      placeholder="8"
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Daily kWh</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={formData.daily_kwh}
                      onChange={(e) => setFormData({ ...formData, daily_kwh: e.target.value })}
                      placeholder="28"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Monthly kWh</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={formData.monthly_kwh}
                      onChange={(e) => setFormData({ ...formData, monthly_kwh: e.target.value })}
                      placeholder="840"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Monthly Cost ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={formData.monthly_cost}
                      onChange={(e) => setFormData({ ...formData, monthly_cost: e.target.value })}
                      placeholder="126.00"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Efficiency Rating</label>
                    <select
                      className="form-select"
                      value={formData.efficiency_rating}
                      onChange={(e) => setFormData({ ...formData, efficiency_rating: e.target.value })}
                    >
                      {ratings.map(rating => (
                        <option key={rating} value={rating}>{rating}</option>
                      ))}
                    </select>
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
              <h2 className="modal-title">Energy Usage Details</h2>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-label">Device Name</div>
                  <div className="detail-value">{selectedItem.device_name}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Category</div>
                  <div className="detail-value">{selectedItem.category}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Power Consumption</div>
                  <div className="detail-value">{selectedItem.power_watts} W</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Daily Usage</div>
                  <div className="detail-value">{selectedItem.usage_hours} hours</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Daily Energy</div>
                  <div className="detail-value">{selectedItem.daily_kwh} kWh</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Monthly Energy</div>
                  <div className="detail-value">{selectedItem.monthly_kwh} kWh</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Monthly Cost</div>
                  <div className="detail-value" style={{ color: 'var(--accent-warning)' }}>${selectedItem.monthly_cost}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Efficiency Rating</div>
                  <div className="detail-value">
                    <strong className={getRatingClass(selectedItem.efficiency_rating)}>
                      {selectedItem.efficiency_rating}
                    </strong>
                  </div>
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

export default EnergyOptimizer;
