import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';

import '../controllers/auth_controller.dart';
import '../controllers/dashboard_controller.dart';
import '../theme/app_theme.dart';
import '../widgets/ssms_nav.dart';
import '../widgets/ssms_sidebar.dart';
import 'admin/admin_groups_screen.dart';
import 'admin/admin_users_screen.dart';
import 'audit_logs_screen.dart';
import 'screens.dart';

class _ShellDest {
  const _ShellDest({
    required this.label,
    required this.icon,
    required this.page,
    this.inBottomNav = true,
    this.badge = 0,
  });

  final String label;
  final IconData icon;
  final Widget page;
  final bool inBottomNav;
  final int badge;
}

class ShellView extends StatefulWidget {
  const ShellView({super.key});

  @override
  State<ShellView> createState() => _ShellViewState();
}

class _ShellViewState extends State<ShellView> {
  final scaffoldKey = GlobalKey<ScaffoldState>();
  int index = 0;
  late final Widget _adminUsersPage = const AdminUsersScreen();

  List<_ShellDest> _destinations({
    required String role,
    required int unread,
  }) {
    if (role == 'admin') {
      return [
        const _ShellDest(
          label: 'Dashboard',
          icon: Icons.dashboard_rounded,
          page: DashboardScreen(),
        ),
        _ShellDest(
          label: 'Users',
          icon: Icons.people_outline_rounded,
          page: _adminUsersPage,
        ),
        const _ShellDest(
          label: 'Groups',
          icon: Icons.menu_book_outlined,
          page: AdminGroupsScreen(),
        ),
        const _ShellDest(
          label: 'Audit Logs',
          icon: Icons.verified_user_outlined,
          page: AuditLogsScreen(),
          inBottomNav: false,
        ),
        const _ShellDest(
          label: 'Profile',
          icon: Icons.person_outline_rounded,
          page: ProfileScreen(),
        ),
      ];
    }

    if (role == 'supervisor') {
      return [
        const _ShellDest(
          label: 'Dashboard',
          icon: Icons.dashboard_rounded,
          page: DashboardScreen(),
        ),
        const _ShellDest(
          label: 'Guidelines',
          icon: Icons.menu_book_outlined,
          page: GuidelinesScreen(),
        ),
        const _ShellDest(
          label: 'Papers',
          icon: Icons.description_rounded,
          page: SubmissionsScreen(),
        ),
        const _ShellDest(
          label: 'Students',
          icon: Icons.groups_rounded,
          page: StudentsScreen(),
        ),
        const _ShellDest(
          label: 'Groups',
          icon: Icons.account_tree_rounded,
          page: GroupsScreen(),
          inBottomNav: false,
        ),
        _ShellDest(
          label: 'Inbox',
          icon: Icons.inbox_rounded,
          page: const NotificationsScreen(),
          inBottomNav: false,
          badge: unread,
        ),
        const _ShellDest(
          label: 'Profile',
          icon: Icons.person_rounded,
          page: ProfileScreen(),
        ),
      ];
    }

    return [
      const _ShellDest(
        label: 'Dashboard',
        icon: Icons.dashboard_rounded,
        page: DashboardScreen(),
      ),
      const _ShellDest(
        label: 'My Group',
        icon: Icons.groups_outlined,
        page: MyGroupScreen(),
      ),
      const _ShellDest(
        label: 'Guidelines',
        icon: Icons.menu_book_outlined,
        page: GuidelinesScreen(),
      ),
      const _ShellDest(
        label: 'Papers',
        icon: Icons.description_outlined,
        page: SubmissionsScreen(),
      ),
      _ShellDest(
        label: 'Notifications',
        icon: Icons.notifications_none_rounded,
        page: const NotificationsScreen(),
        inBottomNav: false,
        badge: unread,
      ),
      const _ShellDest(
        label: 'Profile',
        icon: Icons.person_outline_rounded,
        page: ProfileScreen(),
      ),
    ];
  }

  String _roleLabel(String role) {
    return switch (role) {
      'admin' => 'Admin Dashboard',
      'supervisor' => 'Supervisor Dashboard',
      _ => 'Student Dashboard',
    };
  }

  int? _notificationsIndex(List<_ShellDest> dests) {
    for (var i = 0; i < dests.length; i++) {
      if (dests[i].label == 'Notifications' || dests[i].label == 'Inbox') {
        return i;
      }
    }
    return null;
  }

  int? _profileIndex(List<_ShellDest> dests) {
    for (var i = 0; i < dests.length; i++) {
      if (dests[i].label == 'Profile' || dests[i].label == 'You') {
        return i;
      }
    }
    return null;
  }

  List<Widget> _stackChildren(List<_ShellDest> dests) {
    final pages = <Widget>[];
    for (final dest in dests) {
      if (pages.any((page) => page.runtimeType == dest.page.runtimeType)) {
        continue;
      }
      pages.add(dest.page);
    }
    return pages;
  }

  int _stackIndexForNav(List<_ShellDest> dests, int navIndex) {
    final targetType = dests[navIndex].page.runtimeType;
    final stack = _stackChildren(dests);
    for (var i = 0; i < stack.length; i++) {
      if (stack[i].runtimeType == targetType) return i;
    }
    return navIndex.clamp(0, stack.length - 1);
  }

  @override
  void initState() {
    super.initState();
    Get.find<DashboardController>().load();
  }

  @override
  Widget build(BuildContext context) {
    final user = Get.find<AuthController>().user.value!;
    final dash = Get.find<DashboardController>();

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark
          .copyWith(statusBarColor: Colors.transparent),
      child: Obx(() {
        final unread = dash.unreadCount.value;
        final dests = _destinations(role: user.role, unread: unread);
        final stackChildren = _stackChildren(dests);
        final safeIndex = index.clamp(0, dests.length - 1);
        final stackIndex = _stackIndexForNav(dests, safeIndex);

        if (safeIndex != index) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) setState(() => index = safeIndex);
          });
        }

        final bottomIndices = <int>[
          for (var i = 0; i < dests.length; i++)
            if (dests[i].inBottomNav) i,
        ];
        final bottomItems = [
          for (final i in bottomIndices)
            SsmsNavItem(
              dests[i].label,
              dests[i].icon,
              badge: dests[i].badge,
            ),
        ];
        final bottomSelected = bottomIndices.indexOf(safeIndex);
        final notifIndex = _notificationsIndex(dests);
        final profileIndex = _profileIndex(dests);

        return Scaffold(
          key: scaffoldKey,
          backgroundColor: SsmsColors.panel,
          drawer: SsmsSidebar(
            index: safeIndex,
            roleLabel: _roleLabel(user.role),
            items: [
              for (final dest in dests)
                (label: dest.label, icon: dest.icon, badge: dest.badge),
            ],
            onSelect: (value) => setState(() => index = value),
          ),
          appBar: AppBar(
            backgroundColor: SsmsColors.paper,
            surfaceTintColor: Colors.transparent,
            titleSpacing: 0,
            leading: IconButton(
              onPressed: () => scaffoldKey.currentState?.openDrawer(),
              icon: const Icon(Icons.menu_rounded),
            ),
            title: Text(
              dests[safeIndex].label,
              style: SsmsType.label.copyWith(fontSize: 18),
            ),
            actions: [
              IconButton(
                onPressed: dash.load,
                icon: const Icon(Icons.refresh_rounded),
                tooltip: 'Refresh',
              ),
              SsmsShellActions(
                unread: unread,
                onNotifications: notifIndex == null
                    ? null
                    : () => setState(() => index = notifIndex),
                onProfile: profileIndex == null
                    ? null
                    : () => setState(() => index = profileIndex),
              ),
            ],
            bottom: const PreferredSize(
              preferredSize: Size.fromHeight(1),
              child: Divider(height: 1, color: SsmsColors.hairline),
            ),
          ),
          body: IndexedStack(
            index: stackIndex,
            children: stackChildren,
          ),
          bottomNavigationBar: SsmsNav(
            index: bottomSelected < 0 ? 0 : bottomSelected,
            items: bottomItems,
            onChanged: (value) =>
                setState(() => index = bottomIndices[value]),
          ),
        );
      }),
    );
  }
}
