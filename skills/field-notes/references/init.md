# Field Notes Manual Initialization

Reference procedure and canonical templates for initializing the field-notes pattern in environments without the `field-notes` tool (Claude Code, Gemini CLI, Copilot CLI).

## Procedure

1. Ask for explicit user consent before modifying any files. State that you will create `.opencode/field-notes.md` and append a `## Field Notes` section to `AGENTS.md`.
2. Create directory `.opencode/` at project root if missing.
3. Write `.opencode/field-notes.md` using the canonical template below. Never overwrite an existing `.opencode/field-notes.md` unless the user explicitly requests a reset.
4. Check if `AGENTS.md` exists:
   * If `AGENTS.md` does not exist, create it with the canonical `AGENTS.md` section template below.
   * If `AGENTS.md` exists and does not contain `## Field Notes`, append the canonical `AGENTS.md` section to the end of the file.
   * If `AGENTS.md` already contains `## Field Notes`, leave it untouched.

## Canonical Templates

### .opencode/field-notes.md Template

```markdown
# Field Notes

A living record of mistakes, unexpected failures, and operational traps encountered across the current project. The purpose is error prevention: every recorded failure must produce an actionable rule so future agents do not repeat it.

──────────────────────────────────────────────────────────────

## Agent Directives

### 1. Mandatory Read Protocol

- **When:** Before formulating any plan or executing any multi-step task.
- **Action:** Read this file. Check tags and rules against your current task context.
- **Citation:** Explicitly state applicable notes in your plan (e.g., `Field Notes: FN-001 applies`), or explicitly state `Field Notes Checked: none applicable`.

### 2. Mandatory Write Triggers

Append a new note immediately when you encounter and resolve:

1. **Tool / CLI Failures:** A command or tool failed due to incorrect assumptions, flags, or syntax.
2. **Harness & Environment Quirks:** OpenCode / macOS / node differences vs Gemini / Claude / Codex harnesses.
3. **Wrong Assumptions:** An assumption about codebase structure, dependencies, or APIs was invalidated.
4. **CI / Test Failures:** Non-obvious failures in `make lint test`, GitHub/GitLab actions, or test suites.
5. **User Corrections:** The user corrected a technical mistake or workflow violation.

### 3. Entry Guidelines

- **Scope:** Mistakes and failures only. Do not log general success stories or standard documentation.
- **Brevity:** Keep entries concise (<= 10 lines per note). Focus on the concrete error and the rule.
- **Rule Format:** The **Rule / Lesson** line must be an actionable, imperative constraint (e.g., "Always pass `-F` when...", "Never assume `X` exists; check with `Y` first").
- **Supersession:** If a new finding contradicts an older note, add `- **Status:** SUPERSEDED by FN-XXX` to the older note header.

──────────────────────────────────────────────────────────────

## Schema

### FN-[NUMBER]: [Concise Title]

- **Date:** YYYY-MM-DD
- **Context:** [Extension name / Jira subtask / tooling area]
- **Trigger / Error:** [Exact error message or description of what failed]
- **Root Cause:** [Underlying technical reason]
- **Resolution:** [Exact fix applied]
- **Rule / Lesson:** [Imperative rule for future agents to follow]
- **Tags:** `tag1`, `tag2`
```

### AGENTS.md Section Template

```markdown
## Field Notes

@.opencode/field-notes.md

**MANDATORY PROTOCOL:** All agents and subagents must read `.opencode/field-notes.md` before formulating plans or executing tasks. Active notes (FN-001, FN-002, etc.) must be applied to all subagent dispatches and implementations. Any new error or failure must be recorded immediately in `.opencode/field-notes.md`.
```
