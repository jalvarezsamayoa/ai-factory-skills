# @jalvarezsamayoa/factory

Agents, skills, tools, and real Markdown files for an AI software development
factory. The factory moves a change through intake, challenge, contract, build,
review, and ship, with independent reviewers and written artifacts at every
gate.

## What is included

| Item | Name | Purpose |
| --- | --- | --- |
| Skill | `factory` | The phase-by-phase workflow that coordinates the agents |
| Skill | `bug-hunting` | Empirical, execution-backed bug hunting across the codebase |
| Skill | `field-notes` | Read-before-planning & write-on-failure field notes protocol |
| Skill | `scratch-files` | Isolated exploratory workspace for drafting notes and designs |
| Skill | `worklog` | Coordinate work, todos, and tickets through uncommitted `worklog.org` |
| Command | `/factory` | `help`, `workspace [name]`, `init [harness]` |
| Tool | `factory` | Same actions, callable by the model |
| Agent | `contrarian` | Challenges assumptions and argues for a safer or simpler plan |
| Agent | `contractor` | Implements an approved plan and contract |
| Agent | `software-reviewer` | Reviews correctness, regressions, maintainability, and tests |
| Agent | `security-reviewer` | Reviews authn/authz, input handling, secrets, and dependencies |
| Agent | `bug-hunter` | Reproduces failures, finds root causes, adds regression tests |

The agent files, skill, and command are shipped as real files under `agents/`,
`skills/`, and `commands/`, so the same content can be installed into OpenCode,
Claude Code, and Antigravity.

## Install

### OpenCode

Add the package to the `plugins` array in `opencode.jsonc`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["@jalvarezsamayoa/factory"]
}
```

The plugin registers the `factory` skill, the `/factory` command, and the
`factory` tool automatically. OpenCode reloads plugins after a config save; use
`/reload` if needed.

OpenCode plugins cannot create new agents through the plugin API. Install the
agent files once with:

```text
/factory init
```

That writes the five agents to `.opencode/agents/`. To install them
automatically whenever the plugin loads, configure the option:

```jsonc
{
  "plugins": [
    {
      "package": "@jalvarezsamayoa/factory",
      "options": { "installAgents": "project" }
    }
  ]
}
```

Use `"global"` to install into `~/.config/opencode/agents/`.

### Claude Code

```bash
npx @jalvarezsamayoa/factory init claude
```

This writes:

```text
.claude/agents/*.md
.claude/skills/factory/SKILL.md
.claude/commands/factory.md
```

Use `--global` to install into `~/.claude/`.

### Antigravity

```bash
npx @jalvarezsamayoa/factory init antigravity
```

This installs the factory plugin bundle under `.agents/plugins/factory/`:

```text
.agents/plugins/factory/plugin.json
.agents/plugins/factory/rules/AGENTS.md
.agents/plugins/factory/skills/factory/SKILL.md
```

Use `--global` to install into `~/.gemini/config/plugins/factory/`. Antigravity
automatically discovers the plugin, loads the subagent definitions from
`rules/AGENTS.md`, and exposes the `factory` skill.

### Every harness

```bash
npx @jalvarezsamayoa/factory init all
```

## Use

Create a workspace for the change:

```text
/factory workspace checkout-retry
```

The workspace is created at `factory/workspaces/checkout-retry/`:

```text
factory/workspaces/checkout-retry/
├── brief.md
├── plan.md
├── contract.md
├── reviews/
│   ├── software.md
│   └── security.md
├── bugs/
└── state.json
```

Then follow the `factory` skill:

1. **Intake** — fill in `brief.md`.
2. **Challenge** — ask the `contrarian` agent to attack the brief.
3. **Contract** — write `plan.md` and `contract.md` with verifiable criteria.
4. **Build** — delegate to the `contractor`.
5. **Review** — run `software-reviewer` and `security-reviewer` independently.
6. **Harden** — use `bug-hunter` for failures and regressions.
7. **Ship** — verify the contract and close the workspace.

Show the command reference at any time:

```text
/factory help
```

## CLI

The package also ships a `factory` binary for harnesses that do not load the
OpenCode plugin:

```bash
npx @jalvarezsamayoa/factory help
npx @jalvarezsamayoa/factory workspace checkout-retry
npx @jalvarezsamayoa/factory init claude --global
npx @jalvarezsamayoa/factory init all --force
```

Flags:

- `--global`, `-g` — target the user config instead of the project.
- `--force`, `-f` — overwrite files that differ from the packaged version.
- `--harness`, `-H` — choose `opencode`, `claude`, `antigravity`, or `all`.

Without `--force`, existing files that differ are skipped so user edits are not
lost.

## Repository layout

```text
agents/                     Portable agent definitions
skills/factory/SKILL.md     Factory workflow
commands/factory.md         Control-plane command for file-based harnesses
src/index.ts                OpenCode plugin entrypoint
src/factory.ts              Shared actions and argument parsing
src/install.ts              Harness discovery paths and installer
src/workspace.ts            Workspace templates
src/cli.ts                  `factory` binary
```

## Development

```bash
npm install
npm run typecheck
npm run build
```

Test the plugin locally by pointing OpenCode at a checkout:

```jsonc
{
  "plugins": ["/absolute/path/to/ai-factory-skills"]
}
```

Or copy this repository into a test project's `.opencode/plugins/factory/` and
run `opencode debug agents` there.

## Notes

- Agent IDs are `contrarian`, `contractor`, `software-reviewer`,
  `security-reviewer`, and `bug-hunter`. The original request used the
  misspellings `software-reviwer` and `security-reviwer`; the shipped IDs use
  the standard spelling.
- OpenCode's agent transform can update or remove discovered agents but cannot
  add new ones. The installer is the supported path for shipping new agents.
- The OpenCode plugin uses the V2 plugin API (`Plugin.define` with `setup`).
