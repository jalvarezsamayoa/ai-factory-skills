import { join } from "node:path"
import { Plugin, Skill } from "@opencode/plugin"
import { readText, SKILLS_DIR, splitFrontmatter, frontmatterValue } from "./content.js"
import { runFactoryAction, parseFactoryArgs, type FactoryAction } from "./factory.js"
import { installFactory } from "./install.js"

interface FactoryPluginOptions {
  /**
   * Install the factory agents into the project's `.opencode/agents/` folder
   * when the plugin loads. Agents cannot be added through the agent transform,
   * so file installation is the only way to make them available.
   *
   * - `true` or `"project"`: install into the current project.
   * - `"global"`: install into `~/.config/opencode/agents/`.
   * - `false` or omitted: do nothing; run `/factory init` instead.
   */
  installAgents?: boolean | "project" | "global"
}

interface FactoryToolInput {
  action: FactoryAction
  name?: string
  harness?: "opencode" | "claude" | "antigravity" | "all"
  global?: boolean
  force?: boolean
}

const factoryToolInput = {
  type: "object",
  properties: {
    action: {
      type: "string",
      enum: ["help", "workspace", "init"],
      description: "The factory control action to run.",
    },
    name: {
      type: "string",
      description: "Workspace name for `workspace`. Defaults to `default`.",
    },
    harness: {
      type: "string",
      enum: ["opencode", "claude", "antigravity", "all"],
      description: "Harness to install content for when action is `init`.",
    },
    global: {
      type: "boolean",
      description: "Install into the user home config instead of the project.",
    },
    force: {
      type: "boolean",
      description: "Overwrite files the user may have edited.",
    },
  },
  required: ["action"],
  additionalProperties: false,
} as const

export default Plugin.define({
  id: "jalvarezsamayoa.factory",

  async setup(ctx) {
    const directory = ctx.location.project?.canonical ?? ctx.location.directory
    const skillDirectory = join(SKILLS_DIR, "factory")
    const skillFile = join(skillDirectory, "SKILL.md")
    const { frontmatter, body } = splitFrontmatter(await readText(skillFile))

    const bugHuntingDir = join(SKILLS_DIR, "bug-hunting")
    const bugHuntingFile = join(bugHuntingDir, "SKILL.md")
    const bugHuntingContent = splitFrontmatter(await readText(bugHuntingFile))

    const fieldNotesDir = join(SKILLS_DIR, "field-notes")
    const fieldNotesFile = join(fieldNotesDir, "SKILL.md")
    const fieldNotesContent = splitFrontmatter(await readText(fieldNotesFile))

    const scratchFilesDir = join(SKILLS_DIR, "scratch-files")
    const scratchFilesFile = join(scratchFilesDir, "SKILL.md")
    const scratchFilesContent = splitFrontmatter(await readText(scratchFilesFile))

    const worklogDir = join(SKILLS_DIR, "worklog")
    const worklogFile = join(worklogDir, "SKILL.md")
    const worklogContent = splitFrontmatter(await readText(worklogFile))

    await ctx.skill.transform((editor) => {
      editor.add({
        id: Skill.ID.make("factory"),
        name: Skill.Name.make(frontmatterValue(frontmatter, "name") ?? "factory"),
        description:
          frontmatterValue(frontmatter, "description") ??
          "Run the software development factory workflow from intake to ship.",
        path: Skill.Info.fields.path.make(skillDirectory),
        content: body,
      })

      editor.add({
        id: Skill.ID.make("bug-hunting"),
        name: Skill.Name.make(frontmatterValue(bugHuntingContent.frontmatter, "name") ?? "bug-hunting"),
        description:
          frontmatterValue(bugHuntingContent.frontmatter, "description") ??
          "Hunt for bugs in a codebase using empirical, execution-backed verification.",
        path: Skill.Info.fields.path.make(bugHuntingDir),
        content: bugHuntingContent.body,
      })

      editor.add({
        id: Skill.ID.make("field-notes"),
        name: Skill.Name.make(frontmatterValue(fieldNotesContent.frontmatter, "name") ?? "field-notes"),
        description:
          frontmatterValue(fieldNotesContent.frontmatter, "description") ??
          "Loads the read-before-planning and write-on-failure protocol for .opencode/field-notes.md.",
        path: Skill.Info.fields.path.make(fieldNotesDir),
        content: fieldNotesContent.body,
      })

      editor.add({
        id: Skill.ID.make("scratch-files"),
        name: Skill.Name.make(frontmatterValue(scratchFilesContent.frontmatter, "name") ?? "scratch-files"),
        description:
          frontmatterValue(scratchFilesContent.frontmatter, "description") ??
          "Isolated, exploratory workspace for writing notes, drafting ideas, and visualizing designs.",
        path: Skill.Info.fields.path.make(scratchFilesDir),
        content: scratchFilesContent.body,
      })

      editor.add({
        id: Skill.ID.make("worklog"),
        name: Skill.Name.make(frontmatterValue(worklogContent.frontmatter, "name") ?? "worklog"),
        description:
          frontmatterValue(worklogContent.frontmatter, "description") ??
          "Coordinate work, personal todos, topic backlogs, and Jira tickets through worklog.org.",
        path: Skill.Info.fields.path.make(worklogDir),
        content: worklogContent.body,
      })
    })

    await ctx.command.transform((editor) => {
      editor.add({
        name: "factory",
        description: "Factory control plane: help, workspace, init",
        execute: async ({ sessionID, prompt }) => {
          const result = await runFactoryAction({
            ...parseFactoryArgs(prompt.text),
            directory,
          })
          await ctx.session.synthetic({ sessionID, text: result })
        },
      })
    })

    await ctx.tool.transform((editor) => {
      editor.add({
        name: "factory",
        description:
          "Run factory control actions: show help, create a factory workspace, or install the factory agents and skill files.",
        input: factoryToolInput as never,
        execute: async (input) => {
          const request = input as FactoryToolInput
          const result = await runFactoryAction({
            action: request.action ?? "help",
            name: request.name,
            harness: request.harness,
            global: request.global,
            force: request.force,
            directory,
          })
          return { content: result }
        },
      })
    })

    const installAgents = ctx.options.installAgents as FactoryPluginOptions["installAgents"]
    if (installAgents === true || installAgents === "project" || installAgents === "global") {
      await installFactory({
        harnesses: ["opencode"],
        target: directory,
        global: installAgents === "global",
        force: false,
        kinds: ["agents"],
      })
      await ctx.agent.reload().catch(() => undefined)
    }
  },
})
