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
	},
	plugins: [
		devtools(),
		tanstackStart(),
		react(),
		nitro({
			preset: process.env.VERCEL ? "vercel" : "node-server",
			rollupConfig: { external: [/^@sentry\//] },
			serverDir: "server",
		}),
		tsconfigPaths({ projects: ["./tsconfig.json"] }),
		tailwindcss(),
	],
});

export default config;
