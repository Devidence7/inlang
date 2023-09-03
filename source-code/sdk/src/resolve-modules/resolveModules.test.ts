/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { MessageLintRule } from "@inlang/message-lint-rule"
import type { Plugin } from "@inlang/plugin"
import { describe, expect, it } from "vitest"
import type { InlangModule } from "./types.js"
import { ModuleError, ModuleHasNoExportsError, ModuleImportError } from "./errors.js"
import { resolveModules } from "./resolveModules.js"
import type { ProjectConfig } from "@inlang/project-config"

describe("generally", () => {
	it("should return an error if a plugin cannot be imported", async () => {
		const config: ProjectConfig = {
			sourceLanguageTag: "en",
			languageTags: ["de", "en"],
			modules: ["https://myplugin.com/index.js"],
			settings: {},
		}

		const resolved = await resolveModules({
			config,
			nodeishFs: {} as any,
			_import: () => {
				throw new ModuleImportError("Could not import", {
					module: config.modules[0]!,
					cause: new Error("Could not import"),
				})
			},
		})

		expect(resolved.errors[0]).toBeInstanceOf(ModuleImportError)
	})
})

describe("resolveModules", () => {
	it("should resolve plugins and message lint rules successfully", async () => {
		// Define mock data
		const mockPlugin: Plugin = {
			meta: {
				id: "plugin.namespace.mock",
				description: { en: "Mock plugin description" },
				displayName: { en: "Mock Plugin" },
			},
			loadMessages: () => undefined as any,
			saveMessages: () => undefined as any,
			addCustomApi: () => ({
				"app.inlang.ideExtension": {
					messageReferenceMatcher: () => undefined as any,
				},
			}),
		}

		const mockMessageLintRule: MessageLintRule = {
			meta: {
				id: "messageLintRule.namespace.mock",
				description: { en: "Mock lint rule description" },
				displayName: { en: "Mock Lint Rule" },
			},
			message: () => undefined,
		}

		const config: ProjectConfig = {
			sourceLanguageTag: "en",
			languageTags: ["de", "en"],
			modules: ["lint-rule.js", "plugin.js"],
			settings: {},
		}

		const _import = async (name: string) => {
			if (name === "lint-rule.js") {
				return {
					default: mockMessageLintRule,
				}
			} else {
				return {
					default: mockPlugin,
				}
			}
		}

		// Call the function
		const resolved = await resolveModules({ config, _import, nodeishFs: {} as any })

		// Assert results
		expect(resolved.errors).toHaveLength(0)
		// Check for the meta data of the plugin
		expect(resolved.plugins.some((module) => module.meta.id === mockPlugin.meta.id)).toBeDefined()
		// Check for the app specific api
		expect(resolved.resolvedPluginApi["customApi"]?.["app.inlang.ideExtension"]).toBeDefined()
		// Check for the lint rule
		expect(resolved.messageLintRules[0]?.meta.id).toBe(mockMessageLintRule.meta.id)
	})

	it("should return an error if a plugin cannot be imported", async () => {
		const config: ProjectConfig = {
			sourceLanguageTag: "en",
			languageTags: ["de", "en"],
			modules: ["https://myplugin.com/index.js"],
			settings: {},
		}

		const _import = async () => {
			throw new ModuleImportError("Could not import", {
				module: config.modules[0]!,
				cause: new Error(),
			})
		}

		// Call the function
		const resolved = await resolveModules({ config, _import, nodeishFs: {} as any })

		// Assert results
		expect(resolved.errors[0]).toBeInstanceOf(ModuleImportError)
	})

	it("should return an error if a plugin does not export any plugins or lint rules", async () => {
		const config: ProjectConfig = {
			sourceLanguageTag: "en",
			languageTags: ["de", "en"],
			modules: ["https://myplugin.com/index.js"],
			settings: {},
		}

		const _import = async () => ({
			default: {},
		})

		// Call the function
		const resolved = await resolveModules({ config, _import, nodeishFs: {} as any })

		// Assert results
		expect(resolved.errors[0]).toBeInstanceOf(ModuleHasNoExportsError)
	})

	it("should handle other unhandled errors during plugin resolution", async () => {
		const errorMessage = "Unhandled error during plugin resolution"
		const config: ProjectConfig = {
			sourceLanguageTag: "en",
			languageTags: ["de", "en"],
			modules: ["https://myplugin.com/index.js"],
			settings: {},
		}

		const _import = async () => {
			throw new Error(errorMessage)
		}

		// Call the function
		const resolved = await resolveModules({ config, _import, nodeishFs: {} as any })

		// Assert results
		expect(resolved.errors[0]).toBeInstanceOf(ModuleError)
	})
})
