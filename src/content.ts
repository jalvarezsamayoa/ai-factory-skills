import { readFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

/**
 * Package root, resolved from this module. Works both from `src/` during
 * development and from `dist/` after a build, because both live one level
 * below the package root.
 */
export const PACKAGE_ROOT = dirname(dirname(fileURLToPath(import.meta.url)))

export const AGENTS_DIR = join(PACKAGE_ROOT, "agents")
export const SKILLS_DIR = join(PACKAGE_ROOT, "skills")
export const COMMANDS_DIR = join(PACKAGE_ROOT, "commands")

export async function readText(path: string): Promise<string> {
  return readFile(path, "utf8")
}

export interface SplitMarkdown {
  frontmatter: string
  body: string
}

/**
 * Split a Markdown document into YAML frontmatter and body. OpenCode derives
 * skill metadata from frontmatter, but the skill `content` registered by a
 * plugin must be the body only.
 */
export function splitFrontmatter(markdown: string): SplitMarkdown {
  const normalized = markdown.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n")
  if (!normalized.startsWith("---\n")) {
    return { frontmatter: "", body: normalized.trim() }
  }

  const end = normalized.indexOf("\n---", 4)
  if (end === -1) {
    return { frontmatter: "", body: normalized.trim() }
  }

  const after = normalized.indexOf("\n", end + 4)
  return {
    frontmatter: normalized.slice(4, end).trim(),
    body: (after === -1 ? "" : normalized.slice(after + 1)).trim(),
  }
}

/**
 * Read a frontmatter value without pulling in a YAML parser. The shipped
 * files only use single-line scalar values.
 */
export function frontmatterValue(frontmatter: string, key: string): string | undefined {
  for (const line of frontmatter.split("\n")) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (match && match[1] === key) {
      return match[2]?.replace(/^["']|["']$/g, "").trim()
    }
  }
  return undefined
}
