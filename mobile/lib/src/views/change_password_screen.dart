import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../controllers/auth_controller.dart';
import '../theme/app_theme.dart';
import '../utils/password_validator.dart';
import '../widgets/auth_field.dart';
import '../widgets/ssms_chrome.dart';

/// Change password for any signed-in role.
/// [requiredChange] is true when admin created the account and login forced this flow.
class ChangePasswordScreen extends StatefulWidget {
  const ChangePasswordScreen({super.key, this.requiredChange = false});

  final bool requiredChange;

  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final currentPassword = TextEditingController();
  final newPassword = TextEditingController();
  final confirmPassword = TextEditingController();
  bool hideCurrent = true;
  bool hideNew = true;
  bool hideConfirm = true;
  String? localError;

  @override
  void dispose() {
    currentPassword.dispose();
    newPassword.dispose();
    confirmPassword.dispose();
    super.dispose();
  }

  Future<void> _submit(AuthController auth) async {
    final validation = validatePasswordChange(
      currentPassword: currentPassword.text,
      newPassword: newPassword.text,
      confirmPassword: confirmPassword.text,
    );
    if (!validation.isValid) {
      setState(() => localError = validation.error);
      auth.error.value = '';
      return;
    }

    setState(() => localError = null);
    final ok = await auth.changePassword(
      currentPassword: currentPassword.text,
      newPassword: newPassword.text,
    );
    if (ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Password updated. Sign in with your new password.'),
          backgroundColor: SsmsColors.navy,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Get.find<AuthController>();
    return Scaffold(
      backgroundColor: widget.requiredChange ? Colors.white : SsmsColors.panel,
      appBar: widget.requiredChange
          ? null
          : AppBar(
              backgroundColor: SsmsColors.panel,
              title: Text(
                'Change password',
                style: SsmsType.label.copyWith(fontSize: 18),
              ),
            ),
      body: SafeArea(
        child: ListView(
          padding: EdgeInsets.fromLTRB(
            24,
            widget.requiredChange ? 36 : 16,
            24,
            28,
          ),
          children: [
            if (widget.requiredChange)
              Text('Update password', style: SsmsType.display),
            if (!widget.requiredChange) ...[
              Text('Change password', style: SsmsType.title.copyWith(fontSize: 28)),
            ],
            const SizedBox(height: 10),
            Text(
              widget.requiredChange
                  ? 'Create a new password to finish setting up your account.'
                  : 'Update your sign-in password. Your profile details stay the same.',
              style: SsmsType.body,
            ),
            const SizedBox(height: 12),
            Text(passwordRequirementsHint, style: SsmsType.meta),
            const SizedBox(height: 28),
            AuthField(
              label: 'Current password',
              controller: currentPassword,
              obscure: hideCurrent,
              textInputAction: TextInputAction.next,
              suffix: IconButton(
                onPressed: () => setState(() => hideCurrent = !hideCurrent),
                icon: Icon(
                  hideCurrent
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined,
                  size: 20,
                  color: SsmsColors.muted,
                ),
              ),
            ),
            const SizedBox(height: 18),
            AuthField(
              label: 'New password',
              controller: newPassword,
              obscure: hideNew,
              textInputAction: TextInputAction.next,
              suffix: IconButton(
                onPressed: () => setState(() => hideNew = !hideNew),
                icon: Icon(
                  hideNew
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined,
                  size: 20,
                  color: SsmsColors.muted,
                ),
              ),
            ),
            const SizedBox(height: 18),
            AuthField(
              label: 'Confirm new password',
              controller: confirmPassword,
              obscure: hideConfirm,
              textInputAction: TextInputAction.done,
              onSubmitted: (_) => _submit(auth),
              suffix: IconButton(
                onPressed: () => setState(() => hideConfirm = !hideConfirm),
                icon: Icon(
                  hideConfirm
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined,
                  size: 20,
                  color: SsmsColors.muted,
                ),
              ),
            ),
            const SizedBox(height: 20),
            if (localError != null) ...[
              SsmsErrorNote(localError!),
              const SizedBox(height: 12),
            ],
            Obx(
              () => auth.error.value.isEmpty
                  ? const SizedBox.shrink()
                  : Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: SsmsErrorNote(auth.error.value),
                    ),
            ),
            Obx(
              () => FilledButton(
                onPressed: auth.loading.value ? null : () => _submit(auth),
                child: Text(auth.loading.value ? 'Saving' : 'Update password'),
              ),
            ),
            const SizedBox(height: 12),
            if (widget.requiredChange)
              TextButton(
                onPressed: auth.logout,
                child: const Text('Sign out'),
              )
            else
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Cancel'),
              ),
          ],
        ),
      ),
    );
  }
}
