# Karios Reporting App

Internal daily reporting web app for department heads and the CEO.

- **Heads** (Developer, Sales, Marketing, Finance) submit one report per day.
- **CEO** sees who submitted, reviews reports, and approves / rejects them.

Full requirements: [docs/WEB_REQUIREMENTS.md](docs/WEB_REQUIREMENTS.md) · API: [docs/API.md](docs/API.md) · Team rules: [CONTRIBUTING.md](CONTRIBUTING.md)

## Tech stack
| Part | Tool |
|---|---|
| Frontend | React + Vite + React Router |
| Backend | Node.js + Express |
| Login | Firebase Authentication |
| Database | (PostgreSQL) |

## Folder structure
```
karios-reporting/
├── docs/                    # Requirements + API reference
├── backend/                 # Node.js + Express API  (port 4000)
│   ├── src/
│   │   ├── server.js        # Starts the server
│   │   ├── app.js           # Express setup + routes
│   │   ├── config/          # env, database, firebase
│   │   ├── middleware/      # authenticate, requireRole, errorHandler
│   │   ├── modules/         # One folder per feature
│   │   │   ├── auth/        # GET /me
│   │   │   ├── reports/     # submit, edit, list, detail, review + form fields
│   │   │   ├── dashboard/   # CEO overview
│   │   │   ├── attachments/ # file upload / download
│   │   │   └── notifications/
│   │   ├── jobs/            # daily reminder
│   │   └── utils/           # errors, IST date helper
│   └── tests/
└── frontend/                # React website  (port 5173)
    └── src/
        ├── main.jsx / App.jsx   # Routes
        ├── auth/            # Login state + role guard
        ├── api/             # Backend calls
        ├── components/      # Layout, StatusBadge
        ├── pages/
        │   ├── head/        # Home, Report form, History
        │   ├── ceo/         # Overview, All reports
        │   └── shared/      # Report detail, Notifications, Profile
        ├── utils/           # $ formatter, dates
        └── styles/
```

## Getting started

Requirements: **Node.js 20+** and **Git**.

```bash
git clone <repo-url>
cd karios-reporting

# Backend
cd backend
cp .env.example .env
npm install
npm run dev          # → http://localhost:4000/api/health
npm test

# Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev          # → http://localhost:5173
```

### Secrets (ask the project owner — never commit them)
`frontend/.env.example` already has everything the frontend needs. For `backend/.env`, get these three values
from the project owner through a private channel (not Git, not a public chat):

```
DATABASE_URL=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="..."
```

### Attachments (file uploads)
Files are stored **in the database** (`attachments.content`) — no Firebase Storage, no card, nothing to configure.
Everyone shares the same Neon database, so once `DATABASE_URL` is in `backend/.env`, uploads work locally.

Rules: JPG / PNG / PDF, max 4 MB each, max 5 per report. Uploads not added to a report within 24 hours are deleted.

**New database only** (already done on the shared one): `cd backend && npm run db:attachments`
— adds the attachment columns. Safe to run again; it changes nothing else.
Don't run `npm run db:migrate` / `db:reset` on the shared database — they add sample data / delete everything.

## Progress
- [x] Project structure
- [ ] Firebase project + 5 user accounts
- [ ] Login (Firebase)
- [ ] Head: submit / edit / history
- [ ] CEO: overview / all reports / approve-reject
- [ ] Attachments
- [ ] Notifications + daily reminder
- [ ] Live updates without page reload
- [ ] Deploy
