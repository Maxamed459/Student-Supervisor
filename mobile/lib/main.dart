import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:device_preview/device_preview.dart';

import 'src/app.dart';
import 'src/config/api_config.dart';
import 'src/controllers/admin_controller.dart';
import 'src/controllers/admin_users_controller.dart';
import 'src/controllers/auth_controller.dart';
import 'src/controllers/dashboard_controller.dart';
import 'src/services/api_service.dart';

// ignore: non_constant_identifier_names
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  GoogleFonts.config.allowRuntimeFetching = true;
  ApiConfig.validateForRuntime();
  final api = ApiService();
  await api.init();
  Get.put(api);
  Get.put(AuthController(api));
  Get.put(DashboardController(api));
  Get.put(AdminController(api));
  Get.put(AdminUsersController(api));

  const app = StudentSupervisorMobileApp();
  // DevicePreview is for native device frames only — skip on web.
  if (!kIsWeb && !kReleaseMode) {
    runApp(
      DevicePreview(
        enabled: true,
        builder: (context) => app,
      ),
    );
    return;
  }
  runApp(app);
}
