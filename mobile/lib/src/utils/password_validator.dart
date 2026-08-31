import 'dart:math';

class PasswordValidationResult {
  const PasswordValidationResult({this.error});

  final String? error;

  bool get isValid => error == null;
}

PasswordValidationResult validatePasswordChange({
  required String currentPassword,
  required String newPassword,
  required String confirmPassword,
}) {
  if (currentPassword.isEmpty) {
    return const PasswordValidationResult(
      error: 'Enter your current password.',
    );
  }
  if (newPassword.isEmpty) {
    return const PasswordValidationResult(error: 'Enter a new password.');
  }
  if (confirmPassword.isEmpty) {
    return const PasswordValidationResult(
      error: 'Confirm your new password.',
    );
  }
  if (newPassword.length < 8) {
    return const PasswordValidationResult(
      error: 'New password must be at least 8 characters.',
    );
  }
  if (newPassword != confirmPassword) {
    return const PasswordValidationResult(
      error: 'New passwords do not match.',
    );
  }
  if (newPassword == currentPassword) {
    return const PasswordValidationResult(
      error: 'New password must be different from your current password.',
    );
  }
  return const PasswordValidationResult();
}

const passwordRequirementsHint =
    'Use at least 8 characters. After changing your password you will sign in again.';

String? validateNewAccountPassword(String password) {
  if (password.isEmpty) return 'Password is required.';
  if (password.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  return null;
}

const newAccountPasswordHint =
    'Minimum 8 characters. Share this with the user or they will receive it by email.';

const adminPasswordResetHint =
    'Set a new password for this account. The user\'s current password is not required.';

String? validateAdminPasswordReset({
  required String newPassword,
  required String confirmPassword,
}) {
  if (newPassword.isEmpty) return 'Enter a new password.';
  if (confirmPassword.isEmpty) return 'Confirm the new password.';
  if (newPassword.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  if (newPassword != confirmPassword) {
    return 'Passwords do not match.';
  }
  return null;
}

/// Fallback when bulk/import flows do not collect a password manually.
String generateTemporaryPassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#\$%&*';
  const all = upper + lower + digits + symbols;
  final random = Random.secure();

  final chars = <String>[
    upper[random.nextInt(upper.length)],
    lower[random.nextInt(lower.length)],
    digits[random.nextInt(digits.length)],
    symbols[random.nextInt(symbols.length)],
  ];
  for (var i = chars.length; i < 12; i++) {
    chars.add(all[random.nextInt(all.length)]);
  }
  chars.shuffle(random);
  return chars.join();
}
