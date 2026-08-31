import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';

import '../controllers/auth_controller.dart';
import '../theme/app_theme.dart';

/// Cold-start brand gate only. Routing advances automatically once session
/// hydrate finishes — never shown again after login or logout.
class SplashView extends StatelessWidget {
  const SplashView({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = Get.find<AuthController>();

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light
          .copyWith(statusBarColor: Colors.transparent),
      child: Scaffold(
        backgroundColor: SsmsColors.navy,
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.white, width: 1.4),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      'S',
                      style: SsmsType.serif.copyWith(
                        fontStyle: FontStyle.italic,
                        color: Colors.white,
                        fontSize: 36,
                      ),
                    ),
                  ),
                  const SizedBox(height: 28),
                  Text(
                    'SSMS',
                    style: SsmsType.serifLg.copyWith(
                      color: Colors.white,
                      fontSize: 44,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Supervision for this term.',
                    textAlign: TextAlign.center,
                    style: SsmsType.body.copyWith(
                      color: Colors.white.withValues(alpha: 0.78),
                      fontSize: 15,
                    ),
                  ),
                  const SizedBox(height: 40),
                  Obx(() {
                    if (auth.hydrating.value) {
                      return const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.2,
                          color: Colors.white,
                        ),
                      );
                    }
                    return const SizedBox(height: 22);
                  }),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
