import {
  Bell,
  BookOpen,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  RefreshCw,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
} from 'lucide-react';

export const supportedRoles = ['admin', 'supervisor', 'student'];

export const roleRoutes = {
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

export function isSupportedRole(role) {
  return supportedRoles.includes(role);
}
