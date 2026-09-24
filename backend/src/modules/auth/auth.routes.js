import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';

// Owner: Member 1
const router = Router();

// GET /api/me → { id, role, department, title }
router.get('/me', authenticate, (req, res) => {
  res.json(req.user);
});

export default router;
