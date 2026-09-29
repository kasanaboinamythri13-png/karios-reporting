import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import * as attachmentsService from './attachments.service.js';

// Owner: Member 2
// Rules: JPG / PNG / PDF only, max 10 MB each, max 5 per report.
// Files live in a PRIVATE bucket — only short-lived signed URLs are ever given out.
const router = Router();

router.use(authenticate);

// POST /api/attachments/upload-url  Body: { fileName, mimeType, sizeBytes }
// → { attachmentId, uploadUrl, method: 'PUT', headers, expiresAt }
router.post('/upload-url', requireRole('HEAD'), async (req, res) => {
  const result = await attachmentsService.createUploadUrl(req.user, req.body);
  res.status(201).json(result);
});

// GET /api/attachments/:id/url → { url, fileName, expiresAt } (valid 5 min). Owner of the report or CEO only.
router.get('/:id/url', requireRole('HEAD', 'CEO'), async (req, res) => {
  const result = await attachmentsService.createDownloadUrl(req.user, req.params.id);
  res.json(result);
});

export default router;
