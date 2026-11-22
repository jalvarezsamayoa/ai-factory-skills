# Factory Gate Checklists

Per-gate checklists for the factory skill. Each section states when the gate applies, what to check, what evidence the gate produces, and how to skip a tool-dependent check.

The explicit-skip rule applies to every gate. When a check depends on a tool that is not available, do not drop the check silently. Write one line in the plan or the summary: `Skipped: <check>, <reason>.` Only an unavailable tool or a trivial change is a valid reason.

## Plan Validation

### When it applies

Before any code is written, for every feature, bugfix, refactor, or release task.

### What to check

- The plan lists ordered steps, and each step names the check that proves it done.
- Every premise in the request was checked against the code, the docs, or a command's output.
- Assumptions are written down. Ambiguities are resolved or raised as questions.
- Each planned function stays within the complexity budget: cyclomatic complexity of 5 or less and cognitive complexity of 8 or less. If the repository states another standard, use that one.
- Branching logic is decomposed in the plan with guard clauses, helper functions, or lookup tables, not left for later.
- Impact analysis is done: the callers and dependents of each symbol to change are listed. Use a code-intelligence tool such as codegraph when it is available.
- Security design is checked: trust boundaries, data flows, and new inputs are reviewed.
- For tasks needing design exploration (new feature, new abstraction, or architecture decision), exploration and alternatives are drafted in a scratch file under `docs/scratch-files/` per the `scratch-files` skill and promoted into the plan.
- Field notes are checked: `docs/field-notes.md` (or `.opencode/field-notes.md` if present) was read per the `field-notes` skill, and applicable notes were cited or noted as none applicable.
- Worklog checked (when present): if `worklog.org` exists at the workspace root, a standup scan was run and the ticket is claimed `IN-PROGRESS` with `:SESSION:` and `NEXT:` per the `worklog` skill.
- If the plan updates source code, it must include explicit stages for code review, security review, and documentation. A plan missing any of the three is incomplete and must be revised before implementation.
- No planned work goes beyond the request. Speculative features and single-use abstractions are removed.

### Evidence produced

- A written plan with a verification check per step, including explicit stages for code review, security review, and documentation when source code is updated.
- A blast-radius list of affected callers and dependents, or a skip line.
- A security-design note, or a skip line.
- The scratch file path when design exploration was conducted, or a skip line.
- A field-notes citation line in the plan (`Field Notes: FN-XXX applies` or `Field Notes Checked: none applicable`).

### Explicit-skip rule

Impact analysis and security-design validation depend on tools. If a tool is missing, write `Skipped: impact analysis, tool not available` or `Skipped: security-design validation, tool not available`. Replace the skipped check with a manual search of the code for callers where that is practical, and say that you did.

Design exploration scratch files are not needed for narrow bugfixes or trivial changes; write `Skipped: design exploration scratch file, cause already understood or trivial change.`

## Contrarian Pass

### When it applies

Before you accept any new feature, design proposal, or architecture decision. Use a short pass for a narrow bugfix. Use a full pass for new features and new abstractions.

### What to check

- The `contrarian` agent was dispatched with the plan, the problem it solves, and the user it serves.
- Each assumption the agent challenged has a response: the plan changed, or a reason for keeping it is written down.
- Every part of the plan delivers immediate, tangible value to a named user.
- Friction points the agent found are fixed or accepted on the record.
- Parts with no clear value were removed, not deferred.
- When findings require redesigning components or exploring alternatives, they are recorded as spin-off scratch files linked back to the origin draft.

### Evidence produced

- The agent's findings.
- A response to each finding: changed the plan, or rejected with a reason.
- The revised plan.
- Spin-off scratch files for redesigns when needed, linked to the origin draft.

### Explicit-skip rule

If subagents cannot be dispatched, read the `contrarian` agent definition and apply its questions yourself. Write `Skipped: contrarian dispatch, subagents not available. Applied checklist manually.` Do not skip the pass itself.

## Contractor Pass

### When it applies

Before implementation starts, for every ticket, standard operating procedure, or plan the work depends on.

### What to check

- The `contractor` agent was dispatched with the plan and any ticket or procedure it relies on.
- Acceptance criteria exist and can be tested.
- Dependencies are named and available: other services, teams, access, data, and decisions.
- Every step can be carried out as written by someone who has only the document.
- Ambiguous terms are defined. Open questions are answered or assigned.
- The agent reported no blockers, or each blocker was resolved.
- When blockers reveal structural gaps in design or procedure that require exploration, they are captured in linked spin-off scratch files.

### Evidence produced

- The contractor's findings, with blockers marked.
- A resolution for each blocker: plan fixed, information supplied, or an explicit user decision to proceed.
- A second pass result on the changed plan when blockers were found.
- Spin-off scratch files for exploratory blocker resolution when needed.

### Explicit-skip rule

A blocker stops the work. It cannot be skipped. Only the user can decide to proceed past a blocker, and that decision must be written down. If subagents cannot be dispatched, apply the `contractor` agent's checklist yourself and say so.

## Test-Driven Development

### When it applies

For every behavior change, new feature, and bugfix that touches code.

### What to check

- Each approved behavior has at least one test that maps to it.
- Each test was run before the implementation and seen to fail.
- Each test failed for the right reason, such as a missing behavior, and not for a typo or a setup error.
- The implementation is the minimum that turns the test green.
- Each test was run again after implementation and seen to pass.
- Refactoring happened with the tests green, and the tests were re-run after each step.
- For a bugfix, a test that reproduces the bug was written first.

### Evidence produced

- The failing test output, kept from before the implementation.
- The passing test output after the implementation.
- A mapping from each approved behavior to its test.

### Explicit-skip rule

If a behavior cannot be covered by an automated test, write `Skipped: automated test for <behavior>, <reason>` and name the check you used instead, such as a manual run with its output. Do not write production code with no test and no stated substitute.

## Code Review

### When it applies

On every change that touches code, before merge.

### What to check

- The `software-reviewer` agent was dispatched with the diff, the plan, and the tests.
- The change was not reviewed only by its author.
- Every blocking finding was fixed, and the tests were re-run after each fix.
- A second review was run when the fixes were large.
- Findings that were declined have a written reason.
- The review covered correctness, tests, readability, complexity budgets, and consistency with the surrounding code.

### Evidence produced

- The reviewer's findings with severities.
- A list of fixes made, and of findings declined with reasons.
- The test output after the final fix.

### Explicit-skip rule

If subagents cannot be dispatched, read the `software-reviewer` agent definition and review the diff against its checklist. Write `Skipped: software-reviewer dispatch, subagents not available. Applied checklist manually.` Say that the review was a self-review.

## Security Review

### When it applies

On every change that touches code, before merge.

### What to check

- The `security-reviewer` agent was dispatched with the diff and a note on the data the change handles and where it comes from.
- Inputs are validated, and outputs are encoded for where they go.
- Authentication, authorization, and access checks are present and correct.
- Secrets, tokens, keys, and credentials are absent from code, tests, fixtures, logs, and commit content.
- No file matched by the repository's ignore rules is staged.
- New dependencies are needed, maintained, and free of known vulnerabilities when a scanner is available.
- Error messages and logs do not leak sensitive data.
- Every blocking finding was fixed.

### Evidence produced

- The reviewer's findings with severities.
- A list of fixes made, and of findings declined with reasons.
- A statement that no secrets were found in the change, or a halt notice to the user if any were.

### Explicit-skip rule

A dependency scanner is a tool-dependent check. If none is available, write `Skipped: dependency vulnerability scan, tool not available.` The agent dispatch follows the same fallback as code review: apply the `security-reviewer` checklist yourself and say so. If you find a secret, stop, tell the user, and do not process it further.

## Documentation Audit

### When it applies

In the same pass as every code change. A shipped feature with no documentation update is a planning defect.

### What to check

- The code the docs describe was read first, not recalled from memory or from the plan.
- Every command, path, flag, environment variable, and API named in the docs exists in the repository.
- Text that the change made false was corrected or deleted.
- The README stays a short entry point: what the project is, setup, quick start, usage, tests, and links to deeper docs.
- Deeper material lives in the docs directory, one topic per file, and is linked from the README.
- Documentation changes are limited to what the change affected. Unrelated stale text is mentioned, not fixed unasked.
- Prose in `README.md` and `docs/` follows the `antislop-copywriting` rules (load the skill when available): no em dashes, no empty AI buzzwords, no fabricated claims or numbers, and no filler phrases.
- Ephemeral agent scratch material and unapproved plan drafts are not committed and not linked from the docs.
- Scratch files under `docs/scratch-files/` follow the scratch-files lifecycle: promote testable behaviors to `.feature` files and architecture to `docs/`, mark the scratch file `Status: Implemented`, and retain it as design rationale. Scratch files with `Status: Draft` are not finalized documentation and are not committed.

### Evidence produced

- The list of documentation files changed, with a one-line reason for each.
- Or, when no update is needed, a statement of that and the reason.

### Explicit-skip rule

If the change needs no documentation update, say so and give the reason. This gate is never left blank. A missing documentation linter is a tool-dependent check: write `Skipped: documentation lint, tool not available.`

## Verification Before Completion

### When it applies

Before any claim that work is complete, fixed, or passing, and before any commit or merge request.

### What to check

- The full test suite was run in this session, not only the new tests.
- The linters were run, including any complexity checks the repository has.
- The type checker was run, if the repository has one.
- The build was run, if the repository has one.
- Every command exited cleanly, and the output was read, not assumed.
- Any command that failed was investigated, the cause fixed, and the command run again.
- All earlier gates have a recorded result: passed, or skipped with a reason.
- Worklog updated (when present): if `worklog.org` exists at the workspace root, the claimed item reflects the transition (`WAITING` or `DONE`), updated `NEXT:` line, and appended `*** Log` entry per the `worklog` skill.

### Evidence produced

- The command lines and their output, or the relevant part of it.
- A closing summary: what changed, which gates ran, what each found, which were skipped and why.

### Explicit-skip rule

If the repository has no linter, type checker, or build, write `Skipped: <check>, not configured in this repository.` Never claim success from memory, from an earlier run before later edits, or from the words "should pass". If a command cannot be run, report the work as unverified and say what is missing.
