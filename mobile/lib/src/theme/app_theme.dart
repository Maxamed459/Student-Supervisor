import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

/// Design tokens aligned with `client/src/index.css`.
class SsmsColors {
  static const ink = Color(0xFF171B22);
  static const muted = Color(0xFF59616F);
  static const navy = Color(0xFF071B33);
  static const navyDark = Color(0xFF000711);
  static const navyHover = Color(0xFF06101F);
  static const panel = Color(0xFFF6FAFF);
  static const field = Color(0xFFFBFDFF);
  static const line = Color(0xFFC9D0DC);
  static const softLine = Color(0xFFEDF3FB);
  static const blueSoft = Color(0xFFD8E7FF);
  static const danger = Color(0xFFBA1A1A);
  static const success = Color(0xFF126D3C);
  static const successBg = Color(0xFFE4F3EB);
  static const dangerBg = Color(0xFFFDECEC);
  static const dangerSolid = Color(0xFFDC2626);
  static const dangerSolidHover = Color(0xFFB91C1C);
  static const dangerSoftBg = Color(0xFFFEF2F2);
  static const dangerSoftBorder = Color(0xFFFECACA);
  static const formErrorBg = Color(0xFFFFF4F4);
  static const badgeDefaultBg = Color(0xFFEEF3FA);
  static const badgeDefaultText = Color(0xFF293138);
  static const placeholder = Color(0xFF9AA2AF);
  static const inputIcon = Color(0xFF6A7381);
  static const avatarBg = Color(0xFFE5E2E1);
  static const brandSubtitle = Color(0xB6B6C7E9); // rgba(182,199,233,0.9) on navy
  static const brandMid = Color(0xFF09213F);
  static const successNoticeBg = Color(0xFFEEFBF3);
  static const successNoticeBorder = Color(0xFFC8EBD5);
  static const linkBlue = Color(0xFF2563EB);

  // Dashboard stat card tones — `.dash-stat-card--*`
  static const statBlueBg = Color(0xFFEEF2FF);
  static const statBlueLabel = Color(0xFF1E3A8A);
  static const statBlueLink = Color(0xFF2563EB);
  static const statGreenBg = Color(0xFFECFDF5);
  static const statGreenLabel = Color(0xFF065F46);
  static const statGreenLink = Color(0xFF059669);
  static const statPeachBg = Color(0xFFFFF7ED);
  static const statPeachLink = Color(0xFFEA580C);
  static const statCtaText = Color(0xFF374151);

  // Chart / activity
  static const chartBarLight = Color(0xFF7DD3FC);
  static const chartBarDark = Color(0xFF2563EB);
  static const chartGrid = Color(0xFFEDF2F7);

  static const shadowSurface = Color(0x0F071B33);
  static const shadowModal = Color(0x3D071B33); // rgba(7,27,51,0.24)
  static const paper = Color(0xFFFFFFFF);

  // Legacy aliases
  static const hairline = softLine;
  static const accent = success;
  static const mint = successBg;
  static const peach = dangerBg;
}

class SsmsRadii {
  static const sm = 8.0;
  static const md = 12.0;
  static const lg = 16.0;
}

class SsmsShadows {
  static const surface = [
    BoxShadow(
      color: SsmsColors.shadowSurface,
      blurRadius: 40,
      offset: Offset(0, 16),
    ),
  ];

  static const modal = [
    BoxShadow(
      color: SsmsColors.shadowModal,
      blurRadius: 80,
      offset: Offset(0, 28),
    ),
  ];
}

/// Typography — Plus Jakarta Sans (UI) + Source Serif 4 (display headings).
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

  static TextStyle _serif({
    required double fontSize,
    FontWeight fontWeight = FontWeight.w700,
    Color color = SsmsColors.ink,
    double height = 1.15,
    double letterSpacing = 0,
  }) =>
      GoogleFonts.sourceSerif4(
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: color,
        height: height,
        letterSpacing: letterSpacing,
      );

  /// Web login / page intro h2
  static TextStyle get display => _serif(
        fontSize: 32,
        fontWeight: FontWeight.w800,
        height: 1.25,
      );

  /// Web card h3 / modal contexts
  static TextStyle get title => _jakarta(
        fontSize: 24,
        fontWeight: FontWeight.w800,
        height: 1.33,
      );

  static TextStyle get serifLg => _serif(
        fontSize: 32,
        fontWeight: FontWeight.w800,
        height: 1.25,
      );

  static TextStyle get serif => _serif(
        fontSize: 24,
        fontWeight: FontWeight.w800,
        height: 1.33,
      );

  /// Web `.page-intro > span` kicker
  static TextStyle get pageKicker => _jakarta(
        fontSize: 12,
        fontWeight: FontWeight.w900,
        color: SsmsColors.navy,
        letterSpacing: 0,
        height: 1.25,
      );

  static TextStyle get kicker => _jakarta(
        fontSize: 12,
        fontWeight: FontWeight.w800,
        color: SsmsColors.muted,
        letterSpacing: 0,
        height: 1.25,
      );

  static TextStyle get body => _jakarta(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: SsmsColors.muted,
        height: 1.5,
      );

  /// Web field label
  static TextStyle get fieldLabel => _jakarta(
        fontSize: 12,
        fontWeight: FontWeight.w800,
        height: 1.35,
      );

  static TextStyle get label => _jakarta(
        fontSize: 14,
        fontWeight: FontWeight.w800,
        height: 1.35,
      );

  static TextStyle get meta => _jakarta(
        fontSize: 12,
        fontWeight: FontWeight.w700,
        color: SsmsColors.muted,
        height: 1.4,
      );

  /// Web `.primary-button`
  static TextStyle get button => _jakarta(
        fontSize: 14,
        fontWeight: FontWeight.w800,
        letterSpacing: 0,
      );

  static TextStyle get nav => _jakarta(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        letterSpacing: 0,
      );

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
  const radiusSm = BorderRadius.all(Radius.circular(SsmsRadii.sm));
  const radiusMd = BorderRadius.all(Radius.circular(SsmsRadii.md));
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
    splashColor: SsmsColors.navy.withValues(alpha: 0.08),
    highlightColor: SsmsColors.navy.withValues(alpha: 0.04),
    dividerColor: SsmsColors.softLine,
    appBarTheme: AppBarTheme(
      elevation: 0,
      scrolledUnderElevation: 0,
      backgroundColor: SsmsColors.panel,
      foregroundColor: SsmsColors.ink,
      systemOverlayStyle: SystemUiOverlayStyle.dark,
      titleTextStyle: SsmsType.label.copyWith(
        fontSize: 24,
        fontWeight: FontWeight.w800,
        height: 1.33,
      ),
      toolbarTextStyle: SsmsType.label.copyWith(fontSize: 16),
      toolbarHeight: 64,
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
      fillColor: SsmsColors.paper,
      hintStyle: SsmsType.body.copyWith(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: SsmsColors.placeholder,
      ),
      labelStyle: SsmsType.fieldLabel,
      floatingLabelStyle: SsmsType.fieldLabel,
      border: const OutlineInputBorder(
        borderRadius: radiusSm,
        borderSide: BorderSide(color: SsmsColors.line),
      ),
      enabledBorder: const OutlineInputBorder(
        borderRadius: radiusSm,
        borderSide: BorderSide(color: SsmsColors.line),
      ),
      focusedBorder: const OutlineInputBorder(
        borderRadius: radiusSm,
        borderSide: BorderSide(color: SsmsColors.navy, width: 1.4),
      ),
      errorBorder: const OutlineInputBorder(
        borderRadius: radiusSm,
        borderSide: BorderSide(color: SsmsColors.danger),
      ),
      focusedErrorBorder: const OutlineInputBorder(
        borderRadius: radiusSm,
        borderSide: BorderSide(color: SsmsColors.danger, width: 1.4),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 13, vertical: 12),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: SsmsColors.navyDark,
        foregroundColor: Colors.white,
        disabledBackgroundColor: const Color(0xFFCDD5DF),
        minimumSize: const Size.fromHeight(44),
        elevation: 0,
        textStyle: SsmsType.button,
        shape: const RoundedRectangleBorder(borderRadius: radiusSm),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: SsmsColors.navy,
        minimumSize: const Size.fromHeight(44),
        side: const BorderSide(color: SsmsColors.line),
        textStyle: SsmsType.button,
        shape: const RoundedRectangleBorder(borderRadius: radiusSm),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: SsmsColors.navyDark,
        textStyle: SsmsType.button,
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      ),
    ),
    dropdownMenuTheme: DropdownMenuThemeData(
      textStyle: SsmsType.label.copyWith(fontSize: 14, fontWeight: FontWeight.w600),
    ),
    listTileTheme: ListTileThemeData(
      titleTextStyle: SsmsType.label.copyWith(fontSize: 14),
      subtitleTextStyle: SsmsType.meta,
      minVerticalPadding: 8,
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: SsmsColors.navy,
      contentTextStyle: SsmsType.body.copyWith(color: Colors.white),
      behavior: SnackBarBehavior.floating,
      shape: const RoundedRectangleBorder(borderRadius: radiusMd),
    ),
    checkboxTheme: CheckboxThemeData(
      fillColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) return SsmsColors.navy;
        return Colors.transparent;
      }),
      checkColor: WidgetStateProperty.all(Colors.white),
      side: const BorderSide(color: SsmsColors.line, width: 1.4),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: SsmsColors.paper,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(SsmsRadii.lg)),
      titleTextStyle: SsmsType.label.copyWith(fontSize: 22, fontWeight: FontWeight.w900),
      contentTextStyle: SsmsType.body,
      insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
    ),
    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: SsmsColors.paper,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(SsmsRadii.lg)),
      ),
    ),
    floatingActionButtonTheme: FloatingActionButtonThemeData(
      backgroundColor: SsmsColors.navyDark,
      foregroundColor: Colors.white,
      elevation: 0,
      extendedPadding: const EdgeInsets.symmetric(horizontal: 16),
      extendedTextStyle: SsmsType.button,
      shape: const RoundedRectangleBorder(borderRadius: radiusSm),
    ),
    drawerTheme: const DrawerThemeData(
      backgroundColor: SsmsColors.navy,
      width: 280,
    ),
    cardTheme: CardThemeData(
      color: SsmsColors.paper,
      surfaceTintColor: Colors.transparent,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(SsmsRadii.md),
        side: const BorderSide(color: SsmsColors.softLine),
      ),
      elevation: 0,
    ),
    chipTheme: ChipThemeData(
      backgroundColor: SsmsColors.blueSoft,
      selectedColor: SsmsColors.blueSoft,
      labelStyle: SsmsType.meta.copyWith(
        color: SsmsColors.navy,
        fontWeight: FontWeight.w700,
      ),
      side: const BorderSide(color: SsmsColors.softLine),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(SsmsRadii.sm)),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    ),
    iconButtonTheme: IconButtonThemeData(
      style: IconButton.styleFrom(
        minimumSize: const Size(36, 36),
        foregroundColor: SsmsColors.muted,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(SsmsRadii.sm)),
      ),
    ),
  );
}
