import Settings from '../models/Settings.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { recordAudit } from '../services/auditLog.service.js';

const getOrCreateSettings = async () => {
  let settings = await Settings.findOne({ key: 'global' });
  if (!settings) settings = await Settings.create({ key: 'global' });
  return settings;
};

// GET /api/settings
export const getSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings();
  res.status(200).json(new ApiResponse(200, { settings }));
});

// PATCH /api/settings — Admin defines academic terms, categories, templates (FR-A7)
export const updateSettings = asyncHandler(async (req, res) => {
  const { academicTerms, submissionCategories, chapterTemplates } = req.body;
  const settings = await getOrCreateSettings();

  if (academicTerms !== undefined) settings.academicTerms = academicTerms;
  if (submissionCategories !== undefined) settings.submissionCategories = submissionCategories;
  if (chapterTemplates !== undefined) settings.chapterTemplates = chapterTemplates;
  settings.updatedBy = req.user._id;

  await settings.save();

  await recordAudit({
    userId: req.user._id,
    action: 'settings.update',
    entityType: 'Settings',
    entityId: settings._id,
  });

  res.status(200).json(new ApiResponse(200, { settings }, 'Settings updated'));
});
