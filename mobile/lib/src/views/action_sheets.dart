import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../controllers/auth_controller.dart';
import '../controllers/dashboard_controller.dart';
import '../theme/app_theme.dart';
import '../widgets/display.dart';
import '../widgets/ssms_chrome.dart';

Future<void> openSecureUrl(String? url) async {
  if (url == null || url.isEmpty) return;
  final uri = Uri.tryParse(url);
  if (uri == null) return;
  await launchUrl(uri, mode: LaunchMode.externalApplication);
}

Future<void> showSubmitWorkSheet(
  BuildContext context, {
  String? milestoneId,
  String? headline,
  VoidCallback? onSubmitted,
}) async {
  final controller = Get.find<DashboardController>();
  final milestones = controller.milestones;
  if (milestones.isEmpty) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
          content: Text('No milestones available to submit against.')),
    );
    return;
  }

  String? selectedMilestoneId = milestoneId;
  if (selectedMilestoneId == null || selectedMilestoneId.isEmpty) {
    selectedMilestoneId = field(milestones.first, const ['_id', 'id']);
  }
  final note = TextEditingController();
  File? picked;
  String? fileName;
  final lockedMilestone = milestoneId != null && milestoneId.isNotEmpty;

  await showSsmsSheet(
    context: context,
    child: StatefulBuilder(
      builder: (context, setState) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              headline ?? 'Submit work',
              style: SsmsType.title.copyWith(fontSize: 28),
            ),
            const SizedBox(height: 8),
            Text(
              lockedMilestone
                  ? 'Upload a revised file for this milestone. Your note is saved with the upload.'
                  : 'Upload a PDF or DOCX for the selected milestone.',
              style: SsmsType.body,
            ),
            const SizedBox(height: 20),
            Text('MILESTONE', style: SsmsType.kicker),
            const SizedBox(height: 8),
            if (lockedMilestone)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: SsmsColors.field,
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Text(
                  titleOf(
                    milestones.firstWhere(
                      (item) =>
                          field(item, const ['_id', 'id']) == selectedMilestoneId,
                      orElse: () => milestones.first,
                    ),
                    fallback: 'Milestone',
                  ),
                  style: SsmsType.label,
                ),
              )
            else
              DropdownButtonFormField<String>(
                initialValue:
                    selectedMilestoneId!.isEmpty ? null : selectedMilestoneId,
                items: [
                  for (final item in milestones)
                    DropdownMenuItem(
                      value: field(item, const ['_id', 'id']),
                      child: Text(
                        titleOf(item, fallback: 'Milestone'),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                ],
                onChanged: (value) => setState(() => selectedMilestoneId = value),
              ),
            const SizedBox(height: 16),
            Text('NOTE / COMMENT', style: SsmsType.kicker),
            TextField(
              controller: note,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText: 'Optional note sent with this upload',
              ),
            ),
            const ColoredBox(
              color: SsmsColors.line,
              child: SizedBox(height: 1, width: double.infinity),
            ),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: () async {
                final result = await FilePicker.platform.pickFiles(
                  type: FileType.custom,
                  allowedExtensions: const ['pdf', 'doc', 'docx'],
                  withData: false,
                );
                if (result == null || result.files.isEmpty) return;
                final file = result.files.single;
                if (file.path == null) return;
                setState(() {
                  picked = File(file.path!);
                  fileName = file.name;
                });
              },
              icon: const Icon(Icons.attach_file, size: 18),
              label: Text(fileName ?? 'Choose PDF / DOCX'),
            ),
            const SizedBox(height: 18),
            Obx(() {
              final busy = controller.actionLoading.value;
              final err = controller.actionError.value;
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (err.isNotEmpty) ...[
                    SsmsErrorNote(err),
                    const SizedBox(height: 12),
                  ],
                  FilledButton(
                    onPressed: busy
                        ? null
                        : () async {
                            if (selectedMilestoneId == null ||
                                selectedMilestoneId!.isEmpty ||
                                picked == null ||
                                fileName == null) {
                              controller.actionError.value =
                                  'Select a milestone and a file.';
                              return;
                            }
                            final ok = await controller.submitWork(
                              milestoneId: selectedMilestoneId!,
                              file: picked!,
                              originalFilename: fileName!,
                              note: note.text,
                            );
                            if (ok && context.mounted) {
                              Navigator.pop(context);
                              onSubmitted?.call();
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Submission uploaded.'),
                                  backgroundColor: SsmsColors.navy,
                                ),
                              );
                            }
                          },
                    child: Text(busy ? 'Uploading' : 'Submit'),
                  ),
                ],
              );
            }),
          ],
        );
      },
    ),
  );
  note.dispose();
}

Future<void> showPublishGuidelineSheet(BuildContext context) async {
  final controller = Get.find<DashboardController>();
  final title = TextEditingController();
  final description = TextEditingController();
  DateTime? dueDate;
  File? picked;
  String? fileName;

  await showSsmsSheet(
    context: context,
    child: StatefulBuilder(
      builder: (context, setState) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Publish guideline',
                style: SsmsType.title.copyWith(fontSize: 28)),
            const SizedBox(height: 8),
            Text(
              'Create a guideline or dated task. Attach a PDF/DOCX if needed.',
              style: SsmsType.body,
            ),
            const SizedBox(height: 20),
            Text('TITLE', style: SsmsType.kicker),
            TextField(controller: title),
            const ColoredBox(
              color: SsmsColors.line,
              child: SizedBox(height: 1, width: double.infinity),
            ),
            const SizedBox(height: 16),
            Text('DESCRIPTION', style: SsmsType.kicker),
            TextField(controller: description, maxLines: 3),
            const ColoredBox(
              color: SsmsColors.line,
              child: SizedBox(height: 1, width: double.infinity),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: Text(
                    dueDate == null
                        ? 'No due date (guideline)'
                        : 'Due ${DateFormat('d MMM yyyy').format(dueDate!)}',
                    style: SsmsType.meta,
                  ),
                ),
                TextButton(
                  onPressed: () async {
                    final pickedDate = await showDatePicker(
                      context: context,
                      initialDate: DateTime.now().add(const Duration(days: 7)),
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 800)),
                    );
                    if (pickedDate != null) {
                      setState(() => dueDate = pickedDate);
                    }
                  },
                  child: Text('Set date'),
                ),
              ],
            ),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: () async {
                final result = await FilePicker.platform.pickFiles(
                  type: FileType.custom,
                  allowedExtensions: const ['pdf', 'doc', 'docx'],
                );
                if (result == null || result.files.isEmpty) return;
                final file = result.files.single;
                if (file.path == null) return;
                setState(() {
                  picked = File(file.path!);
                  fileName = file.name;
                });
              },
              icon: const Icon(Icons.attach_file, size: 18),
              label: Text(fileName ?? 'Attach PDF / DOCX'),
            ),
            const SizedBox(height: 18),
            Obx(() {
              final busy = controller.actionLoading.value;
              final err = controller.actionError.value;
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (err.isNotEmpty) ...[
                    SsmsErrorNote(err),
                    const SizedBox(height: 12),
                  ],
                  FilledButton(
                    onPressed: busy
                        ? null
                        : () async {
                            if (title.text.trim().isEmpty) {
                              controller.actionError.value =
                                  'Title is required.';
                              return;
                            }
                            final ok = await controller.publishGuideline(
                              title: title.text,
                              description: description.text,
                              dueDate: dueDate == null
                                  ? null
                                  : DateFormat('yyyy-MM-dd').format(dueDate!),
                              file: picked,
                              originalFilename: fileName,
                            );
                            if (ok && context.mounted) {
                              Navigator.pop(context);
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Guideline published.'),
                                  backgroundColor: SsmsColors.navy,
                                ),
                              );
                            }
                          },
                    child: Text(busy ? 'Publishing' : 'Publish'),
                  ),
                ],
              );
            }),
          ],
        );
      },
    ),
  );
  title.dispose();
  description.dispose();
}

Future<void> showEditGuidelineSheet(
  BuildContext context,
  dynamic item,
) async {
  final controller = Get.find<DashboardController>();
  final id = field(item, const ['_id', 'id']);
  if (id.isEmpty) return;

  final title = TextEditingController(
    text: field(item, const ['title'], fallback: ''),
  );
  final description = TextEditingController(
    text: field(item, const ['description'], fallback: ''),
  );
  DateTime? dueDate = asDate(field(item, const ['dueDate', 'dueAt']));
  var clearDueDate = false;

  await showSsmsSheet(
    context: context,
    child: StatefulBuilder(
      builder: (context, setState) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Edit guideline',
                style: SsmsType.title.copyWith(fontSize: 28)),
            const SizedBox(height: 8),
            Text(
              'Update the title, details, or due date for this milestone.',
              style: SsmsType.body,
            ),
            const SizedBox(height: 20),
            Text('TITLE', style: SsmsType.kicker),
            const SizedBox(height: 8),
            TextField(
              controller: title,
              decoration: const InputDecoration(hintText: 'Milestone title'),
            ),
            const SizedBox(height: 16),
            Text('DESCRIPTION', style: SsmsType.kicker),
            const SizedBox(height: 8),
            TextField(
              controller: description,
              maxLines: 3,
              decoration: const InputDecoration(hintText: 'Optional details'),
            ),
            const SizedBox(height: 18),
            Text('DUE DATE', style: SsmsType.kicker),
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: SsmsColors.field,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: SsmsColors.hairline),
              ),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: SsmsColors.paper,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(
                      Icons.event_rounded,
                      color: SsmsColors.navy,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      clearDueDate || dueDate == null
                          ? 'No due date (guideline)'
                          : DateFormat('EEEE, d MMM yyyy').format(dueDate!),
                      style:
                          SsmsType.label.copyWith(fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () async {
                      final pickedDate = await showDatePicker(
                        context: context,
                        initialDate: dueDate ??
                            DateTime.now().add(const Duration(days: 7)),
                        firstDate:
                            DateTime.now().subtract(const Duration(days: 1)),
                        lastDate: DateTime.now().add(const Duration(days: 800)),
                        builder: (context, child) {
                          return Theme(
                            data: Theme.of(context).copyWith(
                              colorScheme: const ColorScheme.light(
                                primary: SsmsColors.navy,
                                onPrimary: Colors.white,
                                surface: SsmsColors.paper,
                                onSurface: SsmsColors.ink,
                              ),
                            ),
                            child: child!,
                          );
                        },
                      );
                      if (pickedDate != null) {
                        setState(() {
                          dueDate = pickedDate;
                          clearDueDate = false;
                        });
                      }
                    },
                    icon: const Icon(Icons.edit_calendar_rounded, size: 18),
                    label: Text('Change date'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      setState(() {
                        dueDate = null;
                        clearDueDate = true;
                      });
                    },
                    icon: const Icon(Icons.event_busy_rounded, size: 18),
                    label: const Text('Clear date'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            Obx(() {
              final busy = controller.actionLoading.value;
              final err = controller.actionError.value;
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (err.isNotEmpty) ...[
                    SsmsErrorNote(err),
                    const SizedBox(height: 12),
                  ],
                  FilledButton(
                    onPressed: busy
                        ? null
                        : () async {
                            if (title.text.trim().isEmpty) {
                              controller.actionError.value =
                                  'Title is required.';
                              return;
                            }
                            final ok = await controller.updateGuideline(
                              id: id,
                              title: title.text,
                              description: description.text,
                              dueDate: clearDueDate || dueDate == null
                                  ? null
                                  : DateFormat('yyyy-MM-dd').format(dueDate!),
                              clearDueDate: clearDueDate,
                            );
                            if (ok && context.mounted) {
                              Navigator.pop(context);
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Guideline updated.'),
                                  backgroundColor: SsmsColors.navy,
                                ),
                              );
                            }
                          },
                    child: Text(busy ? 'Saving' : 'Save changes'),
                  ),
                ],
              );
            }),
          ],
        );
      },
    ),
  );
  title.dispose();
  description.dispose();
}

Future<void> showEditProfileSheet(BuildContext context) async {
  final auth = Get.find<AuthController>();
  final controller = Get.find<DashboardController>();
  final user = auth.user.value;
  if (user == null) return;

  final fullName = TextEditingController(text: user.fullName);
  controller.actionError.value = '';

  await showSsmsSheet(
    context: context,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Edit profile', style: SsmsType.title.copyWith(fontSize: 28)),
        const SizedBox(height: 8),
        Text(
          'Update your display name. Email is managed by admin.',
          style: SsmsType.body,
        ),
        const SizedBox(height: 20),
        Text('FULL NAME', style: SsmsType.kicker),
        const SizedBox(height: 8),
        TextField(
          controller: fullName,
          autofocus: true,
          textCapitalization: TextCapitalization.words,
          textInputAction: TextInputAction.done,
          decoration: const InputDecoration(hintText: 'Your name'),
          onSubmitted: (_) => FocusScope.of(context).unfocus(),
        ),
        Obx(() {
          final error = controller.actionError.value;
          if (error.isEmpty) return const SizedBox.shrink();
          return Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Text(
              error,
              style: SsmsType.meta.copyWith(color: SsmsColors.danger),
            ),
          );
        }),
        const SizedBox(height: 22),
        Obx(() {
          final busy = controller.actionLoading.value;
          return FilledButton(
            onPressed: busy
                ? null
                : () async {
                    final ok = await controller.updateProfile(
                      fullName: fullName.text.trim(),
                    );
                    if (ok && context.mounted) Navigator.pop(context);
                  },
            child: Text(busy ? 'Saving' : 'Save'),
          );
        }),
      ],
    ),
  );
  // Wait for sheet teardown / Obx to finish before disposing.
  await Future<void>.delayed(const Duration(milliseconds: 300));
  fullName.dispose();
}

Widget fileChip(Map file) {
  final name = field(file, const ['originalFilename', 'publicId'],
      fallback: 'Attachment');
  final url = field(file, const ['secureUrl']);
  return InkWell(
    onTap: url.isEmpty ? null : () => openSecureUrl(url),
    borderRadius: BorderRadius.circular(14),
    child: Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      decoration: BoxDecoration(
        color: SsmsColors.field,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: SsmsColors.hairline),
      ),
      child: Row(
        children: [
          const Icon(Icons.insert_drive_file_rounded,
              size: 18, color: SsmsColors.navy),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              name,
              style: SsmsType.label.copyWith(fontWeight: FontWeight.w600),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (url.isNotEmpty)
            const Icon(Icons.open_in_new_rounded,
                size: 16, color: SsmsColors.muted),
        ],
      ),
    ),
  );
}

List<Map> attachmentMaps(dynamic item) {
  final attachments = item is Map ? item['attachments'] : null;
  if (attachments is List) {
    return attachments
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();
  }
  final versions = item is Map ? item['versions'] : null;
  if (versions is List && versions.isNotEmpty) {
    final latest = versions.last;
    final files = latest is Map ? latest['files'] : null;
    if (files is List) {
      return files
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList();
    }
  }
  return [];
}

bool isSupervisor() {
  return Get.find<AuthController>().user.value?.role == 'supervisor';
}

bool isAdmin() {
  return Get.find<AuthController>().user.value?.role == 'admin';
}

bool isStudent() {
  return Get.find<AuthController>().user.value?.role == 'student';
}

bool canManageMilestones() {
  final role = Get.find<AuthController>().user.value?.role;
  return role == 'supervisor' || role == 'admin';
}

bool canReviewSubmissions() {
  return isSupervisor();
}

bool canSubmitWork() {
  return isStudent();
}
