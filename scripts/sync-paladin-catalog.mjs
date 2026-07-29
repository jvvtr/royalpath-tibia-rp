import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const API_BASE = "https://tibiadata.bytewizards.de/api/v1";
const FANDOM_API = "https://tibia.fandom.com/api.php";
const USER_AGENT =
  "RoyalPath-Tibia-RP catalog sync/1.0 (+https://github.com/jvvtr/royalpath-tibia-rp)";
const VERIFIED_AT = new Date().toISOString().slice(0, 10);
const EXPECTED_EQUIPMENT_COUNT = 528;
const EXPECTED_AMMUNITION_COUNT = 27;

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ITEMS_DIR = path.join(ROOT_DIR, "public", "items");
const MANIFEST_PATH = path.join(ITEMS_DIR, "manifest.json");
const GENERATED_ITEMS_PATH = path.join(ROOT_DIR, "app", "items.generated.ts");

const EQUIPMENT_CATEGORIES = [
  {
    slug: "helmets",
    slot: "head",
    acceptedWikiSlots: ["head"],
    icon: "⛑",
    label: "capacete",
    useCase: ["proteção de cabeça"],
  },
  {
    slug: "armors",
    slot: "armor",
    acceptedWikiSlots: ["body"],
    icon: "🛡",
    label: "armadura",
    useCase: ["proteção do corpo"],
  },
  {
    slug: "legs",
    slot: "legs",
    acceptedWikiSlots: ["legs"],
    icon: "▥",
    label: "calças",
    useCase: ["proteção das pernas"],
  },
  {
    slug: "boots",
    slot: "boots",
    acceptedWikiSlots: ["feet"],
    icon: "◒",
    label: "botas",
    useCase: ["proteção dos pés"],
  },
  {
    slug: "quivers",
    slot: "quiver",
    acceptedWikiSlots: ["shield hand"],
    icon: "➶",
    label: "aljava",
    useCase: ["flechas e virotes", "suporte de munição"],
  },
  {
    slug: "shields",
    slot: "shield",
    acceptedWikiSlots: ["shield hand", "shield"],
    icon: "🛡",
    label: "escudo",
    useCase: ["defesa", "armas de arremesso"],
  },
  {
    slug: "bows",
    slot: "weapon",
    acceptedWikiSlots: ["both hands"],
    icon: "🏹",
    label: "arco",
    useCase: ["flechas", "duas mãos"],
  },
  {
    slug: "crossbows",
    slot: "weapon",
    acceptedWikiSlots: ["both hands"],
    icon: "🏹",
    label: "besta",
    useCase: ["virotes", "alvo único"],
  },
  {
    slug: "throwing-weapons",
    slot: "weapon",
    acceptedWikiSlots: ["weapon hand", "both hands"],
    icon: "➶",
    label: "arma de arremesso",
    useCase: ["arremesso", "baixo investimento"],
  },
  {
    slug: "amulets-and-necklaces",
    slot: "amulet",
    acceptedWikiSlots: ["neck"],
    icon: "◇",
    label: "amuleto",
    useCase: ["acessório", "troca de proteção"],
  },
  {
    slug: "rings",
    slot: "ring",
    acceptedWikiSlots: ["finger"],
    icon: "○",
    label: "anel",
    useCase: ["acessório", "troca situacional"],
  },
];

const CATEGORY_BY_SLUG = new Map(
  EQUIPMENT_CATEGORIES.map((category) => [category.slug, category]),
);

const ITEM_SLOT_BY_WIKI_SLOT = new Map([
  ["head", "head"],
  ["body", "armor"],
  ["torso", "armor"],
  ["legs", "legs"],
  ["feet", "boots"],
  ["neck", "amulet"],
  ["finger", "ring"],
  ["weapon hand", "weapon"],
  ["both hands", "weapon"],
]);

const WEAPON_KIND_BY_CATEGORY = new Map([
  ["bows", "bow"],
  ["crossbows", "crossbow"],
  ["throwing-weapons", "thrown"],
]);

const AMMUNITION_CATEGORY_PAGES = new Set([
  "Ammunition",
  "Bow Ammunition",
  "Crossbow Ammunition",
]);

const PROTECTION_TRANSLATIONS = new Map([
  ["physical", "físico"],
  ["fire", "fogo"],
  ["earth", "terra"],
  ["energy", "energia"],
  ["ice", "gelo"],
  ["holy", "holy"],
  ["death", "death"],
  ["drown", "afogamento"],
  ["life drain", "life drain"],
  ["mana drain", "mana drain"],
]);

const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeLookup(value) {
  return normalizeText(value).toLocaleLowerCase("en-US");
}

function slugify(value) {
  return normalizeText(value)
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("en-US")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseNumber(value, fallback) {
  const match = normalizeText(value).replace(",", ".").match(/[+-]?\d+(?:\.\d+)?/);
  if (!match) return fallback;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseInteger(value, fallback) {
  const parsed = parseNumber(value, fallback);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function clampTier(value) {
  const parsed = parseInteger(value, undefined);
  if (parsed === undefined || parsed < 0 || parsed > 4) return undefined;
  return parsed;
}

function wikiPageUrl(title) {
  return `https://tibia.fandom.com/wiki/${encodeURIComponent(title.replaceAll(" ", "_"))}`;
}

function apiItemUrl(value) {
  return `${API_BASE}/items/${encodeURIComponent(value)}`;
}

async function fetchWithRetry(url, options = {}, retries = 4) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          Accept: options.accept ?? "*/*",
          "User-Agent": USER_AGENT,
          ...options.headers,
        },
        signal: AbortSignal.timeout(45_000),
      });

      if (response.ok) return response;

      const retryable =
        response.status === 408 ||
        response.status === 425 ||
        response.status === 429 ||
        response.status >= 500;

      if (!retryable || attempt === retries) {
        throw new Error(`${response.status} ${response.statusText} ao acessar ${url}`);
      }

      lastError = new Error(`${response.status} ${response.statusText}`);
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
    }

    await delay(Math.min(4_000, 350 * 2 ** attempt));
  }

  throw lastError ?? new Error(`Falha desconhecida ao acessar ${url}`);
}

async function fetchJson(url) {
  const response = await fetchWithRetry(url, { accept: "application/json" });
  return response.json();
}

async function fetchBuffer(url, extraHeaders = {}) {
  const response = await fetchWithRetry(url, {
    headers: extraHeaders,
    accept: "image/avif,image/webp,image/png,image/gif,image/*,*/*;q=0.8",
  });
  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    mimeType: response.headers.get("content-type")?.split(";")[0] ?? null,
  };
}

async function mapConcurrent(values, concurrency, worker) {
  const output = new Array(values.length);
  let cursor = 0;

  async function run() {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      output[index] = await worker(values[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, () => run()),
  );
  return output;
}

function additionalAttributeMap(detail) {
  const entries = detail.additionalAttributes?.entries;
  if (!Array.isArray(entries)) return new Map();

  return new Map(
    entries
      .filter((entry) => entry && typeof entry.key === "string")
      .map((entry) => [normalizeLookup(entry.key), normalizeText(entry.value)]),
  );
}

function vocationAllowsPaladin(value) {
  const vocation = normalizeLookup(value);
  if (!vocation || vocation === "none") return true;
  if (vocation === "without") return false;
  return /\bpaladins?\b/i.test(vocation);
}

function resolveItemSlot(category, attributes) {
  const wikiSlot = normalizeLookup(attributes.get("slot"));
  if (wikiSlot === "shield hand" || wikiSlot === "shield") {
    if (category.slug === "quivers") return "quiver";
    if (category.slug === "shields") return "shield";
    return undefined;
  }
  return ITEM_SLOT_BY_WIKI_SLOT.get(wikiSlot);
}

function recognizedSlot(category, attributes) {
  return resolveItemSlot(category, attributes) !== undefined;
}

function looksLikeUnusableArtifact(detail, attributes) {
  const name = normalizeLookup(detail.name);
  const notes = normalizeLookup(attributes.get("notes"));
  const implemented = normalizeLookup(detail.implemented);

  if (/\btest$/.test(name)) return true;
  if (/\breplica\b/.test(name) && !attributes.has("slot")) return true;
  if (!implemented || implemented === "--") {
    return (
      !attributes.has("slot") ||
      /not implemented|never implemented|test server|deleted from the game/.test(notes)
    );
  }
  return (
    /(?:this|it|it's)\s+(?:is\s+)?believed to be an unobtainable item/i.test(
      notes,
    ) ||
    /\b(?:this item|it)\s+is\s+(?:currently\s+)?unobtainable\b/.test(notes) ||
    /\bcurrently unobtainable\b/.test(notes) ||
    /never obtainable|not implemented in game|deleted from the game/.test(notes)
  );
}

function parseAttribBonus(attrib, patterns) {
  const value = normalizeText(attrib);
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match) return parseInteger(match[1], undefined);
  }
  return undefined;
}

function parseProtections(attributes) {
  const raw =
    attributes.get("resist") ||
    attributes.get("resistpercent") ||
    attributes.get("protection");
  if (!raw) return [];

  return raw
    .split(/[,;]/)
    .map((entry) => entry.trim())
    .map((entry) => {
      const match = entry.match(/^(.+?)\s*([+-]\s*\d+(?:[.,]\d+)?)\s*%$/i);
      if (!match) return null;
      const sourceLabel = normalizeLookup(match[1]).replace(/\s+/g, " ");
      const translated = PROTECTION_TRANSLATIONS.get(sourceLabel) ?? sourceLabel;
      const amount = match[2].replace(/\s+/g, "").replace(",", ".");
      return `${translated} ${amount}%`;
    })
    .filter(Boolean);
}

function stageForLevel(level) {
  if (level <= 200) return "progressão";
  if (level <= 400) return "especialista";
  return "bis-contextual";
}

function summarizeStats(item) {
  const stats = [];
  if (item.attack !== undefined) stats.push(`ataque ${item.attack}`);
  if (item.defense !== undefined && item.defense > 0) {
    stats.push(`defesa ${item.defense}`);
  }
  if (item.hit !== undefined) stats.push(`hit +${item.hit}`);
  if (item.distance !== undefined) stats.push(`distance +${item.distance}`);
  if (item.magic !== undefined) stats.push(`holy magic +${item.magic}`);
  if (item.armor !== undefined) stats.push(`armadura ${item.armor}`);
  if (item.imbueSlots !== undefined) {
    stats.push(
      `${item.imbueSlots} ${item.imbueSlots === 1 ? "slot de imbuement" : "slots de imbuement"}`,
    );
  }
  if (item.protection?.length) stats.push(item.protection.slice(0, 2).join(" e "));
  return stats.slice(0, 3);
}

function equipmentUseCases(category, item) {
  const tags = [...category.useCase];
  if (item.distance) tags.push("bônus de distance");
  if (item.magic) tags.push("holy magic");
  if (item.imbueSlots) tags.push(`${item.imbueSlots} imbuement${item.imbueSlots > 1 ? "s" : ""}`);
  if (item.protection?.length) {
    const label = item.protection[0].replace(/\s*[+-]\d+(?:\.\d+)?%$/, "");
    tags.push(`proteção ${label}`);
  }
  return [...new Set(tags)].slice(0, 3);
}

function equipmentSummary(category, item) {
  const levelText = item.minLevel
    ? ` para comparar a partir do level ${item.minLevel}`
    : " sem level mínimo informado";
  const stats = summarizeStats(item);
  const statsText = stats.length ? ` Destaques: ${stats.join(", ")}.` : "";
  return `${category.label[0].toLocaleUpperCase("pt-BR")}${category.label.slice(1)}${levelText}.${statsText}`;
}

function mapEquipmentItem(detail, id) {
  const category = CATEGORY_BY_SLUG.get(detail.categorySlug);
  const attributes = additionalAttributeMap(detail);
  const slot = resolveItemSlot(category, attributes);
  const minLevel = Math.max(0, parseInteger(detail.levelRequired, 0));
  const attack =
    parseNumber(attributes.get("attackmodifier"), undefined) ??
    parseNumber(detail.attack, undefined);
  const defense =
    parseNumber(detail.defense, undefined) ??
    parseNumber(attributes.get("defense"), undefined) ??
    parseNumber(attributes.get("defensemodifier"), undefined) ??
    parseNumber(attributes.get("defense modifier"), undefined);
  const hit = parseNumber(attributes.get("hitmodifier"), undefined);
  const distance = parseAttribBonus(detail.attrib, [
    /distance\s+fighting\s*([+-]?\d+)/i,
    /distance\s*([+-]?\d+)/i,
  ]);
  const magic = parseAttribBonus(detail.attrib, [
    /holy\s+magic\s+level\s*([+-]?\d+)/i,
    /magic\s+level\s*([+-]?\d+)/i,
  ]);
  const armor = parseNumber(detail.armor, undefined);
  const protection = parseProtections(attributes);
  const imbueSlots = parseInteger(detail.imbueSlots, undefined);
  const tierClass = clampTier(detail.upgradeClass);

  const item = {
    id,
    name: detail.name,
    slot,
    minLevel,
  };

  const weaponKind = WEAPON_KIND_BY_CATEGORY.get(category.slug);
  if (slot === "weapon" && weaponKind) item.weaponKind = weaponKind;

  if (attack !== undefined) item.attack = attack;
  if (defense !== undefined) item.defense = defense;
  if (hit !== undefined) item.hit = hit;
  if (distance !== undefined) item.distance = distance;
  if (magic !== undefined) item.magic = magic;
  if (armor !== undefined) item.armor = armor;
  if (protection.length) item.protection = protection;
  if (imbueSlots !== undefined) item.imbueSlots = imbueSlots;
  if (tierClass !== undefined) item.tierClass = tierClass;

  item.useCase = equipmentUseCases(category, item);
  item.icon = category.icon;
  item.summary = equipmentSummary(category, item);
  item.stage = stageForLevel(minLevel);
  item.sourceUrl = detail.wikiUrl || wikiPageUrl(detail.name);
  item.sourceName = "TibiaWiki via TibiaData API";
  item.verifiedAt = VERIFIED_AT;
  item.patch = `Estado do catálogo sincronizado em ${VERIFIED_AT}`;
  item.confidence = "média";

  return item;
}

function extractTemplateValue(wikitext, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = wikitext.match(
    new RegExp(`^\\s*\\|\\s*${escaped}\\s*=\\s*([^\\r\\n]*)`, "im"),
  );
  return normalizeText(match?.[1]);
}

function stripWikiMarkup(value) {
  return normalizeText(value)
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, "$1")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function ammunitionAttack(wikitext) {
  const keys = [
    "attack",
    "energy_attack",
    "fire_attack",
    "earth_attack",
    "ice_attack",
    "death_attack",
    "holy_attack",
  ];
  return Math.max(
    ...keys.map(
      (key) => parseNumber(extractTemplateValue(wikitext, key), 0) ?? 0,
    ),
  );
}

function ammunitionElement(wikitext) {
  const elements = [
    ["energy_attack", "energia"],
    ["fire_attack", "fogo"],
    ["earth_attack", "terra"],
    ["ice_attack", "gelo"],
    ["death_attack", "death"],
    ["holy_attack", "holy"],
  ];
  return elements.find(([key]) => parseNumber(extractTemplateValue(wikitext, key), 0) > 0)?.[1];
}

function ammunitionUseCases(name, kind, element) {
  const tags = [kind === "bolt" ? "virote" : "flecha"];
  if (/diamond|burst|storm/i.test(name)) tags.push("ataque em área");
  else tags.push("alvo único");
  if (element) tags.push(`dano de ${element}`);
  else tags.push("dano físico");
  return tags;
}

function ammunitionSummary(item, kind, element) {
  const noun = kind === "bolt" ? "Virote" : "Flecha";
  const levelText = item.minLevel
    ? ` para Royal Paladin a partir do level ${item.minLevel}`
    : " sem level mínimo";
  const damageText = element ? `, com dano de ${element}` : ", com dano físico";
  return `${noun}${levelText}${damageText} e ataque ${item.attack}.`;
}

function mapAmmunitionItem(page, imageInfo, id) {
  const wikitext = page.wikitext;
  const minLevel = Math.max(
    0,
    parseInteger(extractTemplateValue(wikitext, "levelrequired"), 0),
  );
  const attack = ammunitionAttack(wikitext);
  const kind = /\bbolt\b/i.test(page.title) ? "bolt" : "arrow";
  const element = ammunitionElement(wikitext);

  const item = {
    id,
    name: page.title,
    slot: "ammo",
    ammoKind: kind,
    minLevel,
    attack,
    useCase: ammunitionUseCases(page.title, kind, element),
    icon: kind === "bolt" ? "➸" : "➤",
    summary: "",
    stage: stageForLevel(minLevel),
    sourceUrl: wikiPageUrl(page.title),
    sourceName: "TibiaWiki on Fandom",
    verifiedAt: VERIFIED_AT,
    patch: `Estado do catálogo sincronizado em ${VERIFIED_AT}`,
    confidence: "média",
  };
  item.summary = ammunitionSummary(item, kind, element);

  return {
    item,
    image: imageInfo,
    wikiUrl: item.sourceUrl,
    itemId: extractTemplateValue(wikitext, "itemid"),
  };
}

async function enumerateCategory(category) {
  const pageSize = 100;
  let page = 1;
  const results = [];

  while (true) {
    const query = new URLSearchParams({
      category: category.slug,
      page: String(page),
      pageSize: String(pageSize),
      sort: "name",
    });
    const response = await fetchJson(`${API_BASE}/items?${query}`);
    results.push(...response.items);
    if (results.length >= response.totalCount || response.items.length === 0) break;
    page += 1;
  }

  return results;
}

async function fetchEquipmentCatalog(exclusions, failures) {
  console.log("Enumerando categorias de equipamento...");
  const categoryLists = await mapConcurrent(
    EQUIPMENT_CATEGORIES,
    4,
    enumerateCategory,
  );
  const listed = categoryLists.flat();
  const uniqueById = new Map(listed.map((item) => [item.id, item]));
  const candidates = [...uniqueById.values()];
  console.log(
    `${candidates.length} candidatos únicos encontrados nas ${EQUIPMENT_CATEGORIES.length} categorias.`,
  );

  const details = await mapConcurrent(candidates, 10, async (candidate, index) => {
    try {
      const detail = await fetchJson(`${API_BASE}/items/${candidate.id}`);
      if ((index + 1) % 100 === 0) {
        console.log(`  ${index + 1}/${candidates.length} detalhes consultados...`);
      }
      return detail;
    } catch (error) {
      failures.push({
        kind: "equipment-detail",
        name: candidate.name,
        url: `${API_BASE}/items/${candidate.id}`,
        error: error.message,
      });
      return null;
    }
  });

  return details.filter(Boolean).filter((detail) => {
    const category = CATEGORY_BY_SLUG.get(detail.categorySlug);
    const attributes = additionalAttributeMap(detail);

    if (!category) {
      exclusions.push({ name: detail.name, reason: "categoria não suportada" });
      return false;
    }
    if (!vocationAllowsPaladin(detail.vocation)) {
      exclusions.push({
        name: detail.name,
        reason: `vocação incompatível: ${detail.vocation || "(vazia)"}`,
      });
      return false;
    }
    if (!recognizedSlot(category, attributes)) {
      exclusions.push({
        name: detail.name,
        reason: `slot não reconhecido: ${attributes.get("slot") || "(vazio)"}`,
      });
      return false;
    }
    if (looksLikeUnusableArtifact(detail, attributes)) {
      exclusions.push({ name: detail.name, reason: "item obsoleto/teste/inutilizável" });
      return false;
    }
    return true;
  });
}

async function fandomQuery(parameters) {
  const query = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    origin: "*",
    ...parameters,
  });
  return fetchJson(`${FANDOM_API}?${query}`);
}

async function fetchAmmunitionMembers() {
  const members = [];
  let continuation = {};

  while (true) {
    const response = await fandomQuery({
      list: "categorymembers",
      cmtitle: "Category:Ammunition",
      cmnamespace: "0",
      cmlimit: "max",
      ...continuation,
    });
    members.push(...(response.query?.categorymembers ?? []));
    if (!response.continue) break;
    continuation = { cmcontinue: response.continue.cmcontinue };
  }

  return members;
}

async function fetchAmmunitionPages(titles) {
  const pages = [];
  const chunks = [];
  for (let index = 0; index < titles.length; index += 25) {
    chunks.push(titles.slice(index, index + 25));
  }

  const responses = await mapConcurrent(chunks, 3, (chunk) =>
    fandomQuery({
      prop: "revisions|categories",
      titles: chunk.join("|"),
      redirects: "1",
      rvprop: "content",
      rvslots: "main",
      cllimit: "max",
    }),
  );

  for (const response of responses) {
    for (const page of response.query?.pages ?? []) {
      pages.push({
        title: page.title,
        categories: (page.categories ?? []).map((category) => category.title),
        wikitext: page.revisions?.[0]?.slots?.main?.content ?? "",
      });
    }
  }

  return pages;
}

async function fetchAmmunitionImages(titles) {
  const requests = titles.flatMap((title) => [
    `File:${title}.gif`,
    `File:${title}.png`,
  ]);
  const chunks = [];
  for (let index = 0; index < requests.length; index += 30) {
    chunks.push(requests.slice(index, index + 30));
  }

  const responses = await mapConcurrent(chunks, 3, (chunk) =>
    fandomQuery({
      prop: "imageinfo",
      titles: chunk.join("|"),
      iiprop: "url|mime|size",
    }),
  );

  const imagesByName = new Map();
  for (const response of responses) {
    for (const page of response.query?.pages ?? []) {
      const info = page.imageinfo?.[0];
      if (!info?.url) continue;
      const name = page.title
        .replace(/^File:/i, "")
        .replace(/\.(?:gif|png)$/i, "");
      const key = normalizeLookup(name);
      const existing = imagesByName.get(key);
      if (!existing || page.title.toLocaleLowerCase("en-US").endsWith(".gif")) {
        imagesByName.set(key, {
          assetId: null,
          assetUrl: info.url,
          mimeType: info.mime ?? null,
          width: info.width ?? null,
          height: info.height ?? null,
        });
      }
    }
  }

  return imagesByName;
}

function ammunitionIsActive(page, exclusions) {
  if (AMMUNITION_CATEGORY_PAGES.has(page.title)) {
    exclusions.push({ name: page.title, reason: "página de categoria" });
    return false;
  }
  if (/\(weak\)$/i.test(page.title)) {
    exclusions.push({ name: page.title, reason: "variante Weak" });
    return false;
  }

  const categories = page.categories.map(normalizeLookup);
  const notes = stripWikiMarkup(extractTemplateValue(page.wikitext, "notes"));
  const itemId = extractTemplateValue(page.wikitext, "itemid");
  const isDeprecated = categories.some(
    (category) =>
      category === "category:deprecated" ||
      category === "category:deprecated pages" ||
      category.includes("test server"),
  );

  if (
    isDeprecated ||
    /never obtainable|deleted from the game|not implemented in game/i.test(notes)
  ) {
    exclusions.push({ name: page.title, reason: "munição obsoleta/de teste" });
    return false;
  }
  if (!/\d/.test(itemId)) {
    exclusions.push({ name: page.title, reason: "sem item ID ativo" });
    return false;
  }
  return true;
}

async function fetchAmmunitionCatalog(exclusions, failures) {
  console.log("Consultando munições ativas no TibiaWiki...");
  const members = await fetchAmmunitionMembers();
  const pages = await fetchAmmunitionPages(members.map((member) => member.title));
  const activePages = pages.filter((page) => ammunitionIsActive(page, exclusions));
  const images = await fetchAmmunitionImages(activePages.map((page) => page.title));

  return activePages
    .map((page) => {
      const image = images.get(normalizeLookup(page.title));
      if (!image) {
        failures.push({
          kind: "ammunition-image-metadata",
          name: page.title,
          url: wikiPageUrl(page.title),
          error: "sprite .gif/.png não encontrado",
        });
        return null;
      }
      return { page, image };
    })
    .filter(Boolean);
}

function stableIdFactory(existingManifest) {
  const existingByName = new Map(
    (existingManifest.items ?? []).map((item) => [normalizeLookup(item.name), item.id]),
  );
  const ownerById = new Map(
    (existingManifest.items ?? []).map((item) => [item.id, normalizeLookup(item.name)]),
  );

  return (name, sourceId) => {
    const nameKey = normalizeLookup(name);
    const existing = existingByName.get(nameKey);
    if (existing) return existing;

    const base = slugify(name) || `item-${sourceId}`;
    if (!ownerById.has(base) || ownerById.get(base) === nameKey) {
      ownerById.set(base, nameKey);
      return base;
    }

    const withSource = `${base}-${sourceId}`;
    if (!ownerById.has(withSource) || ownerById.get(withSource) === nameKey) {
      ownerById.set(withSource, nameKey);
      return withSource;
    }

    let suffix = 2;
    while (ownerById.has(`${withSource}-${suffix}`)) suffix += 1;
    const unique = `${withSource}-${suffix}`;
    ownerById.set(unique, nameKey);
    return unique;
  };
}

function equipmentSprite(detail) {
  const image = detail.images?.[0];
  if (!image?.assetId) return null;
  return {
    assetId: image.assetId,
    assetUrl: `${API_BASE}/assets/${image.assetId}`,
    mimeType: image.mimeType ?? null,
    width: image.width ?? null,
    height: image.height ?? null,
  };
}

async function convertSprite(source, targetPath) {
  const { buffer, mimeType } = await fetchBuffer(source.assetUrl, {
    Referer: source.assetUrl.includes("wikia.nocookie.net")
      ? "https://tibia.fandom.com/"
      : "https://tibiadata.bytewizards.de/",
  });
  const png = await sharp(buffer, { animated: false, pages: 1 })
    .resize(32, 32, {
      fit: "contain",
      kernel: sharp.kernel.nearest,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();
  await writeFile(targetPath, png);
  return {
    sha256: createHash("sha256").update(png).digest("hex"),
    sourceMimeType: source.mimeType ?? mimeType,
    width: 32,
    height: 32,
  };
}

async function writeGeneratedItems(items) {
  const banner = `// This file is generated by scripts/sync-paladin-catalog.mjs.
// Do not edit it by hand; update the synchronizer and run it again.

`;
  const contents = `${banner}export const GENERATED_PALADIN_ITEMS = ${JSON.stringify(
    items,
    null,
    2,
  )} as const;\n`;
  await writeFile(GENERATED_ITEMS_PATH, contents, "utf8");
}

async function main() {
  await mkdir(ITEMS_DIR, { recursive: true });
  const existingManifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
  const allocateId = stableIdFactory(existingManifest);
  const exclusions = [];
  const failures = [];

  const [equipmentDetails, ammunitionRecords] = await Promise.all([
    fetchEquipmentCatalog(exclusions, failures),
    fetchAmmunitionCatalog(exclusions, failures),
  ]);

  const equipment = equipmentDetails.map((detail) => {
    const id = allocateId(detail.name, detail.id);
    return {
      item: mapEquipmentItem(detail, id),
      image: equipmentSprite(detail),
      wikiUrl: detail.wikiUrl || wikiPageUrl(detail.name),
      lookupUrl: apiItemUrl(detail.name),
    };
  });

  const ammunition = ammunitionRecords.map(({ page, image }) =>
    mapAmmunitionItem(page, image, allocateId(page.title, page.title)),
  );

  const records = [...equipment, ...ammunition].sort(
    (left, right) =>
      left.item.slot.localeCompare(right.item.slot) ||
      left.item.minLevel - right.item.minLevel ||
      left.item.name.localeCompare(right.item.name, "en"),
  );

  for (const record of records) {
    if (!record.image) {
      failures.push({
        kind: "sprite-metadata",
        name: record.item.name,
        url: record.item.sourceUrl,
        error: "item ativo sem sprite publicado",
      });
    }
  }

  const duplicatedIds = records
    .map((record) => record.item.id)
    .filter((id, index, all) => all.indexOf(id) !== index);
  if (duplicatedIds.length) {
    failures.push({
      kind: "duplicate-id",
      name: [...new Set(duplicatedIds)].join(", "),
      error: "IDs de arquivo duplicados",
    });
  }

  console.log(`Baixando e convertendo ${records.length} sprites para PNG...`);
  const manifestRecords = await mapConcurrent(records, 10, async (record, index) => {
    if (!record.image) return null;
    const targetPath = path.join(ITEMS_DIR, `${record.item.id}.png`);

    try {
      const converted = await convertSprite(record.image, targetPath);
      if ((index + 1) % 100 === 0) {
        console.log(`  ${index + 1}/${records.length} sprites convertidos...`);
      }
      return {
        id: record.item.id,
        name: record.item.name,
        ...(record.item.defense !== undefined
          ? { defense: record.item.defense }
          : {}),
        assetId: record.image.assetId ?? null,
        wikiUrl: record.wikiUrl,
        lookupUrl: record.lookupUrl ?? apiItemUrl(record.item.name),
        assetUrl: record.image.assetUrl,
        source:
          record.item.slot === "ammo"
            ? "TibiaWiki on Fandom"
            : "TibiaData Item API by ByteWizards",
        sourceMimeType: converted.sourceMimeType,
        width: converted.width,
        height: converted.height,
        sha256: converted.sha256,
      };
    } catch (error) {
      failures.push({
        kind: "sprite-download",
        name: record.item.name,
        url: record.image.assetUrl,
        error: error.message,
      });
      return null;
    }
  });

  const equipmentCount = equipment.length;
  const ammunitionCount = ammunition.length;
  const validManifestRecords = manifestRecords.filter(Boolean);

  const diagnostics = {
    generatedAt: VERIFIED_AT,
    equipment: equipmentCount,
    ammunition: ammunitionCount,
    total: records.length,
    sprites: validManifestRecords.length,
    exclusions: exclusions.length,
    failures: failures.length,
  };

  console.log("\nResumo do catálogo:");
  console.log(JSON.stringify(diagnostics, null, 2));

  if (
    equipmentCount !== EXPECTED_EQUIPMENT_COUNT ||
    ammunitionCount !== EXPECTED_AMMUNITION_COUNT
  ) {
    console.warn(
      `AVISO: a contagem mudou (referência atual: ${EXPECTED_EQUIPMENT_COUNT} equipamentos + ${EXPECTED_AMMUNITION_COUNT} munições).`,
    );
  }

  const reasonCounts = Object.entries(
    exclusions.reduce((counts, exclusion) => {
      counts[exclusion.reason] = (counts[exclusion.reason] ?? 0) + 1;
      return counts;
    }, {}),
  ).sort((left, right) => right[1] - left[1]);

  console.log("\nExclusões por motivo:");
  for (const [reason, count] of reasonCounts) {
    console.log(`  ${count} × ${reason}`);
  }

  if (failures.length) {
    console.error("\nFalhas:");
    for (const failure of failures) {
      console.error(`  [${failure.kind}] ${failure.name}: ${failure.error}`);
    }
    throw new Error(
      `Sincronização interrompida: ${failures.length} falha(s); arquivos de índice não foram atualizados.`,
    );
  }

  await writeGeneratedItems(records.map((record) => record.item));
  const nextManifest = {
    ...existingManifest,
    generatedAt: VERIFIED_AT,
    sources: ["TibiaData Item API by ByteWizards", "TibiaWiki on Fandom"],
    sourceApi: API_BASE,
    items: validManifestRecords,
  };
  await writeFile(MANIFEST_PATH, `${JSON.stringify(nextManifest, null, 2)}\n`, "utf8");

  console.log(`\nGerado: ${path.relative(ROOT_DIR, GENERATED_ITEMS_PATH)}`);
  console.log(`Atualizado: ${path.relative(ROOT_DIR, MANIFEST_PATH)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
