/**
 * Royal Paladin damage helpers.
 *
 * Formula status (verified 2026-07-28):
 * - The level/base term and distance/attack-value term are community
 *   reverse-engineering estimates, not an official CipSoft damage formula.
 * - The permanent +20% attack-value adjustment and the 2026 stance bonuses
 *   are represented explicitly.
 * - Monster armour, shielding, charms, prey, Wheel of Destiny, proficiency
 *   perks, target count and the game's internal random distribution are not
 *   inferred here.
 *
 * Keeping those limits in the engine makes it harder for the UI to present a
 * comparison as an exact in-game hit prediction.
 */

export const DAMAGE_MODEL_VERSION = "2026-07-28-estimate";

export type PaladinStance =
  | "neutral"
  | "sharpshooter"
  | "divine-defiance";

export type DamageRange = {
  min: number;
  average: number;
  max: number;
};

export type StanceEffects = {
  distance: number;
  holyMagicLevel: number;
  healingMagicLevel: number;
};

export type CriticalProfile = {
  /** Total critical-hit chance, in percentage points. */
  chancePercent?: number;
  /** Extra damage dealt by a critical hit, in percent. */
  extraDamagePercent?: number;
};

export type AutoAttackInput = {
  level: number;
  distance: number;
  magicLevel?: number;
  stance?: PaladinStance;
  ammunitionAttack: number;
  /**
   * The bow/crossbow attack modifier printed by the item. Do not pass its hit
   * chance or distance bonus here.
   */
  weaponAttackModifier: number;
  /** Chance for the shot to land. Defaults to 100%. */
  accuracyPercent?: number;
  /**
   * Target resistance to the selected damage type. Negative values represent
   * a weakness. Defaults to 0%.
   */
  targetResistancePercent?: number;
  /**
   * Defaults to the current universal baseline: 5% chance, 10% extra damage.
   * Pass the total profile after imbuements/proficiency, not only the bonus.
   */
  critical?: CriticalProfile;
  /** Exaltation Forge weapon tier, from 0 to 10. */
  forgeTier?: number;
  /** Primary-target life leech. Defaults to 0%. */
  lifeLeechPercent?: number;
  /** Primary-target mana leech. Defaults to 0%. */
  manaLeechPercent?: number;
};

export type AutoAttackEstimate = {
  modelVersion: typeof DAMAGE_MODEL_VERSION;
  baseDamage: number;
  attackValue: number;
  effectiveDistance: number;
  distanceAttackTerm: number;
  raw: DamageRange;
  afterResistance: DamageRange;
  criticalMultiplier: number;
  onslaughtChancePercent: number;
  onslaughtMultiplier: number;
  /**
   * Additive expected-value multiplier:
   * 1 + critical contribution + Onslaught contribution.
   */
  combinedProcMultiplier: number;
  accuracyMultiplier: number;
  resistanceMultiplier: number;
  /** Expected damage when the projectile lands, including probabilistic procs. */
  expectedDamageOnHit: number;
  /** Expected damage per fired shot, including misses. */
  expectedDamagePerAttempt: number;
  primaryTargetLeech: {
    life: number;
    mana: number;
  };
  caveats: readonly string[];
};

export type SpellSchool = "holy" | "healing" | "generic";

export type SpellProxyInput = {
  level: number;
  distance: number;
  magicLevel: number;
  stance?: PaladinStance;
  /** Relative spell coefficient used for comparisons, such as 150 or 130. */
  basePower: number;
  school?: SpellSchool;
  accuracyPercent?: number;
  targetResistancePercent?: number;
  critical?: CriticalProfile;
  /**
   * Off by default because the exact interaction between Onslaught and every
   * spell/proc context is outside this estimator. Enable only for a deliberate
   * what-if comparison.
   */
  includeOnslaught?: boolean;
  forgeTier?: number;
};

export type SpellProxyEstimate = {
  modelVersion: typeof DAMAGE_MODEL_VERSION;
  baseDamage: number;
  basePower: number;
  effectiveMagicLevel: number;
  rawAverage: number;
  afterResistanceAverage: number;
  criticalMultiplier: number;
  onslaughtMultiplier: number;
  /** Additive critical + optional Onslaught expected-value multiplier. */
  combinedProcMultiplier: number;
  expectedDamageOnHit: number;
  expectedDamagePerCast: number;
  caveats: readonly string[];
};

export type FourSecondCycleInput = {
  autoAttack: AutoAttackInput;
  /**
   * Magic level before stance effects. Defaults to autoAttack.magicLevel or 0.
   */
  magicLevel?: number;
  /** Current post-adjustment Divine Caldera proxy power. Defaults to 150. */
  calderaPower?: number;
  /** Current post-adjustment Divine Barrage proxy power. Defaults to 130. */
  barragePower?: number;
  /** Deliberate what-if toggle; off by default. */
  includeOnslaughtOnSpells?: boolean;
};

export type FourSecondCycleEstimate = {
  autoAttack: AutoAttackEstimate;
  divineCaldera: SpellProxyEstimate;
  divineBarrage: SpellProxyEstimate;
  assumptions: {
    durationSeconds: 4;
    autoAttacks: 2;
    calderaCasts: 1;
    barrageCasts: 1;
    primaryTargetOnly: true;
  };
  expectedDamage: number;
  expectedDps: number;
  primaryTargetLeech: {
    life: number;
    mana: number;
  };
  caveats: readonly string[];
};

const ONSLAUGHT_CHANCE_BY_TIER = [
  0,
  0.5,
  1.05,
  1.7,
  2.45,
  3.3,
  4.25,
  5.3,
  6.45,
  7.7,
  9.05,
] as const;

const BASELINE_CRITICAL_CHANCE = 5;
const BASELINE_CRITICAL_EXTRA_DAMAGE = 10;
const ONSLAUGHT_EXTRA_DAMAGE = 60;

const AUTO_ATTACK_CAVEATS = [
  "Faixa estimada; a distribuição interna exata não é pública.",
  "Não inclui armadura, shielding, charms, prey, Wheel ou proficiência.",
  "Leech considera somente o alvo primário e o dano esperado desta tentativa.",
] as const;

const SPELL_CAVEATS = [
  "Proxy comparativo, não uma fórmula oficial exata de spell.",
  "Não inclui armadura, mitigação, Wheel, charms, prey ou número de alvos.",
] as const;

function finiteOr(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) ? (value as number) : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function nonNegative(value: number | undefined, fallback = 0): number {
  return Math.max(0, finiteOr(value, fallback));
}

function percent(
  value: number | undefined,
  fallback: number,
  min = 0,
  max = 100,
): number {
  return clamp(finiteOr(value, fallback), min, max);
}

function scaleRange(range: DamageRange, multiplier: number): DamageRange {
  return {
    min: range.min * multiplier,
    average: range.average * multiplier,
    max: range.max * multiplier,
  };
}

/**
 * Community-estimated level term:
 * s = floor((sqrt(2L + 2025) + 5) / 10)
 * B = floor((L + 1000) / s) + 50s - 450
 */
export function baseDamage(level: number): number {
  const safeLevel = Math.max(1, Math.floor(finiteOr(level, 1)));
  const step = Math.max(
    1,
    Math.floor((Math.sqrt(2 * safeLevel + 2025) + 5) / 10),
  );

  return (
    Math.floor((safeLevel + 1000) / step) +
    50 * step -
    450
  );
}

/**
 * Applies the live Royal Paladin promotion stance bonuses from 2026-07-07:
 * Sharpshooter +32% total distance; Divine Defiance converts 6% of total
 * distance into holy/healing magic level.
 */
export function applyStanceEffects(
  distance: number,
  magicLevel: number,
  stance: PaladinStance = "neutral",
): StanceEffects {
  const safeDistance = nonNegative(distance);
  const safeMagicLevel = nonNegative(magicLevel);

  if (stance === "sharpshooter") {
    return {
      distance: safeDistance * 1.32,
      holyMagicLevel: safeMagicLevel,
      healingMagicLevel: safeMagicLevel,
    };
  }

  if (stance === "divine-defiance") {
    const convertedMagicLevel = safeMagicLevel + safeDistance * 0.06;

    return {
      distance: safeDistance,
      holyMagicLevel: convertedMagicLevel,
      healingMagicLevel: convertedMagicLevel,
    };
  }

  return {
    distance: safeDistance,
    holyMagicLevel: safeMagicLevel,
    healingMagicLevel: safeMagicLevel,
  };
}

export function criticalExpectedMultiplier(
  critical: CriticalProfile = {},
): number {
  const chance =
    percent(critical.chancePercent, BASELINE_CRITICAL_CHANCE) / 100;
  const extraDamage =
    nonNegative(
      critical.extraDamagePercent,
      BASELINE_CRITICAL_EXTRA_DAMAGE,
    ) / 100;

  return 1 + chance * extraDamage;
}

export function onslaughtChance(forgeTier: number | undefined): number {
  const safeTier = clamp(
    Math.trunc(finiteOr(forgeTier, 0)),
    0,
    ONSLAUGHT_CHANCE_BY_TIER.length - 1,
  );

  return ONSLAUGHT_CHANCE_BY_TIER[safeTier];
}

export function onslaughtExpectedMultiplier(
  forgeTier: number | undefined,
): number {
  return 1 + (onslaughtChance(forgeTier) / 100) *
    (ONSLAUGHT_EXTRA_DAMAGE / 100);
}

/**
 * Critical damage and Onslaught are additive when they occur on the same hit.
 * Multiplying their independent EV multipliers would invent a cross-term that
 * does not exist in the game's damage calculation.
 */
export function combinedProcExpectedMultiplier(
  critical: CriticalProfile = {},
  forgeTier?: number,
  includeOnslaught = true,
): number {
  const criticalContribution = criticalExpectedMultiplier(critical) - 1;
  const onslaughtContribution = includeOnslaught
    ? onslaughtExpectedMultiplier(forgeTier) - 1
    : 0;

  return 1 + criticalContribution + onslaughtContribution;
}

export function resistanceMultiplier(
  targetResistancePercent: number | undefined,
): number {
  const resistance = percent(targetResistancePercent, 0, -100, 100);
  return 1 - resistance / 100;
}

export function accuracyMultiplier(
  accuracyPercent: number | undefined,
): number {
  return percent(accuracyPercent, 100) / 100;
}

export function estimateLeech(
  expectedDamage: number,
  lifeLeechPercent = 0,
  manaLeechPercent = 0,
): { life: number; mana: number } {
  const damage = nonNegative(expectedDamage);
  const lifeRate = percent(lifeLeechPercent, 0) / 100;
  const manaRate = percent(manaLeechPercent, 0) / 100;

  return {
    life: Math.ceil(damage * lifeRate),
    mana: Math.ceil(damage * manaRate),
  };
}

/**
 * Estimates one bow/crossbow shot.
 *
 * W = ammunition attack + weapon attack modifier
 * K = floor(6W/5) * (effective distance + 4) / 28
 * estimated average = B + floor(K)
 * estimated lower/upper references = B + floor(0.5K / 2K)
 */
export function estimateAutoAttack(
  input: AutoAttackInput,
): AutoAttackEstimate {
  const levelTerm = baseDamage(input.level);
  const stance = applyStanceEffects(
    input.distance,
    input.magicLevel ?? 0,
    input.stance,
  );
  const attackValue =
    nonNegative(input.ammunitionAttack) +
    nonNegative(input.weaponAttackModifier);
  const adjustedAttackValue = Math.floor((6 * attackValue) / 5);
  const distanceAttackTerm =
    adjustedAttackValue * (stance.distance + 4) / 28;

  const raw: DamageRange = {
    min: levelTerm + Math.floor(distanceAttackTerm * 0.5),
    average: levelTerm + Math.floor(distanceAttackTerm),
    max: levelTerm + Math.floor(distanceAttackTerm * 2),
  };

  const resistance = resistanceMultiplier(
    input.targetResistancePercent,
  );
  const afterResistance = scaleRange(raw, resistance);
  const criticalMultiplier = criticalExpectedMultiplier(input.critical);
  const forgeChance = onslaughtChance(input.forgeTier);
  const forgeMultiplier = onslaughtExpectedMultiplier(input.forgeTier);
  const combinedProcMultiplier = combinedProcExpectedMultiplier(
    input.critical,
    input.forgeTier,
  );
  const accuracy = accuracyMultiplier(input.accuracyPercent);
  const expectedDamageOnHit =
    afterResistance.average * combinedProcMultiplier;
  const expectedDamagePerAttempt = expectedDamageOnHit * accuracy;

  return {
    modelVersion: DAMAGE_MODEL_VERSION,
    baseDamage: levelTerm,
    attackValue,
    effectiveDistance: stance.distance,
    distanceAttackTerm,
    raw,
    afterResistance,
    criticalMultiplier,
    onslaughtChancePercent: forgeChance,
    onslaughtMultiplier: forgeMultiplier,
    combinedProcMultiplier,
    accuracyMultiplier: accuracy,
    resistanceMultiplier: resistance,
    expectedDamageOnHit,
    expectedDamagePerAttempt,
    primaryTargetLeech: estimateLeech(
      expectedDamagePerAttempt,
      input.lifeLeechPercent,
      input.manaLeechPercent,
    ),
    caveats: AUTO_ATTACK_CAVEATS,
  };
}

export function estimateSpellProxy(
  input: SpellProxyInput,
): SpellProxyEstimate {
  const stance = applyStanceEffects(
    input.distance,
    input.magicLevel,
    input.stance,
  );
  const school = input.school ?? "holy";
  const effectiveMagicLevel =
    school === "holy"
      ? stance.holyMagicLevel
      : school === "healing"
        ? stance.healingMagicLevel
        : nonNegative(input.magicLevel);
  const levelTerm = baseDamage(input.level);
  const basePower = nonNegative(input.basePower);
  const rawAverage = Math.floor(
    levelTerm + effectiveMagicLevel * basePower / 28,
  );
  const resistance = resistanceMultiplier(
    input.targetResistancePercent,
  );
  const afterResistanceAverage = rawAverage * resistance;
  const criticalMultiplier = criticalExpectedMultiplier(input.critical);
  const forgeMultiplier = input.includeOnslaught
    ? onslaughtExpectedMultiplier(input.forgeTier)
    : 1;
  const combinedProcMultiplier = combinedProcExpectedMultiplier(
    input.critical,
    input.forgeTier,
    input.includeOnslaught ?? false,
  );
  const expectedDamageOnHit =
    afterResistanceAverage * combinedProcMultiplier;
  const expectedDamagePerCast =
    expectedDamageOnHit * accuracyMultiplier(input.accuracyPercent);

  return {
    modelVersion: DAMAGE_MODEL_VERSION,
    baseDamage: levelTerm,
    basePower,
    effectiveMagicLevel,
    rawAverage,
    afterResistanceAverage,
    criticalMultiplier,
    onslaughtMultiplier: forgeMultiplier,
    combinedProcMultiplier,
    expectedDamageOnHit,
    expectedDamagePerCast,
    caveats: SPELL_CAVEATS,
  };
}

/**
 * A transparent comparison cycle: two auto-attacks, one Divine Caldera and
 * one Divine Barrage in four seconds. This is a planning proxy, not a promise
 * of executable rotation, hit count or in-game DPS.
 */
export function estimateFourSecondCycle(
  input: FourSecondCycleInput,
): FourSecondCycleEstimate {
  const autoAttack = estimateAutoAttack(input.autoAttack);
  const commonSpellInput = {
    level: input.autoAttack.level,
    distance: input.autoAttack.distance,
    magicLevel:
      input.magicLevel ?? input.autoAttack.magicLevel ?? 0,
    stance: input.autoAttack.stance,
    school: "holy" as const,
    accuracyPercent: 100,
    targetResistancePercent:
      input.autoAttack.targetResistancePercent,
    critical: input.autoAttack.critical,
    includeOnslaught: input.includeOnslaughtOnSpells ?? false,
    forgeTier: input.autoAttack.forgeTier,
  };

  const divineCaldera = estimateSpellProxy({
    ...commonSpellInput,
    basePower: input.calderaPower ?? 150,
  });
  const divineBarrage = estimateSpellProxy({
    ...commonSpellInput,
    basePower: input.barragePower ?? 130,
  });
  const expectedDamage =
    autoAttack.expectedDamagePerAttempt * 2 +
    divineCaldera.expectedDamagePerCast +
    divineBarrage.expectedDamagePerCast;

  return {
    autoAttack,
    divineCaldera,
    divineBarrage,
    assumptions: {
      durationSeconds: 4,
      autoAttacks: 2,
      calderaCasts: 1,
      barrageCasts: 1,
      primaryTargetOnly: true,
    },
    expectedDamage,
    expectedDps: expectedDamage / 4,
    primaryTargetLeech: estimateLeech(
      expectedDamage,
      input.autoAttack.lifeLeechPercent,
      input.autoAttack.manaLeechPercent,
    ),
    caveats: [
      ...AUTO_ATTACK_CAVEATS,
      ...SPELL_CAVEATS,
      "Ciclo teórico de 4 s: 2 autos + Caldera + Barrage em um alvo.",
      "Onslaught em spells fica desligado por padrão.",
    ],
  };
}

export const calculateDamage = estimateAutoAttack;
export const calculateFourSecondCycle = estimateFourSecondCycle;
