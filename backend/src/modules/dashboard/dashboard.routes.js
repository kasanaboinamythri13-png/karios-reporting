// ============================================================
// Karios Backend — CEO Dashboard Routes
// ============================================================
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import { getExecutiveOverview } from './dashboard.service.js';

const router = Router();

// Require authenticated CEO for all dashboard routes
router.use(authenticate, requireRole('CEO'));

// GET /api/dashboard/overview?date=YYYY-MM-DD
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
