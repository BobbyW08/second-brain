import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// FullCalendar v6 declares "sideEffects: false" but injects CSS at runtime.
// This plugin intercepts module resolution to force side effects for FC.
function fullcalendarSideEffects(): Plugin {
	return {
		name: "fullcalendar-side-effects",
		enforce: "pre",
		async resolveId(source, importer, options) {
			if (source.includes("@fullcalendar")) {
				const resolved = await this.resolve(source, importer, options);
				if (resolved) {
					return {
						...resolved,
						moduleSideEffects: true,
					};
				}
			}
			return null;
		},
	};
}

const config = defineConfig({
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
		extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json"],
	},
	build: {
		rollupOptions: {
			external: [/^@sentry\//],
		},
		commonjsOptions: {
			transformMixedEsModules: true,
		},
	},
	plugins: [
		devtools(),
		tanstackStart(),
		fullcalendarSideEffects(),
		react(),
		nitro({}),
		tsconfigPaths({ projects: ["./tsconfig.json"] }),
		tailwindcss(),
	],
});

export default config;
