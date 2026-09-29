import { NotImplemented } from '../../utils/errors.js';

// Controllers read the request and send the response.
// Business rules go in reports.service.js.

// GET /api/reports/today → today's (IST) report for the logged-in head, or null
export async function getToday(req, res) {
  throw NotImplemented();
}

// POST /api/reports → submit today's report
// Rules: one per user per IST day (409 if exists); validate fields for the head's department
export async function submit(req, res) {
  throw NotImplemented();
}

// PATCH /api/reports/:id → edit own report
// Rules: owner only; reportDate must be today (IST); not allowed if APPROVED (403);
//        if it was REJECTED, status goes back to SUBMITTED
export async function update(req, res) {
  throw NotImplemented();
}

// GET /api/reports → HEAD: own reports only. CEO: all, filters ?department=&status=&from=&to=
export async function list(req, res) {
  throw NotImplemented();
}

// GET /api/reports/:id → owner or CEO only (404 for anyone else)
export async function getById(req, res) {
  throw NotImplemented();
}

// POST /api/reports/:id/review → CEO only. Body: { status: 'APPROVED' | 'REJECTED', comment? }
// Must create a notification for the head.
export async function review(req, res) {
  throw NotImplemented();
}
