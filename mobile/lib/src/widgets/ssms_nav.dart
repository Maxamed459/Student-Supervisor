import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/app_theme.dart';

class SsmsNavItem {
  const SsmsNavItem(this.label, this.icon, {this.badge = 0});
  final String label;
  final IconData icon;
  final int badge;
}

class SsmsNav extends StatelessWidget {
  const SsmsNav({
    super.key,
    required this.index,
    required this.items,
    required this.onChanged,
  });

  final int index;
  final List<SsmsNavItem> items;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: SsmsColors.paper,
      elevation: 0,
      child: Container(
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: SsmsColors.hairline)),
        ),
        padding: EdgeInsets.only(bottom: MediaQuery.paddingOf(context).bottom),
        child: SizedBox(
          height: 66,
          child: Row(
            children: [
              for (var i = 0; i < items.length; i++)
                Expanded(
                  child: InkWell(
                    onTap: () {
                      HapticFeedback.selectionClick();
                      onChanged(i);
                    },
                    child: _Item(
                      item: items[i],
                      selected: index >= 0 && i == index,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Item extends StatelessWidget {
  const _Item({required this.item, required this.selected});

  final SsmsNavItem item;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    final color = selected ? SsmsColors.navy : SsmsColors.muted;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        decoration: BoxDecoration(
          color: selected ? SsmsColors.field : Colors.transparent,
          borderRadius: BorderRadius.circular(SsmsRadii.sm),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Icon(item.icon, size: 18, color: color),
                if (item.badge > 0)
                  Positioned(
                    right: -9,
                    top: -5,
                    child: Container(
                      constraints: const BoxConstraints(minWidth: 16),
                      height: 16,
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: SsmsColors.dangerSolid,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        item.badge > 9 ? '9+' : '${item.badge}',
                        style: SsmsType.kicker.copyWith(
                          color: Colors.white,
                          fontSize: 9,
                          height: 1,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              item.label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: SsmsType.nav.copyWith(
                color: color,
                fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
