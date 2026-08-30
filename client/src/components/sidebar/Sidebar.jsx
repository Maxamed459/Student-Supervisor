import { Link } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { roleRoutes } from '../../config/navigation';
import { BrandMark } from '../common';

export function Sidebar({ collapsed, onToggle, role, pathname }) {
  const links = roleRoutes[role];

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <Link className="sidebar-brand" to={`/${role}/dashboard`}>
          <BrandMark compact />
        </Link>
        <button className="sidebar-toggle" onClick={onToggle} type="button" aria-label="Toggle sidebar">
          {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>
      </div>
      <nav className="sidebar-nav">
        {links.map(([name, path, Icon]) => (
          <Link className={pathname === path ? 'nav-link active' : 'nav-link'} key={path} to={path}>
            <Icon size={18} />
            <span>{name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
