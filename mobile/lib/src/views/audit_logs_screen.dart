import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../controllers/dashboard_controller.dart';
import '../theme/app_theme.dart';
import '../utils/audit_log_formatter.dart';
import '../widgets/ssms_chrome.dart';

class AuditLogsScreen extends StatefulWidget {
  const AuditLogsScreen({super.key});

  @override
  State<AuditLogsScreen> createState() => _AuditLogsScreenState();
}

class _AuditLogsScreenState extends State<AuditLogsScreen> {
  final searchController = TextEditingController();
  String? entityFilter;

  @override
  void dispose() {
    searchController.dispose();
    super.dispose();
  }

  Future<void> _search(DashboardController controller) async {
    await controller.loadAuditLogs(
      search: searchController.text.trim(),
      entityType: entityFilter,
    );
  }

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<DashboardController>();
    return Obx(() {
      final logs = controller.auditLogs;
      final loading = controller.auditLoading.value;
      final error = controller.auditError.value;

      return Scaffold(
        backgroundColor: Colors.transparent,
        body: RefreshIndicator(
          color: SsmsColors.navy,
          backgroundColor: SsmsColors.paper,
          onRefresh: () => _search(controller),
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.only(bottom: 28),
            children: [
              const SsmsPageHead(
                kicker: 'SSMS WORKSPACE',
                title: 'Audit Logs',
                detail:
                    'Readable history of who did what, who was affected, and when.',
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                child: TextField(
                  controller: searchController,
                  textInputAction: TextInputAction.search,
                  onSubmitted: (_) => _search(controller),
                  decoration: InputDecoration(
                    hintText: 'Search people, groups, actions…',
                    prefixIcon: const Icon(Icons.search_rounded),
                    suffixIcon: searchController.text.isNotEmpty
                        ? IconButton(
                            onPressed: () {
                              searchController.clear();
                              setState(() {});
                              _search(controller);
                            },
                            icon: const Icon(Icons.close_rounded),
                          )
                        : null,
                  ),
                  onChanged: (_) => setState(() {}),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
                child: Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final filter in const [
                      (null, 'All'),
                      ('Group', 'Groups'),
                      ('User', 'Users'),
                      ('Submission', 'Submissions'),
                      ('Milestone', 'Guidelines'),
                      ('Settings', 'Settings'),
                    ])
                      FilterChip(
                        label: Text(filter.$2),
                        selected: entityFilter == filter.$1,
                        onSelected: (_) {
                          setState(() => entityFilter = filter.$1);
                          _search(controller);
                        },
                      ),
                  ],
                ),
              ),
              if (loading && logs.isEmpty)
                const Padding(
                  padding: EdgeInsets.only(top: 40),
                  child: SsmsBusy(),
                )
              else if (error.isNotEmpty && logs.isEmpty)
                SsmsEmpty(title: 'Could not load audit log', detail: error)
              else if (logs.isEmpty)
                const SsmsEmpty(
                  title: 'No audit events',
                  detail: 'Recent actions will appear here.',
                )
              else
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    children: [
                      for (final item in logs) ...[
                        _AuditLogCard(formatted: formatAuditLog(item)),
                        const SizedBox(height: 10),
                      ],
                    ],
                  ),
                ),
            ],
          ),
        ),
      );
    });
  }
}

class _AuditLogCard extends StatelessWidget {
  const _AuditLogCard({required this.formatted});

  final FormattedAuditLog formatted;

  @override
  Widget build(BuildContext context) {
    return SsmsCard(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: SsmsColors.field,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(formatted.icon, color: SsmsColors.navy, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(formatted.message, style: SsmsType.label),
                const SizedBox(height: 8),
                Text(
                  [
                    formatted.actorName,
                    if (formatted.actorRole.isNotEmpty) formatted.actorRole,
                  ].join(' · '),
                  style: SsmsType.meta,
                ),
                if (formatted.affected != null &&
                    formatted.affected!.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(formatted.affected!, style: SsmsType.meta),
                ],
                if (formatted.groupName != null &&
                    formatted.groupName!.isNotEmpty &&
                    !(formatted.affected ?? '').contains(formatted.groupName!)) ...[
                  const SizedBox(height: 4),
                  Text('Group: ${formatted.groupName}', style: SsmsType.meta),
                ],
                const SizedBox(height: 6),
                Text(formatted.timestamp, style: SsmsType.meta),
                if (formatted.technicalAction.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    formatted.technicalAction,
                    style: SsmsType.meta.copyWith(
                      color: SsmsColors.muted,
                      fontSize: 11,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
