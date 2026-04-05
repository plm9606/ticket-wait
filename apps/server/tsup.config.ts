import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  splitting: false,
  clean: true,
  outDir: "dist",
  noExternal: ["@concert-alert/shared"],
});
