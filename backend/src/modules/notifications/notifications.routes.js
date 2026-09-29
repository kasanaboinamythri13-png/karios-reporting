import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { NotImplemented } from '../../utils/errors.js';

// Owner: Member 2
const router = Router();

router.use(authenticate);

// GET /api/notifications → own notifications, newest first
router.get('/', async (req, res) => {
  throw NotImplemented();
});

// PATCH /api/notifications/:id/read → mark own notification as read
router.patch('/:id/read', async (req, res) => {
  throw NotImplemented();
});

export default router;
