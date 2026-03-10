# Repo AI Rules (Git)

## Safety

- Never use `reset --hard`, `clean -fd`, force-push, or rewrite history.
- Always ask before any network operation (fetch/pull) unless I explicitly allow it.

## Branch workflow

- Default base branch is `staging`.
- If I’m on a `feature/*` branch and the working tree is clean, offer to switch to `staging`.
- If I’m on `staging` and behind `origin/staging`, offer `git pull --ff-only` (fast-forward only).

## Commit workflow

- When I ask to commit, first show: `git status`
- Do not stage or commit until I approve.

## Playbook prompts

### Start session

Snapshot repo state. If on feature/\* and clean, offer to switch to staging. If on staging and behind origin/staging, offer git pull --ff-only.

### Prepare commit

Snapshot status + diffs. Write a commit message and run git push. If there are many changes and some seem unrelated, group the changes into different commits according to the feature.
