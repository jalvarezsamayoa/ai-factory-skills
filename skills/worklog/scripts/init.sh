#!/usr/bin/env bash
set -euo pipefail

# Deterministic worklog initialization for @jalvarezsamayoa/factory.
# Usage: bash init.sh [--force]

FORCE=0

while [ $# -gt 0 ]; do
  case "$1" in
    --force|-f)
      FORCE=1
      shift
      ;;
    --help|-h)
      echo "Usage: bash init.sh [--force]"
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [ ! -f "worklog.org" ] || [ "$FORCE" -eq 1 ]; then
  cat >"worklog.org" <<'EOF'
#+TITLE: Workspace Worklog - Mission Control
#+AUTHOR: Team & AI Agent Harness
#+STARTUP: overview
#+TODO: TODO(t) IN-PROGRESS(i) WAITING(w) BLOCKED(b) | DONE(d) CANCELLED(c)

# MISSION CONTROL RULES (see AGENTS.md and the worklog skill for full protocol):
# 1. Claim before start: state IN-PROGRESS, fill PROPERTIES (TICKET, WORKTREE, BRANCH, OWNER, SESSION).
# 2. Read-back verification: re-read after write; back off if claimed concurrently.
# 3. Transitions only: update state and append one timestamped log line under *** Log.
# 4. Mandatory NEXT line: keep current on every active item (IN-PROGRESS, WAITING, BLOCKED).
# 5. Confined writes: edit only your item subtree; never rewrite other headings or repos.
# 6. DONE checklist: PR/MR merged, release tag fetched (if applicable), worktree pruned before DONE.

* Queue
# Unclaimed backlog items and tickets queued for work.
EOF
  echo "Wrote worklog.org"
else
  echo "Skipped existing worklog.org"
fi

mkdir -p "docs/backlog"
if [ ! -f "docs/backlog/README.md" ] || [ "$FORCE" -eq 1 ]; then
  cat >"docs/backlog/README.md" <<'EOF'
# Topic Backlogs & Roadmaps (`docs/backlog/`)

This directory stores durable, version-controlled Org-mode (`.org`) backlogs, roadmaps, and story breakdowns organized by topic.

---

## Separation of Responsibilities

| Tracker | Location | Version Control | Role | Lifetime |
| --- | --- | --- | --- | --- |
| **`worklog.org`** | Workspace Root | **Uncommitted** (outside git or gitignored) | **Operational Radar:** Real-time state of active sessions, worktrees, branches, PR/MR numbers, blockers, and `NEXT:` actions. | Ephemeral. Cleared or archived as tasks finish. |
| **`docs/backlog/<topic>/*.org`** | `docs/backlog/` | **Tracked** (in docs or repo git history) | **Durable Backlog & Roadmaps:** Multi-story feature plans, acceptance criteria, milestone checklists, and issue links. | Durable. Preserved in git history. |

---

## Directory Organization

```text
docs/backlog/
├── README.md
└── <topic>/
    └── <roadmap>.org
```

---

## Guardrails for AI Agents

1. **No rapid session ticks here:** Keep minute-by-minute session state and log entries in `worklog.org`, not in `docs/backlog/`.
2. **Durable updates only:** Update `docs/backlog/` files when scope changes, issue keys are created or linked, or milestone checkboxes are checked off (`[X]`).
3. **Commit policy:** All changes to `docs/backlog/` require explicit user consent before committing.
EOF
  echo "Wrote docs/backlog/README.md"
else
  echo "Skipped existing docs/backlog/README.md"
fi

TARGET_FILE="AGENTS.md"
if [ ! -f "AGENTS.md" ] && [ -f "CLAUDE.md" ]; then
  TARGET_FILE="CLAUDE.md"
fi

if [ ! -f "$TARGET_FILE" ] || ! grep -q '^## Worklog Protocol' "$TARGET_FILE"; then
  cat >>"$TARGET_FILE" <<'EOF'

## Worklog Protocol (Mission Control)

All agents and sessions working in this workspace must maintain `worklog.org` at the workspace root as the live coordination tracker. It supplements (and never replaces) your issue tracker and git workflow. Load the `worklog` skill for full templates, standup/todo reporting, and issue synchronization workflows.

1. **Session start standup pass:** Scan `worklog.org` for stale `IN-PROGRESS` or `WAITING` items before claiming new work.
2. **Claim before start:** Move or insert the task under its repo section (`* <repo>`), set state to `IN-PROGRESS`, and populate `:PROPERTIES:` (`:TICKET:`, `:WORKTREE:`, `:BRANCH:`, `:PR:`/`:MR:`, `:OWNER:`, `:SESSION:`). Read your harness session ID safely without dumping `env`/`printenv`, or use `<harness>-<YYYYMMDD-HHMM>`.
3. **Read-back verification:** Re-read the heading immediately after writing; back off if `:OWNER:` or `:SESSION:` was overwritten concurrently.
4. **Mandatory `NEXT:` line & append-only log:** Keep a single `NEXT: <next action>` line on every active item (`IN-PROGRESS`, `WAITING`, `BLOCKED`). Update only on state transitions and append one timestamped entry under `*** Log`.
5. **Confined writes:** Edit only your item's subtree and target repo section; never reflow or reorder other headings.
6. **Worktree registry & `DONE` gate:** Mark `DONE` only after the PR/MR is merged, release tags are fetched (if applicable), and the git worktree is removed.
7. **Ephemeral vs. durable separation:** Never commit `worklog.org`. Keep durable multi-story roadmaps in `docs/backlog/<topic>/*.org` and link them via `:BACKLOG:`.
EOF
  echo "Updated $TARGET_FILE with Worklog Protocol."
else
  echo "$TARGET_FILE already contains ## Worklog Protocol."
fi

if [ -e ".git" ]; then
  if [ ! -f ".gitignore" ] || ! grep -qx 'worklog.org' ".gitignore"; then
    printf '\nworklog.org\n' >>".gitignore"
    echo "Added worklog.org to .gitignore."
  fi
fi
