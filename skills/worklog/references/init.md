# Worklog Manual Initialization

Reference procedure and canonical templates for initializing `worklog.org` and `docs/backlog/README.md` in any AI coding harness (OpenCode, Claude Code, Antigravity, or others).

## Procedure

1. Ask for explicit user consent before modifying any files. State that you will create `worklog.org`, create `docs/backlog/README.md`, add `## Worklog Protocol (Mission Control)` to the project's instructions file (`AGENTS.md`, or `CLAUDE.md` if used instead), and add `worklog.org` to `.gitignore` if the workspace root is inside a git repository.
2. If `worklog.org` does not exist at the workspace root, write it using the `worklog.org Template` below. Never overwrite an existing `worklog.org` unless the user explicitly requests a reset.
3. Create directory `docs/backlog/` if missing. If `docs/backlog/README.md` does not exist, write it using the `docs/backlog/README.md Template` below.
4. Check the project's instructions file (`AGENTS.md`, or `CLAUDE.md` if present and `AGENTS.md` is absent):
   - If neither exists, create `AGENTS.md` with the `Project Instructions Section Template` below.
   - If it exists and does not contain `## Worklog Protocol`, append the section to the end of the file.
   - If it already contains `## Worklog Protocol`, leave it untouched.
5. If inside a git repository (`.git` exists in this directory or a parent), ensure `.gitignore` includes a line with `worklog.org` so the ephemeral tracker is never committed.

## Canonical Templates

### worklog.org Template

```org
#+TITLE: Workspace Worklog — Mission Control
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
```

### docs/backlog/README.md Template

````markdown
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

## Org-Mode Backlog File Template

When authoring a topic backlog (for example `docs/backlog/platform/webhook-hardening.org`), use this structure:

```org
#+TITLE: Webhook Hardening Roadmap
#+AUTHOR: Engineering Team
#+STARTUP: overview
#+TODO: TODO(t) IN-PROGRESS(i) WAITING(w) | DONE(d) CANCELLED(c)

* Overview
Architectural motivation, target repositories, and parent epic or issue.

* Milestones [0/2]
** TODO Milestone 1: Signature Verification [0/2]
   - [ ] Validate HMAC-SHA256 signatures on ingress
   - [ ] Add replay-window rejection tests
   - Traces to: [[https://tracker.example.com/browse/PROJ-104][PROJ-104]]

** TODO Milestone 2: Delivery Metrics [0/1]
   - [ ] Export delivery latency and retry counters
   - Traces to: [[https://tracker.example.com/browse/PROJ-105][PROJ-105]]
```

---

## Linking from `worklog.org`

When claiming a task from a topic backlog, link to it using the `:BACKLOG:` property in `worklog.org`:

```org
* payments-service
** IN-PROGRESS PROJ-104 Validate incoming webhook signatures :PROJ-104:
   :PROPERTIES:
   :TICKET:   PROJ-104
   :BACKLOG:  docs/backlog/platform/webhook-hardening.org
   :WORKTREE: .worktrees/feature-PROJ-104
   :BRANCH:   feature/PROJ-104
   :OWNER:    main-session
   :SESSION:  antigravity-20261121-1420
   :END:
   NEXT: write failing signature verification test
```

---

## Guardrails for AI Agents

1. **No rapid session ticks here:** Keep minute-by-minute session state and log entries in `worklog.org`, not in `docs/backlog/`.
2. **Durable updates only:** Update `docs/backlog/` files when scope changes, issue keys are created or linked, or milestone checkboxes are checked off (`[X]`).
3. **Commit policy:** All changes to `docs/backlog/` require explicit user consent before committing.
````

### Project Instructions Section Template (`AGENTS.md` / `CLAUDE.md`)

```markdown
## Worklog Protocol (Mission Control)

All agents and sessions working in this workspace must maintain `worklog.org` at the workspace root as the live coordination tracker. It supplements (and never replaces) your issue tracker and git workflow. Load the `worklog` skill for full templates, standup/todo reporting, and issue synchronization workflows.

1. **Session start standup pass:** Scan `worklog.org` for stale `IN-PROGRESS` or `WAITING` items before claiming new work.
2. **Claim before start:** Move or insert the ticket under its repo section (`* <repo>`), set state to `IN-PROGRESS`, and populate `:PROPERTIES:` (`:TICKET:`, `:WORKTREE:`, `:BRANCH:`, `:PR:`/`:MR:`, `:OWNER:`, `:SESSION:`). Read your harness session ID safely without dumping `env`/`printenv`, or use `<harness>-<YYYYMMDD-HHMM>`.
3. **Read-back verification:** Re-read the heading immediately after writing; back off if `:OWNER:` or `:SESSION:` was overwritten concurrently.
4. **Mandatory `NEXT:` line & append-only log:** Keep a single `NEXT: <next action>` line on every active item (`IN-PROGRESS`, `WAITING`, `BLOCKED`). Update only on state transitions and append one timestamped entry under `*** Log`.
5. **Confined writes:** Edit only your item's subtree and target repo section; never reflow or reorder other headings.
6. **Worktree registry & `DONE` gate:** Mark `DONE` only after the PR/MR is merged, release tags are fetched (if applicable), and the git worktree is removed.
7. **Ephemeral vs. durable separation:** Never commit `worklog.org`. Keep durable multi-story roadmaps in `docs/backlog/<topic>/*.org` and link them via `:BACKLOG:`.
```
