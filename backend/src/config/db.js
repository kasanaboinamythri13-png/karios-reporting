// Database connection.
// Owner: Member 1
//
// TODO: the team picks the database, then set it up here and export the client.
// Tables / collections needed (see docs/WEB_REQUIREMENTS.md):
//   users          — firebaseUid, email, role (HEAD | CEO), department, title (no personal names)
//   reports        — userId, department, reportDate (IST "YYYY-MM-DD"), data, status,
//                    reviewedBy, reviewedAt, reviewComment
//                    UNIQUE (userId, reportDate)  ← one report per day
//   attachments    — reportId, storagePath, fileName, mimeType, sizeBytes
//   notifications  — userId, type, title, body, reportId, isRead
