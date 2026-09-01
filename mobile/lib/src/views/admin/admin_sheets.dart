import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../controllers/admin_controller.dart';
import '../../theme/app_theme.dart';
import '../../utils/student_import_parser.dart';
import '../../widgets/display.dart';
import '../../widgets/ssms_chrome.dart';

Future<bool> showAdminConfirmDialog({
  required BuildContext context,
  required String title,
  required String message,
  String confirmLabel = 'Confirm',
  bool destructive = false,
}) async {
  final result = await showDialog<bool>(
    context: context,
    barrierColor: SsmsColors.navy.withValues(alpha: 0.36),
    builder: (context) => AlertDialog(
      backgroundColor: SsmsColors.paper,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(SsmsRadii.lg),
        side: const BorderSide(color: SsmsColors.softLine),
      ),
      title: Text(
        title,
        style: SsmsType.label.copyWith(fontSize: 22, fontWeight: FontWeight.w900),
      ),
      content: Text(message, style: SsmsType.body),
      actions: [
        TextButton(
          onPressed: () {
            FocusManager.instance.primaryFocus?.unfocus();
            Navigator.pop(context, false);
          },
          child: const Text('Cancel'),
        ),
        FilledButton(
          style: destructive
              ? FilledButton.styleFrom(backgroundColor: SsmsColors.danger)
              : null,
          onPressed: () {
            FocusManager.instance.primaryFocus?.unfocus();
            Navigator.pop(context, true);
          },
          child: Text(confirmLabel),
        ),
      ],
    ),
  );
  return result == true;
}

Widget _groupContextBanner({
  required String groupName,
  String? supervisorName,
}) {
  return Container(
    width: double.infinity,
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: SsmsColors.blueSoft,
      borderRadius: BorderRadius.circular(SsmsRadii.md),
      border: Border.all(color: SsmsColors.hairline),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('GROUP', style: SsmsType.kicker),
        const SizedBox(height: 4),
        Text(groupName, style: SsmsType.label),
        if (supervisorName != null && supervisorName.isNotEmpty) ...[
          const SizedBox(height: 10),
          Text('SUPERVISOR', style: SsmsType.kicker),
          const SizedBox(height: 4),
          Text(supervisorName, style: SsmsType.label),
        ],
      ],
    ),
  );
}

Widget _actionMessages(AdminController controller) {
  return Obx(() {
    final err = controller.actionError.value;
    final ok = controller.actionSuccess.value;
    if (err.isEmpty && ok.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (err.isNotEmpty) ...[
          SsmsErrorNote(err),
          const SizedBox(height: 12),
        ],
        if (ok.isNotEmpty) SsmsSuccessNote(ok),
        if (ok.isNotEmpty) const SizedBox(height: 12),
      ],
    );
  });
}

Future<void> showCreateGroupSheet(BuildContext context) async {
  final controller = Get.find<AdminController>();
  controller.clearMessages();
  await controller.loadStudentPool();
  await showSsmsSheet(
    context: context,
    onClose: controller.clearMessages,
    child: const _CreateGroupWizard(),
  );
}

class _CreateGroupWizard extends StatefulWidget {
  const _CreateGroupWizard();

  @override
  State<_CreateGroupWizard> createState() => _CreateGroupWizardState();
}

class _CreateGroupWizardState extends State<_CreateGroupWizard> {
  final controller = Get.find<AdminController>();
  int step = 0;
  final selectedStudentIds = <String>{};
  String? selectedSupervisorId;
  bool createNewSupervisor = false;
  final supervisorName = TextEditingController();
  final supervisorEmail = TextEditingController();
  final supervisorPhone = TextEditingController();
  final groupName = TextEditingController();
  final groupTerm = TextEditingController();
  final groupDescription = TextEditingController();

  @override
  void dispose() {
    supervisorName.dispose();
    supervisorEmail.dispose();
    supervisorPhone.dispose();
    groupName.dispose();
    groupTerm.dispose();
    groupDescription.dispose();
    super.dispose();
  }

  bool get hasEnoughStudents =>
      selectedStudentIds.length >= AdminController.minStudentsPerGroup;

  bool get hasSupervisor =>
      selectedSupervisorId != null && selectedSupervisorId!.isNotEmpty ||
      createNewSupervisor;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SsmsSheetHeader(
          title: 'Create group',
          subtitle: step == 0
              ? 'Step 1 · Select at least ${AdminController.minStudentsPerGroup} students.'
              : step == 1
                  ? 'Step 2 · Assign a supervisor.'
                  : 'Step 3 · Name the group and save.',
        ),
        _stepIndicator(current: step),
        const SizedBox(height: 20),
        if (step == 0) _buildStudentStep(),
        if (step == 1) _buildSupervisorStep(),
        if (step == 2) _buildDetailsStep(),
        const SizedBox(height: 18),
        _actionMessages(controller),
        _buildNavButtons(context),
      ],
    );
  }

  Widget _stepIndicator({required int current}) {
    return Row(
      children: [
        for (var i = 0; i < 3; i++) ...[
          if (i > 0) const SizedBox(width: 8),
          Expanded(
            child: Container(
              height: 4,
              decoration: BoxDecoration(
                color: i <= current ? SsmsColors.navy : SsmsColors.line,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildStudentStep() {
    final students = controller.unassignedStudents;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '${selectedStudentIds.length} selected · minimum ${AdminController.minStudentsPerGroup}',
          style: SsmsType.meta.copyWith(
            color: hasEnoughStudents ? SsmsColors.accent : SsmsColors.danger,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        if (students.isEmpty)
          Text('No unassigned students available.', style: SsmsType.body)
        else
          for (final student in students)
            _StudentCheckbox(
              student: student,
              selected: selectedStudentIds.contains(
                field(student, const ['_id', 'id']),
              ),
              onChanged: (checked) {
                setState(() {
                  final id = field(student, const ['_id', 'id']);
                  if (checked) {
                    selectedStudentIds.add(id);
                  } else {
                    selectedStudentIds.remove(id);
                  }
                });
              },
            ),
      ],
    );
  }

  Widget _buildSupervisorStep() {
    final assignable = controller.availableSupervisors
        .where((item) => groupIdOf(item).isEmpty)
        .toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('ASSIGN EXISTING', style: SsmsType.kicker),
        const SizedBox(height: 8),
        if (assignable.isEmpty)
          Text('No unassigned supervisors available.', style: SsmsType.meta)
        else
          DropdownButtonFormField<String>(
            isExpanded: true,
            initialValue: createNewSupervisor
                ? null
                : (selectedSupervisorId?.isEmpty == true
                    ? null
                    : selectedSupervisorId),
            decoration: const InputDecoration(hintText: 'Select supervisor'),
            items: [
              for (final item in assignable)
                DropdownMenuItem(
                  value: field(item, const ['_id', 'id']),
                  child: Text(
                    field(item, const ['fullName', 'name'], fallback: 'Supervisor'),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
            ],
            onChanged: (value) => setState(() {
              createNewSupervisor = false;
              selectedSupervisorId = value;
            }),
          ),
        const SizedBox(height: 20),
        const ColoredBox(
          color: SsmsColors.line,
          child: SizedBox(height: 1, width: double.infinity),
        ),
        const SizedBox(height: 16),
        Text('OR CREATE NEW', style: SsmsType.kicker),
        const SizedBox(height: 12),
        SwitchListTile(
          contentPadding: EdgeInsets.zero,
          title: Text('Create a new supervisor', style: SsmsType.label),
          value: createNewSupervisor,
          onChanged: (value) => setState(() {
            createNewSupervisor = value;
            if (value) selectedSupervisorId = null;
          }),
        ),
        if (createNewSupervisor) ...[
          Text('FULL NAME', style: SsmsType.kicker),
          TextField(controller: supervisorName),
          const SizedBox(height: 12),
          Text('EMAIL', style: SsmsType.kicker),
          TextField(
            controller: supervisorEmail,
            keyboardType: TextInputType.emailAddress,
          ),
          const SizedBox(height: 12),
          Text('PHONE', style: SsmsType.kicker),
          TextField(
            controller: supervisorPhone,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(hintText: 'Optional'),
          ),
        ],
      ],
    );
  }

  Widget _buildDetailsStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: SsmsColors.blueSoft,
            borderRadius: BorderRadius.circular(SsmsRadii.md),
            border: Border.all(color: SsmsColors.hairline),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${selectedStudentIds.length} students · supervisor assigned',
                style: SsmsType.label,
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Text('NAME', style: SsmsType.kicker),
        TextField(
          controller: groupName,
          textCapitalization: TextCapitalization.words,
          decoration: const InputDecoration(hintText: 'Cohort 2026'),
        ),
        const SizedBox(height: 14),
        Text('TERM', style: SsmsType.kicker),
        TextField(
          controller: groupTerm,
          decoration: const InputDecoration(hintText: 'Fall 2026 (optional)'),
        ),
        const SizedBox(height: 14),
        Text('DESCRIPTION', style: SsmsType.kicker),
        TextField(
          controller: groupDescription,
          maxLines: 3,
          decoration: const InputDecoration(hintText: 'Optional notes'),
        ),
      ],
    );
  }

  Widget _buildNavButtons(BuildContext context) {
    return Obx(() {
      final busy = controller.actionLoading.value;
      return Row(
        children: [
          Expanded(
            child: OutlinedButton(
              onPressed: busy
                  ? null
                  : () {
                      if (step > 0) {
                        setState(() => step -= 1);
                      } else {
                        closeSsmsSheet(context);
                      }
                    },
              child: Text(step > 0 ? 'Back' : 'Cancel'),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            flex: 2,
            child: FilledButton(
              onPressed: busy ? null : () => _onNext(context),
              child: Text(
                busy
                    ? 'Saving'
                    : step < 2
                        ? 'Continue'
                        : 'Create group',
              ),
            ),
          ),
        ],
      );
    });
  }

  Future<void> _onNext(BuildContext context) async {
    if (step == 0) {
      if (!hasEnoughStudents) {
        controller.actionError.value =
            'Select at least ${AdminController.minStudentsPerGroup} students.';
        return;
      }
      controller.clearMessages();
      setState(() => step = 1);
      return;
    }
    if (step == 1) {
      if (!hasSupervisor) {
        controller.actionError.value = 'Assign or create a supervisor.';
        return;
      }
      if (createNewSupervisor &&
          (supervisorName.text.trim().isEmpty ||
              supervisorEmail.text.trim().isEmpty)) {
        controller.actionError.value =
            'Enter the new supervisor name and email.';
        return;
      }
      controller.clearMessages();
      setState(() => step = 2);
      return;
    }
    final ok = await controller.createGroupWithMembers(
      name: groupName.text,
      supervisorId: createNewSupervisor ? '' : (selectedSupervisorId ?? ''),
      studentIds: selectedStudentIds.toList(),
      description: groupDescription.text,
      term: groupTerm.text,
      newSupervisorFullName:
          createNewSupervisor ? supervisorName.text : null,
      newSupervisorEmail: createNewSupervisor ? supervisorEmail.text : null,
      newSupervisorPhone:
          createNewSupervisor ? supervisorPhone.text : null,
    );
    if (ok && context.mounted) {
      closeSsmsSheet(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Group created.'),
          backgroundColor: SsmsColors.navy,
        ),
      );
    }
  }
}

class _StudentCheckbox extends StatelessWidget {
  const _StudentCheckbox({
    required this.student,
    required this.selected,
    required this.onChanged,
  });

  final dynamic student;
  final bool selected;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    final name =
        field(student, const ['fullName', 'name'], fallback: 'Student');
    final email = field(student, const ['email']);
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: SsmsCard(
        onTap: () => onChanged(!selected),
        child: Row(
          children: [
            Checkbox(
              value: selected,
              onChanged: (value) => onChanged(value ?? false),
              activeColor: SsmsColors.navy,
            ),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name, style: SsmsType.label),
                  if (email.isNotEmpty)
                    Text(email, style: SsmsType.meta),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

Future<void> showChangeSupervisorSheet(
  BuildContext context, {
  required String groupId,
  required String groupName,
  String? currentSupervisorId,
}) async {
  final controller = Get.find<AdminController>();
  controller.clearMessages();
  String? selectedSupervisorId;

  await showSsmsSheet(
    context: context,
    onClose: controller.clearMessages,
    child: StatefulBuilder(
      builder: (context, setState) {
        final assignable = controller.availableSupervisors.where((item) {
          final id = field(item, const ['_id', 'id']);
          return id != currentSupervisorId;
        }).toList();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SsmsSheetHeader(
              title: 'Change supervisor',
              subtitle:
                  'All students in this group will be reassigned to the new supervisor.',
            ),
            Text(
              groupName,
              style: SsmsType.label,
            ),
            const SizedBox(height: 16),
            _groupContextBanner(groupName: groupName),
            const SizedBox(height: 20),
            Text('SELECT SUPERVISOR', style: SsmsType.kicker),
            const SizedBox(height: 8),
            if (assignable.isEmpty)
              Text('No other supervisors available.', style: SsmsType.meta)
            else
              DropdownButtonFormField<String>(
                isExpanded: true,
                initialValue: selectedSupervisorId?.isEmpty == true
                    ? null
                    : selectedSupervisorId,
                decoration: const InputDecoration(hintText: 'Select supervisor'),
                items: [
                  for (final item in assignable)
                    DropdownMenuItem(
                      value: field(item, const ['_id', 'id']),
                      child: Text(
                        field(item, const ['fullName', 'name'], fallback: 'Supervisor'),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                ],
                onChanged: (value) => setState(() => selectedSupervisorId = value),
              ),
            const SizedBox(height: 18),
            _actionMessages(controller),
            Obx(() {
              final busy = controller.actionLoading.value;
              return SsmsSheetActions(
                busy: busy,
                submitLabel: 'Change supervisor',
                onSubmit: busy || selectedSupervisorId == null
                    ? null
                    : () async {
                        final supervisor = assignable.firstWhere(
                          (item) =>
                              field(item, const ['_id', 'id']) ==
                              selectedSupervisorId,
                        );
                        final supervisorName = field(
                          supervisor,
                          const ['fullName', 'name'],
                          fallback: 'Supervisor',
                        );
                        final confirmed = await showAdminConfirmDialog(
                          context: context,
                          title: 'Change supervisor',
                          message:
                              'Assign $supervisorName to $groupName? All students will be updated.',
                        );
                        if (!confirmed || !context.mounted) return;
                        final ok = await controller.changeGroupSupervisor(
                          groupId: groupId,
                          newSupervisorId: selectedSupervisorId!,
                          newSupervisorName: supervisorName,
                          groupName: groupName,
                          previousSupervisorId: currentSupervisorId,
                        );
                        if (ok && context.mounted) {
                          closeSsmsSheet(context);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('$supervisorName assigned.'),
                              backgroundColor: SsmsColors.navy,
                            ),
                          );
                        }
                      },
              );
            }),
          ],
        );
      },
    ),
  );
}

Future<void> showEditGroupSheet(
  BuildContext context, {
  required String groupId,
  required Map<String, dynamic> group,
}) async {
  final controller = Get.find<AdminController>();
  controller.clearMessages();
  await showSsmsSheet(
    context: context,
    onClose: controller.clearMessages,
    child: _EditGroupForm(groupId: groupId, initialGroup: group),
  );
}

class _EditGroupForm extends StatefulWidget {
  const _EditGroupForm({
    required this.groupId,
    required this.initialGroup,
  });

  final String groupId;
  final Map<String, dynamic> initialGroup;

  @override
  State<_EditGroupForm> createState() => _EditGroupFormState();
}

class _EditGroupFormState extends State<_EditGroupForm> {
  final controller = Get.find<AdminController>();
  late final TextEditingController name;
  late final TextEditingController term;
  late final TextEditingController description;
  bool loading = true;
  String? selectedSupervisorId;
  String? selectedStudentId;

  @override
  void initState() {
    super.initState();
    name = TextEditingController(
      text: field(widget.initialGroup, const ['name', 'title']),
    );
    term = TextEditingController(
      text: field(widget.initialGroup, const ['term']),
    );
    description = TextEditingController(
      text: field(widget.initialGroup, const ['description']),
    );
    _load();
  }

  Future<void> _load() async {
    setState(() => loading = true);
    controller.clearMessages();
    await controller.loadGroupDetail(widget.groupId);
    if (mounted) {
      setState(() {
        loading = false;
        selectedSupervisorId = null;
        selectedStudentId = null;
      });
    }
  }

  @override
  void dispose() {
    name.dispose();
    term.dispose();
    description.dispose();
    super.dispose();
  }

  String get _groupName =>
      field(controller.selectedGroup.value ?? widget.initialGroup,
          const ['name', 'title'], fallback: 'Group');

  Future<void> _runMemberAction(Future<bool> Function() action) async {
    final ok = await action();
    if (ok && mounted) await _load();
  }

  @override
  Widget build(BuildContext context) {
    if (loading && controller.selectedGroup.value == null) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 32),
        child: SsmsBusy(),
      );
    }

    return Obx(() {
      final supervisors = controller.supervisorsInGroup;
      final students = controller.studentsInGroup;
      final supervisorId = controller.primarySupervisorId ?? '';
      final supervisorName = supervisors.isEmpty
          ? ''
          : field(supervisors.first, const ['fullName', 'name'],
              fallback: 'Supervisor');
      final assignableSupervisors = controller.availableSupervisors.where((item) {
        final id = idOf(item);
        return id != supervisorId;
      }).toList();
      final busy = controller.actionLoading.value;

      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SsmsSheetHeader(
            title: 'Edit group',
            subtitle:
                'Update group details, supervisor, and students in one place.',
          ),
          Text('NAME', style: SsmsType.kicker),
          TextField(controller: name),
          const SizedBox(height: 14),
          Text('TERM', style: SsmsType.kicker),
          TextField(controller: term),
          const SizedBox(height: 14),
          Text('DESCRIPTION', style: SsmsType.kicker),
          TextField(controller: description, maxLines: 3),
          const SizedBox(height: 20),
          const SsmsSectionLabel('Supervisor'),
          if (supervisors.isEmpty)
            Text(
              'No supervisor assigned yet. Add one below.',
              style: SsmsType.meta,
            )
          else
            ...supervisors.take(1).map((supervisor) {
              final sName = field(supervisor, const ['fullName', 'name'],
                  fallback: 'Supervisor');
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: SsmsCard(
                  child: Row(
                    children: [
                      SsmsInitials(sName, size: 40),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(sName, style: SsmsType.label),
                            Text(
                              field(supervisor, const ['email']),
                              style: SsmsType.meta,
                            ),
                          ],
                        ),
                      ),
                      if (students.isEmpty)
                        IconButton(
                          tooltip: 'Remove supervisor',
                          onPressed: busy
                              ? null
                              : () async {
                                  final confirmed =
                                      await showAdminConfirmDialog(
                                    context: context,
                                    title: 'Remove supervisor',
                                    message: 'Remove $sName from $_groupName?',
                                    confirmLabel: 'Remove',
                                    destructive: true,
                                  );
                                  if (!confirmed || !context.mounted) return;
                                  await _runMemberAction(() =>
                                      controller.removeSupervisorFromGroup(
                                        groupId: widget.groupId,
                                        supervisorId: idOf(supervisor),
                                        currentStudentCount: students.length,
                                      ));
                                },
                          icon: const Icon(Icons.remove_circle_outline_rounded),
                          color: SsmsColors.danger,
                        ),
                    ],
                  ),
                ),
              );
            }),
          if (supervisors.isNotEmpty) ...[
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: busy
                  ? null
                  : () => showChangeSupervisorSheet(
                        context,
                        groupId: widget.groupId,
                        groupName: _groupName,
                        currentSupervisorId: supervisorId,
                      ).then((_) => _load()),
              icon: const Icon(Icons.supervisor_account_outlined, size: 18),
              label: const Text('Change supervisor'),
            ),
          ] else ...[
            Text('ADD SUPERVISOR', style: SsmsType.kicker),
            const SizedBox(height: 8),
            if (assignableSupervisors.isEmpty)
              Text('No unassigned supervisors available.', style: SsmsType.meta)
            else
              DropdownButtonFormField<String>(
                isExpanded: true,
                initialValue: selectedSupervisorId,
                decoration:
                    const InputDecoration(hintText: 'Select supervisor'),
                items: [
                  for (final item in assignableSupervisors)
                    DropdownMenuItem(
                      value: idOf(item),
                      child: Text(
                        field(item, const ['fullName', 'name'],
                            fallback: 'Supervisor'),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                ],
                onChanged: busy
                    ? null
                    : (value) => setState(() => selectedSupervisorId = value),
              ),
            const SizedBox(height: 10),
            OutlinedButton.icon(
              onPressed: busy || selectedSupervisorId == null
                  ? null
                  : () async {
                      final supervisor = assignableSupervisors.firstWhere(
                        (item) => idOf(item) == selectedSupervisorId,
                      );
                      final sName = field(supervisor, const ['fullName', 'name'],
                          fallback: 'Supervisor');
                      await _runMemberAction(() =>
                          controller.assignSupervisorToGroup(
                            groupId: widget.groupId,
                            supervisorId: selectedSupervisorId!,
                            supervisorName: sName,
                            groupName: _groupName,
                          ));
                    },
              icon: const Icon(Icons.person_add_alt_1_rounded, size: 18),
              label: const Text('Add supervisor'),
            ),
            const SizedBox(height: 10),
            OutlinedButton.icon(
              onPressed: busy
                  ? null
                  : () => showAddSupervisorSheet(
                        context,
                        groupId: widget.groupId,
                        groupName: _groupName,
                      ).then((_) => _load()),
              icon: const Icon(Icons.person_add_rounded, size: 18),
              label: const Text('Create new supervisor'),
            ),
          ],
          if (controller.hasMultipleSupervisors) ...[
            const SizedBox(height: 10),
            const SsmsErrorNote(
              'Multiple supervisors detected. Use Change supervisor to keep exactly one.',
            ),
          ],
          const SizedBox(height: 20),
          SsmsSectionLabel(
            'Students',
            trailing: students.isEmpty ? null : '${students.length}',
          ),
          if (supervisorId.isEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Text(
                'Assign a supervisor before adding students.',
                style: SsmsType.meta.copyWith(color: SsmsColors.danger),
              ),
            ),
          if (students.isEmpty)
            Text('No students in this group yet.', style: SsmsType.meta)
          else
            ...students.map((student) {
              final studentName = field(student, const ['fullName', 'name'],
                  fallback: 'Student');
              final studentSupervisor = field(student, const ['supervisor']);
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: SsmsCard(
                  child: Row(
                    children: [
                      SsmsInitials(studentName, size: 40),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(studentName, style: SsmsType.label),
                            Text(
                              [
                                field(student, const ['email']),
                                if (studentSupervisor.isNotEmpty)
                                  'Supervisor · $studentSupervisor',
                              ].where((s) => s.isNotEmpty).join(' · '),
                              style: SsmsType.meta,
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        tooltip: 'Remove student',
                        onPressed: busy
                            ? null
                            : () async {
                                final confirmed =
                                    await showAdminConfirmDialog(
                                  context: context,
                                  title: 'Remove student',
                                  message:
                                      'Remove $studentName from $_groupName?',
                                  confirmLabel: 'Remove',
                                  destructive: true,
                                );
                                if (!confirmed || !context.mounted) return;
                                await _runMemberAction(() =>
                                    controller.removeStudentFromGroup(
                                      groupId: widget.groupId,
                                      studentId: idOf(student),
                                      studentName: studentName,
                                    ));
                              },
                        icon: const Icon(Icons.remove_circle_outline_rounded),
                        color: SsmsColors.danger,
                      ),
                    ],
                  ),
                ),
              );
            }),
          const SizedBox(height: 10),
          if (controller.unassignedStudents.isEmpty)
            Text('No unassigned students available.', style: SsmsType.meta)
          else ...[
            Text('ADD STUDENT', style: SsmsType.kicker),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              isExpanded: true,
              initialValue: selectedStudentId,
              decoration: const InputDecoration(hintText: 'Select student'),
              items: [
                for (final item in controller.unassignedStudents)
                  DropdownMenuItem(
                    value: idOf(item),
                    child: Text(
                      '${field(item, const ['fullName', 'name'], fallback: 'Student')} · ${field(item, const ['email'])}',
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
              ],
              onChanged: supervisorId.isEmpty || busy
                  ? null
                  : (value) => setState(() => selectedStudentId = value),
            ),
            const SizedBox(height: 10),
          ],
          OutlinedButton.icon(
            onPressed: busy ||
                    supervisorId.isEmpty ||
                    selectedStudentId == null
                ? null
                : () async {
                    final student = controller.unassignedStudents.firstWhere(
                      (item) => idOf(item) == selectedStudentId,
                    );
                    final studentName = field(student, const ['fullName', 'name'],
                        fallback: 'Student');
                    await _runMemberAction(() =>
                        controller.assignExistingStudent(
                          groupId: widget.groupId,
                          supervisorId: supervisorId,
                          studentId: selectedStudentId!,
                          studentName: studentName,
                          groupName: _groupName,
                          supervisorName: supervisorName,
                        ));
                  },
            icon: const Icon(Icons.person_add_rounded, size: 18),
            label: const Text('Add selected student'),
          ),
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: busy || supervisorId.isEmpty
                ? null
                : () => showAddStudentSheet(
                      context,
                      groupId: widget.groupId,
                      groupName: _groupName,
                      supervisorId: supervisorId,
                      supervisorName: supervisorName,
                    ).then((_) => _load()),
            icon: const Icon(Icons.person_add_alt_1_rounded, size: 18),
            label: const Text('Create new student'),
          ),
          const SizedBox(height: 18),
          _actionMessages(controller),
          SsmsSheetActions(
            busy: busy,
            submitLabel: 'Save changes',
            onSubmit: busy
                ? null
                : () async {
                    final ok = await controller.updateGroup(
                      groupId: widget.groupId,
                      name: name.text,
                      description: description.text,
                      term: term.text,
                    );
                    if (ok && context.mounted) {
                      closeSsmsSheet(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Group updated.'),
                          backgroundColor: SsmsColors.navy,
                        ),
                      );
                    }
                  },
          ),
        ],
      );
    });
  }
}

Future<void> showAddSupervisorSheet(
  BuildContext context, {
  required String groupId,
  required String groupName,
}) async {
  final controller = Get.find<AdminController>();
  controller.clearMessages();
  await controller.loadGroupDetail(groupId);
  if (controller.hasSupervisor) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'This group already has a supervisor. Use Change supervisor instead.',
          ),
        ),
      );
    }
    return;
  }
  String? selectedSupervisorId;

  await showSsmsSheet(
    context: context,
    onClose: controller.clearMessages,
    child: SsmsSheetTextFields(
      builder: (context, fullName, email, phone) {
        return StatefulBuilder(
          builder: (context, setState) {
        final assignable = controller.availableSupervisors
            .where((item) => groupIdOf(item).isEmpty)
            .toList();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SsmsSheetHeader(
              title: 'Add supervisor',
              subtitle:
                  'Create a new supervisor or assign an existing one to this group only.',
            ),
            _groupContextBanner(groupName: groupName),
            const SizedBox(height: 20),
            Text('ASSIGN EXISTING', style: SsmsType.kicker),
            const SizedBox(height: 8),
            if (assignable.isEmpty)
              Text('No unassigned supervisors available.',
                  style: SsmsType.meta)
            else
              DropdownButtonFormField<String>(
                isExpanded: true,
                initialValue:
                    selectedSupervisorId?.isEmpty == true ? null : selectedSupervisorId,
                decoration: const InputDecoration(hintText: 'Select supervisor'),
                items: [
                  for (final item in assignable)
                    DropdownMenuItem(
                      value: field(item, const ['_id', 'id']),
                      child: Text(
                        field(item, const ['fullName', 'name'], fallback: 'Supervisor'),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                ],
                onChanged: (value) => setState(() => selectedSupervisorId = value),
              ),
            const SizedBox(height: 12),
            Obx(() {
              final busy = controller.actionLoading.value;
              return FilledButton(
                onPressed: busy || selectedSupervisorId == null
                    ? null
                    : () async {
                        final supervisor = assignable.firstWhere(
                          (item) =>
                              field(item, const ['_id', 'id']) ==
                              selectedSupervisorId,
                        );
                        final supervisorName = field(
                          supervisor,
                          const ['fullName', 'name'],
                          fallback: 'Supervisor',
                        );
                        final confirmed = await showAdminConfirmDialog(
                          context: context,
                          title: 'Assign supervisor',
                          message:
                              'Assign $supervisorName to $groupName? They will only manage students in this group.',
                        );
                        if (!confirmed || !context.mounted) return;
                        final ok = await controller.assignSupervisorToGroup(
                          groupId: groupId,
                          supervisorId: selectedSupervisorId!,
                          supervisorName: supervisorName,
                          groupName: groupName,
                        );
                        if (ok && context.mounted) {
                          closeSsmsSheet(context);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('$supervisorName assigned.'),
                              backgroundColor: SsmsColors.navy,
                            ),
                          );
                        }
                      },
                child: Text(busy ? 'Assigning' : 'Assign selected'),
              );
            }),
            const SizedBox(height: 24),
            const ColoredBox(
              color: SsmsColors.line,
              child: SizedBox(height: 1, width: double.infinity),
            ),
            const SizedBox(height: 20),
            Text('CREATE NEW', style: SsmsType.kicker),
            const SizedBox(height: 12),
            Text('FULL NAME', style: SsmsType.kicker),
            TextField(controller: fullName),
            const SizedBox(height: 12),
            Text('EMAIL', style: SsmsType.kicker),
            TextField(
              controller: email,
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 12),
            Text('PHONE', style: SsmsType.kicker),
            TextField(
              controller: phone,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(hintText: 'Optional'),
            ),
            const SizedBox(height: 18),
            _actionMessages(controller),
            Obx(() {
              final busy = controller.actionLoading.value;
              return SsmsSheetActions(
                busy: busy,
                submitLabel: 'Create supervisor',
                onSubmit: busy
                    ? null
                    : () async {
                        final ok = await controller.createSupervisor(
                          groupId: groupId,
                          fullName: fullName.text,
                          email: email.text,
                          phone: phone.text,
                        );
                        if (ok && context.mounted) {
                          closeSsmsSheet(context);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Supervisor created.'),
                              backgroundColor: SsmsColors.navy,
                            ),
                          );
                        }
                      },
              );
            }),
          ],
        );
          },
        );
      },
    ),
  );
}

Future<void> showAddStudentSheet(
  BuildContext context, {
  required String groupId,
  required String groupName,
  required String supervisorId,
  required String supervisorName,
}) async {
  final controller = Get.find<AdminController>();
  controller.clearMessages();
  String? selectedStudentId;

  await showSsmsSheet(
    context: context,
    onClose: controller.clearMessages,
    child: SsmsSheetTextFields(
      builder: (context, fullName, email, phone) {
        return StatefulBuilder(
          builder: (context, setState) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SsmsSheetHeader(
              title: 'Add student',
              subtitle:
                  'Students are always added to the selected group and supervisor.',
            ),
            _groupContextBanner(
              groupName: groupName,
              supervisorName: supervisorName,
            ),
            const SizedBox(height: 20),
            Text('ASSIGN EXISTING', style: SsmsType.kicker),
            const SizedBox(height: 8),
            if (controller.unassignedStudents.isEmpty)
              Text('No unassigned students available.', style: SsmsType.meta)
            else
              DropdownButtonFormField<String>(
                isExpanded: true,
                initialValue:
                    selectedStudentId?.isEmpty == true ? null : selectedStudentId,
                decoration: const InputDecoration(hintText: 'Select student'),
                items: [
                  for (final item in controller.unassignedStudents)
                    DropdownMenuItem(
                      value: field(item, const ['_id', 'id']),
                      child: Text(
                        '${field(item, const ['fullName', 'name'], fallback: 'Student')} · ${field(item, const ['email'])}',
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                ],
                onChanged: (value) => setState(() => selectedStudentId = value),
              ),
            const SizedBox(height: 12),
            Obx(() {
              final busy = controller.actionLoading.value;
              return FilledButton(
                onPressed: busy || selectedStudentId == null
                    ? null
                    : () async {
                        final student = controller.unassignedStudents.firstWhere(
                          (item) =>
                              field(item, const ['_id', 'id']) ==
                              selectedStudentId,
                        );
                        final studentName = field(
                          student,
                          const ['fullName', 'name'],
                          fallback: 'Student',
                        );
                        final confirmed = await showAdminConfirmDialog(
                          context: context,
                          title: 'Add student',
                          message:
                              'Add $studentName to $groupName under $supervisorName?',
                        );
                        if (!confirmed || !context.mounted) return;
                        final ok = await controller.assignExistingStudent(
                          groupId: groupId,
                          supervisorId: supervisorId,
                          studentId: selectedStudentId!,
                          studentName: studentName,
                          groupName: groupName,
                          supervisorName: supervisorName,
                        );
                        if (ok && context.mounted) {
                          closeSsmsSheet(context);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('$studentName added.'),
                              backgroundColor: SsmsColors.navy,
                            ),
                          );
                        }
                      },
                child: Text(busy ? 'Adding' : 'Add selected'),
              );
            }),
            const SizedBox(height: 24),
            const ColoredBox(
              color: SsmsColors.line,
              child: SizedBox(height: 1, width: double.infinity),
            ),
            const SizedBox(height: 20),
            Text('CREATE NEW', style: SsmsType.kicker),
            const SizedBox(height: 12),
            Text('FULL NAME', style: SsmsType.kicker),
            TextField(controller: fullName),
            const SizedBox(height: 12),
            Text('EMAIL', style: SsmsType.kicker),
            TextField(
              controller: email,
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 12),
            Text('PHONE', style: SsmsType.kicker),
            TextField(
              controller: phone,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(hintText: 'Optional'),
            ),
            const SizedBox(height: 18),
            _actionMessages(controller),
            Obx(() {
              final busy = controller.actionLoading.value;
              return SsmsSheetActions(
                busy: busy,
                submitLabel: 'Create student',
                onSubmit: busy
                    ? null
                    : () async {
                        final confirmed = await showAdminConfirmDialog(
                          context: context,
                          title: 'Create student',
                          message:
                              'Create ${fullName.text.trim()} in $groupName under $supervisorName?',
                        );
                        if (!confirmed || !context.mounted) return;
                        final ok = await controller.createStudent(
                          groupId: groupId,
                          supervisorId: supervisorId,
                          fullName: fullName.text,
                          email: email.text,
                          phone: phone.text,
                        );
                        if (ok && context.mounted) {
                          closeSsmsSheet(context);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Student created.'),
                              backgroundColor: SsmsColors.navy,
                            ),
                          );
                        }
                      },
              );
            }),
          ],
        );
          },
        );
      },
    ),
  );
}

Future<void> showImportStudentsSheet(
  BuildContext context, {
  required String groupId,
  required String groupName,
  required String supervisorId,
  required String supervisorName,
}) async {
  final controller = Get.find<AdminController>();
  controller.clearMessages();
  await showSsmsSheet(
    context: context,
    onClose: controller.clearMessages,
    child: _ImportStudentsForm(
      groupId: groupId,
      groupName: groupName,
      supervisorId: supervisorId,
      supervisorName: supervisorName,
    ),
  );
}

class _ImportStudentsForm extends StatefulWidget {
  const _ImportStudentsForm({
    required this.groupId,
    required this.groupName,
    required this.supervisorId,
    required this.supervisorName,
  });

  final String groupId;
  final String groupName;
  final String supervisorId;
  final String supervisorName;

  @override
  State<_ImportStudentsForm> createState() => _ImportStudentsFormState();
}

class _ImportStudentsFormState extends State<_ImportStudentsForm> {
  final controller = Get.find<AdminController>();
  String? fileName;
  List<StudentImportRow> preview = [];
  List<String> parseErrors = [];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SsmsSheetHeader(
          title: 'Import students',
          subtitle:
              'Upload a CSV or Excel file with fullName and email columns. Rows are validated and checked for duplicates before import.',
        ),
        _groupContextBanner(
          groupName: widget.groupName,
          supervisorName: widget.supervisorName,
        ),
        const SizedBox(height: 20),
        OutlinedButton.icon(
          onPressed: () async {
            final result = await FilePicker.platform.pickFiles(
              type: FileType.custom,
              allowedExtensions: const ['csv', 'xlsx', 'xls'],
              withData: true,
            );
            if (result == null || result.files.isEmpty) return;
            final file = result.files.single;
            final bytes = file.bytes;
            if (bytes == null) return;
            final parsed = parseStudentSpreadsheet(
              bytes: bytes,
              filename: file.name,
            );
            setState(() {
              fileName = file.name;
              preview = parsed.rows;
              parseErrors = parsed.errors;
            });
          },
          icon: const Icon(Icons.upload_file, size: 18),
          label: Text(fileName ?? 'Choose CSV / Excel file'),
        ),
        if (parseErrors.isNotEmpty) ...[
          const SizedBox(height: 14),
          SsmsErrorNote(parseErrors.take(6).join('\n')),
        ],
        if (preview.isNotEmpty) ...[
          const SizedBox(height: 16),
          Text('PREVIEW · ${preview.length} rows', style: SsmsType.kicker),
          const SizedBox(height: 8),
          for (final row in preview.take(5))
            Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Text(
                '${row.fullName} · ${row.email}',
                style: SsmsType.meta,
              ),
            ),
          if (preview.length > 5)
            Text('+ ${preview.length - 5} more rows', style: SsmsType.meta),
        ],
        const SizedBox(height: 18),
        _actionMessages(controller),
        Obx(() {
          final busy = controller.actionLoading.value;
          return SsmsSheetActions(
            busy: busy,
            submitLabel: 'Import students',
            onSubmit: busy || preview.isEmpty
                ? null
                : () async {
                    final confirmed = await showAdminConfirmDialog(
                      context: context,
                      title: 'Import students',
                      message:
                          'Import ${preview.length} students into ${widget.groupName} under ${widget.supervisorName}?',
                    );
                    if (!confirmed || !context.mounted) return;
                    final outcome = await controller.importStudents(
                      groupId: widget.groupId,
                      groupName: widget.groupName,
                      supervisorId: widget.supervisorId,
                      supervisorName: widget.supervisorName,
                      rows: preview,
                    );
                    if (!context.mounted || outcome == null) return;
                    closeSsmsSheet(context);
                    final detail = outcome.messages.take(3).join('\n');
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          '${outcome.created} created, ${outcome.skipped} skipped, ${outcome.failed} failed.'
                          '${detail.isEmpty ? '' : '\n$detail'}',
                        ),
                        backgroundColor: SsmsColors.navy,
                        duration: const Duration(seconds: 5),
                      ),
                    );
                  },
          );
        }),
      ],
    );
  }
}
