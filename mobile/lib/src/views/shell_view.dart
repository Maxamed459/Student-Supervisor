import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';

import '../config/navigation.dart';
import '../controllers/auth_controller.dart';
import '../controllers/dashboard_controller.dart';
import '../theme/app_theme.dart';
import '../utils/shell_navigation.dart';
import '../widgets/ssms_nav.dart';
import '../widgets/ssms_sidebar.dart';
import 'admin/admin_groups_screen.dart';
import 'admin/admin_users_screen.dart';
import 'audit_logs_screen.dart';
import 'screens.dart';

class _ShellDest {
  const _ShellDest({
    required this.spec,
    required this.page,
    this.badge = 0,
  });

  final SsmsNavSpec spec;
  final Widget page;
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

  Widget _pageForSpec(SsmsNavSpec spec, String role) {
    if (spec.label == 'My Group') {
      return role == 'supervisor'
          ? const GroupsScreen()
          : const MyGroupScreen();
    }
    return switch (spec.label) {
      'Dashboard' => const DashboardScreen(),
      'Users' => _adminUsersPage,
      'Groups' => const AdminGroupsScreen(),
      'Audit Logs' => const AuditLogsScreen(),
      'Notifications' => const NotificationsScreen(),
      'Profile' => const ProfileScreen(),
      _ => const DashboardScreen(),
    };
  }

  List<_ShellDest> _destinations({
    required String role,
    required int unread,
  }) {
    return [
      for (final spec in ssmsNavForRole(role))
        _ShellDest(
          spec: spec,
          page: _pageForSpec(spec, role),
          badge: spec.badgeFromUnread ? unread : 0,
        ),
    ];
  }

  void _goToLabel(String label) {
    final dests = _destinations(
      role: Get.find<AuthController>().user.value!.role,
      unread: Get.find<DashboardController>().unreadCount.value,
    );
    final target = dests.indexWhere((dest) => dest.spec.label == label);
    if (target >= 0) setState(() => index = target);
  }

  int? _indexForLabel(List<_ShellDest> dests, String label) {
    for (var i = 0; i < dests.length; i++) {
      if (dests[i].spec.label == label) return i;
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
    ShellNavigation.bind(_goToLabel);
    Get.find<DashboardController>().load();
  }

  @override
  void dispose() {
    ShellNavigation.unbind();
    super.dispose();
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
            if (dests[i].spec.inBottomNav) i,
        ];
        final bottomItems = [
          for (final i in bottomIndices)
            SsmsNavItem(
              dests[i].spec.label,
              dests[i].spec.icon,
              badge: dests[i].badge,
            ),
        ];
        final bottomSelected = bottomIndices.indexOf(safeIndex);
        final notifIndex = _indexForLabel(dests, 'Notifications');
        final profileIndex = _indexForLabel(dests, 'Profile');

        return Scaffold(
          key: scaffoldKey,
          backgroundColor: SsmsColors.panel,
          drawer: SsmsSidebar(
            index: safeIndex,
            roleLabel: ssmsRoleLabel(user.role),
            items: [
              for (final dest in dests)
                (
                  label: dest.spec.label,
                  icon: dest.spec.icon,
                  badge: dest.badge,
                ),
            ],
            onSelect: (value) => setState(() => index = value),
          ),
          appBar: AppBar(
            backgroundColor: SsmsColors.panel,
            surfaceTintColor: Colors.transparent,
            titleSpacing: 0,
            leading: IconButton(
              onPressed: () => scaffoldKey.currentState?.openDrawer(),
              icon: const Icon(Icons.menu_rounded),
            ),
            title: Text(
              dests[safeIndex].spec.label,
              style: SsmsType.label.copyWith(
                fontSize: 24,
                fontWeight: FontWeight.w800,
                height: 1.33,
              ),
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
              child: Divider(height: 1, color: SsmsColors.softLine),
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
