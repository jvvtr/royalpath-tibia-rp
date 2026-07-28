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
  estimateLevelAwareCycle,
  type LevelAwareCycleEstimate,
  type PaladinStance,
} from "../lib/damage";

type ViewId = "inicio" | "arsenal" | "simulador" | "hunts" | "jornada";
type EquipmentSlot = ItemSlot;

type CombatSettings = {
  stance: PaladinStance;
  resistance: number;
  forgeTier: number;
  powerfulStrike: boolean;
  powerfulVamp: boolean;
  powerfulVoid: boolean;
};

type StoredProfile = {
  level?: number;
  distance?: number;
  magicLevel?: number;
  completed?: string[];
  loadout?: Partial<Record<EquipmentSlot, string>>;
  settings?: Partial<CombatSettings>;
};

type CombatSummary = LevelAwareCycleEstimate & {
  compatible: boolean;
  compatibilityMessage: string | null;
  weapon: Item | undefined;
  ammo: Item | undefined;
  effectiveStance: PaladinStance;
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
  { id: "jornada", label: "Jornada", shortLabel: "Guia", marker: "05" },
];

const SLOT_ORDER: readonly EquipmentSlot[] = [
  "head",
  "amulet",
  "armor",
  "quiver",
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
};

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
  if (/crossbow|arbalest|piercer/i.test(item.name)) return "crossbow";
  if (/spear|star|knife|javelin/i.test(item.name)) return "thrown";
  return "bow";
}

function ammoKind(item: Item | undefined) {
  if (!item || item.slot !== "ammo") return "none";
  return /bolt/i.test(item.name) ? "bolt" : "arrow";
}

function isAmmoCompatible(weapon: Item | undefined, ammo: Item | undefined) {
  const kind = weaponKind(weapon);
  if (kind === "thrown") return !ammo;
  if (kind === "crossbow") return ammoKind(ammo) === "bolt";
  if (kind === "bow") return ammoKind(ammo) === "arrow";
  return false;
}

function eligibleItems(slot: EquipmentSlot, level: number) {
  return ITEMS.filter(
    (item) => item.slot === slot && item.minLevel <= level,
  );
}

function bestItemForSlot(
  slot: EquipmentSlot,
  level: number,
  preferredKind?: "arrow" | "bolt" | "bow",
) {
  const eligible = eligibleItems(slot, level);
  const preferred = preferredKind
    ? eligible.filter((item) => {
        if (preferredKind === "bow") return weaponKind(item) === "bow";
        return ammoKind(item) === preferredKind;
      })
    : eligible;

  return [...(preferred.length ? preferred : eligible)].sort(
    (a, b) => b.minLevel - a.minLevel,
  )[0];
}

function suggestedLoadout(
  level: number,
): Partial<Record<EquipmentSlot, string>> {
  const result: Partial<Record<EquipmentSlot, string>> = {};

  for (const slot of SLOT_ORDER) {
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
    if (
      selected &&
      selected.slot === slot &&
      selected.minLevel <= level
    ) {
      next[slot] = selected.id;
    } else if (suggested[slot]) {
      next[slot] = suggested[slot];
    }
  }

  const weapon = itemById(next.weapon);
  const kind = weaponKind(weapon);
  if (kind === "thrown") {
    delete next.ammo;
  } else {
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

function sameLoadout(
  left: Partial<Record<EquipmentSlot, string>>,
  right: Partial<Record<EquipmentSlot, string>>,
) {
  return SLOT_ORDER.every((slot) => left[slot] === right[slot]);
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
  if (item.hit) stats.push(`Hit +${item.hit}`);
  if (item.distance) stats.push(`Dist +${item.distance}`);
  if (item.magic) stats.push(`Holy ML +${item.magic}`);
  if (item.armor) stats.push(`Arm ${item.armor}`);
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
  const kind = weaponKind(weapon);
  const ammo = kind === "thrown" ? undefined : selectedAmmo;
  const compatible = isAmmoCompatible(weapon, ammo);
  const effectiveStance: PaladinStance =
    level >= 20 ? settings.stance : "neutral";
  const ammunitionAttack =
    kind === "thrown" ? weapon?.attack ?? 0 : ammo?.attack ?? 0;
  const weaponAttackModifier =
    kind === "thrown" ? 0 : weapon?.attack ?? 0;

  const cycle = estimateLevelAwareCycle({
    autoAttack: {
      level,
      distance: stats.distance,
      magicLevel: stats.magic,
      stance: effectiveStance,
      ammunitionAttack,
      weaponAttackModifier,
      accuracyPercent: compatible ? 100 : 0,
      targetResistancePercent: settings.resistance,
      critical: settings.powerfulStrike
        ? { chancePercent: 10, extraDamagePercent: 50 }
        : { chancePercent: 5, extraDamagePercent: 10 },
      forgeTier: settings.forgeTier,
      lifeLeechPercent: settings.powerfulVamp ? 25 : 0,
      manaLeechPercent: settings.powerfulVoid ? 8 : 0,
    },
    magicLevel: stats.magic,
  });

  let compatibilityMessage: string | null = null;
  if (!weapon) {
    compatibilityMessage = "Escolha uma arma para calcular o dano.";
  } else if (kind === "bow" && !ammo) {
    compatibilityMessage = "Escolha uma arrow para este bow.";
  } else if (kind === "crossbow" && !ammo) {
    compatibilityMessage = "Escolha um bolt para este crossbow.";
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
    effectiveStance,
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

  return (
    <span className={`item-sprite item-sprite-${size}`} aria-hidden="true">
      {failed ? (
        <span className="sprite-fallback">{item.icon}</span>
      ) : (
        // Native img preserves the tiny pixel-art file without an optimizer.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/items/${item.id}.png`}
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
      setLoadout(reconcileLoadout(nextLevel, saved?.loadout));
      setSettings({
        ...DEFAULT_SETTINGS,
        ...(saved?.settings ?? {}),
      });
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
    setLevel(nextLevel);
    setLoadout((current) => {
      const next = reconcileLoadout(nextLevel, current);
      if (!sameLoadout(current, next)) {
        setNotice(
          "Seu set foi ajustado automaticamente para respeitar o novo level.",
        );
      }
      return next;
    });
  }

  function equip(item: Item) {
    if (item.minLevel > level) return;
    setLoadout((current) =>
      reconcileLoadout(level, { ...current, [item.slot]: item.id }),
    );
    setNotice(`${item.name} foi equipado.`);
  }

  function resetLoadout() {
    setLoadout(suggestedLoadout(level));
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
    setLoadout(reconcileLoadout(level, next));
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
                {item.label}
              </a>
            ))}
          </nav>

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

      <nav className="mobile-nav" aria-label="Navegação móvel">
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
          <small>DPS esperado</small>
          <strong>{dps.toLocaleString("pt-BR")}</strong>
          <span>{combat.rotationLabel}</span>
        </div>
      </article>
      <article className="summary-card summary-defense">
        <span className="summary-icon" aria-hidden="true">
          ◈
        </span>
        <div>
          <small>Defesa do set</small>
          <strong>{stats.armor} arm</strong>
          <span>
            {physical
              ? `${formatProtection(physical)} físico`
              : "sem proteção % física"}
          </span>
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
              "Seu level já passou pelos marcos principais. Compare proteção e sustain antes de comprar."}
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
  selectedSlot,
  onSelectSlot,
}: {
  loadout: Partial<Record<EquipmentSlot, string>>;
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
          return (
            <button
              type="button"
              className={`equipment-slot${
                selectedSlot === slot ? " is-selected" : ""
              }${item ? " is-filled" : ""}`}
              key={slot}
              onClick={() => onSelectSlot?.(slot)}
              disabled={!onSelectSlot}
              aria-pressed={
                onSelectSlot ? selectedSlot === slot : undefined
              }
              aria-label={`${SLOT_LABELS[slot]}: ${item?.name ?? "vazio"}`}
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
        <span className="armor-badge">{stats.armor} armor</span>
      </div>
      <p>
        A armor reduz dano físico em uma faixa aproximada de{" "}
        <strong>
          {stats.armorReduction.min}–{stats.armorReduction.max}
        </strong>{" "}
        por hit que atravessa a defesa.
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
    if (item.slot !== slot || item.minLevel > level) return false;
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
  }).sort((a, b) => b.minLevel - a.minLevel || a.name.localeCompare(b.name));

  return (
    <section className="view" aria-labelledby="arsenal-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Passo 2 · escolha visual</p>
          <h1 id="arsenal-title" data-view-title tabIndex={-1}>
            Monte seu Arsenal
          </h1>
          <p>
            Clique em um slot, reconheça o item pelo sprite e equipe uma opção
            liberada para o seu level.
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
          selectedSlot={slot}
          onSelectSlot={setSlot}
        />

        <div className="item-picker">
          <div className="item-picker-heading">
            <div>
              <span className="card-label">Trocar item</span>
              <h2>{SLOT_LABELS[slot]}</h2>
              <p>{choices.length} opções disponíveis no level {level}.</p>
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

          <div className="item-list">
            {choices.map((item) => {
              const selected = loadout[item.slot] === item.id;
              return (
                <button
                  className={`item-option${selected ? " is-equipped" : ""}`}
                  type="button"
                  key={item.id}
                  onClick={() => equip(item)}
                  aria-pressed={selected}
                >
                  <ItemSprite item={item} size="large" />
                  <span className="item-option-copy">
                    <span className="item-name-row">
                      <strong>{item.name}</strong>
                      <small>Lv {item.minLevel || 8}</small>
                    </span>
                    <span className="item-stat-row">
                      {itemStats(item).map((stat) => (
                        <span key={stat}>{stat}</span>
                      ))}
                    </span>
                    <small>{item.summary}</small>
                  </span>
                  <span className="equip-action">
                    {selected ? "Equipado" : "Equipar"}
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

  function patchSettings(patch: Partial<CombatSettings>) {
    setSettings({ ...settings, ...patch });
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
            É uma referência para comparar sets. Resistências, quantidade de
            alvos, Wheel, charms, prey e execução real mudam o resultado.
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
                <div key={slot} title={item.name}>
                  <ItemSprite item={item} size="medium" />
                  <small>{SLOT_LABELS[slot]}</small>
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
                  : "Sharpshooter favorece dano; Defiance favorece holy e cura."}
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
              <span>Forge tier da arma</span>
              <select
                value={settings.forgeTier}
                onChange={(event) =>
                  patchSettings({
                    forgeTier: Number(event.target.value),
                  })
                }
              >
                {Array.from({ length: 11 }, (_, tier) => (
                  <option value={tier} key={tier}>
                    {tier === 0 ? "Sem tier" : `Tier ${tier}`}
                  </option>
                ))}
              </select>
              <small>Use o tier que aparece na sua arma.</small>
            </label>
          </div>

          <div className="imbue-options">
            <span>Imbuements ativos</span>
            <div>
              <button
                type="button"
                aria-pressed={settings.powerfulStrike}
                onClick={() =>
                  patchSettings({
                    powerfulStrike: !settings.powerfulStrike,
                  })
                }
              >
                Powerful Strike
              </button>
              <button
                type="button"
                aria-pressed={settings.powerfulVamp}
                onClick={() =>
                  patchSettings({
                    powerfulVamp: !settings.powerfulVamp,
                  })
                }
              >
                Vampirism 25%
              </button>
              <button
                type="button"
                aria-pressed={settings.powerfulVoid}
                onClick={() =>
                  patchSettings({
                    powerfulVoid: !settings.powerfulVoid,
                  })
                }
              >
                Void 8%
              </button>
            </div>
          </div>
        </div>
      </details>

      <details className="method-panel">
        <summary>Como esta estimativa é calculada?</summary>
        <div>
          <p>
            O RoyalPath usa uma fórmula comunitária reversa para o ataque básico
            e proxies transparentes para Caldera/Barrage. A rotação respeita o
            level: só autoattack abaixo do 50, Caldera a partir do 50 e Divine
            Barrage a partir do 70.
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
  const [section, setSection] = useState<"progressao" | "guias">("progressao");

  return (
    <section className="view" aria-labelledby="journey-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Aprenda no seu ritmo</p>
          <h1 id="journey-title" data-view-title tabIndex={-1}>
            Sua Jornada
          </h1>
          <p>
            Consulte a progressão quando quiser saber “o que vem depois” e os
            guias quando um termo ou sistema ainda parecer confuso.
          </p>
        </div>
      </div>

      <div className="journey-tabs" role="tablist" aria-label="Seções da jornada">
        <button
          type="button"
          role="tab"
          aria-selected={section === "progressao"}
          onClick={() => setSection("progressao")}
        >
          Progressão por level
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={section === "guias"}
          onClick={() => setSection("guias")}
        >
          Guias passo a passo
        </button>
      </div>

      {section === "progressao" ? (
        <ProgressionView
          level={level}
          completed={completed}
          toggleCompleted={toggleCompleted}
        />
      ) : (
        <GuidesView guides={GUIDES} />
      )}

      <article className="glossary">
        <div>
          <span className="card-label">Dicionário rápido</span>
          <h2>Palavras que você vai encontrar</h2>
        </div>
        <dl>
          <div>
            <dt>Loadout / set</dt>
            <dd>Os equipamentos que estão no seu personagem.</dd>
          </div>
          <div>
            <dt>DPS</dt>
            <dd>Dano esperado por segundo em uma rotação de referência.</dd>
          </div>
          <div>
            <dt>Sustain</dt>
            <dd>Quanto você recupera de vida e mana durante a luta.</dd>
          </div>
          <div>
            <dt>BIS</dt>
            <dd>“Melhor item”, mas sempre para um objetivo específico.</dd>
          </div>
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

function GuidesView({ guides }: { guides: readonly Guide[] }) {
  const [open, setOpen] = useState(guides[0]?.id ?? "");

  return (
    <div className="guide-list" role="tabpanel">
      {guides.map((guide, index) => {
        const expanded = open === guide.id;
        return (
          <article className="guide-card" key={guide.id}>
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setOpen(expanded ? "" : guide.id)}
            >
              <span className="guide-number">{String(index + 1).padStart(2, "0")}</span>
              <span>
                <strong>{guide.title}</strong>
                <small>{guide.summary}</small>
              </span>
              <span aria-hidden="true">{expanded ? "−" : "+"}</span>
            </button>
            {expanded ? (
              <div className="guide-content">
                <ol>
                  {guide.steps.map((step) => (
                    <li key={step.title}>
                      <strong>{step.title}</strong>
                      <p>{step.body}</p>
                      {step.detail?.length ? (
                        <ul>
                          {step.detail.map((detail) => (
                            <li key={detail}>{detail}</li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  ))}
                </ol>
                <div className="beginner-note">
                  <strong>Atenção:</strong> {guide.warnings.join(" ")}
                </div>
                <a href={guide.sourceUrl} target="_blank" rel="noreferrer">
                  {guide.sourceName} ↗
                </a>
              </div>
            ) : null}
          </article>
        );
      })}
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
          Conteúdo revisado em 28 jul 2026 · Tibia 15.30 · números podem mudar
          com patches.
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
