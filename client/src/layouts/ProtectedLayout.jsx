import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Bell, LogOut, Menu } from 'lucide-react';
import { fetchMe, logoutRequest, tokenStore } from '../services/apiClient';
import { roleRoutes, isSupportedRole } from '../config/navigation';
import { ConfirmDialog } from '../components/dialogs';
import { FullPageState } from '../components/common';
import { Sidebar } from '../components/sidebar/Sidebar';
import { useToast } from '../context/useToast';
import { logout, setSession } from '../store/slices/authSlice';
import { ForceChangePasswordScreen } from '../pages/auth/ForceChangePassword';
import { useResource } from '../hooks/useResources';
import {
  AuditLogsScreen,
  Dashboard,
  GroupsScreen,
  GroupWorkspaceScreen,
  MilestonesScreen,
  NotificationsScreen,
  ProfileScreen,
  StudentFeedbackScreen,
  StudentGroupScreen,
  StudentSupervisorScreen,
  StudentsScreen,
  SubmissionsScreen,
  UsersScreen,
} from '../pages/shared/WorkspacePages';

export function ProtectedLayout() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  const [ready, setReady] = useState(Boolean(user));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);


  useEffect(() => {
    if (!token) return;
    fetchMe()
      .then((freshUser) => dispatch(setSession({ user: freshUser, accessToken: token })))
      .catch(() => {
        tokenStore.clear();
        dispatch(logout());
      })
      .finally(() => setReady(true));
  }, [dispatch, token]);

  if (!token) return <Navigate to="/login" replace />;
  if (!ready) return <FullPageState title="Loading workspace" />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isSupportedRole(user.role)) {
    tokenStore.clear();
    dispatch(logout());
    return <Navigate to="/login" replace />;
  }
  if (user.mustChangePassword) {
    return <ForceChangePasswordScreen userName={user.fullName} />;
  }

  const links = roleRoutes[user.role];
  const currentTitle = links.find((item) => location.pathname.startsWith(item[1]))?.[0] || 'Dashboard';
  const requestedPath = location.pathname;
  const isPathAllowedForRole = links.some(([, path]) => requestedPath.startsWith(path));

  return (
    <div className={sidebarCollapsed ? 'app-frame sidebar-collapsed' : 'app-frame'}>
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onToggle={() => setSidebarCollapsed((value) => !value)}
        pathname={location.pathname}
        role={user.role}
      />
      <div className="workspace">
        <header className="topbar">
          <div className="topbar-left">
            <button
              aria-label="Toggle navigation menu"
              className="icon-button mobile-menu-toggle"
              onClick={() => setMobileMenuOpen((val) => !val)}
              title="Toggle Menu"
              type="button"
            >
              <Menu size={18} />
            </button>
            <h1>{currentTitle}</h1>
          </div>
          <div className="topbar-actions">
            <Link className="icon-button" to={`/${user.role}/notifications`} title="Notifications">
              <Bell size={18} />
            </Link>
            <Link className="avatar" to={`/${user.role}/profile`} title="Profile">
              {user.fullName?.slice(0, 1) || 'U'}
            </Link>
            <button
              className="icon-button"
              onClick={async () => {
                setConfirmLogout(true);
              }}
              title="Log out"
              type="button"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main className="content-canvas page-transition">
          {!isPathAllowedForRole ? (
            <Navigate to={`/${user.role}/dashboard`} replace />
          ) : (
            <Routes>
              <Route path="/admin/dashboard" element={<Dashboard role="admin" />} />
              <Route path="/admin/users" element={<UsersScreen allowCreate title="Users" />} />
              <Route path="/admin/groups" element={<GroupsScreen allowManage />} />
              <Route path="/admin/groups/:id" element={<GroupWorkspaceScreen role="admin" />} />
              <Route path="/admin/audit-logs" element={<AuditLogsScreen />} />
              <Route path="/admin/profile" element={<ProfileScreen />} />

              <Route path="/supervisor/dashboard" element={<Dashboard role="supervisor" />} />
              <Route path="/supervisor/students" element={<StudentsScreen title="My students" />} />
              <Route path="/supervisor/groups" element={<GroupsScreen />} />
              <Route path="/supervisor/groups/:id" element={<GroupWorkspaceScreen role="supervisor" />} />
              <Route path="/supervisor/submissions" element={<SubmissionsScreen allowReview />} />
              <Route path="/supervisor/guidelines" element={<MilestonesScreen allowManage scope="group" title="My milestones" subtitle="Milestones you have published in your groups." />} />
              <Route path="/supervisor/notifications" element={<NotificationsScreen />} />
              <Route path="/supervisor/profile" element={<ProfileScreen />} />

              <Route path="/student/dashboard" element={<Dashboard role="student" />} />
              <Route path="/student/groups" element={<StudentGroupRedirect />} />
              <Route path="/student/my-group" element={<StudentGroupScreen />} />
              <Route path="/student/groups/:id" element={<GroupWorkspaceScreen role="student" />} />
              <Route path="/student/my-supervisor" element={<StudentSupervisorScreen />} />
              <Route path="/student/assignments" element={<MilestonesScreen scope="group" title="Assignments / Milestones" subtitle="Academic assignments for your group." />} />
              <Route path="/student/submissions" element={<SubmissionsScreen allowCreate scope="group" />} />
              <Route path="/student/submission-history" element={<SubmissionsScreen scope="group" />} />
              <Route path="/student/feedback" element={<StudentFeedbackScreen />} />
              <Route path="/student/guidelines" element={<MilestonesScreen scope="group" title="Guidelines" subtitle="Project guidelines published for your group." />} />
              <Route path="/student/notifications" element={<NotificationsScreen />} />
              <Route path="/student/profile" element={<ProfileScreen />} />
              <Route path="*" element={<Navigate to={`/${user.role}/dashboard`} replace />} />
            </Routes>
          )}
        </main>
      </div>
      <ConfirmDialog
        open={confirmLogout}
        title="Log out of SSMS?"
        description="Your current session will end on this device."
        confirmLabel="Log out"
        onCancel={() => setConfirmLogout(false)}
        onConfirm={async () => {
          setConfirmLogout(false);
          await logoutRequest();
          dispatch(logout());
          toast.success('Signed out successfully');
          navigate('/login', { replace: true });
        }}
      />
    </div>
  );
}

// Redirects a student from /student/groups to their actual group workspace.
// If the student has no group yet, falls back to dashboard.
function StudentGroupRedirect() {
  const groups = useResource('groups', true);
  if (groups.isLoading) return <FullPageState title="Loading your group…" />;
  const group = groups.data?.[0];
  if (group?._id) return <Navigate to={`/student/groups/${group._id}`} replace />;
  return <Navigate to="/student/dashboard" replace />;
}
