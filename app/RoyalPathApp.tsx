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
} from "./content";
import {
  DAMAGE_MODEL_VERSION,
  estimateAutoAttack,
  estimateFourSecondCycle,
  type PaladinStance,
} from "../lib/damage";

type ViewId =
  | "agora"
  | "roadmap"
  | "hunts"
  | "arsenal"
  | "academia"
  | "simulador";

type EquipmentSlot =
  | "head"
  | "amulet"
  | "armor"
  | "quiver"
  | "weapon"
  | "legs"
  | "ammo"
  | "boots"
  | "ring";

type UiMilestone = {
  id: string;
  level: number;
  levelLabel: string;
  title: string;
  summary: string;
  actions: readonly string[];
  tags: readonly string[];
  sourceUrl?: string;
};

type UiBand = {
  id: string;
  minLevel: number;
  maxLevel: number | null;
  levelLabel: string;
  title: string;
  focus: string;
  goals: readonly string[];
  loadout: readonly string[];
  rotation: string;
  caution: string;
  sourceUrl?: string;
};

type UiHunt = {
  id: string;
  name: string;
  minLevel: number;
  location: string;
  focus: readonly ("leveling" | "farm" | "equilibrada" | "aprendizado")[];
  xp: string;
  loot: string;
  metricStatus: string;
  risk: "baixo" | "moderado" | "alto" | "muito alto";
  ammo: string;
  access: string;
  creatures: readonly string[];
  tips: readonly string[];
  sourceUrl: string;
  sourceName: string;
  confidence: string;
};

type UiItem = {
  id: string;
  name: string;
  slot: EquipmentSlot;
  minLevel: number;
  attack?: number;
  hit?: number;
  distance?: number;
  magic?: number;
  armor?: number;
  protection?: readonly string[];
  imbueSlots?: number;
  tierClass?: number;
  useCase: readonly string[];
  icon: string;
  summary: string;
  sourceUrl: string;
  sourceName: string;
  confidence: string;
};

type UiGuide = {
  id: string;
  category: string;
  title: string;
  eyebrow: string;
  summary: string;
  estimatedTime: string;
  steps: ReadonlyArray<{
    title: string;
    body: string;
    detail?: readonly string[];
  }>;
  checklist: readonly string[];
  warnings: readonly string[];
  sourceUrl: string;
  sourceName: string;
};

type UiSource = {
  id: string;
  name: string;
  url: string;
  kind?: string;
  description?: string;
};

type UiBisContext = {
  id: string;
  label: string;
  minLevel: number;
  goal: string;
  slots: Partial<Record<EquipmentSlot, readonly string[]>>;
  tradeoff: string;
  sourceUrl: string;
  sourceName: string;
};

const milestones = MILESTONES as unknown as readonly UiMilestone[];
const progressionBands = PROGRESSION_BANDS as unknown as readonly UiBand[];
const hunts = HUNTS as unknown as readonly UiHunt[];
const items = ITEMS as unknown as readonly UiItem[];
const guides = GUIDES as unknown as readonly UiGuide[];
const sources = SOURCES as unknown as readonly UiSource[];
const bisContexts = BIS_CONTEXTS as unknown as readonly UiBisContext[];

const NAVIGATION: ReadonlyArray<{
  id: ViewId;
  label: string;
  mobileLabel: string;
  icon: string;
  title: string;
  eyebrow: string;
  kicker?: string;
}> = [
  {
    id: "agora",
    label: "Agora",
    mobileLabel: "Agora",
    icon: "✦",
    title: "Seu próximo passo",
    eyebrow: "Painel de jornada",
  },
  {
    id: "roadmap",
    label: "Roadmap",
    mobileLabel: "Rota",
    icon: "⌁",
    title: "Rota de progressão",
    eyebrow: "Level 8 ao 1000+",
  },
  {
    id: "hunts",
    label: "Hunts",
    mobileLabel: "Hunts",
    icon: "⌖",
    title: "Mapa de hunts",
    eyebrow: "Leveling e farm",
  },
  {
    id: "arsenal",
    label: "Arsenal",
    mobileLabel: "Itens",
    icon: "♜",
    title: "Arsenal do paladino",
    eyebrow: "Loadouts por contexto",
  },
  {
    id: "academia",
    label: "Academia",
    mobileLabel: "Guias",
    icon: "⌘",
    title: "Academia Royal",
    eyebrow: "Mecânicas sem mistério",
  },
  {
    id: "simulador",
    label: "Simulador",
    mobileLabel: "Dano",
    icon: "◈",
    title: "Simulador de dano",
    eyebrow: "Estimativa comparativa",
    kicker: "Beta",
  },
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

const STORAGE_KEY = "royalpath-profile-v1";

function clampLevel(value: number) {
  if (!Number.isFinite(value)) return 8;
  return Math.min(2500, Math.max(8, Math.round(value)));
}

function bandForLevel(level: number) {
  return (
    progressionBands.find(
      (band) =>
        level >= band.minLevel &&
        (band.maxLevel === null || level <= band.maxLevel),
    ) ?? progressionBands[progressionBands.length - 1]
  );
}

function suggestedLoadout(level: number): Partial<Record<EquipmentSlot, string>> {
  const result: Partial<Record<EquipmentSlot, string>> = {};

  for (const slot of SLOT_ORDER) {
    const eligible = items.filter(
      (item) => item.slot === slot && item.minLevel <= level,
    );
    const preferred =
      slot === "weapon"
        ? eligible.filter((item) => /bow/i.test(item.name))
        : slot === "ammo"
          ? eligible.filter((item) => /arrow/i.test(item.name))
          : eligible;
    const best = (preferred.length ? preferred : eligible)
      .sort((a, b) => b.minLevel - a.minLevel)[0];
    if (best) result[slot] = best.id;
  }

  return result;
}

function metric(value: string | null | undefined) {
  return value?.trim() || "em reteste";
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

function itemById(id: string | undefined) {
  return items.find((item) => item.id === id);
}

function slotClass(slot: EquipmentSlot) {
  return `slot-${slot}`;
}

function parseFocusLabel(focus: string) {
  if (focus === "leveling") return "Leveling";
  if (focus === "farm") return "Farm";
  if (focus === "equilibrada") return "Equilibrada";
  return "Aprendizado";
}

function riskClass(risk: UiHunt["risk"]) {
  if (risk === "baixo") return "risk-baixo";
  if (risk === "alto" || risk === "muito alto") return "risk-alto";
  return "";
}

function guideIcon(guide: UiGuide) {
  const iconByCategory: Record<string, string> = {
    "primeiros-passos": "✦",
    combate: "⌁",
    imbuement: "◇",
    forge: "♜",
    proficiency: "⌘",
  };
  return iconByCategory[guide.category] ?? "◈";
}

function Disclosure() {
  return (
    <div className="disclosure">
      <span className="disclosure-icon" aria-hidden="true">
        ◇
      </span>
      <div>
        <strong>Transparência: projeto 100% produzido com IA</strong>
        Pesquisa, arquitetura, conteúdo, identidade, código e testes foram
        realizados com inteligência artificial e conferidos contra fontes
        oficiais e comunitárias. É um projeto pessoal, gratuito, sem fins
        lucrativos e não afiliado à CipSoft.
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-row">
        <div>
          <div className="footer-brand">RoyalPath · Guia Royal Paladin</div>
          Conteúdo revisado em 28 jul 2026 · Tibia 15.30 · valores podem mudar
          em patches.
        </div>
        <div>
          Projeto pessoal, gratuito e sem fins lucrativos, criado 100% com
          auxílio de inteligência artificial.
          <br />
          Não afiliado, endossado ou mantido pela CipSoft GmbH. Tibia e seus
          elementos pertencem aos respectivos titulares.
        </div>
      </div>
    </footer>
  );
}

export default function RoyalPathApp() {
  const [view, setView] = useState<ViewId>("agora");
  const [level, setLevel] = useState(150);
  const [completed, setCompleted] = useState<string[]>([]);
  const [loadout, setLoadout] =
    useState<Partial<Record<EquipmentSlot, string>>>(() =>
      suggestedLoadout(150),
    );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let saved:
      | {
          level?: number;
          completed?: string[];
          loadout?: Partial<Record<EquipmentSlot, string>>;
        }
      | undefined;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        saved = JSON.parse(raw) as {
          level?: number;
          completed?: string[];
          loadout?: Partial<Record<EquipmentSlot, string>>;
        };
      }
    } catch {
      // Local storage is optional; the app remains fully usable without it.
    }

    queueMicrotask(() => {
      if (saved?.level) setLevel(clampLevel(saved.level));
      if (Array.isArray(saved?.completed)) setCompleted(saved.completed);
      if (saved?.loadout) setLoadout(saved.loadout);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ level, completed, loadout }),
    );
  }, [completed, hydrated, level, loadout]);

  const currentBand = useMemo(() => bandForLevel(level), [level]);
  const currentNav = NAVIGATION.find((item) => item.id === view)!;

  function navigate(next: ViewId) {
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

      <aside className="sidebar" aria-label="Navegação principal">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <span>R</span>
          </div>
          <div>
            <div className="brand-name">
              Royal<em>Path</em>
            </div>
            <span className="brand-subtitle">Royal Paladin Guide</span>
          </div>
        </div>

        <nav className="side-nav">
          {NAVIGATION.map((item) => (
            <button
              className="nav-button"
              type="button"
              key={item.id}
              onClick={() => navigate(item.id)}
              aria-current={view === item.id ? "page" : undefined}
            >
              <span className="nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="nav-label">{item.label}</span>
              {item.kicker ? (
                <span className="nav-kicker">{item.kicker}</span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="sidebar-note">
          <strong>Revisão viva · jul 2026</strong>
          Baseado em notas oficiais do patch e referências comunitárias atuais.
          Cada recomendação mostra sua fonte.
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-copy">
            <p className="eyebrow">{currentNav.eyebrow}</p>
            <h1 className="topbar-title">{currentNav.title}</h1>
          </div>
          <div className="level-control">
            <label htmlFor="character-level">Meu level</label>
            <input
              id="character-level"
              aria-label="Level do personagem"
              type="number"
              min={8}
              max={2500}
              value={level}
              onChange={(event) => setLevel(clampLevel(event.target.valueAsNumber))}
            />
          </div>
        </header>

        <main className="content" id="conteudo" tabIndex={-1}>
          {view === "agora" ? (
            <DashboardView
              level={level}
              band={currentBand}
              completed={completed}
              toggleCompleted={toggleCompleted}
              navigate={navigate}
            />
          ) : null}
          {view === "roadmap" ? (
            <RoadmapView
              level={level}
              completed={completed}
              toggleCompleted={toggleCompleted}
            />
          ) : null}
          {view === "hunts" ? <HuntsView level={level} /> : null}
          {view === "arsenal" ? (
            <ArsenalView
              level={level}
              loadout={loadout}
              setLoadout={setLoadout}
            />
          ) : null}
          {view === "academia" ? <AcademyView /> : null}
          {view === "simulador" ? (
            <SimulatorView
              level={level}
              loadout={loadout}
              setLoadout={setLoadout}
            />
          ) : null}

          <Disclosure />
          <Footer />
        </main>
      </div>

      <nav className="mobile-nav" aria-label="Navegação móvel">
        {NAVIGATION.map((item) => (
          <button
            type="button"
            key={item.id}
            onClick={() => navigate(item.id)}
            aria-current={view === item.id ? "page" : undefined}
            aria-label={item.label}
          >
            <span className="nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="nav-label">{item.mobileLabel}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function DashboardView({
  level,
  band,
  completed,
  toggleCompleted,
  navigate,
}: {
  level: number;
  band: UiBand;
  completed: readonly string[];
  toggleCompleted: (id: string) => void;
  navigate: (view: ViewId) => void;
}) {
  const nextMilestones = milestones
    .filter((milestone) => milestone.level >= Math.max(8, level - 5))
    .slice(0, 4);
  const available = hunts.filter((hunt) => hunt.minLevel <= level);
  const safeHunts = available.filter((hunt) => level >= hunt.minLevel + 20);
  const unlocked = milestones.filter((milestone) => milestone.level <= level);
  const nextMilestone = milestones.find((milestone) => milestone.level > level);

  return (
    <section className="view" aria-labelledby="dashboard-title">
      <div className="hero-grid">
        <article className="hero-card">
          <p className="eyebrow">Bem-vindo à sua jornada</p>
          <h2 id="dashboard-title">
            Do primeiro arco ao <span>endgame</span>, uma decisão por vez.
          </h2>
          <p>
            O RoyalPath traduz o caminho do Royal Paladin em metas práticas.
            Ajuste seu level, veja o que importa agora e valide cada passo nas
            fontes — sem fingir que existe um único set perfeito.
          </p>
          <div className="hero-actions">
            <button
              type="button"
              className="button button-primary"
              onClick={() => navigate("roadmap")}
            >
              Ver minha rota <span aria-hidden="true">→</span>
            </button>
            <button
              type="button"
              className="button button-ghost"
              onClick={() => navigate("simulador")}
            >
              Abrir simulador
            </button>
          </div>
        </article>

        <article className="panel now-card">
          <span className="small-label">Fase atual</span>
          <div className="level-orb" aria-label={`Level ${level}`}>
            {level}
          </div>
          <h3>{band.title}</h3>
          <p>{band.focus}</p>
          <div className="now-meta">
            <span className="chip chip-gold">{band.levelLabel}</span>
            <span className="chip chip-blue">
              {nextMilestone
                ? `Próximo marco: ${nextMilestone.level}`
                : "Endgame"}
            </span>
          </div>
        </article>
      </div>

      <div className="stats-grid" aria-label="Resumo da jornada">
        <div className="stat-card">
          <span className="small-label">Marcos liberados</span>
          <div className="stat-value">
            {unlocked.length}/{milestones.length}
          </div>
          <div className="stat-note">contabilizados pelo seu level</div>
        </div>
        <div className="stat-card">
          <span className="small-label">Hunts acessíveis</span>
          <div className="stat-value">{available.length}</div>
          <div className="stat-note">nível comunitário, não garantia</div>
        </div>
        <div className="stat-card">
          <span className="small-label">Margem iniciante</span>
          <div className="stat-value">{safeHunts.length}</div>
          <div className="stat-note">mínimo da hunt +20 níveis</div>
        </div>
        <div className="stat-card">
          <span className="small-label">Metas marcadas</span>
          <div className="stat-value">{completed.length}</div>
          <div className="stat-note">salvas apenas neste dispositivo</div>
        </div>
      </div>

      <div className="two-column">
        <article className="panel">
          <div className="panel-header">
            <div>
              <h3>Próximas metas</h3>
              <p>Uma checklist curta para não se perder no caminho.</p>
            </div>
            <button
              type="button"
              className="button button-small"
              onClick={() => navigate("roadmap")}
            >
              Roadmap completo
            </button>
          </div>
          <div className="objective-list">
            {nextMilestones.map((milestone) => {
              const done = completed.includes(milestone.id);
              return (
                <div
                  className={`objective${done ? " is-done" : ""}`}
                  key={milestone.id}
                >
                  <button
                    className="objective-check"
                    type="button"
                    onClick={() => toggleCompleted(milestone.id)}
                    aria-label={
                      done
                        ? `Desmarcar ${milestone.title}`
                        : `Marcar ${milestone.title} como concluído`
                    }
                    aria-pressed={done}
                  >
                    {done ? "✓" : ""}
                  </button>
                  <div>
                    <span className="objective-title">{milestone.title}</span>
                    <span className="objective-detail">
                      {milestone.summary}
                    </span>
                  </div>
                  <span className="objective-level">
                    Lv {milestone.level}
                  </span>
                </div>
              );
            })}
          </div>
        </article>

        <aside className="panel">
          <div className="panel-header">
            <div>
              <h3>Fontes em destaque</h3>
              <p>Abra a referência antes de um investimento grande.</p>
            </div>
          </div>
          <div className="source-list">
            {sources.slice(0, 6).map((source) => (
              <a
                className="source-link"
                href={source.url}
                target="_blank"
                rel="noreferrer"
                key={source.id}
              >
                <span>{source.name}</span>
                <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

function RoadmapView({
  level,
  completed,
  toggleCompleted,
}: {
  level: number;
  completed: readonly string[];
  toggleCompleted: (id: string) => void;
}) {
  return (
    <section className="view" aria-labelledby="roadmap-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Sua rota, sem atalhos mágicos</p>
          <h1 id="roadmap-title">Level 8 ao 1000+</h1>
          <p>
            Faixas de decisão, não promessas de segurança. Para a primeira
            visita a uma hunt, reduza os pulls e considere uma margem de 20–50
            levels.
          </p>
        </div>
        <span className="review-stamp">Revisado · 28 jul 2026</span>
      </div>

      <div className="roadmap">
        {progressionBands.map((band) => {
          const isCurrent =
            level >= band.minLevel &&
            (band.maxLevel === null || level <= band.maxLevel);
          const isPast = band.maxLevel !== null && level > band.maxLevel;
          const related = milestones.filter(
            (milestone) =>
              milestone.level >= band.minLevel &&
              (band.maxLevel === null || milestone.level <= band.maxLevel),
          );
          const bandDone =
            related.length > 0 &&
            related.every((milestone) => completed.includes(milestone.id));

          return (
            <article
              className={`milestone-card${isCurrent ? " is-current" : ""}${
                isPast ? " is-past" : ""
              }`}
              key={band.id}
            >
              <div className="range-badge">{band.levelLabel}</div>
              <div>
                <h3>{band.title}</h3>
                <p>{band.focus}</p>
                <div className="milestone-details">
                  {band.goals.slice(0, 2).map((goal) => (
                    <span className="chip chip-blue" key={goal}>
                      {goal}
                    </span>
                  ))}
                  {band.loadout.slice(0, 2).map((item) => (
                    <span className="chip chip-gold" key={item}>
                      {item}
                    </span>
                  ))}
                  <span className="chip">{band.rotation}</span>
                </div>
              </div>
              <div className="milestone-action">
                {related.length ? (
                  <button
                    type="button"
                    className="button button-small"
                    onClick={() =>
                      related.forEach((milestone) => {
                        if (bandDone || !completed.includes(milestone.id)) {
                          toggleCompleted(milestone.id);
                        }
                      })
                    }
                    aria-pressed={bandDone}
                  >
                    {bandDone ? "Concluído ✓" : "Marcar fase"}
                  </button>
                ) : (
                  <span className="chip">Especialização</span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function HuntsView({ level }: { level: number }) {
  const [focus, setFocus] = useState<"leveling" | "farm" | "safe">(
    "leveling",
  );
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const visible = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    return hunts
      .filter((hunt) => {
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
      })
      .sort((a, b) => {
        if (focus === "farm") return metricScore(b.loot) - metricScore(a.loot);
        if (focus === "safe") return b.minLevel - a.minLevel;
        return metricScore(b.xp) - metricScore(a.xp);
      });
  }, [focus, level, query, showAll]);

  return (
    <section className="view" aria-labelledby="hunts-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Escolha pelo objetivo</p>
          <h1 id="hunts-title">Hunts que fazem sentido agora</h1>
          <p>
            Raw XP e loot são testes comunitários pós-rebalance onde há
            medição. Skills, stamina, prey, charms, rota, Market e lotação mudam
            o resultado.
          </p>
        </div>
        <span className="review-stamp">{visible.length} opções exibidas</span>
      </div>

      <div className="filters">
        <div className="filter-group" aria-label="Objetivo da hunt">
          {(
            [
              ["leveling", "Leveling"],
              ["farm", "Farm"],
              ["safe", "Seguro para iniciante"],
            ] as const
          ).map(([id, label]) => (
            <button
              type="button"
              className="filter-button"
              key={id}
              aria-pressed={focus === id}
              onClick={() => setFocus(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="search-field">
          <span aria-hidden="true">⌕</span>
          <span className="sr-only">Buscar hunt</span>
          <input
            type="search"
            placeholder="Buscar hunt, acesso ou dica…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="filter-button"
          aria-pressed={showAll}
          onClick={() => setShowAll((current) => !current)}
        >
          {showAll ? "Só no meu level" : "Ver todas"}
        </button>
      </div>

      <div className="callout callout-blue" style={{ marginBottom: 16 }}>
        Nível sugerido pela comunidade — não é requisito nem garantia. Na
        primeira visita, use pulls menores, proteção adequada e uma rota de
        saída; “Seguro” aplica apenas uma margem simples de +20 levels.
      </div>

      <div className="card-grid">
        {visible.map((hunt) => (
          <article className="hunt-card" key={hunt.id}>
            <div className="card-topline">
              <span className="level-tag">Level {hunt.minLevel}+</span>
              <span className={`risk ${riskClass(hunt.risk)}`}>
                {hunt.risk}
              </span>
            </div>
            <h3>{hunt.name}</h3>
            <p>{hunt.tips[0]}</p>
            <div className="hunt-metrics">
              <div className="metric">
                <span>Raw XP observado</span>
                <strong>{metric(hunt.xp)}</strong>
              </div>
              <div className="metric">
                <span>Loot observado</span>
                <strong>{metric(hunt.loot)}</strong>
              </div>
            </div>
            <div className="now-meta">
              {hunt.focus.map((item) => (
                <span
                  className={`chip ${
                    item === "leveling" ? "chip-blue" : "chip-gold"
                  }`}
                  key={item}
                >
                  {parseFocusLabel(item)}
                </span>
              ))}
              <span className="chip">{hunt.ammo}</span>
              {hunt.access !== "Livre" ? (
                <span className="chip chip-red">Acesso</span>
              ) : null}
            </div>
            <div className="card-footer">
              <span className="source-anchor">{hunt.location}</span>
              <a
                className="source-anchor"
                href={hunt.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                {hunt.sourceName} ↗
              </a>
            </div>
          </article>
        ))}
        {!visible.length ? (
          <div className="empty-state">
            Nenhuma hunt encontrada. Tente “Ver todas” ou ajuste a busca.
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Inventory({
  loadout,
  selectedSlot,
  onSelectSlot,
}: {
  loadout: Partial<Record<EquipmentSlot, string>>;
  selectedSlot: EquipmentSlot;
  onSelectSlot: (slot: EquipmentSlot) => void;
}) {
  const equipped = SLOT_ORDER.map((slot) => itemById(loadout[slot])).filter(
    Boolean,
  ) as UiItem[];
  const distance = equipped.reduce((sum, item) => sum + (item.distance ?? 0), 0);
  const magic = equipped.reduce((sum, item) => sum + (item.magic ?? 0), 0);
  const armor = equipped.reduce((sum, item) => sum + (item.armor ?? 0), 0);
  const slots = equipped.reduce((sum, item) => sum + (item.imbueSlots ?? 0), 0);

  return (
    <div className="inventory-panel">
      <div className="inventory-title">
        <h3>Loadout atual</h3>
        <span className="chip chip-blue">Salvo localmente</span>
      </div>
      <div className="inventory-paperdoll" aria-label="Inventário equipado">
        {SLOT_ORDER.map((slot) => {
          const item = itemById(loadout[slot]);
          return (
            <button
              className={`slot ${slotClass(slot)}${
                item ? " is-filled" : ""
              }${selectedSlot === slot ? " is-selected" : ""}`}
              type="button"
              key={slot}
              onClick={() => onSelectSlot(slot)}
              aria-label={`${SLOT_LABELS[slot]}: ${
                item?.name ?? "vazio"
              }. Selecionar slot.`}
            >
              <span className="slot-glyph" aria-hidden="true">
                {item?.icon ?? "·"}
              </span>
              <span className="slot-name">
                {item?.name ?? SLOT_LABELS[slot]}
              </span>
            </button>
          );
        })}
      </div>
      <div className="inventory-summary">
        <div className="inventory-stat">
          <span>Distance</span>
          <strong>+{distance}</strong>
        </div>
        <div className="inventory-stat">
          <span>Holy ML</span>
          <strong>+{magic}</strong>
        </div>
        <div className="inventory-stat">
          <span>Armor</span>
          <strong>{armor}</strong>
        </div>
        <div className="inventory-stat">
          <span>Slots imbue</span>
          <strong>{slots}</strong>
        </div>
      </div>
    </div>
  );
}

function ArsenalView({
  level,
  loadout,
  setLoadout,
}: {
  level: number;
  loadout: Partial<Record<EquipmentSlot, string>>;
  setLoadout: (
    loadout: Partial<Record<EquipmentSlot, string>>,
  ) => void;
}) {
  const [slot, setSlot] = useState<EquipmentSlot>("weapon");
  const [showFuture, setShowFuture] = useState(false);
  const [contextId, setContextId] = useState(
    bisContexts.find((context) => context.minLevel <= level)?.id ??
      bisContexts[0]?.id ??
      "",
  );
  const selectedContext =
    bisContexts.find((context) => context.id === contextId) ?? bisContexts[0];
  const choices = items
    .filter(
      (item) =>
        item.slot === slot && (showFuture || item.minLevel <= level),
    )
    .sort((a, b) => a.minLevel - b.minLevel);

  function equip(item: UiItem) {
    setLoadout({ ...loadout, [item.slot]: item.id });
  }

  function applyContext(context: UiBisContext | undefined) {
    if (!context) {
      setLoadout(suggestedLoadout(level));
      return;
    }

    const next = { ...loadout };
    for (const [contextSlot, itemIds] of Object.entries(context.slots) as Array<
      [EquipmentSlot, readonly string[]]
    >) {
      const eligibleId = itemIds.find((id) => {
        const item = itemById(id);
        return item && item.minLevel <= level;
      });
      if (eligibleId) next[contextSlot] = eligibleId;
    }
    setLoadout(next);
  }

  return (
    <section className="view" aria-labelledby="arsenal-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">BIS é uma pergunta de contexto</p>
          <h1 id="arsenal-title">Monte o seu arsenal</h1>
          <p>
            Use o inventário para trocar cada slot. Dano nominal não vence
            sempre: a proteção dominante do spawn, sustain e custo podem valer
            mais.
          </p>
        </div>
        <button
          className="button button-primary"
          type="button"
          onClick={() => applyContext(selectedContext)}
        >
          Aplicar contexto
        </button>
      </div>

      <div className="tabs" role="tablist" aria-label="Contexto do loadout">
        {bisContexts.map((context) => (
          <button
            className="tab-button"
            type="button"
            role="tab"
            aria-selected={selectedContext?.id === context.id}
            onClick={() => setContextId(context.id)}
            key={context.id}
          >
            {context.label} · {context.minLevel}+
          </button>
        ))}
      </div>
      {selectedContext ? (
        <div className="callout callout-blue" style={{ marginBottom: 16 }}>
          <strong>{selectedContext.goal}</strong> {selectedContext.tradeoff}
          <a
            className="source-anchor"
            href={selectedContext.sourceUrl}
            target="_blank"
            rel="noreferrer"
            style={{ marginLeft: 8 }}
          >
            Fonte ↗
          </a>
        </div>
      ) : null}

      <div className="inventory-layout">
        <Inventory
          loadout={loadout}
          selectedSlot={slot}
          onSelectSlot={setSlot}
        />

        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>{SLOT_LABELS[slot]}</h3>
              <p>
                {choices.length} opções {showFuture ? "no guia" : "no seu level"}
              </p>
            </div>
            <button
              className="button button-small"
              type="button"
              aria-pressed={showFuture}
              onClick={() => setShowFuture((current) => !current)}
            >
              {showFuture ? "Ocultar futuros" : "Ver progressão futura"}
            </button>
          </div>
          <div className="gear-list">
            {choices.map((item) => {
              const equipped = loadout[item.slot] === item.id;
              return (
                <button
                  type="button"
                  className={`gear-choice${equipped ? " is-equipped" : ""}`}
                  onClick={() => equip(item)}
                  key={item.id}
                >
                  <span className="item-glyph" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span>
                    <strong>{item.name}</strong>
                    <small>
                      Lv {item.minLevel} · {item.summary}
                    </small>
                  </span>
                  <span className="equip-label">
                    {equipped ? "Equipado" : "Equipar"}
                  </span>
                </button>
              );
            })}
            {!choices.length ? (
              <div className="empty-state">
                Nenhum item catalogado para este slot e level.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function AcademyView() {
  const [open, setOpen] = useState<string>(guides[0]?.id ?? "");

  return (
    <section className="view" aria-labelledby="academy-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Como fazer, passo a passo</p>
          <h1 id="academy-title">Mecânicas sem mistério</h1>
          <p>
            Guias curtos para executar a ação no jogo e entender onde vale
            investir. Desde janeiro de 2026, spells são liberadas
            automaticamente e sem custo no level.
          </p>
        </div>
        <span className="review-stamp">Mecânicas 2026</span>
      </div>

      <div className="guides-grid">
        {guides.map((guide) => {
          const isOpen = guide.id === open;
          return (
            <article
              className={`guide-card${isOpen ? " is-open" : ""}`}
              key={guide.id}
            >
              <button
                type="button"
                className="guide-summary"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? "" : guide.id)}
              >
                <span className="guide-icon" aria-hidden="true">
                  {guideIcon(guide)}
                </span>
                <span className="guide-copy">
                  <span className="guide-title">{guide.title}</span>
                  <span className="guide-description">{guide.summary}</span>
                </span>
                <span className="guide-chevron" aria-hidden="true">
                  ⌄
                </span>
              </button>
              {isOpen ? (
                <div className="guide-body">
                  <ol>
                    {guide.steps.map((step) => (
                      <li key={step.title}>
                        <strong>{step.title}.</strong> {step.body}
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
                  <div className="callout">
                    <strong>Atenção:</strong> {guide.warnings.join(" ")}
                  </div>
                  <div className="card-footer">
                    <span className="source-anchor">Revisado 28 jul 2026</span>
                    <a
                      className="source-anchor"
                      href={guide.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {guide.sourceName} ↗
                    </a>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function SimulatorView({
  level,
  loadout,
  setLoadout,
}: {
  level: number;
  loadout: Partial<Record<EquipmentSlot, string>>;
  setLoadout: (
    loadout: Partial<Record<EquipmentSlot, string>>,
  ) => void;
}) {
  const [slot, setSlot] = useState<EquipmentSlot>("weapon");
  const [distance, setDistance] = useState(110);
  const [magicLevel, setMagicLevel] = useState(30);
  const [stance, setStance] = useState<PaladinStance>("sharpshooter");
  const [resistance, setResistance] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [forgeTier, setForgeTier] = useState(0);
  const [powerfulStrike, setPowerfulStrike] = useState(true);
  const [powerfulVamp, setPowerfulVamp] = useState(true);
  const [powerfulVoid, setPowerfulVoid] = useState(true);
  const [analyzerAverage, setAnalyzerAverage] = useState(0);

  const equipped = SLOT_ORDER.map((itemSlot) =>
    itemById(loadout[itemSlot]),
  ).filter(Boolean) as UiItem[];
  const gearDistance = equipped.reduce(
    (sum, item) => sum + (item.distance ?? 0),
    0,
  );
  const gearMagic = equipped.reduce(
    (sum, item) => sum + (item.magic ?? 0),
    0,
  );
  const weapon = itemById(loadout.weapon);
  const ammo = itemById(loadout.ammo);
  const isThrownWeapon = Boolean(
    weapon && /spear|star|knife|javelin/i.test(weapon.name),
  );
  const isCrossbow = Boolean(weapon && /crossbow|arbalest|piercer/i.test(weapon.name));
  const isBolt = Boolean(ammo && /bolt/i.test(ammo.name));
  const incompatibleAmmo = Boolean(
    weapon && ammo && ((isCrossbow && !isBolt) || (!isCrossbow && !isThrownWeapon && isBolt)),
  );
  const ammunitionAttack = isThrownWeapon
    ? weapon?.attack ?? 0
    : ammo?.attack ?? 37;
  const weaponAttackModifier = isThrownWeapon ? 0 : weapon?.attack ?? 0;

  const result = estimateAutoAttack({
    level,
    distance: distance + gearDistance,
    magicLevel: magicLevel + gearMagic,
    stance,
    ammunitionAttack,
    weaponAttackModifier,
    accuracyPercent: accuracy,
    targetResistancePercent: resistance,
    critical: powerfulStrike
      ? { chancePercent: 10, extraDamagePercent: 50 }
      : { chancePercent: 5, extraDamagePercent: 10 },
    forgeTier,
    lifeLeechPercent: powerfulVamp ? 25 : 0,
    manaLeechPercent: powerfulVoid ? 8 : 0,
  });

  const cycle = estimateFourSecondCycle({
    autoAttack: {
      level,
      distance: distance + gearDistance,
      magicLevel: magicLevel + gearMagic,
      stance,
      ammunitionAttack,
      weaponAttackModifier,
      accuracyPercent: accuracy,
      targetResistancePercent: resistance,
      critical: powerfulStrike
        ? { chancePercent: 10, extraDamagePercent: 50 }
        : { chancePercent: 5, extraDamagePercent: 10 },
      forgeTier,
      lifeLeechPercent: powerfulVamp ? 25 : 0,
      manaLeechPercent: powerfulVoid ? 8 : 0,
    },
  });

  const calibration =
    analyzerAverage > 0 && result.expectedDamagePerAttempt > 0
      ? analyzerAverage / result.expectedDamagePerAttempt
      : null;
  const pickerItems = items
    .filter((item) => item.slot === slot && item.minLevel <= level)
    .sort((a, b) => b.minLevel - a.minLevel);

  return (
    <section className="view" aria-labelledby="simulator-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Compare, não adivinhe</p>
          <h1 id="simulator-title">Seu dano, com ressalvas honestas</h1>
          <p>
            Selecione os itens no inventário e ajuste seus skills. O resultado
            serve para comparar loadouts; valide sempre no Impact Analyzer do
            jogo.
          </p>
        </div>
        <span className="review-stamp">
          Modelo {DAMAGE_MODEL_VERSION}
        </span>
      </div>

      <div className="simulator-layout">
        <div>
          <Inventory
            loadout={loadout}
            selectedSlot={slot}
            onSelectSlot={setSlot}
          />
          <div className="panel" style={{ marginTop: 12 }}>
            <div className="panel-header">
              <div>
                <h3>Trocar {SLOT_LABELS[slot]}</h3>
                <p>Somente itens até o seu level.</p>
              </div>
            </div>
            <div className="gear-list">
              {pickerItems.slice(0, 6).map((item) => (
                <button
                  type="button"
                  className={`gear-choice${
                    loadout[item.slot] === item.id ? " is-equipped" : ""
                  }`}
                  onClick={() =>
                    setLoadout({ ...loadout, [item.slot]: item.id })
                  }
                  key={item.id}
                >
                  <span className="item-glyph" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span>
                    <strong>{item.name}</strong>
                    <small>
                      Lv {item.minLevel} · {item.summary}
                    </small>
                  </span>
                  <span className="equip-label">
                    {loadout[item.slot] === item.id ? "Equipado" : "Usar"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <article className="sim-panel">
            <h3>Atributos e alvo</h3>
            <p>
              Bônus de Distance e Holy ML dos itens equipados entram
              automaticamente.
            </p>
            <div className="form-grid">
              <label className="field">
                <span>Distance base</span>
                <input
                  type="number"
                  min={10}
                  max={250}
                  value={distance}
                  onChange={(event) =>
                    setDistance(Math.max(10, event.target.valueAsNumber || 10))
                  }
                />
                <small className="field-help">
                  Com gear: {distance + gearDistance}
                </small>
              </label>
              <label className="field">
                <span>Magic level base</span>
                <input
                  type="number"
                  min={0}
                  max={200}
                  value={magicLevel}
                  onChange={(event) =>
                    setMagicLevel(Math.max(0, event.target.valueAsNumber || 0))
                  }
                />
                <small className="field-help">
                  Com gear: {magicLevel + gearMagic}
                </small>
              </label>
              <label className="field field-wide">
                <span>Stance</span>
                <select
                  value={stance}
                  onChange={(event) =>
                    setStance(event.target.value as PaladinStance)
                  }
                >
                  <option value="neutral">Sem stance</option>
                  <option value="sharpshooter">
                    Sharpshooter · +32% Distance
                  </option>
                  <option value="divine-defiance">
                    Divine Defiance · +6% Dist em Holy/Healing ML
                  </option>
                </select>
              </label>
              <label className="field">
                <span>Resistência do alvo</span>
                <span className="range-row">
                  <input
                    type="range"
                    min={-30}
                    max={80}
                    value={resistance}
                    onChange={(event) =>
                      setResistance(Number(event.target.value))
                    }
                  />
                  <span className="range-value">{resistance}%</span>
                </span>
              </label>
              <label className="field">
                <span>Precisão observada</span>
                <span className="range-row">
                  <input
                    type="range"
                    min={50}
                    max={100}
                    value={accuracy}
                    onChange={(event) =>
                      setAccuracy(Number(event.target.value))
                    }
                  />
                  <span className="range-value">{accuracy}%</span>
                </span>
              </label>
              <label className="field">
                <span>Forge tier da arma</span>
                <select
                  value={forgeTier}
                  onChange={(event) =>
                    setForgeTier(Number(event.target.value))
                  }
                >
                  {Array.from({ length: 11 }, (_, tier) => (
                    <option value={tier} key={tier}>
                      {tier === 0 ? "Sem tier" : `Tier ${tier}`}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Média no Impact Analyzer</span>
                <input
                  type="number"
                  min={0}
                  placeholder="Opcional"
                  value={analyzerAverage || ""}
                  onChange={(event) =>
                    setAnalyzerAverage(
                      Math.max(0, event.target.valueAsNumber || 0),
                    )
                  }
                />
                <small className="field-help">
                  Ajuda a enxergar o desvio do modelo.
                </small>
              </label>
              <div className="field field-wide">
                <span>Imbuements</span>
                <div className="toggle-row">
                  <button
                    type="button"
                    className="toggle"
                    aria-pressed={powerfulStrike}
                    onClick={() => setPowerfulStrike((current) => !current)}
                  >
                    Powerful Strike
                  </button>
                  <button
                    type="button"
                    className="toggle"
                    aria-pressed={powerfulVamp}
                    onClick={() => setPowerfulVamp((current) => !current)}
                  >
                    Vampirism 25%
                  </button>
                  <button
                    type="button"
                    className="toggle"
                    aria-pressed={powerfulVoid}
                    onClick={() => setPowerfulVoid((current) => !current)}
                  >
                    Void 8%
                  </button>
                </div>
              </div>
            </div>
          </article>

          <article className="sim-panel" style={{ marginTop: 12 }}>
            <div className="result-hero" aria-live="polite">
              <span className="result-label">
                Autoattack esperado por tentativa
              </span>
              <div className="result-value">
                {Math.round(result.expectedDamagePerAttempt)}
              </div>
              <div className="result-subtitle">
                {weapon?.name ?? "Arma sem bônus"}
                {isThrownWeapon
                  ? ""
                  : ` + ${ammo?.name ?? "Diamond Arrow padrão"}`}{" "}
                · pós-resistência e precisão
              </div>
            </div>

            <div className="results-grid">
              <div className="result-card">
                <span>Faixa bruta experimental</span>
                <strong>
                  {Math.round(result.raw.min)}–{Math.round(result.raw.max)}
                </strong>
              </div>
              <div className="result-card">
                <span>Média bruta</span>
                <strong>{Math.round(result.raw.average)}</strong>
              </div>
              <div className="result-card">
                <span>Ciclo teórico 4s</span>
                <strong>{Math.round(cycle.expectedDamage)}</strong>
              </div>
              <div className="result-card">
                <span>DPS proxy</span>
                <strong>{Math.round(cycle.expectedDps)}</strong>
              </div>
              <div className="result-card">
                <span>Leech vida / hit</span>
                <strong>{result.primaryTargetLeech.life}</strong>
              </div>
              <div className="result-card">
                <span>Leech mana / hit</span>
                <strong>{result.primaryTargetLeech.mana}</strong>
              </div>
            </div>

            {calibration ? (
              <div className="callout callout-blue" style={{ marginTop: 12 }}>
                Seu Analyzer indica fator local{" "}
                <strong>{calibration.toFixed(2)}×</strong>. Use esse desvio para
                comparar alternativas, não para corrigir todos os cenários.
              </div>
            ) : null}

            {incompatibleAmmo ? (
              <div className="callout" style={{ marginTop: 12 }}>
                <strong>Loadout incompatível:</strong> bows usam arrows;
                crossbows usam bolts. Troque a arma ou a munição antes de usar
                esta comparação.
              </div>
            ) : null}

            <div className="confidence">
              <strong>Baixa confiança absoluta</strong>
              <span>
                Estimativa comunitária. O dano real varia por armadura,
                resistência, Wheel, charms, proficiency, distribuição interna e
                atualizações. Valide no Impact Analyzer.
              </span>
            </div>

            <details className="formula-details">
              <summary>Ver fórmula e premissas</summary>
              <pre>{`s = floor((√(2L + 2025) + 5) / 10)
B = floor((L + 1000) / s) + 50s - 450
K = floor(6W / 5) × (Distance efetivo + 4) / 28
média bruta ≈ B + floor(K)

Ciclo comparativo: 2 autos + Caldera(BP150) + Barrage(BP130)
Não inclui armor, shielding, Wheel, charms, prey ou nº de alvos.`}</pre>
            </details>
          </article>
        </div>
      </div>
    </section>
  );
}
