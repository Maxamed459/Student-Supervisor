import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

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

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: SsmsType.label.copyWith(fontSize: 15)),
        const SizedBox(height: 10),
        TextField(
          controller: controller,
          focusNode: focusNode,
          obscureText: obscure,
          keyboardType: keyboardType,
          autofillHints: autofillHints,
          textInputAction: textInputAction,
          onSubmitted: onSubmitted,
          cursorColor: SsmsColors.ink,
          style: SsmsType.label.copyWith(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
          decoration: InputDecoration(
            hintText: hint ?? label,
            suffixIcon: suffix,
          ),
        ),
      ],
    );
  }
}
