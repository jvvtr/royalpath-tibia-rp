import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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
  assert.match(html, /DPS estimado/);
  assert.match(html, /Estimativa comparativa em 1 alvo/);
  assert.match(html, /Armadura e proteção física/);
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

  assert.ok(manifest.items.length >= 555, "o catálogo publicado deveria permanecer completo");
  assert.equal(new Set(manifest.items.map(({ id }) => id)).size, manifest.items.length);
  assert.ok(manifest.items.every(({ id }) => typeof id === "string" && id.length > 0));
  assert.ok(
    manifest.items.every(
      ({ width, height, sha256 }) =>
        width === 32 &&
        height === 32 &&
        /^[a-f0-9]{64}$/.test(sha256),
    ),
    "todo sprite deveria declarar dimensões 32x32 e hash SHA-256",
  );

  const publishedSpriteIds = (await readdir(join(out, "items")))
    .filter((name) => name.endsWith(".png"))
    .map((name) => name.slice(0, -4))
    .sort();
  const manifestIds = manifest.items.map(({ id }) => id).sort();
  assert.deepEqual(
    publishedSpriteIds,
    manifestIds,
    "não deveria haver sprite faltante ou órfão",
  );

  await Promise.all(
    manifest.items.map(async ({ id, sha256 }) => {
      await assertNonEmpty(`items/${id}.png`);
      const contents = await readFile(join(out, "items", `${id}.png`));
      assert.equal(
        createHash("sha256").update(contents).digest("hex"),
        sha256,
        `hash divergente para ${id}.png`,
      );
    }),
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
