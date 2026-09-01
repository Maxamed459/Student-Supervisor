import 'dart:convert';

import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/session_user.dart';
import '../widgets/display.dart';
import '../services/api_service.dart';
import '../utils/password_validator.dart';

class AuthController extends GetxController {
  AuthController(this.api);

  final ApiService api;
  final hydrating = true.obs;
  final loading = false.obs;
  final error = ''.obs;
  final user = Rxn<SessionUser>();
  final needsPasswordChange = false.obs;
  final splashDone = false.obs;

  bool get isAuthenticated => user.value != null && !needsPasswordChange.value;

  static bool isSupportedRole(String role) =>
      role == 'student' || role == 'supervisor';

  @override
  Future<void> onInit() async {
    super.onInit();
    await api.init();
    await _restoreSession();
    hydrating.value = false;
    // Splash is only the cold-start gate. After hydrate, advance once.
    await Future<void>.delayed(const Duration(milliseconds: 700));
    splashDone.value = true;
  }

  Future<void> _restoreSession() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString('ssms_user');
    final token = await api.accessToken;
    if (saved == null || token == null || token.isEmpty) {
      await prefs.remove('ssms_user');
      return;
    }

    final savedUser =
        SessionUser.fromJson(jsonDecode(saved) as Map<String, dynamic>);
    if (!isSupportedRole(savedUser.role)) {
      await api.logout();
      await prefs.remove('ssms_user');
      return;
    }

    try {
      final live = await api.getMe();
      final liveUser = SessionUser.fromJson(live);
      if (!isSupportedRole(liveUser.role)) {
        await api.logout();
        await prefs.remove('ssms_user');
        return;
      }
      if (liveUser.mustChangePassword) {
        needsPasswordChange.value = true;
        user.value = liveUser;
        await _persistUser(liveUser);
        return;
      }
      user.value = liveUser;
      needsPasswordChange.value = false;
      await _persistUser(liveUser);
    } catch (_) {
      await api.logout();
      await prefs.remove('ssms_user');
      user.value = null;
      needsPasswordChange.value = false;
    }
  }

  Future<void> login(String email, String password) async {
    error.value = '';
    if (email.trim().isEmpty || password.isEmpty) {
      error.value = 'Enter your email and password.';
      return;
    }
    loading.value = true;
    try {
      final data = await api.login(email, password, allowPasswordChange: true);
      final loggedIn =
          SessionUser.fromJson(data['user'] as Map<String, dynamic>);
      if (!isSupportedRole(loggedIn.role)) {
        await api.logout();
        error.value = loggedIn.role == 'admin'
            ? 'Admin accounts must sign in through the web app.'
            : 'Unsupported account role for this app.';
        return;
      }
      user.value = loggedIn;
      await _persistUser(loggedIn);
      needsPasswordChange.value = loggedIn.mustChangePassword;
      // Never return to splash after a successful login attempt path.
      splashDone.value = true;
    } catch (exception) {
      error.value = exception.toString().replaceFirst('Exception: ', '');
    } finally {
      loading.value = false;
    }
  }

  Future<bool> changePassword({
    required String currentPassword,
    required String newPassword,
    String confirmPassword = '',
  }) async {
    error.value = '';
    final validation = validatePasswordChange(
      currentPassword: currentPassword,
      newPassword: newPassword,
      confirmPassword:
          confirmPassword.isEmpty ? newPassword : confirmPassword,
    );
    if (!validation.isValid) {
      error.value = validation.error!;
      return false;
    }
    loading.value = true;
    try {
      await api.changePassword(
        currentPassword: currentPassword,
        newPassword: newPassword,
      );
      user.value = null;
      needsPasswordChange.value = false;
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('ssms_user');
      splashDone.value = true;
      return true;
    } catch (exception) {
      error.value = exception.toString().replaceFirst('Exception: ', '');
      return false;
    } finally {
      loading.value = false;
    }
  }

  Future<void> logout() async {
    await api.logout();
    user.value = null;
    needsPasswordChange.value = false;
    splashDone.value = true;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('ssms_user');
  }

  void applyProfile({
    dynamic supervisor,
    dynamic group,
    String? groupId,
  }) {
    final current = user.value;
    if (current == null) return;
    String? nextGroupId = current.groupId;
    if (groupId != null && groupId.trim().isNotEmpty) {
      nextGroupId = groupId.trim();
    }
    if (group is Map) {
      final resolved = idOf(group);
      if (resolved.isNotEmpty) nextGroupId = resolved;
    }
    final next = current.copyWith(
      supervisor: supervisor,
      group: group,
      groupId: nextGroupId,
    );
    user.value = next;
    _persistUser(next);
  }

  Future<void> persistCurrentUser() async {
    final current = user.value;
    if (current == null) return;
    await _persistUser(current);
  }

  void replaceUser(SessionUser next) {
    user.value = next;
    _persistUser(next);
  }

  Future<void> _persistUser(SessionUser value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('ssms_user', jsonEncode(value.toJson()));
  }
}
