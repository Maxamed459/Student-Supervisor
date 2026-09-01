import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../controllers/admin_controller.dart';
import '../../controllers/dashboard_controller.dart';
import '../../theme/app_theme.dart';
import '../../widgets/display.dart';
import '../../widgets/ssms_chrome.dart';
import 'admin_group_detail_screen.dart';
import 'admin_sheets.dart';
import '../group_workspace_screen.dart';

Future<void> openAdminGroupDetail(BuildContext context, dynamic item) async {
  final groupId = idOf(item);
  if (groupId.isEmpty) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Could not open this group.')),
    );
    return;
  }
  await Navigator.of(context, rootNavigator: true).push<void>(
    MaterialPageRoute<void>(
      builder: (_) => AdminGroupDetailScreen(groupId: groupId),
    ),
  );
}

class AdminGroupsScreen extends StatelessWidget {
  const AdminGroupsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final dash = Get.find<DashboardController>();
    final admin = Get.find<AdminController>();
    return Obx(() {
      final items = dash.groups;
      final loading = dash.loading.value && items.isEmpty;
      if (loading) {
        return const Scaffold(
          backgroundColor: Colors.transparent,
          body: SsmsBusy(),
        );
      }
      return Scaffold(
        backgroundColor: Colors.transparent,
        floatingActionButton: FloatingActionButton.extended(
          onPressed: () => showCreateGroupSheet(context),
          backgroundColor: SsmsColors.navyDark,
          icon: const Icon(Icons.add_rounded),
          label: const Text('Create group'),
        ),
        body: RefreshIndicator(
          color: SsmsColors.navy,
          onRefresh: dash.load,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.only(bottom: 88),
            children: [
              const SsmsPageHead(
                kicker: 'SSMS Workspace',
                title: 'Groups',
                detail:
                    'Groups are the shared workspace that connects students and supervisors.',
              ),
              if (items.isEmpty)
                const SsmsEmpty(
                  title: 'No groups yet',
                  detail: 'Create your first student–supervisor group.',
                )
              else
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    children: [
                      for (final item in items) ...[
                        _AdminGroupCard(
                          item: item,
                          onView: () => openAdminGroupDetail(context, item),
                          onWorkspace: () {
                            final id = idOf(item);
                            if (id.isEmpty) return;
                            navigateToGroupWorkspace(context, groupId: id);
                          },
                          onEdit: () {
                            final id = idOf(item);
                            if (id.isEmpty) return;
                            final group = item is Map<String, dynamic>
                                ? Map<String, dynamic>.from(item)
                                : item is Map
                                    ? Map<String, dynamic>.from(item)
                                    : <String, dynamic>{};
                            showEditGroupSheet(
                              context,
                              groupId: id,
                              group: group,
                            );
                          },
                          onDelete: () async {
                            final id = idOf(item);
                            if (id.isEmpty) return;
                            final name = field(
                              item,
                              const ['name', 'title'],
                              fallback: 'Group',
                            );
                            final confirmed = await showAdminConfirmDialog(
                              context: context,
                              title: 'Delete group',
                              message:
                                  'Delete $name? Members will be unassigned, not deleted.',
                              confirmLabel: 'Delete',
                              destructive: true,
                            );
                            if (!confirmed || !context.mounted) return;
                            final ok = await admin.deleteGroup(id);
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    ok
                                        ? 'Group deleted.'
                                        : admin.actionError.value,
                                  ),
                                  backgroundColor:
                                      ok ? SsmsColors.navy : SsmsColors.danger,
                                ),
                              );
                            }
                          },
                        ),
                        const SizedBox(height: 10),
                      ],
                    ],
                  ),
                ),
            ],
          ),
        ),
      );
    });
  }
}

class _AdminGroupCard extends StatelessWidget {
  const _AdminGroupCard({
    required this.item,
    required this.onView,
    required this.onWorkspace,
    required this.onEdit,
    required this.onDelete,
  });

  final dynamic item;
  final VoidCallback onView;
  final VoidCallback onWorkspace;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final name = field(item, const ['name', 'title'], fallback: 'Group');
    final students = field(item, const ['studentCount']);
    final supervisorCountRaw = int.tryParse(field(item, const ['supervisorCount'])) ?? 0;
    final studentCount = int.tryParse(students) ?? 0;
    final needsStudents = studentCount < AdminController.minStudentsPerGroup;
    final supervisorLabel = supervisorCountRaw <= 0
        ? 'No supervisor'
        : supervisorCountRaw == 1
            ? '1 supervisor'
            : '$supervisorCountRaw supervisors · fix required';

    return SsmsCard(
      onTap: onView,
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: SsmsColors.field,
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(Icons.account_tree_rounded, color: SsmsColors.navy),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: SsmsType.label),
                const SizedBox(height: 4),
                Text(
                  [
                    if (field(item, const ['term']).isNotEmpty)
                      field(item, const ['term']),
                    if (students.isNotEmpty) '$students students',
                    supervisorLabel,
                  ].join(' · '),
                  style: SsmsType.meta.copyWith(
                    color: supervisorCountRaw > 1 ? SsmsColors.danger : null,
                  ),
                ),
                if (needsStudents) ...[
                  const SizedBox(height: 6),
                  Text(
                    'Needs at least ${AdminController.minStudentsPerGroup} students',
                    style: SsmsType.meta.copyWith(color: SsmsColors.danger),
                  ),
                ],
              ],
            ),
          ),
          IconButton(
            tooltip: 'Open workspace',
            onPressed: onWorkspace,
            icon: const Icon(Icons.open_in_new_rounded, color: SsmsColors.navy),
          ),
          IconButton(
            tooltip: 'Manage members',
            onPressed: onView,
            icon: const Icon(Icons.people_outline_rounded, color: SsmsColors.navy),
          ),
          IconButton(
            tooltip: 'Edit',
            onPressed: onEdit,
            icon: const Icon(Icons.edit_outlined, color: SsmsColors.navy),
          ),
          IconButton(
            tooltip: 'Delete',
            onPressed: onDelete,
            icon: const Icon(Icons.delete_outline, color: SsmsColors.danger),
          ),
        ],
      ),
    );
  }
}
