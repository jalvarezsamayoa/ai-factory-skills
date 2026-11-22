# Factory Project Instructions Initialization

Reference procedure and canonical templates for initializing the factory instructions block in the project's instructions file (`AGENTS.md` or `CLAUDE.md`).

## Procedure

1. When `factory init` is invoked to bootstrap project instructions, check whether `AGENTS.md` or `CLAUDE.md` exists at the repository root (prefer `AGENTS.md` if neither exists, or update the existing file).
2. Ask the user for confirmation before creating or modifying the instructions file.
3. Locate the managed factory block delineated by:
   ```markdown
   <!-- factory:begin -->
   ...
   <!-- factory:end -->
   ```
4. If the managed block exists, refresh it with the canonical template below while preserving all user-customized sections outside the block.
5. If the managed block is missing, append it to the instructions file.

## Canonical Managed Block Template

```markdown
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
```
