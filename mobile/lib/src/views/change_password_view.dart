import 'change_password_screen.dart';

export 'change_password_screen.dart';

/// Forced first-login password update (admin-created accounts).
class ChangePasswordView extends ChangePasswordScreen {
  const ChangePasswordView({super.key}) : super(requiredChange: true);
}
