import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import { NotImplemented } from '../../utils/errors.js';

// Owner: Member 3
const router = Router();

router.use(authenticate, requireRole('CEO'));

// GET /api/dashboard/overview?date=YYYY-MM-DD (default: today IST)
// Returns: { date, departments: [{ department, title, status: 'SUBMITTED'|'MISSING', reportId }],
//            blockers: [...], metrics: { revenueClosed, marketingSpend, leads, collections, ... } }
router.get('/overview', async (req, res) => {
  throw NotImplemented();
});

export default router;
