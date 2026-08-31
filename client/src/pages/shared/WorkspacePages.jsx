import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Copy,
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
import { useResource, useDashboardData, useGroupDetail } from '../../hooks/useResources';
import { useToast } from '../../context/useToast';
import { formatDate, label, countBy, getFileCategory } from '../../utils/format';
import { logout, setSession } from '../../store/slices/authSlice';
import {
  ActivityFeed,
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
import { PendingActions, SummaryTile } from '../../components/dashboard';
import { GroupForm, GuidelineForm, MilestoneForm, SubmissionForm, UserForm } from '../../components/forms';
import { FeedbackReplyForm, FileViewerDialog, ReviewControls, SubmissionFiles } from '../../components/submission';

// ----------------------- Dashboard -----------------------

export function Dashboard({ role }) {
  const data = useDashboardData(role);
  const submissions = data.submissions.data || [];
  const groups = data.groups.data || [];
  const milestones = data.milestones.data || [];
  const students = data.students.data || [];
  const supervisors = data.supervisors.data || [];
  const notifications = data.notifications.data || [];
  const myGroup = role === 'student' ? groups[0] : null;
  const currentMilestone = role === 'student'
    ? milestones.find((item) => item.status === 'published' || item.isPublished) || milestones[0]
    : null;
  const latestSubmission = role === 'student' ? submissions[0] : null;
  const pendingReviews = submissions.filter((item) => item.status === 'pending');

  const statusCounts = countBy(submissions, 'status');
  const metrics = role === 'admin'
    ? [
        ['TOTAL STUDENTS', students.length, 'Registered student accounts', GraduationCap],
        ['TOTAL SUPERVISORS', supervisors.length, 'Active supervisor accounts', UserCog],
        ['STUDENT GROUPS', groups.length, 'Groups in the database', Users],
      ]
    : role === 'supervisor'
      ? [
          ['MY STUDENTS', students.length, 'Students in your group(s)', GraduationCap],
          ['MY GROUPS', groups.length, 'Groups you supervise', BookOpen],
          ['PENDING REVIEWS', pendingReviews.length, 'Submissions awaiting decision', FileText],
        ]
      : [
          ['MILESTONES', milestones.length, 'Published milestones for your group', ClipboardList],
          ['SUBMISSIONS', submissions.length, 'Your uploaded versions', FileText],
          ['GROUP', myGroup ? label(myGroup) : 'No group', myGroup?.code || 'You will be assigned to a group by an admin', Users],
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
            <SummaryTile
              title="Supervisor"
              value={myGroup?.supervisors?.length > 1
                ? `${myGroup.supervisors.length} supervisors`
                : label(myGroup?.supervisor)}
              caption={myGroup?.supervisors?.length > 1
                ? 'Multiple supervisors share your group'
                : 'Assigned through your group'}
            />
            <SummaryTile title="Current Milestone" value={label(currentMilestone)} caption={currentMilestone?.dueAt ? `Due ${formatDate(currentMilestone.dueAt)}` : 'No due date returned'} />
            <SummaryTile title="Submission Status" value={latestSubmission?.status || 'Not submitted'} caption={latestSubmission ? `Version ${latestSubmission.currentVersion}` : 'No submission returned'} />
          </div>
        </Card>
      ) : null}
      <div className="dashboard-grid">
        <Card title="Submission Status Distribution" className="span-2">
          <StatusBars counts={statusCounts} />
        </Card>
        <Card title={role === 'admin' ? 'Recent System Activity' : 'Recent Notifications'}>
          <ActivityFeed items={role === 'admin' ? data.auditLogs.data : notifications} />
        </Card>
      </div>
      <Card title="Pending Actions">
        <PendingActions reviews={pendingReviews} milestones={milestones} role={role} />
      </Card>
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
                  onClick={() => {
                    if (window.confirm(`Delete ${item.fullName}?`)) deleteMutation.mutate(item._id);
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
              ? 'No users match the current filters.'
              : 'No users returned by the API.'
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
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [memberSearch, setMemberSearch] = useState('');

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
      setSelectedGroup((current) => (current === editingGroup?._id ? null : current));
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });
  const addMemberMutation = useMutation({
    mutationFn: ({ groupId, userId }) => createResource(`/groups/${groupId}/members`, { userId }),
    onSuccess: () => {
      toast.success('Member added to the group');
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });
  const removeMemberMutation = useMutation({
    mutationFn: ({ groupId, userId }) => deleteResource(`/groups/${groupId}/members/${userId}`),
    onSuccess: () => {
      toast.success('Member removed from the group');
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message),
  });

  const currentGroup = useMemo(() => {
    if (!selectedGroup) return null;
    return (groups.data || []).find((g) => g._id === selectedGroup) || null;
  }, [groups.data, selectedGroup]);

  const memberCandidates = useMemo(() => {
    if (!currentGroup || !users.data) return [];
    const term = memberSearch.trim().toLowerCase();
    return users.data
      .filter((u) => u.role === 'student' || u.role === 'supervisor')
      .filter((u) => {
        if (term && !`${u.fullName} ${u.email}`.toLowerCase().includes(term)) return false;
        const alreadyMember = (currentGroup.students || []).some((s) => s._id === u._id)
          || (currentGroup.supervisors || []).some((s) => s._id === u._id);
        return !alreadyMember;
      });
  }, [currentGroup, memberSearch, users.data]);

  return (
    <section className="page-stack">
      <PageIntro title="Groups" subtitle="Groups are the shared workspace that connects students and supervisors." />
      <FormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create group"
        subtitle="Set up a new student-supervisor group workspace."
        icon={BookOpen}
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
      >
        {editingGroup ? (
          <GroupForm
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
              <GroupWorkspaceLink groupId={item._id} onManage={allowManage ? setSelectedGroup : null} currentSelected={currentGroup?._id} />
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
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete the group "${item.name}"? Assigned students and supervisors will be detached.`)) {
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
          empty="No groups returned by the API."
          loading={groups.isLoading}
        />
      </Card>
      {currentGroup ? (
        <Card title={`Members of ${currentGroup.code || currentGroup.name}`}>
          <div className="group-membership">
            <div>
              <h4>Supervisors</h4>
              <ul className="member-list">
                {(currentGroup.supervisors || []).length === 0 ? (
                  <li className="muted">No supervisors yet.</li>
                ) : (
                  currentGroup.supervisors.map((sup) => (
                    <li key={sup._id} className="member-row">
                      <span><UserCog size={14} /></span>
                      <div><strong>{sup.fullName}</strong><p>{sup.email}</p></div>
                      {allowManage ? (
                        <button
                          className="icon-button compact"
                          onClick={() => removeMemberMutation.mutate({ groupId: currentGroup._id, userId: sup._id })}
                          type="button"
                          aria-label={`Remove ${sup.fullName} from the group`}
                        >
                          <X size={14} />
                        </button>
                      ) : null}
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div>
              <h4>Students</h4>
              <ul className="member-list">
                {(currentGroup.students || []).length === 0 ? (
                  <li className="muted">No students yet.</li>
                ) : (
                  currentGroup.students.map((stu) => (
                    <li key={stu._id} className="member-row">
                      <span><Users size={14} /></span>
                      <div><strong>{stu.fullName}</strong><p>{stu.email}</p></div>
                      {allowManage ? (
                        <button
                          className="icon-button compact"
                          onClick={() => removeMemberMutation.mutate({ groupId: currentGroup._id, userId: stu._id })}
                          type="button"
                          aria-label={`Remove ${stu.fullName} from the group`}
                        >
                          <X size={14} />
                        </button>
                      ) : null}
                    </li>
                  ))
                )}
              </ul>
            </div>
            {allowManage ? (
              <div className="add-member">
                <h4>Add a member</h4>
                <input
                  onChange={(event) => setMemberSearch(event.target.value)}
                  placeholder="Search by name or email"
                  value={memberSearch}
                />
                <ul className="member-list">
                  {memberCandidates.length === 0 ? (
                    <li className="muted">No matching members available.</li>
                  ) : (
                    memberCandidates.slice(0, 12).map((candidate) => (
                      <li className="member-row" key={candidate._id}>
                        <span><UserCog size={14} /></span>
                        <div>
                          <strong>{candidate.fullName}</strong>
                          <p>{candidate.email} <Badge value={candidate.role} /></p>
                        </div>
                        <button
                          className="small-button"
                          onClick={() => addMemberMutation.mutate({ groupId: currentGroup._id, userId: candidate._id })}
                          type="button"
                        >
                          Add
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            ) : null}
          </div>
        </Card>
      ) : null}
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
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete milestone "${item.title}"?`)) {
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
          empty={scopedGroupId ? 'No milestones in this group yet.' : 'No milestones returned by the API.'}
          loading={milestones.isLoading}
        />
      </Card>
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
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this submission?')) {
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
          empty={scopedGroupId ? 'No submissions in this group yet.' : 'No submissions returned by the API.'}
          loading={submissions.isLoading}
        />
      </Card>
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
          empty="No notifications returned by the API."
          loading={notifications.isLoading}
        />
      </Card>
    </section>
  );
}

// ----------------------- Audit Logs -----------------------

export function AuditLogsScreen() {
  const auditLogs = useResource('auditLogs', true);
  return (
    <section className="page-stack">
      <PageIntro title="Audit logs" subtitle="Recent backend audit records." />
      <Card title="System activity">
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

// ----------------------- Profile -----------------------

export function ProfileScreen() {
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ fullName: user.fullName || '', phone: user.phone || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

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
    updateMutation.mutate({ fullName: form.fullName, phone: form.phone });
  };

  const submitPassword = (event) => {
    event.preventDefault();
    if (pwForm.newPassword.length < 8) return toast.error('New password must be at least 8 characters.');
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('New password and confirmation do not match.');
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
          <Field icon={UserRound} label="Full name">
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
          <Field icon={LockKeyhole} label="Current password">
            <input type="password" value={pwForm.currentPassword} onChange={(event) => setPwForm({ ...pwForm, currentPassword: event.target.value })} placeholder="Your current password" />
          </Field>
          <Field icon={LockKeyhole} label="New password" help="Minimum 8 characters">
            <input type="password" value={pwForm.newPassword} onChange={(event) => setPwForm({ ...pwForm, newPassword: event.target.value })} placeholder="Choose a new password" />
          </Field>
          <Field icon={LockKeyhole} label="Confirm new password">
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

// Renders a row action in GroupsScreen: a Link to the workspace + optionally
// a "Manage members" toggle for admins who still need the membership panel.
function GroupWorkspaceLink({ groupId, onManage, currentSelected }) {
  const user = useSelector((state) => state.auth.user);
  const role = user?.role || 'admin';
  return (
    <div className="row-actions">
      <Link className="small-button" to={`/${role}/groups/${groupId}`}>Open workspace</Link>
      {onManage ? (
        <button
          className="small-button"
          onClick={() => onManage(currentSelected === groupId ? null : groupId)}
          type="button"
        >
          {currentSelected === groupId ? 'Close members' : 'Manage members'}
        </button>
      ) : null}
    </div>
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
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete guideline "${item.title}"?`)) {
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
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete milestone "${item.title}"?`)) {
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
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this submission?')) {
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
    </section>
  );
}

