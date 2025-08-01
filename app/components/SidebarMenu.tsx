import React, { FC, useState } from 'react';
import { FaUpload, FaList, FaStar, FaSearch, FaChartBar } from 'react-icons/fa';

const MENU = [
  { key: 'upload', label: 'Upload Innovation', icon: <FaUpload /> },
  { key: 'my_innovations', label: 'My Innovations', icon: <FaList /> },
  { key: 'get_score', label: 'Get Score', icon: <FaStar /> },
  { key: 'chat_search', label: 'Chat Search', icon: <FaSearch /> },
  { key: 'analytics', label: 'Analytics', icon: <FaChartBar /> },
];

const SidebarMenu: FC<{ active: string, setActive: (k: string) => void }> = ({ active, setActive }) => {
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
      </ul>
    </nav>
  );
};

export default SidebarMenu;
