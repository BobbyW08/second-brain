import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const config = defineConfig({
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
		// Add explicit extensions to help with resolution
		extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json"],
	},
	build: {
		rollupOptions: {
			external: [/^@sentry\//],
		},
		// Ensure proper module resolution
		commonjsOptions: {
			transformMixedEsModules: true,
		},
	},
	plugins: [
		devtools(),
		tanstackStart(),
		react({
			// Ensure proper handling of import paths
			babel: {
				plugins: [
					[
						"module-resolver",
						{
							root: ["./src"],
							alias: {
								"@": "./src",
							},
						},
					],
				],
			},
		}),
		nitro({}),
		tsconfigPaths({ projects: ["./tsconfig.json"] }),
		tailwindcss(),
	],
});

export default config;
