import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	base: '',
	server: {
		port: 9173,
		proxy: {},
	},
	plugins: [solid(), tsconfigPaths()],
});
