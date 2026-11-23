#!/usr/bin/env bash
set -euo pipefail

# Deterministic project instructions bootstrap for @jalvarezsamayoa/factory.
# Usage: bash init.sh [--file AGENTS.md|CLAUDE.md] [--workspace <name>]

TARGET_FILE=""
WORKSPACE_ID=""

while [ $# -gt 0 ]; do
  case "$1" in
    --file|-F)
      TARGET_FILE="${2:-}"
      shift 2
      ;;
    --workspace|-w)
      WORKSPACE_ID="${2:-}"
      shift 2
      ;;
    --help|-h)
      echo "Usage: bash init.sh [--file AGENTS.md|CLAUDE.md] [--workspace <name>]"
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [ -z "$TARGET_FILE" ]; then
  if [ -f "AGENTS.md" ]; then
    TARGET_FILE="AGENTS.md"
  elif [ -f "CLAUDE.md" ]; then
    TARGET_FILE="CLAUDE.md"
  else
    TARGET_FILE="AGENTS.md"
  fi
fi

case "$TARGET_FILE" in
  AGENTS.md|CLAUDE.md) ;;
  *)
    echo "Invalid target file: \"$TARGET_FILE\". Use AGENTS.md or CLAUDE.md." >&2
    exit 1
    ;;
esac

WORKSPACE_ID="${WORKSPACE_ID:-$(basename "$PWD")}"

BLOCK_FILE="$(mktemp)"
OUT_FILE="$(mktemp)"
trap 'rm -f "$BLOCK_FILE" "$OUT_FILE"' EXIT

cat >"$BLOCK_FILE" <<EOF
<!-- factory:begin -->
<!-- Managed by factory init. Re-run factory init to refresh. Do not edit between the markers. -->

## Factory Practices

All software development tasks in this project follow eight mandatory quality gates:

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

if [ ! -f "$TARGET_FILE" ]; then
  cp "$BLOCK_FILE" "$TARGET_FILE"
  echo "Created $TARGET_FILE with managed factory block."
  exit 0
fi

if grep -q '<!-- factory:begin -->' "$TARGET_FILE" && grep -q '<!-- factory:end -->' "$TARGET_FILE"; then
  awk -v block_file="$BLOCK_FILE" '
    /<!-- factory:begin -->/ {
      while ((getline line < block_file) > 0) print line
      close(block_file)
      skip = 1
      next
    }
    /<!-- factory:end -->/ {
      skip = 0
      next
    }
    !skip { print }
  ' "$TARGET_FILE" >"$OUT_FILE"
  mv "$OUT_FILE" "$TARGET_FILE"
  echo "Refreshed managed factory block in $TARGET_FILE."
else
  {
    cat "$TARGET_FILE"
    printf '\n'
    cat "$BLOCK_FILE"
  } >"$OUT_FILE"
  mv "$OUT_FILE" "$TARGET_FILE"
  echo "Appended managed factory block to $TARGET_FILE."
fi
