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

interface CarbonData {
  id: number;
  activity_name: string;
  category: string;
  emission_source: string;
  co2_kg: number;
  ch4_kg: number;
  n2o_kg: number;
  total_co2e: number;
  date: string;
  ai_analysis?: string;
  reduction_tips?: string;
  created_at: string;
}

interface CarbonFootprintProps {
  user: User;
  onLogout: () => void;
}

const CarbonFootprint: React.FC<CarbonFootprintProps> = ({ user, onLogout }) => {
  const [items, setItems] = useState<CarbonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<CarbonData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    activity_name: '',
    category: 'Transportation',
    emission_source: '',
    co2_kg: '',
    ch4_kg: '',
    n2o_kg: '',
    total_co2e: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await axios.get('/api/carbon');
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching carbon data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEditing && selectedItem) {
        await axios.put(`/api/carbon/${selectedItem.id}`, formData);
      } else {
        const createResponse = await axios.post('/api/carbon', formData);
        const newItem = createResponse.data;
        await axios.post(`/api/carbon/${newItem.id}/analyze`);
      }
      fetchItems();
      closeModal();
    } catch (error) {
      console.error('Error saving carbon data:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await axios.delete(`/api/carbon/${id}`);
        fetchItems();
        setShowDetailModal(false);
      } catch (error) {
        console.error('Error deleting carbon data:', error);
      }
    }
  };

  const openCreateModal = () => {
    setFormData({
      activity_name: '',
      category: 'Transportation',
      emission_source: '',
      co2_kg: '',
      ch4_kg: '',
      n2o_kg: '',
      total_co2e: '',
      date: new Date().toISOString().split('T')[0]
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = () => {
    if (selectedItem) {
      setFormData({
        activity_name: selectedItem.activity_name,
        category: selectedItem.category,
        emission_source: selectedItem.emission_source,
        co2_kg: String(selectedItem.co2_kg),
        ch4_kg: String(selectedItem.ch4_kg || ''),
        n2o_kg: String(selectedItem.n2o_kg || ''),
        total_co2e: String(selectedItem.total_co2e || ''),
        date: selectedItem.date?.split('T')[0] || ''
      });
      setIsEditing(true);
      setShowDetailModal(false);
      setShowModal(true);
    }
  };

  const openDetailModal = (item: CarbonData) => {
    setSelectedItem(item);
    if (item.ai_analysis) {
      let recs: string[] = [];
      try { recs = JSON.parse(item.reduction_tips || '[]'); } catch {}
      setAiAnalysis({ success: true, analysis: item.ai_analysis, recommendations: recs, confidence: 0.85 });
    } else {
      setAiAnalysis(null);
    }
    setShowDetailModal(true);
  };

  const loadSampleData = () => {
    setFormData({
      activity_name: 'Daily Commute',
      category: 'Transportation',
      emission_source: 'Gasoline Car',
      co2_kg: '8.5',
      ch4_kg: '0.012',
      n2o_kg: '0.001',
      total_co2e: '8.87',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const categories = ['Transportation', 'Energy', 'Food', 'Shopping', 'Home', 'Digital', 'Waste'];

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
          <span>Carbon Footprint Calculator</span>
        </div>

        <div className="page-header">
          <h1 className="page-title">
            <span className="page-title-icon">🏭</span>
            AI Carbon Footprint Calculator
          </h1>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <span>+</span> Add New Activity
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading carbon footprint data...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">🏭</span>
            <h2 className="empty-state-title">No Carbon Records Yet</h2>
            <p className="empty-state-text">Start tracking your carbon emissions</p>
            <button className="btn btn-primary" onClick={openCreateModal}>
              <span>+</span> Add First Activity
            </button>
          </div>
        ) : (
          <div className="card">
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Activity</th>
                    <th>Category</th>
                    <th>Source</th>
                    <th>CO2 (kg)</th>
                    <th>Total CO2e</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} onClick={() => openDetailModal(item)}>
                      <td><strong>{item.activity_name}</strong></td>
                      <td>{item.category}</td>
                      <td>{item.emission_source}</td>
                      <td className="number-cell">{item.co2_kg}</td>
                      <td className="number-cell"><strong>{item.total_co2e}</strong></td>
                      <td>{item.date ? new Date(item.date).toLocaleDateString() : '-'}</td>
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
              <h2 className="modal-title">{isEditing ? 'Edit Carbon Activity' : 'Add Carbon Activity'}</h2>
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
                    <label className="form-label">Activity Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.activity_name}
                      onChange={(e) => setFormData({ ...formData, activity_name: e.target.value })}
                      placeholder="e.g., Daily Commute"
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
                <div className="form-group">
                  <label className="form-label">Emission Source</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.emission_source}
                    onChange={(e) => setFormData({ ...formData, emission_source: e.target.value })}
                    placeholder="e.g., Gasoline Car"
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">CO2 (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={formData.co2_kg}
                      onChange={(e) => setFormData({ ...formData, co2_kg: e.target.value })}
                      placeholder="8.5"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CH4 (kg)</label>
                    <input
                      type="number"
                      step="0.0001"
                      className="form-input"
                      value={formData.ch4_kg}
                      onChange={(e) => setFormData({ ...formData, ch4_kg: e.target.value })}
                      placeholder="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">N2O (kg)</label>
                    <input
                      type="number"
                      step="0.0001"
                      className="form-input"
                      value={formData.n2o_kg}
                      onChange={(e) => setFormData({ ...formData, n2o_kg: e.target.value })}
                      placeholder="0.001"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Total CO2 Equivalent (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={formData.total_co2e}
                      onChange={(e) => setFormData({ ...formData, total_co2e: e.target.value })}
                      placeholder="8.8"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
              <h2 className="modal-title">Carbon Footprint Details</h2>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-label">Activity Name</div>
                  <div className="detail-value">{selectedItem.activity_name}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Category</div>
                  <div className="detail-value">{selectedItem.category}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Emission Source</div>
                  <div className="detail-value">{selectedItem.emission_source}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Date</div>
                  <div className="detail-value">{selectedItem.date ? new Date(selectedItem.date).toLocaleDateString() : '-'}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">CO2 Emissions</div>
                  <div className="detail-value">{selectedItem.co2_kg} kg</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">CH4 Emissions</div>
                  <div className="detail-value">{selectedItem.ch4_kg || 0} kg</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">N2O Emissions</div>
                  <div className="detail-value">{selectedItem.n2o_kg || 0} kg</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Total CO2 Equivalent</div>
                  <div className="detail-value" style={{ color: 'var(--accent-danger)' }}>{selectedItem.total_co2e} kg</div>
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

export default CarbonFootprint;
