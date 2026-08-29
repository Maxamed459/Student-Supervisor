import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";
import {
  IconDashboard,
  IconDepartments,
  IconGroups,
  IconLogout,
  IconStudents,
  IconSupervisors,
  IconUser,
  IconCheck,
} from "../components/Icons";

function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    {
      label: "Dashboard",
      path: "/admin",
      icon: IconDashboard,
    },
    {
      label: "Students",
      path: "/admin/students",
      icon: IconStudents,
    },
    {
      label: "Supervisors",
      path: "/admin/supervisors",
      icon: IconSupervisors,
    },
    {
      label: "Departments",
      path: "/admin/departments",
      icon: IconDepartments,
    },
    {
      label: "Groups",
      path: "/admin/groups",
      icon: IconGroups,
    },
    {
      label: "Collaboration",
      path: "/admin/collaboration",
      icon: IconCheck,
    },
  ];

  return (
    <div className="admin-layout app-shell">
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <Logo light />
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/admin"}
                className={({ isActive }) =>
                  isActive
                    ? "sidebar-link active"
                    : "sidebar-link"
                }
              >
                <span className="sidebar-link-icon">
                  <Icon />
                </span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="admin-info">
            <div className="user-avatar" aria-hidden="true">
              {user?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div>
              <strong>{user?.name}</strong>
              <span>Administrator</span>
            </div>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            <IconLogout size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>Admin Panel</h1>
            <p>
              Manage students, supervisors, groups, documents, tasks and
              meetings
            </p>
          </div>

          <div className="header-user">
            <IconUser size={16} />
            <span>{user?.name}</span>
          </div>
        </header>

        <section className="admin-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

export default AdminLayout;
