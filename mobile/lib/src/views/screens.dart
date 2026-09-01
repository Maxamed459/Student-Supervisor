import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';

import '../controllers/auth_controller.dart';
import '../controllers/dashboard_controller.dart';
import '../theme/app_theme.dart';
import '../models/session_user.dart';
import '../utils/audit_log_formatter.dart';
import '../utils/shell_navigation.dart';
import '../widgets/display.dart';
import '../widgets/ssms_chrome.dart';
import 'action_sheets.dart';
import 'change_password_screen.dart';
import 'group_workspace_screen.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _LiveBody(
      builder: (controller) {
        final user = Get.find<AuthController>().user.value!;
        if (user.role == 'admin') {
          return _AdminOverview(controller: controller);
        }
        if (user.role == 'student') {
          return _StudentOverview(controller: controller, user: user);
        }
        return _SupervisorOverview(controller: controller);
      },
    );
  }
}

class _AdminOverview extends StatelessWidget {
  const _AdminOverview({required this.controller});

  final DashboardController controller;

  @override
  Widget build(BuildContext context) {
    final admin = controller.adminDashboard.value;
    final activity = admin?['submissionActivity'] is Map
        ? Map<String, dynamic>.from(admin!['submissionActivity'] as Map)
        : <String, dynamic>{};
    final recentLogs = controller.auditLogs.take(5).toList();

    final allUsers = controller.users;
    final studentsWithoutGroup = allUsers.where((user) {
      return field(user, const ['role']) == 'student' &&
          groupIdOf(user).isEmpty;
    }).length;
    final groupsWithoutSupervisor = controller.groups.where((group) {
      final supervisors = group is Map ? group['supervisors'] : null;
      if (supervisors is List) return supervisors.isEmpty;
      return true;
    }).length;
    final inactiveUsers = allUsers.where((user) {
      return user is Map && user['isActive'] == false;
    }).length;
    final studentCount = allUsers
        .where((user) => field(user, const ['role']) == 'student')
        .length;
    final welcomeName =
        Get.find<AuthController>().user.value?.fullName.split(' ').first ??
            'there';

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.only(bottom: 28),
      children: [
        SsmsDashboardHeader(
          subtitle:
              'Welcome back, $welcomeName. Have a look at any recent changes to your supervision workspace.',
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            children: [
              DashStatCard(
                label: 'Groups',
                value: '${controller.groups.length}',
                tone: DashStatTone.blue,
                linkLabel: 'View details',
                onLink: () => ShellNavigation.go('Groups'),
              ),
              const SizedBox(height: 12),
              DashStatCard(
                label: 'Students',
                value: '$studentCount',
                tone: DashStatTone.green,
                linkLabel: 'View details',
                onLink: () => ShellNavigation.go('Users'),
              ),
              const SizedBox(height: 12),
              DashCtaCard(
                text:
                    'Create groups, assign supervisors, and manage student accounts from a single workspace.',
                actionLabel: 'Manage groups',
                onAction: () => ShellNavigation.go('Groups'),
              ),
            ],
          ),
        ),
        const SsmsSectionLabel('Submission Status Distribution'),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: SsmsCard(
            child: _SubmissionChart(activity: activity),
          ),
        ),
        const SsmsSectionLabel('Recent System Activity'),
        if (recentLogs.isEmpty)
          const SsmsEmpty(
            title: 'No recent activity',
            detail: 'No recent activity returned by the API.',
          )
        else
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              children: [
                for (final item in recentLogs) ...[
                  _ActivityRow(item: item),
                  const SizedBox(height: 8),
                ],
              ],
            ),
          ),
        const SsmsSectionLabel('Pending Actions'),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            children: [
              if (studentsWithoutGroup > 0)
                _PendingAction(
                  label: '$studentsWithoutGroup students without a group',
                  icon: Icons.group_off_outlined,
                ),
              if (groupsWithoutSupervisor > 0)
                _PendingAction(
                  label: '$groupsWithoutSupervisor groups without a supervisor',
                  icon: Icons.person_off_outlined,
                ),
              if (inactiveUsers > 0)
                _PendingAction(
                  label: '$inactiveUsers inactive accounts',
                  icon: Icons.block_outlined,
                ),
              if (studentsWithoutGroup == 0 &&
                  groupsWithoutSupervisor == 0 &&
                  inactiveUsers == 0)
                const SsmsEmpty(
                  title: 'All clear',
                  detail: 'No pending admin actions at this time.',
                ),
            ],
          ),
        ),
      ],
    );
  }
}

class _StudentOverview extends StatelessWidget {
  const _StudentOverview({required this.controller, required this.user});

  final DashboardController controller;
  final dynamic user;

  @override
  Widget build(BuildContext context) {
    final progress = controller.progress.value;
    final groupDetail = controller.groupDetail.value;
    final groupName = field(
      groupDetail ?? user.group,
      const ['name', 'title'],
      fallback: 'Not assigned',
    );
    final groupCode = field(groupDetail ?? user.group, const ['code', 'term']);
    final supervisorName = field(
      user.supervisor,
      const ['fullName', 'name'],
      fallback: 'Not assigned',
    );
    final milestones = controller.milestones;
    final submissions = controller.submissions;
    final recent = controller.notifications.take(5).toList();

    final currentMilestone = milestones.isNotEmpty
        ? titleOf(milestones.first, fallback: 'None')
        : 'None';
    final latestSubmission = submissions.isNotEmpty ? submissions.first : null;
    final submissionStatus = latestSubmission != null
        ? field(latestSubmission, const ['status'], fallback: 'not_submitted')
        : 'not_submitted';
    final submissionVersion = latestSubmission != null
        ? field(latestSubmission, const ['version'], fallback: '')
        : '';

    final statusCounts = <String, int>{};
    for (final item in submissions) {
      final status = field(item, const ['status'], fallback: 'pending');
      statusCounts[status] = (statusCounts[status] ?? 0) + 1;
    }
    final welcomeName = user is SessionUser
        ? user.fullName.split(' ').first
        : field(user, const ['fullName'], fallback: 'there').split(' ').first;

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.only(bottom: 28),
      children: [
        SsmsDashboardHeader(
          subtitle:
              'Welcome back, $welcomeName. Have a look at any recent changes to your supervision workspace.',
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            children: [
              DashStatCard(
                label: 'Milestones',
                value: '${milestones.length}',
                tone: DashStatTone.blue,
                linkLabel: 'View details',
                onLink: () => ShellNavigation.go('My Group'),
              ),
              const SizedBox(height: 12),
              DashStatCard(
                label: 'Submissions',
                value: '${submissions.length}',
                tone: DashStatTone.green,
                linkLabel: 'View details',
                onLink: () => ShellNavigation.go('My Group'),
              ),
              const SizedBox(height: 12),
              DashCtaCard(
                text:
                    'Submit your deliverables against published milestones and track supervisor feedback.',
                actionLabel: 'Go to my group',
                onAction: () => ShellNavigation.go('My Group'),
              ),
            ],
          ),
        ),
        const SsmsSectionLabel('My Supervision Summary'),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: SsmsCard(
            child: Column(
              children: [
                _SummaryRow(
                  label: 'Group',
                  value: groupName,
                  detail: groupCode.isNotEmpty ? groupCode : null,
                ),
                const Divider(color: SsmsColors.hairline),
                _SummaryRow(
                  label: 'Supervisor',
                  value: supervisorName,
                  detail: 'Assigned through your group',
                ),
                const Divider(color: SsmsColors.hairline),
                _SummaryRow(
                  label: 'Current Milestone',
                  value: currentMilestone,
                  detail: 'No due date returned',
                ),
                const Divider(color: SsmsColors.hairline),
                _SummaryRow(
                  label: 'Submission Status',
                  value: prettyStatus(submissionStatus),
                  detail: submissionVersion.isNotEmpty
                      ? 'Version $submissionVersion'
                      : null,
                  trailing: SsmsStatusMark(submissionStatus),
                ),
              ],
            ),
          ),
        ),
        const SsmsSectionLabel('Submission Status Distribution'),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: SsmsCard(
            child: _SubmissionChart(
              activity: {
                'approved': statusCounts['approved'] ?? 0,
                'pending': statusCounts['pending'] ?? 0,
                'changesRequested': statusCounts['changes_requested'] ?? 0,
              },
            ),
          ),
        ),
        SsmsSectionLabel(
          'Recent Notifications',
          trailing: controller.unreadCount.value > 0
              ? '${controller.unreadCount.value} unread'
              : null,
        ),
        if (recent.isEmpty)
          const SsmsEmpty(
            title: 'No notifications',
            detail: 'Updates from your supervisor will appear here.',
          )
        else
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              children: [
                for (final item in recent) ...[
                  _NoticeCard(
                    item,
                    onTap: () {
                      final id = field(item, const ['_id', 'id']);
                      if (id.isNotEmpty && item['isRead'] != true) {
                        controller.markNotificationRead(id);
                      }
                    },
                  ),
                  const SizedBox(height: 10),
                ],
              ],
            ),
          ),
        if (progress != null) const SizedBox(height: 8),
      ],
    );
  }
}

class _SupervisorOverview extends StatelessWidget {
  const _SupervisorOverview({required this.controller});

  final DashboardController controller;

  @override
  Widget build(BuildContext context) {
    final recent = controller.notifications.take(6).toList();
    final pendingReviews = controller.submissions
        .where((item) => field(item, const ['status']) == 'pending')
        .length;
    final welcomeName =
        Get.find<AuthController>().user.value?.fullName.split(' ').first ??
            'there';

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.only(bottom: 28),
      children: [
        SsmsDashboardHeader(
          subtitle:
              'Welcome back, $welcomeName. Have a look at any recent changes to your supervision workspace.',
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            children: [
              DashStatCard(
                label: 'My Group',
                value: '${controller.groups.length}',
                tone: DashStatTone.blue,
                linkLabel: 'View details',
                onLink: () => ShellNavigation.go('My Group'),
              ),
              const SizedBox(height: 12),
              DashStatCard(
                label: 'Pending Reviews',
                value: '$pendingReviews',
                delta: pendingReviews > 0 ? '$pendingReviews awaiting' : null,
                tone: DashStatTone.green,
                linkLabel: 'View details',
                onLink: () => ShellNavigation.go('My Group'),
              ),
              const SizedBox(height: 12),
              DashCtaCard(
                text:
                    'Review student submissions, publish milestones, and share guidelines with your group.',
                actionLabel: 'Open workspace',
                onAction: () => ShellNavigation.go('My Group'),
              ),
            ],
          ),
        ),
        const SsmsSectionLabel('Recent Notifications'),
        if (recent.isEmpty)
          const SsmsEmpty(
            title: 'No notifications',
            detail: 'Updates will appear here.',
          )
        else
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              children: [
                for (final item in recent) ...[
                  _NoticeCard(
                    item,
                    onTap: () {
                      final id = field(item, const ['_id', 'id']);
                      if (id.isNotEmpty && item['isRead'] != true) {
                        controller.markNotificationRead(id);
                      }
                    },
                  ),
                  const SizedBox(height: 10),
                ],
              ],
            ),
          ),
      ],
    );
  }
}

class StudentsScreen extends StatelessWidget {
  const StudentsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _LiveBody(
      builder: (controller) {
        final students = controller.users.toList();
        final admin = isAdmin();
        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(bottom: 28),
          children: [
            SsmsPageHead(
              kicker: '${students.length} ${admin ? 'accounts' : 'enrolled'}',
              title: admin ? 'Students' : 'Students',
              detail: admin
                  ? 'Student accounts. Use the filter chips to narrow the list.'
                  : 'Students under your supervision.',
            ),
            if (students.isEmpty)
              const SsmsEmpty(
                title: 'No students yet',
                detail: 'Assigned students will be listed here.',
              )
            else
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  children: [
                    for (final item in students) ...[
                      _PersonCard(
                        item: item,
                        onTap: () => _openPerson(context, item),
                      ),
                      const SizedBox(height: 10),
                    ],
                  ],
                ),
              ),
          ],
        );
      },
    );
  }
}

class SubmissionsScreen extends StatelessWidget {
  const SubmissionsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final supervisor = isSupervisor();
    return _LiveBody(
      floatingActionButton: canSubmitWork()
          ? FloatingActionButton.extended(
              onPressed: () => showSubmitWorkSheet(context),
              icon: const Icon(Icons.upload_file_rounded),
              label: const Text('Submit'),
            )
          : null,
      builder: (controller) {
        final items = controller.submissions;
        final needsRevision = canSubmitWork()
            ? items
                .where(
                  (item) =>
                      field(item, const ['status']) == 'changes_requested',
                )
                .toList()
            : const <dynamic>[];
        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(bottom: 100),
          children: [
            SsmsPageHead(
              kicker: items.isEmpty ? 'Work' : '${items.length} records',
              title: 'Papers',
              detail: supervisor
                  ? 'Review uploads, send feedback, and comment on student submissions.'
                  : isAdmin()
                      ? 'Submissions across published milestones.'
                      : 'Submit work, read supervisor feedback, and upload again when changes are requested.',
            ),
            if (needsRevision.isNotEmpty)
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 14),
                child: SsmsCard(
                  color: const Color(0xFFFFF7F7),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Changes requested',
                        style:
                            SsmsType.label.copyWith(color: SsmsColors.danger),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Your supervisor asked for revisions. Open the submission or upload a revised file.',
                        style: SsmsType.body,
                      ),
                      const SizedBox(height: 12),
                      for (final item in needsRevision) ...[
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                titleOf(item, fallback: 'Submission'),
                                style: SsmsType.label.copyWith(fontSize: 14),
                              ),
                            ),
                            TextButton(
                              onPressed: () => _openSubmission(context, item),
                              child: const Text('Review'),
                            ),
                            FilledButton(
                              onPressed: () => showSubmitWorkSheet(
                                context,
                                milestoneId: _milestoneIdFromSubmission(item),
                                headline: 'Upload revised work',
                              ),
                              child: const Text('Resubmit'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                      ],
                    ],
                  ),
                ),
              ),
            if (items.isEmpty)
              const SsmsEmpty(
                title: 'No papers yet',
                detail: 'Submissions will show here once work is filed.',
              )
            else
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  children: [
                    for (final item in items) ...[
                      _PaperCard(
                        item: item,
                        onTap: () => _openSubmission(context, item),
                      ),
                      const SizedBox(height: 10),
                    ],
                  ],
                ),
              ),
          ],
        );
      },
    );
  }
}

class GuidelinesScreen extends StatelessWidget {
  const GuidelinesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final supervisor = isSupervisor();
    final student = isStudent();
    return _LiveBody(
      floatingActionButton: supervisor
          ? FloatingActionButton.extended(
              onPressed: () => showPublishGuidelineSheet(context),
              icon: const Icon(Icons.publish_rounded),
              label: const Text('Publish guideline'),
            )
          : student
              ? FloatingActionButton.extended(
                  onPressed: () => showSubmitWorkSheet(context),
                  icon: const Icon(Icons.upload_file_rounded),
                  label: const Text('Submit work'),
                )
              : null,
      builder: (controller) {
        final items = [...controller.milestones]..sort((a, b) {
            final da = asDate(field(a, const ['dueDate', 'dueAt']));
            final db = asDate(field(b, const ['dueDate', 'dueAt']));
            if (da == null && db == null) return 0;
            if (da == null) return 1;
            if (db == null) return -1;
            return da.compareTo(db);
          });
        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(bottom: 100),
          children: [
            SsmsPageHead(
              kicker: 'SSMS Workspace',
              title: 'Guidelines',
              detail: supervisor
                  ? 'Publish guidelines and attachments for your students to follow.'
                  : 'Read supervisor guidelines, then submit your work from Papers or here.',
            ),
            if (items.isEmpty)
              SsmsEmpty(
                title: supervisor
                    ? 'No guidelines yet'
                    : 'No guidelines published',
                detail: supervisor
                    ? 'Tap Publish guideline to upload instructions for your group.'
                    : 'Your supervisor has not published any guidelines yet.',
              )
            else
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  children: [
                    for (final item in items) ...[
                      _GuidelineListCard(
                        item: item,
                        submission: student
                            ? _submissionForMilestone(
                                controller.submissions,
                                field(item, const ['_id', 'id']),
                              )
                            : null,
                        onOpen: () => _openMilestone(context, item),
                        onSubmit: student
                            ? () => showSubmitWorkSheet(
                                  context,
                                  milestoneId: field(item, const ['_id', 'id']),
                                  headline: _submissionForMilestone(
                                            controller.submissions,
                                            field(item, const ['_id', 'id']),
                                          ) !=
                                          null
                                      ? 'Upload revised work'
                                      : 'Submit work',
                                )
                            : null,
                      ),
                      const SizedBox(height: 10),
                    ],
                  ],
                ),
              ),
          ],
        );
      },
    );
  }
}

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _LiveBody(
      builder: (controller) {
        final items = controller.notifications;
        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(bottom: 28),
          children: [
            SsmsPageHead(
              kicker: 'SSMS Workspace',
              title: 'Notifications',
              detail: 'Notification center for supervision updates.',
              action: items.isEmpty
                  ? null
                  : TextButton(
                      onPressed: controller.unreadCount.value == 0
                          ? null
                          : controller.markAllNotificationsRead,
                      child: const Text('Mark all read'),
                    ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      '${items.length} records',
                      style:
                          SsmsType.meta.copyWith(fontWeight: FontWeight.w600),
                    ),
                  ),
                  if (controller.unreadCount.value > 0)
                    const SsmsStatusMark('unread'),
                ],
              ),
            ),
            const SizedBox(height: 12),
            if (items.isEmpty)
              const SsmsEmpty(
                title: 'No notifications',
                detail: 'You are up to date.',
              )
            else
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: SsmsCard(
                  padding: EdgeInsets.zero,
                  child: Column(
                    children: [
                      for (var i = 0; i < items.length; i++) ...[
                        _NotificationRow(
                          item: items[i],
                          onMarkRead: () {
                            final id = field(items[i], const ['_id', 'id']);
                            if (id.isNotEmpty && items[i]['isRead'] != true) {
                              controller.markNotificationRead(id);
                            }
                          },
                        ),
                        if (i < items.length - 1)
                          const Divider(
                            height: 1,
                            color: SsmsColors.hairline,
                          ),
                      ],
                    ],
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}

class GroupsScreen extends StatelessWidget {
  const GroupsScreen({super.key});

  String? _resolveSupervisorGroupId(
    DashboardController controller,
    SessionUser user,
  ) {
    if (controller.groups.length == 1) {
      final id = idOf(controller.groups.first);
      if (id.isNotEmpty) return id;
    }
    final fromUser = user.groupId?.trim() ?? idOf(user.group ?? const {});
    if (fromUser.isNotEmpty) return fromUser;
    for (final group in controller.groups) {
      final id = idOf(group);
      if (id.isNotEmpty) return id;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return _LiveBody(
      builder: (controller) {
        final user = Get.find<AuthController>().user.value!;
        final items = controller.groups;
        final workspaceGroupId = _resolveSupervisorGroupId(controller, user);
        if (workspaceGroupId != null && (items.length <= 1 || items.isEmpty)) {
          return GroupWorkspaceScreen(
            groupId: workspaceGroupId,
            embedded: true,
          );
        }
        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(bottom: 28),
          children: [
            SsmsPageHead(
              kicker: items.isEmpty ? 'Cohorts' : '${items.length} groups',
              title: items.length <= 1 ? 'My Group' : 'My Groups',
              detail:
                  'Open a group workspace to manage guidelines, milestones, and submissions.',
            ),
            if (items.isEmpty)
              const SsmsEmpty(
                title: 'No groups',
                detail: 'Groups assigned by admin will appear here.',
              )
            else
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  children: [
                    for (final item in items) ...[
                      _GroupCard(
                        item: item,
                        onTap: () => _openGroup(context, item),
                      ),
                      const SizedBox(height: 10),
                    ],
                  ],
                ),
              ),
          ],
        );
      },
    );
  }
}

class MyGroupScreen extends StatefulWidget {
  const MyGroupScreen({super.key});

  @override
  State<MyGroupScreen> createState() => _MyGroupScreenState();
}

class _MyGroupScreenState extends State<MyGroupScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Get.find<DashboardController>().load();
    });
  }

  String? _resolveGroupId(SessionUser user, DashboardController controller) {
    final fromDetail = idOf(controller.groupDetail.value ?? const {});
    if (fromDetail.isNotEmpty) return fromDetail;
    final fromUser = user.groupId?.trim() ?? idOf(user.group ?? const {});
    if (fromUser.isNotEmpty) return fromUser;
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<DashboardController>();
    final auth = Get.find<AuthController>();

    return Obx(() {
      final user = auth.user.value;
      if (user == null) return const SizedBox.shrink();

      if (controller.loading.value &&
          controller.groupDetail.value == null &&
          (user.groupId == null || user.groupId!.isEmpty)) {
        return const Scaffold(
          backgroundColor: Colors.transparent,
          body: SsmsBusy(),
        );
      }

      final groupId = _resolveGroupId(user, controller);
      if (groupId == null || groupId.isEmpty) {
        return RefreshIndicator(
          color: SsmsColors.navy,
          backgroundColor: SsmsColors.paper,
          onRefresh: controller.load,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            children: const [
              SsmsPageHead(
                kicker: 'SSMS Workspace',
                title: 'My Group',
                detail: 'Your assigned group workspace.',
              ),
              SsmsEmpty(
                title: 'No group assigned',
                detail:
                    'An admin assigns groups. Pull down to refresh after you are placed.',
              ),
            ],
          ),
        );
      }

      return GroupWorkspaceScreen(groupId: groupId, embedded: true);
    });
  }
}

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _LiveBody(
      builder: (controller) {
        final settings = controller.settings.value;
        final terms = (settings?['academicTerms'] as List<dynamic>?) ?? [];
        final categories =
            (settings?['submissionCategories'] as List<dynamic>?) ?? [];
        final templates =
            (settings?['chapterTemplates'] as List<dynamic>?) ?? [];

        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(bottom: 28),
          children: [
            const SsmsPageHead(
              kicker: 'System',
              title: 'Settings',
              detail:
                  'Global academic terms and chapter templates (read-only).',
            ),
            if (settings == null)
              const SsmsEmpty(
                title: 'Settings unavailable',
                detail: 'Could not load global settings. Pull to refresh.',
              )
            else ...[
              _SettingsBlock(
                title: 'Academic terms',
                empty: 'No terms configured.',
                children: [
                  for (final term in terms) _SettingsChip(term.toString()),
                ],
              ),
              _SettingsBlock(
                title: 'Submission categories',
                empty: 'No categories configured.',
                children: [
                  for (final cat in categories) _SettingsChip(cat.toString()),
                ],
              ),
              _SettingsBlock(
                title: 'Chapter templates',
                empty: 'No templates configured.',
                children: [
                  for (final template in templates)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: SsmsCard(
                        padding: const EdgeInsets.all(14),
                        color: SsmsColors.field,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              field(template, const ['title'],
                                  fallback: 'Template'),
                              style: SsmsType.label,
                            ),
                            if (field(template, const ['description'])
                                .isNotEmpty) ...[
                              const SizedBox(height: 6),
                              Text(
                                field(template, const ['description']),
                                style: SsmsType.body,
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ],
          ],
        );
      },
    );
  }
}

class ProgressScreen extends StatelessWidget {
  const ProgressScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _LiveBody(
      builder: (controller) {
        final progress = controller.progress.value;
        final items = (progress?['items'] as List<dynamic>?) ?? [];

        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(bottom: 28),
          children: [
            SsmsPageHead(
              kicker: progress == null
                  ? 'Overview'
                  : '${progress['completed'] ?? 0}/${progress['totalMilestones'] ?? 0} done',
              title: 'Progress',
              detail: 'Milestone completion across your term.',
            ),
            if (progress == null)
              const SsmsEmpty(
                title: 'No progress yet',
                detail: 'Progress appears once milestones are published.',
              )
            else ...[
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: _MetricGrid.progress(progress),
              ),
              const SsmsSectionLabel('Milestones'),
              if (items.isEmpty)
                const SsmsEmpty(
                  title: 'No milestone items',
                  detail: 'Items will list here when work is tracked.',
                )
              else
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    children: [
                      for (final item in items) ...[
                        SsmsCard(
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      field(item, const ['title'],
                                          fallback: 'Milestone'),
                                      style: SsmsType.label,
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      [
                                        if (field(item, const ['order'])
                                            .isNotEmpty)
                                          'Order ${field(item, const [
                                                'order'
                                              ])}',
                                        if (formatStamp(field(item, const [
                                          'lastSubmittedAt',
                                        ])).isNotEmpty)
                                          formatStamp(field(item, const [
                                            'lastSubmittedAt',
                                          ])),
                                      ].join(' · '),
                                      style: SsmsType.meta,
                                    ),
                                  ],
                                ),
                              ),
                              SsmsStatusMark(
                                field(item, const ['status']),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 10),
                      ],
                    ],
                  ),
                ),
            ],
          ],
        );
      },
    );
  }
}

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final fullNameController = TextEditingController();
  final phoneController = TextEditingController();
  final currentPasswordController = TextEditingController();
  final newPasswordController = TextEditingController();
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    _syncFromUser();
  }

  void _syncFromUser() {
    final user = Get.find<AuthController>().user.value;
    if (user == null || _initialized) return;
    fullNameController.text = user.fullName;
    phoneController.text = user.phone ?? '';
    _initialized = true;
  }

  @override
  void dispose() {
    fullNameController.dispose();
    phoneController.dispose();
    currentPasswordController.dispose();
    newPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final auth = Get.find<AuthController>();
      final controller = Get.find<DashboardController>();
      final user = auth.user.value!;
      final roleLabel = switch (user.role) {
        'admin' => 'Admin',
        'supervisor' => 'Supervisor',
        _ => 'Student',
      };
      final groupLabel = field(user.group, const ['name', 'title']);
      final groupDisplay =
          groupLabel.isNotEmpty ? groupLabel : (user.groupId ?? 'Not assigned');

      return ListView(
        padding: const EdgeInsets.only(bottom: 32),
        children: [
          const SsmsPageHead(
            kicker: 'SSMS Workspace',
            title: 'Profile',
            detail: 'Manage your account details and password.',
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: SsmsCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Account', style: SsmsType.label.copyWith(fontSize: 18)),
                  const SizedBox(height: 16),
                  _AccountRow(label: 'Email', value: user.email),
                  _AccountRow(label: 'Role', badge: roleLabel),
                  _AccountRow(
                    label: 'Status',
                    badge: prettyStatus(user.status),
                    badgeTone: SsmsColors.accent,
                  ),
                  _AccountRow(label: 'Group', value: groupDisplay),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: SsmsCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Edit profile',
                      style: SsmsType.label.copyWith(fontSize: 18)),
                  const SizedBox(height: 16),
                  Text('Full name', style: SsmsType.kicker),
                  const SizedBox(height: 8),
                  TextField(
                    controller: fullNameController,
                    decoration: const InputDecoration(
                      hintText: 'Your full name',
                      prefixIcon: Icon(Icons.person_outline_rounded),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text('Phone (optional)', style: SsmsType.kicker),
                  const SizedBox(height: 8),
                  TextField(
                    controller: phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      hintText: '+252 6xxxxxxxx',
                      prefixIcon: Icon(Icons.phone_outlined),
                    ),
                  ),
                  const SizedBox(height: 18),
                  Align(
                    alignment: Alignment.centerRight,
                    child: FilledButton(
                      onPressed: controller.actionLoading.value
                          ? null
                          : () async {
                              controller.actionError.value = '';
                              final ok = await controller.updateProfile(
                                fullName: fullNameController.text.trim(),
                                phone: phoneController.text.trim(),
                              );
                              if (ok && context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Profile updated.'),
                                  ),
                                );
                              }
                            },
                      child: Text(
                        controller.actionLoading.value
                            ? 'Saving…'
                            : 'Save changes',
                      ),
                    ),
                  ),
                  if (controller.actionError.value.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    SsmsErrorNote(controller.actionError.value),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: SsmsCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Change password',
                    style: SsmsType.label.copyWith(fontSize: 18),
                  ),
                  const SizedBox(height: 16),
                  Text('Current password', style: SsmsType.kicker),
                  const SizedBox(height: 8),
                  TextField(
                    controller: currentPasswordController,
                    obscureText: true,
                    decoration: const InputDecoration(
                      prefixIcon: Icon(Icons.lock_outline_rounded),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text('New password', style: SsmsType.kicker),
                  const SizedBox(height: 8),
                  TextField(
                    controller: newPasswordController,
                    obscureText: true,
                    decoration: const InputDecoration(
                      prefixIcon: Icon(Icons.lock_outline_rounded),
                      helperText: 'Minimum 8 characters',
                    ),
                  ),
                  const SizedBox(height: 18),
                  Align(
                    alignment: Alignment.centerRight,
                    child: OutlinedButton(
                      onPressed: () =>
                          Get.to(() => const ChangePasswordScreen()),
                      child: const Text('Update password'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      );
    });
  }
}

class _GroupCard extends StatelessWidget {
  const _GroupCard({required this.item, required this.onTap});

  final dynamic item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final name = field(item, const ['name', 'title'], fallback: 'Group');
    final students = field(item, const ['studentCount']);
    final supervisors = field(item, const ['supervisorCount']);
    return SsmsCard(
      onTap: onTap,
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: SsmsColors.field,
              borderRadius: BorderRadius.circular(14),
            ),
            child:
                const Icon(Icons.account_tree_rounded, color: SsmsColors.navy),
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
                    if (supervisors.isNotEmpty) '$supervisors supervisors',
                  ].join(' · '),
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

class _SettingsBlock extends StatelessWidget {
  const _SettingsBlock({
    required this.title,
    required this.empty,
    required this.children,
  });

  final String title;
  final String empty;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title.toUpperCase(), style: SsmsType.kicker),
          const SizedBox(height: 10),
          if (children.isEmpty)
            Text(empty, style: SsmsType.meta)
          else
            ...children,
        ],
      ),
    );
  }
}

class _SettingsChip extends StatelessWidget {
  const _SettingsChip(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: SsmsColors.field,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Text(label,
          style: SsmsType.label.copyWith(fontWeight: FontWeight.w600)),
    );
  }
}

class _LiveBody extends StatelessWidget {
  const _LiveBody({required this.builder, this.floatingActionButton});

  final Widget Function(DashboardController controller) builder;
  final Widget? floatingActionButton;

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<DashboardController>();
    return Obx(() {
      final empty = controller.groups.isEmpty &&
          controller.milestones.isEmpty &&
          controller.submissions.isEmpty &&
          controller.notifications.isEmpty &&
          controller.users.isEmpty &&
          controller.adminDashboard.value == null;
      if (controller.loading.value && empty) {
        return const Scaffold(
          backgroundColor: Colors.transparent,
          body: SsmsBusy(),
        );
      }
      if (controller.error.value.isNotEmpty && empty) {
        return Scaffold(
          backgroundColor: Colors.transparent,
          body: SsmsEmpty(
            title: 'Could not load',
            detail: controller.error.value,
          ),
        );
      }
      return Scaffold(
        backgroundColor: Colors.transparent,
        floatingActionButton: floatingActionButton,
        body: RefreshIndicator(
          color: SsmsColors.navy,
          backgroundColor: SsmsColors.paper,
          onRefresh: controller.load,
          child: builder(controller),
        ),
      );
    });
  }
}

class _MetricGrid extends StatelessWidget {
  const _MetricGrid._(this.cells);

  factory _MetricGrid.progress(Map<String, dynamic> progress) {
    return _MetricGrid._([
      ('${progress['totalMilestones'] ?? 0}', 'Total', SsmsColors.blueSoft),
      ('${progress['completed'] ?? 0}', 'Done', SsmsColors.mint),
      ('${progress['pending'] ?? 0}', 'Pending', SsmsColors.peach),
    ]);
  }

  final List<(String, String, Color)> cells;

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
                color: cells[i].$3,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                children: [
                  Text(cells[i].$1,
                      style: SsmsType.serifLg.copyWith(fontSize: 28)),
                  const SizedBox(height: 6),
                  Text(
                    cells[i].$2.toUpperCase(),
                    style: SsmsType.kicker.copyWith(fontSize: 10),
                  ),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _SubmissionChart extends StatelessWidget {
  const _SubmissionChart({required this.activity});

  final Map<String, dynamic> activity;

  @override
  Widget build(BuildContext context) {
    final approved = _asInt(activity['approved']);
    final pending = _asInt(activity['pending']);
    final changes = _asInt(activity['changesRequested']);
    final maxVal =
        [approved, pending, changes, 1].reduce((a, b) => a > b ? a : b);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          height: 96,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: _ChartBar(
                  value: changes,
                  max: maxVal,
                  color: SsmsColors.danger.withValues(alpha: 0.7),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _ChartBar(
                  value: approved,
                  max: maxVal,
                  color: SsmsColors.accent.withValues(alpha: 0.7),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _ChartBar(
                  value: pending,
                  max: maxVal,
                  color: SsmsColors.blueSoft,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: Text(
                'Changes Requested',
                textAlign: TextAlign.center,
                style: SsmsType.kicker.copyWith(fontSize: 9),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Approved',
                textAlign: TextAlign.center,
                style: SsmsType.kicker.copyWith(fontSize: 9),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Pending',
                textAlign: TextAlign.center,
                style: SsmsType.kicker.copyWith(fontSize: 9),
              ),
            ),
          ],
        ),
      ],
    );
  }

  int _asInt(dynamic value) {
    if (value is int) return value;
    return int.tryParse('$value') ?? 0;
  }
}

class _ChartBar extends StatelessWidget {
  const _ChartBar({
    required this.value,
    required this.max,
    required this.color,
  });

  final int value;
  final int max;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final height = max > 0 ? (value / max) * 64.0 : 0.0;
    return Column(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        Text('$value', style: SsmsType.label.copyWith(fontSize: 14)),
        const SizedBox(height: 4),
        AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          height: height.clamp(value > 0 ? 4 : 2, 64),
          width: double.infinity,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      ],
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.label,
    required this.value,
    this.detail,
    this.trailing,
  });

  final String label;
  final String value;
  final String? detail;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label.toUpperCase(), style: SsmsType.kicker),
                const SizedBox(height: 6),
                Text(value, style: SsmsType.label),
                if (detail != null) ...[
                  const SizedBox(height: 4),
                  Text(detail!, style: SsmsType.meta),
                ],
              ],
            ),
          ),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}

class _PendingAction extends StatelessWidget {
  const _PendingAction({required this.label, required this.icon});

  final String label;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: SsmsCard(
        color: SsmsColors.field,
        child: Row(
          children: [
            Icon(icon, color: SsmsColors.navy, size: 20),
            const SizedBox(width: 12),
            Expanded(child: Text(label, style: SsmsType.label)),
          ],
        ),
      ),
    );
  }
}

class _ActivityRow extends StatelessWidget {
  const _ActivityRow({required this.item});

  final dynamic item;

  @override
  Widget build(BuildContext context) {
    final formatted = formatAuditLog(item);
    return SsmsCard(
      color: SsmsColors.field,
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          Icon(formatted.icon, color: SsmsColors.navy, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(formatted.message,
                    style: SsmsType.label.copyWith(fontSize: 14)),
                const SizedBox(height: 4),
                Text(formatted.timestamp, style: SsmsType.meta),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _NotificationRow extends StatelessWidget {
  const _NotificationRow({required this.item, required this.onMarkRead});

  final dynamic item;
  final VoidCallback onMarkRead;

  @override
  Widget build(BuildContext context) {
    final title = field(item, const ['title'], fallback: '');
    final type = prettyStatus(field(item, const ['type']));
    final message = field(item, const ['message', 'body', 'description']);
    final when = formatStamp(field(item, const ['createdAt', 'updatedAt']));
    final unread = item is Map && item['isRead'] != true;
    final displayTitle = title.isNotEmpty ? title : type;

    return Padding(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(displayTitle,
                        style: SsmsType.label.copyWith(fontSize: 14)),
                    if (type.isNotEmpty && title.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(type, style: SsmsType.kicker),
                    ],
                    const SizedBox(height: 6),
                    Text(message, style: SsmsType.body.copyWith(fontSize: 14)),
                    if (when.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text(when, style: SsmsType.meta),
                    ],
                  ],
                ),
              ),
              if (unread) ...[
                const SizedBox(width: 8),
                const SsmsStatusMark('unread'),
              ],
            ],
          ),
          if (unread) ...[
            const SizedBox(height: 10),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: onMarkRead,
                child: const Text('Mark read'),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _AccountRow extends StatelessWidget {
  const _AccountRow({
    required this.label,
    this.value,
    this.badge,
    this.badgeTone,
  });

  final String label;
  final String? value;
  final String? badge;
  final Color? badgeTone;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        children: [
          SizedBox(width: 80, child: Text(label, style: SsmsType.meta)),
          Expanded(
            child: badge != null
                ? Align(
                    alignment: Alignment.centerLeft,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: (badgeTone ?? SsmsColors.navy)
                            .withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        badge!,
                        style: SsmsType.kicker.copyWith(
                          color: badgeTone ?? SsmsColors.navy,
                          fontSize: 10,
                        ),
                      ),
                    ),
                  )
                : Text(value ?? '—',
                    style: SsmsType.label.copyWith(fontSize: 14)),
          ),
        ],
      ),
    );
  }
}

class _PersonCard extends StatelessWidget {
  const _PersonCard({required this.item, required this.onTap});

  final dynamic item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final name = field(item, const ['fullName', 'name'], fallback: 'Student');
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
                Text(field(item, const ['email']), style: SsmsType.meta),
              ],
            ),
          ),
          SsmsStatusMark(
            isAdmin()
                ? prettyStatus(
                    field(item, const ['role', 'status', 'isActive']))
                : field(item, const ['status', 'isActive']),
          ),
        ],
      ),
    );
  }
}

class _PaperCard extends StatelessWidget {
  const _PaperCard({required this.item, required this.onTap});

  final dynamic item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final status = field(item, const ['status']);
    final when = formatStamp(
      field(item, const ['updatedAt', 'createdAt', 'submittedAt']),
    );
    final who = field(item, const ['studentId', 'student', 'fullName']);
    final files = attachmentMaps(item);
    return SsmsCard(
      onTap: onTap,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: statusAccent(status).withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(
              Icons.description_rounded,
              color: statusAccent(status),
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  titleOf(item, fallback: 'Submission'),
                  style: SsmsType.label,
                ),
                const SizedBox(height: 4),
                Text(
                  [
                    if (who.isNotEmpty) who,
                    if (when.isNotEmpty) when,
                    if (files.isNotEmpty) '${files.length} file(s)',
                  ].join(' · '),
                  style: SsmsType.meta,
                ),
                if (canSubmitWork() && status == 'changes_requested') ...[
                  const SizedBox(height: 8),
                  Text(
                    'Tap to review feedback and upload a revised file.',
                    style: SsmsType.meta.copyWith(color: SsmsColors.danger),
                  ),
                ],
              ],
            ),
          ),
          SsmsStatusMark(status),
        ],
      ),
    );
  }
}

class _GuidelineListCard extends StatelessWidget {
  const _GuidelineListCard({
    required this.item,
    required this.onOpen,
    this.submission,
    this.onSubmit,
  });

  final dynamic item;
  final VoidCallback onOpen;
  final dynamic submission;
  final VoidCallback? onSubmit;

  @override
  Widget build(BuildContext context) {
    final due = asDate(field(item, const ['dueDate', 'dueAt']));
    final files = attachmentMaps(item);
    final status =
        submission != null ? field(submission, const ['status']) : '';
    final needsRevision = status == 'changes_requested';

    return SsmsCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          InkWell(
            onTap: onOpen,
            borderRadius: BorderRadius.circular(20),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: SsmsColors.field,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: due == null
                      ? Center(
                          child: Text(
                            '—',
                            style: SsmsType.serif
                                .copyWith(color: SsmsColors.muted),
                          ),
                        )
                      : Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              DateFormat('d').format(due),
                              style: SsmsType.serif
                                  .copyWith(fontSize: 20, height: 1),
                            ),
                            Text(
                              DateFormat('MMM').format(due).toUpperCase(),
                              style: SsmsType.kicker.copyWith(fontSize: 9),
                            ),
                          ],
                        ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        titleOf(item, fallback: 'Guideline'),
                        style: SsmsType.label,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        [
                          due == null ? 'Guideline' : relativeDue(due),
                          if (files.isNotEmpty) '${files.length} attachment(s)',
                        ].join(' · '),
                        style: SsmsType.meta.copyWith(
                          color: due != null &&
                                  relativeDue(due).startsWith('Overdue')
                              ? SsmsColors.danger
                              : SsmsColors.muted,
                        ),
                      ),
                      if (status.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        SsmsStatusMark(status),
                      ],
                    ],
                  ),
                ),
                if (canManageMilestones())
                  IconButton(
                    onPressed: () => showEditGuidelineSheet(context, item),
                    icon:
                        const Icon(Icons.edit_rounded, color: SsmsColors.navy),
                    tooltip: 'Edit',
                  ),
              ],
            ),
          ),
          if (onSubmit != null) ...[
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerRight,
              child: FilledButton.icon(
                onPressed: onSubmit,
                icon: Icon(
                  needsRevision
                      ? Icons.upload_file_rounded
                      : Icons.send_rounded,
                  size: 18,
                ),
                label: Text(
                  needsRevision ? 'Upload revised file' : 'Submit work',
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _NoticeCard extends StatelessWidget {
  const _NoticeCard(this.item, {this.onTap});

  final dynamic item;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final when =
        formatStamp(field(item, const ['createdAt', 'updatedAt', 'sentAt']));
    final unread = item is Map && item['isRead'] != true;
    return SsmsCard(
      onTap: onTap,
      color: unread ? const Color(0xFFF7FAFF) : SsmsColors.paper,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: unread ? SsmsColors.blueSoft : SsmsColors.field,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(
              unread
                  ? Icons.notifications_active_rounded
                  : Icons.notifications_none_rounded,
              color: SsmsColors.navy,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  prettyStatus(field(item, const ['type'])).isEmpty
                      ? 'Note'
                      : prettyStatus(field(item, const ['type'])),
                  style: SsmsType.label,
                ),
                const SizedBox(height: 4),
                Text(
                  field(item, const ['message', 'body', 'description']),
                  style: SsmsType.body,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
                if (when.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(when, style: SsmsType.meta),
                ],
              ],
            ),
          ),
          if (unread)
            Container(
              width: 8,
              height: 8,
              margin: const EdgeInsets.only(top: 6, left: 8),
              decoration: const BoxDecoration(
                color: SsmsColors.navy,
                shape: BoxShape.circle,
              ),
            ),
        ],
      ),
    );
  }
}

void _openPerson(BuildContext context, dynamic item) async {
  final name = field(item, const ['fullName', 'name'], fallback: 'Student');
  final id = field(item, const ['_id', 'id']);
  Map<String, dynamic>? progress;
  if (id.isNotEmpty) {
    progress = await Get.find<DashboardController>().loadStudentProgress(id);
  }
  if (!context.mounted) return;
  final items = (progress?['items'] as List<dynamic>?) ?? [];
  showSsmsSheet(
    context: context,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SsmsInitials(name, size: 64),
        const SizedBox(height: 16),
        Text(name, style: SsmsType.title.copyWith(fontSize: 28)),
        const SizedBox(height: 6),
        Text(field(item, const ['email']), style: SsmsType.body),
        const SizedBox(height: 16),
        SsmsStatusMark(field(item, const ['status', 'isActive'])),
        if (progress != null) ...[
          const SizedBox(height: 20),
          Text('PROGRESS', style: SsmsType.kicker),
          const SizedBox(height: 10),
          Text(
            '${progress['completed'] ?? 0} completed · ${progress['pending'] ?? 0} pending · ${progress['totalMilestones'] ?? 0} total',
            style: SsmsType.body,
          ),
          for (final row in items.take(8))
            Padding(
              padding: const EdgeInsets.only(top: 10),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      field(row, const ['title'], fallback: 'Milestone'),
                      style: SsmsType.label,
                    ),
                  ),
                  SsmsStatusMark(field(row, const ['status'])),
                ],
              ),
            ),
        ],
      ],
    ),
  );
}

Future<void> _openGroup(BuildContext context, dynamic item) async {
  final id = field(item, const ['_id', 'id']);
  if (id.isEmpty) return;
  await navigateToGroupWorkspace(context, groupId: id);
}

Future<void> _openMilestone(BuildContext context, dynamic item) async {
  final files = attachmentMaps(item);
  final canManage = canManageMilestones();
  final id = field(item, const ['_id', 'id']);
  showSsmsSheet(
    context: context,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          titleOf(item, fallback: 'Guideline'),
          style: SsmsType.title.copyWith(fontSize: 28),
        ),
        const SizedBox(height: 12),
        if (field(item, const ['description']).isNotEmpty)
          Text(
            field(item, const ['description']),
            style: SsmsType.body.copyWith(color: SsmsColors.ink),
          ),
        if (field(item, const ['dueDate']).isNotEmpty) ...[
          const SizedBox(height: 16),
          Text('DUE DATE', style: SsmsType.kicker),
          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: SsmsColors.field,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                const Icon(Icons.event_rounded, color: SsmsColors.navy),
                const SizedBox(width: 10),
                Text(
                  formatDay(field(item, const ['dueDate'])),
                  style: SsmsType.label,
                ),
              ],
            ),
          ),
        ] else ...[
          const SizedBox(height: 16),
          Text(
            'No due date · standing guideline',
            style: SsmsType.meta,
          ),
        ],
        if (files.isNotEmpty) ...[
          const SizedBox(height: 16),
          Text('ATTACHMENTS', style: SsmsType.kicker),
          for (final file in files) fileChip(file),
        ],
        if (canSubmitWork() && id.isNotEmpty) ...[
          const SizedBox(height: 22),
          FilledButton.icon(
            onPressed: () {
              Navigator.pop(context);
              showSubmitWorkSheet(
                context,
                milestoneId: id,
                headline: 'Submit work',
              );
            },
            icon: const Icon(Icons.upload_file_rounded, size: 18),
            label: const Text('Submit for this guideline'),
          ),
        ],
        if (canManage) ...[
          const SizedBox(height: 22),
          FilledButton.icon(
            onPressed: () {
              Navigator.pop(context);
              showEditGuidelineSheet(context, item);
            },
            icon: const Icon(Icons.edit_rounded, size: 18),
            label: const Text('Edit date & details'),
          ),
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: id.isEmpty
                ? null
                : () async {
                    final ok = await showDialog<bool>(
                      context: context,
                      builder: (context) => AlertDialog(
                        title: Text('Delete guideline?', style: SsmsType.serif),
                        content: Text(
                          'This also deletes submissions tied to this milestone.',
                          style: SsmsType.body,
                        ),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(context, false),
                            child: const Text('Cancel'),
                          ),
                          TextButton(
                            onPressed: () => Navigator.pop(context, true),
                            child: Text(
                              'Delete',
                              style: SsmsType.button.copyWith(
                                color: SsmsColors.danger,
                                fontSize: 14,
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                    if (ok == true) {
                      final deleted = await Get.find<DashboardController>()
                          .deleteGuideline(id);
                      if (deleted && context.mounted) Navigator.pop(context);
                    }
                  },
            icon: const Icon(Icons.delete_outline_rounded, size: 18),
            label: const Text('Delete'),
          ),
        ],
      ],
    ),
  );
}

Future<void> _openSubmission(BuildContext context, dynamic item) async {
  final controller = Get.find<DashboardController>();
  final id = field(item, const ['_id', 'id']);
  Map<String, dynamic> detail =
      item is Map ? Map<String, dynamic>.from(item) : <String, dynamic>{};
  if (id.isNotEmpty) {
    final loaded = await controller.loadSubmissionDetail(id);
    if (loaded != null) detail = loaded;
  }
  final commentCtrl = TextEditingController();

  if (!context.mounted) return;
  await showSsmsSheet(
    context: context,
    child: StatefulBuilder(
      builder: (context, setState) {
        final canReview = canReviewSubmissions();
        final canUpload = canSubmitWork();
        final status = field(detail, const ['status']);
        final allComments = List<dynamic>.from(
          (detail['comments'] as List<dynamic>?) ?? const [],
        );
        final versions = _submissionVersions(detail);
        final feedbackNote = _latestSupervisorFeedback(allComments, status);
        final threadComments = _discussionComments(allComments, feedbackNote);
        final milestoneId = _milestoneIdFromDetail(detail);

        Future<void> refreshDetail() async {
          if (id.isEmpty) return;
          final refreshed = await controller.loadSubmissionDetail(id);
          if (refreshed == null || !context.mounted) return;
          setState(() => detail = refreshed);
        }

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              titleOf(detail, fallback: 'Submission'),
              style: SsmsType.title.copyWith(fontSize: 28),
            ),
            const SizedBox(height: 10),
            SsmsStatusMark(status),
            const SizedBox(height: 18),
            Text('UPLOADS', style: SsmsType.kicker),
            const SizedBox(height: 8),
            if (versions.isEmpty)
              Text('No uploaded files yet.', style: SsmsType.meta)
            else
              for (final version in versions)
                _UploadVersionCard(version: version),
            if (canUpload) ...[
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: milestoneId.isEmpty
                    ? null
                    : () async {
                        await showSubmitWorkSheet(
                          context,
                          milestoneId: milestoneId,
                          headline: status == 'changes_requested'
                              ? 'Upload revised work'
                              : 'Upload new version',
                          onSubmitted: refreshDetail,
                        );
                      },
                icon: const Icon(Icons.upload_file_rounded, size: 18),
                label: Text(
                  status == 'changes_requested'
                      ? 'Upload revised file'
                      : 'Upload new version',
                ),
              ),
            ],
            const SizedBox(height: 18),
            Text('SUPERVISOR FEEDBACK', style: SsmsType.kicker),
            const SizedBox(height: 8),
            SsmsCard(
              color: SsmsColors.field,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _feedbackHeadline(status),
                    style: SsmsType.label.copyWith(fontSize: 15),
                  ),
                  const SizedBox(height: 6),
                  Text(_feedbackDetail(status), style: SsmsType.body),
                  if (feedbackNote != null) ...[
                    const SizedBox(height: 12),
                    Text('Feedback note', style: SsmsType.kicker),
                    const SizedBox(height: 6),
                    Text(
                      field(feedbackNote,
                          const ['content', 'message', 'comment']),
                      style: SsmsType.body.copyWith(color: SsmsColors.ink),
                    ),
                    if (formatStamp(
                      field(feedbackNote, const ['createdAt']),
                    ).isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text(
                        formatStamp(field(feedbackNote, const ['createdAt'])),
                        style: SsmsType.meta,
                      ),
                    ],
                  ],
                  if (canReview && status == 'pending') ...[
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: () async {
                        final ok = await controller.approve(id);
                        if (!ok || !context.mounted) return;
                        await refreshDetail();
                      },
                      child: const Text('Approve submission'),
                    ),
                    const SizedBox(height: 10),
                    OutlinedButton(
                      onPressed: () async {
                        final feedbackCtrl = TextEditingController();
                        final submitted = await showDialog<bool>(
                          context: context,
                          builder: (context) => AlertDialog(
                            title: Text(
                              'Request changes',
                              style: SsmsType.serif,
                            ),
                            content: Column(
                              mainAxisSize: MainAxisSize.min,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'This official feedback is sent to the student and changes the submission status.',
                                  style: SsmsType.body,
                                ),
                                const SizedBox(height: 14),
                                TextField(
                                  controller: feedbackCtrl,
                                  maxLines: 4,
                                  decoration: const InputDecoration(
                                    labelText: 'Supervisor feedback',
                                    hintText:
                                        'Explain what needs to be changed…',
                                  ),
                                ),
                              ],
                            ),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(context, false),
                                child: const Text('Cancel'),
                              ),
                              TextButton(
                                onPressed: () => Navigator.pop(context, true),
                                child: const Text('Send feedback'),
                              ),
                            ],
                          ),
                        );
                        if (submitted == true &&
                            feedbackCtrl.text.trim().isNotEmpty) {
                          final ok = await controller.requestChanges(
                            submissionId: id,
                            comment: feedbackCtrl.text.trim(),
                          );
                          if (ok && context.mounted) {
                            await refreshDetail();
                          }
                        }
                        feedbackCtrl.dispose();
                      },
                      child: const Text('Request changes'),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 18),
            Text('COMMENTS', style: SsmsType.kicker),
            const SizedBox(height: 6),
            Text(
              'Discussion about this submission. Comments do not change review status.',
              style: SsmsType.meta,
            ),
            const SizedBox(height: 10),
            if (threadComments.isEmpty)
              Text('No comments yet.', style: SsmsType.meta)
            else
              for (final comment in threadComments)
                _CommentRow(comment: comment),
            const SizedBox(height: 12),
            TextField(
              controller: commentCtrl,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText: 'Add a comment about this submission…',
                labelText: 'Comment',
              ),
            ),
            const SizedBox(height: 10),
            Obx(() {
              final busy = controller.actionLoading.value;
              final err = controller.actionError.value;
              return Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (err.isNotEmpty) ...[
                    SsmsErrorNote(err),
                    const SizedBox(height: 10),
                  ],
                  OutlinedButton.icon(
                    onPressed: busy || id.isEmpty
                        ? null
                        : () async {
                            final text = commentCtrl.text.trim();
                            if (text.isEmpty) return;
                            final ok = await controller.addComment(
                              submissionId: id,
                              content: text,
                            );
                            if (!ok) return;
                            commentCtrl.clear();
                            await refreshDetail();
                          },
                    icon: const Icon(Icons.comment_outlined, size: 18),
                    label: Text(busy ? 'Posting…' : 'Post comment'),
                  ),
                ],
              );
            }),
          ],
        );
      },
    ),
  );
  commentCtrl.dispose();
}

String _milestoneIdFromDetail(Map<String, dynamic> detail) {
  final milestone = detail['milestoneId'];
  if (milestone is Map) {
    return field(milestone, const ['_id', 'id']);
  }
  return field(detail, const ['milestoneId']);
}

String _milestoneIdFromSubmission(dynamic item) {
  if (item is Map) {
    return _milestoneIdFromDetail(Map<String, dynamic>.from(item));
  }
  return '';
}

dynamic _submissionForMilestone(
  List<dynamic> submissions,
  String milestoneId,
) {
  if (milestoneId.isEmpty) return null;
  for (final item in submissions) {
    if (_milestoneIdFromSubmission(item) == milestoneId) return item;
  }
  return null;
}

List<Map<String, dynamic>> _submissionVersions(dynamic detail) {
  final versions = detail is Map ? detail['versions'] : null;
  if (versions is! List || versions.isEmpty) {
    final files = attachmentMaps(detail);
    if (files.isEmpty) return const [];
    return [
      {
        'versionNumber': field(detail, const ['version'], fallback: '1'),
        'files': files,
        'note': field(detail, const ['note']),
        'submittedAt': field(detail, const ['submittedAt', 'createdAt']),
      },
    ];
  }
  return [
    for (final version in versions)
      if (version is Map) Map<String, dynamic>.from(version),
  ];
}

dynamic _latestSupervisorFeedback(List<dynamic> comments, String status) {
  if (status != 'changes_requested' && status != 'approved') {
    return null;
  }
  for (final comment in comments.reversed) {
    if (comment is! Map) continue;
    final author = comment['authorId'];
    final role = author is Map
        ? field(author, const ['role'])
        : field(comment, const ['authorRole', 'role']);
    if (role == 'supervisor') return comment;
  }
  return null;
}

List<dynamic> _discussionComments(
  List<dynamic> comments,
  dynamic feedbackNote,
) {
  if (feedbackNote == null) return comments;
  return comments.where((comment) => comment != feedbackNote).toList();
}

String _feedbackHeadline(String status) {
  return switch (status) {
    'approved' => 'Approved',
    'changes_requested' => 'Changes requested',
    'pending' => 'Awaiting supervisor review',
    _ => prettyStatus(status).isEmpty ? 'Review status' : prettyStatus(status),
  };
}

String _feedbackDetail(String status) {
  return switch (status) {
    'approved' =>
      'The supervisor approved this submission. Upload a new version only if a resubmission is required.',
    'changes_requested' =>
      'The supervisor requested changes. Read the feedback note, then upload a revised version from Papers.',
    'pending' =>
      'The submission is waiting for supervisor feedback or approval.',
    _ => 'Track the official review outcome for this submission here.',
  };
}

class _UploadVersionCard extends StatelessWidget {
  const _UploadVersionCard({required this.version});

  final Map<String, dynamic> version;

  @override
  Widget build(BuildContext context) {
    final versionNo = field(version, const ['versionNumber', 'version']);
    final note = field(version, const ['note']);
    final when =
        formatStamp(field(version, const ['submittedAt', 'createdAt']));
    final rawFiles = version['files'];
    final files = rawFiles is List
        ? rawFiles
            .whereType<Map>()
            .map((file) => Map<String, dynamic>.from(file))
            .toList()
        : attachmentMaps(version);

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: SsmsCard(
        color: SsmsColors.field,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              versionNo.isEmpty ? 'Uploaded version' : 'Version $versionNo',
              style: SsmsType.label.copyWith(fontSize: 14),
            ),
            if (when.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(when, style: SsmsType.meta),
            ],
            if (note.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(note, style: SsmsType.body.copyWith(color: SsmsColors.ink)),
            ],
            if (files.isEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text('No files attached.', style: SsmsType.meta),
              )
            else
              for (final file in files) fileChip(file),
          ],
        ),
      ),
    );
  }
}

class _CommentRow extends StatelessWidget {
  const _CommentRow({required this.comment});

  final dynamic comment;

  @override
  Widget build(BuildContext context) {
    final author = comment is Map ? comment['authorId'] : null;
    final authorName = author is Map
        ? field(author, const ['fullName', 'name'], fallback: 'User')
        : 'User';
    final role = author is Map
        ? field(author, const ['role'])
        : field(comment, const ['authorRole', 'role']);
    final content = field(comment, const ['content', 'message', 'comment']);
    final when = formatStamp(field(comment, const ['createdAt']));

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: SsmsCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    [
                      authorName,
                      if (role.isNotEmpty) prettyStatus(role),
                    ].join(' · '),
                    style: SsmsType.label.copyWith(fontSize: 14),
                  ),
                ),
                if (when.isNotEmpty) Text(when, style: SsmsType.meta),
              ],
            ),
            const SizedBox(height: 8),
            Text(content, style: SsmsType.body.copyWith(color: SsmsColors.ink)),
          ],
        ),
      ),
    );
  }
}

Future<void> openMilestoneDetail(BuildContext context, dynamic item) =>
    _openMilestone(context, item);

Future<void> openSubmissionDetail(BuildContext context, dynamic item) =>
    _openSubmission(context, item);

Future<void> openGroupWorkspaceFromItem(
  BuildContext context,
  dynamic item,
) async {
  final id = field(item, const ['_id', 'id']);
  if (id.isEmpty) return;
  await navigateToGroupWorkspace(context, groupId: id);
}
