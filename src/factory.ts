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
        harness: request.harness === "all" ? undefined : request.harness,
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

export const HELP = `Factory - AI software development factory

Usage
  /factory help
  /factory workspace [workspace_id] [--harness <opencode|claude|antigravity>] [--force]
  /factory init [harness] [--global] [--force]

Commands
  help                       Show this help.
  workspace [workspace_id]   Create <cwd>/<workspace_id>/ with AGENTS.md, worklog.org,
                             .envrc, .tool-versions, docs/{backlog,scratch-files},
                             repos/, tmp/, and <harness-dir>/field-notes.md.
                             Default: default.
  init [harness]             Install the factory agents, skills, and command files.
                             Harnesses: opencode, claude, antigravity, all.
                             Default: opencode. Use --global for the user config,
                             and --force to overwrite files you have edited.

Agents
  contrarian                 Challenges assumptions and argues for a safer or simpler plan.
  contractor                 Pressure-tests procedures, tickets, and contracts.
  software-reviewer          Reviews correctness, complexity, maintainability, and tests.
  security-reviewer          Reviews authn/authz, input handling, secrets, and dependencies.
  bug-hunter                 Proves defects with executable tests or reproduction scripts.

Skills
  factory                    Eight-gate software development workflow.
  bug-hunting                Empirical, execution-backed bug hunting methodology.
  field-notes                Read-before-planning and write-on-failure notes protocol.
  scratch-files              Pre-plan design drafts under docs/scratch-files/.
  worklog                    Cross-repo coordination via uncommitted worklog.org.

Workspace layout
  <workspace_id>/
    AGENTS.md                Workspace instructions + managed factory block
    worklog.org              Live Org-mode Mission Control tracker
    .envrc                   Empty direnv file
    .tool-versions           Empty tool-versions file
    <harness-dir>/           field-notes.md (.opencode/, .claude/, or .agents/)
    docs/backlog/README.md   Durable Org-mode backlog guide and templates
    docs/scratch-files/      Pre-plan notes and design drafts
    repos/                   Target git repositories
    tmp/                     Temporary files and scripts

Setup
  OpenCode:    add "@jalvarezsamayoa/factory" to "plugins" in opencode.jsonc.
  Claude:      npx @jalvarezsamayoa/factory init claude
  Antigravity: npx @jalvarezsamayoa/factory init antigravity

Run /factory workspace <workspace_id> to start, then /factory help to review the workflow.
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
