/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, expect, test } from "vitest"
import type { Message } from "@inlang/message"
import { missingTranslationRule } from "./missingTranslation.js"
import { lintSingleMessage } from "@inlang/sdk/lint"

const message1: Message = {
	id: "1",
	selectors: [],
	variants: [
		{ languageTag: "en", match: {}, pattern: [{ type: "Text", value: "Inlang" }] },
		{ languageTag: "de", match: {}, pattern: [{ type: "Text", value: "Inlang" }] },
		{ languageTag: "es", match: {}, pattern: [] },
		{ languageTag: "cn", match: {}, pattern: [{ type: "Text", value: "" }] },
	],
}

const messages = [message1]

test("should not report if all messages are present", async () => {
	const result = await lintSingleMessage({
		sourceLanguageTag: "en",
		languageTags: ["en", "de"],
		ruleLevels: {
			[missingTranslationRule.meta.id]: "warning",
		},
		ruleSettings: {},
		messages,
		message: message1,
		rules: [missingTranslationRule],
	})

	expect(result.errors).toHaveLength(0)
	expect(result.data).toHaveLength(0)
})

test("should report if a languageTag is not present", async () => {
	const result = await lintSingleMessage({
		sourceLanguageTag: "en",
		languageTags: ["en", "it"],
		ruleLevels: {
			[missingTranslationRule.meta.id]: "warning",
		},
		ruleSettings: {},
		messages,
		message: message1,
		rules: [missingTranslationRule],
	})

	expect(result.errors).toHaveLength(0)
	expect(result.data).toHaveLength(1)
	expect(result.data[0]!.languageTag).toBe("it")
})

test("should report if no variants are defined", async () => {
	const result = await lintSingleMessage({
		sourceLanguageTag: "en",
		languageTags: ["en", "fr"],
		ruleLevels: {
			[missingTranslationRule.meta.id]: "warning",
		},
		ruleSettings: {},
		messages,
		message: message1,
		rules: [missingTranslationRule],
	})

	expect(result.errors).toHaveLength(0)
	expect(result.data).toHaveLength(1)
	expect(result.data[0]!.languageTag).toBe("fr")
})

describe("reported by emptyPattern lintRule", () => {
	test("should not report if no patterns are defined", async () => {
		const result = await lintSingleMessage({
			sourceLanguageTag: "en",
			languageTags: ["en", "es"],
			ruleLevels: {
				[missingTranslationRule.meta.id]: "warning",
			},
			ruleSettings: {},
			messages,
			message: message1,
			rules: [missingTranslationRule],
		})

		expect(result.errors).toHaveLength(0)
		expect(result.data).toHaveLength(0)
	})

	test("should not report if a message has a pattern with only one text element that is an empty string", async () => {
		const result = await lintSingleMessage({
			sourceLanguageTag: "en",
			languageTags: ["en", "cn"],
			ruleLevels: {
				[missingTranslationRule.meta.id]: "warning",
			},
			ruleSettings: {},
			messages,
			message: message1,
			rules: [missingTranslationRule],
		})

		expect(result.errors).toHaveLength(0)
		expect(result.data).toHaveLength(0)
	})
})
