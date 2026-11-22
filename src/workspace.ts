import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"

export interface WorkspaceOptions {
  /** Project directory. */
  target: string
  /** Workspace name. Defaults to `default`. */
  name?: string
  /** Overwrite existing workspace files. */
  force?: boolean
}

export interface WorkspaceResult {
  directory: string
  files: Array<{ path: string; status: "created" | "updated" | "unchanged" | "skipped" }>
}

export async function createWorkspace(options: WorkspaceOptions): Promise<WorkspaceResult> {
  const name = options.name?.trim() || "default"
  const slug = slugify(name)
  const directory = join(options.target, "factory", "workspaces", slug)
  const now = new Date().toISOString()

  const files: Record<string, string> = {
    "brief.md": briefTemplate(name),
    "plan.md": planTemplate(),
    "contract.md": contractTemplate(),
    "reviews/software.md": softwareReviewTemplate(),
    "reviews/security.md": securityReviewTemplate(),
    "bugs/README.md": bugsTemplate(),
    "state.json": `${JSON.stringify(
      {
        name,
        slug,
        phase: "intake",
        createdAt: now,
        updatedAt: now,
      },
      null,
      2,
    )}\n`,
  }

  const result: WorkspaceResult = { directory, files: [] }

  const rootReadme = join(options.target, "factory", "README.md")
  const rootStatus = await writeIfChanged(rootReadme, factoryReadmeTemplate(), options.force === true)
  if (rootStatus !== "unchanged") {
    result.files.push({ path: rootReadme, status: rootStatus })
  }

  for (const [relativePath, content] of Object.entries(files)) {
    const path = join(directory, relativePath)
    const status = await writeIfChanged(path, content, options.force === true)
    result.files.push({ path, status })
  }

  return result
}

export function describeWorkspace(result: WorkspaceResult, target: string): string {
  const created = result.files.filter((file) => file.status === "created").length
  const updated = result.files.filter((file) => file.status === "updated").length
  const skipped = result.files.filter((file) => file.status === "skipped").length

  const lines = [
    `Factory workspace ready: ${result.directory}`,
    "",
    `${created} created, ${updated} updated, ${skipped} skipped.`,
    "",
    "Next steps:",
    `  1. Fill in ${join(result.directory, "brief.md")}.`,
    "  2. Ask the contrarian agent to challenge the brief.",
    "  3. Write the plan and contract before implementation.",
    "  4. Delegate the build to the contractor, then run both reviewers.",
  ]

  if (skipped > 0) {
    lines.push("", "Skipped existing files. Re-run with --force to overwrite them.")
  }

  return lines.join("\n")
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return slug || "default"
}

async function writeIfChanged(
  target: string,
  content: string,
  force: boolean,
): Promise<"created" | "updated" | "unchanged" | "skipped"> {
  let existing: string | undefined

  try {
    existing = await readFile(target, "utf8")
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
  }

  if (existing === content) return "unchanged"
  if (existing !== undefined && !force) return "skipped"

  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, content, "utf8")
  return existing === undefined ? "created" : "updated"
}

function factoryReadmeTemplate(): string {
  return `# Factory

This directory holds the artifacts for factory workspaces. Each change gets
one workspace under \`workspaces/<name>/\`:

\`\`\`text
factory/
└── workspaces/
    └── default/
        ├── brief.md          Problem, goals, constraints
        ├── plan.md           Approach, steps, risks, decisions
        ├── contract.md       Deliverables and acceptance criteria
        ├── reviews/
        │   ├── software.md   Software review findings
        │   └── security.md   Security review findings
        ├── bugs/             Reproduction notes and failing tests
        └── state.json        Current phase
\`\`\`

## Phases

1. **Intake** — write the brief.
2. **Challenge** — the contrarian agent stress-tests the brief and plan.
3. **Contract** — write the plan and acceptance criteria.
4. **Build** — the contractor agent implements the contract.
5. **Review** — software-reviewer and security-reviewer review independently.
6. **Harden** — the bug-hunter agent reproduces and fixes failures.
7. **Ship** — verify the contract and close the workspace.

Create a workspace with \`/factory workspace <name>\` or \`factory workspace <name>\`.
`
}

function briefTemplate(name: string): string {
  return `# Brief: ${name}

## Change

<!-- One paragraph. What are we changing and why now? -->

## Problem

<!-- What is broken, missing, or expensive today? Include evidence. -->

## Goals

- 

## Non-goals

- 

## Constraints

- Technical:
- Product:
- Time and budget:

## Users and impact

<!-- Who is affected, and how do we know? -->

## Success signals

<!-- Observable outcomes, not activities. -->

## Open questions

- 
`
}

function planTemplate(): string {
  return `# Plan

## Approach

<!-- The chosen approach in a few sentences. -->

## Alternatives considered

| Option | Why not |
| --- | --- |
|  |  |

## Steps

1. 
2. 
3. 

## Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
|  |  |  |  |

## Rollback

<!-- How do we undo this safely? -->

## Decisions

<!-- Append dated decisions. Do not rewrite history. -->
`
}

function contractTemplate(): string {
  return `# Contract

## Deliverables

- [ ] 
- [ ] 

## Acceptance criteria

<!-- Use Given/When/Then. Every criterion must be checkable. -->

- **Given** 
  **When** 
  **Then** 

## Quality gates

- [ ] Unit tests cover the new behavior.
- [ ] Relevant integration or end-to-end tests pass.
- [ ] Software review has no blocking findings.
- [ ] Security review has no blocking findings.
- [ ] Documentation is updated when behavior changes.
- [ ] Rollback is documented and tested where practical.

## Out of scope

- 
`
}

function softwareReviewTemplate(): string {
  return `# Software review

Status: pending

## Blocking findings

<!-- file:line, problem, why it blocks, concrete fix -->

## Non-blocking findings

## Test gaps

## Verdict

<!-- approve | approve with follow-ups | request changes -->
`
}

function securityReviewTemplate(): string {
  return `# Security review

Status: pending

## Threat model

<!-- Assets, trust boundaries, attacker capabilities. -->

## Blocking findings

<!-- severity, CWE/OWASP, exploit scenario, remediation -->

## Non-blocking findings

## Verdict

<!-- approve | approve with follow-ups | request changes -->
`
}

function bugsTemplate(): string {
  return `# Bugs

Record each defect in its own file, for example \`BUG-001.md\`:

\`\`\`md
# BUG-001: <short title>

## Reproduction
1. 

## Expected
## Actual
## Root cause
## Failing test
## Fix
## Regression risk
\`\`\`
`
}
