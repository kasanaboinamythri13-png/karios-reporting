# API Reference

Base URL (local): `http://localhost:4000/api`

All endpoints except `/health` need the header:
```
Authorization: Bearer <Firebase ID token>
```

Errors always look like:
```json
{ "error": { "code": "FORBIDDEN", "message": "..." } }
```

| Status | Owner | Method | Endpoint | Role | Description |
|---|---|---|---|---|---|
| ✅ | — | GET | `/health` | public | Server health check |
| ⬜ | Member 1 | GET | `/me` | any | Current user: role, department, title |
| ⬜ | Member 1 | GET | `/reports/today` | HEAD | Today's (IST) report or `null` |
| ⬜ | Member 1 | POST | `/reports` | HEAD | Submit today's report (409 if already submitted) |
| ⬜ | Member 1 | PATCH | `/reports/:id` | HEAD | Edit own report, same IST day only, not if approved |
| ⬜ | Member 1 | GET | `/reports` | HEAD / CEO | HEAD: own reports. CEO: all, with filters `department`, `status`, `from`, `to` |
| ⬜ | Member 1 | GET | `/reports/:id` | owner / CEO | Report detail |
| ⬜ | Member 3 | POST | `/reports/:id/review` | CEO | `{ status: "APPROVED" \| "REJECTED", comment }` |
| ⬜ | Member 3 | GET | `/dashboard/overview?date=` | CEO | Submitted / missing / blockers / metrics |
| ⬜ | Member 2 | POST | `/attachments/upload-url` | HEAD | Signed upload URL (checks type + size) |
| ⬜ | Member 2 | GET | `/attachments/:id/url` | owner / CEO | Short-lived signed download URL |
| ⬜ | Member 2 | GET | `/notifications` | any | Own notifications |
| ⬜ | Member 2 | PATCH | `/notifications/:id/read` | any | Mark as read |

Update the ⬜ to ✅ in your PR when an endpoint is done.
