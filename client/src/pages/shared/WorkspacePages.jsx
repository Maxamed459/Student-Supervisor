import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import {
  Bell,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileText,
  GraduationCap,
  UserCog,
  Users,
} from 'lucide-react';
import { createResource, patchResource } from '../../services/apiClient';
import { useResource, useDashboardData } from '../../hooks/useResources';
import { useToast } from '../../context/ToastContext';
import { formatDate, label, countBy } from '../../utils/format';
import {
  ActivityFeed,
  Badge,
  Card,
  DataTable,
  MetricCard,
  MutationError,
  PageIntro,
  RefreshButton,
  StatusBars,
  TableState,
} from '../../components/common';
import { PendingActions, SummaryTile } from '../../components/dashboard';
import { GroupForm, MilestoneForm, RoomForm, SubmissionForm, UserForm } from '../../components/forms';
import { FeedbackReplyForm, ReviewControls, SubmissionFiles } from '../../components/submission';

export function Dashboard({ role }) {
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

export function UsersScreen({ allowCreate = false, roleFilter, title }) {
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

export function GroupsScreen({ allowManage = false }) {
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

export function AssignmentsScreen() {
  return <MilestonesScreen allowManage title="Assignments / Milestones" subtitle="Create and manage academic deliverables separately from supervision groups." />;
}

export function MilestonesScreen({ allowManage = false, title = 'Guidelines', subtitle = 'Proposal milestones and project guidelines from the backend.' }) {
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

export function SubmissionsScreen({ allowCreate = false, allowReview = false }) {
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

export function NotificationsScreen() {
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

export function AuditLogsScreen() {
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

export function ProfileScreen() {
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

export function SettingsScreen() {
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

export function StudentGroupScreen() {
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

export function StudentSupervisorScreen() {
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

export function StudentFeedbackScreen() {
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
