import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import 'display.dart';

class SsmsInitials extends StatelessWidget {
  const SsmsInitials(
    this.name, {
    super.key,
    this.size = 40,
    this.onDark = false,
  });

  final String name;
  final double size;
  final bool onDark;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: onDark ? Colors.white.withValues(alpha: 0.14) : SsmsColors.navy,
        borderRadius: BorderRadius.circular(size * 0.28),
      ),
      child: Text(
        initialsOf(name),
        style: SsmsType.label.copyWith(
          color: Colors.white,
          fontSize: size * 0.34,
          height: 1,
        ),
      ),
    );
  }
}

class SsmsCard extends StatelessWidget {
  const SsmsCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(17),
    this.margin = EdgeInsets.zero,
    this.color = SsmsColors.paper,
    this.onTap,
  });

  final Widget child;
  final EdgeInsets padding;
  final EdgeInsets margin;
  final Color color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final content = Container(
      width: double.infinity,
      margin: margin,
      padding: padding,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(SsmsRadii.md),
        border: Border.all(color: SsmsColors.softLine),
        boxShadow: SsmsShadows.surface,
      ),
      child: child,
    );
    if (onTap == null) return content;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(SsmsRadii.md),
        child: content,
      ),
    );
  }
}

class SsmsSectionLabel extends StatelessWidget {
  const SsmsSectionLabel(this.text, {super.key, this.trailing});

  final String text;
  final String? trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 10),
      child: Row(
        children: [
          Text(text.toUpperCase(), style: SsmsType.kicker),
          const Spacer(),
          if (trailing != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: SsmsColors.blueSoft,
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                trailing!,
                style: SsmsType.meta.copyWith(
                  color: SsmsColors.navy,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class SsmsHairline extends StatelessWidget {
  const SsmsHairline({super.key, this.indent = 0});

  final double indent;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(left: indent),
      child: const Divider(height: 1, thickness: 1, color: SsmsColors.softLine),
    );
  }
}

class SsmsEmpty extends StatelessWidget {
  const SsmsEmpty({
    super.key,
    required this.title,
    required this.detail,
    this.actionLabel,
    this.onAction,
  });

  final String title;
  final String detail;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.fromLTRB(20, 28, 20, 28),
        decoration: BoxDecoration(
          color: SsmsColors.paper,
          borderRadius: BorderRadius.circular(SsmsRadii.md),
          border: Border.all(
            color: SsmsColors.softLine,
            style: BorderStyle.solid,
          ),
        ),
        child: Column(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: const BoxDecoration(
                color: SsmsColors.blueSoft,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.inbox_outlined, color: SsmsColors.navy),
            ),
            const SizedBox(height: 16),
            Text(title, textAlign: TextAlign.center, style: SsmsType.serif),
            const SizedBox(height: 6),
            Text(detail, textAlign: TextAlign.center, style: SsmsType.body),
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 16),
              FilledButton(onPressed: onAction, child: Text(actionLabel!)),
            ],
          ],
        ),
      ),
    );
  }
}

class SsmsBusy extends StatelessWidget {
  const SsmsBusy({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: SizedBox(
        width: 22,
        height: 22,
        child: CircularProgressIndicator(
          strokeWidth: 2,
          color: SsmsColors.navy,
        ),
      ),
    );
  }
}

class SsmsErrorNote extends StatelessWidget {
  const SsmsErrorNote(this.message, {super.key});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(10, 8, 10, 8),
      decoration: const BoxDecoration(
        color: SsmsColors.formErrorBg,
        border: Border(
          left: BorderSide(color: SsmsColors.danger, width: 3),
        ),
      ),
      child: Text(
        message,
        style: SsmsType.body.copyWith(
          color: SsmsColors.danger,
          fontWeight: FontWeight.w800,
          fontSize: 13,
        ),
      ),
    );
  }
}

/// Web success / info banner (admin sheets).
class SsmsSuccessNote extends StatelessWidget {
  const SsmsSuccessNote(this.message, {super.key});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
      decoration: BoxDecoration(
        color: SsmsColors.successNoticeBg,
        borderRadius: BorderRadius.circular(SsmsRadii.md),
        border: Border.all(color: SsmsColors.successNoticeBorder),
      ),
      child: Text(
        message,
        style: SsmsType.body.copyWith(
          color: SsmsColors.success,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

/// Web `.field` — label + input shell matching `client` Field component.
class SsmsField extends StatelessWidget {
  const SsmsField({
    super.key,
    required this.label,
    required this.child,
    this.help,
    this.error,
    this.required = false,
  });

  final String label;
  final Widget child;
  final String? help;
  final String? error;
  final bool required;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(label, style: SsmsType.fieldLabel),
            if (required)
              Text(' *', style: SsmsType.fieldLabel.copyWith(color: SsmsColors.danger)),
          ],
        ),
        const SizedBox(height: 8),
        child,
        if (error != null && error!.isNotEmpty) ...[
          const SizedBox(height: 6),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.error_outline_rounded, size: 13, color: SsmsColors.danger),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  error!,
                  style: SsmsType.meta.copyWith(
                    color: SsmsColors.danger,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ] else if (help != null && help!.isNotEmpty) ...[
          const SizedBox(height: 6),
          Text(help!, style: SsmsType.meta.copyWith(fontSize: 11)),
        ],
      ],
    );
  }
}

class SsmsStatusMark extends StatelessWidget {
  const SsmsStatusMark(this.value, {super.key, this.onDark = false});

  final String value;
  final bool onDark;

  Color _textColor(String label) {
    final lower = label.toLowerCase();
    if (lower.contains('overdue') ||
        lower.contains('reject') ||
        lower.contains('inactive') ||
        lower.contains('unread') ||
        lower.contains('cancelled') ||
        lower.contains('changes')) {
      return SsmsColors.danger;
    }
    if (lower.contains('approv') ||
        lower.contains('complete') ||
        lower.contains('active') ||
        lower.contains('published') ||
        lower.contains('read')) {
      return SsmsColors.success;
    }
    if (lower.contains('pending') ||
        lower.contains('submitted') ||
        lower.contains('review') ||
        lower.contains('scheduled')) {
      return SsmsColors.navy;
    }
    return SsmsColors.badgeDefaultText;
  }

  Color _background(String label) {
    final lower = label.toLowerCase();
    if (lower.contains('overdue') ||
        lower.contains('reject') ||
        lower.contains('inactive') ||
        lower.contains('unread') ||
        lower.contains('cancelled') ||
        lower.contains('changes')) {
      return SsmsColors.dangerBg;
    }
    if (lower.contains('approv') ||
        lower.contains('complete') ||
        lower.contains('active') ||
        lower.contains('published') ||
        lower.contains('read')) {
      return SsmsColors.successBg;
    }
    if (lower.contains('pending') ||
        lower.contains('submitted') ||
        lower.contains('review') ||
        lower.contains('scheduled')) {
      return SsmsColors.blueSoft;
    }
    return SsmsColors.badgeDefaultBg;
  }

  @override
  Widget build(BuildContext context) {
    final label = prettyStatus(value);
    if (label.isEmpty) return const SizedBox.shrink();
    final textColor = onDark ? Colors.white : _textColor(label);
    final bg = onDark ? Colors.white.withValues(alpha: 0.12) : _background(label);
    return Container(
      constraints: const BoxConstraints(minHeight: 24),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(SsmsRadii.sm),
      ),
      child: Text(
        label,
        style: SsmsType.kicker.copyWith(
          color: textColor,
          fontSize: 12,
          fontWeight: FontWeight.w800,
          letterSpacing: 0,
        ),
      ),
    );
  }
}

Color statusAccent(String value) {
  final lower = value.toLowerCase();
  if (lower.contains('overdue') ||
      lower.contains('reject') ||
      lower.contains('changes')) {
    return SsmsColors.danger;
  }
  if (lower.contains('approv') || lower.contains('complete')) {
    return SsmsColors.accent;
  }
  return SsmsColors.navy;
}

class SsmsPageHead extends StatelessWidget {
  const SsmsPageHead({
    super.key,
    required this.title,
    this.kicker,
    this.detail,
    this.action,
  });

  final String title;
  final String? kicker;
  final String? detail;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (kicker != null) ...[
            Text(kicker!, style: SsmsType.pageKicker),
            const SizedBox(height: 10),
          ],
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  title,
                  style: SsmsType.serifLg.copyWith(fontSize: 32, height: 1.25),
                ),
              ),
              if (action != null) action!,
            ],
          ),
          if (detail != null) ...[
            const SizedBox(height: 8),
            Text(detail!, style: SsmsType.body),
          ],
        ],
      ),
    );
  }
}

void closeSsmsSheet(BuildContext context) {
  FocusScope.of(context).unfocus();
  if (Navigator.of(context).canPop()) {
    Navigator.of(context).pop();
  }
}

/// Owns sheet [TextEditingController]s so they live exactly as long as the sheet.
class SsmsSheetTextFields extends StatefulWidget {
  const SsmsSheetTextFields({
    super.key,
    required this.builder,
  });

  final Widget Function(
    BuildContext context,
    TextEditingController fullName,
    TextEditingController email,
    TextEditingController phone,
  ) builder;

  @override
  State<SsmsSheetTextFields> createState() => _SsmsSheetTextFieldsState();
}

class _SsmsSheetTextFieldsState extends State<SsmsSheetTextFields> {
  late final TextEditingController _fullName;
  late final TextEditingController _email;
  late final TextEditingController _phone;

  @override
  void initState() {
    super.initState();
    _fullName = TextEditingController();
    _email = TextEditingController();
    _phone = TextEditingController();
  }

  @override
  void dispose() {
    _fullName.dispose();
    _email.dispose();
    _phone.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return widget.builder(context, _fullName, _email, _phone);
  }
}

class SsmsSheetHeader extends StatelessWidget {
  const SsmsSheetHeader({
    super.key,
    required this.title,
    this.subtitle,
  });

  final String title;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: SsmsType.label.copyWith(fontSize: 22, fontWeight: FontWeight.w900)),
        if (subtitle != null) ...[
          const SizedBox(height: 6),
          Text(subtitle!, style: SsmsType.body),
        ],
        const SizedBox(height: 16),
      ],
    );
  }
}

class SsmsSheetActions extends StatelessWidget {
  const SsmsSheetActions({
    super.key,
    required this.onSubmit,
    required this.submitLabel,
    this.busy = false,
    this.cancelLabel = 'Cancel',
  });

  final VoidCallback? onSubmit;
  final String submitLabel;
  final bool busy;
  final String cancelLabel;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton(
            onPressed: busy ? null : () => closeSsmsSheet(context),
            child: Text(cancelLabel),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          flex: 2,
          child: FilledButton(
            onPressed: busy ? null : onSubmit,
            child: Text(busy ? 'Saving…' : submitLabel),
          ),
        ),
      ],
    );
  }
}

Future<void> showSsmsSheet({
  required BuildContext context,
  required Widget child,
  VoidCallback? onClose,
}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    isDismissible: true,
    enableDrag: true,
    backgroundColor: Colors.transparent,
    builder: (sheetContext) {
      final media = MediaQuery.of(sheetContext);
      final bottomInset = media.viewInsets.bottom;
      final maxHeight = media.size.height * 0.92;
      return Padding(
        padding: EdgeInsets.only(bottom: bottomInset),
        child: SafeArea(
          top: false,
          child: ConstrainedBox(
            constraints: BoxConstraints(maxHeight: maxHeight),
            child: Container(
              width: double.infinity,
              decoration: const BoxDecoration(
                color: SsmsColors.paper,
                borderRadius:
                    BorderRadius.vertical(top: Radius.circular(SsmsRadii.lg)),
                boxShadow: SsmsShadows.modal,
              ),
              child: SingleChildScrollView(
                keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
                padding: const EdgeInsets.fromLTRB(24, 10, 24, 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 42,
                      height: 4,
                      decoration: BoxDecoration(
                        color: SsmsColors.line,
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Align(
                    alignment: Alignment.centerRight,
                    child: IconButton(
                      tooltip: 'Close',
                      onPressed: () => closeSsmsSheet(sheetContext),
                      icon: const Icon(Icons.close_rounded, size: 20),
                      style: IconButton.styleFrom(
                        backgroundColor: SsmsColors.field,
                        foregroundColor: SsmsColors.ink,
                        minimumSize: const Size(36, 36),
                      ),
                    ),
                  ),
                  child,
                ],
              ),
            ),
            ),
          ),
        ),
      );
    },
  ).whenComplete(() {
    FocusManager.instance.primaryFocus?.unfocus();
    onClose?.call();
  });
}

/// Web `DashboardHeader` — large title + welcome subtitle.
class SsmsDashboardHeader extends StatelessWidget {
  const SsmsDashboardHeader({super.key, required this.subtitle});

  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Dashboard',
            style: SsmsType.label.copyWith(
              fontSize: 40,
              fontWeight: FontWeight.w800,
              height: 1.1,
              letterSpacing: -0.4,
            ),
          ),
          const SizedBox(height: 8),
          Text(subtitle, style: SsmsType.body.copyWith(fontSize: 15)),
        ],
      ),
    );
  }
}

enum DashStatTone { blue, green, peach }

/// Web `DashboardStatCard` — pastel tone cards with large value.
class DashStatCard extends StatelessWidget {
  const DashStatCard({
    super.key,
    required this.label,
    required this.value,
    this.delta,
    this.tone = DashStatTone.blue,
    this.linkLabel,
    this.onLink,
  });

  final String label;
  final String value;
  final String? delta;
  final DashStatTone tone;
  final String? linkLabel;
  final VoidCallback? onLink;

  Color get _bg => switch (tone) {
        DashStatTone.green => SsmsColors.statGreenBg,
        DashStatTone.peach => SsmsColors.statPeachBg,
        _ => SsmsColors.statBlueBg,
      };

  Color get _labelColor => switch (tone) {
        DashStatTone.green => SsmsColors.statGreenLabel,
        DashStatTone.peach => SsmsColors.statPeachLink,
        _ => SsmsColors.statBlueLabel,
      };

  Color get _linkColor => switch (tone) {
        DashStatTone.green => SsmsColors.statGreenLink,
        DashStatTone.peach => SsmsColors.statPeachLink,
        _ => SsmsColors.statBlueLink,
      };

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: _bg,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: SsmsType.label.copyWith(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: _labelColor,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                value,
                style: SsmsType.label.copyWith(
                  fontSize: 52,
                  fontWeight: FontWeight.w800,
                  height: 1,
                  letterSpacing: -1.2,
                  color: SsmsColors.ink,
                ),
              ),
              if (delta != null && delta!.isNotEmpty) ...[
                const SizedBox(width: 10),
                Text(delta!, style: SsmsType.meta.copyWith(fontSize: 13)),
              ],
            ],
          ),
          if (linkLabel != null && onLink != null) ...[
            const SizedBox(height: 14),
            GestureDetector(
              onTap: onLink,
              child: Text(
                linkLabel!,
                style: SsmsType.label.copyWith(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: _linkColor,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// Web `DashboardCTACard` — peach prompt with action link.
class DashCtaCard extends StatelessWidget {
  const DashCtaCard({
    super.key,
    required this.text,
    required this.actionLabel,
    this.onAction,
  });

  final String text;
  final String actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: SsmsColors.statPeachBg,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            text,
            style: SsmsType.body.copyWith(
              fontSize: 14,
              color: SsmsColors.statCtaText,
              fontWeight: FontWeight.w500,
            ),
          ),
          if (onAction != null) ...[
            const SizedBox(height: 14),
            GestureDetector(
              onTap: onAction,
              child: Text(
                actionLabel,
                style: SsmsType.label.copyWith(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: SsmsColors.statPeachLink,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

Future<void> showSsmsInfoDialog({
  required BuildContext context,
  required String title,
  required String message,
  String confirmLabel = 'OK',
}) {
  return showDialog<void>(
    context: context,
    barrierColor: SsmsColors.navy.withValues(alpha: 0.36),
    builder: (context) => AlertDialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(SsmsRadii.lg),
        side: const BorderSide(color: SsmsColors.softLine),
      ),
      title: Text(title, style: SsmsType.label.copyWith(fontSize: 22, fontWeight: FontWeight.w900)),
      content: Text(message, style: SsmsType.body),
      actions: [
        FilledButton(
          onPressed: () => Navigator.pop(context),
          child: Text(confirmLabel),
        ),
      ],
    ),
  );
}
