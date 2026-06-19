# Branch Strategy (v0)

- Base branch: `staging`.
- Before creating a branch, ensure local context is clean and current.
- Branch naming:
  - `feature/<area>-<short-slug>`
  - `bugfix/<area>-<short-slug>`
  - `chore/<area>-<short-slug>`
- Prefer one branch per unit of work.
- Avoid direct commits to `staging` unless explicitly intended.
- Never rewrite shared history.