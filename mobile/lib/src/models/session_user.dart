class SessionUser {
  const SessionUser({
    required this.id,
    required this.fullName,
    required this.email,
    required this.role,
    required this.status,
    this.phone,
    this.supervisorId,
    this.groupId,
    this.mustChangePassword = false,
    this.supervisor,
    this.group,
  });

  final String id;
  final String fullName;
  final String email;
  final String role;
  final String status;
  final String? phone;
  final String? supervisorId;
  final String? groupId;
  final bool mustChangePassword;
  final dynamic supervisor;
  final dynamic group;

  SessionUser copyWith({
    String? fullName,
    String? phone,
    String? status,
    bool? mustChangePassword,
    dynamic supervisor,
    dynamic group,
  }) {
    return SessionUser(
      id: id,
      fullName: fullName ?? this.fullName,
      email: email,
      role: role,
      status: status ?? this.status,
      phone: phone ?? this.phone,
      supervisorId: supervisorId,
      groupId: groupId,
      mustChangePassword: mustChangePassword ?? this.mustChangePassword,
      supervisor: supervisor ?? this.supervisor,
      group: group ?? this.group,
    );
  }

  factory SessionUser.fromJson(Map<String, dynamic> json) {
    final isActive = json['isActive'];
    return SessionUser(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      fullName: (json['fullName'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      role: (json['role'] ?? '').toString(),
      status: isActive == true
          ? 'active'
          : isActive == false
              ? 'inactive'
              : '',
      phone: json['phone']?.toString(),
      supervisorId: json['supervisorId']?.toString(),
      groupId: json['groupId']?.toString(),
      mustChangePassword: json['mustChangePassword'] == true,
      supervisor: json['supervisor'],
      group: json['group'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fullName': fullName,
      'email': email,
      'role': role,
      'status': status,
      'phone': phone,
      'supervisorId': supervisorId,
      'groupId': groupId,
      'mustChangePassword': mustChangePassword,
      'supervisor': supervisor,
      'group': group,
    };
  }
}
