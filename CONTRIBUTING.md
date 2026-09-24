# Team Workflow

## Branches
- `main` — always working. **Nobody pushes directly to `main`.**
- `dev` — integration branch. Feature branches merge here first.
- Feature branches — one per task:
  ```
  feature/backend-reports-api
  feature/frontend-head-form
  fix/login-redirect
  ```

## Daily flow
```bash
git checkout dev
git pull origin dev                 # get teammates' latest work
git checkout -b feature/my-task     # new branch for your task
# ...work...
git add .
git commit -m "feat(reports): add submit endpoint"
git push -u origin feature/my-task
```
Then open a **Pull Request into `dev`** on GitHub and ask one teammate to review.
When `dev` is stable, merge `dev` → `main`.

## Commit messages
```
feat(area): add something new
fix(area): fix a bug
docs: update README
refactor(area): change code without changing behaviour
```

## Rules
1. Never commit `.env` files or Firebase service account keys.
2. Pull `dev` before starting new work each day.
3. Keep PRs small — one feature per PR.
4. If you change an API endpoint, update `docs/API.md` in the same PR.
5. Only titles are shown in the UI (no personal names). Money always uses `$`.
6. All business rules (one report per day, same-day edit, role checks) live in the **backend**. The frontend only displays.
