import { createSignal, onMount, Show } from "solid-js"
import { Layout as RootLayout } from "../Layout.jsx"
import { Meta, Title } from "@solidjs/meta"
import { CommunityProjects } from "../index/CommunityProjects.jsx"
import { Button } from "../index/components/Button.jsx"
import { useI18n } from "@solid-primitives/i18n"
import { defaultLanguage } from "#src/renderer/_default.page.route.js"
import { InstallationProvider } from "./InstallationProvider.jsx"

//! TEST LINK: http://localhost:3000/install?repo=github.com/floriandwt/inlang-ide-next-demo&module=https://cdn.jsdelivr.net/npm/@inlang/plugin-json@3/dist/index.js,https://cdn.jsdelivr.net/npm/@inlang/plugin-json@3/dist/index.js

export function Page() {
	/** is not reactive because window is not reactive */
	const [input, setInput] = createSignal("")
	const [tourStep, setTourStep] = createSignal(0)
	const [, { locale }] = useI18n()

	const url = new URLSearchParams(window.location.search)
	const repo = url.get("repo") || ""
	const modules = url.get("module")?.split(",") || []

	const getLocale = () => {
		const language = locale() || defaultLanguage
		return language !== defaultLanguage ? "/" + language : ""
	}

	function validateInstallation() {
		if (!repo || !modules) return false

		return true
	}

	return (
		<>
			<Title>inlang Install</Title>
			<Meta
				name="description"
				content="Contribute to open source projects and manage translations with inlang's editor."
			/>
			<Meta name="og:image" content="/images/inlang-social-image.jpg" />
			<RootLayout>
				<div class="py-16">
					<Show when={validateInstallation()} fallback={<ConfigureInstallation />}>
						<InstallationProvider repo={repo} modules={modules}>
							<ShowInstallation />
						</InstallationProvider>
					</Show>
				</div>
			</RootLayout>
		</>
	)
}

function ShowInstallation() {
	return (
		<div class="flex flex-col items-center justify-center min-h-screen gap-16 pb-64">
			{/* Loading spinner */}
			<div class="relative h-24 w-24 animate-spin">
				<div class="h-full w-full bg-background border-primary border-4 rounded-full" />
				<div class="h-1/2 w-1/2 absolute top-0 left-0 z-5 bg-background" />
			</div>
			<h2 class="text-[24px] leading-tight md:text-2xl font-semibold text-center">
				Installing your modules…
			</h2>
		</div>
	)
}

function ConfigureInstallation() {
	return (
		<div>
			<h2 class="text-[24px] leading-tight md:text-2xl font-semibold mb-8">
				Installing your modules…
			</h2>
			<CommunityProjects justShowRecent />
		</div>
	)
}
