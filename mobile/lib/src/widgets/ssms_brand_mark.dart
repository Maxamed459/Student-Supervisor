import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

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
    final quiet = onDark ? SsmsColors.blueSoft : SsmsColors.muted;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: compact ? 28 : 32,
          height: compact ? 28 : 32,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            border: Border.all(
              color: mark.withValues(alpha: onDark ? 0.55 : 1),
              width: 1,
            ),
          ),
          child: Text(
            'S',
            style: SsmsType.serif.copyWith(
              color: mark,
              fontSize: compact ? 18 : 20,
              height: 1,
              fontStyle: FontStyle.italic,
            ),
          ),
        ),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'SSMS',
              style: SsmsType.serif.copyWith(
                color: mark,
                fontSize: compact ? 20 : 22,
                height: 1,
                letterSpacing: 0.4,
              ),
            ),
            if (!compact) ...[
              const SizedBox(height: 3),
              Text(
                'SUPERVISION',
                style: SsmsType.kicker.copyWith(
                  color: quiet,
                  fontSize: 9,
                  letterSpacing: 1.8,
                ),
              ),
            ],
          ],
        ),
      ],
    );
  }
}
