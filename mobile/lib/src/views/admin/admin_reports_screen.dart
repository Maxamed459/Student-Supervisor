import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../controllers/dashboard_controller.dart';
import '../../theme/app_theme.dart';
import '../../widgets/display.dart';
import '../../widgets/ssms_chrome.dart';
import 'admin_group_detail_screen.dart';

class AdminReportsScreen extends StatelessWidget {
  const AdminReportsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<DashboardController>();
    return Obx(() {
      if (controller.loading.value && controller.adminDashboard.value == null) {
        return const Scaffold(
          backgroundColor: Colors.transparent,
          body: SsmsBusy(),
        );
      }

      final dashboard = controller.adminDashboard.value;
      final totals = dashboard?['totals'] is Map
          ? Map<String, dynamic>.from(dashboard!['totals'] as Map)
          : <String, dynamic>{};
      final activity = dashboard?['submissionActivity'] is Map
          ? Map<String, dynamic>.from(dashboard!['submissionActivity'] as Map)
          : <String, dynamic>{};
      final recentGroups = (dashboard?['recentGroups'] as List<dynamic>?) ?? [];
      final supervisorsWithLoad =
          (dashboard?['supervisorsWithLoad'] as List<dynamic>?) ?? [];

      final allUsers = controller.users;
      final studentsWithoutGroup = allUsers.where((user) {
        return field(user, const ['role']) == 'student' &&
            groupIdOf(user).isEmpty;
      }).length;
      final studentsWithoutSupervisor = allUsers.where((user) {
        if (field(user, const ['role']) != 'student') return false;
        final supervisorId = user is Map ? user['supervisorId'] : null;
        return supervisorId == null || supervisorId.toString().isEmpty;
      }).length;
      final inactiveUsers = allUsers.where((user) {
        return user is Map && user['isActive'] == false;
      }).length;

      final groups = controller.groups;
      final groupStudentCounts = <String, int>{};
      for (final group in groups) {
        final id = field(group, const ['_id', 'id']);
        final count = int.tryParse(field(group, const ['studentCount'])) ?? 0;
        if (id.isNotEmpty) groupStudentCounts[id] = count;
      }
      final groupsBelowMin = groups.where((group) {
        final count = int.tryParse(field(group, const ['studentCount'])) ?? 0;
        return count > 0 && count < 2;
      }).length;

      return Scaffold(
        backgroundColor: Colors.transparent,
        body: RefreshIndicator(
          color: SsmsColors.navy,
          onRefresh: controller.load,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.only(bottom: 28),
            children: [
              const SsmsPageHead(
                kicker: 'Admin',
                title: 'Reports',
                detail:
                    'System overview — users, groups, submissions, and supervision load.',
              ),
              const SsmsSectionLabel('Overview'),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: _ReportMetricGrid(cells: [
                  _ReportCell(
                    '${totals['totalStudents'] ?? 0}',
                    'Students',
                    SsmsColors.blueSoft,
                  ),
                  _ReportCell(
                    '${totals['totalSupervisors'] ?? 0}',
                    'Supervisors',
                    SsmsColors.mint,
                  ),
                  _ReportCell(
                    '${totals['totalGroups'] ?? 0}',
                    'Groups',
                    SsmsColors.peach,
                  ),
                ]),
              ),
              const SsmsSectionLabel('Submissions & progress'),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: _ReportMetricGrid(cells: [
                  _ReportCell(
                    '${totals['totalMilestones'] ?? 0}',
                    'Milestones',
                    SsmsColors.blueSoft,
                  ),
                  _ReportCell(
                    '${totals['totalSubmissions'] ?? 0}',
                    'Total papers',
                    SsmsColors.mint,
                  ),
                  _ReportCell(
                    '${activity['pending'] ?? 0}',
                    'Pending review',
                    SsmsColors.peach,
                  ),
                ]),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: SsmsCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Submission status', style: SsmsType.label),
                      const SizedBox(height: 12),
                      _StatusRow(
                        label: 'Approved',
                        value: '${activity['approved'] ?? 0}',
                        color: SsmsColors.accent,
                      ),
                      _StatusRow(
                        label: 'Pending',
                        value: '${activity['pending'] ?? 0}',
                        color: SsmsColors.peach,
                      ),
                      _StatusRow(
                        label: 'Changes requested',
                        value: '${activity['changesRequested'] ?? 0}',
                        color: SsmsColors.danger,
                      ),
                    ],
                  ),
                ),
              ),
              const SsmsSectionLabel('Unassigned & gaps'),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  children: [
                    _ReportStatCard(
                      icon: Icons.person_off_rounded,
                      label: 'Students without a group',
                      value: '$studentsWithoutGroup',
                      detail: studentsWithoutGroup > 0
                          ? 'These students need to be added to a group.'
                          : 'All students are assigned to groups.',
                    ),
                    const SizedBox(height: 10),
                    _ReportStatCard(
                      icon: Icons.supervisor_account_outlined,
                      label: 'Students without a supervisor',
                      value: '$studentsWithoutSupervisor',
                      detail: studentsWithoutSupervisor > 0
                          ? 'Assign supervisors through group management.'
                          : 'All students have a supervisor.',
                    ),
                    const SizedBox(height: 10),
                    _ReportStatCard(
                      icon: Icons.warning_amber_rounded,
                      label: 'Groups below minimum (2 students)',
                      value: '$groupsBelowMin',
                      detail: groupsBelowMin > 0
                          ? 'Add more students to meet the minimum.'
                          : 'All groups meet the minimum size.',
                    ),
                    if (inactiveUsers > 0) ...[
                      const SizedBox(height: 10),
                      _ReportStatCard(
                        icon: Icons.block_rounded,
                        label: 'Inactive accounts',
                        value: '$inactiveUsers',
                        detail: 'Deactivated users cannot sign in.',
                      ),
                    ],
                  ],
                ),
              ),
              const SsmsSectionLabel('Students per group'),
              if (recentGroups.isEmpty)
                const SsmsEmpty(
                  title: 'No groups yet',
                  detail: 'Group statistics will appear here.',
                )
              else
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    children: [
                      for (final group in recentGroups) ...[
                        _GroupReportCard(
                          group: group,
                          onTap: () {
                            final id = field(group, const ['_id', 'id']);
                            if (id.isEmpty) return;
                            Get.to(() => AdminGroupDetailScreen(groupId: id));
                          },
                        ),
                        const SizedBox(height: 10),
                      ],
                    ],
                  ),
                ),
              const SsmsSectionLabel('Supervisor workload'),
              if (supervisorsWithLoad.isEmpty)
                const SsmsEmpty(
                  title: 'No supervisors yet',
                  detail: 'Supervisor load will appear here.',
                )
              else
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    children: [
                      for (final supervisor in supervisorsWithLoad) ...[
                        _SupervisorLoadCard(supervisor: supervisor),
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

class _ReportCell {
  const _ReportCell(this.value, this.label, this.color);
  final String value;
  final String label;
  final Color color;
}

class _ReportMetricGrid extends StatelessWidget {
  const _ReportMetricGrid({required this.cells});
  final List<_ReportCell> cells;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        for (var i = 0; i < cells.length; i++) ...[
          if (i > 0) const SizedBox(width: 10),
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 12),
              decoration: BoxDecoration(
                color: cells[i].color,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                children: [
                  Text(
                    cells[i].value,
                    style: SsmsType.serifLg.copyWith(fontSize: 28),
                  ),
                  const SizedBox(height: 6),
                  Text(cells[i].label, style: SsmsType.meta),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _StatusRow extends StatelessWidget {
  const _StatusRow({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 10),
          Expanded(child: Text(label, style: SsmsType.body)),
          Text(value, style: SsmsType.label),
        ],
      ),
    );
  }
}

class _ReportStatCard extends StatelessWidget {
  const _ReportStatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.detail,
  });

  final IconData icon;
  final String label;
  final String value;
  final String detail;

  @override
  Widget build(BuildContext context) {
    return SsmsCard(
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: SsmsColors.field,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: SsmsColors.navy, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: SsmsType.label),
                const SizedBox(height: 2),
                Text(detail, style: SsmsType.meta),
              ],
            ),
          ),
          Text(value, style: SsmsType.serifLg.copyWith(fontSize: 24)),
        ],
      ),
    );
  }
}

class _GroupReportCard extends StatelessWidget {
  const _GroupReportCard({required this.group, required this.onTap});

  final dynamic group;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final name = field(group, const ['name', 'title'], fallback: 'Group');
    final students = field(group, const ['studentCount']);
    final supervisors = field(group, const ['supervisorCount']);
    return SsmsCard(
      onTap: onTap,
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: SsmsType.label),
                const SizedBox(height: 4),
                Text(
                  '$students students · $supervisors supervisors',
                  style: SsmsType.meta,
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right_rounded, color: SsmsColors.muted),
        ],
      ),
    );
  }
}

class _SupervisorLoadCard extends StatelessWidget {
  const _SupervisorLoadCard({required this.supervisor});

  final dynamic supervisor;

  @override
  Widget build(BuildContext context) {
    final name =
        field(supervisor, const ['fullName', 'name'], fallback: 'Supervisor');
    final email = field(supervisor, const ['email']);
    final count = field(supervisor, const ['studentCount']);
    return SsmsCard(
      child: Row(
        children: [
          SsmsInitials(name, size: 40),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: SsmsType.label),
                if (email.isNotEmpty) Text(email, style: SsmsType.meta),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: SsmsColors.blueSoft,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              '$count students',
              style: SsmsType.meta.copyWith(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}
