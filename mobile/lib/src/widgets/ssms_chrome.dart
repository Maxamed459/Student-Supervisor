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
    this.padding = const EdgeInsets.all(16),
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
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: SsmsColors.hairline),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A0B1F33),
            blurRadius: 18,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: child,
    );
    if (onTap == null) return content;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
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
      child: const SizedBox(height: 10),
    );
  }
}

class SsmsEmpty extends StatelessWidget {
  const SsmsEmpty({super.key, required this.title, required this.detail});

  final String title;
  final String detail;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
      child: SsmsCard(
        padding: const EdgeInsets.fromLTRB(20, 28, 20, 28),
        child: Column(
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: SsmsColors.field,
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Icon(Icons.inbox_outlined, color: SsmsColors.navy),
            ),
            const SizedBox(height: 16),
            Text(title, textAlign: TextAlign.center, style: SsmsType.serif),
            const SizedBox(height: 6),
            Text(detail, textAlign: TextAlign.center, style: SsmsType.body),
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
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF1F1),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFFFD5D5)),
      ),
      child: Text(
        message,
        style: SsmsType.body.copyWith(
          color: SsmsColors.danger,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class SsmsStatusMark extends StatelessWidget {
  const SsmsStatusMark(this.value, {super.key, this.onDark = false});

  final String value;
  final bool onDark;

  @override
  Widget build(BuildContext context) {
    final label = prettyStatus(value);
    if (label.isEmpty) return const SizedBox.shrink();
    final tone = _tone(label);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: onDark
            ? Colors.white.withValues(alpha: 0.12)
            : tone.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label.toUpperCase(),
        style: SsmsType.kicker.copyWith(
          color: onDark ? Colors.white : tone,
          fontSize: 10,
          letterSpacing: 0.6,
        ),
      ),
    );
  }

  Color _tone(String label) {
    final lower = label.toLowerCase();
    if (lower.contains('overdue') ||
        lower.contains('reject') ||
        lower.contains('inactive') ||
        lower.contains('changes')) {
      return SsmsColors.danger;
    }
    if (lower.contains('approv') ||
        lower.contains('complete') ||
        lower.contains('active')) {
      return SsmsColors.accent;
    }
    return SsmsColors.navy;
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
            Text(kicker!.toUpperCase(), style: SsmsType.kicker),
            const SizedBox(height: 10),
          ],
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: Text(title, style: SsmsType.serifLg)),
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

void disposeAfterSheet(List<TextEditingController> controllers) {
  WidgetsBinding.instance.addPostFrameCallback((_) {
    for (final item in controllers) {
      item.dispose();
    }
  });
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
        Text(title, style: SsmsType.title.copyWith(fontSize: 24)),
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
    backgroundColor: SsmsColors.paper,
    builder: (sheetContext) {
      final bottomInset = MediaQuery.viewInsetsOf(sheetContext).bottom;
      return Padding(
        padding: EdgeInsets.only(bottom: bottomInset),
        child: SafeArea(
          top: false,
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 10, 20, 24),
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
                    icon: const Icon(Icons.close_rounded),
                    style: IconButton.styleFrom(
                      backgroundColor: SsmsColors.field,
                      foregroundColor: SsmsColors.ink,
                    ),
                  ),
                ),
                child,
              ],
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
