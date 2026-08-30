import { useQuery } from '@tanstack/react-query';
import { listResource } from '../services/apiClient';

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

export function useResource(name, enabled = true) {
  const [path, key] = resourceSpecs[name];
  return useQuery({
    queryKey: [name],
    queryFn: () => listResource(path, key),
    enabled,
    retry: false,
  });
}

export function useDashboardData(role) {
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
