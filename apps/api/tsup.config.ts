import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node22",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  external: ["firebase-admin", "express", "cors", "@google-cloud/pubsub", "@trpc/server", "zod"],
  noExternal: ["@material-tracking/shared"],
  onSuccess: async () => {
    const pkg = {
      name: "material-tracking-api",
      type: "module",
      main: "index.js",
      engines: { node: "22" },
      dependencies: {
        "firebase-admin": "^13.7.0",
        express: "^5.1.0",
        cors: "^2.8.5",
        "@google-cloud/pubsub": "^5.3.0",
        "@trpc/server": "^11.16.0",
        zod: "^4.3.6",
      },
    };
    const fs = await import("node:fs");
    await fs.promises.writeFile("dist/package.json", JSON.stringify(pkg, null, 2));
  },
});
