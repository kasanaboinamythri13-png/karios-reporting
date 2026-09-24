import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import { NotImplemented } from '../../utils/errors.js';

// Owner: Member 2
// Rules: JPG / PNG / PDF only, max 10 MB each, max 5 per report.
// Files live in a PRIVATE bucket — only short-lived signed URLs are ever given out.
const router = Router();

router.use(authenticate);

// POST /api/attachments/upload-url  Body: { fileName, mimeType, sizeBytes } → { attachmentId, uploadUrl }
router.post('/upload-url', requireRole('HEAD'), async (req, res) => {
  throw NotImplemented();
});

// GET /api/attachments/:id/url → { url } (valid ~5 min). Owner of the report or CEO only.
router.get('/:id/url', requireRole('HEAD', 'CEO'), async (req, res) => {
  throw NotImplemented();
});

export default router;
