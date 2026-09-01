import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../controllers/auth_controller.dart';
import '../theme/app_theme.dart';
import '../widgets/auth_field.dart';
import '../widgets/ssms_brand_mark.dart';
import '../widgets/ssms_chrome.dart';

/// Mirrors web `LoginPage` — brand panel + login card, adapted for mobile.
class LoginView extends StatefulWidget {
  const LoginView({super.key});

  @override
  State<LoginView> createState() => _LoginViewState();
}

class _LoginViewState extends State<LoginView> {
  final email = TextEditingController();
  final password = TextEditingController();
  bool hidePassword = true;
  bool rememberMe = false;

  @override
  void initState() {
    super.initState();
    _loadRemembered();
  }

  Future<void> _loadRemembered() async {
    final prefs = await SharedPreferences.getInstance();
    final savedEmail = prefs.getString('ssms_remember_email');
    final remember = prefs.getBool('ssms_remember_me') ?? false;
    if (!mounted) return;
    setState(() {
      rememberMe = remember;
      if (savedEmail != null) email.text = savedEmail;
    });
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('ssms_remember_me', rememberMe);
    final trimmed = email.text.trim();
    if (rememberMe && trimmed.isNotEmpty) {
      await prefs.setString('ssms_remember_email', trimmed);
    } else {
      await prefs.remove('ssms_remember_email');
    }
    await Get.find<AuthController>().login(trimmed, password.text);
  }

  @override
  void dispose() {
    email.dispose();
    password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = Get.find<AuthController>();
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;
    final brandHeight = MediaQuery.sizeOf(context).height * 0.38;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light
          .copyWith(statusBarColor: Colors.transparent),
      child: Scaffold(
        backgroundColor: SsmsColors.panel,
        resizeToAvoidBottomInset: true,
        body: GestureDetector(
          onTap: () => FocusScope.of(context).unfocus(),
          child: Column(
            children: [
              Container(
                width: double.infinity,
                constraints: BoxConstraints(minHeight: brandHeight.clamp(220, 360)),
                padding: EdgeInsets.fromLTRB(
                  24,
                  MediaQuery.paddingOf(context).top + 28,
                  24,
                  32,
                ),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      SsmsColors.navy,
                      SsmsColors.brandMid,
                      SsmsColors.navyDark,
                    ],
                    stops: [0, 0.46, 1],
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SsmsBrandMark(onDark: true),
                    const SizedBox(height: 28),
                    Text(
                      'Student-supervisor management system',
                      style: SsmsType.serifLg.copyWith(
                        fontSize: 36,
                        fontWeight: FontWeight.w700,
                        height: 1.04,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Manage groups, supervisors, and project progress from one secure dashboard.',
                      style: SsmsType.body.copyWith(
                        color: const Color(0xE6B6C7E9),
                        fontWeight: FontWeight.w500,
                        fontSize: 17,
                        height: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Container(
                  width: double.infinity,
                  color: SsmsColors.paper,
                  child: ListView(
                    padding: EdgeInsets.fromLTRB(24, 28, 24, 24 + bottomInset),
                    children: [
                      Text('Welcome back', style: SsmsType.display),
                      const SizedBox(height: 8),
                      Text(
                        'Sign in with your university supervision account.',
                        style: SsmsType.body,
                      ),
                      const SizedBox(height: 24),
                      AuthField(
                        label: 'Email',
                        hint: 'Enter your email address',
                        controller: email,
                        keyboardType: TextInputType.emailAddress,
                        autofillHints: const [AutofillHints.email],
                        textInputAction: TextInputAction.next,
                        prefixIcon: Icons.mail_outline_rounded,
                      ),
                      const SizedBox(height: 16),
                      AuthField(
                        label: 'Password',
                        hint: 'Enter your password',
                        controller: password,
                        obscure: hidePassword,
                        autofillHints: const [AutofillHints.password],
                        textInputAction: TextInputAction.done,
                        onSubmitted: (_) => _submit(),
                        prefixIcon: Icons.lock_outline_rounded,
                        suffix: IconButton(
                          onPressed: () =>
                              setState(() => hidePassword = !hidePassword),
                          icon: Icon(
                            hidePassword
                                ? Icons.visibility_outlined
                                : Icons.visibility_off_outlined,
                            size: 18,
                            color: SsmsColors.inputIcon,
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          SizedBox(
                            width: 22,
                            height: 22,
                            child: Checkbox(
                              value: rememberMe,
                              onChanged: (value) => setState(
                                () => rememberMe = value ?? false,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Remember me',
                            style: SsmsType.body.copyWith(fontSize: 14),
                          ),
                          const Spacer(),
                          TextButton(
                            onPressed: () => showSsmsInfoDialog(
                              context: context,
                              title: 'Forgot password?',
                              message:
                                  'Password resets are handled by your administrator. '
                                  'Contact your supervisor or system admin to receive new credentials.',
                            ),
                            child: const Text('Forgot password?'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Obx(
                        () => auth.error.value.isEmpty
                            ? const SizedBox.shrink()
                            : Padding(
                                padding: const EdgeInsets.only(bottom: 12),
                                child: SsmsErrorNote(auth.error.value),
                              ),
                      ),
                      Obx(
                        () => SizedBox(
                          width: double.infinity,
                          child: FilledButton(
                            onPressed: auth.loading.value ? null : _submit,
                            child: Text(
                              auth.loading.value ? 'Logging in…' : 'Log in',
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                      Divider(
                        height: 1,
                        color: SsmsColors.line.withValues(alpha: 0.72),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
