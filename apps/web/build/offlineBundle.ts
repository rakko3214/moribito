import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import type { Plugin } from "vite";

export function offlineBundle(): Plugin {
  let outDir = "";
  let template = "";
  return {
    name: "moribito-offline-bundle",
    apply: "build",
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
      template = readFileSync(join(config.publicDir, "sw.js"), "utf8");
    },
    closeBundle() {
      const files: string[] = [];
      const visit = (directory: string) => {
        for (const entry of readdirSync(directory, { withFileTypes: true })) {
          const path = join(directory, entry.name);
          if (entry.isDirectory()) visit(path);
          else if (entry.isFile() && entry.name !== "sw.js" && !entry.name.endsWith(".map")) files.push(path);
        }
      };
      visit(outDir);
      files.sort();
      const hash = createHash("sha256").update(template);
      const urls = files.map((file) => {
        const path = relative(outDir, file).replaceAll("\\", "/");
        hash.update(path).update(readFileSync(file));
        return path === "index.html" ? "/" : `/${path}`;
      });
      const worker = template
        .replace('"moribito-shell-v2"', JSON.stringify(`moribito-shell-${hash.digest("hex").slice(0, 16)}`))
        .replace('["/", "/manifest.webmanifest", "/app-icon.svg"]', JSON.stringify(urls));
      writeFileSync(join(outDir, "sw.js"), worker);
    },
  };
}
