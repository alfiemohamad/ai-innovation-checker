import React, { FC, useState } from 'react';
import { FaUpload, FaStar, FaSearch, FaTrophy, FaSignOutAlt } from 'react-icons/fa';

const MENU = [
  { key: 'upload', label: 'Upload Innovation', icon: <FaUpload /> },
  { key: 'get_score', label: 'Get Score', icon: <FaStar /> },
  { key: 'innovation_search', label: 'Innovation Search', icon: <FaSearch /> },
  { key: 'ranking', label: 'Ranking Inovasi', icon: <FaTrophy /> },
];

const SidebarMenu: FC<{ 
  active: string, 
  setActive: (k: string) => void,
  onLogout?: () => void 
}> = ({ active, setActive, onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <nav className={`sidebar-menu${collapsed ? ' collapsed' : ''}`}> 
      <div className="sidebar-header">
        <button className="sidebar-collapse-btn" onClick={() => setCollapsed(v => !v)} aria-label="Toggle sidebar">
          {collapsed ? '»' : '«'}
        </button>
      </div>
      <ul>
        {MENU.map(menu => (
          <li key={menu.key}>
            <button
              className={active === menu.key ? 'active' : ''}
              onClick={() => setActive(menu.key)}
              aria-label={`Sidebar: ${menu.label}`}
            >
              <span className="sidebar-icon">{menu.icon}</span>
              {!collapsed && <span className="sidebar-label">{menu.label}</span>}
            </button>
          </li>
        ))}
        {onLogout && (
          <li style={{ marginTop: 'auto' }}>
            <button
              onClick={onLogout}
              aria-label="Logout"
              style={{ color: '#ff5252' }}
            >
              <span className="sidebar-icon"><FaSignOutAlt /></span>
              {!collapsed && <span className="sidebar-label">Logout</span>}
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default SidebarMenu;
