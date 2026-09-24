import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import { getExecutiveOverview } from './dashboard.service.js';

// Owner: Member 3
const router = Router();

router.use(authenticate, requireRole('CEO'));

// GET /api/dashboard/overview?date=YYYY-MM-DD (default: today IST)
// Returns: { date, departments: [{ department, title, status: 'SUBMITTED'|'MISSING', reportId }],
//            blockers: [...], metrics: { revenueClosed, marketingSpend, leads, collections, ... } }
router.get('/overview', async (req, res, next) => {
  try {
    const { date } = req.query;
    const overview = await getExecutiveOverview(date);
    res.json(overview);
  } catch (error) {
    next(error);
  }
});

export default router;
