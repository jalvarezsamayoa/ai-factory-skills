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

test("createWorkspace scaffolds <cwd>/<workspace_id>/ layout", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "factory-test-ws-"))
  try {
    const res = await createWorkspace({ target: tempDir, name: "JIRA-123", harness: "antigravity" })
    assert.equal(res.directory, join(tempDir, "JIRA-123"))

    const rootEntries = await readdir(res.directory)
    assert.ok(rootEntries.includes("AGENTS.md"))
    assert.ok(rootEntries.includes("worklog.org"))
    assert.ok(rootEntries.includes(".envrc"))
    assert.ok(rootEntries.includes(".tool-versions"))
    assert.ok(rootEntries.includes("docs"))
    assert.ok(rootEntries.includes("repos"))
    assert.ok(rootEntries.includes("tmp"))
    assert.ok(rootEntries.includes(".agents"))

    const docsEntries = await readdir(join(res.directory, "docs"))
    assert.ok(docsEntries.includes("backlog"))
    assert.ok(docsEntries.includes("scratch-files"))
    assert.ok(!docsEntries.includes("confluence"))

    const backlogEntries = await readdir(join(res.directory, "docs", "backlog"))
    assert.ok(backlogEntries.includes("README.md"))

    const fieldNotes = await readFile(join(res.directory, ".agents", "field-notes.md"), "utf8")
    assert.match(fieldNotes, /# Field Notes/)
    assert.match(fieldNotes, /FN-\[NUMBER\]/)

    assert.equal(await readFile(join(res.directory, ".envrc"), "utf8"), "")
    assert.equal(await readFile(join(res.directory, ".tool-versions"), "utf8"), "")

    const agentsMd = await readFile(join(res.directory, "AGENTS.md"), "utf8")
    assert.match(agentsMd, /^# JIRA-123/m)
    assert.match(agentsMd, /@.agents\/field-notes\.md/)
    assert.match(agentsMd, /<!-- factory:begin -->/)
    assert.match(agentsMd, /<!-- factory:end -->/)
    assert.match(agentsMd, /software-reviewer/)
    assert.doesNotMatch(agentsMd, /docs\/confluence/)

    const worklog = await readFile(join(res.directory, "worklog.org"), "utf8")
    assert.match(worklog, /\* Queue/)

    // Second run without force skips existing modified files
    const second = await createWorkspace({ target: tempDir, name: "JIRA-123", harness: "antigravity" })
    assert.ok(second.files.every((file) => file.status === "unchanged"))
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
})

test("createWorkspace maps harness hidden folders and rejects unsafe workspace IDs", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "factory-test-ws-harness-"))
  try {
    const oc = await createWorkspace({ target: tempDir, name: "oc-ws", harness: "opencode" })
    assert.ok((await readdir(join(oc.directory, ".opencode"))).includes("field-notes.md"))

    const claude = await createWorkspace({ target: tempDir, name: "cl-ws", harness: "claude" })
    assert.ok((await readdir(join(claude.directory, ".claude"))).includes("field-notes.md"))

    await assert.rejects(() => createWorkspace({ target: tempDir, name: "../escape" }), /Invalid workspace/)
    await assert.rejects(() => createWorkspace({ target: tempDir, name: "a/b" }), /Invalid workspace/)
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
