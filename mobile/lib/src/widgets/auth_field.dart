import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import 'ssms_chrome.dart';

/// Web `Field` component — label + themed input.
class AuthField extends StatelessWidget {
  const AuthField({
    super.key,
    required this.label,
    required this.controller,
    this.focusNode,
    this.obscure = false,
    this.keyboardType,
    this.autofillHints,
    this.textInputAction,
    this.onSubmitted,
    this.suffix,
    this.hint,
    this.error,
    this.prefixIcon,
  });

  final String label;
  final TextEditingController controller;
  final FocusNode? focusNode;
  final bool obscure;
  final TextInputType? keyboardType;
  final Iterable<String>? autofillHints;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onSubmitted;
  final Widget? suffix;
  final String? hint;
  final String? error;
  final IconData? prefixIcon;

  @override
  Widget build(BuildContext context) {
    return SsmsField(
      label: label,
      error: error,
      child: TextField(
        controller: controller,
        focusNode: focusNode,
        obscureText: obscure,
        keyboardType: keyboardType,
        autofillHints: autofillHints,
        textInputAction: textInputAction,
        onSubmitted: onSubmitted,
        style: SsmsType.label.copyWith(fontSize: 14, fontWeight: FontWeight.w600),
        decoration: InputDecoration(
          hintText: hint,
          prefixIcon: prefixIcon == null
              ? null
              : Icon(prefixIcon, size: 16, color: SsmsColors.inputIcon),
          suffixIcon: suffix,
        ),
      ),
    );
  }
}
