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

interface RecyclingData {
  id: number;
  item_name: string;
  material_type: string;
  category: string;
  recyclable: boolean;
  special_instructions: string;
  environmental_impact: string;
  ai_analysis?: string;
  disposal_method?: string;
  created_at: string;
}

interface RecyclingSorterProps {
  user: User;
  onLogout: () => void;
}

const RecyclingSorter: React.FC<RecyclingSorterProps> = ({ user, onLogout }) => {
  const [items, setItems] = useState<RecyclingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<RecyclingData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    item_name: '',
    material_type: '',
    category: 'Plastic',
    recyclable: true,
    special_instructions: '',
    environmental_impact: 'Medium'
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await axios.get('/api/recycling');
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching recycling data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEditing && selectedItem) {
        await axios.put(`/api/recycling/${selectedItem.id}`, formData);
      } else {
        const createResponse = await axios.post('/api/recycling', formData);
        const newItem = createResponse.data;
        await axios.post(`/api/recycling/${newItem.id}/analyze`);
      }
      fetchItems();
      closeModal();
    } catch (error) {
      console.error('Error saving recycling data:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await axios.delete(`/api/recycling/${id}`);
        fetchItems();
        setShowDetailModal(false);
      } catch (error) {
        console.error('Error deleting recycling data:', error);
      }
    }
  };

  const openCreateModal = () => {
    setFormData({
      item_name: '',
      material_type: '',
      category: 'Plastic',
      recyclable: true,
      special_instructions: '',
      environmental_impact: 'Medium'
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = () => {
    if (selectedItem) {
      setFormData({
        item_name: selectedItem.item_name,
        material_type: selectedItem.material_type,
        category: selectedItem.category,
        recyclable: selectedItem.recyclable,
        special_instructions: selectedItem.special_instructions || '',
        environmental_impact: selectedItem.environmental_impact
      });
      setIsEditing(true);
      setShowDetailModal(false);
      setShowModal(true);
    }
  };

  const openDetailModal = (item: RecyclingData) => {
    setSelectedItem(item);
    if (item.ai_analysis) {
      let recs: string[] = [];
      try { recs = JSON.parse(item.disposal_method || '[]'); } catch {}
      setAiAnalysis({ success: true, analysis: item.ai_analysis, recommendations: recs, confidence: 0.85 });
    } else {
      setAiAnalysis(null);
    }
    setShowDetailModal(true);
  };

  const loadSampleData = () => {
    setFormData({
      item_name: 'Plastic Water Bottle',
      material_type: 'PET Plastic #1',
      category: 'Plastic',
      recyclable: true,
      special_instructions: 'Remove cap and label, rinse clean before recycling',
      environmental_impact: 'Medium'
    });
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const categories = ['Plastic', 'Metal', 'Paper', 'Glass', 'Organic', 'Hazardous', 'E-Waste'];
  const impactLevels = ['Low', 'Medium', 'High', 'Critical'];

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
          <span>Recycling Sorter</span>
        </div>

        <div className="page-header">
          <h1 className="page-title">
            <span className="page-title-icon">♻️</span>
            AI Recycling Sorter
          </h1>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <span>+</span> Add New Item
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading recycling data...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">♻️</span>
            <h2 className="empty-state-title">No Recycling Items Yet</h2>
            <p className="empty-state-text">Start categorizing your waste items</p>
            <button className="btn btn-primary" onClick={openCreateModal}>
              <span>+</span> Add First Item
            </button>
          </div>
        ) : (
          <div className="card">
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Material</th>
                    <th>Category</th>
                    <th>Recyclable</th>
                    <th>Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} onClick={() => openDetailModal(item)}>
                      <td><strong>{item.item_name}</strong></td>
                      <td>{item.material_type}</td>
                      <td>{item.category}</td>
                      <td>
                        <span className={item.recyclable ? 'recyclable-yes' : 'recyclable-no'}>
                          {item.recyclable ? '✓ Yes' : '✗ No'}
                        </span>
                      </td>
                      <td><span className={getImpactBadge(item.environmental_impact)}>{item.environmental_impact}</span></td>
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
              <h2 className="modal-title">{isEditing ? 'Edit Recycling Item' : 'Add Recycling Item'}</h2>
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
                    <label className="form-label">Item Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.item_name}
                      onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                      placeholder="e.g., Plastic Water Bottle"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Material Type</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.material_type}
                      onChange={(e) => setFormData({ ...formData, material_type: e.target.value })}
                      placeholder="e.g., PET Plastic #1"
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
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
                  <div className="form-group">
                    <label className="form-label">Environmental Impact</label>
                    <select
                      className="form-select"
                      value={formData.environmental_impact}
                      onChange={(e) => setFormData({ ...formData, environmental_impact: e.target.value })}
                    >
                      {impactLevels.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <input
                      type="checkbox"
                      checked={formData.recyclable}
                      onChange={(e) => setFormData({ ...formData, recyclable: e.target.checked })}
                      style={{ marginRight: '8px' }}
                    />
                    Recyclable
                  </label>
                </div>
                <div className="form-group">
                  <label className="form-label">Special Instructions</label>
                  <textarea
                    className="form-input"
                    value={formData.special_instructions}
                    onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                    placeholder="e.g., Remove cap, rinse clean"
                    rows={3}
                  />
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
              <h2 className="modal-title">Recycling Item Details</h2>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-label">Item Name</div>
                  <div className="detail-value">{selectedItem.item_name}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Material Type</div>
                  <div className="detail-value">{selectedItem.material_type}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Category</div>
                  <div className="detail-value">{selectedItem.category}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Recyclable</div>
                  <div className="detail-value">
                    <span className={selectedItem.recyclable ? 'recyclable-yes' : 'recyclable-no'}>
                      {selectedItem.recyclable ? '✓ Yes' : '✗ No'}
                    </span>
                  </div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Environmental Impact</div>
                  <div className="detail-value">
                    <span className={getImpactBadge(selectedItem.environmental_impact)}>{selectedItem.environmental_impact}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Special Instructions</div>
                  <div className="detail-value">{selectedItem.special_instructions || 'None'}</div>
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

export default RecyclingSorter;
