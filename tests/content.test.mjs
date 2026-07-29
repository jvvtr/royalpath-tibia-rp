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
  assert.equal(LAST_VERIFIED, "2026-07-29");
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
  assert.ok(ITEMS.length >= 555, "the searchable Paladin catalog should stay complete");
  assert.ok(ITEMS.some((item) => item.slot === "weapon"));
  assert.ok(ITEMS.some((item) => item.slot === "ammo"));
  assert.ok(
    ITEMS.filter((item) => item.slot === "shield").length >= 58,
    "the catalog should include the synchronized shield selection",
  );
  assert.ok(ids.has("arrow"));
  assert.ok(ids.has("diamond-arrow"));
  assert.ok(ids.has("spectral-bolt"));
  assert.ok(ids.has("soulbleeder"));
  assert.ok(ids.has("moonsilver-bow"));
  assert.ok(ITEMS.some((item) => item.minLevel >= 1_000));

  const elvishBow = ITEMS.find((item) => item.id === "elvish-bow");
  assert.ok(elvishBow);
  assert.equal(elvishBow.hit, 3, "the synchronized Hit value must win");
  assert.match(elvishBow.summary, /hit \+3/i);

  const falconEscutcheon = ITEMS.find(
    (item) => item.id === "falcon-escutcheon",
  );
  assert.equal(falconEscutcheon?.defense, 52);
});

test("tutorials are beginner-first, searchable and carry practical metadata", () => {
  const required = [
    "offline-training",
    "promotion-stances",
    "blessings-death-protection",
    "quiver-and-ammunition",
    "imbuements",
    "protection-and-analyser",
    "bestiary-charms-prey",
    "wheel-of-destiny",
    "first-team-hunt",
  ];
  const ids = new Set(GUIDES.map((guide) => guide.id));

  for (const id of required) assert.ok(ids.has(id), `missing essential tutorial: ${id}`);
  for (const guide of GUIDES) {
    assert.ok(guide.estimatedTime.length > 2);
    assert.ok(guide.checklist.length >= 3);
    assert.ok(guide.warnings.length >= 1);
    assert.ok(["basico", "intermediario", "avancado"].includes(guide.difficulty));
    assert.ok(Number.isFinite(guide.minLevel));
  }
  assert.ok(GUIDES.filter((guide) => guide.essential).length >= 9);

  const sourceIds = new Set(SOURCES.map((source) => source.id));
  for (const guide of GUIDES) {
    for (const sourceId of guide.relatedSourceIds) {
      assert.ok(
        sourceIds.has(sourceId),
        `${guide.id} references missing source ${sourceId}`,
      );
    }
  }

  const imbuements = GUIDES.find((guide) => guide.id === "imbuements");
  assert.ok(imbuements);
  const imbuementText = JSON.stringify(imbuements);
  assert.match(imbuementText, /5 Piece of Dead Brain/);
  assert.match(imbuementText, /25 Sabretooth/);
  assert.match(imbuementText, /Desde 2025, o sucesso é 100%/i);
});

test("beginner tutorials state current official requirements and level gates", () => {
  const byId = new Map(GUIDES.map((guide) => [guide.id, guide]));
  const sourceById = new Map(SOURCES.map((source) => [source.id, source]));

  const firstHour = JSON.stringify(byId.get("primeira-hora-rp"));
  assert.match(firstHour, /antes eram aprendidas com trainers/i);
  assert.match(firstHour, /Wheel, quests, shrines ou NPCs específicos/i);

  const blessings = JSON.stringify(byId.get("blessings-death-protection"));
  assert.match(blessings, /amarelo significa pelo menos uma blessing/i);
  assert.match(blessings, /inventário também ficar amarelo/i);

  const rotation = JSON.stringify(byId.get("rotacao-area"));
  assert.match(rotation, /level 50.+Shatterstorm Arrow/i);
  assert.match(rotation, /Storm Arrows.+level 125/i);
  assert.match(rotation, /Diamond Arrow.+150/i);
  assert.match(rotation, /Ethereal Barrage.+level 60/i);
  assert.match(rotation, /Divine Barrage.+level 70/i);

  const charms = JSON.stringify(byId.get("bestiary-charms-prey"));
  assert.match(charms, /Major Charms.+entrada completa/i);
  assert.match(charms, /Minor Charms.+estágio 2/i);
  assert.equal(
    sourceById.get("official-charm-overhaul")?.url,
    "https://www.tibia.com/news/?id=8140&subtopic=newsarchive",
  );

  const sharedXp = JSON.stringify(byId.get("first-team-hunt"));
  assert.match(sharedXp, /pelo menos dois terços/i);
  assert.match(sharedXp, /no máximo 30 campos do líder/i);
  assert.equal(
    sourceById.get("official-shared-experience")?.url,
    "https://www.tibia.com/support/?entryid=92&subtopic=gethelp",
  );

  const imbuements = JSON.stringify(byId.get("imbuements"));
  assert.match(imbuements, /templo do seu mundo já estiver reconstruído/i);
  assert.match(imbuements, /helmet normalmente recebe Void ou Precision/i);

  const forge = JSON.stringify(byId.get("forge"));
  assert.match(forge, /mesma posição de equipamento \(body slot\) e do mesmo tier/i);
  assert.match(forge, /transfere o tier sem perder um nível/i);

  const proficiency = JSON.stringify(byId.get("weapon-proficiency"));
  assert.match(proficiency, /250 Dust.+Proficiency Level 3/i);
  assert.match(proficiency, /1\.000 Dust.+mastered/i);
  assert.match(proficiency, /menor valor/i);
  assert.equal(
    sourceById.get("official-weapon-proficiency-update")?.url,
    "https://www.tibia.com/news/?id=8850&subtopic=newsarchive",
  );
});

test("community hunt ranges are not labelled as post-rebalance retests", () => {
  const earlyHunts = HUNTS.filter((hunt) => hunt.minLevel <= 80);
  assert.ok(earlyHunts.length > 0);
  for (const hunt of earlyHunts) {
    assert.match(hunt.patch, /anteriores ao rebalance/i);
    assert.match(hunt.patch, /não retestadas/i);
  }
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
