import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: {
        accept: "text/html",
        host: "localhost",
        "x-forwarded-proto": "http",
      },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the RoyalPath application shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html[^>]+lang="pt-BR"/i);
  assert.match(html, /<title>RoyalPath — Guia Royal Paladin<\/title>/i);
  assert.match(html, /RoyalPath/);
  assert.match(html, /Seu Royal Paladin/);
  assert.match(html, /Guia para quem está começando/);
  assert.match(html, /Vida máxima/);
  assert.match(html, /Mana máxima/);
  assert.match(html, /DPS esperado/);
  assert.match(html, /Defesa do set/);
  assert.match(html, /projeto 100% produzido com IA/i);
  assert.match(html, /sem fins lucrativos/i);
  assert.match(html, /id="character-level"/);
  assert.match(html, /aria-label="Navegação principal"/);
});

test("production output has absolute social metadata and no starter residue", async () => {
  const response = await render();
  const html = await response.text();

  assert.match(
    html,
    /<meta[^>]+property="og:image"[^>]+content="http:\/\/localhost\/og\.png"/i,
  );
  assert.match(
    html,
    /<link[^>]+rel="icon"[^>]+href="http:\/\/localhost\/favicon\.png"/i,
  );
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|taking shape/i);
  assert.doesNotMatch(html, /react-loading-skeleton/i);
});
