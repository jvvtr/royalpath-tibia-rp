import assert from "node:assert/strict";
import test from "node:test";

import {
  BIS_CONTEXTS,
  CONTENT_NOTICE,
  GUIDES,
  HUNTS,
  ITEMS,
  LAST_VERIFIED,
  MILESTONES,
  PROGRESSION_BANDS,
  SOURCES,
} from "../app/content.ts";

test("content covers the complete Royal Paladin journey", () => {
  assert.equal(LAST_VERIFIED, "2026-07-28");
  assert.ok(MILESTONES.length >= 15);
  assert.equal(MILESTONES[0].level, 8);
  assert.ok(MILESTONES.some((milestone) => milestone.level >= 1_000));

  assert.equal(PROGRESSION_BANDS[0].minLevel, 8);
  assert.equal(
    PROGRESSION_BANDS.at(-1).maxLevel,
    null,
    "the final band must remain open-ended",
  );

  for (let index = 1; index < PROGRESSION_BANDS.length; index += 1) {
    const previous = PROGRESSION_BANDS[index - 1];
    const current = PROGRESSION_BANDS[index];
    assert.ok(
      previous.maxLevel === null ||
        current.minLevel === previous.maxLevel + 1,
      `progression gap around ${current.levelLabel}`,
    );
  }
});

test("every recommendation carries visible provenance", () => {
  const recommendations = [
    ...MILESTONES,
    ...PROGRESSION_BANDS,
    ...HUNTS,
    ...ITEMS,
    ...BIS_CONTEXTS,
    ...GUIDES,
  ];

  for (const entry of recommendations) {
    assert.match(entry.sourceUrl, /^https:\/\//);
    assert.ok(entry.sourceName.length > 4);
    assert.equal(entry.verifiedAt, LAST_VERIFIED);
    assert.ok(["alta", "média", "baixa"].includes(entry.confidence));
    assert.ok(entry.patch.length > 4);
  }
});

test("post-rebalance hunt metrics are intentionally conservative", () => {
  assert.ok(HUNTS.length >= 15);
  for (const hunt of HUNTS) {
    assert.ok(hunt.tips.length >= 2);
    assert.match(hunt.sourceUrl, /^https:\/\//);

    if (hunt.minLevel > 80 && hunt.id !== "girtablilu") {
      assert.equal(hunt.metricStatus, "sem-faixa-pos-rebalance");
      assert.match(`${hunt.xp} ${hunt.loot}`, /reteste|sem faixa|—/i);
    }
  }

  const girtablilu = HUNTS.find((hunt) => hunt.id === "girtablilu");
  assert.ok(girtablilu);
  assert.equal(girtablilu.metricStatus, "teste-comunitario");
});

test("simulator catalog has compatible weapons, ammunition and modern BIS", () => {
  const ids = new Set(ITEMS.map((item) => item.id));
  assert.equal(ids.size, ITEMS.length);
  assert.ok(ITEMS.some((item) => item.slot === "weapon"));
  assert.ok(ITEMS.some((item) => item.slot === "ammo"));
  assert.ok(ids.has("diamond-arrow"));
  assert.ok(ids.has("spectral-bolt"));
  assert.ok(ids.has("soulbleeder"));
  assert.ok(ids.has("moonsilver-bow"));
  assert.ok(ITEMS.some((item) => item.minLevel >= 1_000));
});

test("the app makes its AI and non-profit status explicit", () => {
  const disclosure = JSON.stringify(CONTENT_NOTICE);
  assert.match(disclosure, /100% por IA/i);
  assert.match(disclosure, /sem fins lucrativos/i);
  assert.match(disclosure, /não oficial/i);
  assert.ok(SOURCES.length >= 12);
});

test("Portuguese content is valid Unicode, not mojibake", () => {
  const content = JSON.stringify({
    CONTENT_NOTICE,
    MILESTONES,
    PROGRESSION_BANDS,
    HUNTS,
    ITEMS,
    GUIDES,
  });
  assert.doesNotMatch(content, /Ã.|â€|ðŸ|�/);
});
