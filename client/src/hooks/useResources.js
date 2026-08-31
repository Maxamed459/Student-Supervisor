import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { api, listResource } from '../services/apiClient';

const defaultResourceSpecs = {
  users: ['/users', 'users'],
  students: ['/users?role=student', 'users'],
  supervisors: ['/users?role=supervisor', 'users'],
  groups: ['/groups', 'groups'],
  milestones: ['/milestones', 'milestones'],
  submissions: ['/submissions', 'submissions'],
  progress: ['/students', 'progress'],
  notifications: ['/notifications', 'notifications'],
  auditLogs: ['/audit-logs', 'auditLogs'],
};

function getResourceSpec(name, user) {
  if (!user?._id) return [null, name];

  if (name === 'students' && user.role === 'supervisor') {
    return [`/supervisors/${user._id}/students`, 'students'];
  }

  if (name === 'groups' && user.role === 'student') {
    return [`/students/${user._id}/group`, 'groups'];
  }

  if (name === 'submissions' && user.role === 'student') {
    return [`/students/${user._id}/submissions`, 'submissions'];
  }

  if (name === 'progress' && user.role === 'student') {
    return [`/students/${user._id}/progress`, 'progress'];
  }

  // No role-agnostic /progress endpoint anymore — admin/supervisor get
  // an empty progress array (the brief did not require a cross-user
  // progress summary for those roles).
  if (name === 'progress' && user.role !== 'student') {
    return [null, 'progress'];
  }

  return defaultResourceSpecs[name] || [null, name];
}

export function useResource(name, enabled = true) {
  const user = useSelector((state) => state.auth.user);
  const [path, key] = getResourceSpec(name, user) || [];
  return useQuery({
    queryKey: [name, path],
    queryFn: () => (path ? listResource(path, key) : []),
    enabled: enabled && Boolean(key),
    retry: false,
  });
}

export function useDashboardData(role) {
  const allowAudit = role === 'admin';
  const users = useResource('users', role === 'admin');
  const students = useResource('students', role !== 'student');
  const supervisors = useResource('supervisors', role === 'admin');
  const groups = useResource('groups');
  const milestones = useResource('milestones');
  const submissions = useResource('submissions');
  const progress = useResource('progress', role === 'student');
  const notifications = useResource('notifications');
  const auditLogs = useResource('auditLogs', allowAudit);

  return {
    users,
    students,
    supervisors,
    groups,
    milestones,
    submissions,
    progress,
    notifications,
    auditLogs,
  };
}

// Fetch a single Group by id — used by GroupWorkspaceScreen.
// Normalisation is done by the server (buildGroupView already populates
// supervisors[], students[]). The raw response shape from GET /groups/:id
// is { group: {...}, members: [...], supervisors: [...] } — we pick group.
export function useGroupDetail(groupId) {
  return useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      if (!groupId) return null;
      const { data } = await api.get(`/groups/${groupId}`);
      const raw = data?.data?.group ?? data?.group ?? null;
      if (!raw) return null;
      return {
        ...raw,
        code: raw.code || raw.term || raw.name,
        supervisors: raw.supervisors || [],
        students: raw.students || [],
      };
    },
    enabled: Boolean(groupId),
    retry: false,
  });
}
