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

