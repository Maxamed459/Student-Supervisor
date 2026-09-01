import 'package:flutter/material.dart';
import 'package:get/get.dart';

import 'controllers/auth_controller.dart';
import 'theme/app_theme.dart';
import 'views/login_view.dart';
import 'views/shell_view.dart';
import 'views/splash_view.dart';

class StudentSupervisorMobileApp extends StatelessWidget {
  const StudentSupervisorMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return GetMaterialApp(
      title: 'SSMS',
      debugShowCheckedModeBanner: false,
      theme: buildSsmsTheme(),
      defaultTransition: Transition.fadeIn,
      builder: (context, child) => child ?? const SizedBox.shrink(),
      home: GetX<AuthController>(
        builder: (controller) {
          if (!controller.splashDone.value) {
            return const SplashView();
          }
          return controller.isAuthenticated
              ? const ShellView()
              : const LoginView();
        },
      ),
    );
  }
}
