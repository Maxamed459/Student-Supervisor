import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

class SsmsColors {
  static const ink = Color(0xFF0F172A);
  static const muted = Color(0xFF64748B);
  static const navy = Color(0xFF0B1F33);
  static const navyDark = Color(0xFF061525);
  static const panel = Color(0xFFF3F5F8);
  static const field = Color(0xFFF1F4F8);
  static const line = Color(0xFFE2E8F0);
  static const hairline = Color(0xFFE8EDF3);
  static const blueSoft = Color(0xFFDCE8F5);
  static const mint = Color(0xFFDFF5EA);
  static const accent = Color(0xFF16A34A);
  static const danger = Color(0xFFDC2626);
  static const paper = Color(0xFFFFFFFF);
  static const peach = Color(0xFFFFE8D9);
}

/// Global typography — Plus Jakarta Sans only (`google_fonts`).
class SsmsType {
  SsmsType._();

  static TextStyle _jakarta({
    double fontSize = 15,
    FontWeight fontWeight = FontWeight.w500,
    Color color = SsmsColors.ink,
    double height = 1.45,
    double letterSpacing = 0,
    FontStyle fontStyle = FontStyle.normal,
  }) =>
      GoogleFonts.plusJakartaSans(
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: color,
        height: height,
        letterSpacing: letterSpacing,
        fontStyle: fontStyle,
      );

  static TextStyle get display => _jakarta(
        fontSize: 34,
        fontWeight: FontWeight.w800,
        letterSpacing: -0.9,
        height: 1.12,
      );

  static TextStyle get title => _jakarta(
        fontSize: 26,
        fontWeight: FontWeight.w800,
        letterSpacing: -0.4,
        height: 1.2,
      );

  /// Large heading alias (same family as [display]).
  static TextStyle get serifLg => _jakarta(
        fontSize: 30,
        fontWeight: FontWeight.w800,
        letterSpacing: -0.4,
        height: 1.15,
      );

  /// Section heading alias (same family as [title]).
  static TextStyle get serif => _jakarta(
        fontSize: 24,
        fontWeight: FontWeight.w700,
        height: 1.2,
      );

  static TextStyle get kicker => _jakarta(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        color: SsmsColors.muted,
        letterSpacing: 1.1,
        height: 1.25,
      );

  static TextStyle get body => _jakarta(
        fontSize: 15,
        color: SsmsColors.muted,
        height: 1.55,
      );

  static TextStyle get label => _jakarta(
        fontSize: 16,
        fontWeight: FontWeight.w700,
        height: 1.35,
      );

  static TextStyle get meta => _jakarta(
        fontSize: 13,
        color: SsmsColors.muted,
        height: 1.4,
      );

  static TextStyle get button => _jakarta(
        fontSize: 16,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.1,
      );

  static TextStyle get nav => _jakarta(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.1,
      );

  /// Root fallback for widgets without an explicit style.
  static TextStyle get root => body.copyWith(color: SsmsColors.ink);

  static TextTheme textTheme() {
    final base = GoogleFonts.plusJakartaSansTextTheme();
    return base.copyWith(
      displayLarge: display.copyWith(fontSize: 48),
      displayMedium: display,
      displaySmall: title,
      headlineLarge: title.copyWith(fontSize: 28),
      headlineMedium: title,
      headlineSmall: label.copyWith(fontSize: 18),
      titleLarge: label,
      titleMedium: label.copyWith(fontSize: 15),
      titleSmall: label.copyWith(fontSize: 14, fontWeight: FontWeight.w600),
      bodyLarge: body,
      bodyMedium: body,
      bodySmall: meta,
      labelLarge: button,
      labelMedium: meta.copyWith(fontWeight: FontWeight.w600),
      labelSmall: kicker,
    ).apply(
      bodyColor: SsmsColors.ink,
      displayColor: SsmsColors.ink,
    );
  }
}

ThemeData buildSsmsTheme() {
  const radius = BorderRadius.all(Radius.circular(18));
  final textTheme = SsmsType.textTheme();
  final jakartaFamily = GoogleFonts.plusJakartaSans().fontFamily;

  return ThemeData(
    useMaterial3: true,
    fontFamily: jakartaFamily,
    textTheme: textTheme,
    primaryTextTheme: textTheme,
    colorScheme: const ColorScheme.light(
      primary: SsmsColors.navy,
      onPrimary: Colors.white,
      surface: SsmsColors.paper,
      onSurface: SsmsColors.ink,
      error: SsmsColors.danger,
    ),
    scaffoldBackgroundColor: SsmsColors.panel,
    splashColor: SsmsColors.navy.withValues(alpha: 0.06),
    highlightColor: SsmsColors.navy.withValues(alpha: 0.04),
    dividerColor: SsmsColors.hairline,
    appBarTheme: AppBarTheme(
      elevation: 0,
      scrolledUnderElevation: 0,
      backgroundColor: SsmsColors.panel,
      foregroundColor: SsmsColors.ink,
      systemOverlayStyle: SystemUiOverlayStyle.dark,
      titleTextStyle: SsmsType.label.copyWith(fontSize: 18),
      toolbarTextStyle: SsmsType.label.copyWith(fontSize: 16),
    ),
    navigationBarTheme: NavigationBarThemeData(
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        return SsmsType.nav.copyWith(
          fontWeight: states.contains(WidgetState.selected)
              ? FontWeight.w800
              : FontWeight.w600,
        );
      }),
    ),
    bottomNavigationBarTheme: BottomNavigationBarThemeData(
      selectedLabelStyle: SsmsType.nav.copyWith(fontWeight: FontWeight.w800),
      unselectedLabelStyle: SsmsType.nav.copyWith(fontWeight: FontWeight.w600),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: SsmsColors.field,
      hintStyle: SsmsType.body.copyWith(fontSize: 15),
      labelStyle: SsmsType.label.copyWith(fontSize: 14),
      floatingLabelStyle: SsmsType.kicker,
      border: const OutlineInputBorder(
        borderRadius: radius,
        borderSide: BorderSide.none,
      ),
      enabledBorder: const OutlineInputBorder(
        borderRadius: radius,
        borderSide: BorderSide.none,
      ),
      focusedBorder: const OutlineInputBorder(
        borderRadius: radius,
        borderSide: BorderSide.none,
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: SsmsColors.navyDark,
        foregroundColor: Colors.white,
        disabledBackgroundColor: const Color(0xFFCDD5DF),
        minimumSize: const Size.fromHeight(54),
        elevation: 0,
        textStyle: SsmsType.button,
        shape: const RoundedRectangleBorder(borderRadius: radius),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: SsmsColors.ink,
        minimumSize: const Size.fromHeight(52),
        side: const BorderSide(color: SsmsColors.line),
        textStyle: SsmsType.button.copyWith(fontSize: 15),
        shape: const RoundedRectangleBorder(borderRadius: radius),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: SsmsColors.navy,
        textStyle: SsmsType.button.copyWith(fontSize: 15),
      ),
    ),
    dropdownMenuTheme: DropdownMenuThemeData(
      textStyle: SsmsType.label.copyWith(fontSize: 15),
    ),
    listTileTheme: ListTileThemeData(
      titleTextStyle: SsmsType.label.copyWith(fontSize: 15),
      subtitleTextStyle: SsmsType.meta,
    ),
    snackBarTheme: SnackBarThemeData(
      contentTextStyle: SsmsType.body.copyWith(color: Colors.white),
    ),
    checkboxTheme: CheckboxThemeData(
      fillColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) return SsmsColors.accent;
        return Colors.transparent;
      }),
      checkColor: WidgetStateProperty.all(Colors.white),
      side: const BorderSide(color: SsmsColors.line, width: 1.4),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: SsmsColors.paper,
      surfaceTintColor: Colors.transparent,
      shape: const RoundedRectangleBorder(borderRadius: radius),
      titleTextStyle: SsmsType.title.copyWith(fontSize: 22),
      contentTextStyle: SsmsType.body,
    ),
    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: SsmsColors.paper,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
    ),
    floatingActionButtonTheme: FloatingActionButtonThemeData(
      backgroundColor: SsmsColors.navyDark,
      foregroundColor: Colors.white,
      elevation: 0,
      extendedPadding: const EdgeInsets.symmetric(horizontal: 20),
      extendedTextStyle: SsmsType.button.copyWith(fontSize: 15),
      shape: const RoundedRectangleBorder(borderRadius: radius),
    ),
    drawerTheme: const DrawerThemeData(
      backgroundColor: SsmsColors.paper,
    ),
    cardTheme: CardThemeData(
      color: SsmsColors.paper,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: SsmsColors.hairline),
      ),
    ),
  );
}
