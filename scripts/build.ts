import { cp, mkdir, rm } from "node:fs/promises";

const DIST = "dist";

await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });

const result = await Bun.build({
  entrypoints: ["src/content.ts", "src/popup.ts"],
  outdir: DIST,
  target: "browser",
  format: "iife",
  minify: false,
  sourcemap: "none"
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

await cp("manifest.json", `${DIST}/manifest.json`);
await cp("src/popup.html", `${DIST}/popup.html`);
await cp("LICENSE", `${DIST}/LICENSE`);

console.log(`Built ${result.outputs.length} files into ${DIST}/`);
