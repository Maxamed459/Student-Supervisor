import AuditLog from '../models/AuditLog.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/audit-logs — searchable activity log (FR-C3)
export const listAuditLogs = asyncHandler(async (req, res) => {
  const { search, userId, entityType, entityId, page = 1, limit = 30 } = req.query;
  const filter = {};

  if (userId) filter.userId = userId;
  if (entityType) filter.entityType = entityType;
  if (entityId) filter.entityId = entityId;
  if (search) {
    filter.$or = [
      { action: { $regex: search, $options: 'i' } },
      { entityType: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('userId', 'fullName email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    AuditLog.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, { logs, pagination: { total, page: Number(page), limit: Number(limit) } })
  );
});
