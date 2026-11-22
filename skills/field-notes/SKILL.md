---
name: field-notes
description: Use when the user asks about "field notes", the fieldnotes pattern, initializing or recording project mistakes or failures, or wants to run /field-notes. Loads the read-before-planning and write-on-failure protocol for .opencode/field-notes.md.
---

# Field Notes Skill

Implements the fieldnotes pattern for this project. Field Notes are a living record of mistakes, unexpected failures, and operational traps, stored at `.opencode/field-notes.md`. Every recorded failure must produce an actionable rule so future agents do not repeat it.

## Initialize

If `.opencode/field-notes.md` does not exist:

* **In OpenCode (with air-factory):** Run the `/field-notes` command or call the `field-notes` tool directly.
* **In other CLIs (Claude Code, Gemini CLI, Copilot CLI):** Read `references/init.md` and follow the manual initialization procedure using canonical templates.

**Mandatory User Consent Protocol:**
Before initializing, always inform the user of the planned changes (creating `.opencode/field-notes.md` with the canonical schema and adding the `## Field Notes` protocol section to `AGENTS.md`), and use the `question` tool to ask for explicit permission to proceed. If the user does not consent, stop immediately without making changes. If the user consents, proceed with tool or manual initialization. The initialization is idempotent — safe to run repeatedly.

Read `references/init.md` for the manual initialization procedure and canonical templates.

## Read Protocol (before planning)

Before formulating any plan or executing any multi-step task:

1. Read `.opencode/field-notes.md`.
2. Check each note's tags and rule against the current task context.
3. In your plan, either:
   * Explicitly cite applicable notes (e.g., `Field Notes: FN-001 applies`), or
   * Explicitly state `Field Notes Checked: none applicable`.

This protocol is also enforced by the `**MANDATORY PROTOCOL**` text in `AGENTS.md`.

## Write Triggers (on failure)

Append a new `FN-XXX` note immediately when you encounter and resolve:

1. **Tool / CLI Failures:** A command or tool failed due to incorrect assumptions, flags, or syntax.
2. **Harness & Environment Quirks:** OpenCode / macOS / node differences vs Gemini / Claude / Codex harnesses.
3. **Wrong Assumptions:** An assumption about codebase structure, dependencies, or APIs was invalidated.
4. **CI / Test Failures:** Non-obvious failures in `make lint test`, GitHub/GitLab actions, or test suites.
5. **User Corrections:** The user corrected a technical mistake or workflow violation.

## Entry Guidelines

* **Scope:** Mistakes and failures only. No success stories or standard docs.
* **Brevity:** Keep entries concise (<= 10 lines per note). Concrete error + the rule.
* **Rule Format:** The **Rule / Lesson** line must be an actionable, imperative constraint (e.g., "Always pass `-F` when...", "Never assume `X` exists; check with `Y` first").
* **Supersession:** If a new finding contradicts an older note, add `- **Status:** SUPERSEDED by FN-XXX` to the older note header.

## Schema

Each note follows this structure (see `.opencode/field-notes.md` for the authoritative template):

```markdown
### FN-[NUMBER]: [Concise Title]

- **Date:** YYYY-MM-DD
- **Context:** [Extension name / Jira subtask / tooling area]
- **Trigger / Error:** [Exact error message or description of what failed]
- **Root Cause:** [Underlying technical reason]
- **Resolution:** [Exact fix applied]
- **Rule / Lesson:** [Imperative rule for future agents to follow]
- **Tags:** `tag1`, `tag2`
```

Increment the `FN-XXX` number sequentially. Append new notes below the last one, before any closing content.
