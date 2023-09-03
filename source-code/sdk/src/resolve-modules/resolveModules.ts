import type { InlangModule, ResolveModuleFunction } from "./types.js"
import {
	ModuleError,
	ModuleImportError,
	ModuleHasNoExportsError,
	ModuleExportHasInvalidIdError,
} from "./errors.js"
import { tryCatch } from "@inlang/result"
import { resolveMessageLintRules } from "./message-lint-rules/resolveMessageLintRules.js"
import type { Plugin } from "@inlang/plugin"
import { createImport } from "./import.js"
import type { MessageLintRule } from "@inlang/message-lint-rule"
import { resolvePlugins } from "./plugins/resolvePlugins.js"

export const resolveModules: ResolveModuleFunction = async (args) => {
	const _import = args._import ?? createImport({ readFile: args.nodeishFs.readFile, fetch })
	const moduleErrors: Array<ModuleError> = []

	let allPlugins: Array<Plugin> = []
	let allMessageLintRules: Array<MessageLintRule> = []

	const meta: Awaited<ReturnType<ResolveModuleFunction>>["meta"] = []

	for (const module of args.config.modules) {
		/**
		 * -------------- BEGIN SETUP --------------
		 */

		const importedModule = await tryCatch<InlangModule>(() => _import(module))

		// -- IMPORT MODULE --
		if (importedModule.error) {
			moduleErrors.push(
				new ModuleImportError(`Couldn't import the plugin "${module}"`, {
					module: module,
					cause: importedModule.error as Error,
				}),
			)
			continue
		}

		// -- MODULE DOES NOT EXPORT PLUGINS OR LINT RULES --
		if (importedModule.data?.default?.meta?.id === undefined) {
			moduleErrors.push(
				new ModuleHasNoExportsError(`Module "${module}" has no exports.`, {
					module: module,
				}),
			)
			continue
		}

		// TODO: check if module is valid using typebox

		meta.push({
			module: module,
			id: importedModule.data.default.meta.id,
		})

		if (importedModule.data.default.meta.id.startsWith("plugin.")) {
			allPlugins.push(importedModule.data.default as Plugin)
		} else if (importedModule.data.default.meta.id.startsWith("messageLintRule.")) {
			allMessageLintRules.push(importedModule.data.default as MessageLintRule)
		} else {
			moduleErrors.push(
				new ModuleExportHasInvalidIdError(`Module "${module}" has an invalid id.`, {
					module: module,
				}),
			)
		}
	}

	const resolvedPlugins = await resolvePlugins({
		plugins: allPlugins,
		settings: args.config.settings as any, // TODO: fix type
		nodeishFs: args.nodeishFs,
	})

	const resolvedLintRules = resolveMessageLintRules({ messageLintRules: allMessageLintRules })

	return {
		meta,
		messageLintRules: allMessageLintRules,
		plugins: allPlugins,
		resolvedPluginApi: resolvedPlugins.data,
		errors: [...moduleErrors, ...resolvedLintRules.errors, ...resolvedPlugins.errors],
	}
}
