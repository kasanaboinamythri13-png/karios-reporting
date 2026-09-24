import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import * as controller from './reports.controller.js';

const router = Router();

router.use(authenticate);

// Heads — Owner: Member 1
router.get('/today', requireRole('HEAD'), controller.getToday);
router.post('/', requireRole('HEAD'), controller.submit);
router.patch('/:id', requireRole('HEAD'), controller.update);

// Heads (own) + CEO (all) — Owner: Member 1
router.get('/', requireRole('HEAD', 'CEO'), controller.list);
router.get('/:id', requireRole('HEAD', 'CEO'), controller.getById);

// CEO review — Owner: Member 3
router.post('/:id/review', requireRole('CEO'), controller.review);

export default router;
