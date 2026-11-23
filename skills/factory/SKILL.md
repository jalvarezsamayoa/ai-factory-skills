---
name: factory
description: Use for any software development task - planning a feature or bugfix, implementing code, reviewing changes, or preparing a release. Enforces eight mandatory quality gates (plan validation, contrarian pass, contractor pass, test-driven development, code review, security review, documentation audit, verification before completion) and dispatches the software-reviewer, security-reviewer, contrarian, and contractor agents. Trigger phrases include "plan this feature", "implement this", "review this change", "fix this bug", "ship this", and "release this". Also answers "factory help" with usage, "factory init" bootstraps a project's agent-instructions file, and "factory workspace" scaffolds a ticket workspace.
---

# Factory

Run every software development task through eight mandatory gates. The gates turn a vague request into a validated plan, a tested change, a reviewed diff, and a verified result. Skip none of them silently. When a gate cannot run, say so and give the reason.

This skill is CLI-agnostic. It names agents and gates, not tool syntax. Use whichever tools your harness provides to read files, search code, run commands, and dispatch subagents.

Read `references/gates.md` for the per-gate checklists. Read it before you start the first gate of a task, and again when a gate's evidence is in doubt.

## Arguments

The skill accepts optional arguments. When the invoking message specifies one, follow that mode instead of the gate sequence. Help, init, and workspace are one-shot utility requests, not development tasks. Never run the gate sequence for them.

- `help` — Print the purpose paragraph, the gate-sequence table, the four-agents table, and this Arguments section, then stop. Do not run the gates.
- `init` — Ask the user for confirmation, then run the bundled deterministic script `bash <skill-dir>/scripts/init.sh` (where `<skill-dir>` is the directory containing this `SKILL.md`). Do not read `references/init.md` or transcribe templates manually unless the script is unavailable.
- `workspace [workspace_id]` — Run the bundled deterministic script `bash <skill-dir>/scripts/workspace.sh <workspace_id> --harness <harness>` (where `<skill-dir>` is the directory containing this `SKILL.md` and `<harness>` is `opencode`, `claude`, or `antigravity`). This scaffolds `<cwd>/<workspace_id>/` in one command with zero manual file transcription. Do not read `references/workspace.md`, `references/init.md`, `worklog/references/init.md`, or `field-notes/references/init.md` unless the script is unavailable.
- Any other invocation — Run the gate sequence as documented below.

## Core Directives

Apply these directives in every reply, in every gate.

- Put objective truth ahead of agreement with the user.
- Check every premise in the request against the code, the docs, or a command's output before you build on it.
- Correct inaccuracies directly. Cite the evidence: a file path, a line, a command result.
- Keep a neutral tone. Do not praise the request, the plan, or the code without a specific, checkable reason.
- Agree only when you can name the fact that supports the agreement.
- Ask a clarifying question when the request is incomplete, contradictory, or open to more than one reading. State each reading. Do not pick one silently.
- State your assumptions before you act on them.
- Prefer the simplest change that meets the request. Add nothing speculative.
- Touch only what the request requires. Mention unrelated problems. Do not fix them unasked.
- In multi-repo workspaces containing `repos/` (or where `AGENTS.md` marks the root as not a git repository), scope all implementation, test, and build files under `repos/<repo-name>/`. Never scaffold project code at the workspace root.
- Write in a plain, direct conversational style: strictly ban tricolons, sets of three, balanced clauses, forced numerical contrasts, and abstract corporate jargon.

## The Gate Sequence

Run the gates in this order. Gates 1 to 3 run before any code is written. Gate 4 governs how code is written. Gates 5 to 8 run after the code exists.

| Gate | Name | Owner | Stops work when |
| --- | --- | --- | --- |
| 1 | Plan validation | You | A budget or standard is broken |
| 2 | Contrarian pass | `contrarian` | The design adds avoidable complexity |
| 3 | Contractor pass | `contractor` | The contractor reports a blocker |
| 4 | Test-driven development | You | Tests were not seen failing first |
| 5 | Code review | `software-reviewer` | A blocking finding is open |
| 6 | Security review | `security-reviewer` | A blocking finding is open |
| 7 | Documentation audit | You | Docs disagree with the code |
| 8 | Verification before completion | You | A command fails or was not run |

For a trivial change, such as a typo fix or a one-line config edit, use judgment about how much ceremony each gate needs. Do not drop a gate without saying which one and why.

## Gate 1: Plan Validation

Write a short plan before you touch code. List the steps and, for each step, the check that proves it done. Then validate the plan against three things.

First, complexity budgets. Keep every function at a cyclomatic complexity of 5 or less and a cognitive complexity of 8 or less. If the repository states a different standard, use the repository's standard instead. Decompose logic in the plan, with guard clauses, helper functions, and lookup tables, so the code does not need rework later.

Second, impact analysis. When a code-intelligence tool such as codegraph is available, use it to find the callers and dependents of every symbol you plan to change. List the blast radius in the plan.

Third, security design. Check the plan against repository security guidelines and threat models for design-level risks before you write code.

Fourth, workspace topology. If the current directory is a multi-repo workspace (`repos/` exists or `AGENTS.md` states the root is not a git repository), verify that every planned source file, test file, and build artifact resides under `repos/<repo-name>/`. Halt and revise the plan if any implementation path targets the workspace root.

When the task requires design exploration, architectural brainstorming, or drafting alternatives before committing to a plan, draft them in a scratch file under `docs/scratch-files/` per the `scratch-files` skill. Promote the approved draft into the plan.

When `worklog.org` exists at the workspace root, run a standup scan for stale claims and claim the ticket `IN-PROGRESS` with `:SESSION:` and a `NEXT:` line per the `worklog` skill.

When an optional tool is not available, write one line in the plan: "Skipped: impact analysis, tool not available." Never skip silently.

## Gate 2: Contrarian Pass

Dispatch the `contrarian` agent before you accept any new feature, design proposal, or architecture decision. Give it the plan, the problem it solves, and the user it serves. The agent challenges assumptions, finds friction, and asks whether each part delivers immediate, tangible value.

Read its findings. For each one, either change the plan or write down why you reject it. Do not treat the pass as a formality. If the contrarian shows that a part of the plan has no clear user value, remove that part.

A bugfix with a narrow, well-understood cause may need only a short contrarian pass. A new feature or a new abstraction always needs a full one.

## Gate 3: Contractor Pass

Dispatch the `contractor` agent to pressure-test tickets, standard operating procedures, and plans before implementation starts. Give it the plan, the workspace `AGENTS.md` (when present, so it can enforce directory contracts such as `repos/`), and any ticket or procedure the work depends on. The agent looks for gaps, missing acceptance criteria, hidden dependencies, workspace-layout violations, and steps that cannot be carried out as written.

A blocker from the contractor stops the work. Resolve it by fixing the plan, getting the missing information from the user, or recording an explicit user decision to proceed. Then run the pass again on the changed plan. Move to gate 4 only when the contractor reports no blockers.

## Gate 4: Test-Driven Development

Write the tests before the code. Follow this cycle for each behavior in the approved plan.

1. Write a failing test that maps to one approved behavior.
2. Run it. Confirm it fails, and confirm it fails for the right reason. A test that fails on a typo proves nothing.
3. Write the minimum code that makes the test pass.
4. Run it. Confirm it passes.
5. Refactor with the tests green. Re-run them after each refactor step.

For a bugfix, first write a test that reproduces the bug. Keep the failing output. It is your evidence that the test catches the defect.

Never write production code without a failing test that demands it. If a behavior cannot be tested, say why, and name the check you use in its place.

## Gate 5: Code Review

Dispatch the `software-reviewer` agent on every change that touches code, before merge. Give it the diff, the plan, and the tests. Do not review your own change and call it done.

The reviewer returns findings with a severity. Fix every blocking finding. Re-run the tests after each fix. Re-dispatch the reviewer when the fixes are large enough to need a second look. Record any finding you decline to fix, with the reason.

## Gate 6: Security Review

Dispatch the `security-reviewer` agent on every change that touches code, before merge. Give it the same diff, plus a note on what data the change handles and where that data comes from.

Fix every blocking finding. Never stage or commit credentials, tokens, keys, or files that the repository ignores. If you find a secret in the working tree, stop, tell the user, and do not process it further.

Gates 5 and 6 can run side by side. Both must finish clean before merge.

## Gate 7: Documentation Audit

Update the README and the docs in the same pass as the code. A shipped feature with no documentation update is a planning defect, not a follow-up task.

Before you write any documentation, read the code it describes. Every command, path, flag, environment variable, and API you name in the docs must exist in the repository. Correct or delete any text that your change made false. When code and docs disagree, the code wins and the docs change.

When writing or editing prose under `docs/` or `README.md`, apply the `antislop-copywriting` skill (when available) so documentation reads naturally and plainly: no em dashes, no AI buzzwords, no fabricated claims or numbers, and no filler phrases.

If the change needs no documentation update, say so and give the reason. Do not leave this gate blank.

## Gate 8: Verification Before Completion

Run the verification commands before you claim the work is done. Run the full test suite, the linters, the type checker, and the build when the repository has them. Show the output.

Make no success claim without evidence from a command you ran in this session. "Should pass" and "looks correct" are not evidence. If a command fails, the work is not done. Fix the cause, then run the command again.

Finish with a short summary: what changed, which gates ran, what each gate found, which gates were skipped and why, and the verification output. When `worklog.org` exists at the workspace root, update the claimed item's state (`WAITING` or `DONE`), `NEXT:` line, and `*** Log` per the `worklog` skill.

## The Four Agents

Dispatch these agents by name. Pass each one the context it needs in the prompt, because a subagent does not see your conversation.

| Agent | Gate | Give it |
| --- | --- | --- |
| `contrarian` | 2 | The plan, the problem, the user it serves |
| `contractor` | 3 | The plan, workspace `AGENTS.md` (if present), and any ticket or procedure it relies on |
| `software-reviewer` | 5 | The diff, the plan, the tests |
| `security-reviewer` | 6 | The diff and a note on the data it handles |

If your harness cannot dispatch subagents, read the matching agent definition and apply its checklist yourself. Say in your summary that you did so.

## Handling Gate Results

Treat a gate result as one of three outcomes.

- **Pass.** Record the evidence and move to the next gate.
- **Blocker.** Stop. Fix the cause, then re-run the same gate. Do not move on with a blocker open.
- **Skipped.** Write the gate name and the reason in the plan or the summary. Only an unavailable tool or a trivial change is a valid reason. Convenience is not.

If a later gate shows that an earlier gate's result no longer holds, go back to the earlier gate. For example, if code review exposes a design flaw, return to gate 2 for the redesigned part.

## Working Rules

- Keep the plan and the evidence in the conversation, not only in your head. The user must be able to see which gates ran.
- Draft pre-plan design notes, exploration, and architectural alternatives in `docs/scratch-files/` per the `scratch-files` skill. Promote approved drafts into the plan; record contrarian or contractor blockers as linked spin-off scratch files.
- Prefer small, reviewable changes. Split a large task into steps, and run gates 4 to 8 for each step that changes code.
- Do not merge, push, or release without the user's consent. The gates prepare the change. The user decides whether it ships.
- Follow the repository's own conventions for commit messages, branch names, and file layout. Where the repository states a rule, the rule overrides the defaults in this skill.
- Record each new failure you meet, such as a command that did not work or an assumption that proved false, in the repository's notes file if it has one. Read that file before planning the next task.
- When the skill activates in a project whose instructions file contains a factory block that differs from the template in `references/init.md`, say so and offer to re-run init.

## Quick Reference

1. Validate the plan against budgets, impact, and security design.
2. Run the contrarian pass.
3. Run the contractor pass. Stop on a blocker.
4. Write failing tests. Make them pass with minimal code.
5. Run code review and security review before merge.
6. Update the docs in the same pass.
7. Run the verification commands. Show the output.

See `references/gates.md` for what each gate checks and what evidence it produces.
