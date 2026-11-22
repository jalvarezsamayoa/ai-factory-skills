---
name: scratch-files
description: Use when the user asks to take notes, draft a design, brainstorm architecture, explore a design before planning a feature, or mentions scratch files or scratch notes.
---

# Scratch Files

## Overview

Scratch files provide an isolated, exploratory workspace for writing notes, drafting ideas, and visualizing designs before committing to specifications or code.

**Core Principle:** Scratch files are notes and working drafts, not finalized decisions. They explore and capture ideas without mutating repository code or canonical specifications.

## Location Resolution

Resolve the scratch directory in this order:

1. **Existing Directory Wins:** If `docs/scratchfiles/` already exists in the repository, use `docs/scratchfiles/`.
2. **Default:** Otherwise, use `docs/scratch-files/`.

Never place scratch files in `tmp/`, the project root, or scattered folders.

## File Naming & Structure

### Naming Convention

Name files using topic kebab-case: `[topic-name].md` (e.g. `distributed-cache.md`, `retry-backoff-policy.md`).

### Required Header & Status

Every scratch file must start with a `Status` line:

```markdown
# [Topic Name]

Status: Draft | Under Discussion | Approved | Implemented
```

* **Draft:** Initial ideas and exploratory sketches.
* **Under Discussion:** Active review and design iteration with the user.
* **Approved:** Formally approved by the user; ready for promotion.
* **Implemented:** Promoted to specs/plans and executed in code.

## The Idea Graph (Spin-off & Link)

When an emerging idea, architectural blocker, or cross-cutting concern arises mid-design:

1. **Do not bloat the current file:** Avoid burying unrelated concerns in sub-sections.
2. **Spin off a new scratch file:** Create a new topic file (e.g. `database-transaction-isolation.md`).
3. **Link back to the origin:** Add cross-references at the top of both files:
   * In new file: `Origin: [distributed-cache.md](distributed-cache.md)`
   * In origin file: `Sub-topic / Blocker: [database-transaction-isolation.md](database-transaction-isolation.md)`

This builds a bidirectional graph of ideas and blockers that can be traced to close all design gaps.

## Non-Negotiable Boundaries

During scratch-file work:

* **Never Touch Implementation Code:** Do not create or edit production source code in target repositories. Draft all code snippets inside the scratch file.
* **Never Modify Canonical Specifications:** Do not edit existing `docs/specs/features/*.feature` files or released design docs. Draft proposed Gherkin scenarios inside the scratch file.

## Code Snippet Standards

All code examples drafted in scratch files set precedent for future implementation and must be production-grade:

1. **Full & Concrete Examples:** Write complete, self-contained examples including imports/dependencies, struct/interface/class definitions, and caller call sites. Avoid lazy pseudocode fragments or hollow stubs.
2. **Language-Agnostic Clean Code Naming:**
   * **No Cryptic Abbreviations:** Prohibit single-letter and truncated variables (`req`, `res`, `tx`, `val`, `cfg`, `q`, `t`, `s`, `m`, `f`, `b`, `d`, `err`). Use intention-revealing names (`request`, `response`, `databaseTransaction`, `modelValue`, `configuration`, `boundQueries`, `queryError`).
   * **Descriptive Generics:** Name type parameters by role (e.g., `[Model, SerializedResult]`) rather than placeholders (`[T, R]`).
   * **Intentional Call Sites:** Clarify caller context, error handling, and parameter roles.

Read `references/code-snippets.md` for complete, production-grade clean code examples across Go, Ruby, Python, and TypeScript.

## Approval & Promotion Lifecycle

```text
[Draft / Under Discussion]
          │
          ▼  (Explicit User Approval)
     [Approved]
          │
          ├───► 1. Extract BDD Scenarios to docs/specs/features/*.feature
          ├───► 2. Extract Architecture & Contracts to docs/ or README.md
          ├───► 3. Extract Implementation Tasks into Execution Plan
          │
          ▼
    [Implemented] (Retain scratch file as permanent design rationale)
```

1. **User Approval Gate:** Present the scratch file to the user for explicit approval before exiting design mode.
2. **Promotion:** After approval:
   * Extract testable behaviors into formal `.feature` files.
   * Extract durable system patterns into permanent documentation.
   * Break tasks into an implementation plan.
3. **Retention:** Never delete approved scratch files. Update their status to `Implemented` and retain them as historical design rationale.

## Quick Reference

| Decision / Situation | Required Action |
|---|---|
| Where to store notes | `docs/scratchfiles/` if present, else `docs/scratch-files/` |
| What to name file | Kebab-case topic slug: `[topic-name].md` |
| Status header | Must have `Status: Draft \| Under Discussion \| Approved \| Implemented` |
| New blocker/idea mid-design | Spin off a new scratch file and link back to origin |
| User asks to edit code or specs | Stop. Keep drafts in scratch file until approved |
| Writing code examples | Complete, self-contained examples with Clean Code naming |
| Design completed | Ask user for explicit approval before promoting |

## Red Flags - STOP and Correct

* Creating notes in `tmp/`, `notes/`, or the repo root.
* Abbreviating variable names (`req`, `res`, `tx`, `cfg`, `err`).
* Modifying production code or canonical `.feature` files during drafting.
* Cramming emerging cross-cutting concerns into a single giant document.
* Deleting scratch files after implementation instead of marking `Status: Implemented`.
