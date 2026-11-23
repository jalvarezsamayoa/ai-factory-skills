import { mkdir, readFile, readdir, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import { dirname, join, relative, resolve } from "node:path"
import { AGENTS_DIR, COMMANDS_DIR, SKILLS_DIR } from "./content.js"

export type Harness = "opencode" | "claude" | "antigravity"
export type InstallKind = "agents" | "skills" | "commands" | "rules" | "plugin"
export type WriteStatus = "created" | "updated" | "unchanged" | "skipped"

export interface HarnessPaths {
  agents?: string
  skills: string
  commands?: string
  rules?: string
  plugin?: string
}

export interface HarnessTargets {
  project: HarnessPaths
  global: HarnessPaths
}

/**
 * Discovery locations documented by each harness.
 *
 * - OpenCode: `.opencode/{agents,skills,commands}` and `~/.config/opencode/...`
 * - Claude Code: `.claude/{agents,skills,commands}` and `~/.claude/...`
 * - Antigravity: `.agents/skills/`, `.agents/rules/`, and `.agents/plugins/factory`
 *   (or `~/.gemini/config/...` for global).
 *   Antigravity discovers skills under `skills/`, contextual rules under `rules/AGENTS.md`,
 *   or bundled as a full plugin with `plugin.json`.
 */
export const HARNESSES: Record<Harness, HarnessTargets> = {
  opencode: {
    project: {
      agents: ".opencode/agents",
      skills: ".opencode/skills",
      commands: ".opencode/commands",
    },
    global: {
      agents: ".config/opencode/agents",
      skills: ".config/opencode/skills",
      commands: ".config/opencode/commands",
    },
  },
  claude: {
    project: {
      agents: ".claude/agents",
      skills: ".claude/skills",
      commands: ".claude/commands",
    },
    global: {
      agents: ".claude/agents",
      skills: ".claude/skills",
      commands: ".claude/commands",
    },
  },
  antigravity: {
    project: {
      skills: ".agents/skills",
      rules: ".agents/rules",
      plugin: ".agents/plugins/factory",
    },
    global: {
      skills: ".gemini/config/skills",
      rules: ".gemini/config/rules",
      plugin: ".gemini/config/plugins/factory",
    },
  },
}

export interface InstallOptions {
  harnesses: Harness[]
  /** Project directory. Ignored when `global` is true. */
  target?: string
  /** Install into the user's home directory instead of the project. */
  global?: boolean
  /** Overwrite files the user may have edited. */
  force?: boolean
  /** Defaults to all kinds the harness supports. */
  kinds?: InstallKind[]
  /** Package content root. Defaults to the real package root. */
  sourceRoot?: string
}

export interface InstallResult {
  harness: Harness
  kind: InstallKind
  source: string
  target: string
  status: WriteStatus
}

export async function installFactory(options: InstallOptions): Promise<InstallResult[]> {
  const sourceRoot = options.sourceRoot ?? resolve(AGENTS_DIR, "..")
  const target = options.global ? homedir() : (options.target ?? process.cwd())
  const kinds = options.kinds ?? ["agents", "skills", "commands", "rules", "plugin"]
  const results: InstallResult[] = []

  for (const harness of options.harnesses) {
    const paths = options.global ? HARNESSES[harness].global : HARNESSES[harness].project

    if (harness === "antigravity") {
      if (kinds.includes("plugin") && paths.plugin) {
        // Install complete Antigravity plugin bundle:
        // plugin.json, skills/*, rules/AGENTS.md
        const version = await readPackageVersion(sourceRoot)
        const pluginJsonContent = JSON.stringify(
          {
            name: "factory",
            description: "Factory workflow, subagents, and tools for AI-driven software development",
            version,
          },
          null,
          2,
        ) + "\n"

        results.push(
          await writeContentResult(
            harness,
            "plugin",
            "plugin.json",
            join(target, paths.plugin, "plugin.json"),
            pluginJsonContent,
            options.force === true,
          ),
        )

        results.push(
          ...(await copyTree(
            harness,
            "skills",
            join(sourceRoot, "skills", "factory"),
            join(target, paths.plugin, "skills", "factory"),
            options.force === true,
          )),
        )

        results.push(
          ...(await copyTree(
            harness,
            "skills",
            join(sourceRoot, "skills", "bug-hunting"),
            join(target, paths.plugin, "skills", "bug-hunting"),
            options.force === true,
          )),
        )

        results.push(
          ...(await copyTree(
            harness,
            "skills",
            join(sourceRoot, "skills", "field-notes"),
            join(target, paths.plugin, "skills", "field-notes"),
            options.force === true,
          )),
        )

        results.push(
          ...(await copyTree(
            harness,
            "skills",
            join(sourceRoot, "skills", "scratch-files"),
            join(target, paths.plugin, "skills", "scratch-files"),
            options.force === true,
          )),
        )

        results.push(
          ...(await copyTree(
            harness,
            "skills",
            join(sourceRoot, "skills", "worklog"),
            join(target, paths.plugin, "skills", "worklog"),
            options.force === true,
          )),
        )

        const compiledAgentsRule = await buildAntigravityAgentsRule(join(sourceRoot, "agents"))
        results.push(
          await writeContentResult(
            harness,
            "rules",
            "agents/AGENTS.md",
            join(target, paths.plugin, "rules", "AGENTS.md"),
            compiledAgentsRule,
            options.force === true,
          ),
        )
      } else {
        if (kinds.includes("skills")) {
          results.push(
            ...(await copyTree(
              harness,
              "skills",
              join(sourceRoot, "skills", "factory"),
              join(target, paths.skills, "factory"),
              options.force === true,
            )),
          )
          results.push(
            ...(await copyTree(
              harness,
              "skills",
              join(sourceRoot, "skills", "bug-hunting"),
              join(target, paths.skills, "bug-hunting"),
              options.force === true,
            )),
          )
          results.push(
            ...(await copyTree(
              harness,
              "skills",
              join(sourceRoot, "skills", "field-notes"),
              join(target, paths.skills, "field-notes"),
              options.force === true,
            )),
          )
          results.push(
            ...(await copyTree(
              harness,
              "skills",
              join(sourceRoot, "skills", "scratch-files"),
              join(target, paths.skills, "scratch-files"),
              options.force === true,
            )),
          )
          results.push(
            ...(await copyTree(
              harness,
              "skills",
              join(sourceRoot, "skills", "worklog"),
              join(target, paths.skills, "worklog"),
              options.force === true,
            )),
          )
        }

        if (kinds.includes("rules") && paths.rules) {
          const compiledAgentsRule = await buildAntigravityAgentsRule(join(sourceRoot, "agents"))
          results.push(
            await writeContentResult(
              harness,
              "rules",
              "agents/AGENTS.md",
              join(target, paths.rules, "AGENTS.md"),
              compiledAgentsRule,
              options.force === true,
            ),
          )
        }
      }
      continue
    }

    if (kinds.includes("agents") && paths.agents) {
      for (const file of await listMarkdown(join(sourceRoot, "agents"))) {
        results.push(
          await copyFile(
            harness,
            "agents",
            join(sourceRoot, "agents", file),
            join(target, paths.agents, file),
            options.force === true,
          ),
        )
      }
    }

    if (kinds.includes("skills")) {
      results.push(
        ...(await copyTree(
          harness,
          "skills",
          join(sourceRoot, "skills", "factory"),
          join(target, paths.skills, "factory"),
          options.force === true,
        )),
      )
      results.push(
        ...(await copyTree(
          harness,
          "skills",
          join(sourceRoot, "skills", "bug-hunting"),
          join(target, paths.skills, "bug-hunting"),
          options.force === true,
        )),
      )
      results.push(
        ...(await copyTree(
          harness,
          "skills",
          join(sourceRoot, "skills", "field-notes"),
          join(target, paths.skills, "field-notes"),
          options.force === true,
        )),
      )
      results.push(
        ...(await copyTree(
          harness,
          "skills",
          join(sourceRoot, "skills", "scratch-files"),
          join(target, paths.skills, "scratch-files"),
          options.force === true,
        )),
      )
      results.push(
        ...(await copyTree(
          harness,
          "skills",
          join(sourceRoot, "skills", "worklog"),
          join(target, paths.skills, "worklog"),
          options.force === true,
        )),
      )
    }

    if (kinds.includes("commands") && paths.commands) {
      const command = join(sourceRoot, "commands", "factory.md")
      results.push(
        await copyFile(
          harness,
          "commands",
          command,
          join(target, paths.commands, "factory.md"),
          options.force === true,
        ),
      )
    }
  }

  return results
}

export function describeInstall(results: InstallResult[], target: string): string {
  const counts = new Map<WriteStatus, number>()
  for (const result of results) {
    counts.set(result.status, (counts.get(result.status) ?? 0) + 1)
  }

  const summary = (["created", "updated", "unchanged", "skipped"] as WriteStatus[])
    .filter((status) => (counts.get(status) ?? 0) > 0)
    .map((status) => `${counts.get(status)} ${status}`)
    .join(", ")

  const lines = [
    `Factory content installed in ${target}`,
    "",
    summary || "Nothing to install.",
  ]

  const skipped = results.filter((result) => result.status === "skipped")
  if (skipped.length > 0) {
    lines.push(
      "",
      "Skipped files differ from the packaged version. Re-run with --force to overwrite:",
      ...skipped.map((result) => `  ${relative(target, result.target)}`),
    )
  }

  return lines.join("\n")
}

async function copyTree(
  harness: Harness,
  kind: InstallKind,
  source: string,
  target: string,
  force: boolean,
): Promise<InstallResult[]> {
  const results: InstallResult[] = []
  const entries = await readdir(source, { withFileTypes: true })

  for (const entry of entries) {
    const sourcePath = join(source, entry.name)
    const targetPath = join(target, entry.name)
    if (entry.isDirectory()) {
      results.push(...(await copyTree(harness, kind, sourcePath, targetPath, force)))
    } else if (entry.isFile()) {
      results.push(await copyFile(harness, kind, sourcePath, targetPath, force))
    }
  }

  return results
}

async function copyFile(
  harness: Harness,
  kind: InstallKind,
  source: string,
  target: string,
  force: boolean,
): Promise<InstallResult> {
  const content = await readFile(source, "utf8")
  const status = await writeIfChanged(target, content, force)
  return { harness, kind, source, target, status }
}

async function writeContentResult(
  harness: Harness,
  kind: InstallKind,
  source: string,
  target: string,
  content: string,
  force: boolean,
): Promise<InstallResult> {
  const status = await writeIfChanged(target, content, force)
  return { harness, kind, source, target, status }
}

async function buildAntigravityAgentsRule(agentsDir: string): Promise<string> {
  const files = await listMarkdown(agentsDir)
  const sections: string[] = [
    "# Factory Subagents & Rules",
    "",
    "This rule defines the personas, capabilities, and behavioral rules for",
    "the factory subagents when coordinating work under the factory workflow.",
    "",
  ]

  for (const file of files) {
    const filePath = join(agentsDir, file)
    const raw = await readFile(filePath, "utf8")
    const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
    const body = match && match[2] ? match[2].trim() : raw.trim()
    const name = file.replace(/\.md$/, "")

    sections.push(`## Agent: ${name}`, "", body, "")
  }

  return sections.join("\n").trimEnd() + "\n"
}

async function writeIfChanged(target: string, content: string, force: boolean): Promise<WriteStatus> {
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

async function listMarkdown(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name)
    .sort()
}

async function readPackageVersion(sourceRoot: string): Promise<string> {
  try {
    const raw = await readFile(join(sourceRoot, "package.json"), "utf8")
    const parsed = JSON.parse(raw) as { version?: unknown }
    return typeof parsed.version === "string" && parsed.version.length > 0 ? parsed.version : "0.1.0"
  } catch {
    return "0.1.0"
  }
}
