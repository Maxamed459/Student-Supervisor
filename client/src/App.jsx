import {
  ArrowUpDown,
  Bell,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileText,
  GraduationCap,
  Eye,
  EyeOff,
  ExternalLink,
  Hash,
  IdCard,
  LayoutDashboard,
  LogOut,
  LockKeyhole,
  Mail,
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Type,
  UploadCloud,
  X,
  UserCog,
  UserRound,
  Users,
} from 'lucide-react';
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  createResource,
  fetchMe,
  listResource,
  loginRequest,
  logoutRequest,
  patchResource,
  requestPasswordReset,
  resetPasswordRequest,
  tokenStore,
  uploadFileToCloudinary,
  verifyResetOtp,
} from './api/client';
import { logout, setSession } from './store/slices/authSlice';

const queryClient = new QueryClient();
const ToastContext = createContext(null);
const supportedRoles = ['admin', 'supervisor', 'student'];

const roleRoutes = {
  admin: [
    ['Dashboard', '/admin/dashboard', LayoutDashboard],
    ['Users', '/admin/users', Users],
    ['Students', '/admin/students', GraduationCap],
    ['Supervisors', '/admin/supervisors', UserCog],
    ['Groups/Rooms', '/admin/groups', BookOpen],
    ['Assignments', '/admin/assignments', ClipboardList],
    ['Submissions', '/admin/submissions', FileText],
    ['Audit Logs', '/admin/audit-logs', ShieldCheck],
    ['Settings', '/admin/settings', Settings],
  ],
  supervisor: [
    ['Dashboard', '/supervisor/dashboard', LayoutDashboard],
    ['My Students', '/supervisor/students', GraduationCap],
    ['Groups/Rooms', '/supervisor/groups', BookOpen],
    ['Submissions', '/supervisor/submissions', FileText],
    ['Guidelines', '/supervisor/guidelines', ClipboardList],
    ['Notifications', '/supervisor/notifications', Bell],
    ['Profile', '/supervisor/profile', UserCog],
  ],
  student: [
    ['Dashboard', '/student/dashboard', LayoutDashboard],
    ['My Group', '/student/my-group', Users],
    ['My Supervisor', '/student/my-supervisor', UserCog],
    ['Assignments / Milestones', '/student/assignments', ClipboardList],
    ['Submissions', '/student/submissions', FileText],
    ['Submission History', '/student/submission-history', RefreshCw],
    ['Feedback', '/student/feedback', MessageSquare],
    ['Guidelines', '/student/guidelines', ClipboardList],
    ['Notifications', '/student/notifications', Bell],
    ['Profile', '/student/profile', UserCog],
  ],
};

const resourceSpecs = {
  users: ['/users', 'users'],
  students: ['/users?role=student', 'users'],
  supervisors: ['/users?role=supervisor', 'users'],
  groups: ['/groups', 'groups'],
  rooms: ['/groups/rooms', 'rooms'],
  milestones: ['/milestones', 'milestones'],
  submissions: ['/submissions', 'submissions'],
  meetings: ['/meetings', 'meetings'],
  progress: ['/progress', 'progress'],
  notifications: ['/notifications', 'notifications'],
  auditLogs: ['/audit-logs', 'auditLogs'],
};

function useResource(name, enabled = true) {
  const [path, key] = resourceSpecs[name];
  return useQuery({
    queryKey: [name],
    queryFn: () => listResource(path, key),
    enabled,
    retry: false,
  });
}

function useDashboardData(role) {
  const allowRooms = role !== 'student';
  const allowAudit = role === 'admin';
  const users = useResource('users', role === 'admin');
  const students = useResource('students', role !== 'student');
  const supervisors = useResource('supervisors', role === 'admin');
  const groups = useResource('groups');
  const rooms = useResource('rooms', allowRooms);
  const milestones = useResource('milestones');
  const submissions = useResource('submissions');
  const meetings = useResource('meetings');
  const progress = useResource('progress');
  const notifications = useResource('notifications');
  const auditLogs = useResource('auditLogs', allowAudit);

  return {
    users,
    students,
    supervisors,
    groups,
    rooms,
    milestones,
    submissions,
    meetings,
    progress,
    notifications,
    auditLogs,
  };
}

function isSupportedRole(role) {
  return supportedRoles.includes(role);
}

function formatDate(value) {
  if (!value) return 'Not set';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function label(value) {
  if (!value) return 'Not assigned';
  if (typeof value === 'string') return value;
  return value.fullName || value.name || value.title || value.code || value.email || value._id || 'Linked record';
}

function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const mutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      if (!isSupportedRole(data.user?.role)) {
        tokenStore.clear();
        dispatch(logout());
        toast.error('This account role is not supported.');
        return;
      }
      dispatch(setSession(data));
      toast.success(`Welcome back, ${data.user.fullName}`);
      navigate(`/${data.user.role}/dashboard`, { replace: true });
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });

  return (
    <main className="auth-screen">
      <section className="brand-panel">
        <BrandMark />
        <div className="brand-copy">
          <h1>Student-supervisor management system</h1>
          <p>Manage groups, supervisors, and project progress from one secure dashboard.</p>
        </div>
      </section>
      <section className="login-panel">
        <form
          className="login-card"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate({ email, password });
          }}
        >
          <div>
            <h2>Welcome back</h2>
            <p>Sign in with your university supervision account.</p>
          </div>
          <Field icon={Mail} label="Email">
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email address" />
          </Field>
          <Field icon={LockKeyhole} label="Password">
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              type={showPassword ? 'text' : 'password'}
            />
            <button
              className="input-action"
              onClick={() => setShowPassword((value) => !value)}
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </Field>
          <div className="form-row">
            <label className="check-row">
              <input checked={remember} onChange={(event) => setRemember(event.target.checked)} type="checkbox" />
              Remember me
            </label>
            <button className="text-button" onClick={() => setResetOpen(true)} type="button">Forgot password?</button>
          </div>
          {mutation.error ? <p className="form-error" role="alert">{mutation.error.response?.data?.message || mutation.error.message}</p> : null}
          <button className="primary-button" disabled={mutation.isPending} type="submit">
            {mutation.isPending ? 'Logging in...' : 'Log in'}
          </button>
          <div className="login-rule" />
        </form>
      </section>
      <ForgotPasswordDialog open={resetOpen} onClose={() => setResetOpen(false)} />
    </main>
  );
}

function ProtectedLayout() {
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
      <aside className="sidebar">
        <div className="sidebar-head">
          <Link className="sidebar-brand" to={`/${user.role}/dashboard`}>
            <BrandMark compact />
          </Link>
          <button className="sidebar-toggle" onClick={() => setSidebarCollapsed((value) => !value)} type="button" aria-label="Toggle sidebar">
            {sidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
        </div>
        <nav className="sidebar-nav">
          {links.map(([name, path, Icon]) => (
            <Link className={location.pathname === path ? 'nav-link active' : 'nav-link'} key={path} to={path}>
              <Icon size={18} />
              <span>{name}</span>
            </Link>
          ))}
        </nav>
      </aside>
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

function Dashboard({ role }) {
  const data = useDashboardData(role);
  const submissions = data.submissions.data || [];
  const progress = data.progress.data || [];
  const groups = data.groups.data || [];
  const milestones = data.milestones.data || [];
  const meetings = data.meetings.data || [];
  const students = data.students.data || [];
  const supervisors = data.supervisors.data || [];
  const notifications = data.notifications.data || [];
  const myGroup = role === 'student' ? groups[0] : null;
  const currentMilestone = role === 'student'
    ? milestones.find((item) => item.status === 'published') || milestones[0]
    : null;
  const latestSubmission = role === 'student' ? submissions[0] : null;
  const pendingReviews = submissions.filter((item) => ['submitted', 'under_review'].includes(item.status));
  const upcomingMeetings = meetings.filter((item) => item.status === 'scheduled').slice(0, 3);

  const statusCounts = countBy(progress.length ? progress : submissions, 'status');
  const metrics = role === 'admin'
    ? [
        ['TOTAL STUDENTS', students.length, 'Registered student accounts', GraduationCap],
        ['TOTAL SUPERVISORS', supervisors.length, 'Active supervisor accounts', UserCog],
        ['STUDENT GROUPS', groups.length, 'Groups/rooms assigned from database', Users],
      ]
    : role === 'supervisor'
      ? [
          ['MY STUDENTS', students.length, 'Students assigned to your account', GraduationCap],
          ['GROUPS/ROOMS', groups.length, 'Current supervision groups', BookOpen],
          ['PENDING REVIEWS', submissions.filter((item) => ['submitted', 'under_review'].includes(item.status)).length, 'Submissions awaiting decision', FileText],
        ]
      : [
          ['MILESTONES', milestones.length, 'Published project guidelines', ClipboardList],
          ['SUBMISSIONS', submissions.length, 'Your uploaded versions', FileText],
          ['MEETINGS', meetings.length, 'Scheduled supervision sessions', Bell],
        ];

  return (
    <section className="page-stack">
      <PageIntro title="Overview" subtitle="Current metrics for the academic term." />
      <div className="metric-grid">
        {metrics.map(([title, value, caption, Icon]) => <MetricCard caption={caption} icon={Icon} key={title} title={title} value={value} />)}
      </div>
      {role === 'student' ? (
        <Card title="My Supervision Summary">
          <div className="student-summary-grid">
            <SummaryTile title="Group" value={label(myGroup)} caption={myGroup?.code || 'No active group returned'} />
            <SummaryTile title="Supervisor" value={label(myGroup?.supervisor)} caption="Assigned through your group" />
            <SummaryTile title="Current Milestone" value={label(currentMilestone)} caption={currentMilestone?.dueAt ? `Due ${formatDate(currentMilestone.dueAt)}` : 'No due date returned'} />
            <SummaryTile title="Submission Status" value={latestSubmission?.status || 'Not submitted'} caption={latestSubmission ? `Version ${latestSubmission.currentVersion}` : 'No submission returned'} />
          </div>
        </Card>
      ) : null}
      <div className="dashboard-grid">
        <Card title="Project Status Distribution" className="span-2">
          <StatusBars counts={statusCounts} />
        </Card>
        <Card title={role === 'admin' ? 'Recent System Activity' : 'Recent Notifications'}>
          <ActivityFeed items={role === 'admin' ? data.auditLogs.data : notifications} />
        </Card>
      </div>
      <Card title="Pending Actions">
        <PendingActions reviews={pendingReviews} meetings={upcomingMeetings} milestones={milestones} role={role} />
      </Card>
    </section>
  );
}

function UsersScreen({ allowCreate = false, roleFilter, title }) {
  const queryKey = roleFilter ? `${roleFilter}s` : 'users';
  const users = useResource(queryKey === 'students' ? 'students' : queryKey === 'supervisors' ? 'supervisors' : 'users');
  const queryClient = useQueryClient();
  const toast = useToast();
  const mutation = useMutation({
    mutationFn: (payload) => createResource('/users', payload, 'user'),
    onSuccess: () => {
      toast.success('Account created');
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });

  return (
    <section className="page-stack">
      <PageIntro title={title} subtitle="Accounts are loaded from the backend user collection." />
      {allowCreate ? (
        <Card title="Create Account">
          <UserForm fixedRole={roleFilter} onSubmit={(payload) => mutation.mutate(payload)} pending={mutation.isPending} />
          <MutationError mutation={mutation} />
        </Card>
      ) : null}
      <Card title={`${title} List`} action={<RefreshButton queryKey={[queryKey]} />}>
        <DataTable
          columns={[
            ['Name', (item) => item.fullName],
            ['Email', (item) => item.email],
            ['Role', (item) => <Badge value={item.role} />],
            ['Status', (item) => <Badge value={item.status} />],
            ['Last Login', (item) => formatDate(item.lastLoginAt)],
          ]}
          data={users.data || []}
          empty="No users returned by the API."
          loading={users.isLoading}
        />
      </Card>
    </section>
  );
}

function GroupsScreen({ allowManage = false }) {
  const groups = useResource('groups');
  const rooms = useResource('rooms');
  const students = useResource('students', allowManage);
  const supervisors = useResource('supervisors', allowManage);
  const queryClient = useQueryClient();
  const toast = useToast();
  const roomMutation = useMutation({
    mutationFn: (payload) => createResource('/groups/rooms', payload, 'room'),
    onSuccess: () => {
      toast.success('Room created');
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });
  const groupMutation = useMutation({
    mutationFn: (payload) => createResource('/groups', payload, 'group'),
    onSuccess: () => {
      toast.success('Group created');
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });

  return (
    <section className="page-stack">
      <PageIntro title="Groups/Rooms" subtitle="Rooms and project groups are loaded directly from the backend." />
      {allowManage ? (
        <div className="two-column">
          <Card title="Create Room">
            <RoomForm onSubmit={(payload) => roomMutation.mutate(payload)} pending={roomMutation.isPending} />
            <MutationError mutation={roomMutation} />
          </Card>
          <Card title="Create Group">
            <GroupForm
              rooms={rooms.data || []}
              students={students.data || []}
              supervisors={supervisors.data || []}
              onSubmit={(payload) => groupMutation.mutate(payload)}
              pending={groupMutation.isPending}
            />
            <MutationError mutation={groupMutation} />
          </Card>
        </div>
      ) : null}
      <div className="two-column">
        <Card title="Rooms">
          <DataTable
            columns={[
              ['Code', (item) => item.code],
              ['Name', (item) => item.name],
              ['Status', (item) => <Badge value={item.isActive ? 'active' : 'inactive'} />],
            ]}
            data={rooms.data || []}
            empty="No rooms returned by the API."
            loading={rooms.isLoading}
          />
        </Card>
        <Card title="Groups">
          <DataTable
            columns={[
              ['Code', (item) => item.code],
              ['Name', (item) => item.name],
              ['Room', (item) => label(item.room)],
              ['Supervisor', (item) => label(item.supervisor)],
              ['Students', (item) => item.students?.length || 0],
            ]}
            data={groups.data || []}
            empty="No groups returned by the API."
            loading={groups.isLoading}
          />
        </Card>
      </div>
    </section>
  );
}

function AssignmentsScreen() {
  return <MilestonesScreen allowManage title="Assignments / Milestones" subtitle="Create and manage academic deliverables separately from supervision groups." />;
}

function MilestonesScreen({ allowManage = false, title = 'Guidelines', subtitle = 'Proposal milestones and project guidelines from the backend.' }) {
  const milestones = useResource('milestones');
  const groups = useResource('groups', allowManage);
  const queryClient = useQueryClient();
  const toast = useToast();
  const mutation = useMutation({
    mutationFn: (payload) => createResource('/milestones', payload, 'milestone'),
    onSuccess: () => {
      toast.success('Milestone created');
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });

  return (
    <section className="page-stack">
      <PageIntro title={title} subtitle={subtitle} />
      {allowManage ? (
        <Card title="Create Milestone">
          <MilestoneForm groups={groups.data || []} onSubmit={(payload) => mutation.mutate(payload)} pending={mutation.isPending} />
          <MutationError mutation={mutation} />
        </Card>
      ) : null}
      <Card title="Milestones/Proposal">
        <DataTable
          columns={[
            ['Order', (item) => item.order],
            ['Title', (item) => item.title],
            ['Group', (item) => label(item.group)],
            ['Due', (item) => formatDate(item.dueAt)],
            ['Status', (item) => <Badge value={item.status} />],
          ]}
          data={milestones.data || []}
          empty="No milestones returned by the API."
          loading={milestones.isLoading}
        />
      </Card>
    </section>
  );
}

function SubmissionsScreen({ allowCreate = false, allowReview = false }) {
  const submissions = useResource('submissions');
  const milestones = useResource('milestones', allowCreate);
  const groups = useResource('groups', allowCreate);
  const queryClient = useQueryClient();
  const toast = useToast();
  const createMutation = useMutation({
    mutationFn: (payload) => createResource('/submissions', payload, 'submission'),
    onSuccess: () => {
      toast.success('Submission sent');
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });
  const reviewMutation = useMutation({
    mutationFn: ({ id, payload }) => createResource(`/submissions/${id}/review`, payload, 'submission'),
    onSuccess: () => {
      toast.success('Review saved');
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });

  return (
    <section className="page-stack">
      <PageIntro title="Submissions" subtitle="Submissions and feedback are connected to the REST API." />
      {allowCreate ? (
        <Card title="Submit Project">
          <SubmissionForm
            groups={groups.data || []}
            milestones={milestones.data || []}
            onSubmit={(payload) => createMutation.mutate(payload)}
            pending={createMutation.isPending}
          />
          <MutationError mutation={createMutation} />
        </Card>
      ) : null}
      <Card title="Submission History">
        <DataTable
          columns={[
            ['Milestone', (item) => label(item.milestone)],
            ['Student', (item) => label(item.student)],
            ['Group', (item) => label(item.group)],
            ['Version', (item) => item.currentVersion],
            ['Files', (item) => <SubmissionFiles submission={item} />],
            ['Status', (item) => <Badge value={item.status} />],
            ['Updated', (item) => formatDate(item.updatedAt)],
            allowReview ? ['Review', (item) => <ReviewControls item={item} mutation={reviewMutation} />] : null,
          ].filter(Boolean)}
          data={submissions.data || []}
          empty="No submissions returned by the API."
          loading={submissions.isLoading}
        />
      </Card>
    </section>
  );
}

function NotificationsScreen() {
  const notifications = useResource('notifications');
  const queryClient = useQueryClient();
  const toast = useToast();
  const mutation = useMutation({
    mutationFn: (id) => patchResource(`/notifications/${id}/read`, {}, 'notification'),
    onSuccess: () => {
      toast.success('Notification marked read');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });

  return (
    <section className="page-stack">
      <PageIntro title="Notifications" subtitle="Notification center for supervision updates." />
      <Card title="Notification Center">
        <DataTable
          columns={[
            ['Title', (item) => item.title],
            ['Type', (item) => <Badge value={item.type} />],
            ['Message', (item) => item.message],
            ['Status', (item) => <Badge value={item.readAt ? 'read' : 'unread'} />],
            ['Created', (item) => formatDate(item.createdAt)],
            ['Action', (item) => item.readAt ? 'Done' : <button className="small-button" onClick={() => mutation.mutate(item._id)} type="button">Mark read</button>],
          ]}
          data={notifications.data || []}
          empty="No notifications returned by the API."
          loading={notifications.isLoading}
        />
      </Card>
    </section>
  );
}

function AuditLogsScreen() {
  const auditLogs = useResource('auditLogs');
  return (
    <section className="page-stack">
      <PageIntro title="Audit Logs" subtitle="Recent backend audit records." />
      <Card title="System Activity">
        <DataTable
          columns={[
            ['Action', (item) => item.action],
            ['Entity', (item) => item.entityType],
            ['Actor', (item) => label(item.actor)],
            ['Created', (item) => formatDate(item.createdAt)],
          ]}
          data={auditLogs.data || []}
          empty="No audit logs returned by the API."
          loading={auditLogs.isLoading}
        />
      </Card>
    </section>
  );
}

function ProfileScreen() {
  const user = useSelector((state) => state.auth.user);
  return (
    <section className="page-stack">
      <PageIntro title="Profile" subtitle="Signed-in user profile from the authentication API." />
      <Card title="Account">
        <dl className="profile-grid">
          <dt>Name</dt><dd>{user.fullName}</dd>
          <dt>Email</dt><dd>{user.email}</dd>
          <dt>Role</dt><dd><Badge value={user.role} /></dd>
          <dt>Status</dt><dd><Badge value={user.status} /></dd>
          <dt>Supervisor</dt><dd>{label(user.supervisor)}</dd>
          <dt>Group</dt><dd>{label(user.group)}</dd>
        </dl>
      </Card>
    </section>
  );
}

function SettingsScreen() {
  return (
    <section className="page-stack">
      <PageIntro title="Settings" subtitle="Platform configuration area." />
      <Card title="System Settings">
        <p className="muted">
          The backend currently does not expose settings endpoints. This screen is wired into admin navigation and ready for
          API-backed controls when settings resources are added.
        </p>
      </Card>
    </section>
  );
}

function StudentGroupScreen() {
  const groups = useResource('groups');
  const group = groups.data?.[0];
  return (
    <section className="page-stack">
      <PageIntro title="My Group" subtitle="Your active supervision group and members." />
      <Card title={group ? `${group.code} - ${group.name}` : 'Group Details'}>
        {group ? (
          <div className="student-detail-grid">
            <SummaryTile title="Supervisor" value={label(group.supervisor)} caption={group.supervisor?.email || 'Assigned group supervisor'} />
            <SummaryTile title="Room" value={label(group.room)} caption={group.room?.code || 'Supervision room'} />
            <SummaryTile title="Members" value={`${group.students?.length || 0} students`} caption="Groups must contain exactly 4 students" />
            <div className="member-list">
              {(group.students || []).map((student) => (
                <article key={student._id} className="member-row">
                  <span>{student.fullName?.slice(0, 1) || 'S'}</span>
                  <div><strong>{student.fullName}</strong><p>{student.email}</p></div>
                </article>
              ))}
            </div>
          </div>
        ) : <TableState icon={Users} text="No active group returned by the API." />}
      </Card>
    </section>
  );
}

function StudentSupervisorScreen() {
  const groups = useResource('groups');
  const supervisor = groups.data?.[0]?.supervisor;
  return (
    <section className="page-stack">
      <PageIntro title="My Supervisor" subtitle="Supervisor assignment is managed through your active group." />
      <Card title="Supervisor">
        {supervisor ? (
          <dl className="profile-grid">
            <dt>Name</dt><dd>{supervisor.fullName}</dd>
            <dt>Email</dt><dd>{supervisor.email}</dd>
            <dt>Role</dt><dd><Badge value={supervisor.role} /></dd>
          </dl>
        ) : <TableState icon={UserCog} text="No supervisor returned by your group record." />}
      </Card>
    </section>
  );
}

function StudentFeedbackScreen() {
  const submissions = useResource('submissions');
  const queryClient = useQueryClient();
  const toast = useToast();
  const mutation = useMutation({
    mutationFn: ({ id, message }) => createResource(`/submissions/${id}/comments`, { message, visibility: 'student_supervisor' }, 'comment'),
    onSuccess: () => {
      toast.success('Feedback submitted');
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });
  return (
    <section className="page-stack">
      <PageIntro title="Feedback" subtitle="Supervisor decisions and feedback from your submissions." />
      <Card title="Feedback History">
        <DataTable
          columns={[
            ['Milestone', (item) => label(item.milestone)],
            ['Status', (item) => <Badge value={item.status} />],
            ['Decision', (item) => <Badge value={item.review?.decision || 'pending'} />],
            ['Feedback', (item) => item.review?.feedback || 'No feedback yet'],
            ['Reviewed', (item) => formatDate(item.review?.reviewedAt)],
            ['Reply', (item) => <FeedbackReplyForm submission={item} mutation={mutation} />],
          ]}
          data={submissions.data || []}
          empty="No feedback returned by the API."
          loading={submissions.isLoading}
        />
      </Card>
    </section>
  );
}

function SummaryTile({ title, value, caption }) {
  return (
    <article className="summary-tile">
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{caption}</p>
    </article>
  );
}

function ForgotPasswordDialog({ open, onClose }) {
  const toast = useToast();
  const [step, setStep] = useState('email');
  const [form, setForm] = useState({ email: '', otp: '', password: '', confirmPassword: '' });
  const requestMutation = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: (data) => {
      toast.success(data.message);
      setStep('otp');
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });
  const verifyMutation = useMutation({
    mutationFn: verifyResetOtp,
    onSuccess: (data) => {
      toast.success(data.message);
      setStep('password');
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });
  const resetMutation = useMutation({
    mutationFn: resetPasswordRequest,
    onSuccess: (data) => {
      toast.success(data.message);
      onClose();
      setStep('email');
      setForm({ email: '', otp: '', password: '', confirmPassword: '' });
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });

  if (!open) return null;

  const pending = requestMutation.isPending || verifyMutation.isPending || resetMutation.isPending;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal-panel reset-panel" role="dialog" aria-modal="true" aria-labelledby="reset-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-icon"><LockKeyhole size={20} /></div>
        <h2 id="reset-title">Reset password</h2>
        <p>Use the OTP sent to your registered email. Codes expire after a short period.</p>
        <form
          className="reset-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (step === 'email') requestMutation.mutate({ email: form.email });
            if (step === 'otp') verifyMutation.mutate({ email: form.email, otp: form.otp });
            if (step === 'password') {
              if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
              resetMutation.mutate({ email: form.email, otp: form.otp, password: form.password });
            }
          }}
        >
          <Field icon={Mail} label="Registered email">
            <input value={form.email} disabled={step !== 'email'} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="name@university.edu" />
          </Field>
          {step !== 'email' ? (
            <Field icon={Hash} label="OTP">
              <input inputMode="numeric" maxLength="6" value={form.otp} onChange={(event) => setForm({ ...form, otp: event.target.value.replace(/\D/g, '') })} placeholder="6 digit code" />
            </Field>
          ) : null}
          {step === 'password' ? (
            <>
              <Field icon={LockKeyhole} label="New password">
                <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Minimum 8 characters" />
              </Field>
              <Field icon={LockKeyhole} label="Confirm password">
                <input type="password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} placeholder="Repeat new password" />
              </Field>
            </>
          ) : null}
          <div className="modal-actions">
            <button className="secondary-button" onClick={onClose} type="button">Cancel</button>
            {step !== 'email' ? <button className="secondary-button" disabled={pending} onClick={() => requestMutation.mutate({ email: form.email })} type="button">Resend OTP</button> : null}
            <button className="primary-button inline" disabled={pending} type="submit">
              {step === 'email' ? 'Send OTP' : step === 'otp' ? 'Verify OTP' : 'Reset password'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function BrandMark({ compact = false }) {
  return (
    <div className={compact ? 'brand-mark compact' : 'brand-mark'} aria-label="SSMS">
      <span className="brand-symbol">
        <GraduationCap size={compact ? 17 : 20} strokeWidth={2.3} />
      </span>
      <span className="brand-word">
        <strong>SSMS</strong>
        {!compact ? <small>Academic Supervision</small> : null}
      </span>
    </div>
  );
}

function Field({ help, icon: Icon, label: fieldLabel, children }) {
  return (
    <label className="field">
      <span>{fieldLabel}</span>
      <div className={Icon ? 'input-shell has-icon' : 'input-shell'}>
        {Icon ? <Icon size={16} strokeWidth={2.1} /> : null}
        {children}
      </div>
      {help ? <small>{help}</small> : null}
    </label>
  );
}

function PageIntro({ title, subtitle }) {
  return (
    <div className="page-intro">
      <span>SSMS Workspace</span>
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  );
}

function Card({ title, description, action, className = '', children }) {
  return (
    <section className={`surface-card ${className}`}>
      <div className="card-header">
        <div>
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function MetricCard({ title, value, caption, icon: Icon }) {
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span>{title}</span>
        <div className="metric-icon"><Icon size={17} /></div>
      </div>
      <strong>{value}</strong>
      <p>{caption}</p>
    </article>
  );
}

function Badge({ value }) {
  return <span className={`badge badge-${String(value).replaceAll('_', '-')}`}>{String(value).replaceAll('_', ' ')}</span>;
}

function DataTable({ columns, data, empty, loading }) {
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ index: 0, direction: 'asc' });
  const pageSize = 8;
  const statusOptions = useMemo(() => {
    return [...new Set(data.map((item) => item.status || (item.readAt ? 'read' : item.readAt === null ? 'unread' : '')).filter(Boolean))];
  }, [data]);
  const filtered = useMemo(() => {
    const term = filter.trim().toLowerCase();
    return data.filter((item) => {
      const itemStatus = item.status || (item.readAt ? 'read' : item.readAt === null ? 'unread' : '');
      const matchesStatus = !statusFilter || itemStatus === statusFilter;
      const matchesTerm = !term || JSON.stringify(item).toLowerCase().includes(term);
      return matchesStatus && matchesTerm;
    });
  }, [data, filter, statusFilter]);
  const sorted = useMemo(() => {
    const [, render] = columns[sort.index] || columns[0];
    return [...filtered].sort((a, b) => {
      const left = String(render(a)?.props ? '' : render(a) ?? '').toLowerCase();
      const right = String(render(b)?.props ? '' : render(b) ?? '').toLowerCase();
      return sort.direction === 'asc' ? left.localeCompare(right) : right.localeCompare(left);
    });
  }, [columns, filtered, sort]);
  const pageCount = Math.max(Math.ceil(sorted.length / pageSize), 1);
  const currentPage = Math.min(page, pageCount);
  const pageRows = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (loading) return <SkeletonTable columns={columns.length} />;
  if (!data.length) return <TableState icon={Search} text={empty} />;

  return (
    <div className="data-table">
      <div className="table-toolbar">
        <label className="table-filter">
          <Search size={16} />
          <input aria-label="Filter table records" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter records" />
        </label>
        {statusOptions.length ? (
          <select className="table-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status">
            <option value="">All statuses</option>
            {statusOptions.map((status) => <option key={status} value={status}>{String(status).replaceAll('_', ' ')}</option>)}
          </select>
        ) : null}
        <span>{filtered.length} records</span>
      </div>
      {!filtered.length ? (
        <TableState icon={Search} text="No records match this filter." />
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {columns.map(([name], index) => (
                    <th key={name}>
                      <button
                        className="sort-button"
                        onClick={() => setSort((value) => ({
                          index,
                          direction: value.index === index && value.direction === 'asc' ? 'desc' : 'asc',
                        }))}
                        type="button"
                      >
                        {name}
                        <ArrowUpDown size={13} />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((item) => (
                  <tr key={item._id || item.id}>
                    {columns.map(([name, render]) => <td key={name}>{render(item)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination" aria-label="Table pagination">
            <button disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(value - 1, 1))} type="button">Previous</button>
            <span>Page {currentPage} of {pageCount}</span>
            <button disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(value + 1, pageCount))} type="button">Next</button>
          </div>
        </>
      )}
    </div>
  );
}

function SkeletonTable({ columns }) {
  return (
    <div className="skeleton-table" aria-label="Loading records">
      {Array.from({ length: 5 }).map((_, row) => (
        <div className="skeleton-row" key={row} style={{ '--cols': columns }}>
          {Array.from({ length: columns }).map((__, column) => <span key={column} />)}
        </div>
      ))}
    </div>
  );
}

function TableState({ icon: Icon, text }) {
  return (
    <div className="table-state">
      <Icon size={18} />
      <span>{text}</span>
    </div>
  );
}

function StatusBars({ counts }) {
  const entries = Object.entries(counts);
  if (!entries.length) return <TableState icon={ClipboardList} text="No progress or submissions returned by the API." />;
  const max = Math.max(...entries.map(([, value]) => value), 1);
  return (
    <div className="status-chart">
      <div className="bars">
        {entries.map(([name, value]) => (
          <div className="bar-column" key={name}>
            <div className="bar" style={{ height: `${Math.max((value / max) * 190, 16)}px` }} />
            <span>{value}</span>
          </div>
        ))}
      </div>
      <div className="legend">
        {entries.map(([name]) => (
          <span key={name}><i />{name.replaceAll('_', ' ')}</span>
        ))}
      </div>
    </div>
  );
}

function ActivityFeed({ items = [] }) {
  if (!items.length) return <TableState icon={MessageSquare} text="No recent activity returned by the API." />;
  return (
    <div className="activity-list">
      {items.slice(0, 6).map((item) => (
        <article key={item._id || item.id} className="activity-item">
          <i />
          <div>
            <strong>{item.title || item.action || item.type}</strong>
            <p>{item.message || item.entityType || 'Activity record'}</p>
            <span>{formatDate(item.createdAt)}</span>
          </div>
        </article>
      ))}
    </div>
  );
}

function RefreshButton({ queryKey }) {
  const queryClient = useQueryClient();
  return (
    <button className="icon-button compact" onClick={() => queryClient.invalidateQueries({ queryKey })} title="Refresh" type="button">
      <RefreshCw size={15} />
    </button>
  );
}

function MutationError({ mutation }) {
  return mutation.error ? <p className="form-error" role="alert">{mutation.error.response?.data?.message || mutation.error.message}</p> : null;
}

function UserForm({ fixedRole, onSubmit, pending }) {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: fixedRole || 'student', status: 'active' });
  return (
    <FormGrid
      onSubmit={() => onSubmit(form)}
      pending={pending}
      submitLabel="Create user"
      fields={[
        ['Full name', 'fullName', 'text', 'Enter full legal name', UserRound],
        ['Email', 'email', 'email', 'name@university.edu', Mail],
        ['Password', 'password', 'password', 'Minimum 8 characters', LockKeyhole],
      ]}
      form={form}
      setForm={setForm}
    >
      {!fixedRole ? (
        <Field icon={ShieldCheck} label="Role" help="Controls portal access and permissions.">
          <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
            <option value="student">Student</option>
            <option value="supervisor">Supervisor</option>
            <option value="admin">Admin</option>
          </select>
        </Field>
      ) : null}
      {form.role === 'student' ? (
        <Field icon={IdCard} label="Student ID" help="Supervisor assignment is handled only through supervision groups.">
          <input value={form.studentId || ''} onChange={(event) => setForm({ ...form, studentId: event.target.value })} placeholder="STD-2026-001" />
        </Field>
      ) : null}
      {form.role === 'supervisor' ? (
        <Field icon={IdCard} label="Staff ID">
          <input value={form.staffId || ''} onChange={(event) => setForm({ ...form, staffId: event.target.value })} placeholder="SUP-2026-001" />
        </Field>
      ) : null}
    </FormGrid>
  );
}

function RoomForm({ onSubmit, pending }) {
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  return <FormGrid form={form} fields={[['Name', 'name', 'text', 'Research Supervision Lab', Type], ['Code', 'code', 'text', 'SUP-LAB-01', Hash], ['Description', 'description', 'text', 'Short room purpose', FileText]]} onSubmit={() => onSubmit(form)} pending={pending} setForm={setForm} submitLabel="Create room" />;
}

function GroupForm({ rooms, students, supervisors, onSubmit, pending }) {
  const initial = { name: '', code: '', room: '', supervisor: '', students: [] };
  const [form, setForm] = useState(initial);
  const availableStudents = students.filter((student) => !student.group || form.students.includes(student._id));
  const toggleStudent = (id) => {
    setForm((value) => {
      const selected = value.students.includes(id)
        ? value.students.filter((studentId) => studentId !== id)
        : value.students.length < 4 ? [...value.students, id] : value.students;
      return { ...value, students: selected };
    });
  };
  return (
    <form className="form-grid" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
      <Field icon={Type} label="Name"><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Software Engineering Research Group" /></Field>
      <Field icon={Hash} label="Code"><input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="SCS-GRP-2026-01" /></Field>
      <Field icon={BookOpen} label="Room">
        <select value={form.room} onChange={(event) => setForm({ ...form, room: event.target.value })}>
          <option value="">Select room</option>
          {rooms.map((room) => <option key={room._id} value={room._id}>{room.code} - {room.name}</option>)}
        </select>
      </Field>
      <Field icon={UserCog} label="Supervisor">
        <select value={form.supervisor} onChange={(event) => setForm({ ...form, supervisor: event.target.value })}>
          <option value="">Select supervisor</option>
          {supervisors.map((supervisor) => <option key={supervisor._id} value={supervisor._id}>{supervisor.fullName}</option>)}
        </select>
      </Field>
      <div className="student-picker">
        <div className="student-picker-head">
          <span>Students</span>
          <Badge value={`${form.students.length}/4 selected`} />
        </div>
        <div className="student-options">
          {availableStudents.map((student) => (
            <button
              className={form.students.includes(student._id) ? 'student-option selected' : 'student-option'}
              key={student._id}
              onClick={() => toggleStudent(student._id)}
              type="button"
            >
              <span>{student.fullName}</span>
              <small>{student.email}</small>
            </button>
          ))}
        </div>
        <small>Exactly 4 active, unassigned students are required.</small>
      </div>
      <div className="form-actions">
        <button className="secondary-button" disabled={pending} onClick={() => setForm(initial)} type="button">Cancel</button>
        <button className="primary-button inline" disabled={pending || form.students.length !== 4} type="submit"><Plus size={15} />{pending ? 'Saving...' : 'Create group'}</button>
      </div>
    </form>
  );
}

function MilestoneForm({ groups, onSubmit, pending }) {
  const initial = { title: '', description: '', order: 1, group: '', dueAt: '', status: 'draft', allowedFileTypes: ['pdf', 'docx'] };
  const [form, setForm] = useState(initial);
  return (
    <form className="form-grid" onSubmit={(event) => { event.preventDefault(); onSubmit({ ...form, order: Number(form.order), dueAt: new Date(form.dueAt).toISOString() }); }}>
      <div className="form-section-title">
        <strong>Milestone details</strong>
        <span>Define what students must submit and when it is due.</span>
      </div>
      <Field icon={Type} label="Title"><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Proposal" /></Field>
      <Field icon={Hash} label="Order"><input min="1" type="number" value={form.order} onChange={(event) => setForm({ ...form, order: event.target.value })} /></Field>
      <Field icon={Users} label="Group">
        <select value={form.group} onChange={(event) => setForm({ ...form, group: event.target.value })}>
          <option value="">Select group</option>
          {groups.map((group) => <option key={group._id} value={group._id}>{group.code} - {group.name}</option>)}
        </select>
      </Field>
      <Field icon={CalendarClock} label="Due date"><input type="datetime-local" value={form.dueAt} onChange={(event) => setForm({ ...form, dueAt: event.target.value })} /></Field>
      <Field icon={ShieldCheck} label="Status">
        <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="closed">Closed</option>
        </select>
      </Field>
      <Field icon={FileText} label="Description"><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Describe the deliverable, requirements, and review expectations." /></Field>
      <div className="form-actions">
        <button className="secondary-button" disabled={pending} onClick={() => setForm(initial)} type="button">Cancel</button>
        <button className="primary-button inline" disabled={pending} type="submit"><Plus size={15} />{pending ? 'Saving...' : 'Create milestone'}</button>
      </div>
    </form>
  );
}

function SubmissionForm({ groups, milestones, onSubmit, pending }) {
  const initial = {
    milestone: '',
    group: '',
    notes: '',
  };
  const [form, setForm] = useState(initial);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();
  const selectedGroup = form.group || (groups.length === 1 ? groups[0]._id : '');
  const allowedExtensions = ['pdf', 'docx'];
  const maxBytes = 10 * 1024 * 1024;
  const maxFiles = 5;
  const addFiles = (selectedFiles) => {
    const current = files.length;
    const next = Array.from(selectedFiles).slice(0, Math.max(maxFiles - current, 0)).map((file) => {
      const extension = file.name.split('.').pop().toLowerCase();
      const invalidType = !allowedExtensions.includes(extension);
      const invalidSize = file.size > maxBytes;
      return {
        id: crypto.randomUUID(),
        file,
        progress: 0,
        status: invalidType || invalidSize ? 'error' : 'ready',
        error: invalidType ? 'Unsupported file type' : invalidSize ? 'File is larger than 10 MB' : '',
        result: null,
      };
    });
    if (current + selectedFiles.length > maxFiles) toast.error('You can upload up to 5 files per submission');
    setFiles((value) => [...value, ...next]);
  };
  const removeFile = (id) => setFiles((value) => value.filter((item) => item.id !== id));
  const uploadReadyFiles = async () => {
    const validFiles = files.filter((item) => item.status !== 'error');
    if (!validFiles.length) throw new Error('Select at least one valid PDF or DOCX file');
    const uploaded = [];
    setUploading(true);
    try {
      for (const item of validFiles) {
        if (item.result) {
          uploaded.push(item.result);
          continue;
        }
        setFiles((value) => value.map((fileItem) => fileItem.id === item.id ? { ...fileItem, status: 'uploading', progress: 1 } : fileItem));
        const result = await uploadFileToCloudinary(item.file, (progress) => {
          setFiles((value) => value.map((fileItem) => fileItem.id === item.id ? { ...fileItem, progress } : fileItem));
        });
        uploaded.push(result);
        setFiles((value) => value.map((fileItem) => fileItem.id === item.id ? { ...fileItem, status: 'success', progress: 100, result } : fileItem));
      }
      return uploaded;
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
      throw error;
    } finally {
      setUploading(false);
    }
  };
  return (
    <form
      className="form-grid"
      onSubmit={async (event) => {
        event.preventDefault();
        let uploadedFiles;
        try {
          uploadedFiles = await uploadReadyFiles();
        } catch {
          return;
        }
        onSubmit({
          milestone: form.milestone,
          group: selectedGroup,
          versions: [{
            notes: form.notes,
            files: uploadedFiles,
          }],
        });
      }}
    >
      <div className="form-section-title">
        <strong>Submission details</strong>
        <span>Connect your uploaded file to the right milestone and group.</span>
      </div>
      <Field icon={ClipboardList} label="Milestone">
        <select value={form.milestone} onChange={(event) => setForm({ ...form, milestone: event.target.value })}>
          <option value="">Select milestone</option>
          {milestones.map((milestone) => <option key={milestone._id} value={milestone._id}>{milestone.title}</option>)}
        </select>
      </Field>
      <Field icon={Users} label="Group">
        <select value={selectedGroup} onChange={(event) => setForm({ ...form, group: event.target.value })}>
          <option value="">Select group</option>
          {groups.map((group) => <option key={group._id} value={group._id}>{group.code} - {group.name}</option>)}
        </select>
      </Field>
      <div className="form-section-title">
        <strong>Files</strong>
        <span>Allowed file types: PDF and DOCX. Upload 1 to 5 files, maximum 10 MB each.</span>
      </div>
      <div className="upload-dropzone">
        <UploadCloud size={24} />
        <strong>Select submission files</strong>
        <span>PDF, DOCX. Up to 5 files.</span>
        <input
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          multiple
          onChange={(event) => addFiles(event.target.files)}
          type="file"
        />
      </div>
      <div className="upload-list">
        {files.map((item) => (
          <article className={`upload-item upload-${item.status}`} key={item.id}>
            <FileText size={18} />
            <div>
              <strong>{item.file.name}</strong>
              <span>{formatBytes(item.file.size)} - {item.file.name.split('.').pop().toUpperCase()}</span>
              <div className="upload-progress"><i style={{ width: `${item.progress}%` }} /></div>
              {item.error ? <small>{item.error}</small> : null}
            </div>
            <button aria-label={`Remove ${item.file.name}`} onClick={() => removeFile(item.id)} type="button"><X size={16} /></button>
          </article>
        ))}
      </div>
      <Field icon={MessageSquare} label="Notes"><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Add a short note for your supervisor." /></Field>
      <div className="form-actions">
        <button className="secondary-button" disabled={pending || uploading} onClick={() => { setForm(initial); setFiles([]); }} type="button">Cancel</button>
        <button className="primary-button inline" disabled={pending || uploading} type="submit"><Plus size={15} />{pending || uploading ? 'Uploading...' : 'Submit project'}</button>
      </div>
    </form>
  );
}

function FormGrid({ form, setForm, fields, children, onSubmit, pending, submitLabel }) {
  const initialForm = useRef(form);
  return (
    <form className="form-grid" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
      {fields.map(([fieldLabel, key, type = 'text', placeholder = '', Icon]) => (
        <Field key={key} icon={Icon} label={fieldLabel}>
          <input type={type} value={form[key]} placeholder={placeholder} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />
        </Field>
      ))}
      {children}
      <div className="form-actions">
        <button className="secondary-button" disabled={pending} onClick={() => setForm(initialForm.current)} type="button">
          Cancel
        </button>
        <button className="primary-button inline" disabled={pending} type="submit"><Plus size={15} />{pending ? 'Saving...' : submitLabel}</button>
      </div>
    </form>
  );
}

function PendingActions({ reviews, meetings, milestones, role }) {
  const overdueMilestones = milestones.filter((item) => item.dueAt && new Date(item.dueAt) < new Date() && item.status !== 'closed').slice(0, 3);
  const items = [
    ...reviews.slice(0, 3).map((item) => ({ title: 'Review submission', meta: `${label(item.student)} - ${item.status}` })),
    ...meetings.map((item) => ({ title: 'Upcoming meeting', meta: `${item.title || 'Meeting'} - ${formatDate(item.startsAt)}` })),
    ...overdueMilestones.map((item) => ({ title: role === 'student' ? 'Milestone due' : 'Milestone needs attention', meta: `${item.title} - ${formatDate(item.dueAt)}` })),
  ].slice(0, 5);

  if (!items.length) return <TableState icon={CheckCircle2} text="No pending actions returned by current records." />;

  return (
    <div className="pending-list">
      {items.map((item, index) => (
        <article className="pending-item" key={`${item.title}-${index}`}>
          <span>{index + 1}</span>
          <div>
            <strong>{item.title}</strong>
            <p>{item.meta}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function ConfirmDialog({ open, title, description, confirmLabel, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-icon"><LogOut size={20} /></div>
        <h2 id="confirm-title">{title}</h2>
        <p>{description}</p>
        <div className="modal-actions">
          <button className="secondary-button" onClick={onCancel} type="button">Cancel</button>
          <button className="primary-button inline" onClick={onConfirm} type="button">{confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = (type, message) => {
    const id = crypto.randomUUID();
    setToasts((items) => [...items, { id, type, message }]);
    window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 3200);
  };
  const value = {
    success: (message) => push('success', message),
    error: (message) => push('error', message),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-relevant="additions">
        {toasts.map((toast) => (
          <div className={`toast toast-${toast.type}`} key={toast.id}>
            <span>{toast.message}</span>
            <button onClick={() => setToasts((items) => items.filter((item) => item.id !== toast.id))} type="button" aria-label="Dismiss notification">x</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function useToast() {
  return useContext(ToastContext) || { success: () => {}, error: () => {} };
}

function SubmissionFiles({ submission }) {
  const version = submission.versions?.find((item) => item.versionNumber === submission.currentVersion) || submission.versions?.at(-1);
  const files = version?.files?.length ? version.files : version?.file ? [version.file] : [];
  if (!files.length) return 'No files';

  return (
    <div className="file-link-list">
      {files.map((file) => (
        <a className="file-link" href={file.secureUrl} key={file.publicId || file.secureUrl} rel="noreferrer" target="_blank">
          <FileText size={14} />
          <span>{file.originalName}</span>
          <ExternalLink size={13} />
        </a>
      ))}
    </div>
  );
}

function FeedbackReplyForm({ submission, mutation }) {
  const [message, setMessage] = useState('');
  return (
    <form
      className="feedback-reply"
      onSubmit={(event) => {
        event.preventDefault();
        const cleanMessage = message.trim();
        if (!cleanMessage) return;
        mutation.mutate({ id: submission._id, message: cleanMessage }, {
          onSuccess: () => setMessage(''),
        });
      }}
    >
      <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Reply feedback" />
      <button className="small-button" disabled={mutation.isPending || !message.trim()} type="submit">
        <Send size={13} />Send
      </button>
    </form>
  );
}

function ReviewControls({ item, mutation }) {
  const [feedback, setFeedback] = useState('');
  return (
    <form className="review-controls" onSubmit={(event) => event.preventDefault()}>
      <input value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Feedback" />
      <button className="small-button" onClick={() => mutation.mutate({ id: item._id, payload: { decision: 'approved', feedback } })} type="button">
        <CheckCircle2 size={13} />Approve
      </button>
      <button className="small-button danger" onClick={() => mutation.mutate({ id: item._id, payload: { decision: 'changes_requested', feedback } })} type="button">
        Request changes
      </button>
    </form>
  );
}

function FullPageState({ title }) {
  return <div className="full-state">{title}</div>;
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] || 'unknown';
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function formatBytes(value) {
  if (!value) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / (1024 ** index)).toFixed(index ? 1 : 0)} ${units[index]}`;
}

function HomeRedirect() {
  const user = useSelector((state) => state.auth.user);
  return user && isSupportedRole(user.role) ? <Navigate to={`/${user.role}/dashboard`} replace /> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<ProtectedLayout />} />
        <Route path="/" element={<HomeRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </QueryClientProvider>
  );
}
