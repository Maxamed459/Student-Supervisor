import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Bell, LogOut } from 'lucide-react';
import { fetchMe, logoutRequest, tokenStore } from '../services/apiClient';
import { roleRoutes, isSupportedRole } from '../config/navigation';
import { ConfirmDialog } from '../components/dialogs';
import { FullPageState } from '../components/common';
import { Sidebar } from '../components/sidebar/Sidebar';
import { useToast } from '../context/ToastContext';
import { logout, setSession } from '../store/slices/authSlice';
import {
  AssignmentsScreen,
  AuditLogsScreen,
  Dashboard,
  GroupsScreen,
  MilestonesScreen,
  NotificationsScreen,
  ProfileScreen,
  SettingsScreen,
  StudentFeedbackScreen,
  StudentGroupScreen,
  StudentSupervisorScreen,
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

  const links = roleRoutes[user.role];
  const currentTitle = links.find((item) => location.pathname.startsWith(item[1]))?.[0] || 'Dashboard';

  return (
    <div className={sidebarCollapsed ? 'app-frame sidebar-collapsed' : 'app-frame'}>
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((value) => !value)} role={user.role} pathname={location.pathname} />
      <div className="workspace">
        <header className="topbar">
          <h1>{currentTitle}</h1>
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
          <Routes>
            <Route path="/admin/dashboard" element={<Dashboard role="admin" />} />
            <Route path="/admin/users" element={<UsersScreen allowCreate roleFilter="" title="Users" />} />
            <Route path="/admin/students" element={<UsersScreen allowCreate roleFilter="student" title="Students" />} />
            <Route path="/admin/supervisors" element={<UsersScreen allowCreate roleFilter="supervisor" title="Supervisors" />} />
            <Route path="/admin/groups" element={<GroupsScreen allowManage />} />
            <Route path="/admin/assignments" element={<AssignmentsScreen />} />
            <Route path="/admin/submissions" element={<SubmissionsScreen />} />
            <Route path="/admin/audit-logs" element={<AuditLogsScreen />} />
            <Route path="/admin/settings" element={<SettingsScreen />} />

            <Route path="/supervisor/dashboard" element={<Dashboard role="supervisor" />} />
            <Route path="/supervisor/students" element={<UsersScreen roleFilter="student" title="My Students" />} />
            <Route path="/supervisor/groups" element={<GroupsScreen />} />
            <Route path="/supervisor/submissions" element={<SubmissionsScreen allowReview />} />
            <Route path="/supervisor/guidelines" element={<MilestonesScreen allowManage />} />
            <Route path="/supervisor/notifications" element={<NotificationsScreen />} />
            <Route path="/supervisor/profile" element={<ProfileScreen />} />

            <Route path="/student/dashboard" element={<Dashboard role="student" />} />
            <Route path="/student/my-group" element={<StudentGroupScreen />} />
            <Route path="/student/my-supervisor" element={<StudentSupervisorScreen />} />
            <Route path="/student/assignments" element={<MilestonesScreen title="Assignments / Milestones" subtitle="Academic assignments and project milestones for your group." />} />
            <Route path="/student/submissions" element={<SubmissionsScreen allowCreate />} />
            <Route path="/student/submission-history" element={<SubmissionsScreen />} />
            <Route path="/student/feedback" element={<StudentFeedbackScreen />} />
            <Route path="/student/guidelines" element={<MilestonesScreen />} />
            <Route path="/student/notifications" element={<NotificationsScreen />} />
            <Route path="/student/profile" element={<ProfileScreen />} />
            <Route path="*" element={<Navigate to={`/${user.role}/dashboard`} replace />} />
          </Routes>
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
