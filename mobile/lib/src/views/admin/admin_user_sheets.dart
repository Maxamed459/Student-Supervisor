import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../controllers/admin_users_controller.dart';
import '../../theme/app_theme.dart';
import '../../utils/password_validator.dart';
import '../../widgets/display.dart';
import '../../widgets/ssms_chrome.dart';
import 'admin_sheets.dart';

Widget adminUserActionMessages(AdminUsersController controller) {
  return Obx(() {
    final err = controller.actionError.value;
    final ok = controller.actionSuccess.value;
    if (err.isEmpty && ok.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (err.isNotEmpty) ...[
          SsmsErrorNote(err),
          const SizedBox(height: 12),
        ],
        if (ok.isNotEmpty) SsmsSuccessNote(ok),
        if (ok.isNotEmpty) const SizedBox(height: 12),
      ],
    );
  });
}

void _finishSuccessfulSheet(
  BuildContext context, {
  required bool ok,
  required String message,
  VoidCallback? resetForm,
}) {
  if (!ok || !context.mounted) return;
  resetForm?.call();
  closeSsmsSheet(context);
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(message),
      backgroundColor: SsmsColors.navy,
    ),
  );
}

void _openSheetAfterClose(
  BuildContext sheetContext,
  BuildContext hostContext,
  Future<void> Function(BuildContext) openSheet,
) {
  closeSsmsSheet(sheetContext);
  WidgetsBinding.instance.addPostFrameCallback((_) {
    if (hostContext.mounted) {
      openSheet(hostContext);
    }
  });
}

Future<void> showCreateStudentSheet(BuildContext context) async {
  final controller = Get.find<AdminUsersController>();
  controller.clearMessages();
  await showSsmsSheet(
    context: context,
    onClose: controller.clearMessages,
    child: _CreateStudentForm(controller: controller),
  );
}

class _CreateStudentForm extends StatefulWidget {
  const _CreateStudentForm({required this.controller});

  final AdminUsersController controller;

  @override
  State<_CreateStudentForm> createState() => _CreateStudentFormState();
}

class _CreateStudentFormState extends State<_CreateStudentForm> {
  final fullName = TextEditingController();
  final email = TextEditingController();
  final phone = TextEditingController();
  final password = TextEditingController();
  var obscurePassword = true;

  @override
  void dispose() {
    fullName.dispose();
    email.dispose();
    phone.dispose();
    password.dispose();
    super.dispose();
  }

  void _resetForm() {
    fullName.clear();
    email.clear();
    phone.clear();
    password.clear();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SsmsSheetHeader(
          title: 'Create student',
          subtitle:
              'Set the sign-in password for this account. The student may also receive it by email.',
        ),
        Text('FULL NAME', style: SsmsType.kicker),
        TextField(
          controller: fullName,
          textCapitalization: TextCapitalization.words,
        ),
        const SizedBox(height: 12),
        Text('EMAIL', style: SsmsType.kicker),
        TextField(
          controller: email,
          keyboardType: TextInputType.emailAddress,
        ),
        const SizedBox(height: 12),
        Text('PASSWORD', style: SsmsType.kicker),
        TextField(
          controller: password,
          obscureText: obscurePassword,
          decoration: InputDecoration(
            hintText: 'Minimum 8 characters',
            suffixIcon: IconButton(
              onPressed: () => setState(() => obscurePassword = !obscurePassword),
              icon: Icon(
                obscurePassword
                    ? Icons.visibility_outlined
                    : Icons.visibility_off_outlined,
              ),
            ),
          ),
        ),
        const SizedBox(height: 6),
        Text(newAccountPasswordHint, style: SsmsType.meta),
        const SizedBox(height: 12),
        Text('PHONE', style: SsmsType.kicker),
        TextField(
          controller: phone,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(hintText: 'Optional'),
        ),
        const SizedBox(height: 18),
        adminUserActionMessages(widget.controller),
        Obx(() {
          final busy = widget.controller.actionLoading.value;
          return SsmsSheetActions(
            busy: busy,
            submitLabel: 'Create student',
            onSubmit: busy
                ? null
                : () async {
                    final ok = await widget.controller.createStudent(
                      fullName: fullName.text,
                      email: email.text,
                      phone: phone.text,
                      password: password.text,
                    );
                    _finishSuccessfulSheet(
                      context,
                      ok: ok,
                      message: 'Student created.',
                      resetForm: _resetForm,
                    );
                  },
          );
        }),
      ],
    );
  }
}

Future<void> showCreateSupervisorSheet(BuildContext context) async {
  final controller = Get.find<AdminUsersController>();
  controller.clearMessages();
  await showSsmsSheet(
    context: context,
    onClose: controller.clearMessages,
    child: _CreateSupervisorForm(controller: controller),
  );
}

class _CreateSupervisorForm extends StatefulWidget {
  const _CreateSupervisorForm({required this.controller});

  final AdminUsersController controller;

  @override
  State<_CreateSupervisorForm> createState() => _CreateSupervisorFormState();
}

class _CreateSupervisorFormState extends State<_CreateSupervisorForm> {
  final fullName = TextEditingController();
  final email = TextEditingController();
  final phone = TextEditingController();
  final password = TextEditingController();
  var obscurePassword = true;

  @override
  void dispose() {
    fullName.dispose();
    email.dispose();
    phone.dispose();
    password.dispose();
    super.dispose();
  }

  void _resetForm() {
    fullName.clear();
    email.clear();
    phone.clear();
    password.clear();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SsmsSheetHeader(
          title: 'Create supervisor',
          subtitle:
              'Set the sign-in password for this account. The supervisor may also receive it by email.',
        ),
        Text('FULL NAME', style: SsmsType.kicker),
        TextField(
          controller: fullName,
          textCapitalization: TextCapitalization.words,
        ),
        const SizedBox(height: 12),
        Text('EMAIL', style: SsmsType.kicker),
        TextField(
          controller: email,
          keyboardType: TextInputType.emailAddress,
        ),
        const SizedBox(height: 12),
        Text('PASSWORD', style: SsmsType.kicker),
        TextField(
          controller: password,
          obscureText: obscurePassword,
          decoration: InputDecoration(
            hintText: 'Minimum 8 characters',
            suffixIcon: IconButton(
              onPressed: () => setState(() => obscurePassword = !obscurePassword),
              icon: Icon(
                obscurePassword
                    ? Icons.visibility_outlined
                    : Icons.visibility_off_outlined,
              ),
            ),
          ),
        ),
        const SizedBox(height: 6),
        Text(newAccountPasswordHint, style: SsmsType.meta),
        const SizedBox(height: 12),
        Text('PHONE', style: SsmsType.kicker),
        TextField(
          controller: phone,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(hintText: 'Optional'),
        ),
        const SizedBox(height: 18),
        adminUserActionMessages(widget.controller),
        Obx(() {
          final busy = widget.controller.actionLoading.value;
          return SsmsSheetActions(
            busy: busy,
            submitLabel: 'Create supervisor',
            onSubmit: busy
                ? null
                : () async {
                    final ok = await widget.controller.createSupervisor(
                      fullName: fullName.text,
                      email: email.text,
                      phone: phone.text,
                      password: password.text,
                    );
                    _finishSuccessfulSheet(
                      context,
                      ok: ok,
                      message: 'Supervisor created.',
                      resetForm: _resetForm,
                    );
                  },
          );
        }),
      ],
    );
  }
}

Future<void> showCreateAdminSheet(BuildContext context) async {
  final controller = Get.find<AdminUsersController>();
  controller.clearMessages();
  await showSsmsSheet(
    context: context,
    onClose: controller.clearMessages,
    child: _CreateAdminForm(controller: controller),
  );
}

class _CreateAdminForm extends StatefulWidget {
  const _CreateAdminForm({required this.controller});

  final AdminUsersController controller;

  @override
  State<_CreateAdminForm> createState() => _CreateAdminFormState();
}

class _CreateAdminFormState extends State<_CreateAdminForm> {
  final fullName = TextEditingController();
  final email = TextEditingController();
  final phone = TextEditingController();
  final password = TextEditingController();
  var obscurePassword = true;

  @override
  void dispose() {
    fullName.dispose();
    email.dispose();
    phone.dispose();
    password.dispose();
    super.dispose();
  }

  void _resetForm() {
    fullName.clear();
    email.clear();
    phone.clear();
    password.clear();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SsmsSheetHeader(
          title: 'Create admin',
          subtitle:
              'Admin accounts have full system access. Set the sign-in password below.',
        ),
        Text('FULL NAME', style: SsmsType.kicker),
        TextField(
          controller: fullName,
          textCapitalization: TextCapitalization.words,
        ),
        const SizedBox(height: 12),
        Text('EMAIL', style: SsmsType.kicker),
        TextField(
          controller: email,
          keyboardType: TextInputType.emailAddress,
        ),
        const SizedBox(height: 12),
        Text('PASSWORD', style: SsmsType.kicker),
        TextField(
          controller: password,
          obscureText: obscurePassword,
          decoration: InputDecoration(
            hintText: 'Minimum 8 characters',
            suffixIcon: IconButton(
              onPressed: () => setState(() => obscurePassword = !obscurePassword),
              icon: Icon(
                obscurePassword
                    ? Icons.visibility_outlined
                    : Icons.visibility_off_outlined,
              ),
            ),
          ),
        ),
        const SizedBox(height: 6),
        Text(newAccountPasswordHint, style: SsmsType.meta),
        const SizedBox(height: 12),
        Text('PHONE', style: SsmsType.kicker),
        TextField(
          controller: phone,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(hintText: 'Optional'),
        ),
        const SizedBox(height: 18),
        adminUserActionMessages(widget.controller),
        Obx(() {
          final busy = widget.controller.actionLoading.value;
          return SsmsSheetActions(
            busy: busy,
            submitLabel: 'Create admin',
            onSubmit: busy
                ? null
                : () async {
                    final ok = await widget.controller.createAdmin(
                      fullName: fullName.text,
                      email: email.text,
                      phone: phone.text,
                      password: password.text,
                    );
                    _finishSuccessfulSheet(
                      context,
                      ok: ok,
                      message: 'Admin created.',
                      resetForm: _resetForm,
                    );
                  },
          );
        }),
      ],
    );
  }
}

Future<void> showUserDetailSheet(BuildContext context, dynamic user) async {
  final controller = Get.find<AdminUsersController>();
  controller.clearMessages();
  await showSsmsSheet(
    context: context,
    onClose: controller.clearMessages,
    child: _UserDetailForm(controller: controller, user: user),
  );
}

class _UserDetailForm extends StatefulWidget {
  const _UserDetailForm({
    required this.controller,
    required this.user,
  });

  final AdminUsersController controller;
  final dynamic user;

  @override
  State<_UserDetailForm> createState() => _UserDetailFormState();
}

class _UserDetailFormState extends State<_UserDetailForm> {
  late final TextEditingController fullName;
  late final TextEditingController phone;
  late final TextEditingController newPassword;
  late final TextEditingController confirmPassword;
  late final String id;
  late final String email;
  String role = '';
  bool isActive = true;
  bool obscureNewPassword = true;
  bool obscureConfirmPassword = true;
  String? selectedGroupId;
  String? selectedSupervisorId;
  bool loading = true;

  @override
  void initState() {
    super.initState();
    fullName = TextEditingController();
    phone = TextEditingController();
    newPassword = TextEditingController();
    confirmPassword = TextEditingController();
    id = field(widget.user, const ['_id', 'id']);
    email = field(widget.user, const ['email']);
    _loadUser();
  }

  Future<void> _loadUser() async {
    widget.controller.clearMessages();
    await widget.controller.loadReferenceData();
    final detail = await widget.controller.getUserDetail(id);
    final user = detail ?? widget.user;
    if (!mounted) return;
    setState(() {
      role = field(user, const ['role']);
      isActive = user is Map && user['isActive'] != false;
      fullName.text = field(user, const ['fullName', 'name'], fallback: 'User');
      phone.text = field(user, const ['phone']);
      selectedGroupId = groupIdOf(user).isEmpty ? null : groupIdOf(user);
      selectedSupervisorId =
          supervisorIdOf(user).isEmpty ? null : supervisorIdOf(user);
      loading = false;
    });
  }

  @override
  void dispose() {
    fullName.dispose();
    phone.dispose();
    newPassword.dispose();
    confirmPassword.dispose();
    super.dispose();
  }

  void _clearPasswordFields() {
    newPassword.clear();
    confirmPassword.clear();
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 32),
        child: SsmsBusy(),
      );
    }

    final isStudent = role == 'student';
    final isSupervisor = role == 'supervisor';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SsmsInitials(fullName.text, size: 64),
        const SizedBox(height: 16),
        Text(fullName.text, style: SsmsType.title.copyWith(fontSize: 24)),
        const SizedBox(height: 8),
        SsmsStatusMark(
          isActive
              ? (role.isNotEmpty ? role : 'active')
              : 'inactive',
        ),
        const SizedBox(height: 20),
        Text('FULL NAME', style: SsmsType.kicker),
        TextField(
          controller: fullName,
          textCapitalization: TextCapitalization.words,
        ),
        const SizedBox(height: 12),
        Text('EMAIL', style: SsmsType.kicker),
        InputDecorator(
          decoration: const InputDecoration(
            hintText: 'Email cannot be changed from the admin panel',
          ),
          child: Text(email, style: SsmsType.body),
        ),
        const SizedBox(height: 12),
        Text('PHONE', style: SsmsType.kicker),
        TextField(
          controller: phone,
          keyboardType: TextInputType.phone,
        ),
        const SizedBox(height: 12),
        Text('ROLE', style: SsmsType.kicker),
        InputDecorator(
          decoration: const InputDecoration(),
          child: Text(
            role.isEmpty ? 'Unknown' : prettyStatus(role),
            style: SsmsType.label,
          ),
        ),
        const SizedBox(height: 12),
        Text('GROUP', style: SsmsType.kicker),
        DropdownButtonFormField<String?>(
          isExpanded: true,
          initialValue: selectedGroupId,
          decoration: const InputDecoration(hintText: 'No group assigned'),
          items: [
            const DropdownMenuItem<String?>(
              value: null,
              child: Text('No group', overflow: TextOverflow.ellipsis),
            ),
            for (final group in widget.controller.groups)
              DropdownMenuItem<String?>(
                value: field(group, const ['_id', 'id']),
                child: Text(
                  field(group, const ['name', 'title'], fallback: 'Group'),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
          ],
          onChanged: (value) => setState(() => selectedGroupId = value),
        ),
        if (isStudent) ...[
          const SizedBox(height: 12),
          Text('SUPERVISOR', style: SsmsType.kicker),
          DropdownButtonFormField<String?>(
            isExpanded: true,
            initialValue: selectedSupervisorId,
            decoration: const InputDecoration(hintText: 'No supervisor assigned'),
            items: [
              const DropdownMenuItem<String?>(
                value: null,
                child: Text('No supervisor', overflow: TextOverflow.ellipsis),
              ),
              for (final supervisor in widget.controller.supervisors)
                DropdownMenuItem<String?>(
                  value: field(supervisor, const ['_id', 'id']),
                  child: Text(
                    field(
                      supervisor,
                      const ['fullName', 'name'],
                      fallback: 'Supervisor',
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
            ],
            onChanged: (value) => setState(() => selectedSupervisorId = value),
          ),
        ],
        if (isSupervisor && selectedGroupId != null) ...[
          const SizedBox(height: 8),
          Text(
            'Supervisors are assigned to one group at a time.',
            style: SsmsType.meta,
          ),
        ],
        const SizedBox(height: 20),
        const SsmsSectionLabel('Reset password'),
        Text(adminPasswordResetHint, style: SsmsType.meta),
        const SizedBox(height: 12),
        Text('NEW PASSWORD', style: SsmsType.kicker),
        TextField(
          controller: newPassword,
          obscureText: obscureNewPassword,
          decoration: InputDecoration(
            hintText: 'Enter new password',
            suffixIcon: IconButton(
              icon: Icon(
                obscureNewPassword
                    ? Icons.visibility_outlined
                    : Icons.visibility_off_outlined,
              ),
              onPressed: () => setState(
                () => obscureNewPassword = !obscureNewPassword,
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Text('CONFIRM PASSWORD', style: SsmsType.kicker),
        TextField(
          controller: confirmPassword,
          obscureText: obscureConfirmPassword,
          decoration: InputDecoration(
            hintText: 'Confirm new password',
            suffixIcon: IconButton(
              icon: Icon(
                obscureConfirmPassword
                    ? Icons.visibility_outlined
                    : Icons.visibility_off_outlined,
              ),
              onPressed: () => setState(
                () => obscureConfirmPassword = !obscureConfirmPassword,
              ),
            ),
          ),
        ),
        const SizedBox(height: 18),
        adminUserActionMessages(widget.controller),
        Obx(() {
          final busy = widget.controller.actionLoading.value;
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SsmsSheetActions(
                busy: busy,
                submitLabel: 'Save changes',
                onSubmit: busy
                    ? null
                    : () async {
                        final currentGroupId = groupIdOf(widget.user);
                        final currentSupervisorId = supervisorIdOf(widget.user);
                        final ok = await widget.controller.updateUser(
                          id: id,
                          fullName: fullName.text,
                          phone: phone.text,
                          groupId: selectedGroupId,
                          clearGroupId:
                              selectedGroupId == null && currentGroupId.isNotEmpty,
                          supervisorId: isStudent ? selectedSupervisorId : null,
                          clearSupervisorId: isStudent &&
                              selectedSupervisorId == null &&
                              currentSupervisorId.isNotEmpty,
                        );
                        _finishSuccessfulSheet(
                          context,
                          ok: ok,
                          message: 'User updated.',
                        );
                      },
              ),
              const SizedBox(height: 10),
              OutlinedButton.icon(
                icon: const Icon(Icons.lock_reset_rounded, size: 18),
                onPressed: busy
                    ? null
                    : () async {
                        final ok = await widget.controller.resetUserPassword(
                          id: id,
                          newPassword: newPassword.text,
                          confirmPassword: confirmPassword.text,
                        );
                        if (ok && context.mounted) {
                          _clearPasswordFields();
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Password updated.'),
                              backgroundColor: SsmsColors.navy,
                            ),
                          );
                        }
                      },
                label: const Text('Reset password'),
              ),
              const SizedBox(height: 10),
              OutlinedButton(
                onPressed: busy
                    ? null
                    : () async {
                        final confirmed = await showAdminConfirmDialog(
                          context: context,
                          title: isActive ? 'Deactivate user' : 'Activate user',
                          message: isActive
                              ? 'Deactivate ${fullName.text}? They will not be able to sign in.'
                              : 'Reactivate ${fullName.text}?',
                          confirmLabel: isActive ? 'Deactivate' : 'Activate',
                          destructive: isActive,
                        );
                        if (!confirmed || !context.mounted) return;
                        final ok = await widget.controller.updateUser(
                          id: id,
                          isActive: !isActive,
                        );
                        _finishSuccessfulSheet(
                          context,
                          ok: ok,
                          message: isActive ? 'User deactivated.' : 'User activated.',
                        );
                      },
                child: Text(isActive ? 'Deactivate account' : 'Activate account'),
              ),
              const SizedBox(height: 10),
              OutlinedButton(
                style: OutlinedButton.styleFrom(
                  foregroundColor: SsmsColors.danger,
                  side: const BorderSide(color: SsmsColors.danger),
                ),
                onPressed: busy
                    ? null
                    : () async {
                        final confirmed = await showAdminConfirmDialog(
                          context: context,
                          title: 'Delete user',
                          message:
                              'Permanently delete ${fullName.text}? This cannot be undone.',
                          confirmLabel: 'Delete',
                          destructive: true,
                        );
                        if (!confirmed || !context.mounted) return;
                        final ok = await widget.controller.deleteUser(
                          id,
                          fullName.text,
                        );
                        _finishSuccessfulSheet(
                          context,
                          ok: ok,
                          message: '${fullName.text} deleted.',
                        );
                      },
                child: const Text('Delete account'),
              ),
            ],
          );
        }),
      ],
    );
  }
}

Future<void> showCreateUserMenu(BuildContext hostContext) async {
  await showSsmsSheet(
    context: hostContext,
    child: Builder(
      builder: (sheetContext) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SsmsSheetHeader(
              title: 'Create user',
              subtitle: 'Choose the account type to create.',
            ),
            _CreateUserOption(
              icon: Icons.school_rounded,
              label: 'Student',
              detail: 'Create a student account',
              onTap: () => _openSheetAfterClose(
                sheetContext,
                hostContext,
                showCreateStudentSheet,
              ),
            ),
            const SizedBox(height: 10),
            _CreateUserOption(
              icon: Icons.supervisor_account_rounded,
              label: 'Supervisor',
              detail: 'Create a supervisor account',
              onTap: () => _openSheetAfterClose(
                sheetContext,
                hostContext,
                showCreateSupervisorSheet,
              ),
            ),
            const SizedBox(height: 10),
            _CreateUserOption(
              icon: Icons.admin_panel_settings_rounded,
              label: 'Admin',
              detail: 'Create an admin account',
              onTap: () => _openSheetAfterClose(
                sheetContext,
                hostContext,
                showCreateAdminSheet,
              ),
            ),
          ],
        );
      },
    ),
  );
}

class _CreateUserOption extends StatelessWidget {
  const _CreateUserOption({
    required this.icon,
    required this.label,
    required this.detail,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final String detail;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SsmsCard(
      onTap: onTap,
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: SsmsColors.field,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: SsmsColors.navy),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: SsmsType.label),
                Text(detail, style: SsmsType.meta),
              ],
            ),
          ),
          const Icon(Icons.chevron_right_rounded, color: SsmsColors.muted),
        ],
      ),
    );
  }
}
