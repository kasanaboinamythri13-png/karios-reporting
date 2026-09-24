# Karios Reporting App — Web Requirements

Internal daily reporting for department heads and the CEO. **Web application only.**

**Users (5 accounts):** Developer Head, Sales Head, Marketing Head, Finance Head, CEO.

## 1. Goal
Department heads submit one daily report on the website. The CEO reviews company-wide status and approves or rejects reports.

## 2. Platform
| Platform | Who uses it |
|---|---|
| Web application (desktop + mobile browser) | Heads + CEO |

The website has two areas:
- **Head area** — each head sees only their own reports.
- **CEO area (admin)** — CEO only.

## 3. Roles
| Role | Access |
|---|---|
| Developer / Sales / Marketing / Finance Head | Own department reports only; submit and same-day edit |
| CEO | All reports; company overview; approve / reject with comment; admin area |

Display titles only — **no personal names**: `Developer Head`, `Sales Head`, `Marketing Head`, `Finance Head`, `CEO`.

## 4. Core rules
1. One report per user per calendar day (timezone: **Asia/Kolkata**).
2. Heads can edit only on the same day.
3. Attachments: images and PDF (max 5 files, 10 MB each).
4. Currency in UI: **$**.
5. After submit or review, Home and Reports update **without a page reload**.
6. Heads cannot open the CEO admin area (blocked in the UI **and** by the server).

## 5. Features

### Heads
- Login (company email)
- Home: today's report status + "Submit report" button
- Department-specific daily form
- Report history
- Notifications (e.g. CEO reviewed your report)
- Profile (role / department only)
- Optional file attachments

### CEO
- Login
- Company overview: who submitted today, who is missing, blockers, key metrics
- All reports list + filters (department, status, date)
- Open report → Approve / Reject + optional comment
- Alert when a head submits
- Profile

### System
- Daily reminder to heads who have not submitted
- Auth via Firebase (email/password); users created in the database with role + department (no public sign-up)
- Private file storage for attachments

## 6. Report content
Each department has its own short form (tasks, leads, campaign metrics, expenses, etc.).
Every form includes a **Blockers** field (used by the CEO overview).

Statuses: `SUBMITTED → APPROVED / REJECTED` (drafts optional).

## 7. Tech stack
- Frontend: **React** (Vite)
- Backend: **Node.js + Express**
- Auth: **Firebase Authentication**
- Database: _to be decided by the team_ (see README)

## 8. Done when
- [ ] Four heads can each submit one report per day
- [ ] CEO sees all reports and an accurate "who's missing today"
- [ ] CEO can approve / reject with comment; head is notified
- [ ] Heads cannot access the CEO area
- [ ] Attachments work securely
- [ ] No personal names; currency is $
- [ ] API + website deployed and testable online
