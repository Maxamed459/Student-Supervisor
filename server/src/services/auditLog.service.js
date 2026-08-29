import AuditLog from '../models/AuditLog.js';

/**
 * Writes an entry to the audit log (FR-C3). Never throws — a logging failure
 * should never break the primary request flow.
 */
export const recordAudit = async ({ userId = null, action, entityType, entityId = null, metadata = {} }) => {
  try {
    await AuditLog.create({ userId, action, entityType, entityId, metadata });
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
};

export default recordAudit;
