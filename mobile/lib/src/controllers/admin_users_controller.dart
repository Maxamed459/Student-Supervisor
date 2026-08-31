import 'package:get/get.dart';

import '../services/api_service.dart';
import '../utils/password_validator.dart';
import 'dashboard_controller.dart';

class AdminUsersController extends GetxController {
  AdminUsersController(this.api);

  final ApiService api;

  final loading = false.obs;
  final actionLoading = false.obs;
  final actionError = ''.obs;
  final actionSuccess = ''.obs;
  final users = <dynamic>[].obs;
  final groups = <dynamic>[].obs;
  final supervisors = <dynamic>[].obs;
  final searchQuery = ''.obs;
  final roleFilter = 'all'.obs;
  final page = 1.obs;
  final totalUsers = 0.obs;

  static const pageSize = 50;

  void clearMessages() {
    actionError.value = '';
    actionSuccess.value = '';
  }

  Future<void> load({bool resetPage = false, bool preserveMessages = false}) async {
    if (resetPage) page.value = 1;
    loading.value = true;
    if (!preserveMessages) clearMessages();
    try {
      final data = await api.getUsers(
        role: roleFilter.value == 'all' ? null : roleFilter.value,
        search: searchQuery.value.trim().isEmpty ? null : searchQuery.value.trim(),
        page: page.value,
        limit: pageSize,
      );
      users.assignAll((data['users'] as List<dynamic>?) ?? []);
      final pagination = data['pagination'] as Map<String, dynamic>?;
      totalUsers.value = pagination?['total'] as int? ?? users.length;
    } catch (exception) {
      actionError.value = exception.toString().replaceFirst('Exception: ', '');
    } finally {
      loading.value = false;
    }
  }

  Future<void> setRoleFilter(String role) async {
    roleFilter.value = role;
    await load(resetPage: true);
  }

  Future<void> search(String query) async {
    searchQuery.value = query;
    await load(resetPage: true);
  }

  Future<bool> createStudent({
    required String fullName,
    required String email,
    required String password,
    String? phone,
    String? groupId,
    String? supervisorId,
  }) async {
    final validation = _validatePerson(
      fullName: fullName,
      email: email,
      password: password,
    );
    if (validation != null) {
      actionError.value = validation;
      return false;
    }
    return _runAction(() async {
      await api.createUser(
        fullName: fullName,
        email: email,
        role: 'student',
        phone: phone,
        groupId: groupId,
        supervisorId: supervisorId,
        password: password,
      );
      actionSuccess.value = 'Student account created.';
      await _refreshAll();
    });
  }

  Future<bool> createSupervisor({
    required String fullName,
    required String email,
    required String password,
    String? phone,
    String? groupId,
  }) async {
    final validation = _validatePerson(
      fullName: fullName,
      email: email,
      password: password,
    );
    if (validation != null) {
      actionError.value = validation;
      return false;
    }
    return _runAction(() async {
      await api.createUser(
        fullName: fullName,
        email: email,
        role: 'supervisor',
        phone: phone,
        groupId: groupId,
        password: password,
      );
      actionSuccess.value = 'Supervisor account created.';
      await _refreshAll();
    });
  }

  Future<bool> createAdmin({
    required String fullName,
    required String email,
    required String password,
    String? phone,
  }) async {
    final validation = _validatePerson(
      fullName: fullName,
      email: email,
      password: password,
    );
    if (validation != null) {
      actionError.value = validation;
      return false;
    }
    return _runAction(() async {
      await api.createUser(
        fullName: fullName,
        email: email,
        role: 'admin',
        phone: phone,
        password: password,
      );
      actionSuccess.value = 'Admin account created.';
      await _refreshAll();
    });
  }

  Future<bool> updateUser({
    required String id,
    String? fullName,
    String? phone,
    bool? isActive,
    String? supervisorId,
    String? groupId,
    bool clearGroupId = false,
    bool clearSupervisorId = false,
  }) async {
    if (fullName != null && fullName.trim().isEmpty) {
      actionError.value = 'Full name is required.';
      return false;
    }
    return _runAction(() async {
      await api.updateUser(
        id: id,
        fullName: fullName,
        phone: phone,
        isActive: isActive,
        supervisorId: supervisorId,
        groupId: groupId,
        clearGroupId: clearGroupId,
        clearSupervisorId: clearSupervisorId,
      );
      actionSuccess.value = 'User updated.';
      await _refreshAll();
    });
  }

  Future<bool> deleteUser(String id, String name) async {
    return _runAction(() async {
      await api.deleteUser(id);
      actionSuccess.value = '$name deleted.';
      await _refreshAll();
    });
  }

  Future<bool> resetUserPassword({
    required String id,
    required String newPassword,
    required String confirmPassword,
  }) async {
    final validation = validateAdminPasswordReset(
      newPassword: newPassword,
      confirmPassword: confirmPassword,
    );
    if (validation != null) {
      actionError.value = validation;
      return false;
    }
    return _runAction(() async {
      await api.adminResetUserPassword(
        userId: id,
        newPassword: newPassword,
      );
      actionSuccess.value = 'Password updated.';
    });
  }

  Future<bool> assignSupervisor({
    required String studentId,
    required String supervisorId,
  }) async {
    if (supervisorId.isEmpty) {
      actionError.value = 'Select a supervisor.';
      return false;
    }
    return _runAction(() async {
      await api.assignSupervisor(
        studentId: studentId,
        supervisorId: supervisorId,
      );
      actionSuccess.value = 'Supervisor assigned.';
      await _refreshAll();
    });
  }

  Future<Map<String, dynamic>?> getUserDetail(String id) async {
    try {
      return await api.getUser(id);
    } catch (exception) {
      actionError.value = exception.toString().replaceFirst('Exception: ', '');
      return null;
    }
  }

  Future<void> loadReferenceData() async {
    try {
      final groupList = await api.getGroups();
      groups.assignAll(groupList);
      final payload = await api.getUsers(role: 'supervisor', limit: 200);
      supervisors.assignAll((payload['users'] as List<dynamic>?) ?? []);
    } catch (exception) {
      actionError.value = exception.toString().replaceFirst('Exception: ', '');
    }
  }

  Future<void> _refreshAll() async {
    await load(preserveMessages: true);
    await Get.find<DashboardController>().load();
  }

  String? _validatePerson({
    required String fullName,
    required String email,
    required String password,
  }) {
    if (fullName.trim().isEmpty) return 'Full name is required.';
    if (email.trim().isEmpty) return 'Email is required.';
    final pattern = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
    if (!pattern.hasMatch(email.trim())) return 'Enter a valid email address.';
    return validateNewAccountPassword(password.trim());
  }

  Future<bool> _runAction(Future<void> Function() action) async {
    actionLoading.value = true;
    clearMessages();
    try {
      await action();
      return true;
    } catch (exception) {
      actionError.value = exception.toString().replaceFirst('Exception: ', '');
      return false;
    } finally {
      actionLoading.value = false;
    }
  }
}
