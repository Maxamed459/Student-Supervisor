import {
  Bell,
  BookOpen,
  LayoutDashboard,
  ShieldCheck,
  UserCog,
  Users,
} from 'lucide-react';

export const supportedRoles = ['admin', 'supervisor', 'student'];

export const roleRoutes = {
  admin: [
    ['Dashboard', '/admin/dashboard', LayoutDashboard],
    ['Users', '/admin/users', Users],
    ['Groups', '/admin/groups', BookOpen],
    ['Audit Logs', '/admin/audit-logs', ShieldCheck],
    ['Profile', '/admin/profile', UserCog],
  ],
  supervisor: [
    // My Groups links to the groups list; clicking a row opens /supervisor/groups/:id
    // which is covered by startsWith('/supervisor/groups') — no separate nav entry needed.
    ['Dashboard', '/supervisor/dashboard', LayoutDashboard],
    ['My Groups', '/supervisor/groups', BookOpen],
    ['Notifications', '/supervisor/notifications', Bell],
    ['Profile', '/supervisor/profile', UserCog],
  ],
  student: [
    // My Group links to /student/groups which redirects to the single group workspace.
    // startsWith('/student/groups') covers /student/groups/:id as well.
    ['Dashboard', '/student/dashboard', LayoutDashboard],
    ['My Group', '/student/groups', Users],
    ['Notifications', '/student/notifications', Bell],
    ['Profile', '/student/profile', UserCog],
  ],
};

export function isSupportedRole(role) {
  return supportedRoles.includes(role);
}
