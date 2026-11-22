---
name: factory
description: Run the software development factory workflow for a change. Use when planning, building, reviewing, hardening, or shipping work that should move through intake, challenge, contract, build, review, and ship phases.
---

# Factory

The factory turns a change request into reviewed, shippable work. It uses
explicit phases, written artifacts, and independent reviewers. Scale the depth
to the risk; do not skip a phase because the change looks small.

## Workspace

One change owns one workspace. Create it before planning:

```text
/factory workspace <name>
```

or call the `factory` tool with `{ "action": "workspace", "name": "<name>" }`.

The workspace lives at `factory/workspaces/<name>/`:

| File | Purpose |
| --- | --- |
| `brief.md` | Problem, goals, non-goals, constraints, users, success signals |
| `plan.md` | Approach, alternatives, steps, risks, rollback, decisions |
| `contract.md` | Deliverables, acceptance criteria, quality gates, out of scope |
| `reviews/software.md` | Software review findings and verdict |
| `reviews/security.md` | Security review findings and verdict |
| `bugs/` | Reproduction notes, failing tests, and follow-ups |
| `state.json` | Current phase |

Read the workspace before every phase. Write decisions down instead of relying
on conversation history.

## Phases

### 0. Intake

Fill in `brief.md`. State the user problem, the evidence that it matters, the
constraints, and what success looks like. If the request is ambiguous, ask
before inventing requirements.

Do not start build work until the brief is specific enough to disagree with.

### 1. Challenge

Launch the **contrarian** subagent with the workspace path and the current
brief. Ask it to attack the assumptions, name failure modes, and propose the
simplest viable alternative.

Update `brief.md`, `plan.md`, or `contract.md` with what survives. Record
rejected alternatives and why. If the contrarian finds a blocking flaw, return
to intake instead of pushing forward.

### 2. Contract

Write `plan.md` and `contract.md`:

- The approach, alternatives considered, and rollback.
- Deliverables and verifiable acceptance criteria using Given/When/Then.
- Quality gates: tests, review, security, documentation.
- Explicit non-goals.

A contract that cannot fail is not a contract. Every criterion must be
checkable by a reviewer.

### 3. Build

Launch the **contractor** subagent with the workspace path. It implements the
contract in small increments, adds tests with the behavior, and reports
verification.

The contractor must stop and ask when the contract is ambiguous. Do not let it
expand scope or switch designs without approval. Update `state.json` to `build`
when work starts and `review` when the contract is met.

### 4. Review

Run both reviewers independently, in parallel when possible:

- **software-reviewer**: correctness, regressions, maintainability, test gaps.
- **security-reviewer**: threat model, authn/authz, input handling, secrets,
  dependencies, unsafe defaults.

Write their findings to `reviews/software.md` and `reviews/security.md`. A
reviewer may not approve work it authored. A blocking finding stops the ship
gate; route it back to the contractor, then re-review the changed surface.

### 5. Harden

Use the **bug-hunter** subagent for failing tests, regressions, flaky behavior,
and unexplained production errors. It must reproduce, isolate the root cause,
add a failing test, and then fix the cause.

Record follow-up defects that are out of scope in `bugs/` instead of expanding
the current change.

### 6. Ship

Before shipping, verify:

- [ ] Every acceptance criterion in `contract.md` is met.
- [ ] Tests and checks pass.
- [ ] Software review has no blocking findings.
- [ ] Security review has no blocking findings.
- [ ] Rollback is documented.
- [ ] Documentation and migration notes are updated.
- [ ] `state.json` says `shipped`.

Summarize what changed, what was verified, and what risk remains. Close the
workspace without deleting its artifacts.

## Delegation

Start subagents with the `subagent` tool. Give each one:

- The absolute workspace path.
- The phase it owns and the artifact to read.
- The exact deliverable and where to write it.
- The boundaries: what it must not change.

Run software and security reviews in parallel. Never let one subagent write
another subagent's review. The primary agent owns the workspace state and the
final decision.

## Gates

- No build before a specific brief and a verifiable contract exist.
- No ship while a blocking review finding is open.
- Any change to the contract requires a fresh review of the changed surface.
- A fix for a blocking finding is re-reviewed before the gate closes.
- Decisions and rejected alternatives go in `plan.md`, not in chat only.

## Scaling

- **Trivial** (typo, comment, small dependency bump): short brief, one-line
  contract, software review. Skip the contrarian and security review only when
  the change cannot affect behavior, data, auth, or dependencies.
- **Normal** (feature, refactor, bug fix): full sequence with both reviewers.
- **High risk** (auth, payments, data migration, public API, infrastructure):
  full sequence, explicit threat model, rollback rehearsal, and a second
  contrarian pass after the contract is written.

When in doubt, run the phase. The cost of a short review is lower than the cost
of an unowned failure.
