import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { roleRoutes } from '../../config/navigation';
import { BrandMark } from '../common';

const roleDashboardTitles = {
  admin: 'Admin Dashboard',
  supervisor: 'Supervisor Dashboard',
  student: 'Student Dashboard',
};

export function Sidebar({ collapsed, role, pathname, mobileOpen, onCloseMobile }) {
  const links = roleRoutes[role] || [];
  const dashboardTitle = roleDashboardTitles[role] || `${role ? role.charAt(0).toUpperCase() + role.slice(1) : ''} Dashboard`;

  return (
    <>
      <div
        className={mobileOpen ? 'sidebar-overlay active' : 'sidebar-overlay'}
        onClick={onCloseMobile}
        aria-hidden="true"
      />
      <aside className={mobileOpen ? 'sidebar mobile-open' : 'sidebar'}>
        <div className="sidebar-head">
          <div className="sidebar-brand-block">
            <Link className="sidebar-brand" to={`/${role}/dashboard`} onClick={onCloseMobile}>
              <BrandMark compact={false} />
            </Link>
            <div className="sidebar-dashboard-label">
              {dashboardTitle}
            </div>
          </div>
          <button className="sidebar-mobile-close" onClick={onCloseMobile} type="button" aria-label="Close sidebar">
            <X size={18} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {links.map(([name, path, Icon]) => (
            <Link
              className={pathname === path ? 'nav-link active' : 'nav-link'}
              key={path}
              to={path}
              onClick={onCloseMobile}
            >
              <Icon size={18} />
              <span>{name}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}

