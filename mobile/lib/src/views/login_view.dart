import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../controllers/auth_controller.dart';
import '../theme/app_theme.dart';
import '../widgets/ssms_chrome.dart';

/// Layout structure mirrors a centered-brand + bottom rounded sheet login.
/// Colors stay SSMS; no social login / forgot-password (not in the API).
class LoginView extends StatefulWidget {
  const LoginView({super.key});

  @override
  State<LoginView> createState() => _LoginViewState();
}

class _LoginViewState extends State<LoginView> {
  final email = TextEditingController();
  final password = TextEditingController();
  bool hidePassword = true;
  bool rememberMe = true;

  @override
  void initState() {
    super.initState();
    _loadRemembered();
  }

  Future<void> _loadRemembered() async {
    final prefs = await SharedPreferences.getInstance();
    final savedEmail = prefs.getString('ssms_remember_email');
    final remember = prefs.getBool('ssms_remember_me') ?? true;
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

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark
          .copyWith(statusBarColor: Colors.transparent),
      child: Scaffold(
        backgroundColor: SsmsColors.panel,
        resizeToAvoidBottomInset: true,
        body: GestureDetector(
          onTap: () => FocusScope.of(context).unfocus(),
          child: SafeArea(
            bottom: false,
            child: Column(
              children: [
                const SizedBox(height: 28),
                Text(
                  'SSMS',
                  textAlign: TextAlign.center,
                  style: SsmsType.display.copyWith(
                    color: SsmsColors.navy,
                    fontSize: 34,
                  ),
                ),
                const SizedBox(height: 28),
                Expanded(
                  child: Container(
                    width: double.infinity,
                    decoration: const BoxDecoration(
                      color: SsmsColors.paper,
                      borderRadius: BorderRadius.vertical(
                        top: Radius.circular(36),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Color(0x140B1F33),
                          blurRadius: 28,
                          offset: Offset(0, -6),
                        ),
                      ],
                    ),
                    child: ListView(
                      padding: EdgeInsets.fromLTRB(
                        28,
                        36,
                        28,
                        28 + bottomInset,
                      ),
                      children: [
                        Text(
                          'Welcome to\nSSMS login now!',
                          textAlign: TextAlign.center,
                          style: SsmsType.serifLg.copyWith(
                            fontSize: 30,
                            height: 1.25,
                          ),
                        ),
                        const SizedBox(height: 32),
                        _PillField(
                          label: 'Email',
                          hint: 'Enter your email',
                          controller: email,
                          keyboardType: TextInputType.emailAddress,
                          autofillHints: const [AutofillHints.email],
                          textInputAction: TextInputAction.next,
                        ),
                        const SizedBox(height: 18),
                        _PillField(
                          label: 'Password',
                          hint: 'Enter your password',
                          controller: password,
                          obscure: hidePassword,
                          autofillHints: const [AutofillHints.password],
                          textInputAction: TextInputAction.done,
                          onSubmitted: (_) => _submit(),
                          suffix: IconButton(
                            onPressed: () => setState(
                              () => hidePassword = !hidePassword,
                            ),
                            icon: Icon(
                              hidePassword
                                  ? Icons.visibility_outlined
                                  : Icons.visibility_off_outlined,
                              size: 20,
                              color: SsmsColors.muted,
                            ),
                          ),
                        ),
                        const SizedBox(height: 14),
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
                              style: SsmsType.label.copyWith(
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 18),
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
                            height: 54,
                            child: FilledButton(
                              style: FilledButton.styleFrom(
                                backgroundColor: SsmsColors.navy,
                                foregroundColor: Colors.white,
                                disabledBackgroundColor:
                                    const Color(0xFFCDD5DF),
                                elevation: 0,
                                shape: const StadiumBorder(),
                                textStyle: SsmsType.button,
                              ),
                              onPressed: auth.loading.value ? null : _submit,
                              child: Text(
                                auth.loading.value ? 'Signing in' : 'Login',
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 22),
                        Text(
                          'Accounts are created by your administrator.',
                          textAlign: TextAlign.center,
                          style: SsmsType.meta.copyWith(fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _PillField extends StatelessWidget {
  const _PillField({
    required this.label,
    required this.controller,
    this.hint,
    this.obscure = false,
    this.keyboardType,
    this.autofillHints,
    this.textInputAction,
    this.onSubmitted,
    this.suffix,
  });

  final String label;
  final TextEditingController controller;
  final String? hint;
  final bool obscure;
  final TextInputType? keyboardType;
  final Iterable<String>? autofillHints;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onSubmitted;
  final Widget? suffix;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: SsmsType.label.copyWith(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          obscureText: obscure,
          keyboardType: keyboardType,
          autofillHints: autofillHints,
          textInputAction: textInputAction,
          onSubmitted: onSubmitted,
          cursorColor: SsmsColors.navy,
          style: SsmsType.label.copyWith(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
          decoration: InputDecoration(
            hintText: hint,
            filled: true,
            fillColor: SsmsColors.field,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 20,
              vertical: 16,
            ),
            suffixIcon: suffix,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(999),
              borderSide: const BorderSide(color: SsmsColors.line),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(999),
              borderSide: const BorderSide(color: SsmsColors.line),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(999),
              borderSide: const BorderSide(color: SsmsColors.navy, width: 1.4),
            ),
          ),
        ),
      ],
    );
  }
}
