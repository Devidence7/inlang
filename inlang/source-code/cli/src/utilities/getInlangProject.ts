import fs from "node:fs/promises"
import { loadProject, type InlangProject } from "@inlang/sdk"
import { telemetry } from "../services/telemetry/implementation.js"
import { resolve } from "node:path"
import { openRepository, findRepoRoot } from "@lix-js/client"

/**
 * Gets the inlang project and exists if the project contains errors.
 */
export async function getInlangProject(args: { projectPath: string }): Promise<InlangProject> {
	const baseDirectory = process.cwd()
	const projectPath = resolve(baseDirectory, args.projectPath)

	const repoRoot = await findRepoRoot({ nodeishFs: fs, path: projectPath })

	let project
	if (!repoRoot) {
		console.error(
			`Could not find repository root for path ${projectPath}, falling back to direct fs access`
		)

		project = await loadProject({
			projectPath,
			nodeishFs: fs,
			_capture(id, props) {
				telemetry.capture({
					// @ts-ignore the event types
					event: id,
					properties: props,
				})
			},
		})
	} else {
		const repo = await openRepository(repoRoot, {
			nodeishFs: fs,
		})

		project = await loadProject({
			projectPath,
			repo,
			_capture(id, props) {
				telemetry.capture({
					// @ts-ignore the event types
					event: id,
					properties: props,
				})
			},
		})
	}

	if (project.errors().length > 0) {
		for (const error of project.errors()) {
			console.error(error)
		}
		process.exit(1)
	}
	return project
}
