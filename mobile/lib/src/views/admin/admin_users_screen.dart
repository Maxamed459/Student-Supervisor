import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../controllers/admin_users_controller.dart';
import '../../theme/app_theme.dart';
import '../../widgets/display.dart';
import '../../widgets/ssms_chrome.dart';
import 'admin_user_sheets.dart';

class AdminUsersScreen extends StatefulWidget {
  const AdminUsersScreen({super.key});

  @override
  State<AdminUsersScreen> createState() => _AdminUsersScreenState();
}

class _AdminUsersScreenState extends State<AdminUsersScreen> {
  final controller = Get.find<AdminUsersController>();
  final searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    controller.load();
  }

  @override
  void dispose() {
    searchController.dispose();
    super.dispose();
  }

  String get _pageTitle {
    switch (controller.roleFilter.value) {
      case 'student':
        return 'Students';
      case 'supervisor':
        return 'Supervisors';
      case 'admin':
        return 'Admins';
      default:
        return 'Users';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => showCreateUserMenu(context),
        backgroundColor: SsmsColors.navyDark,
        icon: const Icon(Icons.person_add_rounded),
        label: const Text('Create user'),
      ),
      body: Obx(() {
        if (controller.loading.value && controller.users.isEmpty) {
          return const SsmsBusy();
        }
        return RefreshIndicator(
          color: SsmsColors.navy,
          onRefresh: () => controller.load(resetPage: true),
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.only(bottom: 88),
            children: [
              SsmsPageHead(
                kicker: 'SSMS Workspace',
                title: _pageTitle,
                detail:
                    'Create, edit, deactivate, or remove accounts. Group membership is managed from the Groups screen.',
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: TextField(
                  controller: searchController,
                  decoration: InputDecoration(
                    hintText: 'Search by name or email',
                    prefixIcon: const Icon(Icons.search_rounded),
                    suffixIcon: searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear_rounded),
                            onPressed: () {
                              searchController.clear();
                              controller.search('');
                            },
                          )
                        : null,
                  ),
                  onSubmitted: controller.search,
                  onChanged: (value) {
                    if (value.isEmpty) controller.search('');
                  },
                ),
              ),
              const SizedBox(height: 12),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: _RoleFilterChips(
                  selected: controller.roleFilter.value,
                  onSelected: controller.setRoleFilter,
                ),
              ),
              const SizedBox(height: 12),
              if (controller.users.isEmpty)
                const SsmsEmpty(
                  title: 'No users found',
                  detail: 'Try a different search or create a new account.',
                )
              else
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    children: [
                      for (final user in controller.users) ...[
                        _UserCard(
                          user: user,
                          onTap: () => showUserDetailSheet(context, user),
                        ),
                        const SizedBox(height: 10),
                      ],
                    ],
                  ),
                ),
            ],
          ),
        );
      }),
    );
  }
}

class _RoleFilterChips extends StatelessWidget {
  const _RoleFilterChips({
    required this.selected,
    required this.onSelected,
  });

  final String selected;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    const roles = [
      ('all', 'All'),
      ('student', 'Students'),
      ('supervisor', 'Supervisors'),
      ('admin', 'Admins'),
    ];
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final (value, label) in roles)
          FilterChip(
            label: Text(label),
            selected: selected == value,
            onSelected: (_) => onSelected(value),
            selectedColor: SsmsColors.blueSoft,
            checkmarkColor: SsmsColors.navy,
          ),
      ],
    );
  }
}

class _UserCard extends StatelessWidget {
  const _UserCard({required this.user, required this.onTap});

  final dynamic user;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final name = field(user, const ['fullName', 'name'], fallback: 'User');
    final role = field(user, const ['role']);
    final isActive = user is Map && user['isActive'] != false;
    return SsmsCard(
      onTap: onTap,
      child: Row(
        children: [
          SsmsInitials(name, size: 48),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: SsmsType.label),
                const SizedBox(height: 3),
                Text(
                  [
                    field(user, const ['email']),
                    if (role.isNotEmpty) role,
                  ].join(' · '),
                  style: SsmsType.meta,
                ),
              ],
            ),
          ),
          SsmsStatusMark(
            isActive ? (role.isNotEmpty ? role : 'active') : 'inactive',
          ),
          const SizedBox(width: 4),
          const Icon(Icons.chevron_right_rounded, color: SsmsColors.muted),
        ],
      ),
    );
  }
}
