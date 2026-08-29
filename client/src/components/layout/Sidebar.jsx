import { NavLink, useNavigate } from 'react-router-dom';
import {
  LuLayoutDashboard,
  LuUsers,
  LuGraduationCap,
  LuClipboardList,
  LuActivity,
  LuFileText,
  
  LuLogOut,
} from 'react-icons/lu';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import logo from '../../assets/logo.jpeg';

const navItems = [
  { label: 'Dashboard', icon: LuLayoutDashboard, path: '/admin/dashboard' },
  { label: 'Students', icon: LuGraduationCap, path: '/admin/students' },
  { label: 'Supervisors', icon: LuUsers, path: '/admin/supervisors' },
  { label: 'Assigned', icon: LuClipboardList, path: '/admin/assigned' },
  { label: 'Monitoring', icon: LuActivity, path: '/admin/monitoring' },
  { label: 'Reports', icon: LuFileText, path: '/admin/reports' },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/admin/login');
  };

  return (
    <aside className="w-64 h-screen bg-primary flex flex-col fixed left-0 top-0">
      
      <div className="flex items-center gap-3 px-5 py-6">
        <img src={logo} alt="SSMS logo" className="w-9 h-9 object-contain rounded" />
        <div>
          <p className="text-white font-medium text-sm leading-tight">SSMS Admin</p>
          <p className="text-blue-200/50 text-xs">Management Portal</p>
        </div>
      </div>

      <nav className="flex-1 px-3 mt-2 space-y-1">
        {navItems.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-secondary text-white'
                  : 'text-blue-100/70 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-6 space-y-1 border-t border-white/10 pt-3">
      
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-blue-100/70 hover:bg-white/5 hover:text-white transition-colors"
        >
          <LuLogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}