# Validation Gate & False-Positive Discipline

Every candidate bug must pass the False-Positive Discipline rules, the 7-Question Gate, and (for Critical/High findings) the Pre-Severity Gate before it appears in a report.

## 1. False-Positive Discipline Rules

Most retracted bug claims come from four recurring verification mistakes:

### Baseline Diff Rule

A failing test or error code means nothing unless you compare it against a working baseline.

- Always run a **baseline control case** with valid inputs alongside the bug-triggering input.
- If the baseline also fails (due to missing test database setup, uninitialized mocks, or missing environment variables), you have a test-harness error, not a production bug. Fix the harness until the baseline passes, then run the trigger input.
- When claiming an authorization bypass or state mutation, diff the actual return value or persisted state against the baseline — status codes or log lines alone are insufficient.

### Layer-Ordering Rule

A validation error or early rejection does not prove you bypassed an upstream check, and an upstream rejection does not prove downstream logic is broken.

- Many stacks run schema parsers, middleware, or input sanitizers before authentication or business logic.
- When testing whether a guard is missing or a bad input corrupts state, verify with a well-formed request and execution trace that your input actually reached the target function.

### Statistical-Sample Rule (Races, Timing, & Flakes)

A single timing outlier or one-off failure is jitter, not proof.

- For race conditions, prefer deterministic reproduction (barrier synchronization channels, latches, or language race detectors such as `go test -race`).
- When statistical or timing reproduction is required, run at least **n >= 10 interleaved trials per group** (control vs trigger) and confirm repeatable failure or a mean shift of at least 2 standard deviations above control.

### Scripted Iteration Rule (Shell-Loop Ban > 5 Iterations)

Shell `for` loops over arrays or command outputs can silently drop iterations or swallow non-zero exit codes.

- For any fuzzing, boundary sweep, or concurrency test exceeding 5 iterations, write a script (`python`, `node`, or a table-driven test in the project's test suite) that counts iterations explicitly and asserts on every result.

---

## 2. The 7-Question Gate

Ask all 7 questions in order for each candidate finding. **One NO = KILL the finding** and move it to the **Retracted Hypotheses** appendix.

### Q1: Do I have executable proof from this session?

Complete this checklist:

```text
1. Entry Point: <public function / HTTP handler / CLI command / job consumer>
2. Trigger Input: <exact arguments, payload, or concurrent call sequence>
3. Proof Artifact: <test suite test + patch in tmp/bug-hunter/patches/ OR script in tmp/bug-hunter/>
4. Observed Output: <exact failing assertion, panic, corrupted state, or unauthorized data>
5. Production Diff: <empty in main checkout; unmodified production code failed>
```

If you cannot point to a command you ran and its failing output -> **KILL IT**.

### Q2: Does the impact cause real functional, data, or security harm?

- **Valid impact:** corrupted state or ledger numbers, silent data loss, unhandled panic/crash on reachable input, cross-tenant data access, privilege escalation, auth bypass, secret leak, infinite loop / memory exhaustion, or violated API contract.
- **Invalid impact:** style issues, cyclomatic complexity, naming taste, missing comments, or best-practice preferences with no broken behavior -> **KILL IT**.

### Q3: Is the root cause in unmodified, in-scope production code?

- Confirm the failure is caused by the repository's production code, not by a flawed test mock, a stale build artifact, or an out-of-scope external dependency.
- If the failure is inside your test setup -> **KILL IT**.

### Q4: Are the preconditions realistic for a real caller or attacker?

- "If an internal caller passes a corrupted struct pointer that violates the type system" -> **KILL IT** unless a real caller actually constructs that value.
- "If an admin intentionally misconfigures the database URL to an attacker host" -> **KILL IT**.
- If more than two unlikely external preconditions must coincide simultaneously -> **KILL IT** or downgrade to Low.

### Q5: Is this behavior contradicted by the contract (not intended design)?

- Check existing unit tests, docstrings, `README.md`, API specs, and `CHANGELOG.md`.
- If the behavior is explicitly documented and tested as the intended contract -> **KILL IT**.

### Q6: Did the proof demonstrate the harmful outcome beyond "technically possible"?

- Reaching a suspect line of code is not enough; the test must demonstrate the bad outcome (wrong balance persisted, victim record returned, panic thrown, lock wedged).
- If you only proved a primitive in the middle of a chain without showing end-to-end harm -> **DOWNGRADE severity** or chain it before reporting.

### Q7: Is this absent from the Never-Report List?

Never report these as standalone bugs:

```text
- Formatting, lint, import-order, or naming issues
- Dead or unreachable internal helpers that no entry point calls
- Missing defensive checks on internal functions when all callers already validate at the boundary
- Theoretical timing differences verified with only n=1 sample
- Verbose error messages on internal-only CLIs with no secret or PII exposure
- "Admin can perform admin action" without privilege escalation from a lower role
```

---

## 3. Pre-Severity Gate (Before Labeling Critical or High)

Before marking any finding **🔴 Critical** or **High**, answer all four questions in one concrete sentence each:

1. **Full Chain Validated:** Did my reproduction test execute the entire path from a real entry point to the final harmful outcome, rather than testing an isolated internal helper?
2. **Concrete Consequence:** What exact harm occurs in one sentence (for example *"Concurrent refund requests on the same order credit the customer twice while debiting the ledger once"*)?
3. **Repeatable Reproduction:** Did I run the reproduction test or script at least twice and observe the same deterministic (or statistically significant) failure?
4. **No Upstream Guard Blocking It:** Did I verify that no middleware, transaction lock, database constraint, or caller guard blocks this input in real execution?

If any answer is "no", downgrade the finding to **🟠 Medium / Low** until the full chain is proven.

---

## 4. Retracted Hypotheses Appendix Template

Never silently delete a hypothesis that you tested and disproved. Documenting retractions proves coverage and saves engineers from re-investigating false leads.

```markdown
## Retracted Hypotheses

### Retracted: <Short name of suspected flaw>
- **Hypothesis:** <What looked like a bug during code reading and at which file:line>
- **Disproving Evidence:** <The test case or script run that showed the guard held, the database constraint rejected it, or the path was unreachable>
- **Why It Looked Like a Bug:** <Root cause of the false alarm — e.g., upstream middleware already normalized the input, or integer overflow was bounded by an earlier check>
```
