import 'package:flutter/material.dart';

/// Mirrors `client/src/config/navigation.js` — labels and order match the web app.
class SsmsNavSpec {
  const SsmsNavSpec({
    required this.label,
    required this.icon,
    required this.inBottomNav,
    this.badgeFromUnread = false,
  });

  final String label;
  final IconData icon;
  final bool inBottomNav;
  final bool badgeFromUnread;
}

const supportedRoles = ['admin', 'supervisor', 'student'];

List<SsmsNavSpec> ssmsNavForRole(String role) {
  return switch (role) {
    'admin' => const [
      SsmsNavSpec(
        label: 'Dashboard',
        icon: Icons.dashboard_rounded,
        inBottomNav: true,
      ),
      SsmsNavSpec(
        label: 'Users',
        icon: Icons.people_outline_rounded,
        inBottomNav: true,
      ),
      SsmsNavSpec(
        label: 'Groups',
        icon: Icons.menu_book_outlined,
        inBottomNav: true,
      ),
      SsmsNavSpec(
        label: 'Audit Logs',
        icon: Icons.verified_user_outlined,
        inBottomNav: false,
      ),
      SsmsNavSpec(
        label: 'Notifications',
        icon: Icons.notifications_none_rounded,
        inBottomNav: false,
        badgeFromUnread: true,
      ),
      SsmsNavSpec(
        label: 'Profile',
        icon: Icons.person_outline_rounded,
        inBottomNav: true,
      ),
    ],
    'supervisor' => const [
      SsmsNavSpec(
        label: 'Dashboard',
        icon: Icons.dashboard_rounded,
        inBottomNav: true,
      ),
      SsmsNavSpec(
        label: 'My Group',
        icon: Icons.menu_book_outlined,
        inBottomNav: true,
      ),
      SsmsNavSpec(
        label: 'Notifications',
        icon: Icons.notifications_none_rounded,
        inBottomNav: true,
        badgeFromUnread: true,
      ),
      SsmsNavSpec(
        label: 'Profile',
        icon: Icons.person_outline_rounded,
        inBottomNav: true,
      ),
    ],
    _ => const [
      SsmsNavSpec(
        label: 'Dashboard',
        icon: Icons.dashboard_rounded,
        inBottomNav: true,
      ),
      SsmsNavSpec(
        label: 'My Group',
        icon: Icons.groups_outlined,
        inBottomNav: true,
      ),
      SsmsNavSpec(
        label: 'Notifications',
        icon: Icons.notifications_none_rounded,
        inBottomNav: true,
        badgeFromUnread: true,
      ),
      SsmsNavSpec(
        label: 'Profile',
        icon: Icons.person_outline_rounded,
        inBottomNav: true,
      ),
    ],
  };
}

String ssmsRoleLabel(String role) {
  return switch (role) {
    'admin' => 'Admin Dashboard',
    'supervisor' => 'Supervisor Dashboard',
    _ => 'Student Dashboard',
  };
}

bool isSupportedRole(String role) => supportedRoles.contains(role);
