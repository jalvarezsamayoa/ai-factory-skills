import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, rm, readdir, readFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { parseFactoryArgs, runFactoryAction } from "../dist/factory.js"
import { createWorkspace } from "../dist/workspace.js"
import { installFactory } from "../dist/install.js"

test("parseFactoryArgs handles subcommands and options", () => {
  assert.deepEqual(parseFactoryArgs("help"), {
    action: "help",
    name: undefined,
    harness: undefined,
    global: false,
    force: false,
  })

  assert.deepEqual(parseFactoryArgs("workspace my-feature"), {
    action: "workspace",
    name: "my-feature",
    harness: undefined,
    global: false,
    force: false,
  })

  assert.deepEqual(parseFactoryArgs("init claude --force"), {
    action: "init",
    name: undefined,
    harness: "claude",
    global: false,
    force: true,
  })

  assert.deepEqual(parseFactoryArgs("/factory init antigravity -g"), {
    action: "init",
    name: undefined,
    harness: "antigravity",
    global: true,
    force: false,
  })
})

test("createWorkspace generates required templates", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "factory-test-ws-"))
  try {
    const res = await createWorkspace({ target: tempDir, name: "payment-flow" })
    assert.match(res.directory, /payment-flow$/)
    const files = await readdir(res.directory)
    assert.ok(files.includes("brief.md"))
    assert.ok(files.includes("plan.md"))
    assert.ok(files.includes("contract.md"))
    assert.ok(files.includes("state.json"))
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
})

test("installFactory installs to target harnesses correctly", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "factory-test-inst-"))
  try {
    const results = await installFactory({
      harnesses: ["opencode", "claude", "antigravity"],
      target: tempDir,
      force: true,
    })

    assert.ok(results.length > 0)

    const ocAgents = await readdir(join(tempDir, ".opencode/agents"))
    assert.ok(ocAgents.includes("contrarian.md"))
    assert.ok(ocAgents.includes("contractor.md"))
    assert.ok(ocAgents.includes("software-reviewer.md"))
    assert.ok(ocAgents.includes("security-reviewer.md"))
    assert.ok(ocAgents.includes("bug-hunter.md"))

    const claudeAgents = await readdir(join(tempDir, ".claude/agents"))
    assert.ok(claudeAgents.includes("contrarian.md"))

    const agyPluginDir = join(tempDir, ".agents/plugins/factory")
    const agyPluginFiles = await readdir(agyPluginDir)
    assert.ok(agyPluginFiles.includes("plugin.json"))

    const pluginJson = JSON.parse(await readFile(join(agyPluginDir, "plugin.json"), "utf8"))
    assert.equal(pluginJson.name, "factory")

    const agySkills = await readdir(join(agyPluginDir, "skills/factory"))
    assert.ok(agySkills.includes("SKILL.md"))

    const agyBugHunting = await readdir(join(agyPluginDir, "skills/bug-hunting"))
    assert.ok(agyBugHunting.includes("SKILL.md"))

    const agyFieldNotes = await readdir(join(agyPluginDir, "skills/field-notes"))
    assert.ok(agyFieldNotes.includes("SKILL.md"))

    const agyScratchFiles = await readdir(join(agyPluginDir, "skills/scratch-files"))
    assert.ok(agyScratchFiles.includes("SKILL.md"))

    const agyWorklog = await readdir(join(agyPluginDir, "skills/worklog"))
    assert.ok(agyWorklog.includes("SKILL.md"))

    const ocSkills = await readdir(join(tempDir, ".opencode/skills/bug-hunting"))
    assert.ok(ocSkills.includes("SKILL.md"))

    const ocFieldNotes = await readdir(join(tempDir, ".opencode/skills/field-notes"))
    assert.ok(ocFieldNotes.includes("SKILL.md"))

    const ocScratchFiles = await readdir(join(tempDir, ".opencode/skills/scratch-files"))
    assert.ok(ocScratchFiles.includes("SKILL.md"))

    const ocWorklog = await readdir(join(tempDir, ".opencode/skills/worklog"))
    assert.ok(ocWorklog.includes("SKILL.md"))

    const agyRules = await readFile(join(agyPluginDir, "rules/AGENTS.md"), "utf8")
    assert.match(agyRules, /## Agent: contrarian/)
    assert.match(agyRules, /## Agent: contractor/)
    assert.match(agyRules, /## Agent: software-reviewer/)
    assert.match(agyRules, /## Agent: security-reviewer/)
    assert.match(agyRules, /## Agent: bug-hunter/)
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
})
