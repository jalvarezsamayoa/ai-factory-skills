---
description: Factory control plane — show help, create a workspace, or install factory content
---

You are running the factory control plane. Interpret the arguments after the
command as `$ARGUMENTS`.

If a `factory` tool is available, prefer it over manual file operations:

- `help` or no arguments: show the factory help.
- `workspace [workspace_id]`: create `<cwd>/<workspace_id>/` with `AGENTS.md`,
  `worklog.org`, empty `.envrc` and `.tool-versions`, `docs/backlog/README.md`,
  `docs/scratch-files/`, `repos/`, `tmp/`, and `<harness-dir>/field-notes.md`.
  Default name: `default`.
- `init [harness]`: install the factory agents, skills, and command files.
  Harnesses: `opencode`, `claude`, `antigravity`, or `all`. Default: `opencode`.

If the `factory` tool is not available, perform the same work directly:

1. For `help`, summarize the commands, agents, skill, and workspace layout.
2. For `workspace`, create the directory and template files described in the
   `factory` skill.
3. For `init`, copy the packaged `agents/*.md`, `skills/*`, and
   `commands/factory.md` into the harness's discovery folders:
   - OpenCode: `.opencode/agents`, `.opencode/skills`, `.opencode/commands`
   - Claude Code: `.claude/agents`, `.claude/skills`, `.claude/commands`
   - Antigravity: `.agents/plugins/factory` (bundle containing `plugin.json`, `agents/*.md`, and `skills/*`)

Never overwrite a file the user has edited unless the arguments include
`--force`. Report every file created, updated, skipped, or unchanged.

After any action, tell the user the exact next command to run. The usual next
step after `workspace` is to enter `<workspace_id>/`, fill in the Goals section
of `AGENTS.md`, and track work in `worklog.org`. The usual next step after `init`
is to reload the harness so it discovers the new agent and skill files.
