import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface User {
  id: number;
  email: string;
  name: string;
  role?: string;
}

interface SidebarProps {
  user: User;
  onLogout: () => void;
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { path: '/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/weather', icon: '🌤️', label: 'Weather Impact' },
  { path: '/carbon', icon: '🏭', label: 'Carbon Footprint' },
  { path: '/recycling', icon: '♻️', label: 'Recycling Sorter' },
  { path: '/energy', icon: '⚡', label: 'Energy Optimizer' },
  { path: '/water', icon: '💧', label: 'Water Quality' },
  { divider: true },
  { path: '/notifications', icon: '🔔', label: 'Notifications' },
  { path: '/search', icon: '🔍', label: 'Search' },
  { path: '/profile', icon: '👤', label: 'Profile' },
  { path: '/settings', icon: '⚙️', label: 'Settings' },
  { path: '/feedback', icon: '💬', label: 'Feedback' },
  { path: '/contact', icon: '📧', label: 'Support' },
  { divider: true },
  { path: '/admin', icon: '🛡️', label: 'Admin Panel', adminOnly: true },
];

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout, collapsed, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`} role="navigation" aria-label="Main navigation">
      <div className="sidebar-header">
        <div className="sidebar-logo" onClick={() => navigate('/dashboard')}>
          <span className="sidebar-logo-icon">🌍</span>
          {!collapsed && <span className="sidebar-logo-text">AI EnvMonitor</span>}
        </div>
        <button className="sidebar-toggle" onClick={onToggle} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item: any, index) => {
          if (item.divider) {
            return <div key={index} className="sidebar-divider" />;
          }
          if (item.adminOnly && user.role !== 'admin') {
            return null;
          }
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : undefined}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar-item-label">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {!collapsed && (
          <div className="sidebar-user">
            <div className="sidebar-user-name">{user.name}</div>
            <div className="sidebar-user-email">{user.email}</div>
          </div>
        )}
        <button className="sidebar-logout" onClick={onLogout} title="Logout" aria-label="Logout">
          {collapsed ? '🚪' : 'Logout'}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
