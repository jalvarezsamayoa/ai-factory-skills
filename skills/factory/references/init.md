# Factory Project Instructions Initialization

Reference procedure and canonical templates for initializing the factory instructions block in the project's instructions file (`AGENTS.md` or `CLAUDE.md`).

## Procedure

1. Ask the user for confirmation before creating or modifying the instructions file (`AGENTS.md` or `CLAUDE.md`).
2. **Preferred (bundled deterministic script):** Run `bash <skill-dir>/scripts/init.sh` (pass `--file CLAUDE.md` if targeting `CLAUDE.md` explicitly, or `--workspace <name>` to set Project Context).
3. **Manual fallback (only if the script is unavailable):**
   - Check whether `AGENTS.md` or `CLAUDE.md` exists at the repository root (prefer `AGENTS.md` if neither exists, or update the existing file).
   - Locate the managed factory block delineated by `<!-- factory:begin -->` and `<!-- factory:end -->`.
   - If the managed block exists, refresh it with the canonical template below while preserving all user-customized sections outside the block.
   - If the managed block is missing, append it to the instructions file.

## Canonical Managed Block Template

```markdown
<!-- factory:begin -->
<!-- Managed by factory init. Re-run factory init to refresh. Do not edit between the markers. -->

## Factory Practices

All software development tasks in this project follow eight mandatory quality gates:

1. **Plan validation:** Write a plan before writing code. Check complexity budgets (CCN <= 5, cognitive <= 8), impact analysis, and security design.
2. **Contrarian pass:** Challenge assumptions and avoidable complexity using the `contrarian` agent before accepting a plan.
3. **Contractor pass:** Pressure-test tickets, SOPs, and plans using the `contractor` agent. Stop on blockers.
4. **Test-driven development:** Write failing tests first, confirm failure reason, write minimal code to pass, refactor clean.
5. **Code review:** Review all code changes before merge using the `software-reviewer` agent. Resolve all blocking findings.
6. **Security review:** Review trust boundaries, sensitive data, and authorization using the `security-reviewer` agent before merge.
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

- **Code review** (Gate 5): review all code changes using the `software-reviewer` agent.
- **Security review** (Gate 6): review trust boundaries, sensitive data, and authorization using the `security-reviewer` agent.
- **Documentation** (Gate 7): update README and docs in the same pass as code changes.

A plan that updates source code without these three stages is incomplete and must be revised before implementation begins.

### Agent Delegation

Dispatch these agents by name at the gates that require an independent pass:

- `contrarian` (Gate 2)
- `contractor` (Gate 3)
- `software-reviewer` (Gate 5)
- `security-reviewer` (Gate 6)
- `bug-hunter` (empirical bug reproduction and hunting)

If your harness cannot dispatch subagents, read the matching agent checklist and apply it inline, noting in your summary that you did so. These agents are provided by `@jalvarezsamayoa/factory`.

### Working Preferences

- Write failing tests before writing code.
- Run code review and security review before merging.
- Update repository documentation in the same pass as code changes.
- Record failures and operational traps in the project field-notes file.

## Project Context

- **Workspace / Issue:** <workspace_id>
- **Key Directories:** tmp/, docs/, repos/

<!-- factory:end -->
```
