import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { getPagesContext } from "./pages-context.mjs";

const { basePath, siteUrl } = getPagesContext();

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const nextCli = fileURLToPath(
  new URL("../node_modules/next/dist/bin/next", import.meta.url),
);

console.log(`Exportando RoyalPath para ${siteUrl}`);
console.log(`Base path: ${basePath || "/"}`);

const result = spawnSync(process.execPath, [nextCli, "build"], {
  cwd: projectRoot,
  env: {
    ...process.env,
    DEPLOY_TARGET: "github-pages",
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_SITE_URL: siteUrl,
  },
  stdio: "inherit",
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
