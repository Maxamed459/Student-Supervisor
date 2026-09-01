import 'package:get/get.dart';

import '../services/api_service.dart';
import '../utils/student_import_parser.dart';
import '../widgets/display.dart';
import 'dashboard_controller.dart';

class StudentImportOutcome {
  StudentImportOutcome({
    required this.created,
    required this.skipped,
    required this.failed,
    required this.messages,
  });

  final int created;
  final int skipped;
  final int failed;
  final List<String> messages;
}

class AdminController extends GetxController {
  AdminController(this.api);

  final ApiService api;
  static const minStudentsPerGroup = 2;

  final actionLoading = false.obs;
  final actionError = ''.obs;
  final actionSuccess = ''.obs;

  final selectedGroup = Rxn<Map<String, dynamic>>();
  final groupMembers = <dynamic>[].obs;
  final unassignedStudents = <dynamic>[].obs;
  final availableSupervisors = <dynamic>[].obs;

  void clearMessages() {
    actionError.value = '';
    actionSuccess.value = '';
  }

  List<dynamic> get studentsInGroup => groupMembers
      .where((member) => field(member, const ['role']).toLowerCase() == 'student')
      .toList();

  List<dynamic> get supervisorsInGroup => groupMembers
      .where((member) => field(member, const ['role']).toLowerCase() == 'supervisor')
      .toList();

  String? get primarySupervisorId {
    final supervisors = supervisorsInGroup;
    if (supervisors.isEmpty) return null;
    final id = idOf(supervisors.first);
    return id.isEmpty ? null : id;
  }

  bool get hasSupervisor => supervisorsInGroup.isNotEmpty;

  bool get hasMultipleSupervisors => supervisorsInGroup.length > 1;

  String? _groupSupervisorBlockReason() {
    if (!hasSupervisor) return null;
    return 'This group already has a supervisor. Use Change supervisor instead.';
  }

  Future<void> refreshGroups() async {
    await Get.find<DashboardController>().load();
  }

  Future<bool> loadGroupDetail(String groupId) async {
    actionLoading.value = true;
    clearMessages();
    selectedGroup.value = null;
    groupMembers.clear();
    try {
      final data = await api.getGroup(groupId);
      final groupRaw = data['group'];
      if (groupRaw is Map) {
        selectedGroup.value = Map<String, dynamic>.from(groupRaw);
      }
      final members = data['members'];
      if (members is List) {
        groupMembers.assignAll(members);
      }
      if (selectedGroup.value == null) {
        actionError.value = 'Group details were not returned by the server.';
        return false;
      }
      try {
        await _loadAssignmentPools(groupId);
      } catch (_) {
        // Assignment pools are optional for viewing group details.
      }
      return true;
    } catch (exception) {
      actionError.value = exception.toString().replaceFirst('Exception: ', '');
      selectedGroup.value = null;
      groupMembers.clear();
      return false;
    } finally {
      actionLoading.value = false;
    }
  }

  Future<void> _loadAssignmentPools(String groupId) async {
    final results = await Future.wait([
      api.getUsers(role: 'student', limit: 200),
      api.getUsers(role: 'supervisor', limit: 200),
    ]);
    final studentsPayload = results[0];
    final supervisorsPayload = results[1];
    final allStudents =
        (studentsPayload['users'] as List<dynamic>?) ?? <dynamic>[];
    final allSupervisors =
        (supervisorsPayload['users'] as List<dynamic>?) ?? <dynamic>[];

    unassignedStudents.assignAll(
      allStudents.where((student) => groupIdOf(student).isEmpty),
    );

    availableSupervisors.assignAll(allSupervisors);
  }

  Future<bool> createGroup({
    required String name,
    String? description,
    String? term,
  }) async {
    if (name.trim().isEmpty) {
      actionError.value = 'Group name is required.';
      return false;
    }
    return _runAction(() async {
      await api.createGroup(
        name: name,
        description: description,
        term: term,
      );
      actionSuccess.value = 'Group created.';
      await refreshGroups();
    });
  }

  Future<bool> updateGroup({
    required String groupId,
    required String name,
    String? description,
    String? term,
  }) async {
    if (name.trim().isEmpty) {
      actionError.value = 'Group name is required.';
      return false;
    }
    return _runAction(() async {
      await api.updateGroup(
        id: groupId,
        name: name,
        description: description,
        term: term,
      );
      actionSuccess.value = 'Group updated.';
      await refreshGroups();
      await loadGroupDetail(groupId);
    });
  }

  Future<bool> deleteGroup(String groupId) async {
    return _runAction(() async {
      await api.deleteGroup(groupId);
      selectedGroup.value = null;
      groupMembers.clear();
      actionSuccess.value = 'Group deleted.';
      await refreshGroups();
    });
  }

  Future<bool> createSupervisor({
    required String groupId,
    required String fullName,
    required String email,
    String? phone,
  }) async {
    final validation = _validatePerson(fullName: fullName, email: email);
    if (validation != null) {
      actionError.value = validation;
      return false;
    }
    final block = _groupSupervisorBlockReason();
    if (block != null) {
      actionError.value = block;
      return false;
    }
    return _runAction(() async {
      await api.createUser(
        fullName: fullName,
        email: email,
        role: 'supervisor',
        groupId: groupId,
        phone: phone,
      );
      actionSuccess.value = 'Supervisor created and assigned to this group.';
      await loadGroupDetail(groupId);
      await refreshGroups();
    });
  }

  Future<bool> assignSupervisorToGroup({
    required String groupId,
    required String supervisorId,
    required String supervisorName,
    required String groupName,
  }) async {
    if (supervisorId.isEmpty) {
      actionError.value = 'Select a supervisor.';
      return false;
    }
    final block = _groupSupervisorBlockReason();
    if (block != null) {
      actionError.value = block;
      return false;
    }
    return _runAction(() async {
      await api.updateUser(id: supervisorId, groupId: groupId);
      actionSuccess.value =
          '$supervisorName assigned to $groupName.';
      await loadGroupDetail(groupId);
      await refreshGroups();
    });
  }

  Future<bool> removeSupervisorFromGroup({
    required String groupId,
    required String supervisorId,
    required int currentStudentCount,
  }) async {
    if (currentStudentCount > 0) {
      actionError.value =
          'Reassign or remove students before removing the supervisor.';
      return false;
    }
    return _runAction(() async {
      await api.updateUser(
        id: supervisorId,
        clearGroupId: true,
      );
      actionSuccess.value = 'Supervisor removed from group.';
      await loadGroupDetail(groupId);
      await refreshGroups();
    });
  }

  Future<bool> createStudent({
    required String groupId,
    required String supervisorId,
    required String fullName,
    required String email,
    String? phone,
  }) async {
    final validation = _validatePerson(fullName: fullName, email: email);
    if (validation != null) {
      actionError.value = validation;
      return false;
    }
    if (supervisorId.isEmpty) {
      actionError.value = 'Assign a supervisor to this group first.';
      return false;
    }
    return _runAction(() async {
      await api.createUser(
        fullName: fullName,
        email: email,
        role: 'student',
        groupId: groupId,
        supervisorId: supervisorId,
        phone: phone,
      );
      actionSuccess.value = 'Student created and added to this group.';
      await loadGroupDetail(groupId);
      await refreshGroups();
    });
  }

  Future<bool> assignExistingStudent({
    required String groupId,
    required String supervisorId,
    required String studentId,
    required String studentName,
    required String groupName,
    required String supervisorName,
    String? currentGroupName,
  }) async {
    if (studentId.isEmpty) {
      actionError.value = 'Select a student.';
      return false;
    }
    if (supervisorId.isEmpty) {
      actionError.value = 'Assign a supervisor to this group first.';
      return false;
    }
    if (_isStudentInGroup(studentId)) {
      actionError.value = '$studentName is already in this group.';
      return false;
    }
    return _runAction(() async {
      await api.updateUser(
        id: studentId,
        groupId: groupId,
        supervisorId: supervisorId,
      );
      if (currentGroupName != null && currentGroupName.isNotEmpty) {
        actionSuccess.value =
            '$studentName moved from $currentGroupName to $groupName under $supervisorName.';
      } else {
        actionSuccess.value =
            '$studentName added to $groupName under $supervisorName.';
      }
      await loadGroupDetail(groupId);
      await refreshGroups();
    });
  }

  Future<bool> changeGroupSupervisor({
    required String groupId,
    required String newSupervisorId,
    required String newSupervisorName,
    required String groupName,
    String? previousSupervisorId,
  }) async {
    if (newSupervisorId.isEmpty) {
      actionError.value = 'Select a supervisor.';
      return false;
    }
    return _runAction(() async {
      await api.updateUser(id: newSupervisorId, groupId: groupId);
      for (final supervisor in supervisorsInGroup) {
        final existingId = idOf(supervisor);
        if (existingId.isNotEmpty && existingId != newSupervisorId) {
          await api.updateUser(id: existingId, clearGroupId: true);
        }
      }
      if (previousSupervisorId != null &&
          previousSupervisorId.isNotEmpty &&
          previousSupervisorId != newSupervisorId) {
        await api.updateUser(id: previousSupervisorId, clearGroupId: true);
      }
      for (final student in studentsInGroup) {
        final studentId = field(student, const ['_id', 'id']);
        if (studentId.isEmpty) continue;
        await api.updateUser(
          id: studentId,
          supervisorId: newSupervisorId,
        );
      }
      actionSuccess.value =
          '$newSupervisorName is now supervisor for $groupName.';
      await loadGroupDetail(groupId);
      await refreshGroups();
    });
  }

  Future<bool> createGroupWithMembers({
    required String name,
    required String supervisorId,
    required List<String> studentIds,
    String? description,
    String? term,
    String? newSupervisorFullName,
    String? newSupervisorEmail,
    String? newSupervisorPhone,
  }) async {
    if (name.trim().isEmpty) {
      actionError.value = 'Group name is required.';
      return false;
    }
    if (studentIds.length < minStudentsPerGroup) {
      actionError.value =
          'Select at least $minStudentsPerGroup students to create a group.';
      return false;
    }
    final uniqueStudentIds = studentIds.toSet().toList();
    if (uniqueStudentIds.length < minStudentsPerGroup) {
      actionError.value = 'Each student can only be selected once.';
      return false;
    }

    return _runAction(() async {
      var resolvedSupervisorId = supervisorId;
      if (resolvedSupervisorId.isEmpty) {
        if (newSupervisorFullName == null || newSupervisorEmail == null) {
          throw Exception('Assign a supervisor before saving.');
        }
        final validation = _validatePerson(
          fullName: newSupervisorFullName,
          email: newSupervisorEmail,
        );
        if (validation != null) throw Exception(validation);
      }

      final groupData = await api.createGroup(
        name: name,
        description: description,
        term: term,
      );
      final group = groupData['group'] as Map<String, dynamic>? ?? groupData;
      final groupId = field(group, const ['_id', 'id']);
      if (groupId.isEmpty) {
        throw Exception('Group was created but no id was returned.');
      }

      if (supervisorId.isEmpty) {
        final created = await api.createUser(
          fullName: newSupervisorFullName!,
          email: newSupervisorEmail!,
          role: 'supervisor',
          groupId: groupId,
          phone: newSupervisorPhone,
        );
        resolvedSupervisorId =
            field(created['user'] ?? created, const ['_id', 'id']);
      } else {
        await api.updateUser(id: resolvedSupervisorId, groupId: groupId);
      }

      for (final studentId in uniqueStudentIds) {
        await api.updateUser(
          id: studentId,
          groupId: groupId,
          supervisorId: resolvedSupervisorId,
        );
      }

      actionSuccess.value =
          'Group created with ${uniqueStudentIds.length} students.';
      await refreshGroups();
    });
  }

  Future<void> loadStudentPool() async {
    try {
      final payload = await api.getUsers(role: 'student', limit: 300);
      final allStudents =
          (payload['users'] as List<dynamic>?) ?? <dynamic>[];
      unassignedStudents.assignAll(
        allStudents.where((student) => groupIdOf(student).isEmpty),
      );
      final supervisorsPayload =
          await api.getUsers(role: 'supervisor', limit: 200);
      availableSupervisors.assignAll(
        (supervisorsPayload['users'] as List<dynamic>?) ?? <dynamic>[],
      );
    } catch (exception) {
      actionError.value = exception.toString().replaceFirst('Exception: ', '');
    }
  }

  bool _isStudentInGroup(String studentId) {
    return studentsInGroup.any(
      (student) => field(student, const ['_id', 'id']) == studentId,
    );
  }

  Future<bool> removeStudentFromGroup({
    required String groupId,
    required String studentId,
    required String studentName,
  }) async {
    final remaining = studentsInGroup.length - 1;
    if (remaining < minStudentsPerGroup) {
      actionError.value =
          'Each group must keep at least $minStudentsPerGroup students.';
      return false;
    }
    return _runAction(() async {
      await api.updateUser(
        id: studentId,
        clearGroupId: true,
        clearSupervisorId: true,
      );
      actionSuccess.value = '$studentName removed from group.';
      await loadGroupDetail(groupId);
      await refreshGroups();
    });
  }

  Future<StudentImportOutcome?> importStudents({
    required String groupId,
    required String groupName,
    required String supervisorId,
    required String supervisorName,
    required List<StudentImportRow> rows,
  }) async {
    if (supervisorId.isEmpty) {
      actionError.value = 'Assign a supervisor to this group before importing.';
      return null;
    }
    if (rows.isEmpty) {
      actionError.value = 'No valid rows to import.';
      return null;
    }

    actionLoading.value = true;
    clearMessages();
    var created = 0;
    var skipped = 0;
    var failed = 0;
    final messages = <String>[];

    try {
      final existingPayload = await api.getUsers(limit: 300);
      final existingUsers =
          (existingPayload['users'] as List<dynamic>?) ?? <dynamic>[];
      final emails = <String>{
        for (final user in existingUsers)
          field(user, const ['email']).toLowerCase(),
      };
      final fileEmails = <String>{};

      for (final row in rows) {
        if (fileEmails.contains(row.email)) {
          skipped++;
          messages.add('Row ${row.rowNumber}: duplicate in file (${row.email}).');
          continue;
        }
        fileEmails.add(row.email);
        if (emails.contains(row.email)) {
          skipped++;
          messages.add('Row ${row.rowNumber}: email already exists (${row.email}).');
          continue;
        }
        try {
          await api.createUser(
            fullName: row.fullName,
            email: row.email,
            role: 'student',
            groupId: groupId,
            supervisorId: supervisorId,
            phone: row.phone,
          );
          emails.add(row.email);
          created++;
        } catch (exception) {
          failed++;
          messages.add(
            'Row ${row.rowNumber}: ${exception.toString().replaceFirst('Exception: ', '')}',
          );
        }
      }

      await loadGroupDetail(groupId);
      await refreshGroups();
      actionSuccess.value =
          'Import finished for $groupName under $supervisorName: $created created, $skipped skipped, $failed failed.';
      return StudentImportOutcome(
        created: created,
        skipped: skipped,
        failed: failed,
        messages: messages,
      );
    } catch (exception) {
      actionError.value = exception.toString().replaceFirst('Exception: ', '');
      return null;
    } finally {
      actionLoading.value = false;
    }
  }

  String? _validatePerson({required String fullName, required String email}) {
    if (fullName.trim().isEmpty) return 'Full name is required.';
    if (email.trim().isEmpty) return 'Email is required.';
    final pattern = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
    if (!pattern.hasMatch(email.trim())) return 'Enter a valid email address.';
    return null;
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
