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

export type CombatSettingsState = {
  stance: PaladinStance;
  resistance: number;
  forgeTier: number;
  powerfulStrike: boolean;
  powerfulVamp: boolean;
  powerfulVoid: boolean;
  accuracyOverride: number | null;
};

export type ImbuementKey =
  | "powerfulStrike"
  | "powerfulVamp"
  | "powerfulVoid";
export type ImbuementEquipmentSlot = "weapon" | "armor" | "head";
export type ImbuementCapacities = Record<ImbuementEquipmentSlot, number>;
export type ImbuementAllocation = {
  placements: Partial<Record<ImbuementKey, ImbuementEquipmentSlot>>;
  remaining: ImbuementCapacities;
};

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

export type LevelAwareCycleEstimate = {
  modelVersion: typeof DAMAGE_MODEL_VERSION;
  autoAttack: AutoAttackEstimate;
  divineCaldera: SpellProxyEstimate | null;
  divineBarrage: SpellProxyEstimate | null;
  assumptions: {
    durationSeconds: 4;
    autoAttacks: 0 | 2;
    calderaCasts: 0 | 1;
    barrageCasts: 0 | 1;
    primaryTargetOnly: true;
  };
  rotationLabel: string;
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
  "Precisão é uma aproximação comparativa; a fórmula oficial de acerto não é pública.",
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

function asUnknownRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

/**
 * Runtime boundary for localStorage/UI state. It intentionally accepts only
 * actual booleans and finite numbers; numeric strings and truthy strings are
 * rejected instead of silently changing a simulation.
 */
export function sanitizeStoredSettings(
  value: unknown,
  maximumForgeTier = 10,
): CombatSettingsState {
  const source = asUnknownRecord(value);
  const stance: PaladinStance =
    source.stance === "neutral" ||
      source.stance === "sharpshooter" ||
      source.stance === "divine-defiance"
      ? source.stance
      : "sharpshooter";
  const resistance =
    typeof source.resistance === "number" &&
      Number.isFinite(source.resistance)
      ? Math.round(clamp(source.resistance, -30, 80))
      : 0;
  const safeMaximumTier = Math.max(
    0,
    Math.trunc(finiteOr(maximumForgeTier, 0)),
  );
  const forgeTier =
    typeof source.forgeTier === "number" &&
      Number.isFinite(source.forgeTier)
      ? Math.trunc(clamp(source.forgeTier, 0, safeMaximumTier))
      : 0;
  const accuracyOverride =
    typeof source.accuracyOverride === "number" &&
      Number.isFinite(source.accuracyOverride)
      ? Math.round(clamp(source.accuracyOverride, 0, 100))
      : null;

  return {
    stance,
    resistance,
    forgeTier,
    powerfulStrike: source.powerfulStrike === true,
    powerfulVamp: source.powerfulVamp === true,
    powerfulVoid: source.powerfulVoid === true,
    accuracyOverride,
  };
}

const IMBUEMENT_ORDER: readonly ImbuementKey[] = [
  "powerfulStrike",
  "powerfulVamp",
  "powerfulVoid",
];

const IMBUEMENT_ELIGIBLE_SLOTS: Readonly<
  Record<ImbuementKey, readonly ImbuementEquipmentSlot[]>
> = {
  powerfulStrike: ["weapon"],
  // Prefer the dedicated equipment piece so the weapon remains available to
  // the effect that has no alternative slot.
  powerfulVamp: ["armor", "weapon"],
  powerfulVoid: ["head", "weapon"],
};

function normalizeImbuementCapacity(value: number | undefined): number {
  return Math.max(0, Math.trunc(finiteOr(value, 0)));
}

/**
 * Places active imbuements on real eligible pieces while sharing each item's
 * finite slot capacity. The deterministic order protects the weapon slot for
 * Strike, then prefers armor for Vampirism and helmet for Void.
 */
export function allocateImbuements(
  toggles: Partial<Record<ImbuementKey, boolean>>,
  capacities: Partial<ImbuementCapacities>,
): ImbuementAllocation {
  const remaining: ImbuementCapacities = {
    weapon: normalizeImbuementCapacity(capacities.weapon),
    armor: normalizeImbuementCapacity(capacities.armor),
    head: normalizeImbuementCapacity(capacities.head),
  };
  const placements: ImbuementAllocation["placements"] = {};

  for (const key of IMBUEMENT_ORDER) {
    if (toggles[key] !== true) continue;
    const slot = IMBUEMENT_ELIGIBLE_SLOTS[key].find(
      (candidate) => remaining[candidate] > 0,
    );
    if (!slot) continue;
    placements[key] = slot;
    remaining[slot] -= 1;
  }

  return { placements, remaining };
}

export function canAllocateAllImbuements(
  toggles: Partial<Record<ImbuementKey, boolean>>,
  capacities: Partial<ImbuementCapacities>,
): boolean {
  const allocation = allocateImbuements(toggles, capacities);
  return IMBUEMENT_ORDER.every(
    (key) => toggles[key] !== true || allocation.placements[key] !== undefined,
  );
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

/**
 * Beginner-facing accuracy proxy for catalog items that expose a community
 * base chance and a printed Hit modifier. The 90% default remains an explicit
 * fallback for ammunition without a catalogued base.
 */
export function approximateRangedAccuracy(
  hitModifier: number | undefined,
  conservativeBasePercent = 90,
): number {
  return clamp(
    finiteOr(conservativeBasePercent, 90) + finiteOr(hitModifier, 0),
    0,
    100,
  );
}

export type RangedAccuracyItemKind = "ammo" | "thrown";
export type RangedAccuracyProfile = {
  basePercent: number;
  isFallback: boolean;
};

const COMMUNITY_AMMO_ACCURACY = new Map<string, number>([
  ["arrow", 91],
  ["bolt", 87],
  ["poison arrow", 91],
  ["earth arrow", 91],
  ["flaming arrow", 91],
  ["flash arrow", 91],
  ["shiver arrow", 91],
  ["sniper arrow", 100],
  ["tarsal arrow", 94],
  ["onyx arrow", 94],
  ["vortex bolt", 89],
  ["power bolt", 91],
  ["infernal bolt", 91],
  ["spectral bolt", 91],
  ["drill bolt", 90],
  ["prismatic bolt", 90],
  ["envenomed arrow", 93],
  ["crystalline arrow", 95],
  ["diamond arrow", 100],
  ["burst arrow", 100],
]);

const COMMUNITY_THROWN_ACCURACY = new Map<string, number>([
  ["small stone", 76],
  ["spear", 76],
  ["throwing knife", 76],
  ["throwing star", 76],
  ["viper star", 76],
  ["hunting spear", 80],
  ["royal spear", 80],
  ["enchanted spear", 80],
  ["assassin star", 96],
]);

export function communityRangedAccuracyBase(
  itemName: string | undefined,
  kind: RangedAccuracyItemKind,
): number {
  return communityRangedAccuracyProfile(itemName, kind).basePercent;
}

export function communityRangedAccuracyProfile(
  itemName: string | undefined,
  kind: RangedAccuracyItemKind,
): RangedAccuracyProfile {
  const normalizedName = itemName?.trim().toLocaleLowerCase("en-US") ?? "";
  if (kind === "thrown") {
    const catalogued = COMMUNITY_THROWN_ACCURACY.get(normalizedName);
    return {
      basePercent: catalogued ?? 75,
      isFallback: catalogued === undefined,
    };
  }
  const catalogued = COMMUNITY_AMMO_ACCURACY.get(normalizedName);
  return {
    basePercent: catalogued ?? 90,
    isFallback: catalogued === undefined,
  };
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

/**
 * Beginner-facing four-second comparison that only adds spells once the
 * character can actually use them. It intentionally remains a transparent
 * planning proxy instead of presenting an exact in-game rotation.
 */
export function estimateLevelAwareCycle(
  input: FourSecondCycleInput,
): LevelAwareCycleEstimate {
  const level = Math.floor(nonNegative(input.autoAttack.level));
  const autoAttack = estimateAutoAttack(input.autoAttack);
  const canUseCaldera = level >= 50;
  const canUseBarrage = level >= 70;
  const commonSpellInput = {
    level,
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

  const divineCaldera = canUseCaldera
    ? estimateSpellProxy({
        ...commonSpellInput,
        basePower: input.calderaPower ?? 150,
      })
    : null;
  const divineBarrage = canUseBarrage
    ? estimateSpellProxy({
        ...commonSpellInput,
        basePower: input.barragePower ?? 130,
      })
    : null;
  const expectedDamage =
    autoAttack.expectedDamagePerAttempt * 2 +
    (divineCaldera?.expectedDamagePerCast ?? 0) +
    (divineBarrage?.expectedDamagePerCast ?? 0);
  const rotationLabel = canUseBarrage
    ? "2 ataques + Caldera + Barrage em 4 s"
    : canUseCaldera
      ? "2 ataques + Caldera em 4 s"
      : "2 ataques básicos em 4 s";

  return {
    modelVersion: DAMAGE_MODEL_VERSION,
    autoAttack,
    divineCaldera,
    divineBarrage,
    assumptions: {
      durationSeconds: 4,
      autoAttacks: 2,
      calderaCasts: canUseCaldera ? 1 : 0,
      barrageCasts: canUseBarrage ? 1 : 0,
      primaryTargetOnly: true,
    },
    rotationLabel,
    expectedDamage,
    expectedDps: expectedDamage / 4,
    primaryTargetLeech: estimateLeech(
      expectedDamage,
      input.autoAttack.lifeLeechPercent,
      input.autoAttack.manaLeechPercent,
    ),
    caveats: [
      ...AUTO_ATTACK_CAVEATS,
      ...(canUseCaldera || canUseBarrage ? SPELL_CAVEATS : []),
      "O ciclo só inclui spells liberadas pelo level informado.",
      "Onslaught em spells fica desligado por padrão.",
    ],
  };
}

/**
 * The simulator should not mix a broken equipment combination with a
 * spell-only positive result. This presentation gate keeps the engine's
 * estimator reusable while guaranteeing that every offensive value shown for
 * an incompatible loadout is zero.
 */
export function gateIncompatibleLevelAwareCycle(
  cycle: LevelAwareCycleEstimate,
  compatible: boolean,
): LevelAwareCycleEstimate {
  if (compatible) return cycle;

  const zeroRange: DamageRange = { min: 0, average: 0, max: 0 };
  return {
    ...cycle,
    autoAttack: {
      ...cycle.autoAttack,
      raw: zeroRange,
      afterResistance: zeroRange,
      accuracyMultiplier: 0,
      expectedDamageOnHit: 0,
      expectedDamagePerAttempt: 0,
      primaryTargetLeech: { life: 0, mana: 0 },
    },
    divineCaldera: null,
    divineBarrage: null,
    assumptions: {
      ...cycle.assumptions,
      autoAttacks: 0,
      calderaCasts: 0,
      barrageCasts: 0,
    },
    rotationLabel: "Corrija o loadout para estimar o ciclo",
    expectedDamage: 0,
    expectedDps: 0,
    primaryTargetLeech: { life: 0, mana: 0 },
    caveats: [
      ...cycle.caveats,
      "Resultados ofensivos ocultados porque o loadout está incompatível.",
    ],
  };
}

export const calculateDamage = estimateAutoAttack;
export const calculateFourSecondCycle = estimateFourSecondCycle;
export const calculateLevelAwareCycle = estimateLevelAwareCycle;
