import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { getPagesContext } from "../scripts/pages-context.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const out = join(root, "out");
const { basePath, siteUrl } = getPagesContext();

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function assertNonEmpty(relativePath) {
  const file = await stat(join(out, relativePath));
  assert.ok(file.isFile(), `${relativePath} deveria ser um arquivo`);
  assert.ok(file.size > 0, `${relativePath} não deveria estar vazio`);
}

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? collectFiles(path) : [path];
    }),
  );
  return files.flat();
}

test("exporta um site estático completo para o GitHub Pages", async () => {
  await Promise.all(
    [
      "index.html",
      "404.html",
      "favicon.png",
      "og.png",
      ".nojekyll",
      "items/manifest.json",
    ].map(assertNonEmpty),
  );

  const staticFiles = await collectFiles(join(out, "_next", "static"));
  assert.ok(staticFiles.some((file) => file.endsWith(".js")));
  assert.ok(staticFiles.some((file) => file.endsWith(".css")));
});

test("prefixa os recursos locais e publica metadata absoluta", async () => {
  const html = await readFile(join(out, "index.html"), "utf8");

  assert.match(html, /<html[^>]+lang="pt-BR"/i);
  assert.match(html, /Vida máxima/);
  assert.match(html, /Mana máxima/);
  assert.match(html, /DPS esperado/);
  assert.match(html, /Defesa do set/);
  assert.match(
    html,
    new RegExp(`(?:href|src)="${escapeRegExp(basePath)}/_next/`),
  );
  assert.match(html, new RegExp(`${escapeRegExp(siteUrl)}og\\.png`));
  assert.match(
    html,
    new RegExp(`${escapeRegExp(siteUrl)}favicon\\.png`),
  );
  if (basePath) {
    assert.doesNotMatch(html, /(?:href|src)="\/_next\//);
    assert.doesNotMatch(html, /(?:href|src)="\/items\//);
  }
});

test("inclui todos os sprites usados pelo Arsenal", async () => {
  const manifest = JSON.parse(
    await readFile(join(out, "items", "manifest.json"), "utf8"),
  );

  assert.equal(manifest.items.length, 44);
  await Promise.all(
    manifest.items.map(({ id }) => assertNonEmpty(`items/${id}.png`)),
  );

  const emittedFiles = await collectFiles(join(out, "_next", "static"));
  const scripts = await Promise.all(
    emittedFiles
      .filter((file) => file.endsWith(".js"))
      .map((file) => readFile(file, "utf8")),
  );
  const spriteChunk = scripts.find((script) => script.includes("/items/"));
  assert.ok(spriteChunk, "o bundle deveria conter o caminho dos sprites");
  if (basePath) {
    assert.match(
      spriteChunk,
      new RegExp(`${escapeRegExp(basePath)}[\\s\\S]{0,300}/items/`),
    );
  }
});
