import 'package:intl/intl.dart';

String supervisorIdOf(dynamic item) {
  if (item is! Map) return '';
  final direct = item['supervisorId']?.toString().trim() ?? '';
  if (direct.isNotEmpty && direct != 'null') return direct;
  final supervisor = item['supervisor'];
  if (supervisor is Map) return idOf(supervisor);
  return '';
}

String groupIdOf(dynamic item) {
  if (item is! Map) return '';
  final direct = item['groupId']?.toString().trim() ?? '';
  if (direct.isNotEmpty && direct != 'null') return direct;
  final group = item['group'];
  if (group is Map) return idOf(group);
  return '';
}

String idOf(dynamic item) {
  if (item is! Map) return item?.toString().trim() ?? '';
  for (final key in const ['_id', 'id']) {
    final value = item[key];
    if (value == null) continue;
    if (value is Map) {
      final oid = value[r'$oid'] ?? value['oid'];
      if (oid != null && oid.toString().trim().isNotEmpty) {
        return oid.toString().trim();
      }
      continue;
    }
    final text = value.toString().trim();
    if (text.isNotEmpty && text != 'null') return text;
  }
  return '';
}

String field(dynamic item, List<String> keys, {String fallback = ''}) {
  if (item is! Map) return fallback;
  for (final key in keys) {
    final value = item[key];
    if (value == null) continue;
    if (value is Map) {
      final nested = field(
        value,
        const ['fullName', 'name', 'title', 'email', 'label', 'message'],
      );
      if (nested.isNotEmpty) return nested;
      continue;
    }
    if (key == 'isActive' && value is bool) {
      return value ? 'active' : 'inactive';
    }
    final text = value.toString().trim();
    if (text.isNotEmpty && text != 'null') return text;
  }
  return fallback;
}

String initialsOf(String name) {
  final parts = name
      .trim()
      .split(RegExp(r'\s+'))
      .where((part) => part.isNotEmpty)
      .toList();
  if (parts.isEmpty) return 'S';
  if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
  return (parts.first[0] + parts.last[0]).toUpperCase();
}

String firstNameOf(String name) {
  final parts = name
      .trim()
      .split(RegExp(r'\s+'))
      .where((part) => part.isNotEmpty)
      .toList();
  return parts.isEmpty ? 'there' : parts.first;
}

DateTime? asDate(dynamic value) {
  if (value == null) return null;
  return DateTime.tryParse(value.toString());
}

String formatDay(dynamic value) {
  final date = asDate(value);
  if (date == null) return '';
  return DateFormat('d MMM yyyy').format(date.toLocal());
}

String formatStamp(dynamic value) {
  final date = asDate(value);
  if (date == null) return '';
  return DateFormat('d MMM · HH:mm').format(date.toLocal());
}

String relativeDue(DateTime due) {
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final day = DateTime(due.year, due.month, due.day);
  final diff = day.difference(today).inDays;
  if (diff < 0) return 'Overdue by ${-diff} ${-diff == 1 ? 'day' : 'days'}';
  if (diff == 0) return 'Due today';
  if (diff == 1) return 'Due tomorrow';
  if (diff < 14) return 'Due in $diff days';
  return DateFormat('d MMMM').format(due);
}

String prettyStatus(dynamic value) {
  final text = value?.toString().trim() ?? '';
  if (text.isEmpty || text == 'null') return '';
  return text.replaceAll('_', ' ');
}

String titleOf(dynamic item, {String fallback = 'Untitled'}) {
  return field(
    item,
    const [
      'title',
      'name',
      'fullName',
      'fileName',
      'milestoneId',
      'milestone',
      'studentId',
      'student',
      'subject',
      'type',
      'message',
    ],
    fallback: fallback,
  );
}

String commentAuthorRole(dynamic comment) {
  if (comment is! Map) return '';
  final author = comment['authorId'];
  if (author is Map) {
    return field(author, const ['role']);
  }
  return field(comment, const ['authorRole', 'role']);
}

String commentContent(dynamic comment) {
  return field(comment, const ['content', 'message', 'comment']);
}

Map<String, dynamic>? latestSupervisorFeedback(
  List<dynamic> comments,
  String status,
) {
  if (status != 'changes_requested' && status != 'approved') {
    return null;
  }
  for (final comment in comments.reversed) {
    if (comment is! Map) continue;
    if (commentAuthorRole(comment) == 'supervisor') {
      return Map<String, dynamic>.from(comment);
    }
  }
  return null;
}

List<dynamic> discussionComments(
  List<dynamic> comments,
  Map<String, dynamic>? feedbackNote,
) {
  if (feedbackNote == null) return comments;
  return comments.where((comment) => comment != feedbackNote).toList();
}

List<Map<String, dynamic>> studentDiscussionComments(List<dynamic> comments) {
  return [
    for (final comment in comments)
      if (comment is Map && commentAuthorRole(comment) == 'student')
        Map<String, dynamic>.from(comment),
  ];
}

String submissionStudentName(dynamic item) {
  final student = item is Map ? item['studentId'] ?? item['student'] : null;
  if (student is Map) {
    return field(student, const ['fullName', 'name'], fallback: 'Student');
  }
  return field(item, const ['studentName'], fallback: 'Student');
}
