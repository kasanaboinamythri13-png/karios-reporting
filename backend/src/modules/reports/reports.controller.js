// ============================================================
// Karios Backend — Reports Controller
// ============================================================
import * as reportsService from './reports.service.js';
import { getTodayIST } from '../../utils/date.js';

export async function list(req, res, next) {
  try {
    const result = await reportsService.listReports(req.user, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const report = await reportsService.getReportById(req.params.id, req.user);
    res.json({ report });
  } catch (err) {
    next(err);
  }
}

export async function getToday(req, res, next) {
  try {
    const today = getTodayIST();
    const result = await reportsService.listReports(req.user, { from: today, to: today, limit: 1 });
    const report = result.data.length > 0 ? result.data[0] : null;
    res.json({ report, date: today });
  } catch (err) {
    next(err);
  }
}

export async function submit(req, res, next) {
  try {
    const report = await reportsService.submitDailyReport(req.user, req.body);
    res.status(201).json({ message: 'Report submitted successfully', report });
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const report = await reportsService.updateDailyReport(req.params.id, req.user, req.body);
    res.json({ message: 'Report updated successfully', report });
  } catch (err) {
    next(err);
  }
}

export async function review(req, res, next) {
  try {
    const report = await reportsService.reviewReport(req.params.id, req.user, req.body);
    res.json({ message: `Report ${report.status.toLowerCase()} successfully`, report });
  } catch (err) {
    next(err);
  }
}
