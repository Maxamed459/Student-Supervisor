import 'dart:typed_data';

import 'package:get/get.dart';

import '../models/session_user.dart';
import '../services/api_service.dart';
import '../widgets/display.dart';
import 'auth_controller.dart';

class DashboardController extends GetxController {
  DashboardController(this.api);

  final ApiService api;
  final loading = false.obs;
  final actionLoading = false.obs;
  final error = ''.obs;
  final actionError = ''.obs;
  final users = <dynamic>[].obs;
  final groups = <dynamic>[].obs;
  final milestones = <dynamic>[].obs;
  final submissions = <dynamic>[].obs;
  final progress = Rxn<Map<String, dynamic>>();
  final notifications = <dynamic>[].obs;
  final unreadCount = 0.obs;
  final settings = Rxn<Map<String, dynamic>>();
  final groupDetail = Rxn<Map<String, dynamic>>();
  final groupMembers = <dynamic>[].obs;
  final adminDashboard = Rxn<Map<String, dynamic>>();
  final auditLogs = <dynamic>[].obs;
  final auditLoading = false.obs;
  final auditError = ''.obs;

  Future<void> load() async {
    loading.value = true;
    error.value = '';
    try {
      final auth = Get.find<AuthController>();
      final current = auth.user.value;
      if (current == null) return;

      if (current.role == 'admin') {
        await _loadAdmin();
      } else if (current.role == 'supervisor') {
        await _loadSupervisor(current.id);
      } else {
        await _loadStudent(current.id);
      }
      await _loadSettings();
    } catch (exception) {
      error.value = exception.toString().replaceFirst('Exception: ', '');
    } finally {
      loading.value = false;
    }
  }

  Future<void> _loadSettings() async {
    try {
      settings.value = await api.getSettings();
    } catch (_) {
      // Settings are optional for core screens.
    }
  }

  Future<void> _loadAdmin() async {
    final results = await Future.wait([
      api.getAdminDashboard(),
      api.getGroups(),
      api.getMilestones(),
      api.getUsers(limit: 100),
      api.getNotifications(),
      api.getAuditLogs(limit: 40),
    ]);

    adminDashboard.value = results[0] as Map<String, dynamic>;
    groups.assignAll(results[1] as List<dynamic>);
    milestones.assignAll(results[2] as List<dynamic>);
    final usersPayload = results[3] as Map<String, dynamic>;
    users.assignAll((usersPayload['users'] as List<dynamic>?) ?? []);
    _applyNotifications(results[4] as Map<String, dynamic>);
    final logsPayload = results[5] as Map<String, dynamic>;
    auditLogs.assignAll((logsPayload['logs'] as List<dynamic>?) ?? []);
    auditError.value = '';
    progress.value = null;
    submissions.assignAll(await _loadSupervisorSubmissions(milestones));
  }

  Future<void> _loadSupervisor(String supervisorId) async {
    Object? groupsError;
    List<dynamic> loadedGroups = [];
    List<dynamic> loadedMilestones = [];
    List<dynamic> loadedStudents = [];
    Map<String, dynamic> loadedNotifications = {};

    try {
      loadedGroups = await api.getGroups();
    } catch (exception) {
      groupsError = exception;
    }

    try {
      loadedMilestones = await api.getMilestones();
    } catch (_) {}

    try {
      loadedStudents = await api.getSupervisorStudents(supervisorId);
    } catch (_) {}

    try {
      loadedNotifications = await api.getNotifications();
    } catch (_) {}

    groups.assignAll(loadedGroups);
    milestones.assignAll(loadedMilestones);
    users.assignAll(loadedStudents);
    _applyNotifications(loadedNotifications);
    progress.value = null;
    adminDashboard.value = null;
    auditLogs.clear();
    submissions.assignAll(await _loadSupervisorSubmissions(milestones));

    final auth = Get.find<AuthController>();
    final current = auth.user.value;
    if (groups.isNotEmpty) {
      Map<String, dynamic>? matched;
      if (current?.groupId != null && current!.groupId!.isNotEmpty) {
        for (final group in groups) {
          if (group is Map &&
              field(group, const ['_id', 'id']) == current.groupId) {
            matched = Map<String, dynamic>.from(group);
            break;
          }
        }
      }
      matched ??= groups.first is Map
          ? Map<String, dynamic>.from(groups.first as Map)
          : null;
      if (matched != null) {
        auth.applyProfile(group: matched);
      }
    } else if (groupsError != null) {
      error.value =
          groupsError.toString().replaceFirst('Exception: ', '');
    }
  }

  Future<void> _loadStudent(String studentId) async {
    Object? groupError;
    List<dynamic> loadedMilestones = [];
    List<dynamic> loadedSubmissions = [];
    Map<String, dynamic> loadedProgress = {};
    Map<String, dynamic> loadedNotifications = {};
    Map<String, dynamic> supervisorPayload = {};
    Map<String, dynamic> groupPayload = {};
    Map<String, dynamic> me = {};

    try {
      loadedMilestones = await api.getMilestones();
    } catch (_) {}

    try {
      loadedSubmissions = await api.getStudentSubmissions(studentId);
    } catch (_) {}

    try {
      loadedProgress = await api.getStudentProgress(studentId);
    } catch (_) {}

    try {
      loadedNotifications = await api.getNotifications();
    } catch (_) {}

    try {
      supervisorPayload = await api.getStudentSupervisor(studentId);
    } catch (_) {}

    try {
      groupPayload = await api.getStudentGroup(studentId);
    } catch (exception) {
      groupError = exception;
    }

    try {
      me = await api.getMe();
    } catch (_) {}

    groups.clear();
    milestones.assignAll(loadedMilestones);
    submissions.assignAll(loadedSubmissions);
    progress.value = loadedProgress;
    _applyNotifications(loadedNotifications);
    users.clear();
    adminDashboard.value = null;
    auditLogs.clear();

    final auth = Get.find<AuthController>();
    final supervisors =
        (supervisorPayload['supervisors'] as List<dynamic>?) ?? [];
    dynamic supervisor = supervisorPayload['supervisor'];
    supervisor ??= supervisors.length == 1 ? supervisors.first : null;
    if (supervisor == null && supervisors.isNotEmpty) {
      supervisor = supervisors.first;
    }

    final groupList = (groupPayload['groups'] as List<dynamic>?) ?? [];
    dynamic group = groupList.isNotEmpty ? groupList.first : me['group'];
    if (group == null) {
      final supervisorGroup = supervisorPayload['group'];
      if (supervisorGroup is Map) group = supervisorGroup;
    }

    final meGroupId = me['groupId'];
    final parsedGroupId = meGroupId == null
        ? null
        : (meGroupId is Map ? idOf(meGroupId) : meGroupId.toString().trim());

    auth.applyProfile(
      supervisor: supervisor,
      group: group,
      groupId: parsedGroupId?.isNotEmpty == true ? parsedGroupId : null,
    );

    if (group is Map) {
      final members = group['students'] ?? group['members'];
      if (members is List) {
        groupMembers.assignAll(members);
      } else {
        groupMembers.clear();
      }
      groupDetail.value = Map<String, dynamic>.from(group);
    } else {
      groupDetail.value = null;
      groupMembers.clear();
    }

    if (groupList.isEmpty &&
        (parsedGroupId == null || parsedGroupId.isEmpty) &&
        groupError != null) {
      error.value =
          groupError.toString().replaceFirst('Exception: ', '');
    } else {
      error.value = '';
    }
  }

  void _applyNotifications(Map<String, dynamic> data) {
    notifications.assignAll((data['notifications'] as List<dynamic>?) ?? []);
    final count = data['unreadCount'];
    if (count is int) {
      unreadCount.value = count;
    } else {
      unreadCount.value = notifications
          .where((item) => item is Map && item['isRead'] != true)
          .length;
    }
  }

  Future<List<dynamic>> _loadSupervisorSubmissions(
    List<dynamic> milestoneList,
  ) async {
    final ids = milestoneList
        .map((item) => field(item, const ['_id', 'id']))
        .where((id) => id.isNotEmpty)
        .toList();
    if (ids.isEmpty) return [];

    final batches = await Future.wait(
      ids.map(
        (id) => api.getMilestoneSubmissions(id).catchError((_) => <dynamic>[]),
      ),
    );
    return batches.expand((batch) => batch).toList();
  }

  Future<void> markNotificationRead(String id) async {
    try {
      await api.markNotificationRead(id);
      final index = notifications.indexWhere(
        (item) => field(item, const ['_id', 'id']) == id,
      );
      if (index >= 0) {
        final map = Map<String, dynamic>.from(notifications[index] as Map);
        map['isRead'] = true;
        notifications[index] = map;
        notifications.refresh();
      }
      if (unreadCount.value > 0) unreadCount.value -= 1;
    } catch (exception) {
      actionError.value = exception.toString().replaceFirst('Exception: ', '');
    }
  }

  Future<void> markAllNotificationsRead() async {
    try {
      await api.markAllNotificationsRead();
      notifications.assignAll(
        notifications.map((item) {
          final map = Map<String, dynamic>.from(item as Map);
          map['isRead'] = true;
          return map;
        }).toList(),
      );
      unreadCount.value = 0;
    } catch (exception) {
      actionError.value = exception.toString().replaceFirst('Exception: ', '');
    }
  }

  Future<bool> submitWork({
    required String milestoneId,
    required Uint8List fileBytes,
    required String originalFilename,
    String? note,
  }) async {
    actionLoading.value = true;
    actionError.value = '';
    try {
      final uploaded = await api.uploadFile(
        bytes: fileBytes,
        originalFilename: originalFilename,
        folder: 'submissions',
      );
      await api.createSubmission(
        milestoneId: milestoneId,
        files: [uploaded],
        note: note,
      );
      await load();
      return true;
    } catch (exception) {
      actionError.value = exception.toString().replaceFirst('Exception: ', '');
      return false;
    } finally {
      actionLoading.value = false;
    }
  }

  Future<bool> publishGuideline({
    required String title,
    String? description,
    String? dueDate,
    Uint8List? fileBytes,
    String? originalFilename,
  }) async {
    actionLoading.value = true;
    actionError.value = '';
    try {
      List<Map<String, dynamic>>? attachments;
      if (fileBytes != null && originalFilename != null) {
        final uploaded = await api.uploadFile(
          bytes: fileBytes,
          originalFilename: originalFilename,
          folder: 'milestones',
        );
        attachments = [uploaded];
      }
      await api.createMilestone(
        title: title,
        description: description,
        dueDate: dueDate,
        attachments: attachments,
        order: milestones.length + 1,
      );
      await load();
      return true;
    } catch (exception) {
      actionError.value = exception.toString().replaceFirst('Exception: ', '');
      return false;
    } finally {
      actionLoading.value = false;
    }
  }

  Future<bool> updateGuideline({
    required String id,
    required String title,
    String? description,
    String? dueDate,
    bool clearDueDate = false,
  }) async {
    actionLoading.value = true;
    actionError.value = '';
    try {
      await api.updateMilestone(
        id: id,
        title: title,
        description: description,
        dueDate: dueDate,
        clearDueDate: clearDueDate,
      );
      await load();
      return true;
    } catch (exception) {
      actionError.value = exception.toString().replaceFirst('Exception: ', '');
      return false;
    } finally {
      actionLoading.value = false;
    }
  }

  Future<bool> approve(String submissionId) async {
    actionLoading.value = true;
    actionError.value = '';
    try {
      await api.approveSubmission(submissionId);
      await load();
      return true;
    } catch (exception) {
      actionError.value = exception.toString().replaceFirst('Exception: ', '');
      return false;
    } finally {
      actionLoading.value = false;
    }
  }

  Future<bool> requestChanges({
    required String submissionId,
    required String comment,
  }) async {
    actionLoading.value = true;
    actionError.value = '';
    try {
      await api.requestChanges(id: submissionId, comment: comment);
      await load();
      return true;
    } catch (exception) {
      actionError.value = exception.toString().replaceFirst('Exception: ', '');
      return false;
    } finally {
      actionLoading.value = false;
    }
  }

  Future<Map<String, dynamic>?> loadSubmissionDetail(String id) async {
    try {
      return await api.getSubmission(id);
    } catch (exception) {
      actionError.value = exception.toString().replaceFirst('Exception: ', '');
      return null;
    }
  }

  Future<Map<String, dynamic>?> loadStudentProgress(String studentId) async {
    try {
      return await api.getStudentProgress(studentId);
    } catch (exception) {
      actionError.value = exception.toString().replaceFirst('Exception: ', '');
      return null;
    }
  }

  List<dynamic> _mergeGroupRoster(Map<String, dynamic> data) {
    final group = data['group'];
    final roster = <dynamic>[
      ...((data['members'] as List<dynamic>?) ?? []),
      ...((data['supervisors'] as List<dynamic>?) ?? []),
    ];
    if (group is Map) {
      roster.addAll((group['students'] as List<dynamic>?) ?? []);
      roster.addAll((group['supervisors'] as List<dynamic>?) ?? []);
    }
    final seen = <String>{};
    final unique = <dynamic>[];
    for (final member in roster) {
      final memberId = field(member, const ['_id', 'id']);
      if (memberId.isEmpty) {
        unique.add(member);
        continue;
      }
      if (seen.add(memberId)) unique.add(member);
    }
    return unique;
  }

  Future<Map<String, dynamic>?> loadGroupDetail(String id) async {
    actionLoading.value = true;
    actionError.value = '';
    try {
      final data = await api.getGroup(id);
      groupDetail.value = data['group'] is Map
          ? Map<String, dynamic>.from(data['group'] as Map)
          : data;
      groupMembers.assignAll(_mergeGroupRoster(data));
      return data;
    } catch (exception) {
      actionError.value = exception.toString().replaceFirst('Exception: ', '');
      return null;
    } finally {
      actionLoading.value = false;
    }
  }

  String? _milestoneGroupId(dynamic milestone) {
    final group = milestone is Map ? milestone['group'] : null;
    if (group is Map) {
      return field(group, const ['_id', 'id']);
    }
    if (group != null) return group.toString();
    return field(milestone, const ['groupId']);
  }

  String? _submissionGroupId(dynamic submission) {
    if (submission is! Map) return null;
    final direct = field(submission, const ['groupId']);
    if (direct.isNotEmpty) return direct;
    final group = submission['group'];
    if (group is Map) return field(group, const ['_id', 'id']);
    if (group != null) return group.toString();
    final milestone = submission['milestone'] ?? submission['milestoneId'];
    if (milestone is Map) return _milestoneGroupId(milestone);
    return null;
  }

  bool _hasDueDate(dynamic milestone) {
    return field(milestone, const ['dueAt', 'dueDate']).isNotEmpty;
  }

  List<dynamic> milestonesForGroup(String groupId) {
    return milestones.where((item) {
      final gid = _milestoneGroupId(item);
      return gid != null && gid == groupId;
    }).toList();
  }

  List<dynamic> guidelinesForGroup(String groupId) {
    return milestonesForGroup(groupId).where((item) => !_hasDueDate(item)).toList();
  }

  List<dynamic> tasksForGroup(String groupId) {
    return milestonesForGroup(groupId).where(_hasDueDate).toList();
  }

  List<dynamic> submissionsForGroup(String groupId) {
    return submissions.where((item) {
      final gid = _submissionGroupId(item);
      return gid != null && gid == groupId;
    }).toList();
  }

  Future<bool> addComment({
    required String submissionId,
    required String content,
  }) async {
    actionLoading.value = true;
    actionError.value = '';
    try {
      await api.addSubmissionComment(id: submissionId, content: content);
      await load();
      return true;
    } catch (exception) {
      actionError.value = exception.toString().replaceFirst('Exception: ', '');
      return false;
    } finally {
      actionLoading.value = false;
    }
  }

  Future<bool> deleteGuideline(String id) async {
    actionLoading.value = true;
    actionError.value = '';
    try {
      await api.deleteMilestone(id);
      await load();
      return true;
    } catch (exception) {
      actionError.value = exception.toString().replaceFirst('Exception: ', '');
      return false;
    } finally {
      actionLoading.value = false;
    }
  }

  Future<void> loadAuditLogs({
    String? search,
    String? entityType,
    int page = 1,
    int limit = 50,
  }) async {
    auditLoading.value = true;
    auditError.value = '';
    try {
      final data = await api.getAuditLogs(
        search: search,
        entityType: entityType,
        page: page,
        limit: limit,
      );
      auditLogs.assignAll((data['logs'] as List<dynamic>?) ?? []);
    } catch (exception) {
      auditError.value = exception.toString().replaceFirst('Exception: ', '');
    } finally {
      auditLoading.value = false;
    }
  }

  Future<bool> updateProfile({
    required String fullName,
    String? phone,
  }) async {
    actionLoading.value = true;
    actionError.value = '';
    try {
      final userJson = await api.updateMe(
        fullName: fullName,
        phone: phone,
      );
      final auth = Get.find<AuthController>();
      final current = auth.user.value;
      final updated = SessionUser.fromJson(userJson).copyWith(
        supervisor: current?.supervisor,
        group: current?.group,
      );
      auth.replaceUser(updated);
      return true;
    } catch (exception) {
      actionError.value = exception.toString().replaceFirst('Exception: ', '');
      return false;
    } finally {
      actionLoading.value = false;
    }
  }
}
