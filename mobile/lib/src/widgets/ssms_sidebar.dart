import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../controllers/auth_controller.dart';
import '../theme/app_theme.dart';

class SsmsSidebar extends StatelessWidget {
  const SsmsSidebar({
    super.key,
    required this.index,
    required this.items,
    required this.onSelect,
    required this.roleLabel,
  });

  final int index;
  final List<({String label, IconData icon, int badge})> items;
  final ValueChanged<int> onSelect;
  final String roleLabel;

  @override
  Widget build(BuildContext context) {
    final auth = Get.find<AuthController>();

    return Drawer(
      backgroundColor: SsmsColors.navy,
      shape: const RoundedRectangleBorder(),
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      ClipOval(
                        child: Image.asset(
                          'assets/images/logo1.jpeg',
                          width: 36,
                          height: 36,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            width: 36,
                            height: 36,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: Colors.white.withValues(alpha: 0.5),
                              ),
                            ),
                            child: Text(
                              'S',
                              style: SsmsType.serif.copyWith(
                                color: Colors.white,
                                fontSize: 18,
                                fontStyle: FontStyle.italic,
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        'SSMS',
                        style: SsmsType.label.copyWith(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.15),
                      ),
                    ),
                    child: Text(
                      roleLabel,
                      style: SsmsType.kicker.copyWith(
                        color: Colors.white.withValues(alpha: 0.85),
                        fontSize: 10,
                        letterSpacing: 0.4,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                itemCount: items.length,
                separatorBuilder: (_, __) => const SizedBox(height: 4),
                itemBuilder: (context, i) {
                  final item = items[i];
                  final selected = i == index;
                  return Material(
                    color: selected
                        ? Colors.white.withValues(alpha: 0.12)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(12),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(12),
                      onTap: () {
                        Navigator.pop(context);
                        onSelect(i);
                      },
                      child: Container(
                        decoration: selected
                            ? BoxDecoration(
                                borderRadius: BorderRadius.circular(12),
                                border: Border(
                                  left: BorderSide(
                                    color: SsmsColors.blueSoft,
                                    width: 3,
                                  ),
                                ),
                              )
                            : null,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 12,
                        ),
                        child: Row(
                          children: [
                            Icon(
                              item.icon,
                              size: 20,
                              color: selected
                                  ? Colors.white
                                  : Colors.white.withValues(alpha: 0.55),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                item.label,
                                style: SsmsType.label.copyWith(
                                  color: selected
                                      ? Colors.white
                                      : Colors.white.withValues(alpha: 0.65),
                                  fontSize: 14,
                                  fontWeight: selected
                                      ? FontWeight.w700
                                      : FontWeight.w500,
                                ),
                              ),
                            ),
                            if (item.badge > 0)
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 7,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: SsmsColors.danger,
                                  borderRadius: BorderRadius.circular(999),
                                ),
                                child: Text(
                                  item.badge > 9 ? '9+' : '${item.badge}',
                                  style: SsmsType.kicker.copyWith(
                                    color: Colors.white,
                                    fontSize: 10,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              child: SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () async {
                    Navigator.pop(context);
                    await auth.logout();
                  },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white.withValues(alpha: 0.85),
                    side: BorderSide(
                      color: Colors.white.withValues(alpha: 0.2),
                    ),
                    backgroundColor: Colors.white.withValues(alpha: 0.06),
                  ),
                  icon: const Icon(Icons.logout_rounded, size: 18),
                  label: const Text('Sign out'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Web-style top bar actions: notifications, profile avatar, logout.
class SsmsShellActions extends StatelessWidget {
  const SsmsShellActions({
    super.key,
    required this.unread,
    this.onNotifications,
    this.onProfile,
  });

  final int unread;
  final VoidCallback? onNotifications;
  final VoidCallback? onProfile;

  @override
  Widget build(BuildContext context) {
    final auth = Get.find<AuthController>();
    final user = auth.user.value!;
    final initial = user.fullName.isNotEmpty
        ? user.fullName.trim()[0].toUpperCase()
        : '?';

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        IconButton(
          onPressed: onNotifications,
          icon: Badge(
            isLabelVisible: unread > 0,
            label: Text(unread > 9 ? '9+' : '$unread'),
            child: const Icon(Icons.notifications_none_rounded),
          ),
        ),
        IconButton(
          onPressed: onProfile,
          icon: CircleAvatar(
            radius: 16,
            backgroundColor: SsmsColors.field,
            child: Text(
              initial,
              style: SsmsType.label.copyWith(fontSize: 13, color: SsmsColors.ink),
            ),
          ),
        ),
        IconButton(
          onPressed: () => auth.logout(),
          icon: const Icon(Icons.logout_rounded),
          tooltip: 'Sign out',
        ),
        const SizedBox(width: 4),
      ],
    );
  }
}
