// ============================================================
// Karios Backend — Notifications Routes
// ============================================================
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { query } from '../../config/db.js';
import { NotFound } from '../../utils/errors.js';

const router = Router();

router.use(authenticate);

// GET /api/notifications → own notifications, newest first
router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, type, title, body, report_id, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50;`,
      [req.user.id]
    );

    const unreadCountRes = await query(
      `SELECT COUNT(*) AS count FROM notifications WHERE user_id = $1 AND is_read = false;`,
      [req.user.id]
    );

    res.json({
      notifications: result.rows,
      unreadCount: parseInt(unreadCountRes.rows[0]?.count || '0'),
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/:id/read → mark own notification as read
router.patch('/:id/read', async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = $1::uuid AND user_id = $2
       RETURNING *;`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      throw NotFound('Notification not found');
    }

    res.json({ message: 'Notification marked as read', notification: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
