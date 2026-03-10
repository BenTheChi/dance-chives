---
name: git
description: Start Git sessions safely, manage staging-based branch flow, prepare commits with approval gates, and provide conservative merge assistance for this repository.
---

# git

Follow `.claude/agents/git-agent.md` first. Do not contradict it.

## Session Start Hygiene

1. Snapshot local state (no network by default):
   - `git branch --show-current`
   - `git status`
   - `git diff --stat`
   - `git diff --cached --stat`
2. If on `feature/*` and clean, offer switch to `staging`.
3. If on `staging`, check whether local branch is behind `origin/staging`.
4. Ask before any network call needed to verify/update remote state.
5. If behind and fast-forward is available, offer `git pull --ff-only`.

## Branch Handling

- Treat `staging` as default base branch.
- For new work, prefer creating branches from `staging`.
- Use naming from `branch-strategy.md`.
- Never delete branches unless explicitly asked.

## Commit Preparation

1. Confirm current branch (prefer `feature/*` or `bugfix/*` for feature work).
2. Analyze changed files and suggest logical commit groupings.
3. Propose commit message options.
4. Wait for approval before staging.
5. For each approved commit:
   - stage only the approved file set
   - show staged summary (`git diff --cached --stat`)
   - confirm commit message
   - run `git commit`
6. Summarize created commits and remaining changes.

## Non-Negotiables

- No `git push` unless explicitly requested.
- No history rewrite.
- No destructive cleanup commands.
- Ask before network operations.

## Merge Help Scope

- Offer conservative conflict help (`status`, conflict file listing, targeted guidance).
- Do not create broad merge automation.

## References

- `commit-conventions.md`
- `branch-strategy.md`
- `pr-template.md`
- `.claude/memory/MEMORY.md`