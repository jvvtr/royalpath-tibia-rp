import assert from "node:assert/strict";
import test from "node:test";

import {
  DAMAGE_MODEL_VERSION,
  accuracyMultiplier,
  applyStanceEffects,
  baseDamage,
  combinedProcExpectedMultiplier,
  criticalExpectedMultiplier,
  estimateAutoAttack,
  estimateFourSecondCycle,
  estimateLevelAwareCycle,
  estimateLeech,
  estimateSpellProxy,
  onslaughtChance,
  onslaughtExpectedMultiplier,
  resistanceMultiplier,
} from "../lib/damage.ts";

const closeTo = (actual, expected, tolerance = 1e-9) => {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`,
  );
};

test("baseDamage reproduces deterministic level terms", () => {
  assert.equal(baseDamage(8), 1);
  assert.equal(baseDamage(400), 80);
  assert.equal(baseDamage(1_000), 183);
  assert.equal(baseDamage(Number.NaN), baseDamage(1));
});

test("2026 Royal Paladin stances affect only their declared attributes", () => {
  const sharpshooter = applyStanceEffects(120, 35, "sharpshooter");
  closeTo(sharpshooter.distance, 158.4);
  assert.equal(sharpshooter.holyMagicLevel, 35);
  assert.equal(sharpshooter.healingMagicLevel, 35);

  const defiance = applyStanceEffects(120, 35, "divine-defiance");
  assert.equal(defiance.distance, 120);
  closeTo(defiance.holyMagicLevel, 42.2);
  closeTo(defiance.healingMagicLevel, 42.2);
});

test("critical and Onslaught helpers expose expected-value multipliers", () => {
  // Universal 2026 baseline: 5% chance to deal 10% extra damage.
  closeTo(criticalExpectedMultiplier(), 1.005);
  // Powerful Strike totals: 10% chance to deal 50% extra damage.
  closeTo(
    criticalExpectedMultiplier({
      chancePercent: 10,
      extraDamagePercent: 50,
    }),
    1.05,
  );

  assert.equal(onslaughtChance(0), 0);
  assert.equal(onslaughtChance(4), 2.45);
  assert.equal(onslaughtChance(10), 9.05);
  // Invalid/high tiers are safely bounded for form input.
  assert.equal(onslaughtChance(99), 9.05);
  closeTo(onslaughtExpectedMultiplier(4), 1.0147);
  // Contributions are additive on the same hit; there is no cross-term.
  closeTo(
    combinedProcExpectedMultiplier(
      { chancePercent: 10, extraDamagePercent: 50 },
      4,
    ),
    1.0647,
  );
});

test("auto-attack estimate keeps raw range separate from chance modifiers", () => {
  // Generic +7 weapon modifier; deliberately not labelled as any named bow.
  const result = estimateAutoAttack({
    level: 400,
    distance: 120,
    ammunitionAttack: 37,
    weaponAttackModifier: 7,
    lifeLeechPercent: 25,
    manaLeechPercent: 8,
  });

  assert.equal(result.modelVersion, DAMAGE_MODEL_VERSION);
  assert.equal(result.baseDamage, 80);
  assert.equal(result.attackValue, 44);
  assert.equal(result.raw.min, 195);
  assert.equal(result.raw.average, 310);
  assert.equal(result.raw.max, 540);
  closeTo(result.criticalMultiplier, 1.005);
  closeTo(result.expectedDamageOnHit, 311.55);
  closeTo(result.expectedDamagePerAttempt, 311.55);
  assert.deepEqual(result.primaryTargetLeech, { life: 78, mana: 25 });
});

test("critical and Onslaught contributions are additive in auto attacks", () => {
  const result = estimateAutoAttack({
    level: 400,
    distance: 120,
    ammunitionAttack: 37,
    weaponAttackModifier: 7,
    critical: {
      chancePercent: 10,
      extraDamagePercent: 50,
    },
    forgeTier: 4,
  });

  closeTo(result.criticalMultiplier, 1.05);
  closeTo(result.onslaughtMultiplier, 1.0147);
  closeTo(result.combinedProcMultiplier, 1.0647);
  closeTo(result.expectedDamageOnHit, 330.057);
  assert.notEqual(
    result.combinedProcMultiplier,
    result.criticalMultiplier * result.onslaughtMultiplier,
  );
});

test("resistance and accuracy reduce expected damage without falsifying raw damage", () => {
  const result = estimateAutoAttack({
    level: 400,
    distance: 120,
    ammunitionAttack: 37,
    weaponAttackModifier: 7,
    targetResistancePercent: 20,
    accuracyPercent: 90,
  });

  assert.equal(result.raw.average, 310);
  closeTo(result.afterResistance.average, 248);
  closeTo(result.expectedDamageOnHit, 249.24);
  closeTo(result.expectedDamagePerAttempt, 224.316);
  closeTo(resistanceMultiplier(-20), 1.2);
  assert.equal(resistanceMultiplier(100), 0);
  closeTo(accuracyMultiplier(75), 0.75);
});

test("spell proxy uses Divine Defiance holy-magic conversion", () => {
  const result = estimateSpellProxy({
    level: 400,
    distance: 120,
    magicLevel: 35,
    stance: "divine-defiance",
    basePower: 150,
    school: "holy",
  });

  closeTo(result.effectiveMagicLevel, 42.2);
  assert.equal(result.rawAverage, 306);
  closeTo(result.expectedDamagePerCast, 307.53);
  assert.equal(result.onslaughtMultiplier, 1);
  assert.match(result.caveats[0], /Proxy comparativo/);
});

test("spell proxy uses the same additive proc model when Onslaught is enabled", () => {
  const result = estimateSpellProxy({
    level: 400,
    distance: 120,
    magicLevel: 35,
    basePower: 150,
    critical: {
      chancePercent: 10,
      extraDamagePercent: 50,
    },
    includeOnslaught: true,
    forgeTier: 4,
  });

  assert.equal(result.rawAverage, 267);
  closeTo(result.combinedProcMultiplier, 1.0647);
  closeTo(result.expectedDamagePerCast, 284.2749);
});

test("four-second cycle is explicit, deterministic and primary-target only", () => {
  const cycle = estimateFourSecondCycle({
    autoAttack: {
      level: 400,
      distance: 120,
      magicLevel: 35,
      ammunitionAttack: 37,
      weaponAttackModifier: 7,
      lifeLeechPercent: 25,
      manaLeechPercent: 8,
    },
  });

  assert.deepEqual(cycle.assumptions, {
    durationSeconds: 4,
    autoAttacks: 2,
    calderaCasts: 1,
    barrageCasts: 1,
    primaryTargetOnly: true,
  });
  assert.equal(cycle.divineCaldera.rawAverage, 267);
  assert.equal(cycle.divineBarrage.rawAverage, 242);
  closeTo(cycle.expectedDamage, 1_134.645);
  closeTo(cycle.expectedDps, 283.66125);
  assert.deepEqual(cycle.primaryTargetLeech, {
    life: 284,
    mana: 91,
  });
});

test("beginner cycle only includes spells unlocked at the selected level", () => {
  const input = {
    autoAttack: {
      level: 49,
      distance: 75,
      magicLevel: 8,
      ammunitionAttack: 25,
      weaponAttackModifier: 0,
    },
  };

  const beforeCaldera = estimateLevelAwareCycle(input);
  assert.equal(beforeCaldera.divineCaldera, null);
  assert.equal(beforeCaldera.divineBarrage, null);
  assert.deepEqual(beforeCaldera.assumptions, {
    durationSeconds: 4,
    autoAttacks: 2,
    calderaCasts: 0,
    barrageCasts: 0,
    primaryTargetOnly: true,
  });
  assert.equal(beforeCaldera.rotationLabel, "2 ataques básicos em 4 s");
  closeTo(
    beforeCaldera.expectedDamage,
    beforeCaldera.autoAttack.expectedDamagePerAttempt * 2,
  );

  const atCaldera = estimateLevelAwareCycle({
    ...input,
    autoAttack: { ...input.autoAttack, level: 50 },
  });
  assert.ok(atCaldera.divineCaldera);
  assert.equal(atCaldera.divineBarrage, null);
  assert.equal(atCaldera.assumptions.calderaCasts, 1);
  assert.equal(atCaldera.assumptions.barrageCasts, 0);

  const atBarrage = estimateLevelAwareCycle({
    ...input,
    autoAttack: { ...input.autoAttack, level: 70 },
  });
  assert.ok(atBarrage.divineCaldera);
  assert.ok(atBarrage.divineBarrage);
  assert.equal(atBarrage.assumptions.calderaCasts, 1);
  assert.equal(atBarrage.assumptions.barrageCasts, 1);
  assert.equal(
    atBarrage.rotationLabel,
    "2 ataques + Caldera + Barrage em 4 s",
  );
});

test("leech helper is deterministic and protects form calculations", () => {
  assert.deepEqual(estimateLeech(310, 25, 8), {
    life: 78,
    mana: 25,
  });
  assert.deepEqual(estimateLeech(-100, 25, 8), {
    life: 0,
    mana: 0,
  });
});
