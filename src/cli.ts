#!/usr/bin/env node
import { parseFactoryArgs, runFactoryAction } from "./factory.js"

async function main(): Promise<void> {
  const input = process.argv.slice(2).join(" ")

  if (input === "--help" || input === "-h") {
    console.log(await runFactoryAction({ action: "help" }))
    return
  }

  const request = parseFactoryArgs(input)
  const result = await runFactoryAction({ ...request, directory: process.cwd() })
  console.log(result)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
