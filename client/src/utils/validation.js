const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value) {
  return EMAIL_RE.test(String(value || '').trim());
}

export function isNonEmpty(value) {
  return String(value ?? '').trim().length > 0;
}

export function validatePassword(value, { minLength = 8 } = {}) {
  const trimmed = String(value || '');
  if (trimmed.length < minLength) {
    return `Must be at least ${minLength} characters.`;
  }
  return '';
}

export function validateRequired(value, label = 'This field') {
  return isNonEmpty(value) ? '' : `${label} is required.`;
}

export function validateEmail(value) {
  if (!isNonEmpty(value)) return 'Email is required.';
  if (!isValidEmail(value)) return 'Enter a valid email address.';
  return '';
}

export function validateDateRange(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Enter a valid date.';
  return '';
}

export function hasValidationErrors(errors) {
  return Object.values(errors).some(Boolean);
}
