# AGENTS.md

Development guide for `@jalvarezsamayoa/factory` (`ai-factory-skills`).

## Overview

This repository ships portable agents, skills, commands, a CLI (`factory`), and an OpenCode V2 plugin for running a structured software development workflow across OpenCode, Claude Code, and Antigravity.

## Repository Layout

- `agents/`: Portable agent definitions (`bug-hunter.md`, `contractor.md`, `contrarian.md`, `security-reviewer.md`, `software-reviewer.md`).
- `skills/`: Portable skills (`factory`, `bug-hunting`, `field-notes`, `scratch-files`, `worklog`), each containing `SKILL.md` and optional `references/`.
- `commands/`: File-based command templates (`factory.md`).
- `src/`: TypeScript source compiled to `dist/` (ESM, Node `>=22`).
  - `src/index.ts`: OpenCode V2 plugin entrypoint (`Plugin.define`). Registers skills, `/factory` command, and `factory` tool.
  - `src/install.ts`: Multi-harness installer for OpenCode (`.opencode/`), Claude Code (`.claude/`), and Antigravity (`.agents/plugins/factory/`).
  - `src/factory.ts`: Shared control-plane actions (`help`, `workspace`, `init`) and argument parser.
  - `src/workspace.ts`: Workspace scaffolding (`<cwd>/<workspace_id>/`).
  - `src/content.ts`: Package root resolution and Markdown frontmatter helpers.
  - `src/cli.ts`: `factory` binary entrypoint (`dist/cli.js`).
- `test/factory.test.js`: Node built-in test suite (`node:test`) covering argument parsing, workspace creation, and multi-harness installation.
- `.releaserc.json` and `.github/workflows/release.yml`: CI on all branches and automated `semantic-release` publishing on `main` via npm OIDC Trusted Publishing.

## Development Commands

Run these before committing any change:

```bash
npm run typecheck   # tsc -p tsconfig.json --noEmit
npm run build       # compile src/ to dist/
npm test            # run node --test test/*.test.js
npm pack --dry-run  # inspect files included in the published npm tarball
```

## Making Changes

### Adding or Updating a Skill

1. Create or edit `skills/<name>/SKILL.md` (with `name` and `description` YAML frontmatter) and any supporting files under `skills/<name>/references/`.
2. Register the skill in `src/index.ts` inside `ctx.skill.transform`.
3. Add installation copy steps for the skill in `src/install.ts` for all three harness branches (Antigravity plugin bundle, Antigravity standalone, and OpenCode/Claude Code).
4. Add installation assertions in `test/factory.test.js`.
5. Update the skills table in `README.md`.

### Adding or Updating an Agent

1. Create or edit `agents/<name>.md` with YAML frontmatter (`name`, `description`, `mode`, and `permissions` when read-only).
2. `src/install.ts` automatically discovers all `agents/*.md` files for OpenCode, Claude Code, and Antigravity's compiled `rules/AGENTS.md`.
3. Add assertions in `test/factory.test.js` and update `README.md`.

## Portability and Content Rules

- **Cross-harness compatibility:** Every agent, skill, and command must work across OpenCode, Claude Code, and Antigravity. Avoid hardcoding harness-specific tool names, paths, or `@mention` syntax unless framed as an optional fallback.
- **General-purpose scope:** Keep all instructions vendor-neutral and free of company-specific URLs, internal tool names, or proprietary services.
- **Documentation prose:** Apply `antislop-copywriting` rules when editing `README.md` or files under `docs/`. Avoid em dashes, empty AI buzzwords, filler phrases, and fabricated claims.

## Commits and Releases

- Use Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `ci:`, `refactor:`).
- `test` runs in GitHub Actions on all branches and pull requests.
- Pushing `fix:`, `feat:`, or `BREAKING CHANGE:` commits to `main` triggers `semantic-release` after tests pass. It bumps `package.json`, updates `CHANGELOG.md`, commits back to `main` with `[skip ci]`, creates a GitHub Release, and publishes to npm via OIDC Trusted Publishing.
- Do not manually edit `CHANGELOG.md` or manually bump `package.json` versions.

<!-- factory:begin -->
## Quality Gates (Factory)

Every software development task in this repository must satisfy eight mandatory quality gates in order:

1. **Plan validation:** Write an ordered plan with verification checks per step. Validate complexity budgets (cyclomatic complexity <= 5, cognitive complexity <= 8) and check callers/dependents.
2. **Contrarian pass:** Challenge assumptions and ensure immediate user value. Stop avoidable complexity.
3. **Contractor pass:** Pressure-test procedures, tickets, and plans. Stop at the first blocker.
4. **Test-driven development:** Write failing tests before implementation. Make them pass with minimal code.
5. **Code review:** Run `software-reviewer` to enforce correctness, complexity, and maintainability.
6. **Security review:** Run `security-reviewer` to enforce authz boundaries, input validation, and secret hygiene.
7. **Documentation audit:** Keep README and docs accurate and synchronized with code changes.
8. **Verification before completion:** Run full test suite, linter, typecheck, and build before claiming success.

Do not skip gates silently.
<!-- factory:end -->
