import 'dart:io';

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
    final results = await Future.wait([
      api.getGroups(),
      api.getMilestones(),
      api.getSupervisorStudents(supervisorId),
      api.getNotifications(),
    ]);

    groups.assignAll(results[0] as List<dynamic>);
    milestones.assignAll(results[1] as List<dynamic>);
    users.assignAll(results[2] as List<dynamic>);
    _applyNotifications(results[3] as Map<String, dynamic>);
    progress.value = null;
    adminDashboard.value = null;
    auditLogs.clear();
    submissions.assignAll(await _loadSupervisorSubmissions(milestones));

    final auth = Get.find<AuthController>();
    final current = auth.user.value;
    if (current?.groupId != null && current!.groupId!.isNotEmpty) {
      for (final group in groups) {
        if (field(group, const ['_id', 'id']) == current.groupId) {
          auth.applyProfile(group: group);
          break;
        }
      }
    }
  }

  Future<void> _loadStudent(String studentId) async {
    final results = await Future.wait([
      api.getMilestones(),
      api.getStudentSubmissions(studentId),
      api.getStudentProgress(studentId),
      api.getNotifications(),
      api.getStudentSupervisor(studentId),
      api.getMe(),
    ]);

    groups.clear();
    milestones.assignAll(results[0] as List<dynamic>);
    submissions.assignAll(results[1] as List<dynamic>);
    progress.value = results[2] as Map<String, dynamic>;
    _applyNotifications(results[3] as Map<String, dynamic>);
    users.clear();
    adminDashboard.value = null;
    auditLogs.clear();

    final auth = Get.find<AuthController>();
    final supervisor = results[4] as Map<String, dynamic>?;
    final me = results[5] as Map<String, dynamic>;
    auth.applyProfile(
      supervisor: supervisor ?? me['supervisor'],
      group: me['group'],
    );

    final group = me['group'];
    if (group is Map && group['members'] is List) {
      groupMembers.assignAll(group['members'] as List);
      groupDetail.value = Map<String, dynamic>.from(group);
    } else {
      groupDetail.value = group is Map
          ? Map<String, dynamic>.from(group)
          : null;
      groupMembers.clear();
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
    required File file,
    required String originalFilename,
    String? note,
  }) async {
    actionLoading.value = true;
    actionError.value = '';
    try {
      final uploaded = await api.uploadFile(
        file: file,
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
    File? file,
    String? originalFilename,
  }) async {
    actionLoading.value = true;
    actionError.value = '';
    try {
      List<Map<String, dynamic>>? attachments;
      if (file != null && originalFilename != null) {
        final uploaded = await api.uploadFile(
          file: file,
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

  Future<Map<String, dynamic>?> loadGroupDetail(String id) async {
    actionLoading.value = true;
    actionError.value = '';
    try {
      final data = await api.getGroup(id);
      groupDetail.value = data['group'] is Map
          ? Map<String, dynamic>.from(data['group'] as Map)
          : data;
      groupMembers.assignAll((data['members'] as List<dynamic>?) ?? []);
      return data;
    } catch (exception) {
      actionError.value = exception.toString().replaceFirst('Exception: ', '');
      return null;
    } finally {
      actionLoading.value = false;
    }
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
