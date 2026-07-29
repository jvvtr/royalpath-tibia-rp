import assert from "node:assert/strict";
import test from "node:test";

const DEFAULT_SITE_URL =
  "https://royalpath-rp-guide.joaovitorvelloso88.chatgpt.site/";
const expectedSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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
  assert.match(html, /DPS estimado/);
  assert.match(html, /Estimativa comparativa em 1 alvo/);
  assert.match(html, /Armadura e proteção física/);
  assert.match(html, /valor bruto, não redução direta/);
  assert.match(html, /projeto 100% produzido com IA/i);
  assert.match(html, /sem fins lucrativos/i);
  assert.match(html, /id="character-level"/);
  assert.match(html, /aria-label="Navegação principal"/);
  assert.match(html, /Tutoriais/);
  assert.match(html, /Meu Paladin/);
  assert.match(html, /Manual do aventureiro/);
});

test("production output has absolute social metadata and no starter residue", async () => {
  const response = await render();
  const html = await response.text();
  const baseUrl = expectedSiteUrl.endsWith("/")
    ? expectedSiteUrl
    : `${expectedSiteUrl}/`;

  assert.match(
    html,
    new RegExp(
      `<meta[^>]+property="og:image"[^>]+content="${escapeRegExp(baseUrl)}og\\.png"`,
      "i",
    ),
  );
  assert.match(
    html,
    new RegExp(
      `<link[^>]+rel="icon"[^>]+href="${escapeRegExp(baseUrl)}favicon\\.png"`,
      "i",
    ),
  );
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|taking shape/i);
  assert.doesNotMatch(html, /react-loading-skeleton/i);
});
