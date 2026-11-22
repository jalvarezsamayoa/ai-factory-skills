---
name: bug-hunting
description: Use when the user asks to hunt for bugs, audit a codebase or module for functional or security defects, prove or reproduce a suspected bug, or run bug-hunting. Uses a 5-phase methodology, A->B sibling cluster hunting, and a 7-Question Gate for codebase bug hunting, requiring every reported bug to be proven with executable evidence in the test suite, tmp/bug-hunter/, or an isolated git worktree.
---

# Bug Hunting

Hunt for functional, logic, concurrency, and security bugs in a codebase using empirical, execution-backed verification.

## Core Rule: Proof Over Suspicion

Reading source code and suspecting a defect never produces a finding; it produces a **hypothesis**.

- **"Could potentially" is not a bug.** Never report a theoretical flaw from static code inspection alone.
- **Prove it by running code.** Every reported finding must be backed by executable proof captured in this session.
- **Retract what fails reproduction.** When a hypothesis does not reproduce or fails a guard you missed during initial reading, drop it from findings and log it in the **Retracted Hypotheses** appendix with the disproving evidence.

Read `references/validation-gate.md` before reporting any finding, and read `references/hunt-checklists.md` when selecting vulnerability and logic classes to hunt.

## The Verification & Proof Hierarchy

Prove every bug hypothesis using the highest-ranked method below that can reach the target path:

1. **Method 1 — Project Test Suite (Preferred):**
   - Write a failing test inside the repository's existing test suite that calls unmodified production code and demonstrates the violated invariant.
   - Run the project's test runner and capture the failing output.
   - Save the test diff to `tmp/bug-hunter/patches/<finding-slug>.patch` before cleaning up the main working tree so the developer can apply it directly when fixing the bug.
2. **Method 2 — Standalone Script in `tmp/bug-hunter/`:**
   - When the existing test runner cannot reach the path directly (such as multi-process races, CLI pipelines, or raw protocol checks), write and run a standalone reproduction script under `tmp/bug-hunter/`.
3. **Method 3 — Isolated Git Worktree (When Source Edits Are Required):**
   - When proving a bug requires temporary instrumentation, fault injection, or edits to production source files, never modify the main checkout.
   - Create an isolated worktree under `.worktrees/bug-hunter-<slug>` (`git worktree add .worktrees/bug-hunter-<slug> HEAD`), run the reproduction there, save the evidence under `tmp/bug-hunter/` in the main workspace, and remove the worktree before concluding unless the user asked to keep it.

Always record `git status --short` before starting. Before finishing, remove any temporary test files added to the main checkout and confirm `git status --short` outside `tmp/` matches the pre-hunt state.

## The 5-Phase Non-Linear Workflow

Move freely between phases: if proving a bug in Phase 4 exposes a shared helper or a new trust boundary, return to Phase 2 or Phase 3 immediately.

| Phase | Name | Goal | Reference |
| --- | --- | --- | --- |
| 1 | Scope & Crown Jewels | Identify the highest-damage failure modes for the target module or service | `references/hunt-checklists.md` |
| 2 | Map Trust Boundaries & Invariants | Trace entry points, callers, validation layers, state transitions, and persistence | `references/hunt-checklists.md` |
| 3 | Hunt & A->B Sibling Clustering | Form concrete trigger hypotheses and sweep sibling endpoints/functions | `references/hunt-checklists.md` |
| 4 | Prove via Execution | Run the Proof Hierarchy and enforce False-Positive Discipline | `references/validation-gate.md` |
| 5 | Validate (7-Question Gate) & Report | Filter every candidate through the 7-Question Gate and write the report | `references/validation-gate.md` |

### Phase 1: Scope & Crown Jewels

Before reading individual lines, define the target's crown jewels:

- **Financial / Accounting:** balance calculations, rounding, currency conversion, idempotency, double-spend races, partial-failure rollback.
- **Auth & Access Control:** cross-tenant object references (IDOR / BOLA), role escalation, signature/token verification, fail-open error handlers.
- **State & Concurrency:** out-of-order events, replay of terminal states, lock ordering, check-then-act races, stale cache after transaction failure.
- **Input Parsing & External I/O:** panics/exceptions on malformed input, unbounded allocation, path traversal, SQL/command/template injection, SSRF.

### Phase 2: Map Trust Boundaries & Invariants

- Use a code-intelligence graph when available to map callers, callees, and test coverage of the target module.
- Trace each input from its entry boundary through validation and business logic to database writes or external calls.
- Spot **developer inconsistencies**: when 4 handlers in a module enforce a guard or transaction boundary and the 5th omits it, that 5th handler is your primary hypothesis.

### Phase 3: Hunt & A->B Sibling Clustering

When you confirm **Bug A** in one function or endpoint, immediately run the **A->B Cluster Hunt Protocol**:

1. **Confirm A:** Prove Bug A with executable evidence.
2. **Map Siblings:** Find all functions, endpoints, or callers in the same package/controller or sharing the same helper pattern.
3. **Test Siblings:** Execute the same reproduction pattern against every sibling.
4. **Chain Primitives:** Check whether two lower-severity primitives combine into a critical failure.

### Phase 4: Prove via Execution

Execute each hypothesis using the Proof Hierarchy and enforce the four false-positive discipline rules from `references/validation-gate.md`:

- **Baseline Diff Rule:** Prove a valid control input passes while the trigger input fails on the target invariant.
- **Layer-Ordering Rule:** Prove the input reached the target business logic rather than being rejected by an upstream parser or middleware.
- **Statistical-Sample Rule:** For race conditions or timing claims, run `n >= 10` interleaved trials (or use deterministic barriers / race detectors) rather than relying on a single outlier.
- **Scripted Iteration Rule:** Use a script or parameterized test instead of shell loops for more than 5 iterations.

### Phase 5: Validate & Report

Run every proven candidate through the **7-Question Gate** and **Pre-Severity Gate** in `references/validation-gate.md`.

- Save the full report to `tmp/bug-hunter/<target-slug>.md` and test patches to `tmp/bug-hunter/patches/`. In a factory workspace, also record reproduction notes and failing tests in `factory/workspaces/<name>/bugs/`.
- Include the **Sibling Cluster Sweep**, **Retracted Hypotheses** appendix, and **Workspace Cleanliness Check** (`git status --short`).

## Dispatching the `bug-hunter` Agent

- **Single target or module:** Dispatch the `bug-hunter` subagent with the target paths, crown-jewel focus, and any known symptoms or ticket context.
- **Multi-module codebase hunt:** Map the modules in Phase 1 and Phase 2, then dispatch parallel `bug-hunter` subagents — one per module or bug class — instructing each to use distinct filenames under `tmp/bug-hunter/<module-slug>/` and isolated worktrees (`.worktrees/bug-hunter-<module-slug>`) if source edits are needed.
- **Fallback when subagents are unavailable:** Read `agents/bug-hunter.md` and execute the hunt, proof hierarchy, and 7-Question Gate inline.
