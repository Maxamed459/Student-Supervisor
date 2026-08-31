import 'package:flutter/material.dart';

import '../widgets/display.dart';

class FormattedAuditLog {
  const FormattedAuditLog({
    required this.message,
    required this.actorName,
    required this.actorRole,
    required this.timestamp,
    this.affected,
    this.groupName,
    this.technicalAction = '',
    required this.icon,
  });

  final String message;
  final String actorName;
  final String actorRole;
  final String timestamp;
  final String? affected;
  final String? groupName;
  final String technicalAction;
  final IconData icon;
}

FormattedAuditLog formatAuditLog(dynamic item) {
  final actor = _actor(item);
  final action = _string(item, const ['action']).toLowerCase();
  final entityType = _string(item, const ['entityType']);
  final groupName = _firstNonEmpty([
    _meta(item, const ['groupName', 'group']),
    _nestedName(item, const ['group']),
    _meta(item, const ['cohortName']),
  ]);
  final studentName = _firstNonEmpty([
    _meta(item, const ['studentName', 'studentFullName']),
    _nestedName(item, const ['student', 'targetStudent']),
    _entityName(item, 'Student'),
  ]);
  final supervisorName = _firstNonEmpty([
    _meta(item, const ['supervisorName', 'supervisorFullName']),
    _nestedName(item, const ['supervisor', 'targetSupervisor']),
    _entityName(item, 'Supervisor'),
  ]);
  final userName = _firstNonEmpty([
    _meta(item, const ['userName', 'targetUserName', 'fullName']),
    _nestedName(item, const ['targetUser', 'user', 'entity']),
    studentName,
    supervisorName,
  ]);
  final milestoneTitle = _firstNonEmpty([
    _meta(item, const ['milestoneTitle', 'title', 'milestoneName']),
    _nestedName(item, const ['milestone']),
    _entityName(item, 'Milestone'),
  ]);
  final submissionLabel = _firstNonEmpty([
    _meta(item, const ['submissionTitle', 'fileName', 'originalFilename']),
    milestoneTitle,
    _entityName(item, 'Submission'),
  ]);

  final roleLabel = _roleLabel(actor.role);
  final actorName = actor.name;
  final message = _buildMessage(
    action: action,
    entityType: entityType,
    roleLabel: roleLabel,
    actorName: actorName,
    groupName: groupName,
    studentName: studentName,
    supervisorName: supervisorName,
    userName: userName,
    milestoneTitle: milestoneTitle,
    submissionLabel: submissionLabel,
    item: item,
  );

  final affected = _buildAffected(
    action: action,
    entityType: entityType,
    groupName: groupName,
    studentName: studentName,
    supervisorName: supervisorName,
    userName: userName,
    milestoneTitle: milestoneTitle,
    submissionLabel: submissionLabel,
  );

  return FormattedAuditLog(
    message: message,
    actorName: actorName,
    actorRole: roleLabel,
    timestamp: formatStamp(_string(item, const ['createdAt'])),
    affected: affected,
    groupName: groupName.isEmpty ? null : groupName,
    technicalAction: _string(item, const ['action']),
    icon: _iconFor(action, entityType),
  );
}

class _Actor {
  const _Actor({required this.name, required this.role});

  final String name;
  final String role;
}

_Actor _actor(dynamic item) {
  final user = item is Map ? item['userId'] : null;
  if (user is Map) {
    return _Actor(
      name: _string(user, const ['fullName', 'name', 'email'], fallback: 'Someone'),
      role: _string(user, const ['role']),
    );
  }
  return const _Actor(name: 'System', role: '');
}

String _buildMessage({
  required String action,
  required String entityType,
  required String roleLabel,
  required String actorName,
  required String groupName,
  required String studentName,
  required String supervisorName,
  required String userName,
  required String milestoneTitle,
  required String submissionLabel,
  required dynamic item,
}) {
  final who = roleLabel.isEmpty ? actorName : '$roleLabel $actorName';

  if (_matches(action, ['auth.change_password', 'user.change_password', 'password.change'])) {
    return '$who changed their password.';
  }
  if (_matches(action, ['auth.login', 'user.login'])) {
    return '$who signed in.';
  }
  if (_matches(action, ['auth.logout', 'user.logout'])) {
    return '$who signed out.';
  }

  if (_matches(action, ['group.create'])) {
    final name = groupName.isEmpty ? 'a new group' : groupName;
    if (supervisorName.isNotEmpty) {
      return '$who created $name and assigned Supervisor $supervisorName.';
    }
    return '$who created $name.';
  }
  if (_matches(action, ['group.update', 'group.patch'])) {
    return '$who updated ${groupName.isEmpty ? 'a group' : groupName}.';
  }
  if (_matches(action, ['group.delete', 'group.remove'])) {
    return '$who deleted ${groupName.isEmpty ? 'a group' : groupName}.';
  }

  if (_matches(action, ['user.create', 'users.create'])) {
    final createdRole = _meta(item, const ['role']).toLowerCase();
    final createdName = userName.isEmpty ? 'a user' : userName;
    if (createdRole == 'student' && groupName.isNotEmpty) {
      if (supervisorName.isNotEmpty) {
        return '$who added Student $createdName to $groupName under Supervisor $supervisorName.';
      }
      return '$who added Student $createdName to $groupName.';
    }
    if (createdRole == 'supervisor' && groupName.isNotEmpty) {
      return '$who assigned Supervisor $createdName to $groupName.';
    }
    return '$who created account for $createdName.';
  }

  if (_matches(action, [
    'user.assign_supervisor',
    'user.assign-supervisor',
    'users.assign_supervisor',
  ])) {
    final student = studentName.isEmpty ? 'a student' : studentName;
    final supervisor = supervisorName.isEmpty ? 'a new supervisor' : supervisorName;
    return '$who changed $student\'s supervisor to $supervisor.';
  }

  if (_matches(action, ['user.update', 'users.update', 'user.patch'])) {
    if (supervisorName.isNotEmpty && studentName.isNotEmpty) {
      return '$who changed $studentName\'s supervisor to $supervisorName.';
    }
    if (groupName.isNotEmpty && studentName.isNotEmpty) {
      return '$who updated Student $studentName in $groupName.';
    }
    if (groupName.isNotEmpty && supervisorName.isNotEmpty) {
      return '$who updated Supervisor $supervisorName in $groupName.';
    }
    if (userName.isNotEmpty) {
      return '$who updated $userName\'s account.';
    }
    return '$who updated a user account.';
  }

  if (_matches(action, ['user.delete', 'users.delete'])) {
    return '$who deleted ${userName.isEmpty ? 'a user account' : userName}.';
  }

  if (_matches(action, ['submission.create', 'submissions.create'])) {
    final label = submissionLabel.isEmpty ? 'work' : submissionLabel;
    return '$who submitted $label.';
  }
  if (_matches(action, ['submission.approve', 'submissions.approve'])) {
    final label = submissionLabel.isEmpty ? 'a submission' : submissionLabel;
    if (studentName.isNotEmpty) {
      return '$who approved $studentName\'s $label.';
    }
    return '$who approved $label.';
  }
  if (_matches(action, [
    'submission.request_changes',
    'submission.request-changes',
    'submissions.request_changes',
  ])) {
    final label = submissionLabel.isEmpty ? 'a submission' : submissionLabel;
    if (studentName.isNotEmpty) {
      return '$who requested changes on $studentName\'s $label.';
    }
    return '$who requested changes on $label.';
  }
  if (_matches(action, ['submission.comment', 'submissions.comment'])) {
    final label = submissionLabel.isEmpty ? 'a submission' : submissionLabel;
    return '$who commented on $label.';
  }

  if (_matches(action, ['milestone.create', 'milestones.create'])) {
    final title = milestoneTitle.isEmpty ? 'a guideline' : milestoneTitle;
    return '$who published $title.';
  }
  if (_matches(action, ['milestone.update', 'milestones.update', 'milestone.patch'])) {
    final title = milestoneTitle.isEmpty ? 'a guideline' : milestoneTitle;
    return '$who updated $title.';
  }
  if (_matches(action, ['milestone.delete', 'milestones.delete'])) {
    final title = milestoneTitle.isEmpty ? 'a guideline' : milestoneTitle;
    return '$who deleted $title.';
  }

  if (_matches(action, ['settings.update', 'settings.patch'])) {
    return '$who updated system settings.';
  }
  if (_matches(action, ['me.update', 'profile.update'])) {
    return '$who updated their profile.';
  }

  final readableAction = prettyStatus(action).isEmpty ? 'performed an action' : prettyStatus(action);
  final target = _entityName(item, entityType);
  if (target.isNotEmpty) {
    return '$who $readableAction on $target.';
  }
  if (entityType.isNotEmpty) {
    return '$who $readableAction on ${entityType.toLowerCase()}.';
  }
  return '$who $readableAction.';
}

String? _buildAffected({
  required String action,
  required String entityType,
  required String groupName,
  required String studentName,
  required String supervisorName,
  required String userName,
  required String milestoneTitle,
  required String submissionLabel,
}) {
  final parts = <String>[
    if (groupName.isNotEmpty) 'Group: $groupName',
    if (studentName.isNotEmpty) 'Student: $studentName',
    if (supervisorName.isNotEmpty) 'Supervisor: $supervisorName',
    if (userName.isNotEmpty &&
        userName != studentName &&
        userName != supervisorName)
      'User: $userName',
    if (milestoneTitle.isNotEmpty) 'Milestone: $milestoneTitle',
    if (submissionLabel.isNotEmpty &&
        submissionLabel != milestoneTitle)
      'Submission: $submissionLabel',
    if (entityType.isNotEmpty &&
        groupName.isEmpty &&
        studentName.isEmpty &&
        supervisorName.isEmpty &&
        userName.isEmpty &&
        milestoneTitle.isEmpty)
      'Type: $entityType',
  ];
  if (parts.isEmpty) return null;
  return parts.join(' · ');
}

IconData _iconFor(String action, String entityType) {
  if (action.contains('password')) return Icons.lock_reset_rounded;
  if (action.contains('group')) return Icons.account_tree_rounded;
  if (action.contains('submission')) return Icons.description_rounded;
  if (action.contains('milestone')) return Icons.event_note_rounded;
  if (action.contains('supervisor')) return Icons.supervisor_account_rounded;
  if (action.contains('user') || action.contains('student')) {
    return Icons.person_rounded;
  }
  if (action.contains('settings')) return Icons.settings_rounded;
  switch (entityType.toLowerCase()) {
    case 'group':
      return Icons.account_tree_rounded;
    case 'submission':
      return Icons.description_rounded;
    case 'milestone':
      return Icons.event_note_rounded;
    case 'user':
      return Icons.person_rounded;
    case 'settings':
      return Icons.settings_rounded;
    default:
      return Icons.history_rounded;
  }
}

bool _matches(String action, List<String> candidates) {
  if (action.isEmpty) return false;
  for (final candidate in candidates) {
    if (action == candidate || action.endsWith(candidate)) return true;
  }
  return false;
}

String _roleLabel(String role) {
  switch (role.toLowerCase()) {
    case 'admin':
      return 'Admin';
    case 'supervisor':
      return 'Supervisor';
    case 'student':
      return 'Student';
    default:
      return '';
  }
}

String _string(
  dynamic item,
  List<String> keys, {
  String fallback = '',
}) {
  if (item is! Map) return fallback;
  for (final key in keys) {
    final value = item[key];
    if (value == null) continue;
    if (value is Map) {
      final nested = _string(value, const ['fullName', 'name', 'title', 'email']);
      if (nested.isNotEmpty) return nested;
      continue;
    }
    final text = value.toString().trim();
    if (text.isNotEmpty && text != 'null') return text;
  }
  return fallback;
}

String _meta(dynamic item, List<String> keys) {
  if (item is! Map) return '';
  final metadata = item['metadata'];
  if (metadata is Map) {
    final value = _string(metadata, keys);
    if (value.isNotEmpty) return value;
  }
  final details = item['details'];
  if (details is Map) {
    final value = _string(details, keys);
    if (value.isNotEmpty) return value;
  }
  final payload = item['payload'];
  if (payload is Map) {
    final value = _string(payload, keys);
    if (value.isNotEmpty) return value;
  }
  return _string(item, keys);
}

String _nestedName(dynamic item, List<String> keys) {
  if (item is! Map) return '';
  for (final key in keys) {
    final value = item[key];
    if (value is Map) {
      final name = _string(value, const ['fullName', 'name', 'title']);
      if (name.isNotEmpty) return name;
    }
  }
  return '';
}

String _entityName(dynamic item, String entityType) {
  if (item is! Map || entityType.isEmpty) return '';
  final entity = item['entity'];
  if (entity is Map) {
    return _string(entity, const ['fullName', 'name', 'title']);
  }
  return '';
}

String _firstNonEmpty(List<String> values) {
  for (final value in values) {
    if (value.trim().isNotEmpty) return value.trim();
  }
  return '';
}
