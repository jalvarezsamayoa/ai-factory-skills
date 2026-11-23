#!/usr/bin/env bash
set -euo pipefail

# Deterministic workspace scaffolding for @jalvarezsamayoa/factory.
# Usage: bash workspace.sh <workspace_id> [--harness opencode|claude|antigravity] [--force]

WORKSPACE_ID=""
HARNESS=""
FORCE=0

while [ $# -gt 0 ]; do
  case "$1" in
    --harness|-H)
      HARNESS="${2:-}"
      shift 2
      ;;
    --force|-f)
      FORCE=1
      shift
      ;;
    --help|-h)
      echo "Usage: bash workspace.sh <workspace_id> [--harness opencode|claude|antigravity] [--force]"
      exit 0
      ;;
    -*)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
    *)
      if [ -z "$WORKSPACE_ID" ]; then
        WORKSPACE_ID="$1"
      fi
      shift
      ;;
  esac
done

WORKSPACE_ID="${WORKSPACE_ID:-default}"

if ! printf '%s' "$WORKSPACE_ID" | grep -Eq '^[A-Za-z0-9][A-Za-z0-9._-]*$'; then
  echo "Invalid workspace ID: \"$WORKSPACE_ID\". Use letters, numbers, '.', '_', or '-'." >&2
  exit 1
fi

case "$WORKSPACE_ID" in
  *..*)
    echo "Invalid workspace ID: \"$WORKSPACE_ID\"." >&2
    exit 1
    ;;
esac

if [ -z "$HARNESS" ]; then
  SCRIPT_PATH="$0"
  case "$SCRIPT_PATH" in
    */.gemini/*|*/.agents/*) HARNESS="antigravity" ;;
    */.claude/*) HARNESS="claude" ;;
    *) HARNESS="opencode" ;;
  esac
fi

case "$HARNESS" in
  opencode) HARNESS_DIR=".opencode" ;;
  claude) HARNESS_DIR=".claude" ;;
  antigravity) HARNESS_DIR=".agents" ;;
  *)
    echo "Invalid harness: \"$HARNESS\". Use opencode, claude, or antigravity." >&2
    exit 1
    ;;
esac

ROOT="$PWD/$WORKSPACE_ID"
mkdir -p "$ROOT/tmp" "$ROOT/repos" "$ROOT/docs/backlog" "$ROOT/docs/scratch-files" "$ROOT/$HARNESS_DIR"

CREATED=0
SKIPPED=0

write_file() {
  local target="$1"
  if [ -e "$target" ] && [ "$FORCE" -ne 1 ]; then
    cat >/dev/null
    SKIPPED=$((SKIPPED + 1))
    return
  fi
  mkdir -p "$(dirname "$target")"
  cat >"$target"
  CREATED=$((CREATED + 1))
}

FIELD_NOTES_PATH="$HARNESS_DIR/field-notes.md"

write_file "$ROOT/.envrc" <<'EOF'
EOF

write_file "$ROOT/.tool-versions" <<'EOF'
EOF

write_file "$ROOT/AGENTS.md" <<EOF
# ${WORKSPACE_ID}

## Directories

\`${WORKSPACE_ID}\` is the workspace root directory. This is not a git repository. Host target git repositories under \`repos/\`.

- \`worklog.org\`: live cross-repo mission-control tracker (uncommitted coordination file; see Worklog Protocol)
- \`tmp/\`: temporary files and scripts
- \`docs/\`: documentation related to this workspace
- \`docs/backlog/\`: durable topic backlogs and roadmaps in Org-mode syntax (linked from \`worklog.org\` via \`:BACKLOG:\`)
- \`docs/scratch-files/\`: notes and pre-plan design drafts (governed by the \`scratch-files\` skill)
- \`repos/\`: git repositories being worked on
- \`${FIELD_NOTES_PATH}\`: living log of operational traps and mistakes

## Worklog Protocol (Mission Control)

All agents and sessions working in this workspace must maintain \`worklog.org\` at the workspace root as the live coordination tracker. It supplements (and never replaces) your issue tracker and git workflow. Load the \`worklog\` skill for full templates, standup/todo reporting, and issue synchronization workflows.

1. **Session start standup pass:** Scan \`worklog.org\` for stale \`IN-PROGRESS\` or \`WAITING\` items before claiming new work.
2. **Claim before start:** Move or insert the task under its repo section (\`* <repo>\`), set state to \`IN-PROGRESS\`, and populate \`:PROPERTIES:\` (\`:TICKET:\`, \`:WORKTREE:\`, \`:BRANCH:\`, \`:PR:\`/\`:MR:\`, \`:OWNER:\`, \`:SESSION:\`). Read your harness session ID safely without dumping \`env\`/\`printenv\`, or use \`<harness>-<YYYYMMDD-HHMM>\`.
3. **Read-back verification:** Re-read the heading immediately after writing; back off if \`:OWNER:\` or \`:SESSION:\` was overwritten concurrently.
4. **Mandatory \`NEXT:\` line & append-only log:** Keep a single \`NEXT: <next action>\` line on every active item (\`IN-PROGRESS\`, \`WAITING\`, \`BLOCKED\`). Update only on state transitions and append one timestamped entry under \`*** Log\`.
5. **Confined writes:** Edit only your item's subtree and target repo section; never reflow or reorder other headings.
6. **Worktree registry & \`DONE\` gate:** Mark \`DONE\` only after the PR/MR is merged, release tags are fetched (if applicable), and the git worktree is removed.
7. **Ephemeral vs. durable separation:** Never commit \`worklog.org\`. Keep durable multi-story roadmaps in \`docs/backlog/<topic>/*.org\` and link them via \`:BACKLOG:\`.

## Goals

<!-- State the goals and ticket/issue links for ${WORKSPACE_ID} here. -->

## Preferences

- Work out of feature branches and merge via PRs/MRs after CI is green.
- Use linting and typecheck tools; do not ignore or skip lint issues without explicit user consent.
- Use the \`scratch-files\` skill for pre-plan design notes and architectural exploration.
- Never commit or push changes without explicit user confirmation.

## Field Notes

@${FIELD_NOTES_PATH}

**MANDATORY PROTOCOL:** All agents and subagents must read \`${FIELD_NOTES_PATH}\` before formulating plans or executing tasks. Active notes (FN-001, FN-002, etc.) must be applied to all subagent dispatches and implementations. Any new error or failure must be recorded immediately in \`${FIELD_NOTES_PATH}\`.

<!-- factory:begin -->
<!-- Managed by factory init. Re-run factory init to refresh. Do not edit between the markers. -->

## Factory Practices

All software development tasks in this workspace follow eight mandatory quality gates:

1. **Plan validation:** Write a plan before writing code. Check complexity budgets (CCN <= 5, cognitive <= 8), impact analysis, and security design.
2. **Contrarian pass:** Challenge assumptions and avoidable complexity using the \`contrarian\` agent before accepting a plan.
3. **Contractor pass:** Pressure-test tickets, SOPs, and plans using the \`contractor\` agent. Stop on blockers.
4. **Test-driven development:** Write failing tests first, confirm failure reason, write minimal code to pass, refactor clean.
5. **Code review:** Review all code changes before merge using the \`software-reviewer\` agent. Resolve all blocking findings.
6. **Security review:** Review trust boundaries, sensitive data, and authorization using the \`security-reviewer\` agent before merge.
7. **Documentation audit:** Keep README and docs in sync with code in the same pass. Describe current behavior accurately.
8. **Verification before completion:** Run full test suite, linters, and type checker. Require command evidence before claiming done.

### Core Directives

Apply these in every reply and every gate.

- Put objective truth ahead of agreement with the user.
- Fact-check all premises before responding. Cite the evidence: a file path, a line, a command result.
- Correct inaccuracies directly, with a neutral tone. Never offer unearned praise. Anchor any agreement in specific facts.
- Ask a probing question when the request is contradictory or incomplete. State each reading. Do not pick one silently.
- Write in a plain, direct style: no tricolons, sets of three, balanced clauses, forced numerical contrasts, or abstract corporate jargon.

### Plan Requirements

It is mandatory for every plan that updates source code to include explicit stages for:

- **Code review** (Gate 5): review all code changes using the \`software-reviewer\` agent.
- **Security review** (Gate 6): review trust boundaries, sensitive data, and authorization using the \`security-reviewer\` agent.
- **Documentation** (Gate 7): update README and docs in the same pass as code changes.

A plan that updates source code without these three stages is incomplete and must be revised before implementation begins.

### Agent Delegation

Dispatch these agents by name at the gates that require an independent pass:

- \`contrarian\` (Gate 2)
- \`contractor\` (Gate 3)
- \`software-reviewer\` (Gate 5)
- \`security-reviewer\` (Gate 6)
- \`bug-hunter\` (empirical bug reproduction and hunting)

If your harness cannot dispatch subagents, read the matching agent checklist and apply it inline, noting in your summary that you did so. These agents are provided by \`@jalvarezsamayoa/factory\`.

### Working Preferences

- Write failing tests before writing code.
- Run code review and security review before merging.
- Update repository documentation in the same pass as code changes.
- Record failures and operational traps in the project field-notes file.

## Project Context

- **Workspace / Issue:** ${WORKSPACE_ID}
- **Key Directories:** tmp/, docs/, repos/

<!-- factory:end -->
EOF

write_file "$ROOT/worklog.org" <<'EOF'
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

write_file "$ROOT/docs/backlog/README.md" <<'EOF'
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
   :WORKTREE: repos/payments-service/.worktrees/feature-PROJ-104
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
EOF

write_file "$ROOT/$FIELD_NOTES_PATH" <<'EOF'
# Field Notes

A living record of mistakes, unexpected failures, and operational traps encountered across the current workspace. The purpose is error prevention: every recorded failure must produce an actionable rule so future agents do not repeat it.

---

## Agent Directives

### 1. Mandatory Read Protocol

- **When:** Before formulating any plan or executing any multi-step task.
- **Action:** Read this file. Check tags and rules against your current task context.
- **Citation:** Explicitly state applicable notes in your plan (e.g., `Field Notes: FN-001 applies`), or explicitly state `Field Notes Checked: none applicable`.

### 2. Mandatory Write Triggers

Append a new note immediately when you encounter and resolve:

1. **Tool / CLI Failures:** A command or tool failed due to incorrect assumptions, flags, or syntax.
2. **Harness & Environment Quirks:** OS, runtime, or AI harness differences (OpenCode, Claude Code, Antigravity).
3. **Wrong Assumptions:** An assumption about codebase structure, dependencies, or APIs was invalidated.
4. **CI / Test Failures:** Non-obvious failures in lint, build, CI pipelines, or test suites.
5. **User Corrections:** The user corrected a technical mistake or workflow violation.

### 3. Entry Guidelines

- **Scope:** Mistakes and failures only. Do not log general success stories or standard documentation.
- **Brevity:** Keep entries concise (<= 10 lines per note). Focus on the concrete error and the rule.
- **Rule Format:** The **Rule / Lesson** line must be an actionable, imperative constraint (e.g., "Always pass `-F` when...", "Never assume `X` exists; check with `Y` first").
- **Supersession:** If a new finding contradicts an older note, add `- **Status:** SUPERSEDED by FN-XXX` to the older note header.

---

## Schema

### FN-[NUMBER]: [Concise Title]

- **Date:** YYYY-MM-DD
- **Context:** [Module / issue / tooling area]
- **Trigger / Error:** [Exact error message or description of what failed]
- **Root Cause:** [Underlying technical reason]
- **Resolution:** [Exact fix applied]
- **Rule / Lesson:** [Imperative rule for future agents to follow]
- **Tags:** `tag1`, `tag2`
EOF

echo "Factory workspace ready: $ROOT"
echo "Harness dir: $HARNESS_DIR ($CREATED written, $SKIPPED skipped)"
