import 'dart:convert';
import 'dart:typed_data';

import 'package:excel/excel.dart';

class StudentImportRow {
  StudentImportRow({
    required this.rowNumber,
    required this.fullName,
    required this.email,
    this.phone,
  });

  final int rowNumber;
  final String fullName;
  final String email;
  final String? phone;
}

class StudentImportParseResult {
  StudentImportParseResult({
    required this.rows,
    required this.errors,
  });

  final List<StudentImportRow> rows;
  final List<String> errors;

  bool get hasErrors => errors.isNotEmpty;
}

final _emailPattern = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');

String _normalizeHeader(String value) {
  return value.trim().toLowerCase().replaceAll(RegExp(r'[\s_-]+'), '');
}

int? _columnIndex(Map<String, int> headers, List<String> aliases) {
  for (final alias in aliases) {
    final index = headers[alias];
    if (index != null) return index;
  }
  return null;
}

StudentImportParseResult parseStudentSpreadsheet({
  required Uint8List bytes,
  required String filename,
}) {
  final lower = filename.toLowerCase();
  if (lower.endsWith('.csv')) {
    return _parseCsv(bytes);
  }
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
    return _parseExcel(bytes);
  }
  return StudentImportParseResult(
    rows: const [],
    errors: ['Unsupported file type. Use .csv or .xlsx.'],
  );
}

StudentImportParseResult _parseCsv(Uint8List bytes) {
  final text = utf8.decode(bytes, allowMalformed: true);
  final lines = const LineSplitter().convert(text);
  if (lines.isEmpty) {
    return StudentImportParseResult(
      rows: const [],
      errors: ['The file is empty.'],
    );
  }

  final delimiter = lines.first.contains(';') ? ';' : ',';
  final headers = _headerMap(_splitCsvLine(lines.first, delimiter));
  final nameIndex = _columnIndex(headers, const ['fullname', 'name', 'studentname']);
  final emailIndex = _columnIndex(headers, const ['email', 'emailaddress']);
  final phoneIndex = _columnIndex(headers, const ['phone', 'phonenumber', 'mobile']);

  if (nameIndex == null || emailIndex == null) {
    return StudentImportParseResult(
      rows: const [],
      errors: [
        'Missing required columns. Include fullName (or name) and email.',
      ],
    );
  }

  final rows = <StudentImportRow>[];
  final errors = <String>[];
  for (var i = 1; i < lines.length; i++) {
    final line = lines[i].trim();
    if (line.isEmpty) continue;
    final cells = _splitCsvLine(line, delimiter);
    final rowNumber = i + 1;
    final fullName = _cell(cells, nameIndex);
    final email = _cell(cells, emailIndex).toLowerCase();
    final phone = phoneIndex == null ? '' : _cell(cells, phoneIndex);
    if (fullName.isEmpty && email.isEmpty) continue;
    final rowErrors = _validateRow(
      rowNumber: rowNumber,
      fullName: fullName,
      email: email,
    );
    if (rowErrors.isNotEmpty) {
      errors.addAll(rowErrors);
      continue;
    }
    rows.add(
      StudentImportRow(
        rowNumber: rowNumber,
        fullName: fullName,
        email: email,
        phone: phone.isEmpty ? null : phone,
      ),
    );
  }

  if (rows.isEmpty && errors.isEmpty) {
    errors.add('No student rows found in the file.');
  }
  return StudentImportParseResult(rows: rows, errors: errors);
}

StudentImportParseResult _parseExcel(Uint8List bytes) {
  final excel = Excel.decodeBytes(bytes);
  if (excel.tables.isEmpty) {
    return StudentImportParseResult(
      rows: const [],
      errors: ['No worksheet found in the Excel file.'],
    );
  }

  final sheet = excel.tables.values.first;
  if (sheet.maxRows == 0) {
    return StudentImportParseResult(
      rows: const [],
      errors: ['The worksheet is empty.'],
    );
  }

  final headerRow = sheet.rows.first;
  final headers = <String, int>{};
  for (var i = 0; i < headerRow.length; i++) {
    final value = headerRow[i]?.value?.toString() ?? '';
    if (value.trim().isEmpty) continue;
    headers[_normalizeHeader(value)] = i;
  }

  final nameIndex = _columnIndex(headers, const ['fullname', 'name', 'studentname']);
  final emailIndex = _columnIndex(headers, const ['email', 'emailaddress']);
  final phoneIndex = _columnIndex(headers, const ['phone', 'phonenumber', 'mobile']);

  if (nameIndex == null || emailIndex == null) {
    return StudentImportParseResult(
      rows: const [],
      errors: [
        'Missing required columns. Include fullName (or name) and email.',
      ],
    );
  }

  final rows = <StudentImportRow>[];
  final errors = <String>[];
  for (var i = 1; i < sheet.rows.length; i++) {
    final row = sheet.rows[i];
    final rowNumber = i + 1;
    final fullName = _excelCell(row, nameIndex);
    final email = _excelCell(row, emailIndex).toLowerCase();
    final phone = phoneIndex == null ? '' : _excelCell(row, phoneIndex);
    if (fullName.isEmpty && email.isEmpty) continue;
    final rowErrors = _validateRow(
      rowNumber: rowNumber,
      fullName: fullName,
      email: email,
    );
    if (rowErrors.isNotEmpty) {
      errors.addAll(rowErrors);
      continue;
    }
    rows.add(
      StudentImportRow(
        rowNumber: rowNumber,
        fullName: fullName,
        email: email,
        phone: phone.isEmpty ? null : phone,
      ),
    );
  }

  if (rows.isEmpty && errors.isEmpty) {
    errors.add('No student rows found in the file.');
  }
  return StudentImportParseResult(rows: rows, errors: errors);
}

Map<String, int> _headerMap(List<String> cells) {
  final headers = <String, int>{};
  for (var i = 0; i < cells.length; i++) {
    final key = _normalizeHeader(cells[i]);
    if (key.isNotEmpty) headers[key] = i;
  }
  return headers;
}

List<String> _splitCsvLine(String line, String delimiter) {
  return line.split(delimiter).map((part) => part.trim()).toList();
}

String _cell(List<String> cells, int index) {
  if (index < 0 || index >= cells.length) return '';
  return cells[index].trim();
}

String _excelCell(List<Data?> row, int index) {
  if (index < 0 || index >= row.length) return '';
  return row[index]?.value?.toString().trim() ?? '';
}

List<String> _validateRow({
  required int rowNumber,
  required String fullName,
  required String email,
}) {
  final errors = <String>[];
  if (fullName.isEmpty) {
    errors.add('Row $rowNumber: full name is required.');
  }
  if (email.isEmpty) {
    errors.add('Row $rowNumber: email is required.');
  } else if (!_emailPattern.hasMatch(email)) {
    errors.add('Row $rowNumber: invalid email "$email".');
  }
  return errors;
}
