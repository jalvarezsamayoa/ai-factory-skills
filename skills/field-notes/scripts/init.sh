#!/usr/bin/env bash
set -euo pipefail

# Deterministic field-notes initialization for @jalvarezsamayoa/factory.
# Usage: bash init.sh [--harness opencode|claude|antigravity] [--force]

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
      echo "Usage: bash init.sh [--harness opencode|claude|antigravity] [--force]"
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [ -z "$HARNESS" ]; then
  case "$0" in
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

FIELD_NOTES_PATH="$HARNESS_DIR/field-notes.md"
mkdir -p "$HARNESS_DIR"

if [ ! -f "$FIELD_NOTES_PATH" ] || [ "$FORCE" -eq 1 ]; then
  cat >"$FIELD_NOTES_PATH" <<'EOF'
# Field Notes

A living record of mistakes, unexpected failures, and operational traps encountered across the current project. The purpose is error prevention: every recorded failure must produce an actionable rule so future agents do not repeat it.

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
  echo "Wrote $FIELD_NOTES_PATH"
else
  echo "Skipped existing $FIELD_NOTES_PATH"
fi

TARGET_FILE="AGENTS.md"
if [ ! -f "AGENTS.md" ] && [ -f "CLAUDE.md" ]; then
  TARGET_FILE="CLAUDE.md"
fi

if [ ! -f "$TARGET_FILE" ] || ! grep -q '^## Field Notes' "$TARGET_FILE"; then
  cat >>"$TARGET_FILE" <<EOF

## Field Notes

@${FIELD_NOTES_PATH}

**MANDATORY PROTOCOL:** All agents and subagents must read \`${FIELD_NOTES_PATH}\` before formulating plans or executing tasks. Active notes (FN-001, FN-002, etc.) must be applied to all subagent dispatches and implementations. Any new error or failure must be recorded immediately in \`${FIELD_NOTES_PATH}\`.
EOF
  echo "Updated $TARGET_FILE with Field Notes protocol."
else
  echo "$TARGET_FILE already contains ## Field Notes."
fi
