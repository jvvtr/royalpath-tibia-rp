"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BIS_CONTEXTS,
  GUIDES,
  HUNTS,
  ITEMS,
  MILESTONES,
  PROGRESSION_BANDS,
  SOURCES,
  type BisContext,
  type Guide,
  type Hunt,
  type Item,
  type ItemSlot,
  type ProgressionBand,
} from "./content";
import {
  calculateCharacterStats,
  type CharacterStats,
} from "../lib/character";
import {
  DAMAGE_MODEL_VERSION,
  allocateImbuements,
  approximateRangedAccuracy,
  canAllocateAllImbuements,
  communityRangedAccuracyProfile,
  estimateLevelAwareCycle,
  gateIncompatibleLevelAwareCycle,
  sanitizeStoredSettings,
  type CombatSettingsState,
  type ImbuementCapacities,
  type ImbuementEquipmentSlot,
  type ImbuementKey,
  type LevelAwareCycleEstimate,
  type PaladinStance,
} from "../lib/damage";

type ViewId =
  | "inicio"
  | "arsenal"
  | "simulador"
  | "hunts"
  | "tutoriais"
  | "jornada";
type EquipmentSlot = ItemSlot;
type CombatSettings = CombatSettingsState;

type StoredProfile = {
  level?: number;
  distance?: number;
  magicLevel?: number;
  completed?: string[];
  loadout?: Partial<Record<EquipmentSlot, string>>;
  settings?: unknown;
};

type CombatSummary = LevelAwareCycleEstimate & {
  compatible: boolean;
  compatibilityMessage: string | null;
  weapon: Item | undefined;
  ammo: Item | undefined;
  quiver: Item | undefined;
  shield: Item | undefined;
  effectiveStance: PaladinStance;
  accuracyBasePercent: number;
  estimatedAccuracyPercent: number;
  appliedAccuracyPercent: number;
  accuracyIsOverridden: boolean;
  accuracyUsesFallback: boolean;
};

const NAVIGATION: ReadonlyArray<{
  id: ViewId;
  label: string;
  shortLabel: string;
  marker: string;
}> = [
  { id: "inicio", label: "Início", shortLabel: "Início", marker: "01" },
  { id: "arsenal", label: "Arsenal", shortLabel: "Itens", marker: "02" },
  {
    id: "simulador",
    label: "Simulador",
    shortLabel: "Simular",
    marker: "03",
  },
  { id: "hunts", label: "Onde caçar", shortLabel: "Hunts", marker: "04" },
  { id: "tutoriais", label: "Tutoriais", shortLabel: "Aprender", marker: "05" },
  { id: "jornada", label: "Jornada", shortLabel: "Jornada", marker: "06" },
];

type TutorialCategory = "todos" | Guide["category"];

const TUTORIAL_CATEGORIES: ReadonlyArray<{
  id: TutorialCategory;
  label: string;
}> = [
  { id: "todos", label: "Todos" },
  { id: "primeiros-passos", label: "Comece aqui" },
  { id: "treino", label: "Treino" },
  { id: "seguranca", label: "Segurança" },
  { id: "equipamento", label: "Equipamento" },
  { id: "combate", label: "Combate" },
  { id: "imbuement", label: "Imbuements" },
  { id: "sistemas", label: "Sistemas" },
  { id: "forge", label: "Forge" },
  { id: "proficiency", label: "Proficiency" },
];
const SLOT_ORDER: readonly EquipmentSlot[] = [
  "head",
  "amulet",
  "armor",
  "quiver",
  "shield",
  "weapon",
  "legs",
  "ammo",
  "boots",
  "ring",
];

const SLOT_LABELS: Record<EquipmentSlot, string> = {
  head: "Cabeça",
  amulet: "Amuleto",
  armor: "Armadura",
  quiver: "Aljava",
  shield: "Escudo",
  weapon: "Arma",
  legs: "Pernas",
  ammo: "Munição",
  boots: "Botas",
  ring: "Anel",
};

const PROTECTION_LABELS: Record<string, string> = {
  physical: "Físico",
  fire: "Fogo",
  earth: "Terra",
  energy: "Energia",
  ice: "Gelo",
  holy: "Holy",
  death: "Death",
  lifeDrain: "Dreno de vida",
  manaDrain: "Dreno de mana",
};

const IMBUEMENT_LABELS: Readonly<Record<ImbuementKey, string>> = {
  powerfulStrike: "Strike",
  powerfulVamp: "Vampirism",
  powerfulVoid: "Void",
};

const IMBUEMENT_SLOT_LABELS: Readonly<
  Record<ImbuementEquipmentSlot, string>
> = {
  weapon: "Arma",
  armor: "Armadura",
  head: "Capacete",
};

const FORGE_MAX_TIER_BY_CLASS: Readonly<Record<0 | 1 | 2 | 3 | 4, number>> = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 10,
};

const BOW_PROGRESSION = [
  "elvish-bow",
  "composite-hornbow",
  "rift-bow",
  "jungle-bow",
  "bow-of-destruction",
  "living-vine-bow",
  "bow-of-cataclysm",
  "lion-longbow",
  "falcon-bow",
  "soulbleeder",
  "sanguine-bow",
  "moonsilver-bow",
] as const;

const THROWN_PROGRESSION = [
  "spear",
  "royal-spear",
  "enchanted-spear",
  "assassin-star",
  "viper-star",
  "glooth-spear",
] as const;

const CROSSBOW_PROGRESSION = [
  "crossbow",
  "arbalest",
  "modified-crossbow",
  "rift-crossbow",
  "ornate-crossbow",
  "cobra-crossbow",
  "naga-crossbow",
  "soulpiercer",
  "sanguine-crossbow",
  "moonsilver-crossbow",
] as const;

const ARROW_PROGRESSION = [
  "arrow",
  "onyx-arrow",
  "crystalline-arrow",
  "diamond-arrow",
] as const;

const BOLT_PROGRESSION = [
  "bolt",
  "power-bolt",
  "infernal-bolt",
  "prismatic-bolt",
  "spectral-bolt",
] as const;

const SHIELD_PROGRESSION = [
  "wooden-shield",
  "dwarven-shield",
  "dragon-shield",
  "demon-shield",
  "mastermind-shield",
  "ornate-shield",
  "gnome-shield",
  "falcon-escutcheon",
  "soulbastion",
] as const;

const SUGGESTED_PROGRESSION: Partial<
  Record<EquipmentSlot, readonly string[]>
> = {
  head: [
    "zaoan-helmet",
    "dark-whispers",
    "falcon-coif",
    "alicorn-headguard",
    "moonsilver-trail-hood",
  ],
  amulet: ["sleep-shawl", "flamingo-precision"],
  armor: [
    "paladin-armor",
    "gnome-armor",
    "ghost-chestplate",
    "soulshell",
  ],
  quiver: ["quiver"],
  shield: SHIELD_PROGRESSION,
  weapon: BOW_PROGRESSION,
  legs: [
    "dwarven-legs",
    "prismatic-legs",
    "falcon-greaves",
    "sanguine-greaves",
  ],
  ammo: ARROW_PROGRESSION,
  boots: ["guardian-boots", "winged-boots", "soulstalkers"],
};

const GUIDE_ROUTE = [
  "primeira-hora-rp",
  "quiver-and-ammunition",
  "offline-training",
  "blessings-death-protection",
  "promotion-stances",
  "imbuements",
] as const;

const STORAGE_KEY = "royalpath-profile-v2";
const LEGACY_STORAGE_KEY = "royalpath-profile-v1";
const DEFAULT_LEVEL = 8;
const DEFAULT_DISTANCE = 70;
const DEFAULT_MAGIC_LEVEL = 5;
const DEFAULT_SETTINGS: CombatSettings = {
  stance: "sharpshooter",
  resistance: 0,
  forgeTier: 0,
  powerfulStrike: false,
  powerfulVamp: false,
  powerfulVoid: false,
  accuracyOverride: null,
};

function clamp(value: number, min: number, max: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function clampLevel(value: number) {
  return clamp(value, 8, 2500, DEFAULT_LEVEL);
}

function itemById(id: string | undefined) {
  return ITEMS.find((item) => item.id === id);
}

function bandForLevel(level: number): ProgressionBand {
  return (
    PROGRESSION_BANDS.find(
      (band) =>
        level >= band.minLevel &&
        (band.maxLevel === null || level <= band.maxLevel),
    ) ?? PROGRESSION_BANDS[PROGRESSION_BANDS.length - 1]
  );
}

function weaponKind(item: Item | undefined) {
  if (!item || item.slot !== "weapon") return "none";
  if (item.weaponKind) return item.weaponKind;
  if (/crossbow|arbalest|piercer|bolter|ironworker|devileye|thorn spitter/i.test(item.name)) {
    return "crossbow";
  }
  if (/spear|star|knife|javelin|stone|snowball/i.test(item.name)) {
    return "thrown";
  }
  return "bow";
}

function ammoKind(item: Item | undefined) {
  if (!item || item.slot !== "ammo") return "none";
  if (item.ammoKind) return item.ammoKind;
  return /bolt/i.test(item.name) ? "bolt" : "arrow";
}

function isAmmoCompatible(weapon: Item | undefined, ammo: Item | undefined) {
  const kind = weaponKind(weapon);
  if (kind === "thrown") return !ammo;
  if (kind === "crossbow") return ammoKind(ammo) === "bolt";
  if (kind === "bow") return ammoKind(ammo) === "arrow";
  return false;
}

function isLoadoutCompatible(
  weapon: Item | undefined,
  ammo: Item | undefined,
  quiver: Item | undefined,
  shield: Item | undefined,
) {
  const kind = weaponKind(weapon);
  if (kind === "thrown") {
    return Boolean(shield && !ammo && !quiver);
  }
  if (kind === "bow" || kind === "crossbow") {
    return Boolean(quiver && !shield && isAmmoCompatible(weapon, ammo));
  }
  return false;
}

function maxForgeTier(item: Item | undefined) {
  return FORGE_MAX_TIER_BY_CLASS[item?.tierClass ?? 0];
}

function imbuementCapacities(
  loadout: Partial<Record<EquipmentSlot, string>>,
): ImbuementCapacities {
  return {
    weapon: Math.max(0, itemById(loadout.weapon)?.imbueSlots ?? 0),
    armor: Math.max(0, itemById(loadout.armor)?.imbueSlots ?? 0),
    head: Math.max(0, itemById(loadout.head)?.imbueSlots ?? 0),
  };
}

function progressionFor(
  slot: EquipmentSlot,
  preferredKind?: "arrow" | "bolt" | "bow" | "crossbow" | "thrown",
) {
  if (preferredKind === "bow") return BOW_PROGRESSION;
  if (preferredKind === "crossbow") return CROSSBOW_PROGRESSION;
  if (preferredKind === "thrown") return THROWN_PROGRESSION;
  if (preferredKind === "arrow") return ARROW_PROGRESSION;
  if (preferredKind === "bolt") return BOLT_PROGRESSION;
  return SUGGESTED_PROGRESSION[slot] ?? [];
}

/**
 * Automatic suggestions are deliberately limited to an explicit progression
 * of useful hunting equipment. The full catalog remains searchable, but
 * cosmetic/novelty items are never selected merely because their level is
 * high.
 */
function bestItemForSlot(
  slot: EquipmentSlot,
  level: number,
  preferredKind?: "arrow" | "bolt" | "bow" | "crossbow" | "thrown",
) {
  return progressionFor(slot, preferredKind)
    .map((id) => itemById(id))
    .filter(
      (item): item is Item =>
        Boolean(item && item.slot === slot && item.minLevel <= level),
    )
    .at(-1);
}

function normalizeCombatSettings(
  settings: unknown,
  loadout: Partial<Record<EquipmentSlot, string>>,
): CombatSettings {
  const sanitized = sanitizeStoredSettings(
    settings,
    maxForgeTier(itemById(loadout.weapon)),
  );
  const allocation = allocateImbuements(
    sanitized,
    imbuementCapacities(loadout),
  );

  return {
    ...sanitized,
    powerfulStrike: allocation.placements.powerfulStrike !== undefined,
    powerfulVamp: allocation.placements.powerfulVamp !== undefined,
    powerfulVoid: allocation.placements.powerfulVoid !== undefined,
  };
}

function suggestedLoadout(
  level: number,
): Partial<Record<EquipmentSlot, string>> {
  const result: Partial<Record<EquipmentSlot, string>> = {};

  for (const slot of SLOT_ORDER) {
    // The default beginner path uses a bow, so shield remains empty. It is
    // filled automatically when the player deliberately selects thrown.
    if (slot === "shield") continue;
    const best =
      slot === "weapon"
        ? bestItemForSlot(slot, level, "bow")
        : slot === "ammo"
          ? bestItemForSlot(slot, level, "arrow")
          : bestItemForSlot(slot, level);
    if (best) result[slot] = best.id;
  }

  return result;
}

function reconcileLoadout(
  level: number,
  current: Partial<Record<EquipmentSlot, string>> = {},
) {
  const suggested = suggestedLoadout(level);
  const next: Partial<Record<EquipmentSlot, string>> = {};

  for (const slot of SLOT_ORDER) {
    const selected = itemById(current[slot]);
    if (selected && selected.slot === slot) {
      next[slot] = selected.id;
    } else if (suggested[slot]) {
      next[slot] = suggested[slot];
    }
  }

  const weapon = itemById(next.weapon);
  const kind = weaponKind(weapon);
  if (kind === "thrown") {
    delete next.ammo;
    delete next.quiver;
    if (!itemById(next.shield)) {
      const shield = bestItemForSlot("shield", level);
      if (shield) next.shield = shield.id;
    }
  } else {
    delete next.shield;
    if (!itemById(next.quiver)) {
      const quiver = bestItemForSlot("quiver", level);
      if (quiver) next.quiver = quiver.id;
    }
    const ammo = itemById(next.ammo);
    const expected = kind === "crossbow" ? "bolt" : "arrow";
    if (ammoKind(ammo) !== expected) {
      const replacement = bestItemForSlot("ammo", level, expected);
      if (replacement) next.ammo = replacement.id;
      else delete next.ammo;
    }
  }

  return next;
}

function selectItemForLoadout(
  level: number,
  current: Partial<Record<EquipmentSlot, string>>,
  item: Item,
) {
  const next = { ...current, [item.slot]: item.id };

  if (item.slot === "shield" && weaponKind(itemById(next.weapon)) !== "thrown") {
    const thrown = bestItemForSlot("weapon", level, "thrown");
    if (thrown) next.weapon = thrown.id;
  }

  if (
    item.slot === "quiver" &&
    weaponKind(itemById(next.weapon)) === "thrown"
  ) {
    const bow = bestItemForSlot("weapon", level, "bow");
    if (bow) next.weapon = bow.id;
  }

  if (item.slot === "ammo") {
    const expectedWeaponKind = ammoKind(item) === "bolt" ? "crossbow" : "bow";
    if (weaponKind(itemById(next.weapon)) !== expectedWeaponKind) {
      const replacement =
        expectedWeaponKind === "bow"
          ? bestItemForSlot("weapon", level, "bow")
          : bestItemForSlot("weapon", level, "crossbow");
      if (replacement) next.weapon = replacement.id;
    }
  }

  const reconciled = reconcileLoadout(level, next);
  const adjustedSlots = SLOT_ORDER.filter(
    (slot) =>
      slot !== item.slot &&
      (current[slot] ?? null) !== (reconciled[slot] ?? null),
  );

  return { loadout: reconciled, adjustedSlots };
}

function focusLabel(focus: string) {
  if (focus === "leveling") return "Leveling";
  if (focus === "farm") return "Farm";
  if (focus === "equilibrada") return "Equilibrada";
  return "Aprendizado";
}

function metric(value: string | null | undefined) {
  return value?.trim() || "Em reteste";
}

function metricScore(value: string) {
  if (!value || /reteste|—|sem faixa/i.test(value)) return -1;
  const numbers = [...value.matchAll(/(\d+(?:[.,]\d+)?)/g)].map((match) =>
    Number(match[1].replace(",", ".")),
  );
  if (!numbers.length) return -1;
  const average =
    numbers.reduce((total, number) => total + number, 0) / numbers.length;
  return /kk|milh/i.test(value) ? average * 1_000_000 : average * 1_000;
}

function riskClass(risk: Hunt["risk"]) {
  if (risk === "baixo") return "risk-low";
  if (risk === "alto" || risk === "muito alto") return "risk-high";
  return "risk-medium";
}

function protectionEntries(stats: CharacterStats) {
  return Object.entries(stats.protections)
    .filter(([, value]) => Math.abs(value) > 0.04)
    .sort((left, right) => right[1] - left[1]);
}

function formatProtection(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}

function itemStats(item: Item) {
  const stats: string[] = [];
  if (item.attack !== undefined) {
    stats.push(
      item.slot === "ammo" || weaponKind(item) === "thrown"
        ? `Atk ${item.attack}`
        : `Atk +${item.attack}`,
    );
  }
  if (item.hit) stats.push(`Hit ${item.hit > 0 ? "+" : ""}${item.hit}`);
  if (item.distance) stats.push(`Dist +${item.distance}`);
  if (item.magic) stats.push(`Holy ML +${item.magic}`);
  if (item.armor) stats.push(`Arm ${item.armor}`);
  if (item.defense) stats.push(`Def ${item.defense}`);
  if (item.protection?.length) stats.push(item.protection[0]);
  return stats.slice(0, 3);
}

function combatSummary(
  level: number,
  stats: CharacterStats,
  loadout: Partial<Record<EquipmentSlot, string>>,
  settings: CombatSettings,
): CombatSummary {
  const weapon = itemById(loadout.weapon);
  const selectedAmmo = itemById(loadout.ammo);
  const quiver = itemById(loadout.quiver);
  const shield = itemById(loadout.shield);
  const kind = weaponKind(weapon);
  const ammo = kind === "thrown" ? undefined : selectedAmmo;
  const compatible = isLoadoutCompatible(weapon, ammo, quiver, shield);
  const effectiveStance: PaladinStance =
    level >= 20 ? settings.stance : "neutral";
  const ammunitionAttack =
    kind === "thrown" ? weapon?.attack ?? 0 : ammo?.attack ?? 0;
  const weaponAttackModifier =
    kind === "thrown" ? 0 : weapon?.attack ?? 0;
  const hitModifier = (weapon?.hit ?? 0) + (ammo?.hit ?? 0);
  const accuracyProfile = communityRangedAccuracyProfile(
    kind === "thrown" ? weapon?.name : ammo?.name,
    kind === "thrown" ? "thrown" : "ammo",
  );
  const accuracyBasePercent = accuracyProfile.basePercent;
  const estimatedAccuracyPercent = approximateRangedAccuracy(
    hitModifier,
    accuracyBasePercent,
  );
  const effectiveSettings = normalizeCombatSettings(settings, loadout);
  const appliedAccuracyPercent =
    effectiveSettings.accuracyOverride ?? estimatedAccuracyPercent;

  const estimatedCycle = estimateLevelAwareCycle({
    autoAttack: {
      level,
      distance: stats.distance,
      magicLevel: stats.magic,
      stance: effectiveStance,
      ammunitionAttack,
      weaponAttackModifier,
      accuracyPercent: appliedAccuracyPercent,
      targetResistancePercent: settings.resistance,
      critical: effectiveSettings.powerfulStrike
        ? { chancePercent: 10, extraDamagePercent: 50 }
        : { chancePercent: 5, extraDamagePercent: 10 },
      forgeTier: effectiveSettings.forgeTier,
      lifeLeechPercent: effectiveSettings.powerfulVamp ? 25 : 0,
      manaLeechPercent: effectiveSettings.powerfulVoid ? 8 : 0,
    },
    magicLevel: stats.magic,
  });
  const cycle = gateIncompatibleLevelAwareCycle(
    estimatedCycle,
    compatible,
  );

  let compatibilityMessage: string | null = null;
  if (!weapon) {
    compatibilityMessage = "Escolha uma arma para calcular o dano.";
  } else if (kind === "bow" && !ammo) {
    compatibilityMessage = "Escolha uma arrow para este bow.";
  } else if (kind === "crossbow" && !ammo) {
    compatibilityMessage = "Escolha um bolt para este crossbow.";
  } else if ((kind === "bow" || kind === "crossbow") && !quiver) {
    compatibilityMessage =
      "Bows e crossbows precisam de uma aljava equipada.";
  } else if (kind === "thrown" && !shield) {
    compatibilityMessage =
      "Armas de arremesso usam um escudo e não usam aljava ou munição separada.";
  } else if (kind === "thrown" && (selectedAmmo || quiver)) {
    compatibilityMessage =
      "Remova a aljava e a munição: a arma de arremesso já é o projétil.";
  } else if ((kind === "bow" || kind === "crossbow") && shield) {
    compatibilityMessage =
      "Bows e crossbows ocupam as duas mãos: use aljava e munição, sem escudo.";
  } else if (!compatible) {
    compatibilityMessage =
      kind === "crossbow"
        ? "Crossbows precisam de bolts."
        : "Bows precisam de arrows.";
  }

  return {
    ...cycle,
    compatible,
    compatibilityMessage,
    weapon,
    ammo,
    quiver,
    shield,
    effectiveStance,
    accuracyBasePercent,
    estimatedAccuracyPercent,
    appliedAccuracyPercent: compatible ? appliedAccuracyPercent : 0,
    accuracyIsOverridden:
      effectiveSettings.accuracyOverride !== null,
    accuracyUsesFallback: accuracyProfile.isFallback,
  };
}

function ItemSprite({
  item,
  size = "medium",
}: {
  item: Item;
  size?: "small" | "medium" | "large";
}) {
  const [failed, setFailed] = useState(false);
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(
    /\/$/,
    "",
  );

  return (
    <span className={`item-sprite item-sprite-${size}`} aria-hidden="true">
      {failed ? (
        <span className="sprite-fallback">{item.icon}</span>
      ) : (
        // Native img preserves the tiny pixel-art file without an optimizer.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`${basePath}/items/${item.id}.png`}
          width={32}
          height={32}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}

export default function RoyalPathApp() {
  const [view, setView] = useState<ViewId>("inicio");
  const [level, setLevel] = useState(DEFAULT_LEVEL);
  const [distance, setDistance] = useState(DEFAULT_DISTANCE);
  const [magicLevel, setMagicLevel] = useState(DEFAULT_MAGIC_LEVEL);
  const [completed, setCompleted] = useState<string[]>([]);
  const [loadout, setLoadout] =
    useState<Partial<Record<EquipmentSlot, string>>>(() =>
      suggestedLoadout(DEFAULT_LEVEL),
    );
  const [settings, setSettings] =
    useState<CombatSettings>(DEFAULT_SETTINGS);
  const [notice, setNotice] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let saved: StoredProfile | undefined;

    try {
      const raw =
        window.localStorage.getItem(STORAGE_KEY) ??
        window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) saved = JSON.parse(raw) as StoredProfile;
    } catch {
      // Persistence is optional. The guide remains usable without it.
    }

    queueMicrotask(() => {
      const hash = window.location.hash.replace("#", "") as ViewId;
      if (NAVIGATION.some((item) => item.id === hash)) setView(hash);
      const nextLevel = clampLevel(saved?.level ?? DEFAULT_LEVEL);
      setLevel(nextLevel);
      setDistance(
        clamp(saved?.distance ?? DEFAULT_DISTANCE, 10, 250, DEFAULT_DISTANCE),
      );
      setMagicLevel(
        clamp(
          saved?.magicLevel ?? DEFAULT_MAGIC_LEVEL,
          0,
          200,
          DEFAULT_MAGIC_LEVEL,
        ),
      );
      setCompleted(
        Array.isArray(saved?.completed) ? saved.completed : [],
      );
      const restoredLoadout = reconcileLoadout(nextLevel, saved?.loadout);
      setLoadout(restoredLoadout);
      setSettings(normalizeCombatSettings({
        ...DEFAULT_SETTINGS,
        ...(
          typeof saved?.settings === "object" &&
            saved.settings !== null &&
            !Array.isArray(saved.settings)
            ? saved.settings
            : {}
        ),
      }, restoredLoadout));
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          level,
          distance,
          magicLevel,
          completed,
          loadout,
          settings,
        }),
      );
    } catch {
      // Persistence is optional.
    }
  }, [
    completed,
    distance,
    hydrated,
    level,
    loadout,
    magicLevel,
    settings,
  ]);

  useEffect(() => {
    function handleHistory() {
      const hash = window.location.hash.replace("#", "") as ViewId;
      if (NAVIGATION.some((item) => item.id === hash)) setView(hash);
    }

    window.addEventListener("popstate", handleHistory);
    return () => window.removeEventListener("popstate", handleHistory);
  }, []);

  const equipped = useMemo(
    () =>
      SLOT_ORDER.map((slot) => itemById(loadout[slot])).filter(
        Boolean,
      ) as Item[],
    [loadout],
  );
  const stats = useMemo(
    () =>
      calculateCharacterStats({
        level,
        distance,
        magic: magicLevel,
        items: equipped,
      }),
    [distance, equipped, level, magicLevel],
  );
  const combat = useMemo(
    () => combatSummary(level, stats, loadout, settings),
    [level, loadout, settings, stats],
  );
  const currentBand = useMemo(() => bandForLevel(level), [level]);

  function navigate(next: ViewId) {
    setView(next);
    window.history.pushState(null, "", `#${next}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>("[data-view-title]")?.focus();
    });
  }

  function changeLevel(nextValue: number) {
    const nextLevel = clampLevel(nextValue);
    const reconciled = reconcileLoadout(nextLevel, loadout);
    const unavailableCount = SLOT_ORDER.filter(
      (slot) => (itemById(reconciled[slot])?.minLevel ?? 0) > nextLevel,
    ).length;

    setLevel(nextLevel);
    setLoadout(reconciled);
    setSettings((current) =>
      normalizeCombatSettings(current, reconciled),
    );
    setNotice(
      unavailableCount
        ? `${unavailableCount} item(ns) ficaram acima do seu level. Eles continuam selecionados para a simula\u00e7\u00e3o.`
        : "",
    );
  }

  function equip(item: Item) {
    const selection = selectItemForLoadout(level, loadout, item);
    const next = selection.loadout;
    setLoadout(next);
    setSettings((current) =>
      normalizeCombatSettings(current, next),
    );
    const baseNotice =
      item.minLevel > level
        ? `${item.name} foi selecionado apenas para simula\u00e7\u00e3o: requer level ${item.minLevel}.`
        : `${item.name} foi equipado.`;
    const automaticAdjustments = selection.adjustedSlots.map((slot) => {
      const selected = itemById(next[slot]);
      return `${SLOT_LABELS[slot]} → ${selected?.name ?? "vazio"}`;
    });
    setNotice(
      automaticAdjustments.length
        ? `${baseNotice} Ajustes automáticos: ${automaticAdjustments.join("; ")}.`
        : baseNotice,
    );
  }

  function resetLoadout() {
    const next = suggestedLoadout(level);
    setLoadout(next);
    setSettings((current) =>
      normalizeCombatSettings(current, next),
    );
    setNotice("Aplicamos uma base simples para o seu level.");
  }

  function applyContext(context: BisContext) {
    const next = { ...loadout };
    for (const [slot, ids] of Object.entries(context.slots) as Array<
      [EquipmentSlot, readonly string[]]
    >) {
      const eligible = ids
        .map((id) => itemById(id))
        .find((item) => item && item.minLevel <= level);
      if (eligible) next[slot] = eligible.id;
    }
    const reconciled = reconcileLoadout(level, next);
    setLoadout(reconciled);
    setSettings((current) =>
      normalizeCombatSettings(current, reconciled),
    );
    setNotice(`Preset “${context.label}” aplicado ao que seu level permite.`);
  }

  function toggleCompleted(id: string) {
    setCompleted((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  return (
    <div className="app-shell">
      <a href="#conteudo" className="skip-link">
        Ir para o conteúdo
      </a>

      <header className="site-header">
        <div className="header-inner">
          <button
            type="button"
            className="brand"
            onClick={() => navigate("inicio")}
            aria-label="RoyalPath — ir para o início"
          >
            <span className="brand-mark" aria-hidden="true">
              RP
            </span>
            <span className="brand-copy">
              <strong>RoyalPath</strong>
              <small>Guia Royal Paladin</small>
            </span>
          </button>

          <div className="masthead-tagline">
            <strong>Manual do aventureiro</strong>
            <span>Royal Paladin · do level 8 ao endgame</span>
          </div>

          <label className="header-level" htmlFor="character-level">
            <span>Meu level</span>
            <input
              id="character-level"
              type="number"
              min={8}
              max={2500}
              value={level}
              onChange={(event) => changeLevel(event.target.valueAsNumber)}
            />
          </label>
        </div>
      </header>

      <nav className="mobile-nav" aria-label="Navegação principal">
        {NAVIGATION.map((item) => (
          <a
            href={`#${item.id}`}
            key={item.id}
            aria-current={view === item.id ? "page" : undefined}
            onClick={(event) => {
              event.preventDefault();
              navigate(item.id);
            }}
          >
            <span aria-hidden="true">{item.marker}</span>
            {item.shortLabel}
          </a>
        ))}
      </nav>

      <div className="site-layout">
        <aside className="side-rail left-rail" aria-label="Menu do RoyalPath">
          <div className="rail-title">Navegação</div>
          <nav className="desktop-nav" aria-label="Navegação principal">
            {NAVIGATION.map((item) => (
              <a
                href={`#${item.id}`}
                key={item.id}
                aria-current={view === item.id ? "page" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  navigate(item.id);
                }}
              >
                <span aria-hidden="true">{item.marker}</span>
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
          <div className="rail-tip">
            <strong>Primeira vez?</strong>
            Comece em Tutoriais e marque os marcos da Jornada conforme avançar.
          </div>
        </aside>
      <main className="site-frame" id="conteudo" tabIndex={-1}>
        {notice ? (
          <div className="status-message" role="status">
            <span aria-hidden="true">✓</span>
            {notice}
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Fechar aviso"
            >
              ×
            </button>
          </div>
        ) : null}

        {view === "inicio" ? (
          <DashboardView
            level={level}
            distance={distance}
            magicLevel={magicLevel}
            stats={stats}
            combat={combat}
            band={currentBand}
            setLevel={changeLevel}
            setDistance={setDistance}
            setMagicLevel={setMagicLevel}
            navigate={navigate}
          />
        ) : null}

        {view === "arsenal" ? (
          <ArsenalView
            level={level}
            loadout={loadout}
            stats={stats}
            combat={combat}
            equip={equip}
            resetLoadout={resetLoadout}
            applyContext={applyContext}
          />
        ) : null}

        {view === "simulador" ? (
          <SimulatorView
            level={level}
            distance={distance}
            magicLevel={magicLevel}
            loadout={loadout}
            stats={stats}
            combat={combat}
            settings={settings}
            setLevel={changeLevel}
            setDistance={setDistance}
            setMagicLevel={setMagicLevel}
            setSettings={setSettings}
            navigate={navigate}
          />
        ) : null}

        {view === "hunts" ? <HuntsView level={level} /> : null}

        {view === "tutoriais" ? <TutorialsView level={level} /> : null}

        {view === "jornada" ? (
          <JourneyView
            level={level}
            completed={completed}
            toggleCompleted={toggleCompleted}
          />
        ) : null}

        <Disclosure />
        <Footer />
      </main>

        <aside className="side-rail right-rail" aria-label="Resumo do meu Royal Paladin">
          <div className="rail-title">Meu Paladin</div>
          <section className="rail-panel character-rail-panel">
            <div className="rail-level">
              <span>Level</span>
              <strong>{level}</strong>
            </div>
            <dl className="rail-stats">
              <div><dt>Distance</dt><dd>{stats.distance.toFixed(0)}</dd></div>
              <div><dt>Magic</dt><dd>{stats.magic.toFixed(0)}</dd></div>
              <div><dt>Vida</dt><dd>{stats.hp.toLocaleString("pt-BR")}</dd></div>
              <div><dt>Mana</dt><dd>{stats.mana.toLocaleString("pt-BR")}</dd></div>
            </dl>
            <button type="button" className="rail-link" onClick={() => navigate("simulador")}>
              Abrir simulador →
            </button>
          </section>

          <section className="rail-panel">
            <h2>Arsenal atual</h2>
            <div className="right-rail-loadout">
              {equipped.slice(0, SLOT_ORDER.length).map((item) => (
                <div key={item.id} title={item.name}>
                  <ItemSprite item={item} size="small" />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
            {equipped.some((item) => item.minLevel > level) ? (
              <p className="rail-future-note">
                Simulação hipotética: há itens acima do seu level.
              </p>
            ) : null}
            <button type="button" className="rail-link" onClick={() => navigate("arsenal")}>
              Trocar itens →
            </button>
          </section>

          <section className="rail-panel rail-help">
            <h2>Está começando?</h2>
            <p>
              Comece pela primeira hora, quiver, treino, blessings, promoção e
              imbuements.
            </p>
            <button type="button" className="rail-link" onClick={() => navigate("tutoriais")}>
              Ver tutoriais →
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}

function ProfilePanel({
  level,
  distance,
  magicLevel,
  setLevel,
  setDistance,
  setMagicLevel,
  compact = false,
}: {
  level: number;
  distance: number;
  magicLevel: number;
  setLevel: (value: number) => void;
  setDistance: (value: number) => void;
  setMagicLevel: (value: number) => void;
  compact?: boolean;
}) {
  return (
    <section className={`profile-panel${compact ? " is-compact" : ""}`}>
      <div className="panel-heading">
        <div>
          <span className="step-kicker">Passo 1</span>
          <h2>Conte sobre seu personagem</h2>
          <p>Use os valores que aparecem na janela de skills do jogo.</p>
        </div>
      </div>

      <div className="profile-fields">
        <label>
          <span>Level</span>
          <input
            type="number"
            min={8}
            max={2500}
            value={level}
            onChange={(event) => setLevel(event.target.valueAsNumber)}
          />
          <small>Define vida, mana e itens disponíveis.</small>
        </label>
        <label>
          <span>Distance</span>
          <input
            type="number"
            min={10}
            max={250}
            value={distance}
            onChange={(event) =>
              setDistance(
                clamp(event.target.valueAsNumber, 10, 250, DEFAULT_DISTANCE),
              )
            }
          />
          <small>Seu skill base, antes dos equipamentos.</small>
        </label>
        <label>
          <span>Magic level</span>
          <input
            type="number"
            min={0}
            max={200}
            value={magicLevel}
            onChange={(event) =>
              setMagicLevel(
                clamp(
                  event.target.valueAsNumber,
                  0,
                  200,
                  DEFAULT_MAGIC_LEVEL,
                ),
              )
            }
          />
          <small>Seu ML base, antes dos bônus do set.</small>
        </label>
      </div>
    </section>
  );
}

function StatsSummary({
  stats,
  combat,
  compact = false,
}: {
  stats: CharacterStats;
  combat: CombatSummary;
  compact?: boolean;
}) {
  const physical = stats.protections.physical ?? 0;
  const dps = combat.compatible ? Math.round(combat.expectedDps) : 0;

  return (
    <section
      className={`stats-summary${compact ? " is-compact" : ""}`}
      aria-label="Resumo do personagem"
    >
      <article className="summary-card summary-health">
        <span className="summary-icon" aria-hidden="true">
          ♥
        </span>
        <div>
          <small>Vida máxima</small>
          <strong>{stats.hp.toLocaleString("pt-BR")}</strong>
          <span>pelo seu level</span>
        </div>
      </article>
      <article className="summary-card summary-mana">
        <span className="summary-icon" aria-hidden="true">
          ◆
        </span>
        <div>
          <small>Mana máxima</small>
          <strong>{stats.mana.toLocaleString("pt-BR")}</strong>
          <span>pelo seu level</span>
        </div>
      </article>
      <article className="summary-card summary-dps">
        <span className="summary-icon" aria-hidden="true">
          ✦
        </span>
        <div>
          <small>DPS estimado</small>
          <strong>{dps.toLocaleString("pt-BR")}</strong>
          <span>Estimativa comparativa em 1 alvo · {combat.rotationLabel}</span>
        </div>
      </article>
      <article className="summary-card summary-defense">
        <span className="summary-icon" aria-hidden="true">
          ◈
        </span>
        <div>
          <small>Armadura e proteção física</small>
          <strong>
            {stats.armor} arm ·{" "}
            {physical
              ? `${formatProtection(physical)} físico`
              : "0% físico"}
          </strong>
          <span>Def {stats.defense} é valor bruto, não redução direta.</span>
        </div>
      </article>
    </section>
  );
}

function DashboardView({
  level,
  distance,
  magicLevel,
  stats,
  combat,
  band,
  setLevel,
  setDistance,
  setMagicLevel,
  navigate,
}: {
  level: number;
  distance: number;
  magicLevel: number;
  stats: CharacterStats;
  combat: CombatSummary;
  band: ProgressionBand;
  setLevel: (value: number) => void;
  setDistance: (value: number) => void;
  setMagicLevel: (value: number) => void;
  navigate: (view: ViewId) => void;
}) {
  const nextMilestone = MILESTONES.find((milestone) => milestone.level > level);
  const safeHunts = HUNTS.filter((hunt) => level >= hunt.minLevel + 20);

  return (
    <section className="view" aria-labelledby="inicio-title">
      <div className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Guia para quem está começando</p>
          <h1 id="inicio-title" data-view-title tabIndex={-1}>
            Seu Royal Paladin, <span>sem complicação.</span>
          </h1>
          <p className="hero-text">
            Informe level e skills, escolha os itens que você usa e entenda o
            resultado em números simples. Vida, mana, dano e proteção ficam no
            mesmo lugar.
          </p>
          <div className="hero-actions">
            <button
              className="button button-primary"
              type="button"
              onClick={() => navigate("arsenal")}
            >
              Montar meu set
            </button>
            <button
              className="button button-secondary"
              type="button"
              onClick={() => navigate("simulador")}
            >
              Ver o simulador
            </button>
          </div>
        </div>
        <aside className="hero-stage" aria-label="Sua fase atual">
          <span className="stage-level">Level {level}</span>
          <small>Você está na fase</small>
          <h2>{band.title}</h2>
          <p>{band.focus}</p>
          <div className="stage-next">
            <span>Próximo marco</span>
            <strong>
              {nextMilestone
                ? `Lv ${nextMilestone.level} · ${nextMilestone.title}`
                : "Continue refinando seus sets"}
            </strong>
          </div>
        </aside>
      </div>

      <ProfilePanel
        level={level}
        distance={distance}
        magicLevel={magicLevel}
        setLevel={setLevel}
        setDistance={setDistance}
        setMagicLevel={setMagicLevel}
      />

      <div className="section-intro section-intro-inline">
        <div>
          <span className="step-kicker">Passos 2 e 3</span>
          <h2>Veja o que seu personagem entrega agora</h2>
        </div>
        <button
          className="text-button"
          type="button"
          onClick={() => navigate("arsenal")}
        >
          Conferir equipamentos →
        </button>
      </div>
      <StatsSummary stats={stats} combat={combat} />

      {!combat.compatible ? (
        <div className="beginner-alert" role="alert">
          <strong>Seu dano ainda não pode ser estimado.</strong>
          {combat.compatibilityMessage} Abra o Arsenal para corrigir.
        </div>
      ) : null}

      <div className="home-grid">
        <article className="content-card next-action-card">
          <span className="card-label">Faça isto agora</span>
          <h2>{nextMilestone?.title ?? "Aprimore um set por contexto"}</h2>
          <p>
            {nextMilestone?.summary ??
              "Seu level já passou pelos marcos principais. Compare proteção e recuperação de vida/mana (sustain) antes de comprar."}
          </p>
          <ul className="clean-list">
            {(nextMilestone?.actions ?? band.goals).slice(0, 3).map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => navigate("jornada")}
          >
            Abrir minha jornada
          </button>
        </article>

        <article className="content-card">
          <span className="card-label">Hunts com margem</span>
          <h2>{safeHunts.length} opções para começar com calma</h2>
          <p>
            A margem iniciante considera o level sugerido pela comunidade mais
            20 levels. Ainda não é garantia de segurança.
          </p>
          <div className="mini-hunts">
            {safeHunts.slice(-3).reverse().map((hunt) => (
              <div key={hunt.id}>
                <strong>{hunt.name}</strong>
                <span>Lv {hunt.minLevel}+ · {hunt.risk}</span>
              </div>
            ))}
            {!safeHunts.length ? (
              <p>
                No início, prefira criaturas isoladas, caminho de saída e
                supplies baratos.
              </p>
            ) : null}
          </div>
          <button
            className="text-button"
            type="button"
            onClick={() => navigate("hunts")}
          >
            Ver onde caçar →
          </button>
        </article>
      </div>
    </section>
  );
}

function EquipmentBoard({
  loadout,
  level,
  selectedSlot,
  onSelectSlot,
}: {
  loadout: Partial<Record<EquipmentSlot, string>>;
  level: number;
  selectedSlot?: EquipmentSlot;
  onSelectSlot?: (slot: EquipmentSlot) => void;
}) {
  return (
    <div className="equipment-board">
      <div className="equipment-board-heading">
        <div>
          <span className="card-label">Equipado agora</span>
          <h2>Seu set</h2>
        </div>
        <span className="save-note">Salvo neste dispositivo</span>
      </div>
      <div className="equipment-grid" aria-label="Equipamentos selecionados">
        {SLOT_ORDER.map((slot) => {
          const item = itemById(loadout[slot]);
          const unavailable = Boolean(item && item.minLevel > level);
          return (
            <button
              type="button"
              className={`equipment-slot${
                selectedSlot === slot ? " is-selected" : ""
              }${item ? " is-filled" : ""}${unavailable ? " is-future" : ""}`}
              key={slot}
              onClick={() => onSelectSlot?.(slot)}
              disabled={!onSelectSlot}
              aria-pressed={
                onSelectSlot ? selectedSlot === slot : undefined
              }
              aria-label={`${SLOT_LABELS[slot]}: ${item?.name ?? "vazio"}${unavailable ? `; requer level ${item?.minLevel}` : ""}`}
            >
              {item ? (
                <ItemSprite item={item} size="large" />
              ) : (
                <span className="empty-sprite" aria-hidden="true">
                  +
                </span>
              )}
              <span>
                <small>{SLOT_LABELS[slot]}</small>
                <strong>{item?.name ?? "Vazio"}</strong>
                {unavailable ? (
                  <small className="slot-level-warning">
                    Requer Lv {item?.minLevel}
                  </small>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProtectionPanel({ stats }: { stats: CharacterStats }) {
  const entries = protectionEntries(stats);

  return (
    <article className="content-card protection-panel">
      <div className="panel-heading">
        <div>
          <span className="card-label">Defesas</span>
          <h2>O que o set protege</h2>
        </div>
        <span className="armor-badge">
          {stats.armor} arm · {stats.defense} defesa
        </span>
      </div>
      <p>
        A armor reduz dano físico em uma faixa aproximada de{" "}
        <strong>
          {stats.armorReduction.min}–{stats.armorReduction.max}
        </strong>{" "}
        por hit que atravessa a defesa. O valor de defesa do escudo/arma é
        exibido separadamente e não entra nessa faixa de armor.
      </p>
      <div className="protection-list">
        {entries.map(([key, value]) => (
          <div
            className={`protection-row${value < 0 ? " is-negative" : ""}`}
            key={key}
          >
            <span>{PROTECTION_LABELS[key] ?? key}</span>
            <strong>{formatProtection(value)}</strong>
          </div>
        ))}
        {!entries.length ? (
          <div className="empty-copy">
            Este set não tem proteções percentuais catalogadas.
          </div>
        ) : null}
      </div>
      <small className="helper-copy">
        Proteções de várias peças são compostas com redução progressiva, não
        apenas somadas.
      </small>
    </article>
  );
}

function ArsenalView({
  level,
  loadout,
  stats,
  combat,
  equip,
  resetLoadout,
  applyContext,
}: {
  level: number;
  loadout: Partial<Record<EquipmentSlot, string>>;
  stats: CharacterStats;
  combat: CombatSummary;
  equip: (item: Item) => void;
  resetLoadout: () => void;
  applyContext: (context: BisContext) => void;
}) {
  const [slot, setSlot] = useState<EquipmentSlot>("weapon");
  const [query, setQuery] = useState("");
  const currentWeapon = itemById(loadout.weapon);
  const contexts = BIS_CONTEXTS.filter(
    (context) => context.minLevel <= level,
  ).sort((a, b) => b.minLevel - a.minLevel);

  const choices = ITEMS.filter((item) => {
    if (item.slot !== slot) return false;
    if (slot === "ammo" && weaponKind(currentWeapon) === "thrown") {
      return false;
    }
    if (
      slot === "ammo" &&
      weaponKind(currentWeapon) === "bow" &&
      ammoKind(item) !== "arrow"
    ) {
      return false;
    }
    if (
      slot === "ammo" &&
      weaponKind(currentWeapon) === "crossbow" &&
      ammoKind(item) !== "bolt"
    ) {
      return false;
    }
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    return (
      !normalized ||
      `${item.name} ${item.summary} ${item.useCase.join(" ")}`
        .toLocaleLowerCase("pt-BR")
        .includes(normalized)
    );
  }).sort(
    (a, b) => {
      const aFuture = a.minLevel > level;
      const bFuture = b.minLevel > level;
      const availability = Number(aFuture) - Number(bFuture);
      if (availability) return availability;
      const levelDifference = aFuture
        ? a.minLevel - b.minLevel
        : b.minLevel - a.minLevel;
      return levelDifference || a.name.localeCompare(b.name);
    },
  );
  const availableCount = choices.filter((item) => item.minLevel <= level).length;

  return (
    <section className="view" aria-labelledby="arsenal-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Passo 2 · escolha visual</p>
          <h1 id="arsenal-title" data-view-title tabIndex={-1}>
            Monte seu Arsenal
          </h1>
          <p>
            Pesquise qualquer equipamento de Royal Paladin pelo nome. Itens
            acima do seu level continuam selecionáveis para comparar no simulador.
          </p>
        </div>
        <button
          className="button button-secondary"
          type="button"
          onClick={resetLoadout}
        >
          Sugerir set do level
        </button>
      </div>

      <StatsSummary stats={stats} combat={combat} compact />

      <div className="arsenal-layout">
        <EquipmentBoard
          loadout={loadout}
          level={level}
          selectedSlot={slot}
          onSelectSlot={setSlot}
        />

        <div className="item-picker">
          <div className="item-picker-heading">
            <div>
              <span className="card-label">Trocar item</span>
              <h2>{SLOT_LABELS[slot]}</h2>
              <p>{availableCount} pode usar agora · {choices.length - availableCount} para simular.</p>
            </div>
            <label className="item-search">
              <span className="sr-only">Buscar item</span>
              <input
                type="search"
                placeholder="Buscar item…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          </div>

          <div className="picker-level-legend" aria-label="Legenda de disponibilidade">
            <span><i className="legend-ready" /> Pode usar agora</span>
            <span><i className="legend-future" /> Acima do level · seleção liberada</span>
          </div>

          {slot === "ammo" ? (
            <p className="compatibility-helper">
              {weaponKind(currentWeapon) === "bow"
                ? "Filtro ativo: este bow usa arrows, então somente arrows são exibidas."
                : weaponKind(currentWeapon) === "crossbow"
                  ? "Filtro ativo: este crossbow usa bolts, então somente bolts são exibidos."
                  : "Armas de arremesso não usam munição separada. Escolha um bow ou crossbow no slot Arma para ver a munição compatível."}
            </p>
          ) : null}

          <div className="item-list">
            {choices.map((item) => {
              const selected = loadout[item.slot] === item.id;
              const unavailable = item.minLevel > level;
              return (
                <button
                  className={`item-option${selected ? " is-equipped" : ""}${unavailable ? " is-future" : ""}`}
                  type="button"
                  key={item.id}
                  onClick={() => equip(item)}
                  aria-pressed={selected}
                  aria-label={`${item.name}. ${unavailable ? `Requer level ${item.minLevel}; faltam ${item.minLevel - level}. Selecionar para simulação.` : "Disponível para equipar."}`}
                >
                  <ItemSprite item={item} size="large" />
                  <span className="item-option-copy">
                    <span className="item-name-row">
                      <strong>{item.name}</strong>
                      <small className={unavailable ? "level-badge is-locked" : "level-badge"}>
                        {unavailable
                          ? `Requer Lv ${item.minLevel} · faltam ${item.minLevel - level}`
                          : item.minLevel
                            ? `Lv ${item.minLevel}`
                            : "Sem requisito"}
                      </small>
                    </span>
                    <span className="item-stat-row">
                      {itemStats(item).map((stat) => (
                        <span key={stat}>{stat}</span>
                      ))}
                    </span>
                    <small>{item.summary}</small>
                  </span>
                  <span className="equip-action">
                    {selected ? "Selecionado" : unavailable ? "Simular" : "Equipar"}
                  </span>
                </button>
              );
            })}
            {!choices.length ? (
              <div className="empty-state">
                Nenhum item encontrado para este slot e busca.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="arsenal-bottom-grid">
        <ProtectionPanel stats={stats} />

        <article className="content-card preset-card">
          <span className="card-label">Opcional</span>
          <h2>Presets por objetivo</h2>
          <p>
            Eles trocam apenas os itens catalogados e liberados no seu level.
            Use como ponto de partida, não como verdade absoluta.
          </p>
          <div className="preset-list">
            {contexts.slice(0, 4).map((context) => (
              <button
                type="button"
                key={context.id}
                onClick={() => applyContext(context)}
              >
                <span>
                  <strong>{context.label}</strong>
                  <small>{context.goal}</small>
                </span>
                <span aria-hidden="true">→</span>
              </button>
            ))}
            {!contexts.length ? (
              <div className="empty-copy">
                Os presets começam no level 200. Até lá, use a sugestão simples
                do seu level.
              </div>
            ) : null}
          </div>
        </article>
      </div>
    </section>
  );
}

function SimulatorView({
  level,
  distance,
  magicLevel,
  loadout,
  stats,
  combat,
  settings,
  setLevel,
  setDistance,
  setMagicLevel,
  setSettings,
  navigate,
}: {
  level: number;
  distance: number;
  magicLevel: number;
  loadout: Partial<Record<EquipmentSlot, string>>;
  stats: CharacterStats;
  combat: CombatSummary;
  settings: CombatSettings;
  setLevel: (value: number) => void;
  setDistance: (value: number) => void;
  setMagicLevel: (value: number) => void;
  setSettings: (settings: CombatSettings) => void;
  navigate: (view: ViewId) => void;
}) {
  const protections = protectionEntries(stats);
  const futureItems = SLOT_ORDER.map((slot) => itemById(loadout[slot])).filter(
    (item): item is Item => Boolean(item && item.minLevel > level),
  ).sort((left, right) => left.minLevel - right.minLevel);
  const capacities = imbuementCapacities(loadout);
  const imbuementAllocation = allocateImbuements(settings, capacities);
  const activeImbueCount = Object.keys(
    imbuementAllocation.placements,
  ).length;
  const imbuementPlacementSummary = (
    Object.entries(imbuementAllocation.placements) as Array<
      [ImbuementKey, ImbuementEquipmentSlot]
    >
  ).map(
    ([key, slot]) =>
      `${IMBUEMENT_LABELS[key]} → ${IMBUEMENT_SLOT_LABELS[slot]}`,
  );
  const weaponMaxForgeTier = maxForgeTier(combat.weapon);

  function patchSettings(patch: Partial<CombatSettings>) {
    setSettings(
      normalizeCombatSettings(
        { ...settings, ...patch },
        loadout,
      ),
    );
  }

  function toggleImbuement(
    key: ImbuementKey,
  ) {
    const requested = { ...settings, [key]: !settings[key] };
    if (
      !settings[key] &&
      !canAllocateAllImbuements(requested, capacities)
    ) {
      return;
    }
    patchSettings({ [key]: !settings[key] });
  }

  function canEnableImbuement(key: ImbuementKey) {
    return (
      settings[key] ||
      canAllocateAllImbuements(
        { ...settings, [key]: true },
        capacities,
      )
    );
  }

  return (
    <section className="view" aria-labelledby="simulator-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Passo 3 · resultado simples</p>
          <h1 id="simulator-title" data-view-title tabIndex={-1}>
            Entenda seu personagem
          </h1>
          <p>
            O resumo usa seu level, skills e Arsenal. Comece pelos quatro
            números principais; abra os ajustes só quando precisar.
          </p>
        </div>
        <span className="model-badge">Estimativa comparativa</span>
      </div>

      <StatsSummary stats={stats} combat={combat} />

      {futureItems.length ? (
        <div className="beginner-alert hypothetical-alert" role="status">
          <strong>Simulação hipotética.</strong>
          Os números incluem {futureItems.length} item(ns) acima do seu level: {futureItems.map((item) => item.name).join(", ")}.
          Você pode comparar normalmente, mas ainda não pode usá-los no jogo.
          <button type="button" onClick={() => navigate("arsenal")}>
            Revisar no Arsenal
          </button>
        </div>
      ) : null}

      {!combat.compatible ? (
        <div className="beginner-alert" role="alert">
          <strong>O loadout precisa de atenção.</strong>
          {combat.compatibilityMessage}
          <button type="button" onClick={() => navigate("arsenal")}>
            Corrigir no Arsenal
          </button>
        </div>
      ) : null}

      <div className="simulator-simple-grid">
        <ProfilePanel
          level={level}
          distance={distance}
          magicLevel={magicLevel}
          setLevel={setLevel}
          setDistance={setDistance}
          setMagicLevel={setMagicLevel}
          compact
        />

        <article className="content-card result-explainer">
          <div className="panel-heading">
            <div>
              <span className="card-label">Como ler o DPS</span>
              <h2>{combat.rotationLabel}</h2>
            </div>
            <strong className="big-dps">
              {combat.compatible
                ? Math.round(combat.expectedDps).toLocaleString("pt-BR")
                : "—"}
              <small>DPS</small>
            </strong>
          </div>
          <div className="simple-result-grid">
            <div>
              <span>Autoattack médio</span>
              <strong>
                {Math.round(
                  combat.autoAttack.expectedDamagePerAttempt,
                ).toLocaleString("pt-BR")}
              </strong>
            </div>
            <div>
              <span>Precisão usada</span>
              <strong>
                {combat.compatible
                  ? `${combat.appliedAccuracyPercent}%`
                  : "—"}
              </strong>
            </div>
            <div>
              <span>Distance com set</span>
              <strong>{stats.distance.toFixed(0)}</strong>
            </div>
            <div>
              <span>Magic level com set</span>
              <strong>{stats.magic.toFixed(0)}</strong>
            </div>
            <div>
              <span>Leech por ciclo</span>
              <strong>
                {combat.primaryTargetLeech.life} vida ·{" "}
                {combat.primaryTargetLeech.mana} mana
              </strong>
            </div>
          </div>
          <p className="result-note">
            {combat.accuracyIsOverridden
              ? `A precisão de ${combat.appliedAccuracyPercent}% informada por você substitui a aproximação. `
              : combat.accuracyUsesFallback
                ? `Sem base catalogada para este item, o simulador usa o fallback explícito de ${combat.accuracyBasePercent}%; com o Hit impresso, a aproximação fica em ${combat.estimatedAccuracyPercent}%. `
                : `A base comunitária desta munição/arma é ${combat.accuracyBasePercent}%; com o Hit impresso, a aproximação fica em ${combat.estimatedAccuracyPercent}%. `}
            Não é uma fórmula oficial. Resistências, quantidade de alvos,
            Wheel, charms, prey e execução real mudam o resultado.
          </p>
        </article>
      </div>

      <div className="simulator-detail-grid">
        <article className="content-card loadout-preview">
          <div className="panel-heading">
            <div>
              <span className="card-label">Itens usados no cálculo</span>
              <h2>Arsenal atual</h2>
            </div>
            <button
              className="text-button"
              type="button"
              onClick={() => navigate("arsenal")}
            >
              Trocar itens →
            </button>
          </div>
          <div className="loadout-strip">
            {SLOT_ORDER.map((slot) => {
              const item = itemById(loadout[slot]);
              return item ? (
                <div key={slot}>
                  <ItemSprite item={item} size="medium" />
                  <small>{SLOT_LABELS[slot]}</small>
                  <span>{item.name}</span>
                </div>
              ) : null;
            })}
          </div>
          <div className="protection-chips">
            {protections.slice(0, 5).map(([key, value]) => (
              <span key={key}>
                {PROTECTION_LABELS[key] ?? key} {formatProtection(value)}
              </span>
            ))}
          </div>
        </article>

        <ProtectionPanel stats={stats} />
      </div>

      <details className="advanced-panel">
        <summary>
          <span>
            <strong>Ajustes opcionais</strong>
            <small>Stance, resistência, imbuements e Forge</small>
          </span>
          <span aria-hidden="true">+</span>
        </summary>
        <div className="advanced-content">
          <div className="advanced-grid">
            <label>
              <span>Stance</span>
              <select
                value={settings.stance}
                disabled={level < 20}
                onChange={(event) =>
                  patchSettings({
                    stance: event.target.value as PaladinStance,
                  })
                }
              >
                <option value="neutral">Sem stance</option>
                <option value="sharpshooter">
                  Sharpshooter · mais Distance
                </option>
                <option value="divine-defiance">
                  Divine Defiance · mais Holy/Healing ML
                </option>
              </select>
              <small>
                {level < 20
                  ? "Disponível após a promoção no level 20."
                  : "Sharpshooter favorece dano; Defiance reforça holy/cura e dá 12% de dodge contra ataques não adjacentes."}
              </small>
            </label>

            <label>
              <span>Resistência do alvo</span>
              <div className="range-control">
                <input
                  type="range"
                  min={-30}
                  max={80}
                  value={settings.resistance}
                  onChange={(event) =>
                    patchSettings({
                      resistance: Number(event.target.value),
                    })
                  }
                />
                <strong>{settings.resistance}%</strong>
              </div>
              <small>Deixe em 0% se você não souber.</small>
            </label>

            <label>
              <span>Precisão mostrada no cliente (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={settings.accuracyOverride ?? ""}
                placeholder={`${combat.estimatedAccuracyPercent}`}
                onChange={(event) =>
                  patchSettings({
                    accuracyOverride:
                      event.target.value === ""
                        ? null
                        : Number(event.target.value),
                  })
                }
              />
              <small>
                Vazio usa a estimativa. Consulte Cyclopedia → Combat Stats.
              </small>
            </label>

            <label>
              <span>Tier da arma (nível de Forge)</span>
              <select
                value={settings.forgeTier}
                disabled={weaponMaxForgeTier === 0}
                onChange={(event) =>
                  patchSettings({
                    forgeTier: Number(event.target.value),
                  })
                }
              >
                {Array.from({ length: weaponMaxForgeTier + 1 }, (_, tier) => (
                  <option value={tier} key={tier}>
                    {tier === 0 ? "Sem tier" : `Tier ${tier}`}
                  </option>
                ))}
              </select>
              <small>
                {weaponMaxForgeTier
                  ? `Classe ${combat.weapon?.tierClass}: até Tier ${weaponMaxForgeTier}.`
                  : "Esta arma não tem classe de tier elegível para Forge."}
              </small>
            </label>
          </div>

          <div className="imbue-options">
            <span>
              Imbuements ativos · {activeImbueCount}
            </span>
            <small className="imbue-capacities">
              Slots elegíveis por peça: Arma {capacities.weapon} para
              Strike/Vampirism/Void · Armadura {capacities.armor} para
              Vampirism · Capacete {capacities.head} para Void.
            </small>
            <div>
              <button
                type="button"
                aria-pressed={settings.powerfulStrike}
                disabled={!canEnableImbuement("powerfulStrike")}
                onClick={() => toggleImbuement("powerfulStrike")}
              >
                Powerful Strike
              </button>
              <button
                type="button"
                aria-pressed={settings.powerfulVamp}
                disabled={!canEnableImbuement("powerfulVamp")}
                onClick={() => toggleImbuement("powerfulVamp")}
              >
                Vampirism 25%
              </button>
              <button
                type="button"
                aria-pressed={settings.powerfulVoid}
                disabled={!canEnableImbuement("powerfulVoid")}
                onClick={() => toggleImbuement("powerfulVoid")}
              >
                Void 8%
              </button>
            </div>
            <small className="imbue-helper">
              {imbuementPlacementSummary.length
                ? `Alocação: ${imbuementPlacementSummary.join(" · ")}.`
                : "Ative um imbuement; o simulador usará uma peça elegível com slot livre."}
            </small>
          </div>
        </div>
      </details>

      <details className="method-panel">
        <summary>Como esta estimativa é calculada?</summary>
        <div>
          <p>
            O RoyalPath usa uma fórmula comunitária reversa para o ataque básico
            e aproximações transparentes para Caldera/Barrage. O ciclo simplificado
            usa apenas ataques básicos abaixo do 50, inclui Caldera a partir do 50
            e Divine Barrage a partir do 70. No jogo, Ethereal Barrage é liberada
            no level 60; o simulador a omite entre os levels 60–69 e, por isso,
            tende a subestimar essa faixa de forma conservadora.
          </p>
          <code>Modelo {DAMAGE_MODEL_VERSION}</code>
        </div>
      </details>
    </section>
  );
}

function HuntsView({ level }: { level: number }) {
  const [focus, setFocus] = useState<"leveling" | "farm" | "safe">("safe");
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const visible = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    return HUNTS.filter((hunt) => {
      const matchesQuery =
        !normalized ||
        `${hunt.name} ${hunt.location} ${hunt.access} ${hunt.tips.join(" ")}`
          .toLocaleLowerCase("pt-BR")
          .includes(normalized);
      const matchesLevel =
        showAll ||
        (focus === "safe"
          ? level >= hunt.minLevel + 20
          : hunt.minLevel <= level);
      const matchesFocus =
        focus === "safe" ||
        hunt.focus.includes(focus) ||
        hunt.focus.includes("equilibrada") ||
        (focus === "leveling" && hunt.focus.includes("aprendizado"));
      return matchesQuery && matchesLevel && matchesFocus;
    }).sort((left, right) => {
      if (focus === "farm") return metricScore(right.loot) - metricScore(left.loot);
      if (focus === "safe") return right.minLevel - left.minLevel;
      return metricScore(right.xp) - metricScore(left.xp);
    });
  }, [focus, level, query, showAll]);

  return (
    <section className="view" aria-labelledby="hunts-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Escolha pelo objetivo</p>
          <h1 id="hunts-title" data-view-title tabIndex={-1}>
            Onde caçar
          </h1>
          <p>
            Comece pelo filtro “Mais tranquilo”. Level sugerido não é garantia:
            entre devagar, teste poucos inimigos e marque a saída.
          </p>
        </div>
        <span className="model-badge">{visible.length} opções</span>
      </div>

      <div className="hunt-filters">
        <div className="segmented-control" aria-label="Objetivo da hunt">
          {(
            [
              ["safe", "Mais tranquilo"],
              ["leveling", "Leveling"],
              ["farm", "Farm"],
            ] as const
          ).map(([id, label]) => (
            <button
              type="button"
              key={id}
              aria-pressed={focus === id}
              onClick={() => setFocus(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="hunt-search">
          <span className="sr-only">Buscar hunt</span>
          <input
            type="search"
            placeholder="Buscar hunt, cidade ou acesso…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <button
          className="filter-toggle"
          type="button"
          aria-pressed={showAll}
          onClick={() => setShowAll((current) => !current)}
        >
          {showAll ? "Só para meu level" : "Ver futuras"}
        </button>
      </div>

      <div className="beginner-note">
        <strong>Como usamos “Mais tranquilo”:</strong> o personagem precisa
        estar pelo menos 20 levels acima do mínimo comunitário. Skills, set e
        experiência ainda fazem diferença.
      </div>

      <div className="hunt-grid">
        {visible.map((hunt) => (
          <article className="hunt-card" key={hunt.id}>
            <div className="hunt-topline">
              <span>Level {hunt.minLevel}+</span>
              <span className={`risk ${riskClass(hunt.risk)}`}>
                {hunt.risk}
              </span>
            </div>
            <h2>{hunt.name}</h2>
            <p>{hunt.tips[0]}</p>
            <div className="hunt-numbers">
              <div>
                <small>XP observada</small>
                <strong>{metric(hunt.xp)}</strong>
              </div>
              <div>
                <small>Loot observado</small>
                <strong>{metric(hunt.loot)}</strong>
              </div>
            </div>
            <div className="tag-row">
              {hunt.focus.map((item) => (
                <span key={item}>{focusLabel(item)}</span>
              ))}
            </div>
            <div className="hunt-tip">
              <strong>Munição:</strong> {hunt.ammo}
            </div>
            <footer>
              <span>{hunt.location}</span>
              <a href={hunt.sourceUrl} target="_blank" rel="noreferrer">
                Ver fonte ↗
              </a>
            </footer>
          </article>
        ))}
        {!visible.length ? (
          <div className="empty-state">
            Nenhuma opção apareceu. Tente “Ver futuras” ou outra busca.
          </div>
        ) : null}
      </div>
    </section>
  );
}

function JourneyView({
  level,
  completed,
  toggleCompleted,
}: {
  level: number;
  completed: readonly string[];
  toggleCompleted: (id: string) => void;
}) {
  return (
    <section className="view" aria-labelledby="journey-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Seu próximo marco</p>
          <h1 id="journey-title" data-view-title tabIndex={-1}>
            Sua Jornada
          </h1>
          <p>
            Veja o foco de cada faixa de level e marque conquistas conforme
            avançar. Para aprender um sistema, use a aba Tutoriais.
          </p>
        </div>
        <span className="model-badge">Progressão por level</span>
      </div>

      <ProgressionView
        level={level}
        completed={completed}
        toggleCompleted={toggleCompleted}
      />

      <article className="glossary">
        <div>
          <span className="card-label">Dicionário rápido</span>
          <h2>Palavras que você vai encontrar</h2>
        </div>
        <dl>
          <div><dt>Loadout / set</dt><dd>Os equipamentos selecionados no personagem.</dd></div>
          <div><dt>DPS</dt><dd>Dano esperado por segundo em uma rotação de referência.</dd></div>
          <div><dt>Sustain</dt><dd>Quanto você recupera de vida e mana durante a luta.</dd></div>
          <div><dt>BIS</dt><dd>“Melhor item”, sempre para um objetivo específico.</dd></div>
          <div><dt>Pull / kite</dt><dd>Grupo atraído / manter distância enquanto ataca.</dd></div>
          <div><dt>Waste</dt><dd>Gasto líquido quando supplies custam mais que o loot.</dd></div>
          <div><dt>Proc</dt><dd>Ativação aleatória de um efeito.</dd></div>
          <div><dt>Tier</dt><dd>Nível aplicado a um item pela Exaltation Forge.</dd></div>
        </dl>
      </article>
    </section>
  );
}
function ProgressionView({
  level,
  completed,
  toggleCompleted,
}: {
  level: number;
  completed: readonly string[];
  toggleCompleted: (id: string) => void;
}) {
  return (
    <div className="progression-list" role="tabpanel">
      {PROGRESSION_BANDS.map((band) => {
        const current =
          level >= band.minLevel &&
          (band.maxLevel === null || level <= band.maxLevel);
        const related = MILESTONES.filter(
          (milestone) =>
            milestone.level >= band.minLevel &&
            (band.maxLevel === null || milestone.level <= band.maxLevel),
        );

        return (
          <article
            className={`progression-card${current ? " is-current" : ""}`}
            key={band.id}
          >
            <div className="level-range">{band.levelLabel}</div>
            <div className="progression-copy">
              <span className="card-label">
                {current ? "Sua fase atual" : "Fase da jornada"}
              </span>
              <h2>{band.title}</h2>
              <p>{band.focus}</p>
              <div className="progression-columns">
                <div>
                  <strong>Prioridades</strong>
                  <ul>
                    {band.goals.slice(0, 3).map((goal) => (
                      <li key={goal}>{goal}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong>Equipamento e rotação</strong>
                  <p>{band.loadout.slice(0, 2).join(" · ")}</p>
                  <p>{band.rotation}</p>
                </div>
              </div>
              {related.length ? (
                <div className="milestone-checks">
                  {related.map((milestone) => {
                    const done = completed.includes(milestone.id);
                    return (
                      <button
                        type="button"
                        key={milestone.id}
                        aria-pressed={done}
                        onClick={() => toggleCompleted(milestone.id)}
                      >
                        <span aria-hidden="true">{done ? "✓" : ""}</span>
                        <span>
                          <strong>Lv {milestone.level}</strong>
                          {milestone.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function tutorialCategoryLabel(category: Guide["category"]) {
  return TUTORIAL_CATEGORIES.find((item) => item.id === category)?.label ?? category;
}

function difficultyLabel(difficulty: Guide["difficulty"]) {
  if (difficulty === "avancado") return "Avançado";
  if (difficulty === "intermediario") return "Intermediário";
  return "Básico";
}

function TutorialsView({ level }: { level: number }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<TutorialCategory>("todos");

  const visible = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    const difficultyOrder = { basico: 0, intermediario: 1, avancado: 2 } as const;

    return GUIDES.filter((guide) => {
      const matchesCategory = category === "todos" || guide.category === category;
      const searchable = [
        guide.title,
        guide.eyebrow,
        guide.summary,
        ...guide.checklist,
        ...guide.warnings,
        ...guide.steps.flatMap((step) => [step.title, step.body, ...(step.detail ?? [])]),
      ].join(" ").toLocaleLowerCase("pt-BR");
      return matchesCategory && (!normalized || searchable.includes(normalized));
    }).sort((left, right) => {
      const essentialDifference = Number(right.essential === true) - Number(left.essential === true);
      if (essentialDifference) return essentialDifference;
      const leftRouteIndex = GUIDE_ROUTE.indexOf(
        left.id as (typeof GUIDE_ROUTE)[number],
      );
      const rightRouteIndex = GUIDE_ROUTE.indexOf(
        right.id as (typeof GUIDE_ROUTE)[number],
      );
      const routeDifference =
        (leftRouteIndex === -1 ? Number.MAX_SAFE_INTEGER : leftRouteIndex) -
        (rightRouteIndex === -1 ? Number.MAX_SAFE_INTEGER : rightRouteIndex);
      if (routeDifference) return routeDifference;
      const availabilityDifference = Number((left.minLevel ?? 8) > level) - Number((right.minLevel ?? 8) > level);
      if (availabilityDifference) return availabilityDifference;
      const difficultyDifference =
        difficultyOrder[left.difficulty ?? "basico"] - difficultyOrder[right.difficulty ?? "basico"];
      return difficultyDifference || (left.minLevel ?? 8) - (right.minLevel ?? 8);
    });
  }, [category, level, query]);

  const essentialCount = visible.filter((guide) => guide.essential).length;

  return (
    <section className="view" aria-labelledby="tutorials-title">
      <div className="section-heading tutorial-heading">
        <div>
          <p className="eyebrow">Aprenda uma coisa por vez</p>
          <h1 id="tutorials-title" data-view-title tabIndex={-1}>
            Tutoriais de Royal Paladin
          </h1>
          <p>
            Guias curtos, em ordem de prioridade para iniciantes. Comece pelos
            essenciais e deixe Forge e Proficiency para quando a base estiver segura.
          </p>
        </div>
        <span className="model-badge">{GUIDES.length} guias</span>
      </div>

      <div className="tutorial-start">
        <strong>Rota recomendada:</strong>
        primeira hora → quiver → treino offline → blessings → promoção →
        imbuements.
      </div>

      <div className="tutorial-toolbar">
        <label className="tutorial-search">
          <span>Buscar tutorial</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ex.: imbuement, blessings, Wheel…"
          />
        </label>
        <div className="tutorial-count" aria-live="polite">
          <strong>{visible.length}</strong> encontrados · {essentialCount} essenciais
        </div>
      </div>

      <div className="tutorial-categories" aria-label="Filtrar tutoriais por categoria">
        {TUTORIAL_CATEGORIES.map((item) => (
          <button
            type="button"
            key={item.id}
            aria-pressed={category === item.id}
            onClick={() => setCategory(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <GuidesView guides={visible} level={level} />
    </section>
  );
}

function GuidesView({ guides, level }: { guides: readonly Guide[]; level: number }) {
  const [open, setOpen] = useState(
    guides.find((guide) => guide.essential)?.id ?? guides[0]?.id ?? "",
  );
  const activeOpen = guides.some((guide) => guide.id === open)
    ? open
    : guides.find((guide) => guide.essential)?.id ?? guides[0]?.id ?? "";

  return (
    <div className="guide-list">
      {guides.map((guide, index) => {
        const expanded = activeOpen === guide.id;
        const future = (guide.minLevel ?? 8) > level;
        const relatedSources = guide.relatedSourceIds
          .map((id) => SOURCES.find((source) => source.id === id))
          .filter((source): source is (typeof SOURCES)[number] =>
            Boolean(source),
          );
        return (
          <article
            className={`guide-card${guide.essential ? " is-essential" : ""}${future ? " is-future" : ""}`}
            key={guide.id}
          >
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setOpen(expanded ? "" : guide.id)}
            >
              <span className="guide-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="guide-title-copy">
                <span className="guide-badges">
                  {guide.essential ? <span className="essential-badge">Essencial</span> : null}
                  <span>{tutorialCategoryLabel(guide.category)}</span>
                  <span>{difficultyLabel(guide.difficulty)}</span>
                  <span className={future ? "guide-level is-future" : "guide-level"}>
                    {future ? `Lv ${guide.minLevel} · para depois` : `Lv ${guide.minLevel ?? 8}+`}
                  </span>
                </span>
                <strong>{guide.title}</strong>
                <small>{guide.summary}</small>
              </span>
              <span className="guide-toggle" aria-hidden="true">{expanded ? "−" : "+"}</span>
            </button>
            {expanded ? (
              <div className="guide-content">
                <div className="guide-time">
                  <span>Tempo estimado</span>
                  <strong>{guide.estimatedTime}</strong>
                </div>
                {future ? (
                  <div className="tutorial-future-note">
                    Você pode estudar agora, mas este sistema é recomendado a partir do level {guide.minLevel}.
                  </div>
                ) : null}
                <ol>
                  {guide.steps.map((step) => (
                    <li key={step.title}>
                      <strong>{step.title}</strong>
                      <p>{step.body}</p>
                      {step.detail?.length ? (
                        <ul>
                          {step.detail.map((detail) => <li key={detail}>{detail}</li>)}
                        </ul>
                      ) : null}
                    </li>
                  ))}
                </ol>
                <div className="guide-support-grid">
                  <section className="guide-checklist">
                    <h3>Antes de começar</h3>
                    <ul>
                      {guide.checklist.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </section>
                  <section className="guide-warnings">
                    <h3>Atenção</h3>
                    <ul>
                      {guide.warnings.map((warning) => <li key={warning}>{warning}</li>)}
                    </ul>
                  </section>
                </div>
                <a className="guide-source" href={guide.sourceUrl} target="_blank" rel="noreferrer">
                  Conferir fonte: {guide.sourceName} ↗
                </a>
                {relatedSources.length ? (
                  <section className="guide-related-sources">
                    <strong>Fontes relacionadas</strong>
                    <ul>
                      {relatedSources.map((source) => (
                        <li key={source.id}>
                          <a href={source.url} target="_blank" rel="noreferrer">
                            {source.name} · {source.publisher} ↗
                          </a>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </div>
            ) : null}
          </article>
        );
      })}
      {!guides.length ? (
        <div className="empty-state">
          Nenhum tutorial encontrado. Limpe a busca ou escolha “Todos”.
        </div>
      ) : null}
    </div>
  );
}
function Disclosure() {
  return (
    <aside className="disclosure">
      <span aria-hidden="true">i</span>
      <div>
        <strong>Transparência: projeto 100% produzido com IA</strong>
        Pesquisa, conteúdo, design, código e testes foram realizados com
        inteligência artificial e conferidos contra fontes oficiais e
        comunitárias. É um projeto pessoal, gratuito, sem fins lucrativos e não
        afiliado à CipSoft.
      </div>
    </aside>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <strong>RoyalPath · Guia simples para Royal Paladin</strong>
        <p>
          Conteúdo revisado em 29 jul 2026 · números podem mudar com patches.
        </p>
      </div>
      <div>
        <p>
          RoyalPath é um projeto não oficial. Tibia e seus elementos gráficos
          são propriedade da CipSoft GmbH. O único site oficial é{" "}
          <a href="https://www.tibia.com/" target="_blank" rel="noreferrer">
            Tibia.com
          </a>
          .
        </p>
        <p>
          Sprites exibidos no Arsenal são usados para identificação dos itens e
          não fazem parte da licença MIT do código.
        </p>
      </div>
      <nav aria-label="Fontes principais">
        {SOURCES.slice(0, 4).map((source) => (
          <a href={source.url} target="_blank" rel="noreferrer" key={source.id}>
            {source.name}
          </a>
        ))}
      </nav>
    </footer>
  );
}
