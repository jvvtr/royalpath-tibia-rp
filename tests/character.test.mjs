import assert from "node:assert/strict";
import test from "node:test";

import {
  aggregateProtections,
  calculateArmorReduction,
  calculateCharacterProfile,
  calculateCharacterStats,
  parseProtection,
  royalPaladinCapacity,
  royalPaladinHitPoints,
  royalPaladinMana,
} from "../lib/character.ts";

test("Royal Paladin formulas start at level 8", () => {
  assert.equal(royalPaladinHitPoints(8), 185);
  assert.equal(royalPaladinMana(8), 90);
  assert.equal(royalPaladinCapacity(8), 470);

  assert.equal(royalPaladinHitPoints(100), 1_105);
  assert.equal(royalPaladinMana(100), 1_470);
  assert.equal(royalPaladinCapacity(100), 2_310);
});

test("character profile aggregates item attributes without app dependencies", () => {
  const stats = calculateCharacterStats({
    level: 200,
    distance: 105,
    magic: 30,
    items: [
      {
        id: "falcon-coif",
        name: "Falcon Coif",
        armor: 10,
        distance: 2,
        protection: ["físico +3%", "fogo +10%"],
      },
      {
        id: "flamingo-precision",
        armor: 4,
        distance: 4,
        magic: 1,
        protection: ["físico +5%", "fogo +14%"],
      },
      {
        id: "example-shield",
        defense: 37,
      },
    ],
  });

  assert.deepEqual(stats, {
    vocation: "Royal Paladin",
    level: 200,
    hp: 2_105,
    mana: 2_970,
    capacity: 4_310,
    armor: 14,
    defense: 37,
    distance: 111,
    magic: 31,
    protections: {
      physical: 7.85,
      fire: 22.6,
      earth: 0,
      energy: 0,
      ice: 0,
      holy: 0,
      death: 0,
      lifeDrain: 0,
      manaDrain: 0,
    },
    armorReduction: { min: 7, max: 13 },
  });

  assert.deepEqual(calculateCharacterProfile({
    level: 8,
    distance: 10,
    magic: 0,
  }), {
    vocation: "Royal Paladin",
    level: 8,
    hp: 185,
    mana: 90,
    capacity: 470,
    armor: 0,
    defense: 0,
    distance: 10,
    magic: 0,
    protections: {
      physical: 0,
      fire: 0,
      earth: 0,
      energy: 0,
      ice: 0,
      holy: 0,
      death: 0,
      lifeDrain: 0,
      manaDrain: 0,
    },
    armorReduction: { min: 0, max: 0 },
  });
});

test("protections compose multiplicatively, including duplicates in one item", () => {
  const protections = aggregateProtections([
    {
      protection: [
        "físico +10%",
        "físico +20%",
        "FOGO +10%",
        "terra +4,5%",
      ],
    },
    {
      protection: ["fogo +20%", "terra +5.5%", "speed +20"],
    },
  ]);

  assert.equal(protections.physical, 28);
  assert.equal(protections.fire, 28);
  assert.equal(protections.earth, 9.7525);
  assert.equal(protections.energy, 0);
  assert.equal(protections.lifeDrain, 0);
  assert.equal(protections.manaDrain, 0);

  assert.deepEqual(parseProtection("fisico +5%"), {
    type: "physical",
    percent: 5,
  });
  assert.equal(parseProtection("speed +20"), null);
});

test("life drain and mana drain protections are parsed and combined", () => {
  const protections = aggregateProtections([
    {
      protection: [
        "life drain +20%",
        "mana drain +30%",
      ],
    },
    {
      protection: [
        "dreno de vida +10%",
        "dreno de mana +5%",
      ],
    },
  ]);

  assert.equal(protections.lifeDrain, 28);
  assert.equal(protections.manaDrain, 33.5);
  assert.deepEqual(parseProtection("life drain +50%"), {
    type: "lifeDrain",
    percent: 50,
  });
  assert.deepEqual(parseProtection("dreno de mana +25%"), {
    type: "manaDrain",
    percent: 25,
  });
});

test("negative item penalties reduce the combined protection", () => {
  const protections = aggregateProtections([
    {
      protection: ["energia +8%", "gelo -2%"],
    },
    {
      protection: ["gelo +10%", "death -5%"],
    },
  ]);

  assert.equal(protections.energy, 8);
  assert.equal(protections.ice, 8.2);
  assert.equal(protections.death, -5);
});

test("armor reduction uses the declared integer range and never goes below zero", () => {
  assert.deepEqual(calculateArmorReduction(0), { min: 0, max: 0 });
  assert.deepEqual(calculateArmorReduction(1), { min: 0, max: 0 });
  assert.deepEqual(calculateArmorReduction(17), { min: 8, max: 15 });
  assert.deepEqual(calculateArmorReduction(24), { min: 12, max: 23 });
});

test("invalid character inputs fail explicitly", () => {
  assert.throws(
    () => calculateCharacterStats({
      level: 7,
      distance: 10,
      magic: 0,
    }),
    RangeError,
  );
  assert.throws(
    () => calculateCharacterStats({
      level: 8.5,
      distance: 10,
      magic: 0,
    }),
    RangeError,
  );
  assert.throws(
    () => calculateCharacterStats({
      level: 8,
      distance: Number.NaN,
      magic: 0,
    }),
    TypeError,
  );
  assert.throws(
    () => calculateCharacterStats({
      level: 8,
      distance: -1,
      magic: 0,
    }),
    RangeError,
  );
  assert.throws(
    () => calculateCharacterStats({
      level: 8,
      distance: 10,
      magic: 0,
      items: [{ armor: Number.POSITIVE_INFINITY }],
    }),
    TypeError,
  );
  assert.throws(
    () => calculateCharacterStats({
      level: 8,
      distance: 10,
      magic: 0,
      items: [{ defense: -1 }],
    }),
    RangeError,
  );
  assert.throws(
    () => aggregateProtections([
      { protection: ["fogo +101%"] },
    ]),
    RangeError,
  );
  assert.throws(
    () => aggregateProtections([
      { protection: [5] },
    ]),
    TypeError,
  );
  assert.throws(
    () => calculateArmorReduction(-1),
    RangeError,
  );
});
