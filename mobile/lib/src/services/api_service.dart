import 'dart:convert';
import 'dart:io';

import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config/api_config.dart';
import '../utils/password_validator.dart';

class ApiService {
  ApiService({String? baseUrl}) : baseUrl = baseUrl ?? ApiConfig.baseUrl;

  final String baseUrl;
  static const _tokenKey = 'ssms_access_token';

  late final Dio _dio;
  late final CookieJar _cookieJar;
  bool _ready = false;

  Future<void> init() async {
    if (_ready) return;
    ApiConfig.validateForRuntime();
    final dir = await getApplicationDocumentsDirectory();
    _cookieJar = PersistCookieJar(
      storage: FileStorage('${dir.path}/.cookies/'),
    );
    _dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 60),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        validateStatus: (status) => status != null && status < 500,
      ),
    );
    _dio.interceptors.add(CookieManager(_cookieJar));
    _ready = true;
  }

  Future<void> _ensureReady() async {
    if (!_ready) await init();
  }

  Future<String?> get accessToken async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  Future<void> _storeAccessToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  Future<void> _clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await _cookieJar.deleteAll();
  }

  Future<Map<String, dynamic>> login(
    String email,
    String password, {
    bool allowPasswordChange = false,
  }) async {
    await _ensureReady();
    final data = await _request(
      method: 'POST',
      path: '/auth/login',
      body: {'email': email.trim(), 'password': password},
      auth: false,
    );
    final user = data['user'] as Map<String, dynamic>? ?? {};
    final role = (user['role'] ?? '').toString();
    if (role != 'student' && role != 'supervisor' && role != 'admin') {
      await _clearSession();
      throw Exception('Unsupported account role for this app.');
    }
    if (user['mustChangePassword'] == true && !allowPasswordChange) {
      final token = (data['accessToken'] ?? '').toString();
      if (token.isNotEmpty) await _storeAccessToken(token);
      return data;
    }
    final token = (data['accessToken'] ?? '').toString();
    if (token.isEmpty) {
      throw Exception('Login did not return an access token.');
    }
    await _storeAccessToken(token);
    return data;
  }

  Future<Map<String, dynamic>> getMe() async {
    final data = await _request(method: 'GET', path: '/auth/me');
    return (data['user'] as Map<String, dynamic>?) ?? {};
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    await _request(
      method: 'POST',
      path: '/auth/change-password',
      body: {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      },
    );
    await _clearSession();
  }

  Future<void> logout() async {
    await _ensureReady();
    try {
      await _request(method: 'POST', path: '/auth/logout', auth: false);
    } catch (_) {}
    await _clearSession();
  }

  Future<List<dynamic>> getGroups() async {
    final data = await _request(method: 'GET', path: '/groups');
    return (data['groups'] as List<dynamic>?) ?? [];
  }

  Future<List<dynamic>> getMilestones() async {
    final data = await _request(method: 'GET', path: '/milestones');
    return (data['milestones'] as List<dynamic>?) ?? [];
  }

  Future<Map<String, dynamic>> getNotifications({
    bool unreadOnly = false,
    int page = 1,
    int limit = 50,
  }) async {
    final query = <String, dynamic>{
      'page': page,
      'limit': limit,
      if (unreadOnly) 'unreadOnly': true,
    };
    return _request(
      method: 'GET',
      path: '/notifications',
      query: query,
    );
  }

  Future<void> markNotificationRead(String id) async {
    await _request(method: 'PATCH', path: '/notifications/$id/read');
  }

  Future<void> markAllNotificationsRead() async {
    await _request(method: 'PATCH', path: '/notifications/read-all');
  }

  Future<List<dynamic>> getSupervisorStudents(String supervisorId) async {
    final data = await _request(
      method: 'GET',
      path: '/supervisors/$supervisorId/students',
    );
    return (data['students'] as List<dynamic>?) ?? [];
  }

  Future<List<dynamic>> getStudentSubmissions(String studentId) async {
    final data = await _request(
      method: 'GET',
      path: '/students/$studentId/submissions',
    );
    return (data['submissions'] as List<dynamic>?) ?? [];
  }

  Future<Map<String, dynamic>> getStudentProgress(String studentId) async {
    return _request(
      method: 'GET',
      path: '/students/$studentId/progress',
    );
  }

  Future<Map<String, dynamic>?> getStudentSupervisor(String studentId) async {
    final data = await _request(
      method: 'GET',
      path: '/students/$studentId/supervisor',
    );
    final supervisor = data['supervisor'];
    if (supervisor is Map<String, dynamic>) return supervisor;
    return null;
  }

  Future<List<dynamic>> getMilestoneSubmissions(String milestoneId) async {
    final data = await _request(
      method: 'GET',
      path: '/milestones/$milestoneId/submissions',
    );
    return (data['submissions'] as List<dynamic>?) ?? [];
  }

  Future<Map<String, dynamic>> getSubmission(String id) async {
    final data = await _request(method: 'GET', path: '/submissions/$id');
    return (data['submission'] as Map<String, dynamic>?) ?? data;
  }

  Future<Map<String, dynamic>> createSubmission({
    required String milestoneId,
    required List<Map<String, dynamic>> files,
    String? note,
  }) async {
    final data = await _request(
      method: 'POST',
      path: '/submissions',
      body: {
        'milestoneId': milestoneId,
        'files': files,
        if (note != null && note.trim().isNotEmpty) 'note': note.trim(),
      },
    );
    return (data['submission'] as Map<String, dynamic>?) ?? data;
  }

  Future<Map<String, dynamic>> createMilestone({
    required String title,
    String? description,
    int? order,
    String? dueDate,
    String? groupId,
    List<Map<String, dynamic>>? attachments,
  }) async {
    final data = await _request(
      method: 'POST',
      path: '/milestones',
      body: {
        'title': title.trim(),
        if (description != null && description.trim().isNotEmpty)
          'description': description.trim(),
        if (order != null) 'order': order,
        if (dueDate != null && dueDate.isNotEmpty) 'dueDate': dueDate,
        if (groupId != null) 'groupId': groupId,
        if (attachments != null && attachments.isNotEmpty)
          'attachments': attachments,
      },
    );
    return (data['milestone'] as Map<String, dynamic>?) ?? data;
  }

  Future<Map<String, dynamic>> updateMilestone({
    required String id,
    String? title,
    String? description,
    int? order,
    String? dueDate,
    bool clearDueDate = false,
    List<Map<String, dynamic>>? attachments,
    bool? isPublished,
  }) async {
    final body = <String, dynamic>{
      if (title != null) 'title': title.trim(),
      if (description != null) 'description': description.trim(),
      if (order != null) 'order': order,
      if (attachments != null) 'attachments': attachments,
      if (isPublished != null) 'isPublished': isPublished,
    };
    if (clearDueDate) {
      body['dueDate'] = null;
    } else if (dueDate != null) {
      body['dueDate'] = dueDate;
    }
    final data = await _request(
      method: 'PATCH',
      path: '/milestones/$id',
      body: body,
    );
    return (data['milestone'] as Map<String, dynamic>?) ?? data;
  }

  Future<void> deleteMilestone(String id) async {
    await _request(method: 'DELETE', path: '/milestones/$id');
  }

  Future<Map<String, dynamic>> getGroup(String id) async {
    final data = await _request(method: 'GET', path: '/groups/$id');
    final groupRaw = data['group'] ?? data;
    final membersRaw = data['members'];
    return {
      if (groupRaw is Map) 'group': Map<String, dynamic>.from(groupRaw),
      if (membersRaw is List) 'members': membersRaw,
    };
  }

  Future<Map<String, dynamic>> createGroup({
    required String name,
    String? description,
    String? term,
  }) async {
    final data = await _request(
      method: 'POST',
      path: '/groups',
      body: {
        'name': name.trim(),
        if (description != null && description.trim().isNotEmpty)
          'description': description.trim(),
        if (term != null && term.trim().isNotEmpty) 'term': term.trim(),
      },
    );
    return (data['group'] as Map<String, dynamic>?) ?? data;
  }

  Future<Map<String, dynamic>> updateGroup({
    required String id,
    String? name,
    String? description,
    String? term,
    bool? isActive,
  }) async {
    final data = await _request(
      method: 'PATCH',
      path: '/groups/$id',
      body: {
        if (name != null) 'name': name.trim(),
        if (description != null) 'description': description.trim(),
        if (term != null) 'term': term.trim(),
        if (isActive != null) 'isActive': isActive,
      },
    );
    return (data['group'] as Map<String, dynamic>?) ?? data;
  }

  Future<void> deleteGroup(String id) async {
    await _request(method: 'DELETE', path: '/groups/$id');
  }

  Future<Map<String, dynamic>> getSettings() async {
    final data = await _request(method: 'GET', path: '/settings');
    return (data['settings'] as Map<String, dynamic>?) ?? data;
  }

  Future<Map<String, dynamic>> getAdminDashboard() async {
    return _request(method: 'GET', path: '/admin/dashboard');
  }

  Future<Map<String, dynamic>> getUsers({
    String? role,
    String? groupId,
    String? supervisorId,
    String? search,
    int page = 1,
    int limit = 50,
  }) async {
    return _request(
      method: 'GET',
      path: '/users',
      query: {
        'page': page,
        'limit': limit,
        if (role != null && role.isNotEmpty) 'role': role,
        if (groupId != null && groupId.isNotEmpty) 'groupId': groupId,
        if (supervisorId != null && supervisorId.isNotEmpty)
          'supervisorId': supervisorId,
        if (search != null && search.trim().isNotEmpty) 'search': search.trim(),
      },
    );
  }

  Future<Map<String, dynamic>> getUser(String id) async {
    final data = await _request(method: 'GET', path: '/users/$id');
    return (data['user'] as Map<String, dynamic>?) ?? data;
  }

  Future<Map<String, dynamic>> createUser({
    required String fullName,
    required String email,
    required String role,
    String? groupId,
    String? supervisorId,
    String? phone,
    String? password,
  }) async {
    final tempPassword = password?.trim().isNotEmpty == true
        ? password!.trim()
        : generateTemporaryPassword();
    final data = await _request(
      method: 'POST',
      path: '/users',
      body: {
        'fullName': fullName.trim(),
        'email': email.trim().toLowerCase(),
        'role': role,
        'password': tempPassword,
        if (groupId != null && groupId.isNotEmpty) 'groupId': groupId,
        if (supervisorId != null && supervisorId.isNotEmpty)
          'supervisorId': supervisorId,
        if (phone != null && phone.trim().isNotEmpty) 'phone': phone.trim(),
      },
    );
    return (data['user'] as Map<String, dynamic>?) ?? data;
  }

  Future<Map<String, dynamic>> updateUser({
    required String id,
    String? fullName,
    String? phone,
    bool? isActive,
    String? supervisorId,
    String? groupId,
    bool clearGroupId = false,
    bool clearSupervisorId = false,
  }) async {
    final body = <String, dynamic>{
      if (fullName != null) 'fullName': fullName.trim(),
      if (phone != null) 'phone': phone.trim(),
      if (isActive != null) 'isActive': isActive,
    };
    if (clearGroupId) {
      body['groupId'] = null;
    } else if (groupId != null) {
      body['groupId'] = groupId;
    }
    if (clearSupervisorId) {
      body['supervisorId'] = null;
    } else if (supervisorId != null) {
      body['supervisorId'] = supervisorId;
    }
    final data = await _request(
      method: 'PATCH',
      path: '/users/$id',
      body: body,
    );
    return (data['user'] as Map<String, dynamic>?) ?? data;
  }

  Future<void> deleteUser(String id) async {
    await _request(method: 'DELETE', path: '/users/$id');
  }

  /// Admin-only: set a user's password without their current password.
  Future<void> adminResetUserPassword({
    required String userId,
    required String newPassword,
  }) async {
    await _request(
      method: 'POST',
      path: '/users/$userId/reset-password',
      body: {'newPassword': newPassword.trim()},
    );
  }

  Future<Map<String, dynamic>> assignSupervisor({
    required String studentId,
    required String supervisorId,
  }) async {
    final data = await _request(
      method: 'POST',
      path: '/users/$studentId/assign-supervisor',
      body: {'supervisorId': supervisorId},
    );
    return (data['user'] as Map<String, dynamic>?) ?? data;
  }

  Future<Map<String, dynamic>> getAuditLogs({
    String? search,
    String? entityType,
    int page = 1,
    int limit = 50,
  }) async {
    return _request(
      method: 'GET',
      path: '/audit-logs',
      query: {
        'page': page,
        'limit': limit,
        if (search != null && search.trim().isNotEmpty) 'search': search.trim(),
        if (entityType != null && entityType.isNotEmpty)
          'entityType': entityType,
      },
    );
  }

  Future<Map<String, dynamic>> updateMe({
    String? fullName,
    String? phone,
  }) async {
    final data = await _request(
      method: 'PATCH',
      path: '/me',
      body: {
        if (fullName != null) 'fullName': fullName.trim(),
        if (phone != null) 'phone': phone.trim(),
      },
    );
    return (data['user'] as Map<String, dynamic>?) ?? data;
  }

  Future<Map<String, dynamic>> addSubmissionComment({
    required String id,
    required String content,
  }) async {
    final data = await _request(
      method: 'POST',
      path: '/submissions/$id/comments',
      body: {'content': content.trim()},
    );
    return (data['submission'] as Map<String, dynamic>?) ?? data;
  }

  Future<Map<String, dynamic>> approveSubmission(String id) async {
    final data = await _request(
      method: 'PATCH',
      path: '/submissions/$id/approve',
    );
    return (data['submission'] as Map<String, dynamic>?) ?? data;
  }

  Future<Map<String, dynamic>> requestChanges({
    required String id,
    required String comment,
  }) async {
    final data = await _request(
      method: 'PATCH',
      path: '/submissions/$id/request-changes',
      body: {'comment': comment},
    );
    return (data['submission'] as Map<String, dynamic>?) ?? data;
  }

  Future<Map<String, dynamic>> getUploadSignature(String folder) async {
    return _request(
      method: 'POST',
      path: '/uploads/signature',
      body: {'folder': folder},
    );
  }

  /// Documented Cloudinary flow: signature → multipart upload → attachment object.
  Future<Map<String, dynamic>> uploadFile({
    required File file,
    required String originalFilename,
    required String folder,
  }) async {
    final signature = await getUploadSignature(folder);
    final cloudName = signature['cloudName']?.toString() ?? '';
    final apiKey = signature['apiKey']?.toString() ?? '';
    final timestamp = signature['timestamp'];
    final sig = signature['signature']?.toString() ?? '';
    final uploadFolder = signature['folder']?.toString() ?? '';

    if (cloudName.isEmpty || apiKey.isEmpty || sig.isEmpty) {
      throw Exception('Upload signature response was incomplete.');
    }

    final form = FormData.fromMap({
      'file': await MultipartFile.fromFile(
        file.path,
        filename: originalFilename,
      ),
      'api_key': apiKey,
      'timestamp': timestamp,
      'signature': sig,
      'folder': uploadFolder,
    });

    final response = await Dio().post<dynamic>(
      'https://api.cloudinary.com/v1_1/$cloudName/auto/upload',
      data: form,
      options: Options(
        sendTimeout: const Duration(minutes: 2),
        receiveTimeout: const Duration(minutes: 2),
      ),
    );

    final body = response.data is Map
        ? Map<String, dynamic>.from(response.data as Map)
        : <String, dynamic>{};
    if (response.statusCode == null ||
        response.statusCode! < 200 ||
        response.statusCode! >= 300) {
      throw Exception(
          body['error']?['message']?.toString() ?? 'Cloudinary upload failed.');
    }

    return {
      'originalFilename': originalFilename,
      'publicId': body['public_id'],
      'secureUrl': body['secure_url'],
      'format': body['format'],
      'resourceType': body['resource_type'],
      'bytes': body['bytes'],
    };
  }

  Future<bool> _tryRefresh() async {
    try {
      final data = await _request(
        method: 'POST',
        path: '/auth/refresh',
        auth: false,
        allowRefresh: false,
      );
      final token = (data['accessToken'] ?? '').toString();
      if (token.isEmpty) return false;
      await _storeAccessToken(token);
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<Map<String, dynamic>> _request({
    required String method,
    required String path,
    Map<String, dynamic>? body,
    Map<String, dynamic>? query,
    bool auth = true,
    bool allowRefresh = true,
    bool retried = false,
  }) async {
    await _ensureReady();
    final headers = <String, dynamic>{};
    if (auth) {
      final token = await accessToken;
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }

    Response<dynamic> response;
    try {
      response = await _dio.request<dynamic>(
        path,
        data: body == null ? null : jsonEncode(body),
        queryParameters: query,
        options: Options(method: method, headers: headers),
      );
    } on DioException catch (error) {
      final message = error.response?.data is Map
          ? (error.response!.data as Map)['message']?.toString()
          : null;
      throw Exception(message ?? error.message ?? 'Network request failed.');
    }

    final status = response.statusCode ?? 0;
    if (status == 401 && auth && allowRefresh && !retried) {
      if (await _tryRefresh()) {
        return _request(
          method: method,
          path: path,
          body: body,
          query: query,
          auth: auth,
          allowRefresh: false,
          retried: true,
        );
      }
    }

    return _unwrap(response);
  }

  Map<String, dynamic> _unwrap(Response<dynamic> response) {
    final status = response.statusCode ?? 0;
    final body = response.data;
    Map<String, dynamic> envelope;

    if (body is Map<String, dynamic>) {
      envelope = body;
    } else if (body is Map) {
      envelope = Map<String, dynamic>.from(body);
    } else if (body is String && body.isNotEmpty) {
      envelope = jsonDecode(body) as Map<String, dynamic>;
    } else {
      envelope = {};
    }

    final okStatus = status >= 200 && status < 300;
    final success = envelope['success'] == true ||
        (okStatus && !envelope.containsKey('success'));
    if (!success || !okStatus) {
      throw Exception(_formatApiError(envelope, status));
    }

    final data = envelope['data'];
    if (data is Map<String, dynamic>) return data;
    if (data is Map) return Map<String, dynamic>.from(data);
    if (data == null) return {};
    return {'value': data};
  }

  String _formatApiError(Map<String, dynamic> envelope, int status) {
    final details = envelope['details'];
    if (details is List && details.isNotEmpty) {
      final parts = <String>[];
      for (final item in details) {
        if (item is Map) {
          final field = item['field']?.toString();
          final message = item['message']?.toString();
          if (message != null && message.isNotEmpty) {
            parts.add(
                field == null || field.isEmpty ? message : '$field: $message');
          }
        } else if (item != null) {
          parts.add(item.toString());
        }
      }
      if (parts.isNotEmpty) return parts.join('\n');
    }
    return envelope['message']?.toString() ??
        'Request failed with status $status';
  }
}
