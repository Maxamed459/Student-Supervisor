import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';

import 'src/app.dart';
import 'src/config/api_config.dart';
import 'src/controllers/admin_controller.dart';
import 'src/controllers/admin_users_controller.dart';
import 'src/controllers/auth_controller.dart';
import 'src/controllers/dashboard_controller.dart';
import 'src/services/api_service.dart';

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
  runApp(const StudentSupervisorMobileApp());
}
