import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import './FeaturePage.css';

interface User { id: number; email: string; name: string; role?: string }
interface MapViewProps { user: User; onLogout: () => void }

const MapView: React.FC<MapViewProps> = ({ user, onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [features, setFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bbox, setBbox] = useState('-180,-90,180,90');

  const load = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const r = await axios.get(`/api/map?bbox=${encodeURIComponent(bbox)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFeatures(r.data?.features || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <div className="app-shell">
      <Sidebar user={user} onLogout={onLogout} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main id="main-content" className="feature-main">
        <header className="feature-header">
          <h1>Geofenced Map</h1>
          <p>Recent geo-tagged weather and water-quality samples (GeoJSON).</p>
        </header>

        <section className="feature-card">
          <label>Bounding box (minLng,minLat,maxLng,maxLat) <input value={bbox} onChange={e => setBbox(e.target.value)} /></label>
          <button onClick={load} className="btn-primary">Reload</button>
        </section>

        <section className="feature-card">
          <h2>Features ({features.length})</h2>
          {loading ? <p>Loading…</p> : features.length === 0 ? (
            <p>No geo-tagged samples found. Add latitude/longitude to your weather or water-quality records to see them here.</p>
          ) : (
            <ul className="feature-list">
              {features.slice(0, 50).map((f, i) => (
                <li key={i} className="feature-list-item">
                  <strong>{f.properties?.kind}</strong> — [{f.geometry.coordinates[1].toFixed(4)}, {f.geometry.coordinates[0].toFixed(4)}]
                  {f.properties?.location ? ` • ${f.properties.location}` : ''}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
};

export default MapView;
