import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  target: "node22",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  external: ["firebase-admin", "firebase-functions", "@google-cloud/secret-manager", "@slack/web-api"],
  noExternal: ["@material-tracking/shared"],
  onSuccess: async () => {
    const pkg = {
      name: "material-tracking-functions",
      main: "index.cjs",
      engines: { node: "22" },
      dependencies: {
        "firebase-admin": "^13.7.0",
        "firebase-functions": "^7.2.2",
        "@google-cloud/secret-manager": "^6.1.1",
        "@slack/web-api": "^7.15.0",
      },
    };
    const fs = await import("node:fs");
    await fs.promises.writeFile("dist/package.json", JSON.stringify(pkg, null, 2));
  },
});
