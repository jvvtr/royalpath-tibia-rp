/**
 * Pure Royal Paladin character-stat helpers.
 *
 * Equipment is intentionally represented by a small structural type so this
 * module can consume the items from app/content.ts without depending on the
 * app or its provenance/UI fields.
 */

export const MIN_ROYAL_PALADIN_LEVEL = 8;
export const ROYAL_PALADIN_VOCATION = "Royal Paladin" as const;

export const PROTECTION_TYPES = [
  "physical",
  "fire",
  "earth",
  "energy",
  "ice",
  "holy",
  "death",
] as const;

export type ProtectionType = (typeof PROTECTION_TYPES)[number];

export type ProtectionTotals = Record<ProtectionType, number>;

export type CharacterItemStats = {
  armor?: number;
  distance?: number;
  magic?: number;
  protection?: readonly string[];
};

export type CharacterStatsInput<
  TItem extends CharacterItemStats = CharacterItemStats,
> = {
  level: number;
  /** Distance skill before equipment bonuses. */
  distance: number;
  /** Magic level before equipment bonuses. */
  magic: number;
  items?: readonly TItem[];
};

export type ArmorReductionRange = {
  min: number;
  max: number;
};

export type CharacterStats = {
  vocation: typeof ROYAL_PALADIN_VOCATION;
  level: number;
  hp: number;
  mana: number;
  capacity: number;
  armor: number;
  distance: number;
  magic: number;
  protections: ProtectionTotals;
  armorReduction: ArmorReductionRange;
};

export type ParsedProtection = {
  type: ProtectionType;
  percent: number;
};

const PROTECTION_ALIASES: Readonly<Record<string, ProtectionType>> = {
  fisico: "physical",
  fogo: "fire",
  terra: "earth",
  energia: "energy",
  gelo: "ice",
  holy: "holy",
  death: "death",
};

const PROTECTION_PATTERN =
  /^\s*([\p{L}\s-]+?)\s*([+-]?\d+(?:[.,]\d+)?)\s*%\s*$/u;

function assertFiniteNumber(value: unknown, label: string): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${label} deve ser um número finito.`);
  }
}

function assertNonNegativeInteger(
  value: unknown,
  label: string,
): asserts value is number {
  assertFiniteNumber(value, label);

  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} deve ser um inteiro maior ou igual a zero.`);
  }
}

function validateLevel(level: unknown): asserts level is number {
  assertFiniteNumber(level, "level");

  if (!Number.isInteger(level) || level < MIN_ROYAL_PALADIN_LEVEL) {
    throw new RangeError(
      `level deve ser um inteiro maior ou igual a ${MIN_ROYAL_PALADIN_LEVEL}.`,
    );
  }
}

function normalizeProtectionLabel(label: string): string {
  return label
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

function roundProtection(value: number): number {
  const rounded = Number(value.toFixed(10));
  return Object.is(rounded, -0) ? 0 : rounded;
}

function createEmptyProtections(initialValue: number): ProtectionTotals {
  return {
    physical: initialValue,
    fire: initialValue,
    earth: initialValue,
    energy: initialValue,
    ice: initialValue,
    holy: initialValue,
    death: initialValue,
  };
}

function readItemNumber(
  item: CharacterItemStats,
  field: "armor" | "distance" | "magic",
  itemIndex: number,
): number {
  const value = item[field];

  if (value === undefined) {
    return 0;
  }

  assertFiniteNumber(value, `items[${itemIndex}].${field}`);

  if (!Number.isInteger(value)) {
    throw new RangeError(`items[${itemIndex}].${field} deve ser um inteiro.`);
  }

  if (field === "armor" && value < 0) {
    throw new RangeError(
      `items[${itemIndex}].armor deve ser maior ou igual a zero.`,
    );
  }

  return value;
}

function validateItems(
  items: readonly CharacterItemStats[] | undefined,
): readonly CharacterItemStats[] {
  if (items === undefined) {
    return [];
  }

  if (!Array.isArray(items)) {
    throw new TypeError("items deve ser uma lista.");
  }

  items.forEach((item, index) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      throw new TypeError(`items[${index}] deve ser um objeto de item.`);
    }
  });

  return items;
}

/**
 * Parses the protection strings currently used by Item.protection, for
 * example "físico +5%" and "gelo -2%".
 *
 * Unknown item effects (such as "speed +20") return null so the character
 * engine remains compatible with mixed effect lists.
 */
export function parseProtection(value: string): ParsedProtection | null {
  if (typeof value !== "string") {
    throw new TypeError("protection deve ser uma string.");
  }

  const match = PROTECTION_PATTERN.exec(value);

  if (!match) {
    return null;
  }

  const type = PROTECTION_ALIASES[normalizeProtectionLabel(match[1])];

  if (!type) {
    return null;
  }

  const percent = Number(match[2].replace(",", "."));

  if (!Number.isFinite(percent)) {
    throw new TypeError(`Proteção inválida: "${value}".`);
  }

  if (percent < -100 || percent > 100) {
    throw new RangeError(
      `Proteção fora do intervalo de -100% a 100%: "${value}".`,
    );
  }

  return { type, percent };
}

export function royalPaladinHitPoints(level: number): number {
  validateLevel(level);
  return 10 * level + 105;
}

export function royalPaladinMana(level: number): number {
  validateLevel(level);
  return 15 * level - 30;
}

export function royalPaladinCapacity(level: number): number {
  validateLevel(level);
  return 20 * level + 310;
}

/**
 * Tibia armour absorbs a random integer in this reference range.
 */
export function calculateArmorReduction(
  totalArmor: number,
): ArmorReductionRange {
  assertFiniteNumber(totalArmor, "totalArmor");

  if (totalArmor < 0) {
    throw new RangeError("totalArmor deve ser maior ou igual a zero.");
  }

  const min = Math.max(0, Math.floor(totalArmor / 2));
  const max = Math.max(0, min * 2 - 1);

  return { min, max };
}

/**
 * Protection percentages stack multiplicatively:
 * combined = 1 - product(1 - itemProtection).
 *
 * A negative protection therefore increases the remaining damage multiplier
 * and correctly reduces (or can reverse) the combined protection.
 */
export function aggregateProtections<
  TItem extends CharacterItemStats = CharacterItemStats,
>(items: readonly TItem[] | undefined): ProtectionTotals {
  const safeItems = validateItems(items);
  const remainingDamage = createEmptyProtections(1);

  safeItems.forEach((item, itemIndex) => {
    if (item.protection === undefined) {
      return;
    }

    if (!Array.isArray(item.protection)) {
      throw new TypeError(`items[${itemIndex}].protection deve ser uma lista.`);
    }

    item.protection.forEach((value, protectionIndex) => {
      if (typeof value !== "string") {
        throw new TypeError(
          `items[${itemIndex}].protection[${protectionIndex}] deve ser uma string.`,
        );
      }

      const parsed = parseProtection(value);

      if (parsed) {
        remainingDamage[parsed.type] *= 1 - parsed.percent / 100;
      }
    });
  });

  const protections = createEmptyProtections(0);

  PROTECTION_TYPES.forEach((type) => {
    protections[type] = roundProtection(
      (1 - remainingDamage[type]) * 100,
    );
  });

  return protections;
}

export function calculateCharacterStats<
  TItem extends CharacterItemStats = CharacterItemStats,
>(input: CharacterStatsInput<TItem>): CharacterStats {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new TypeError("input deve ser um objeto.");
  }

  validateLevel(input.level);
  assertNonNegativeInteger(input.distance, "distance");
  assertNonNegativeInteger(input.magic, "magic");

  const items = validateItems(input.items);
  let armor = 0;
  let distanceBonus = 0;
  let magicBonus = 0;

  items.forEach((item, index) => {
    armor += readItemNumber(item, "armor", index);
    distanceBonus += readItemNumber(item, "distance", index);
    magicBonus += readItemNumber(item, "magic", index);
  });

  const distance = input.distance + distanceBonus;
  const magic = input.magic + magicBonus;

  if (distance < 0 || magic < 0) {
    throw new RangeError(
      "Os bônus dos itens não podem reduzir distance ou magic abaixo de zero.",
    );
  }

  return {
    vocation: ROYAL_PALADIN_VOCATION,
    level: input.level,
    hp: royalPaladinHitPoints(input.level),
    mana: royalPaladinMana(input.level),
    capacity: royalPaladinCapacity(input.level),
    armor,
    distance,
    magic,
    protections: aggregateProtections(items),
    armorReduction: calculateArmorReduction(armor),
  };
}

export const calculateCharacterProfile = calculateCharacterStats;
