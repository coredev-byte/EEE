import { defineConfig } from "vitest/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Public files are otherwise served as URLs. Load this single canonical JSON
// contract as a virtual module so dev and production consume identical data.
const manifest = fileURLToPath(new URL("./public/assets/animations/manifest.json", import.meta.url));
const registryModule = "\0dz-asset-manifest";
export default defineConfig({
  plugins: [{
    name: "dz-asset-contract",
    enforce: "pre",
    resolveId(id) {
      if (id.endsWith("public/assets/animations/manifest.json")) return registryModule;
    },
    load(id) {
      if (id !== registryModule) return;
      this.addWatchFile(manifest);
      return `export default ${readFileSync(manifest, "utf8")};`;
    },
    handleHotUpdate(context) {
      if (context.file === manifest) {
        const module = context.server.moduleGraph.getModuleById(registryModule);
        if (module) context.server.moduleGraph.invalidateModule(module);
        context.server.ws.send({ type: "full-reload" });
        return [];
      }
    },
  }],
  test: { include: ["tests/*.test.ts"] },
});
