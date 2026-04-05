import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		babel({ presets: [reactCompilerPreset()] }),
		tailwindcss(),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"@domain": path.resolve(__dirname, "./src/domain"),
			"@app": path.resolve(__dirname, "./src/app"),
			"@infra": path.resolve(__dirname, "./src/infrastructure"),
			"@presentation": path.resolve(__dirname, "./src/presentation"),
			"@lib": path.resolve(__dirname, "./src/lib"),
			"@components": path.resolve(__dirname, "./src/presentation/components"),
			"@assets": path.resolve(__dirname, "./src/assets"),
		},
	},
});
