import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const NotificationBell: React.FC = () => {
  const [count, setCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCount(response.data.count);
    } catch {}
  };

  const fetchRecent = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/notifications?limit=5', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data.data || []);
    } catch {}
  };

  const toggleDropdown = () => {
    if (!showDropdown) fetchRecent();
    setShowDropdown(!showDropdown);
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = { alert: '🚨', warning: '⚠️', success: '✅', info: 'ℹ️' };
    return icons[type] || 'ℹ️';
  };

  return (
    <div className="notification-bell" style={{ position: 'relative' }}>
      <button className="bell-btn" onClick={toggleDropdown} aria-label={`Notifications${count > 0 ? `, ${count} unread` : ''}`}>
        🔔
        {count > 0 && <span className="bell-badge">{count > 9 ? '9+' : count}</span>}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <strong>Notifications</strong>
            <button onClick={() => { setShowDropdown(false); navigate('/notifications'); }}>View All</button>
          </div>
          {notifications.length === 0 ? (
            <div className="notification-empty">No notifications</div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className={`notification-item ${!n.read ? 'unread' : ''}`}
                onClick={() => { setShowDropdown(false); if (n.link) navigate(n.link); }}>
                <span className="notification-icon">{getTypeIcon(n.type)}</span>
                <div>
                  <div className="notification-title">{n.title}</div>
                  <div className="notification-message">{n.message?.substring(0, 60)}...</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
