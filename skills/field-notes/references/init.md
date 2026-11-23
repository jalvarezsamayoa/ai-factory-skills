# Field Notes Manual Initialization

Reference procedure and canonical templates for initializing the field-notes pattern in any AI coding harness (OpenCode, Claude Code, Antigravity, or others).

## Procedure

1. Determine `<harness-dir>` for the active harness (`.opencode` for OpenCode, `.claude` for Claude Code, `.agents` for Antigravity).
2. Ask for explicit user consent before modifying any files. State that you will create `<harness-dir>/field-notes.md` and append a `## Field Notes` section to the project's instructions file (`AGENTS.md`, or `CLAUDE.md` if the repository uses that instead).
3. Create directory `<harness-dir>/` at the workspace root if missing.
4. Write `<harness-dir>/field-notes.md` using the canonical template below. Never overwrite an existing field-notes file unless the user explicitly requests a reset.
5. Check the project's instructions file (`AGENTS.md`, or `CLAUDE.md` if present and `AGENTS.md` is absent):
   - If neither exists, create `AGENTS.md` with the canonical section template below.
   - If the instructions file exists and does not contain `## Field Notes`, append the canonical section to the end of the file.
   - If it already contains `## Field Notes`, leave it untouched.

## Canonical Templates

### `<harness-dir>/field-notes.md` Template

```markdown
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
```

### Project Instructions Section Template (`AGENTS.md` / `CLAUDE.md`)

```markdown
## Field Notes

@<harness-dir>/field-notes.md

**MANDATORY PROTOCOL:** All agents and subagents must read `<harness-dir>/field-notes.md` before formulating plans or executing tasks. Active notes (FN-001, FN-002, etc.) must be applied to all subagent dispatches and implementations. Any new error or failure must be recorded immediately in `<harness-dir>/field-notes.md`.
```
