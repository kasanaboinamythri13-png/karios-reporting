# API Reference

Base URL (local): `http://localhost:4000/api`

All endpoints except `/health` need the header:
```
Authorization: Bearer <Firebase ID token>
```
For local development (only when `ALLOW_DEV_TOKENS=true` in `backend/.env`) you can use
`Bearer dev-developer`, `dev-sales`, `dev-marketing`, `dev-finance` or `dev-ceo` instead.

Errors always look like:
```json
{ "error": { "code": "FORBIDDEN", "message": "..." } }
```

| Status | Owner | Method | Endpoint | Role | Description |
|---|---|---|---|---|---|
| ✅ | — | GET | `/health` | public | Server health check |
| ✅ | Member 1 | GET | `/me` | any | Current user: role, department, title |
| ✅ | Member 1 | GET | `/reports/form-schema` | HEAD | Form fields for the head's department |
| ✅ | Member 1 | GET | `/reports/today` | HEAD | Today's (IST) report or `null`, plus `canEdit` |
| ✅ | Member 1 | POST | `/reports` | HEAD | Submit today's report (409 if already submitted) |
| ✅ | Member 1 | PATCH | `/reports/:id` | HEAD | Edit own report, same IST day only, not if approved |
| ✅ | Member 1 | GET | `/reports` | HEAD / CEO | HEAD: own reports. CEO: all, with filters `department`, `status`, `from`, `to` |
| ✅ | Member 1 | GET | `/reports/:id` | owner / CEO | Report detail |
| ✅ | Member 3 | POST | `/reports/:id/review` | CEO | `{ status: "APPROVED" \| "REJECTED", comment }` |
| ✅ | Member 3 | GET | `/dashboard/overview?date=` | CEO | Submitted / missing / blockers / metrics |
| ✅ | Member 2 | POST | `/attachments` | HEAD | Upload a file (raw body; checks type, size + real content) |
| ✅ | Member 2 | GET | `/attachments/:id/file` | owner / CEO | The file itself |
| ✅ | Member 2 | GET | `/notifications` | any | Own notifications |
| ✅ | Member 2 | PATCH | `/notifications/:id/read` | any | Mark as read |
| ✅ | Member 2 | PATCH | `/notifications/read-all` | any | Mark all own notifications as read |

Update the ⬜ to ✅ in your PR when an endpoint is done.

---

## Department Heads — details

Departments: `DEVELOPMENT`, `SALES`, `MARKETING`, `FINANCE`. Head roles: `DEVELOPER_HEAD`, `SALES_HEAD`, `MARKETING_HEAD`, `FINANCE_HEAD`.
Dates are `YYYY-MM-DD` in **Asia/Kolkata**. Money fields are plain numbers (the website adds `$`).

### GET `/reports/form-schema`
```json
{
  "department": "SALES",
  "fields": [
    { "key": "newLeads", "label": "New leads", "type": "number", "required": true, "column": "leads" },
    { "key": "revenueClosed", "label": "Revenue closed", "type": "currency", "column": "revenue_closed" }
  ]
}
```
Field types: `text`, `textarea` (max 2000 chars), `number` (whole, ≥ 0), `currency` (≥ 0, max 2 decimals).
Send numbers as JSON numbers (`5`, not `"5"`).

### GET `/reports/today`
```json
{ "date": "2026-09-24", "report": null, "canEdit": false }
```
When submitted, `report` is the full report (same shape as `GET /reports/:id`) and `canEdit` is `true` unless it is approved.

### POST `/reports`
```json
{
  "data": { "newLeads": 12, "revenueClosed": 14500, "blockers": "Waiting for pricing approval" },
  "attachmentIds": ["<attachmentId from POST /attachments>"]
}
```
| Response | When |
|---|---|
| `201` + full report | Saved |
| `400` | Form data invalid (message lists every problem) or bad `attachmentIds` |
| `409` | Already submitted today |

The department and date are taken from the server — never send them.

### PATCH `/reports/:id`
Same body as POST. Send the **complete** form and, if used, the **complete** list of `attachmentIds`
(files left out are removed from the report).

| Response | When |
|---|---|
| `200` + full report | Saved. A `REJECTED` report goes back to `SUBMITTED` and its review is cleared |
| `400` | Form data invalid |
| `403` | Not today's report, or already `APPROVED` |
| `404` | Not your report / doesn't exist |

### GET `/reports?page=1&limit=20&status=&from=&to=`
Heads always get only their own reports.
```json
{ "data": [ { "id": "...", "report_date": "2026-09-24", "status": "SUBMITTED", "review_comment": null, "attachments": [] } ],
  "pagination": { "total": 1, "page": 1, "limit": 20, "totalPages": 1 } }
```
`limit` max 100. Bad `status` / dates → `400`.

### GET `/reports/:id`
Full report including `data`, `status`, `review_comment`, `reviewed_at`, `reviewer_title`, `attachments`.
Another head's report → `404`.

### Attachments (stored in the database)
1. `POST /attachments` with the **file as the raw body** and headers
   `Content-Type: application/pdf` (the file's type) and `X-File-Name: <URI-encoded file name>`
   → `201 { attachmentId, fileName, mimeType, sizeBytes }`
2. Include `attachmentId` in `attachmentIds` when submitting / editing the report.
   Uploads not added to a report within 24 hours are deleted.

Rules: JPG / PNG / PDF only, extension must match the type, the content must really be that type,
≤ 4 MB (`413` if bigger), ≤ 5 per report.
`GET /attachments/:id/file` → the file (`Content-Type` = its type). The report's head and the CEO only;
anyone else → `404`.

### Notifications
`GET /notifications` → `{ notifications: [...], unreadCount }` (newest 50).
Types a head receives: `REPORT_REVIEW` (CEO approved / rejected), `REMINDER` (6 PM IST, report still missing).

---

## Database scripts (backend folder)
| Command | What it does |
|---|---|
| `npm run db:migrate` | Creates missing tables / columns and the 5 accounts. Safe — never deletes data. |
| `npm run db:reset` | **Deletes everything**, recreates tables, adds sample reports. Your own dev database only. |
| `npm run reminder:run` | Sends today's reminders now (instead of waiting for 6 PM). |
