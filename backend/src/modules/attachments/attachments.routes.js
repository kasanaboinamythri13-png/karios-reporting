import express, { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import * as attachmentsService from './attachments.service.js';

// Owner: Member 2
// Rules: JPG / PNG / PDF only, max 4 MB each, max 5 per report.
// Files are stored in the database and only sent to the report's owner or the CEO.
const router = Router();

router.use(authenticate);

// The file is the raw request body. Anything bigger than the limit is refused with 413.
const rawFile = express.raw({
  type: Object.keys(attachmentsService.ALLOWED_TYPES),
  limit: attachmentsService.MAX_FILE_BYTES,
});

// POST /api/attachments  Body: the file. Headers: Content-Type (file type), X-File-Name (URI-encoded name)
// → 201 { attachmentId, fileName, mimeType, sizeBytes }
router.post('/', requireRole('HEAD'), rawFile, async (req, res) => {
  const result = await attachmentsService.saveUpload(req.user, {
    rawFileName: req.get('X-File-Name'),
    mimeType: req.get('Content-Type')?.split(';')[0].trim(),
    content: req.body,
  });
  res.status(201).json(result);
});

// GET /api/attachments/:id/file → the file itself (shown inline). Owner of the report or CEO only.
router.get('/:id/file', requireRole('HEAD', 'CEO'), async (req, res) => {
  const { fileName, mimeType, content } = await attachmentsService.getFile(req.user, req.params.id);
  res.set({
    'Content-Type': mimeType,
    'Content-Disposition': `inline; filename="${fileName}"`,
    'Cache-Control': 'private, no-store',
  });
  res.send(content);
});

export default router;
