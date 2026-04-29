import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
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
		react(),
		tsconfigPaths({ projects: ["./tsconfig.json"] }),
		tailwindcss(),
	],
});

export default config;
