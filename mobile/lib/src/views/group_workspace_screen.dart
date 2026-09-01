import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../controllers/auth_controller.dart';
import '../controllers/dashboard_controller.dart';
import '../theme/app_theme.dart';
import '../widgets/display.dart';
import '../widgets/ssms_chrome.dart';
import 'action_sheets.dart';
import 'screens.dart' show openMilestoneDetail, openSubmissionDetail;

/// Unified group hub — mirrors web `GroupWorkspaceScreen`.
class GroupWorkspaceScreen extends StatefulWidget {
  const GroupWorkspaceScreen({
    super.key,
    required this.groupId,
    this.embedded = false,
  });

  final String groupId;
  final bool embedded;

  @override
  State<GroupWorkspaceScreen> createState() => _GroupWorkspaceScreenState();
}

class _GroupWorkspaceScreenState extends State<GroupWorkspaceScreen> {
  final controller = Get.find<DashboardController>();
  bool loading = true;
  String? error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      loading = true;
      error = null;
    });
    await controller.load();
    final detail = await controller.loadGroupDetail(widget.groupId);
    if (!mounted) return;
    setState(() {
      loading = false;
      if (detail == null) {
        error = controller.actionError.value.isEmpty
            ? 'Could not load this group workspace.'
            : controller.actionError.value;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = Get.find<AuthController>().user.value!;
    final role = user.role;
    final isSupervisor = role == 'supervisor' || role == 'admin';
    final isStudent = role == 'student';
    final isAdmin = role == 'admin';

    if (loading) {
      return const Scaffold(
        backgroundColor: SsmsColors.panel,
        body: SsmsBusy(),
      );
    }

    if (error != null) {
      final body = ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(20),
        children: [
          const SsmsPageHead(
            kicker: 'SSMS Workspace',
            title: 'Group not found',
            detail: 'This group could not be loaded or you may not have access.',
          ),
          SsmsErrorNote(error!),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: _load,
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Try again'),
          ),
        ],
      );
      if (widget.embedded) return body;
      return Scaffold(
        backgroundColor: SsmsColors.panel,
        appBar: AppBar(title: const Text('Group workspace')),
        body: body,
      );
    }

    return Obx(() {
      final group = controller.groupDetail.value ?? <String, dynamic>{};
      final groupName = field(group, const ['name', 'title']);
      final groupCode = field(group, const ['code', 'term']);
      final title = groupCode.isNotEmpty && groupName.isNotEmpty
          ? '$groupCode — $groupName'
          : groupName.isNotEmpty
              ? groupName
              : 'Group Workspace';

      final members = controller.groupMembers;
      var supervisors = <dynamic>[
        ...members.where(
          (m) => field(m, const ['role']).toLowerCase() == 'supervisor',
        ),
        ...((group['supervisors'] as List<dynamic>?) ?? []),
      ];
      var students = <dynamic>[
        ...members.where(
          (m) => field(m, const ['role']).toLowerCase() == 'student',
        ),
        ...((group['students'] as List<dynamic>?) ?? []),
      ];

      final seenSupervisors = <String>{};
      supervisors = supervisors.where((item) {
        final id = field(item, const ['_id', 'id', 'email']);
        if (id.isEmpty) return true;
        return seenSupervisors.add(id);
      }).toList();
      final seenStudents = <String>{};
      students = students.where((item) {
        final id = field(item, const ['_id', 'id', 'email']);
        if (id.isEmpty) return true;
        return seenStudents.add(id);
      }).toList();

      if (supervisors.isEmpty && user.supervisor != null) {
        supervisors = [user.supervisor!];
      }

      final guidelines = controller.guidelinesForGroup(widget.groupId);
      final tasks = controller.tasksForGroup(widget.groupId);
      final groupSubmissions = controller.submissionsForGroup(widget.groupId);

      final content = RefreshIndicator(
        color: SsmsColors.navy,
        onRefresh: _load,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(bottom: 28),
          children: [
            SsmsPageHead(
              kicker: 'SSMS Workspace',
              title: title,
              detail:
                  'All group activity in one place — roster, guidelines, milestones, and submissions.',
            ),
            const SsmsSectionLabel('Group roster'),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: SsmsCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('SUPERVISORS', style: SsmsType.kicker),
                    const SizedBox(height: 10),
                    if (supervisors.isEmpty)
                      Text('No supervisors assigned yet.', style: SsmsType.meta)
                    else
                      for (final item in supervisors)
                        _MemberRow(
                          name: field(item, const ['fullName', 'name'],
                              fallback: 'Supervisor'),
                          email: field(item, const ['email']),
                          icon: Icons.admin_panel_settings_outlined,
                        ),
                    const SizedBox(height: 18),
                    Text('STUDENTS', style: SsmsType.kicker),
                    const SizedBox(height: 10),
                    if (students.isEmpty)
                      Text('No students assigned yet.', style: SsmsType.meta)
                    else
                      for (final item in students)
                        _MemberRow(
                          name: field(item, const ['fullName', 'name'],
                              fallback: 'Student'),
                          email: field(item, const ['email']),
                          icon: Icons.person_outline_rounded,
                        ),
                  ],
                ),
              ),
            ),
            SsmsSectionLabel(
              'Guidelines',
              trailing: guidelines.isEmpty ? null : '${guidelines.length}',
            ),
            if (isSupervisor && !isAdmin)
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: FilledButton.icon(
                    onPressed: () => showPublishGuidelineSheet(context),
                    icon: const Icon(Icons.add_rounded, size: 18),
                    label: const Text('Upload guideline'),
                  ),
                ),
              ),
            if (guidelines.isEmpty)
              const SsmsEmpty(
                title: 'No guidelines',
                detail: 'Published guidelines will appear here.',
              )
            else
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: SsmsCard(
                  padding: EdgeInsets.zero,
                  child: Column(
                    children: [
                      for (var i = 0; i < guidelines.length; i++) ...[
                        _GuidelineTile(
                          item: guidelines[i],
                          onTap: () => openMilestoneDetail(context, guidelines[i]),
                        ),
                        if (i < guidelines.length - 1)
                          const Divider(height: 1, color: SsmsColors.softLine),
                      ],
                    ],
                  ),
                ),
              ),
            SsmsSectionLabel(
              'Milestones',
              trailing: tasks.isEmpty ? null : '${tasks.length}',
            ),
            if (isSupervisor && !isAdmin)
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: FilledButton.icon(
                    onPressed: () => showPublishGuidelineSheet(context),
                    icon: const Icon(Icons.add_rounded, size: 18),
                    label: const Text('Publish milestone'),
                  ),
                ),
              ),
            if (tasks.isEmpty)
              const SsmsEmpty(
                title: 'No milestones',
                detail: 'Milestones with due dates will appear here.',
              )
            else
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  children: [
                    for (final item in tasks) ...[
                      _MilestoneTile(
                        item: item,
                        onTap: () => openMilestoneDetail(context, item),
                      ),
                      const SizedBox(height: 10),
                    ],
                  ],
                ),
              ),
            SsmsSectionLabel(
              'Submissions',
              trailing: groupSubmissions.isEmpty
                  ? null
                  : '${groupSubmissions.length}',
            ),
            if (isStudent)
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: FilledButton.icon(
                    onPressed: () => showSubmitWorkSheet(context),
                    icon: const Icon(Icons.upload_file_rounded, size: 18),
                    label: const Text('Submit work'),
                  ),
                ),
              ),
            if (groupSubmissions.isEmpty)
              const SsmsEmpty(
                title: 'No submissions yet',
                detail: 'Student work will appear here once submitted.',
              )
            else
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  children: [
                    for (final item in groupSubmissions) ...[
                      _SubmissionTile(
                        item: item,
                        onTap: () => openSubmissionDetail(context, item),
                      ),
                      const SizedBox(height: 10),
                    ],
                  ],
                ),
              ),
            if (isStudent && groupSubmissions.isNotEmpty) ...[
              const SsmsSectionLabel('Feedback'),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: SsmsCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Supervisor decisions and feedback from your submissions.',
                        style: SsmsType.body,
                      ),
                      const SizedBox(height: 12),
                      for (final item in groupSubmissions)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      titleOf(item, fallback: 'Submission'),
                                      style: SsmsType.label.copyWith(fontSize: 14),
                                    ),
                                    const SizedBox(height: 4),
                                    SsmsStatusMark(field(item, const ['status'])),
                                  ],
                                ),
                              ),
                              TextButton(
                                onPressed: () =>
                                    openSubmissionDetail(context, item),
                                child: const Text('View'),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      );

      if (widget.embedded) return content;
      return Scaffold(
        backgroundColor: SsmsColors.panel,
        appBar: AppBar(
          backgroundColor: SsmsColors.paper,
          surfaceTintColor: Colors.transparent,
          title: Text(title, style: SsmsType.label.copyWith(fontSize: 18)),
          actions: [
            IconButton(
              onPressed: _load,
              icon: const Icon(Icons.refresh_rounded),
              tooltip: 'Refresh',
            ),
          ],
          bottom: const PreferredSize(
            preferredSize: Size.fromHeight(1),
            child: Divider(height: 1, color: SsmsColors.softLine),
          ),
        ),
        body: content,
      );
    });
  }
}

class _MemberRow extends StatelessWidget {
  const _MemberRow({
    required this.name,
    required this.email,
    required this.icon,
  });

  final String name;
  final String email;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Icon(icon, size: 18, color: SsmsColors.navy),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: SsmsType.label.copyWith(fontSize: 14)),
                if (email.isNotEmpty)
                  Text(email, style: SsmsType.meta),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _GuidelineTile extends StatelessWidget {
  const _GuidelineTile({required this.item, required this.onTap});

  final dynamic item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      title: Text(titleOf(item, fallback: 'Guideline'), style: SsmsType.label),
      subtitle: field(item, const ['description']).isEmpty
          ? null
          : Text(
              field(item, const ['description']),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: SsmsType.meta,
            ),
      trailing: const Icon(Icons.chevron_right_rounded, color: SsmsColors.muted),
    );
  }
}

class _MilestoneTile extends StatelessWidget {
  const _MilestoneTile({required this.item, required this.onTap});

  final dynamic item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final due = field(item, const ['dueAt', 'dueDate']);
    return SsmsCard(
      onTap: onTap,
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(titleOf(item, fallback: 'Milestone'), style: SsmsType.label),
                if (due.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text('Due ${formatDay(due)}', style: SsmsType.meta),
                ],
              ],
            ),
          ),
          SsmsStatusMark(field(item, const ['status'])),
          const SizedBox(width: 4),
          const Icon(Icons.chevron_right_rounded, color: SsmsColors.muted),
        ],
      ),
    );
  }
}

class _SubmissionTile extends StatelessWidget {
  const _SubmissionTile({required this.item, required this.onTap});

  final dynamic item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SsmsCard(
      onTap: onTap,
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(titleOf(item, fallback: 'Submission'), style: SsmsType.label),
                const SizedBox(height: 6),
                SsmsStatusMark(field(item, const ['status'])),
              ],
            ),
          ),
          const Icon(Icons.chevron_right_rounded, color: SsmsColors.muted),
        ],
      ),
    );
  }
}

Future<void> navigateToGroupWorkspace(
  BuildContext context, {
  required String groupId,
}) {
  return Navigator.of(context, rootNavigator: true).push<void>(
    MaterialPageRoute<void>(
      builder: (_) => GroupWorkspaceScreen(groupId: groupId),
    ),
  );
}
