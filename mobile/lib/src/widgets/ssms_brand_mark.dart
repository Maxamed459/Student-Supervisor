import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Mirrors web `BrandMark` — logo image + SSMS wordmark.
class SsmsBrandMark extends StatelessWidget {
  const SsmsBrandMark({
    super.key,
    this.onDark = true,
    this.compact = false,
  });

  final bool onDark;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final mark = onDark ? Colors.white : SsmsColors.navy;
    final quiet = onDark
        ? SsmsColors.blueSoft.withValues(alpha: 0.78)
        : SsmsColors.muted;
    final symbolSize = compact ? 38.0 : 44.0;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: symbolSize,
          height: symbolSize,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(SsmsRadii.md),
            border: Border.all(
              color: onDark
                  ? SsmsColors.blueSoft.withValues(alpha: 0.34)
                  : SsmsColors.line,
            ),
            color: onDark
                ? Colors.white.withValues(alpha: 0.02)
                : SsmsColors.paper,
          ),
          clipBehavior: Clip.antiAlias,
          child: Image.asset(
            'assets/images/logo1.jpeg',
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => Center(
              child: Text(
                'S',
                style: SsmsType.label.copyWith(
                  color: mark,
                  fontSize: compact ? 18 : 20,
                ),
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'SSMS',
              style: SsmsType.label.copyWith(
                color: mark,
                fontSize: compact ? 20 : 22,
                fontWeight: FontWeight.w800,
                height: 1,
              ),
            ),
            if (!compact) ...[
              const SizedBox(height: 2),
              Text(
                'Academic Supervision',
                style: SsmsType.kicker.copyWith(
                  color: quiet,
                  fontSize: 10,
                  letterSpacing: 0,
                ),
              ),
            ],
          ],
        ),
      ],
    );
  }
}
