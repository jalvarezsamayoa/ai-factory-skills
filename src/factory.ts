import { describeInstall, installFactory, type Harness } from "./install.js"
import { createWorkspace, describeWorkspace } from "./workspace.js"

export type FactoryAction = "help" | "workspace" | "init"

export interface FactoryRequest {
  action: FactoryAction
  /** Workspace name for `workspace`, or a harness shorthand for `init`. */
  name?: string
  harness?: Harness | "all"
  global?: boolean
  force?: boolean
  /** Project directory. Defaults to the process working directory. */
  directory?: string
}

export async function runFactoryAction(request: FactoryRequest): Promise<string> {
  const directory = request.directory ?? process.cwd()

  switch (request.action) {
    case "help":
      return HELP

    case "workspace": {
      const workspace = await createWorkspace({
        target: directory,
        name: request.name,
        force: request.force,
      })
      return describeWorkspace(workspace, directory)
    }

    case "init": {
      const harnesses = resolveHarnesses(request.harness)
      const results = await installFactory({
        harnesses,
        target: directory,
        global: request.global,
        force: request.force,
      })
      return [
        describeInstall(results, request.global ? "your home directory" : directory),
        "",
        "Agents are discovered from files, so reload the harness if they do not appear immediately.",
      ].join("\n")
    }
  }
}

export function parseFactoryArgs(input: string): FactoryRequest {
  const tokens = tokenize(input)

  if (tokens[0] === "/factory" || tokens[0] === "factory") {
    tokens.shift()
  }

  let action: FactoryAction = "help"
  let name: string | undefined
  let harness: Harness | "all" | undefined
  let global = false
  let force = false

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (token === undefined) continue

    if (token === "--global" || token === "-g") {
      global = true
    } else if (token === "--force" || token === "-f") {
      force = true
    } else if (token === "--harness" || token === "-H") {
      harness = asHarness(tokens[index + 1])
      index += 1
    } else if (token === "help" || token === "workspace" || token === "init") {
      action = token
    } else if (!token.startsWith("-") && name === undefined) {
      name = token
    }
  }

  if (action === "init" && harness === undefined && name !== undefined) {
    const candidate = asHarness(name)
    if (candidate) {
      harness = candidate
      name = undefined
    }
  } else if (action === "help" && name !== undefined) {
    // `/factory my-change` is a convenient shorthand for a workspace name.
    action = "workspace"
  }

  return { action, name, harness, global, force }
}

export const HELP = `Factory — AI software development factory

Usage
  /factory help
  /factory workspace [name]
  /factory init [harness] [--global] [--force]

Commands
  help                 Show this help.
  workspace [name]     Create factory/workspaces/<name>/ with the brief, plan,
                       contract, review, bug, and state templates. Default: default.
  init [harness]       Install the factory agents, skill, and command files.
                       Harnesses: opencode, claude, antigravity, all.
                       Default: opencode. Use --global for the user config,
                       and --force to overwrite files you have edited.

Agents
  contrarian           Challenges assumptions and argues for a safer or simpler plan.
  contractor           Implements an approved plan and contract.
  software-reviewer    Reviews correctness, maintainability, tests, and regressions.
  security-reviewer    Reviews authn/authz, input handling, secrets, and dependencies.
  bug-hunter           Reproduces failures, finds root causes, and adds regression tests.

Skill
  factory              The phase-by-phase workflow that coordinates the agents.

Workspace layout
  factory/workspaces/<name>/
    brief.md           Problem, goals, non-goals, constraints, success signals
    plan.md            Approach, alternatives, steps, risks, rollback, decisions
    contract.md        Deliverables, acceptance criteria, quality gates
    reviews/           software.md and security.md
    bugs/              Reproduction notes and failing tests
    state.json         Current phase

Setup
  OpenCode: add "@jalvarezsamayoa/factory" to "plugins" in opencode.jsonc.
  Claude:   npx @jalvarezsamayoa/factory init claude
  Antigravity: npx @jalvarezsamayoa/factory init antigravity

Run /factory workspace to start, then /factory help to review the workflow.
`

function resolveHarnesses(value: FactoryRequest["harness"]): Harness[] {
  if (value === undefined) return ["opencode"]
  if (value === "all") return ["opencode", "claude", "antigravity"]
  return [value]
}

function asHarness(value: string | undefined): Harness | "all" | undefined {
  if (value === "opencode" || value === "claude" || value === "antigravity" || value === "all") {
    return value
  }
  return undefined
}

function tokenize(input: string): string[] {
  const tokens: string[] = []
  const pattern = /"([^"]*)"|'([^']*)'|(\S+)/g
  let match: RegExpExecArray | null

  while ((match = pattern.exec(input)) !== null) {
    tokens.push(match[1] ?? match[2] ?? match[3] ?? "")
  }

  return tokens
}
