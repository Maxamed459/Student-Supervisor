import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  BarChart3,
  Bell,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileText,
  GraduationCap,
  Image as ImageIcon,
  LockKeyhole,
  Phone,
  Plus,
  UserCog,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import {
  changePasswordRequest,
  createResource,
  deleteResource,
  logoutRequest,
  patchResource,
  updateMe,
} from '../../services/apiClient';
import { useResource, useDashboardData, useGroupDetail, useAdminDashboard, useAdminReports } from '../../hooks/useResources';
import { useToast } from '../../context/useToast';
import { formatDate, label, getFileCategory, formatRelativeTime, formatAuditAction, auditActionBadgeValue } from '../../utils/format';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import {
  hasValidationErrors,
  validatePassword,
  validateRequired,
} from '../../utils/validation';
import { logout, setSession } from '../../store/slices/authSlice';
import {
  Badge,
  Card,
  DataTable,
  Field,
  FullPageState,
  MetricCard,
  MutationError,
  PageIntro,
  RefreshButton,
  StatusBars,
  TableState,
} from '../../components/common';
import { FormDialog } from '../../components/dialogs';
import { DashboardHeader, DashboardStatCard, DashboardCTACard, DashboardActivityChart, countCreatedToday } from '../../components/dashboard';
import { GroupForm, GuidelineForm, MilestoneForm, SubmissionForm, UserForm } from '../../components/forms';
import { FeedbackReplyForm, FileViewerDialog, ReviewControls, SubmissionFiles } from '../../components/submission';

// ----------------------- Dashboard -----------------------

export function Dashboard({ role }) {
  const user = useSelector((state) => state.auth.user);
  const data = useDashboardData(role);
  const adminDashboard = useAdminDashboard(role === 'admin');
  const submissions = data.submissions.data || [];
  const groups = data.groups.data || [];
  const milestones = data.milestones.data || [];
  const students = data.students.data || [];
  const pendingReviews = submissions.filter((item) => item.status === 'pending');
  const totals = adminDashboard.data?.totals || {};
  const activity = adminDashboard.data?.submissionActivity || {};

  const todaySubmissions = countCreatedToday(submissions);
  const todayMilestones = countCreatedToday(milestones);

  const welcomeName = user?.fullName?.split(' ')[0] || 'there';
  const subtitle = `Welcome back, ${welcomeName}. Have a look at any recent changes to your supervision workspace.`;

  const statCards = role === 'admin'
    ? [
        {
          key: 'groups',
          label: 'Groups',
          value: totals.totalGroups ?? groups.length,
          delta: todayMilestones ? `+${todayMilestones} today` : null,
          linkTo: '/admin/groups',
          tone: 'blue',
        },
        {
          key: 'students',
          label: 'Students',
          value: totals.totalStudents ?? students.length,
          delta: activity.pending ? `${activity.pending} pending reviews` : (todaySubmissions ? `+${todaySubmissions} today` : null),
          linkTo: '/admin/reports',
          tone: 'green',
        },
      ]
    : role === 'supervisor'
      ? [
          {
            key: 'groups',
            label: 'My Groups',
            value: groups.length,
            linkTo: '/supervisor/groups',
            tone: 'blue',
          },
          {
            key: 'reviews',
            label: 'Pending Reviews',
            value: pendingReviews.length,
            delta: pendingReviews.length ? `${pendingReviews.length} awaiting` : null,
            linkTo: '/supervisor/groups',
            tone: 'green',
          },
        ]
      : [
          {
            key: 'milestones',
            label: 'Milestones',
            value: milestones.length,
            linkTo: '/student/groups',
            tone: 'blue',
          },
          {
            key: 'submissions',
            label: 'Submissions',
            value: submissions.length,
            delta: todaySubmissions ? `+${todaySubmissions} today` : null,
            linkTo: '/student/groups',
            tone: 'green',
          },
        ];

  const cta = role === 'admin'
    ? {
        text: 'Review group progress, overdue milestones, and supervisor load in the reports workspace.',
        actionLabel: 'Open reports',
        actionTo: '/admin/reports',
      }
    : role === 'supervisor'
      ? {
          text: 'Review student submissions, publish milestones, and share guidelines with your group.',
          actionLabel: 'Open workspace',
          actionTo: groups[0]?._id ? `/supervisor/groups/${groups[0]._id}` : '/supervisor/groups',
        }
      : {
          text: 'Submit your deliverables against published milestones and track supervisor feedback.',
          actionLabel: 'Go to my group',
          actionTo: '/student/groups',
        };

  return (
    <section className="page-stack dashboard-page">
      <DashboardHeader subtitle={subtitle} />

      <div className="dash-stat-grid">
        {statCards.map((card) => (
          <DashboardStatCard
            key={card.key}
            delta={card.delta}
            label={card.label}
            linkTo={card.linkTo}
            tone={card.tone}
            value={card.value}
          />
        ))}
        <DashboardCTACard
          actionLabel={cta.actionLabel}
          actionTo={cta.actionTo}
          text={cta.text}
        />
      </div>

      <DashboardActivityChart submissions={submissions} />
    </section>
  );
}

function downloadCsv(filename, rows) {
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ----------------------- Admin reports -----------------------

export function ReportsScreen() {
  const groups = useResource('groups', true);
  const [groupId, setGroupId] = useState('');
  const reports = useAdminReports(groupId);
  const summary = reports.data?.summary || {};
  const groupRows = reports.data?.groups || [];
  const overdue = reports.data?.overdue || [];
  const supervisors = reports.data?.supervisors || [];
  const unassigned = reports.data?.unassignedStudents || [];

  const exportGroups = () => {
    downloadCsv('ssms-group-progress.csv', [
      ['Group', 'Code', 'Students', 'Supervisors', 'Milestones', 'Approved', 'Pending', 'Changes requested', 'Not submitted', 'Overdue', 'Completion %'],
      ...groupRows.map((row) => [
        row.name,
        row.code || '',
        row.studentCount,
        row.supervisorCount,
        row.milestoneCount,
        row.approved,
        row.pending,
        row.changesRequested,
        row.notSubmitted,
        row.overdueCount,
        row.completionPercent,
      ]),
    ]);
  };

  return (
    <section className="page-stack">
      <PageIntro
        title="Reports"
        subtitle="Platform progress aggregated from groups, milestones, and submissions. Nothing is stored as a separate report record."
      />

      <Card
        title="Filters"
        description={reports.data?.generatedAt ? `Generated ${formatDate(reports.data.generatedAt)}` : 'Live snapshot from current workspace data.'}
        action={(
          <div className="row-actions">
            <button className="primary-button inline" onClick={exportGroups} type="button">
              <Download size={15} />
              Export CSV
            </button>
            <RefreshButton queryKey={['adminReports']} />
          </div>
        )}
      >
        <div className="users-filters">
          <label className="field">
            <span>Group</span>
            <select onChange={(event) => setGroupId(event.target.value)} value={groupId}>
              <option value="">All groups</option>
              {(groups.data || []).map((group) => (
                <option key={group._id} value={group._id}>{group.code || group.name}</option>
              ))}
            </select>
          </label>
        </div>
        {reports.isError ? (
          <p className="field-error">
            {reports.error?.response?.data?.message || reports.error?.message || 'Failed to load reports.'}
          </p>
        ) : null}
      </Card>

      <div className="metric-grid">
        <MetricCard caption="Across the current filter" icon={Users} title="Students" value={summary.totalStudents ?? 0} />
        <MetricCard caption={`${summary.totalGroups ?? 0} groups`} icon={BookOpen} title="Groups" value={summary.totalGroups ?? 0} />
        <MetricCard caption={`${summary.completionPercent ?? 0}% approved vs expected`} icon={BarChart3} title="Completion" value={`${summary.completionPercent ?? 0}%`} />
        <MetricCard caption="Past due and not approved" icon={AlertCircle} title="Overdue" value={summary.overdue ?? 0} />
        <MetricCard caption="Students with no group" icon={UserRound} title="Unassigned" value={summary.unassignedStudents ?? 0} />
        <MetricCard caption="More than one version submitted" icon={FileText} title="Resubmitted" value={summary.resubmitted ?? 0} />
      </div>

      <Card title="Submission pipeline" description="Expected work is students × published milestones in the selected groups.">
        {reports.isLoading ? (
          <TableState text="Loading report…" />
        ) : (
          <StatusBars
            counts={{
              approved: summary.approved || 0,
              pending: summary.pending || 0,
              changes_requested: summary.changesRequested || 0,
              not_submitted: summary.notSubmitted || 0,
            }}
          />
        )}
      </Card>

      <Card title="Group progress">
        <DataTable
          columns={[
            ['Group', (row) => (
              <Link to={`/admin/groups/${row._id}`}>{row.name}</Link>
            )],
            ['Students', (row) => row.studentCount],
            ['Milestones', (row) => row.milestoneCount],
            ['Approved', (row) => row.approved],
            ['Pending', (row) => row.pending],
            ['Not submitted', (row) => row.notSubmitted],
            ['Overdue', (row) => row.overdueCount],
            ['Completion', (row) => `${row.completionPercent}%`],
          ]}
          data={groupRows}
          empty={{
            icon: BarChart3,
            title: 'No groups to report',
            text: 'Create a group and assign students to see progress here.',
          }}
          loading={reports.isLoading}
        />
      </Card>

      <Card title="Overdue work" description="Published milestones past their due date where the student is not approved.">
        <DataTable
          columns={[
            ['Student', (row) => (
              <div className="audit-actor-cell">
                <strong>{row.studentName}</strong>
                {row.studentEmail ? <small>{row.studentEmail}</small> : null}
              </div>
            )],
            ['Group', (row) => row.groupName],
            ['Milestone', (row) => row.milestoneTitle],
            ['Due', (row) => formatDate(row.dueDate)],
            ['Status', (row) => <Badge value={row.status} />],
          ]}
          data={overdue}
          empty={{
            icon: CheckCircle2,
            title: 'Nothing overdue',
            text: 'No published milestones are past due with unfinished student work.',
          }}
          loading={reports.isLoading}
        />
      </Card>

      <Card title="Supervisor load">
        <DataTable
          columns={[
            ['Supervisor', (row) => (
              <div className="audit-actor-cell">
                <strong>{row.fullName}</strong>
                {row.email ? <small>{row.email}</small> : null}
              </div>
            )],
            ['Groups', (row) => row.groupCount],
            ['Students', (row) => row.studentCount],
          ]}
          data={supervisors}
          empty="No supervisors to report."
          loading={reports.isLoading}
        />
      </Card>

      {!groupId ? (
        <Card title="Unassigned students" description="Students who are not in a group yet.">
          <DataTable
            columns={[
              ['Name', (row) => row.fullName],
              ['Email', (row) => row.email],
            ]}
            data={unassigned}
            empty="Every student is assigned to a group."
            loading={reports.isLoading}
          />
        </Card>
      ) : null}
    </section>
  );
}

// ----------------------- Users (single admin screen) -----------------------

export function UsersScreen({ allowCreate = false, title = 'Users' }) {
  const users = useResource('users', true);
  const groups = useResource('groups', true);
  const queryClient = useQueryClient();
  const toast = useToast();
  const [createdAccount, setCreatedAccount] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const { askConfirm, confirmDialog } = useConfirmDialog();

  const createMutation = useMutation({
    mutationFn: (payload) => createResource('/users', payload, 'user'),
    onSuccess: (response) => {
      const password = response?.password || response?.user?.password;
      const user = response?.user || response;
      setCreatedAccount({ user, password });
      setCreateOpen(false);
      toast.success('Account created');
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => patchResource(`/users/${id}`, payload, 'user'),
    onSuccess: () => {
      toast.success('User updated');
      setEditing(null);
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteResource(`/users/${id}`),
    onSuccess: () => {
      toast.success('User deleted');
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });

  const filteredUsers = useMemo(() => {
    const all = users.data || [];
    return all.filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false;
      if (groupFilter) {
        const userGroupId = u.group?._id
          || (typeof u.groupId === 'string' ? u.groupId : u.groupId?._id);
        if (userGroupId !== groupFilter) return false;
      }
      return true;
    });
  }, [users.data, roleFilter, groupFilter]);

  return (
    <section className="page-stack">
      <PageIntro
        title={title}
        subtitle="Create, edit, deactivate, or remove accounts. Group membership is managed from the Groups screen."
      />
      <FormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create account"
        subtitle="Set up a new student, supervisor, or administrator account."
        icon={UserRound}
      >
        <UserForm
          groups={groups.data || []}
          onSubmit={(payload) => createMutation.mutate(payload)}
          pending={createMutation.isPending}
        />
        <MutationError mutation={createMutation} />
      </FormDialog>
      <FormDialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing ? `Edit ${editing.fullName}` : 'Edit user'}
        subtitle="Update user details, role assignment, or status."
        icon={UserRound}
      >
        {editing ? (
          <UserForm
            key={editing._id}
            groups={groups.data || []}
            initial={editing}
            submitLabel="Save changes"
            onSubmit={(payload) => updateMutation.mutate({
              id: editing._id,
              payload: {
                fullName: payload.fullName,
                phone: payload.phone,
                isActive: payload.isActive,
                groupId: payload.groupId,
              },
            })}
            pending={updateMutation.isPending}
          />
        ) : null}
        <MutationError mutation={updateMutation} />
      </FormDialog>
      <Card
        title={`${title} list`}
        action={(
          <div className="row-actions">
            {allowCreate ? (
              <button
                className="primary-button inline"
                onClick={() => {
                  setEditing(null);
                  setCreateOpen(true);
                }}
                type="button"
              >
                <Plus size={15} />Add user
              </button>
            ) : null}
            <RefreshButton queryKey={['users']} />
          </div>
        )}
      >
        <div className="users-filters">
          <label className="field">
            <span>Filter by role</span>
            <select
              onChange={(event) => setRoleFilter(event.target.value)}
              value={roleFilter}
            >
              <option value="">All roles</option>
              <option value="admin">Admin</option>
              <option value="supervisor">Supervisor</option>
              <option value="student">Student</option>
            </select>
          </label>
          <label className="field">
            <span>Filter by group</span>
            <select
              onChange={(event) => setGroupFilter(event.target.value)}
              value={groupFilter}
            >
              <option value="">All groups</option>
              <option value="__none__">No group</option>
              {(groups.data || []).map((g) => (
                <option key={g._id} value={g._id}>{g.code || g.name}</option>
              ))}
            </select>
          </label>
          <span className="users-filter-count">
            {filteredUsers.length} of {users.data?.length || 0} users
          </span>
        </div>
        <DataTable
          columns={[
            ['Name', (item) => item.fullName],
            ['Email', (item) => item.email],
            ['Role', (item) => <Badge value={item.role} />],
            ['Group', (item) => label(item.group)],
            ['Status', (item) => <Badge value={item.status} />],
            ['Last Login', (item) => formatDate(item.lastLoginAt)],
            ['Actions', (item) => (
              <div className="row-actions">
                <button
                  className="small-button"
                  onClick={() => {
                    setCreateOpen(false);
                    setEditing(item);
                  }}
                  type="button"
                >
                  Edit
                </button>
                <button
                  className="small-button danger"
                  onClick={async () => {
                    if (await askConfirm({
                      title: `Delete ${item.fullName}?`,
                      description: 'This account will be permanently removed from the system.',
                      confirmLabel: 'Delete user',
                      destructive: true,
                    })) deleteMutation.mutate(item._id);
                  }}
                  type="button"
                >
                  Delete
                </button>
              </div>
            )],
          ]}
          data={filteredUsers}
          empty={
            roleFilter || groupFilter
              ? { icon: Users, title: 'No matches', text: 'No users match the current filters. Try adjusting your role or group filter.' }
              : {
                  icon: Users,
                  title: 'No users yet',
                  text: 'Create student, supervisor, and administrator accounts to get started.',
                  ...(allowCreate ? { actionLabel: 'Add user', onAction: () => { setEditing(null); setCreateOpen(true); } } : {}),
                }
          }
          loading={users.isLoading}
        />
      </Card>
      {createdAccount ? (
        <CreatedAccountDialog
          account={createdAccount}
          onClose={() => setCreatedAccount(null)}
        />
      ) : null}
      {confirmDialog}
    </section>
  );
}

function CreatedAccountDialog({ account, onClose }) {
  const { user, password } = account;
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password || '');
      setCopied(true);
      toast.success('Password copied to clipboard');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy. Select and copy manually.');
    }
  };
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal-panel reset-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="created-account-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-icon"><CheckCircle2 size={20} /></div>
        <h2 id="created-account-title">Account created</h2>
        <p>
          Share these credentials with the new {user?.role || 'user'}, or let them check their
          email — a welcome message with these details has been sent automatically. The password
          shown here is only available once.
        </p>
        <div className="reset-form">
          <div className="field">
            <span>Name</span>
            <div className="input-shell"><strong>{user?.fullName}</strong></div>
          </div>
          <div className="field">
            <span>Email</span>
            <div className="input-shell"><strong>{user?.email}</strong></div>
          </div>
          <div className="field">
            <span>Password</span>
            <div className="input-shell has-icon" style={{ gap: 8 }}>
              <LockKeyhole size={16} strokeWidth={2.1} />
              <input
                readOnly
                aria-label="Generated password"
                onFocus={(event) => event.target.select()}
                value={password || ''}
              />
              <button
                aria-label="Copy password"
                className="icon-button compact"
                onClick={copy}
                style={{ marginLeft: 'auto' }}
                type="button"
              >
                <Copy size={15} />
              </button>
            </div>
            <small>{copied ? 'Copied!' : 'Click the copy icon to copy the password.'}</small>
          </div>
        </div>
        <div className="modal-actions">
          <button className="primary-button inline" onClick={onClose} type="button">Done</button>
        </div>
      </section>
    </div>
  );
}

// ----------------------- Groups (admin) -----------------------

export function GroupsScreen({ allowManage = false }) {
  const groups = useResource('groups', true);
  const users = useResource('users', allowManage);
  const queryClient = useQueryClient();
  const toast = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const { askConfirm, confirmDialog } = useConfirmDialog();

  const groupMutation = useMutation({
    mutationFn: (payload) => createResource('/groups', payload, 'group'),
    onSuccess: () => {
      toast.success('Group created');
      setCreateOpen(false);
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });
  const updateGroupMutation = useMutation({
    mutationFn: ({ id, payload }) => patchResource(`/groups/${id}`, payload, 'group'),
    onSuccess: () => {
      toast.success('Group updated');
      setEditingGroup(null);
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });
  const deleteGroupMutation = useMutation({
    mutationFn: (id) => deleteResource(`/groups/${id}`),
    onSuccess: () => {
      toast.success('Group deleted');
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });

  return (
    <section className="page-stack">
      <PageIntro title="Groups" subtitle="Groups are the shared workspace that connects students and supervisors." />
      <FormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create group"
        subtitle="Set up a new student-supervisor group workspace."
        icon={BookOpen}
        panelClassName="modal-panel--group"
      >
        <GroupForm
          users={users.data || []}
          onSubmit={(payload) => groupMutation.mutate(payload)}
          pending={groupMutation.isPending}
        />
        <MutationError mutation={groupMutation} />
      </FormDialog>
      <FormDialog
        open={Boolean(editingGroup)}
        onClose={() => setEditingGroup(null)}
        title={editingGroup ? `Edit ${editingGroup.name}` : 'Edit group'}
        subtitle="Update group name, code, description, and supervisor assignments."
        icon={BookOpen}
        panelClassName="modal-panel--group"
      >
        {editingGroup ? (
          <GroupForm
            key={editingGroup._id}
            initial={editingGroup}
            users={users.data || []}
            onSubmit={(payload) => updateGroupMutation.mutate({ id: editingGroup._id, payload })}
            pending={updateGroupMutation.isPending}
            submitLabel="Save changes"
          />
        ) : null}
        <MutationError mutation={updateGroupMutation} />
      </FormDialog>
      <Card
        title="Groups"
        action={(
          <div className="row-actions">
            {allowManage ? (
              <button
                className="primary-button inline"
                onClick={() => {
                  setEditingGroup(null);
                  setCreateOpen(true);
                }}
                type="button"
              >
                <Plus size={15} />Create group
              </button>
            ) : null}
            <RefreshButton queryKey={['groups']} />
          </div>
        )}
      >
        <DataTable
          columns={[
            ['Code', (item) => item.code],
            ['Name', (item) => (
              <div>
                <strong>{item.name}</strong>
                {item.description ? <p className="muted" style={{ margin: '2px 0 0', fontSize: 12 }}>{item.description}</p> : null}
              </div>
            )],
            ['Supervisor', (item) => item.supervisors?.length > 0
              ? item.supervisors.map((s) => s.fullName).join(', ')
              : 'No supervisor'],
            ['Students', (item) => `${item.studentCount ?? item.students?.length ?? 0}`],
            ['Workspace', (item) => (
              <GroupWorkspaceLink groupId={item._id} />
            )],
            allowManage ? ['Actions', (item) => (
              <div className="row-actions">
                <button
                  className="small-button"
                  onClick={() => {
                    setCreateOpen(false);
                    setEditingGroup(item);
                  }}
                  type="button"
                >
                  Edit
                </button>
                <button
                  className="small-button danger"
                  onClick={async () => {
                    if (await askConfirm({
                      title: `Delete group "${item.name}"?`,
                      description: 'Assigned students and supervisors will be detached from this group.',
                      confirmLabel: 'Delete group',
                      destructive: true,
                    })) {
                      deleteGroupMutation.mutate(item._id);
                    }
                  }}
                  type="button"
                >
                  Delete
                </button>
              </div>
            )] : null,
          ].filter(Boolean)}
          data={groups.data || []}
          empty={
            allowManage
              ? {
                  icon: BookOpen,
                  title: 'No groups yet',
                  text: 'Groups connect students and supervisors in a shared workspace.',
                  actionLabel: 'Create group',
                  onAction: () => { setEditingGroup(null); setCreateOpen(true); },
                }
              : { icon: BookOpen, title: 'No groups', text: 'You are not assigned to any group yet.' }
          }
          loading={groups.isLoading}
        />
      </Card>
      {confirmDialog}
    </section>
  );
}

// ----------------------- Supervisor: My students -----------------------

export function StudentsScreen({ title = 'My students' }) {
  // The /supervisors/:id/students endpoint returns every student across
  // every Group the supervisor belongs to, with the student's groupId
  // populated (see useResources.js → name === 'students', supervisor
  // branch). Per-Group filtering happens here on the client because
  // a supervisor in multiple groups needs to scope their view.
  const studentsResource = useResource('students', true);
  const groups = useResource('groups', true);
  const [activeGroupId, setActiveGroupId] = useState(null);

  const allStudents = useMemo(() => studentsResource.data || [], [studentsResource.data]);
  const myGroups = useMemo(() => groups.data || [], [groups.data]);
  const scopedGroupId = activeGroupId
    || (myGroups.length === 1 ? myGroups[0]._id : null);

  const visibleStudents = useMemo(() => {
    if (!scopedGroupId) return allStudents;
    return allStudents.filter((student) => {
      const groupId = student.group?._id
        || (typeof student.groupId === 'string' ? student.groupId : student.groupId?._id);
      return groupId === scopedGroupId;
    });
  }, [allStudents, scopedGroupId]);

  return (
    <section className="page-stack">
      <PageIntro
        title={title}
        subtitle="Students in the groups you supervise."
      />
      {myGroups.length > 1 ? (
        <Card title="Scope">
          <label className="field">
            <span>Group</span>
            <select
              onChange={(event) => setActiveGroupId(event.target.value || null)}
              value={scopedGroupId || ''}
            >
              <option value="">All my groups</option>
              {myGroups.map((g) => (
                <option key={g._id} value={g._id}>{g.code || g.name}</option>
              ))}
            </select>
          </label>
        </Card>
      ) : null}
      <Card
        title={`Students (${visibleStudents.length})`}
        action={<RefreshButton queryKey={['students', '/supervisors']} />}
      >
        <DataTable
          columns={[
            ['Name', (item) => item.fullName],
            ['Email', (item) => <a href={`mailto:${item.email}`}>{item.email}</a>],
            ['Group', (item) => label(item.group)],
            ['Status', (item) => <Badge value={item.status || (item.isActive === false ? 'inactive' : 'active')} />],
            ['Last login', (item) => formatDate(item.lastLoginAt)],
          ]}
          data={visibleStudents}
          empty={scopedGroupId
            ? 'No students in this group yet.'
            : 'No students in any of your groups yet.'}
          loading={studentsResource.isLoading}
        />
      </Card>
    </section>
  );
}

// ----------------------- Milestones -----------------------

export function MilestonesScreen({
  allowManage = false,
  scope = 'group',
  title = 'Milestones',
  subtitle = 'Milestones published for your group.',
}) {
  const milestones = useResource('milestones', true);
  const groups = useResource('groups', allowManage);
  const queryClient = useQueryClient();
  const toast = useToast();
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const { askConfirm, confirmDialog } = useConfirmDialog();

  const mutation = useMutation({
    mutationFn: (payload) => createResource('/milestones', payload, 'milestone'),
    onSuccess: () => {
      toast.success('Milestone published');
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => patchResource(`/milestones/${id}`, payload, 'milestone'),
    onSuccess: () => {
      toast.success('Milestone updated');
      setEditingMilestone(null);
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteResource(`/milestones/${id}`),
    onSuccess: () => {
      toast.success('Milestone deleted');
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });

  // For supervisors in multiple groups, scope the visible milestones
  // and the "publish" form to one group at a time. A student sees
  // their own group's milestones only — no switcher needed.
  const visibleGroups = useMemo(() => (groups.data || []).filter(Boolean), [groups.data]);
  const scopedGroupId = activeGroupId
    || (visibleGroups.length === 1 ? visibleGroups[0]._id : null);

  const visibleMilestones = useMemo(() => {
    const items = milestones.data || [];
    if (scope === 'group' && scopedGroupId) {
      return items.filter((item) => {
        const groupId = item.group?._id || item.groupId;
        return groupId === scopedGroupId;
      });
    }
    return items;
  }, [milestones.data, scope, scopedGroupId]);

  return (
    <section className="page-stack">
      <PageIntro title={title} subtitle={subtitle} />
      {allowManage && visibleGroups.length > 1 ? (
        <Card title="Scope">
          <label className="field">
            <span>Group</span>
            <select
              onChange={(event) => setActiveGroupId(event.target.value || null)}
              value={scopedGroupId || ''}
            >
              <option value="">Select a group</option>
              {visibleGroups.map((g) => (
                <option key={g._id} value={g._id}>{g.code || g.name}</option>
              ))}
            </select>
          </label>
        </Card>
      ) : null}
      <FormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Publish milestone"
        subtitle="Define deliverables, due dates, and review requirements."
        icon={ClipboardList}
      >
        <MilestoneForm
          groups={scopedGroupId ? visibleGroups.filter((g) => g._id === scopedGroupId) : visibleGroups}
          onSubmit={(payload) => mutation.mutate({ ...payload, group: scopedGroupId || payload.group })}
          pending={mutation.isPending}
          disabled={!scopedGroupId && visibleGroups.length !== 1}
        />
        <MutationError mutation={mutation} />
      </FormDialog>
      <FormDialog
        open={Boolean(editingMilestone)}
        onClose={() => setEditingMilestone(null)}
        title="Edit milestone"
        subtitle="Update deliverable details and deadline."
        icon={ClipboardList}
      >
        {editingMilestone ? (
          <MilestoneForm
            initial={editingMilestone}
            groups={visibleGroups}
            onSubmit={(payload) => updateMutation.mutate({ id: editingMilestone._id, payload })}
            pending={updateMutation.isPending}
            submitLabel="Save changes"
          />
        ) : null}
        <MutationError mutation={updateMutation} />
      </FormDialog>
      <Card
        title="Milestones"
        action={(
          <div className="row-actions">
            {allowManage ? (
              <button
                className="primary-button inline"
                disabled={!scopedGroupId && visibleGroups.length !== 1}
                onClick={() => setCreateOpen(true)}
                type="button"
              >
                <Plus size={15} />Publish milestone
              </button>
            ) : null}
            <RefreshButton queryKey={['milestones']} />
          </div>
        )}
      >
        <DataTable
          columns={[
            ['Order', (item) => item.order],
            ['Title', (item) => item.title],
            ['Group', (item) => label(item.group)],
            ['Due', (item) => formatDate(item.dueAt || item.dueDate)],
            ['Status', (item) => <Badge value={item.status || 'published'} />],
            allowManage ? ['Actions', (item) => (
              <div className="row-actions">
                <button
                  className="small-button"
                  onClick={() => setEditingMilestone(item)}
                  type="button"
                >
                  Edit
                </button>
                <button
                  className="small-button danger"
                  onClick={async () => {
                    if (await askConfirm({
                      title: `Delete milestone "${item.title}"?`,
                      description: 'Students will no longer see this milestone in their workspace.',
                      confirmLabel: 'Delete milestone',
                      destructive: true,
                    })) {
                      deleteMutation.mutate(item._id);
                    }
                  }}
                  type="button"
                >
                  Delete
                </button>
              </div>
            )] : null,
          ].filter(Boolean)}
          data={visibleMilestones}
          empty={
            scopedGroupId
              ? {
                  icon: ClipboardList,
                  title: 'No milestones yet',
                  text: allowManage
                    ? 'Publish a milestone to set deliverables and due dates for this group.'
                    : 'Your supervisor has not published any milestones for this group yet.',
                  ...(allowManage ? { actionLabel: 'Publish milestone', onAction: () => setCreateOpen(true) } : {}),
                }
              : { icon: ClipboardList, title: 'No milestones', text: 'Select a group to view its milestones.' }
          }
          loading={milestones.isLoading}
        />
      </Card>
      {confirmDialog}
    </section>
  );
}

export function AssignmentsScreen() {
  return <MilestonesScreen scope="group" title="Assignments / Milestones" subtitle="Academic deliverables published by your supervisors for your group." />;
}

// ----------------------- Submissions -----------------------

export function SubmissionsScreen({ allowCreate = false, allowReview = false, scope = 'group' }) {
  const submissions = useResource('submissions', true);
  const milestones = useResource('milestones', true);
  const groups = useResource('groups', true);
  const queryClient = useQueryClient();
  const toast = useToast();
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState(null);
  const { askConfirm, confirmDialog } = useConfirmDialog();

  const visibleGroups = useMemo(() => (groups.data || []).filter(Boolean), [groups.data]);
  const scopedGroupId = activeGroupId
    || (visibleGroups.length === 1 ? visibleGroups[0]._id : null);

  const visibleSubmissions = useMemo(() => {
    const items = submissions.data || [];
    if (scope === 'group' && scopedGroupId) {
      return items.filter((item) => {
        const groupId = item.group
          || item.milestone?.group
          || item.student?.group
          || item.milestoneId?.groupId;
        return groupId && (groupId === scopedGroupId || groupId._id === scopedGroupId);
      });
    }
    return items;
  }, [submissions.data, scope, scopedGroupId]);

  const createMutation = useMutation({
    mutationFn: (payload) => createResource('/submissions', payload, 'submission'),
    onSuccess: () => {
      toast.success('Submission sent');
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });

  const updateSubmissionMutation = useMutation({
    mutationFn: ({ id, payload }) => patchResource(`/submissions/${id}`, payload, 'submission'),
    onSuccess: () => {
      toast.success('Submission updated');
      setEditingSubmission(null);
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });

  const deleteSubmissionMutation = useMutation({
    mutationFn: (id) => deleteResource(`/submissions/${id}`),
    onSuccess: () => {
      toast.success('Submission deleted');
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, payload }) => {
      const path = payload.decision === 'approved'
        ? `/submissions/${id}/approve`
        : `/submissions/${id}/request-changes`;
      return patchResource(path, { comment: payload.feedback }, 'submission');
    },
    onSuccess: () => {
      toast.success('Review saved');
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });

  return (
    <section className="page-stack">
      <PageIntro title="Submissions" subtitle="Submissions and feedback in your group." />
      {allowCreate && visibleGroups.length > 1 ? (
        <Card title="Scope">
          <label className="field">
            <span>Group</span>
            <select
              onChange={(event) => setActiveGroupId(event.target.value || null)}
              value={scopedGroupId || ''}
            >
              <option value="">Select a group</option>
              {visibleGroups.map((g) => (
                <option key={g._id} value={g._id}>{g.code || g.name}</option>
              ))}
            </select>
          </label>
        </Card>
      ) : null}
      <FormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Submit project"
        subtitle="Upload and submit your deliverables for milestone review."
        icon={FileText}
      >
        <SubmissionForm
          groups={scopedGroupId ? visibleGroups.filter((g) => g._id === scopedGroupId) : visibleGroups}
          milestones={milestones.data || []}
          onSubmit={(payload) => createMutation.mutate({ ...payload, group: scopedGroupId || payload.group })}
          pending={createMutation.isPending}
          disabled={!scopedGroupId && visibleGroups.length !== 1}
        />
        <MutationError mutation={createMutation} />
      </FormDialog>
      <FormDialog
        open={Boolean(editingSubmission)}
        onClose={() => setEditingSubmission(null)}
        title="Edit submission"
        subtitle="Update your attached deliverables or notes."
        icon={FileText}
      >
        {editingSubmission ? (
          <SubmissionForm
            initial={editingSubmission}
            groups={scopedGroupId ? visibleGroups.filter((g) => g._id === scopedGroupId) : visibleGroups}
            milestones={milestones.data || []}
            onSubmit={(payload) => updateSubmissionMutation.mutate({ id: editingSubmission._id, payload })}
            pending={updateSubmissionMutation.isPending}
            submitLabel="Save changes"
          />
        ) : null}
        <MutationError mutation={updateSubmissionMutation} />
      </FormDialog>
      <Card
        title="Submission history"
        action={(
          <div className="row-actions">
            {allowCreate ? (
              <button
                className="primary-button inline"
                disabled={!scopedGroupId && visibleGroups.length !== 1}
                onClick={() => setCreateOpen(true)}
                type="button"
              >
                <Plus size={15} />Submit work
              </button>
            ) : null}
            <RefreshButton queryKey={['submissions']} />
          </div>
        )}
      >
        <DataTable
          columns={[
            ['Milestone', (item) => label(item.milestone || item.milestoneId)],
            ['Student', (item) => label(item.student || item.studentId)],
            ['Group', (item) => label(item.group)],
            ['Version', (item) => item.currentVersion || item.versions?.length || 1],
            ['Files', (item) => <SubmissionFiles submission={item} />],
            ['Status', (item) => <Badge value={item.status} />],
            ['Updated', (item) => formatDate(item.updatedAt)],
            allowReview ? ['Review', (item) => <ReviewControls item={item} mutation={reviewMutation} />] : null,
            allowCreate ? ['Actions', (item) => (
              <div className="row-actions">
                {item.status !== 'approved' ? (
                  <button
                    className="small-button"
                    onClick={() => setEditingSubmission(item)}
                    type="button"
                  >
                    Edit
                  </button>
                ) : null}
                <button
                  className="small-button danger"
                  onClick={async () => {
                    if (await askConfirm({
                      title: 'Delete this submission?',
                      description: 'Uploaded files and review history for this submission will be removed.',
                      confirmLabel: 'Delete submission',
                      destructive: true,
                    })) {
                      deleteSubmissionMutation.mutate(item._id);
                    }
                  }}
                  type="button"
                >
                  Delete
                </button>
              </div>
            )] : null,
          ].filter(Boolean)}
          data={visibleSubmissions}
          empty={
            scopedGroupId
              ? {
                  icon: FileText,
                  title: 'No submissions yet',
                  text: allowCreate
                    ? 'Upload your project files against a published milestone to begin the review cycle.'
                    : 'No student submissions have been recorded for this group yet.',
                  ...(allowCreate ? { actionLabel: 'Submit work', onAction: () => setCreateOpen(true) } : {}),
                }
              : { icon: FileText, title: 'No submissions', text: 'Select a group to view submission history.' }
          }
          loading={submissions.isLoading}
        />
      </Card>
      {confirmDialog}
    </section>
  );
}

// ----------------------- Notifications -----------------------

export function NotificationsScreen() {
  const notifications = useResource('notifications', true);
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
  const markAllMutation = useMutation({
    mutationFn: () => patchResource('/notifications/read-all', {}, 'notifications'),
    onSuccess: () => {
      toast.success('All notifications marked read');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });

  return (
    <section className="page-stack">
      <PageIntro title="Notifications" subtitle="Notification center for supervision updates." />
      <Card
        title="Notification center"
        action={(
          <button
            className="small-button"
            onClick={() => markAllMutation.mutate()}
            type="button"
          >
            Mark all read
          </button>
        )}
      >
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
          empty={{
            icon: Bell,
            title: 'All caught up',
            text: 'You have no notifications right now. Updates about milestones, reviews, and submissions will appear here.',
          }}
          loading={notifications.isLoading}
        />
      </Card>
    </section>
  );
}

// ----------------------- Audit Logs -----------------------

export function AuditLogsScreen() {
  const auditLogs = useResource('auditLogs', true);

  const formatDetails = (item) => {
    const parts = [];
    if (item.entityId) parts.push(`Target: ${item.entityId}`);
    if (item.metadata?.ipAddress) parts.push(`IP: ${item.metadata.ipAddress}`);
    if (item.metadata?.fields) parts.push(`Fields: ${Object.keys(item.metadata.fields).join(', ')}`);
    if (item.metadata?.note) parts.push(item.metadata.note);
    return parts.length ? parts.join(' · ') : '—';
  };

  return (
    <section className="page-stack">
      <PageIntro title="Audit logs" subtitle="Recent backend audit records." />
      <Card title="System activity">
        <DataTable
          columns={[
            ['Action', (item) => <Badge value={auditActionBadgeValue(item.action)} />],
            ['Entity type', (item) => item.entityType || '—'],
            ['Actor', (item) => (
              <div className="audit-actor-cell">
                <strong>{item.actor?.fullName || item.actorLabel || 'System'}</strong>
                {item.actor?.email ? <small>{item.actor.email}</small> : null}
              </div>
            )],
            ['Timestamp', (item) => (
              <div className="audit-time-cell">
                <strong>{formatRelativeTime(item.createdAt)}</strong>
                <small>{formatDate(item.createdAt)}</small>
              </div>
            )],
            ['Details', (item) => formatDetails(item)],
          ]}
          data={auditLogs.data || []}
          empty={{
            icon: ClipboardList,
            title: 'No activity recorded',
            text: 'Audit records will appear here as users create, update, or delete resources in the system.',
          }}
          loading={auditLogs.isLoading}
        />
      </Card>
    </section>
  );
}

// ----------------------- Profile -----------------------

export function ProfileScreen() {
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ fullName: user.fullName || '', phone: user.phone || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  const updateMutation = useMutation({
    mutationFn: updateMe,
    onSuccess: (freshUser) => {
      dispatch(setSession({ user: freshUser, accessToken: token }));
      toast.success('Profile updated');
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });

  const changePasswordMutation = useMutation({
    mutationFn: changePasswordRequest,
    onSuccess: async () => {
      toast.success('Password changed. Please log in again with your new password.');
      await logoutRequest();
      dispatch(logout());
      navigate('/login', { replace: true });
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });

  const submitProfile = (event) => {
    event.preventDefault();
    const nextErrors = { fullName: validateRequired(form.fullName, 'Full name') };
    setProfileErrors(nextErrors);
    if (hasValidationErrors(nextErrors)) {
      toast.error('Please fill in all required fields correctly.');
      return;
    }
    updateMutation.mutate({ fullName: form.fullName, phone: form.phone });
  };

  const submitPassword = (event) => {
    event.preventDefault();
    const nextErrors = {
      currentPassword: validateRequired(pwForm.currentPassword, 'Current password'),
      newPassword: validatePassword(pwForm.newPassword),
      confirmPassword: pwForm.newPassword !== pwForm.confirmPassword ? 'Passwords do not match.' : '',
    };
    setPasswordErrors(nextErrors);
    if (hasValidationErrors(nextErrors)) {
      toast.error('Please fill in all required fields correctly.');
      return;
    }
    changePasswordMutation.mutate({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
  };

  return (
    <section className="page-stack">
      <PageIntro title="Profile" subtitle="Manage your account details and password." />
      <Card title="Account">
        <dl className="profile-grid">
          <dt>Email</dt><dd>{user.email}</dd>
          <dt>Role</dt><dd><Badge value={user.role} /></dd>
          <dt>Status</dt><dd><Badge value={user.status} /></dd>
          <dt>Group</dt><dd>{label(user.group)}</dd>
        </dl>
      </Card>
      <Card title="Edit profile">
        <form className="form-grid" onSubmit={submitProfile}>
          <Field icon={UserRound} label="Full name" error={profileErrors.fullName}>
            <input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} placeholder="Enter full legal name" />
          </Field>
          <Field icon={Phone} label="Phone (optional)">
            <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+252 6xxxxxxxx" />
          </Field>
          <div className="form-actions">
            <button className="primary-button inline" disabled={updateMutation.isPending} type="submit">
              {updateMutation.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
        <MutationError mutation={updateMutation} />
      </Card>
      <Card title="Change password">
        <form className="form-grid" onSubmit={submitPassword}>
          <Field icon={LockKeyhole} label="Current password" error={passwordErrors.currentPassword}>
            <input type="password" value={pwForm.currentPassword} onChange={(event) => setPwForm({ ...pwForm, currentPassword: event.target.value })} placeholder="Your current password" />
          </Field>
          <Field icon={LockKeyhole} label="New password" help="Minimum 8 characters" error={passwordErrors.newPassword}>
            <input type="password" value={pwForm.newPassword} onChange={(event) => setPwForm({ ...pwForm, newPassword: event.target.value })} placeholder="Choose a new password" />
          </Field>
          <Field icon={LockKeyhole} label="Confirm new password" error={passwordErrors.confirmPassword}>
            <input type="password" value={pwForm.confirmPassword} onChange={(event) => setPwForm({ ...pwForm, confirmPassword: event.target.value })} placeholder="Repeat the new password" />
          </Field>
          <div className="form-actions">
            <button className="primary-button inline" disabled={changePasswordMutation.isPending} type="submit">
              {changePasswordMutation.isPending ? 'Saving…' : 'Change password'}
            </button>
          </div>
        </form>
        <MutationError mutation={changePasswordMutation} />
      </Card>
    </section>
  );
}

// ----------------------- Student-specific -----------------------

export function StudentGroupScreen() {
  const groups = useResource('groups', true);
  const group = groups.data?.[0];
  return (
    <section className="page-stack">
      <PageIntro title="My group" subtitle="Your active supervision group and members." />
      <Card title={group ? `${group.code || ''} ${group.name}`.trim() || 'Group details' : 'Group details'}>
        {group ? (
          <div className="student-detail-grid">
            <SummaryTile
              title="Supervisor"
              value={group.supervisors?.length > 1
                ? `${group.supervisors.length} supervisors`
                : label(group.supervisor)}
              caption={group.supervisors?.length > 1
                ? 'Multiple supervisors share your group'
                : (group.supervisor?.email || 'Assigned group supervisor')}
            />
            <SummaryTile title="Members" value={`${group.studentCount ?? group.students?.length ?? 0} students`} caption="Students in your group" />
            <div>
              <h4>Supervisors</h4>
              <div className="member-list">
                {(group.supervisors || []).map((sup) => (
                  <article key={sup._id} className="member-row">
                    <span><UserCog size={14} /></span>
                    <div><strong>{sup.fullName}</strong><p>{sup.email}</p></div>
                  </article>
                ))}
              </div>
            </div>
            <div>
              <h4>Students</h4>
              <div className="member-list">
                {(group.students || []).map((student) => (
                  <article key={student._id} className="member-row">
                    <span>{student.fullName?.slice(0, 1) || 'S'}</span>
                    <div><strong>{student.fullName}</strong><p>{student.email}</p></div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        ) : <TableState icon={Users} text="No active group returned by the API." />}
      </Card>
    </section>
  );
}

export function StudentSupervisorScreen() {
  const groups = useResource('groups', true);
  const group = groups.data?.[0];
  const supervisors = group?.supervisors || (group?.supervisor ? [group.supervisor] : []);
  return (
    <section className="page-stack">
      <PageIntro title="My supervisor" subtitle="Supervisors assigned through your active group." />
      <Card title="Supervisor(s)">
        {supervisors.length === 0 ? (
          <TableState icon={UserCog} text="No supervisor returned by your group record." />
        ) : (
          <div className="student-detail-grid">
            {supervisors.map((sup) => (
              <dl className="profile-grid" key={sup._id}>
                <dt>Name</dt><dd>{sup.fullName}</dd>
                <dt>Email</dt><dd>{sup.email}</dd>
                <dt>Role</dt><dd><Badge value={sup.role} /></dd>
              </dl>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}

export function StudentFeedbackScreen() {
  const submissions = useResource('submissions', true);
  const queryClient = useQueryClient();
  const toast = useToast();
  const mutation = useMutation({
    mutationFn: ({ id, message }) => createResource(`/submissions/${id}/comments`, { message }, 'submission'),
    onSuccess: () => {
      toast.success('Feedback submitted');
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });
  return (
    <section className="page-stack">
      <PageIntro title="Feedback" subtitle="Supervisor decisions and feedback from your submissions." />
      <Card title="Feedback history">
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

// ----------------------- Group Workspace link helper -----------------------

// Renders a row action in GroupsScreen linking to the group workspace.
function GroupWorkspaceLink({ groupId }) {
  const user = useSelector((state) => state.auth.user);
  const role = user?.role || 'admin';
  return (
    <Link className="small-button" to={`/${role}/groups/${groupId}`}>Open workspace</Link>
  );
}

// ----------------------- Group Workspace -----------------------

// FR-S2 (publish), FR-T3/T4 (submit), FR-S5/S6 (review) — all scoped to one Group.
// Supervisor: sees roster + guideline upload + milestone publish + submissions with ReviewControls.
// Student:    sees roster + guidelines (read-only) + milestones (read-only) + SubmissionForm.
// Admin:      sees roster + milestones + submissions (read-only, for oversight).
export function GroupWorkspaceScreen({ role: roleProp }) {
  const { id: groupId } = useParams();
  const user = useSelector((state) => state.auth.user);
  const role = roleProp || user?.role;
  const queryClient = useQueryClient();
  const toast = useToast();
  const [guidelineOpen, setGuidelineOpen] = useState(false);
  const [editingGuideline, setEditingGuideline] = useState(null);
  const [milestoneOpen, setMilestoneOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const { askConfirm, confirmDialog } = useConfirmDialog();

  // ---- Data ----
  const groupQuery = useGroupDetail(groupId);
  const milestonesQuery = useResource('milestones', true);
  const submissionsQuery = useResource('submissions', true);

  const group = groupQuery.data;

  // Client-side filtering — safe because the backend already scopes both
  // milestones and submissions to the caller's group(s).
  const groupMilestones = useMemo(() => {
    const items = milestonesQuery.data || [];
    return items.filter((m) => {
      const gid = m.group?._id || m.group || m.groupId;
      return gid && (gid === groupId || gid.toString() === groupId);
    });
  }, [milestonesQuery.data, groupId]);

  // Guidelines: milestones without a due date (used as instructional documents)
  const groupGuidelines = useMemo(
    () => groupMilestones.filter((m) => !m.dueAt && !m.dueDate),
    [groupMilestones],
  );

  // Milestones: milestones with a due date (require student submission)
  const groupTasks = useMemo(
    () => groupMilestones.filter((m) => m.dueAt || m.dueDate),
    [groupMilestones],
  );

  const groupSubmissions = useMemo(() => {
    const items = submissionsQuery.data || [];
    return items.filter((sub) => {
      const milestone = sub.milestone || sub.milestoneId;
      const gid = sub.group
        || milestone?.group?._id
        || milestone?.group
        || milestone?.groupId;
      if (!gid) return false;
      return gid === groupId || gid.toString() === groupId;
    });
  }, [submissionsQuery.data, groupId]);

  // ---- Mutations ----
  const guidelineMutation = useMutation({
    mutationFn: (payload) => createResource('/milestones', payload, 'milestone'),
    onSuccess: () => {
      toast.success('Guideline published');
      setGuidelineOpen(false);
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });

  const updateGuidelineMutation = useMutation({
    mutationFn: ({ id, payload }) => patchResource(`/milestones/${id}`, payload, 'milestone'),
    onSuccess: () => {
      toast.success('Guideline updated');
      setEditingGuideline(null);
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });

  const deleteGuidelineMutation = useMutation({
    mutationFn: (id) => deleteResource(`/milestones/${id}`),
    onSuccess: () => {
      toast.success('Guideline deleted');
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });

  const milestoneMutation = useMutation({
    mutationFn: (payload) => createResource('/milestones', payload, 'milestone'),
    onSuccess: () => {
      toast.success('Milestone published');
      setMilestoneOpen(false);
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });

  const updateMilestoneMutation = useMutation({
    mutationFn: ({ id, payload }) => patchResource(`/milestones/${id}`, payload, 'milestone'),
    onSuccess: () => {
      toast.success('Milestone updated');
      setEditingMilestone(null);
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });

  const deleteMilestoneMutation = useMutation({
    mutationFn: (id) => deleteResource(`/milestones/${id}`),
    onSuccess: () => {
      toast.success('Milestone deleted');
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });

  const submissionMutation = useMutation({
    mutationFn: (payload) => createResource('/submissions', payload, 'submission'),
    onSuccess: () => {
      toast.success('Submission sent');
      setSubmitOpen(false);
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });

  const updateSubmissionMutation = useMutation({
    mutationFn: ({ id, payload }) => patchResource(`/submissions/${id}`, payload, 'submission'),
    onSuccess: () => {
      toast.success('Submission updated');
      setEditingSubmission(null);
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });

  const deleteSubmissionMutation = useMutation({
    mutationFn: (id) => deleteResource(`/submissions/${id}`),
    onSuccess: () => {
      toast.success('Submission deleted');
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, payload }) => {
      const path = payload.decision === 'approved'
        ? `/submissions/${id}/approve`
        : `/submissions/${id}/request-changes`;
      return patchResource(path, { comment: payload.feedback }, 'submission');
    },
    onSuccess: () => {
      toast.success('Review saved');
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });

  // ---- Loading / error states ----
  if (groupQuery.isLoading) {
    return <FullPageState title="Loading group workspace…" />;
  }
  if (groupQuery.error) {
    const status = groupQuery.error?.response?.status;
    return (
      <section className="page-stack">
        <PageIntro
          title="Group not found"
          subtitle={status === 403
            ? 'You are not a member of this group.'
            : 'This group could not be loaded.'}
        />
        <Card title="Access denied">
          <TableState icon={AlertCircle} text={status === 403
            ? 'Your account does not have access to this group workspace.'
            : 'An error occurred fetching the group. Please go back and try again.'}
          />
        </Card>
      </section>
    );
  }
  if (!group) {
    return (
      <section className="page-stack">
        <PageIntro title="Group not found" subtitle="The requested group does not exist." />
      </section>
    );
  }

  const groupLabel = [group.code, group.name].filter(Boolean).join(' — ');
  const isSupervisor = role === 'supervisor' || role === 'admin';
  const isStudent = role === 'student';

  return (
    <section className="page-stack">
      <PageIntro
        title={groupLabel || 'Group Workspace'}
        subtitle="All group activity in one place — roster, guidelines, milestones, and submissions."
      />

      {/* ---- Roster ---- */}
      <Card title="Group roster">
        <div className="group-membership">
          <div>
            <h4>Supervisors</h4>
            <ul className="member-list">
              {(group.supervisors || []).length === 0 ? (
                <li className="muted">No supervisors assigned yet.</li>
              ) : (
                group.supervisors.map((sup) => (
                  <li className="member-row" key={sup._id}>
                    <span><UserCog size={14} /></span>
                    <div><strong>{sup.fullName}</strong><p>{sup.email}</p></div>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div>
            <h4>Students</h4>
            <ul className="member-list">
              {(group.students || []).length === 0 ? (
                <li className="muted">No students assigned yet.</li>
              ) : (
                group.students.map((stu) => (
                  <li className="member-row" key={stu._id}>
                    <span><Users size={14} /></span>
                    <div><strong>{stu.fullName}</strong><p>{stu.email}</p></div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </Card>

      {/* ---- Guidelines (upload & edit) Modal & Card ---- */}
      <FormDialog
        open={guidelineOpen}
        onClose={() => setGuidelineOpen(false)}
        title="Upload guideline"
        subtitle={`Publish instructional material for ${group.code || group.name}`}
        icon={BookOpen}
      >
        <GuidelineForm
          onSubmit={(payload) => guidelineMutation.mutate({ ...payload, group: groupId, order: 0 })}
          pending={guidelineMutation.isPending}
        />
        <MutationError mutation={guidelineMutation} />
      </FormDialog>

      <FormDialog
        open={Boolean(editingGuideline)}
        onClose={() => setEditingGuideline(null)}
        title="Edit guideline"
        subtitle={`Update instructional material for ${group.code || group.name}`}
        icon={BookOpen}
      >
        {editingGuideline ? (
          <GuidelineForm
            initial={editingGuideline}
            onSubmit={(payload) => updateGuidelineMutation.mutate({ id: editingGuideline._id, payload })}
            pending={updateGuidelineMutation.isPending}
            submitLabel="Save changes"
          />
        ) : null}
        <MutationError mutation={updateGuidelineMutation} />
      </FormDialog>

      <Card
        title="Guidelines"
        action={(
          <div className="row-actions">
            {isSupervisor ? (
              <button
                className="primary-button inline"
                onClick={() => setGuidelineOpen(true)}
                type="button"
              >
                <Plus size={15} />Upload guideline
              </button>
            ) : null}
            <RefreshButton queryKey={['milestones']} />
          </div>
        )}
      >
        {groupGuidelines.length === 0 ? (
          <TableState icon={BookOpen} text={milestonesQuery.isLoading ? 'Loading…' : isSupervisor ? 'No guidelines published yet. Use "Upload guideline" to add instructional material.' : 'No guidelines published by your supervisor yet.'} />
        ) : (
          <DataTable
            columns={[
              ['Title', (item) => item.title],
              ['Description', (item) => item.description || '—'],
              ['Attachments', (item) => {
                const atts = item.attachments || [];
                if (!atts.length) return <span className="muted">No files</span>;
                return (
                  <div className="attachment-links">
                    {atts.map((att) => {
                      const fileName = att.originalFilename || att.originalName || att.publicId?.split('/').pop() || 'Attachment';
                      const secureUrl = att.secureUrl || att.url;
                      const category = getFileCategory(att);
                      return (
                        <div className="file-row" key={att.publicId || secureUrl}>
                          <button
                            className="file-preview-btn"
                            onClick={() => setPreviewFile(att)}
                            title={`Preview ${fileName}`}
                            type="button"
                          >
                            <Eye size={12} />
                          </button>
                          <a
                            className="attachment-link"
                            href={secureUrl}
                            rel="noopener noreferrer"
                            target="_blank"
                            title={`Open ${fileName}`}
                          >
                            {category === 'image' ? <ImageIcon size={12} /> : <FileText size={12} />}
                            <span>{fileName}</span>
                            <ExternalLink size={11} />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                );
              }],
              ['Published', (item) => formatDate(item.createdAt)],
              isSupervisor ? ['Actions', (item) => (
                <div className="row-actions">
                  <button
                    className="small-button"
                    onClick={() => setEditingGuideline(item)}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="small-button danger"
                    onClick={async () => {
                      if (await askConfirm({
                        title: `Delete guideline "${item.title}"?`,
                        description: 'Students will lose access to this instructional material.',
                        confirmLabel: 'Delete guideline',
                        destructive: true,
                      })) {
                        deleteGuidelineMutation.mutate(item._id);
                      }
                    }}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              )] : null,
            ].filter(Boolean)}
            data={groupGuidelines}
            empty="No guidelines in this group yet."
            loading={milestonesQuery.isLoading}
          />
        )}
      </Card>

      {/* ---- Milestones (with due date) Modal & Card ---- */}
      <FormDialog
        open={milestoneOpen}
        onClose={() => setMilestoneOpen(false)}
        title="Publish milestone"
        subtitle={`Define a deliverable with a due date for ${group.code || group.name}`}
        icon={ClipboardList}
      >
        <MilestoneForm
          groups={[group]}
          onSubmit={(payload) => milestoneMutation.mutate({ ...payload, group: groupId })}
          pending={milestoneMutation.isPending}
        />
        <MutationError mutation={milestoneMutation} />
      </FormDialog>

      <FormDialog
        open={Boolean(editingMilestone)}
        onClose={() => setEditingMilestone(null)}
        title="Edit milestone"
        subtitle={`Update deliverable details for ${group.code || group.name}`}
        icon={ClipboardList}
      >
        {editingMilestone ? (
          <MilestoneForm
            initial={editingMilestone}
            groups={[group]}
            onSubmit={(payload) => updateMilestoneMutation.mutate({ id: editingMilestone._id, payload })}
            pending={updateMilestoneMutation.isPending}
            submitLabel="Save changes"
          />
        ) : null}
        <MutationError mutation={updateMilestoneMutation} />
      </FormDialog>

      <Card
        title="Milestones"
        action={(
          <div className="row-actions">
            {isSupervisor ? (
              <button
                className="primary-button inline"
                onClick={() => setMilestoneOpen(true)}
                type="button"
              >
                <Plus size={15} />Publish milestone
              </button>
            ) : null}
            <RefreshButton queryKey={['milestones']} />
          </div>
        )}
      >
        <DataTable
          columns={[
            ['Order', (item) => item.order],
            ['Title', (item) => item.title],
            ['Due', (item) => formatDate(item.dueAt || item.dueDate)],
            ['Status', (item) => <Badge value={item.status || 'published'} />],
            isSupervisor ? ['Actions', (item) => (
              <div className="row-actions">
                <button
                  className="small-button"
                  onClick={() => setEditingMilestone(item)}
                  type="button"
                >
                  Edit
                </button>
                <button
                  className="small-button danger"
                  onClick={async () => {
                    if (await askConfirm({
                      title: `Delete milestone "${item.title}"?`,
                      description: 'Students will no longer see this milestone in their workspace.',
                      confirmLabel: 'Delete milestone',
                      destructive: true,
                    })) {
                      deleteMilestoneMutation.mutate(item._id);
                    }
                  }}
                  type="button"
                >
                  Delete
                </button>
              </div>
            )] : null,
          ].filter(Boolean)}
          data={groupTasks}
          empty={milestonesQuery.isLoading ? 'Loading…' : isSupervisor ? 'No milestones published yet. Use "Publish milestone" to set a student deliverable with a due date.' : 'No milestones published for your group yet.'}
          loading={milestonesQuery.isLoading}
        />
      </Card>

      {/* ---- Submissions Modal & Card ---- */}
      <FormDialog
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        title="Submit work"
        subtitle={`Upload deliverables for ${group.code || group.name}`}
        icon={FileText}
      >
        <SubmissionForm
          groups={[group]}
          milestones={groupTasks}
          onSubmit={(payload) => submissionMutation.mutate({ ...payload, group: groupId })}
          pending={submissionMutation.isPending}
          disabled={groupTasks.length === 0}
        />
        <MutationError mutation={submissionMutation} />
      </FormDialog>

      <FormDialog
        open={Boolean(editingSubmission)}
        onClose={() => setEditingSubmission(null)}
        title="Edit submission"
        subtitle={`Update deliverables for ${group.code || group.name}`}
        icon={FileText}
      >
        {editingSubmission ? (
          <SubmissionForm
            initial={editingSubmission}
            groups={[group]}
            milestones={groupTasks}
            onSubmit={(payload) => updateSubmissionMutation.mutate({ id: editingSubmission._id, payload })}
            pending={updateSubmissionMutation.isPending}
            submitLabel="Save changes"
          />
        ) : null}
        <MutationError mutation={updateSubmissionMutation} />
      </FormDialog>

      <Card
        title="Submissions"
        action={(
          <div className="row-actions">
            {isStudent ? (
              <button
                className="primary-button inline"
                disabled={groupTasks.length === 0}
                onClick={() => setSubmitOpen(true)}
                type="button"
              >
                <Plus size={15} />Submit work
              </button>
            ) : null}
            <RefreshButton queryKey={['submissions']} />
          </div>
        )}
      >
        <DataTable
          columns={[
            ['Milestone', (item) => label(item.milestone || item.milestoneId)],
            ['Student', (item) => label(item.student || item.studentId)],
            ['Version', (item) => item.currentVersion || item.versions?.length || 1],
            ['Files', (item) => <SubmissionFiles submission={item} />],
            ['Status', (item) => <Badge value={item.status} />],
            ['Updated', (item) => formatDate(item.updatedAt)],
            isSupervisor
              ? ['Review', (item) => <ReviewControls item={item} mutation={reviewMutation} />]
              : isStudent
                ? ['Decision', (item) => <Badge value={item.review?.decision || 'pending'} />]
                : null,
            isStudent ? ['Actions', (item) => (
              <div className="row-actions">
                {item.status !== 'approved' ? (
                  <button
                    className="small-button"
                    onClick={() => setEditingSubmission(item)}
                    type="button"
                  >
                    Edit
                  </button>
                ) : null}
                <button
                  className="small-button danger"
                  onClick={async () => {
                    if (await askConfirm({
                      title: 'Delete this submission?',
                      description: 'Uploaded files and review history for this submission will be removed.',
                      confirmLabel: 'Delete submission',
                      destructive: true,
                    })) {
                      deleteSubmissionMutation.mutate(item._id);
                    }
                  }}
                  type="button"
                >
                  Delete
                </button>
              </div>
            )] : null,
          ].filter(Boolean)}
          data={groupSubmissions}
          empty="No submissions in this group yet."
          loading={submissionsQuery.isLoading}
        />
      </Card>
      {previewFile ? (
        <FileViewerDialog
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      ) : null}
      {confirmDialog}
    </section>
  );
}

