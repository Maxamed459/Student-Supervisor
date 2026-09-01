export function formatDate(value) {
  if (!value) return 'Not set';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatRelativeTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = date.getTime() - Date.now();
  const absSec = Math.round(Math.abs(diffMs) / 1000);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  if (absSec < 60) return rtf.format(Math.round(diffMs / 1000), 'second');
  if (absSec < 3600) return rtf.format(Math.round(diffMs / 60000), 'minute');
  if (absSec < 86400) return rtf.format(Math.round(diffMs / 3600000), 'hour');
  if (absSec < 604800) return rtf.format(Math.round(diffMs / 86400000), 'day');
  return formatDate(value);
}

export function formatAuditAction(action) {
  if (!action) return 'Unknown';
  const normalized = String(action).toLowerCase();
  if (normalized.includes('create')) return 'Create';
  if (normalized.includes('update') || normalized.includes('edit')) return 'Update';
  if (normalized.includes('delete') || normalized.includes('remove')) return 'Delete';
  if (normalized.includes('approve')) return 'Review';
  if (normalized.includes('login')) return 'Login';
  if (normalized.includes('review') || normalized.includes('changes')) return 'Review';
  return action.split(/[._-]/).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

export function auditActionBadgeValue(action) {
  const label = formatAuditAction(action).toLowerCase();
  if (label.includes('create')) return 'published';
  if (label.includes('delete')) return 'changes-requested';
  if (label.includes('review')) return 'under-review';
  if (label.includes('login')) return 'submitted';
  return 'scheduled';
}

export function label(value) {
  if (!value) return 'Not assigned';
  if (typeof value === 'string') return value;
  return value.fullName || value.name || value.title || value.code || value.email || value._id || 'Linked record';
}

export function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] || 'unknown';
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

export function formatBytes(value) {
  if (!value) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / (1024 ** index)).toFixed(index ? 1 : 0)} ${units[index]}`;
}

export function getFileCategory(file) {
  const name = file?.originalFilename || file?.originalName || '';
  const format = file?.format?.toLowerCase() || name.split('.').pop().toLowerCase();
  const resourceType = file?.resourceType || '';

  if (format === 'pdf' || name.endsWith('.pdf')) {
    return 'pdf';
  }
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(format) || resourceType === 'image') {
    return 'image';
  }
  return 'raw';
}

