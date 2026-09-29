// ============================================================
// Karios Backend — Reports Controller
// Handles incoming requests for report CRUD and review workflows
// ============================================================
import * as reportsService from './reports.service.js';

// GET /api/reports/today → today's (IST) report for the logged-in head, or null
export async function getToday(req, res, next) {
  try {
    const report = await reportsService.getTodayReport(req.user);
    res.json(report);
  } catch (err) {
    next(err);
  }
}

// POST /api/reports → submit today's report
export async function submit(req, res, next) {
  try {
    const report = await reportsService.submitDailyReport(req.user, req.body);
    res.status(201).json({ message: 'Report submitted successfully', report });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/reports/:id → edit own report
export async function update(req, res, next) {
  try {
    const report = await reportsService.updateDailyReport(req.params.id, req.user, req.body);
    res.json({ message: 'Report updated successfully', report });
  } catch (err) {
    next(err);
  }
}

// GET /api/reports → HEAD: own reports only. CEO: all, filters ?department=&status=&from=&to=
export async function list(req, res, next) {
  try {
    const result = await reportsService.listReports(req.user, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// GET /api/reports/:id → owner or CEO only (404 / 403 for anyone else)
export async function getById(req, res, next) {
  try {
    const report = await reportsService.getReportById(req.params.id, req.user);
    res.json(report);
  } catch (err) {
    next(err);
  }
}

// POST /api/reports/:id/review → CEO only. Body: { status: 'APPROVED' | 'REJECTED', comment? }
export async function review(req, res, next) {
  try {
    const report = await reportsService.reviewReport(req.params.id, req.user, req.body);
    res.json({ message: `Report ${report.status.toLowerCase()} successfully`, report });
  } catch (err) {
    next(err);
  }
}
