import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../controllers/admin_controller.dart';
import '../../theme/app_theme.dart';
import '../../widgets/display.dart';
import '../../widgets/ssms_chrome.dart';
import 'admin_sheets.dart';

class AdminGroupDetailScreen extends StatefulWidget {
  const AdminGroupDetailScreen({super.key, required this.groupId});

  final String groupId;

  @override
  State<AdminGroupDetailScreen> createState() => _AdminGroupDetailScreenState();
}

class _AdminGroupDetailScreenState extends State<AdminGroupDetailScreen> {
  final admin = Get.find<AdminController>();

  @override
  void initState() {
    super.initState();
    admin.clearMessages();
    admin.loadGroupDetail(widget.groupId);
  }

  Future<void> _reload() => admin.loadGroupDetail(widget.groupId);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: SsmsColors.panel,
      appBar: AppBar(
        backgroundColor: SsmsColors.panel,
        title: const Text('Group details'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            onPressed: _reload,
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: Obx(() {
        if (admin.actionLoading.value && admin.selectedGroup.value == null) {
          return const SsmsBusy();
        }
        final group = admin.selectedGroup.value;
        if (group == null) {
          return ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(20),
            children: [
              SsmsEmpty(
                title: 'Could not load group',
                detail: admin.actionError.value.isEmpty
                    ? 'Try again.'
                    : admin.actionError.value,
              ),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: admin.actionLoading.value ? null : _reload,
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Retry'),
              ),
            ],
          );
        }

        final groupName =
            field(group, const ['name', 'title'], fallback: 'Group');
        final students = admin.studentsInGroup;
        final supervisor = admin.supervisorsInGroup.isEmpty
            ? null
            : admin.supervisorsInGroup.first;
        final supervisorId = admin.primarySupervisorId ?? '';
        final supervisorName = supervisor == null
            ? 'Not assigned'
            : field(supervisor, const ['fullName', 'name'],
                fallback: 'Supervisor');
        final groupMap = Map<String, dynamic>.from(group);
        final needsStudents =
            students.length < AdminController.minStudentsPerGroup;
        final needsSupervisor = !admin.hasSupervisor;

        return ListView(
          padding: const EdgeInsets.only(bottom: 28),
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
              child: SsmsCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(groupName, style: SsmsType.serif),
                    if (field(group, const ['term']).isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(field(group, const ['term']), style: SsmsType.meta),
                    ],
                    if (field(group, const ['description']).isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Text(
                        field(group, const ['description']),
                        style: SsmsType.body.copyWith(color: SsmsColors.ink),
                      ),
                    ],
                    const SizedBox(height: 18),
                    Text('SUPERVISOR', style: SsmsType.kicker),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        if (supervisor != null)
                          SsmsInitials(supervisorName, size: 36),
                        if (supervisor != null) const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            supervisorName,
                            style: SsmsType.label.copyWith(
                              color: supervisor == null
                                  ? SsmsColors.muted
                                  : SsmsColors.ink,
                            ),
                          ),
                        ),
                      ],
                    ),
                    if (admin.hasMultipleSupervisors) ...[
                      const SizedBox(height: 10),
                      SsmsErrorNote(
                        'Multiple supervisors detected. Use Change supervisor to keep exactly one.',
                      ),
                    ],
                    const SizedBox(height: 16),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _ActionChip(
                          icon: Icons.edit_outlined,
                          label: 'Edit',
                          onTap: () => showEditGroupSheet(
                            context,
                            groupId: widget.groupId,
                            group: groupMap,
                          ),
                        ),
                        if (admin.hasSupervisor)
                          _ActionChip(
                            icon: Icons.supervisor_account_outlined,
                            label: 'Change supervisor',
                            onTap: () => showChangeSupervisorSheet(
                              context,
                              groupId: widget.groupId,
                              groupName: groupName,
                              currentSupervisorId: supervisorId,
                            ).then((_) => _reload()),
                          )
                        else
                          _ActionChip(
                            icon: Icons.person_add_alt_1_outlined,
                            label: 'Add supervisor',
                            onTap: () => showAddSupervisorSheet(
                              context,
                              groupId: widget.groupId,
                              groupName: groupName,
                            ).then((_) => _reload()),
                          ),
                        _ActionChip(
                          icon: Icons.person_add_outlined,
                          label: 'Add student',
                          onTap: supervisorId.isEmpty
                              ? () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text(
                                        'Assign a supervisor before adding students.',
                                      ),
                                    ),
                                  );
                                }
                              : () => showAddStudentSheet(
                                    context,
                                    groupId: widget.groupId,
                                    groupName: groupName,
                                    supervisorId: supervisorId,
                                    supervisorName: supervisorName,
                                  ).then((_) => _reload()),
                        ),
                        _ActionChip(
                          icon: Icons.delete_outline,
                          label: 'Delete group',
                          destructive: true,
                          onTap: () async {
                            final confirmed = await showAdminConfirmDialog(
                              context: context,
                              title: 'Delete group',
                              message:
                                  'Delete $groupName? Members will be unassigned, not deleted.',
                              confirmLabel: 'Delete',
                              destructive: true,
                            );
                            if (!confirmed || !context.mounted) return;
                            final ok = await admin.deleteGroup(widget.groupId);
                            if (ok && context.mounted) {
                              Navigator.pop(context);
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Group deleted.'),
                                  backgroundColor: SsmsColors.navy,
                                ),
                              );
                            }
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            if (needsStudents || needsSupervisor) ...[
              const SizedBox(height: 12),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: SsmsErrorNote(
                  [
                    if (needsSupervisor) 'Assign exactly one supervisor.',
                    if (needsStudents)
                      'Add at least ${AdminController.minStudentsPerGroup} students.',
                  ].join(' '),
                ),
              ),
            ],
            const SsmsSectionLabel('Students'),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: students.isEmpty
                  ? SsmsCard(
                      child: Text(
                        'No students in this group yet.',
                        style: SsmsType.body,
                      ),
                    )
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        for (var i = 0; i < students.length; i++)
                          _StudentRow(
                            index: i + 1,
                            student: students[i],
                            onRemove: () async {
                              final name = field(
                                students[i],
                                const ['fullName', 'name'],
                                fallback: 'Student',
                              );
                              final confirmed = await showAdminConfirmDialog(
                                context: context,
                                title: 'Remove student',
                                message:
                                    'Remove $name from $groupName?',
                                confirmLabel: 'Remove',
                                destructive: true,
                              );
                              if (!confirmed || !context.mounted) return;
                              final ok = await admin.removeStudentFromGroup(
                                groupId: widget.groupId,
                                studentId: idOf(students[i]),
                                studentName: name,
                              );
                              if (!ok && context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(admin.actionError.value),
                                  ),
                                );
                              }
                            },
                          ),
                      ],
                    ),
            ),
          ],
        );
      }),
    );
  }
}

class _ActionChip extends StatelessWidget {
  const _ActionChip({
    required this.icon,
    required this.label,
    required this.onTap,
    this.destructive = false,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool destructive;

  @override
  Widget build(BuildContext context) {
    final color = destructive ? SsmsColors.danger : SsmsColors.navy;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: destructive ? const Color(0xFFFFF5F5) : SsmsColors.field,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: destructive ? SsmsColors.danger : SsmsColors.hairline,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 18, color: color),
            const SizedBox(width: 6),
            Text(
              label,
              style: SsmsType.meta.copyWith(
                color: color,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StudentRow extends StatelessWidget {
  const _StudentRow({
    required this.index,
    required this.student,
    required this.onRemove,
  });

  final int index;
  final dynamic student;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final name =
        field(student, const ['fullName', 'name'], fallback: 'Student');
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: SsmsCard(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('$index.', style: SsmsType.label),
            const SizedBox(width: 10),
            SsmsInitials(name, size: 40),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name, style: SsmsType.label),
                  if (field(student, const ['email']).isNotEmpty)
                    Text(
                      field(student, const ['email']),
                      style: SsmsType.meta,
                    ),
                ],
              ),
            ),
            IconButton(
              tooltip: 'Remove student',
              onPressed: onRemove,
              icon: const Icon(Icons.delete_outline),
              color: SsmsColors.danger,
            ),
          ],
        ),
      ),
    );
  }
}
