export const LAST_VERIFIED = "2026-07-28" as const;

export type Confidence = "alta" | "média" | "baixa";

export interface Provenance {
  sourceUrl: string;
  sourceName: string;
  verifiedAt: string;
  patch: string;
  confidence: Confidence;
}

export interface Source {
  id: string;
  name: string;
  publisher: string;
  url: string;
  kind: "oficial" | "wiki-comunitária" | "guia-comunitário";
  verifiedAt: string;
  patch: string;
  confidence: Confidence;
  note: string;
}

export interface NavItem {
  id: "agora" | "roadmap" | "hunts" | "arsenal" | "academia" | "simulador";
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
}

export interface Milestone extends Provenance {
  id: string;
  level: number;
  levelLabel: string;
  title: string;
  summary: string;
  actions: string[];
  tags: string[];
}

export interface ProgressionBand extends Provenance {
  id: string;
  minLevel: number;
  maxLevel: number | null;
  levelLabel: string;
  title: string;
  focus: string;
  goals: string[];
  loadout: string[];
  rotation: string;
  caution: string;
}

export type HuntFocus = "leveling" | "farm" | "equilibrada" | "aprendizado";
export type HuntRisk = "baixo" | "moderado" | "alto" | "muito alto";
export type HuntMetricStatus =
  | "faixa-observada"
  | "sem-faixa-pos-rebalance"
  | "teste-comunitario";

export interface Hunt extends Provenance {
  id: string;
  name: string;
  location: string;
  minLevel: number;
  focus: HuntFocus[];
  xp: string;
  loot: string;
  metricStatus: HuntMetricStatus;
  risk: HuntRisk;
  ammo: string;
  access: string;
  creatures: string[];
  tips: string[];
}

export type ItemSlot =
  | "weapon"
  | "ammo"
  | "head"
  | "armor"
  | "legs"
  | "boots"
  | "amulet"
  | "ring"
  | "quiver";

export type ItemStage = "progressão" | "especialista" | "bis-contextual";

export interface Item extends Provenance {
  id: string;
  name: string;
  slot: ItemSlot;
  minLevel: number;
  attack?: number;
  hit?: number;
  distance?: number;
  magic?: number;
  armor?: number;
  protection?: string[];
  imbueSlots?: number;
  tierClass?: 0 | 1 | 2 | 3 | 4;
  useCase: string[];
  icon: string;
  summary: string;
  stage: ItemStage;
}

export interface BisContext extends Provenance {
  id: string;
  label: string;
  minLevel: number;
  goal: string;
  slots: Partial<Record<ItemSlot, string[]>>;
  tradeoff: string;
}

export interface GuideStep {
  title: string;
  body: string;
  detail?: string[];
}

export interface Guide extends Provenance {
  id: string;
  category: "primeiros-passos" | "combate" | "imbuement" | "forge" | "proficiency";
  title: string;
  eyebrow: string;
  summary: string;
  estimatedTime: string;
  steps: GuideStep[];
  checklist: string[];
  warnings: string[];
  relatedSourceIds: string[];
}

const OFFICIAL_VOCATION_2026: Provenance = {
  sourceUrl: "https://www.tibia.com/news/?id=8833&subtopic=newsarchive",
  sourceName: "Tibia.com — Vocation Adjustments Release State",
  verifiedAt: LAST_VERIFIED,
  patch: "Vocation Adjustments, 16/06/2026",
  confidence: "alta",
};

const OFFICIAL_FINAL_TUNING_2026: Provenance = {
  sourceUrl: "https://www.tibia.com/news/?id=8872&subtopic=newsarchive",
  sourceName: "Tibia.com — Fine-tuning após o rebalance",
  verifiedAt: LAST_VERIFIED,
  patch: "Ajustes finais, 07/07/2026",
  confidence: "alta",
};

const OFFICIAL_SPELLS: Provenance = {
  sourceUrl: "https://www.tibia.com/library/?vocation=Paladin&subtopic=spells",
  sourceName: "Tibia.com Library — Paladin Spells",
  verifiedAt: LAST_VERIFIED,
  patch: "Estado ao vivo em 28/07/2026",
  confidence: "alta",
};

const OFFICIAL_SUMMER_2026: Provenance = {
  sourceUrl:
    "https://www.cipsoft.com/en/press/press-releases/438-tibia-summer-update-2026",
  sourceName: "CipSoft — Tibia Summer Update 2026",
  verifiedAt: LAST_VERIFIED,
  patch: "Summer Update, 13/07/2026",
  confidence: "alta",
};

const WIKI_DISTANCE: Provenance = {
  sourceUrl: "https://www.tibiawiki.com.br/wiki/Dist%C3%A2ncia",
  sourceName: "Tibia Wiki BR — Armas de distância",
  verifiedAt: LAST_VERIFIED,
  patch: "Banco comunitário consultado após o Summer Update 2026",
  confidence: "média",
};

const WIKI_PALADIN_SET: Provenance = {
  sourceUrl: "https://www.tibiawiki.com.br/wiki/Paladin_Set",
  sourceName: "Tibia Wiki BR — Paladin Set",
  verifiedAt: LAST_VERIFIED,
  patch: "Banco comunitário consultado após o Summer Update 2026",
  confidence: "média",
};

const COMMUNITY_EQUIPMENT: Provenance = {
  sourceUrl: "https://www.tibiamonk.com/en/equipment/paladin",
  sourceName: "TibiaMonk — Paladin Equipment Guide",
  verifiedAt: LAST_VERIFIED,
  patch: "Guia comunitário atualizado para o Summer Update 2026",
  confidence: "média",
};

const COMMUNITY_HUNTS: Provenance = {
  sourceUrl: "https://www.tibiabuddy.com/blog/paladin-hunting-guide-2026",
  sourceName: "TibiaBuddy — Paladin Hunting Guide 2026",
  verifiedAt: LAST_VERIFIED,
  patch: "Leitura comunitária pós-rebalance de 2026",
  confidence: "baixa",
};

const OFFICIAL_IMBUEMENT_COSTS: Provenance = {
  sourceUrl: "https://www.tibia.com/news/?id=8396&subtopic=newsarchive",
  sourceName: "Tibia.com — Imbuement Success and Fees",
  verifiedAt: LAST_VERIFIED,
  patch: "Summer Update 2025",
  confidence: "alta",
};

const OFFICIAL_FORGE: Provenance = {
  sourceUrl: "https://www.tibia.com/support/?entryid=224&subtopic=gethelp",
  sourceName: "Tibia.com Support — Exaltation Forge FAQ",
  verifiedAt: LAST_VERIFIED,
  patch: "FAQ oficial consultado em 28/07/2026",
  confidence: "alta",
};

const WIKI_FORGE: Provenance = {
  sourceUrl: "https://www.tibiawiki.com.br/wiki/Exaltation_Forge",
  sourceName: "Tibia Wiki BR — Exaltation Forge",
  verifiedAt: LAST_VERIFIED,
  patch: "Tabela comunitária consultada em 28/07/2026",
  confidence: "média",
};

export const CONTENT_NOTICE = {
  title: "Guia vivo, não receita",
  text:
    "Tibia muda com frequência e não existe um único set BIS para todo respawn. " +
    "Preço, skills, charms, Wheel, proficiência, ping, rota, população do mundo e prática " +
    "alteram o resultado. Confira o cliente e o Market antes de gastar.",
  metrics:
    "Faixas de XP e lucro são observações comunitárias, não promessa. Após o rebalance de " +
    "junho/julho de 2026, o RoyalPath omite números acima do level 80 quando não há reteste " +
    "pós-patch suficientemente claro; Girtablilu aparece como exceção identificada.",
  legal:
    "Projeto pessoal, não oficial, sem fins lucrativos e desenvolvido 100% por IA. " +
    "Tibia e suas marcas pertencem à CipSoft GmbH.",
  verifiedAt: LAST_VERIFIED,
} as const;

export const NAV_ITEMS: readonly NavItem[] = [
  {
    id: "agora",
    label: "Agora",
    shortLabel: "Agora",
    icon: "✦",
    description: "Seu próximo passo, sem transformar o início em uma planilha.",
  },
  {
    id: "roadmap",
    label: "Roadmap",
    shortLabel: "Rota",
    icon: "⌁",
    description: "Marcos de level, magia, munição e equipamento.",
  },
  {
    id: "hunts",
    label: "Hunts",
    shortLabel: "Hunts",
    icon: "⌖",
    description: "Opções para experiência, lucro ou aprendizado.",
  },
  {
    id: "arsenal",
    label: "Arsenal",
    shortLabel: "Itens",
    icon: "◇",
    description: "Progressão de itens e trocas de proteção por contexto.",
  },
  {
    id: "academia",
    label: "Academia",
    shortLabel: "Guias",
    icon: "☷",
    description: "Tutoriais de combate, imbuements, Forge e proficiência.",
  },
  {
    id: "simulador",
    label: "Simulador",
    shortLabel: "Dano",
    icon: "⚔",
    description: "Monte o inventário e compare estimativas honestas de dano.",
  },
] as const;

export const MILESTONES: readonly Milestone[] = [
  {
    id: "level-8-mainland",
    level: 8,
    levelLabel: "8",
    title: "Escolha Paladin e chegue ao continente",
    summary:
      "Aprenda a manter distância, atacar sem interromper a caminhada e carregar suprimentos leves.",
    actions: [
      "Configure hotkeys de cura, mana, ataque e troca de alvo.",
      "Comece o treino offline de distance fighting sempre que sair.",
      "Leve rope, shovel, comida e uma pequena reserva de potions.",
    ],
    tags: ["fundamentos", "hotkeys", "treino offline"],
    ...OFFICIAL_SPELLS,
  },
  {
    id: "level-20-promotion",
    level: 20,
    levelLabel: "20",
    title: "Vire Royal Paladin",
    summary:
      "Com Premium Account e 20.000 gp, a promoção melhora regeneração e libera as stances da vocação.",
    actions: [
      "Compre a promoção antes de investir em luxo.",
      "Teste Sharpshooter para dano e Divine Defiance para sobrevivência/holy.",
      "Sharpshooter concede +32% de distance total; Divine Defiance usa 6% do distance em holy/healing magic level e 12% de dodge contra ataques não adjacentes.",
    ],
    tags: ["promoção", "stance", "prioridade"],
    ...OFFICIAL_FINAL_TUNING_2026,
  },
  {
    id: "level-23-ethereal-spear",
    level: 23,
    levelLabel: "23",
    title: "Inclua Ethereal Spear",
    summary:
      "Seu primeiro ataque instantâneo de alvo ajuda a preencher turnos sem abandonar o ataque básico.",
    actions: [
      "Use a magia entre ataques básicos; não atrase o próximo disparo.",
      "Mantenha mana para cura e saída de emergência.",
    ],
    tags: ["magia", "single target", "rotação"],
    ...OFFICIAL_SPELLS,
  },
  {
    id: "level-40-divine-missile",
    level: 40,
    levelLabel: "40",
    title: "Adicione Divine Missile",
    summary:
      "Uma fonte de dano sagrado útil contra alvos vulneráveis e para treinar o ritmo de ataque + magia.",
    actions: [
      "Compare o custo de mana com o tempo ganho por criatura.",
      "Use Onyx Arrow para single target quando fizer sentido pelo preço do seu mundo.",
    ],
    tags: ["holy", "single target", "Onyx Arrow"],
    ...OFFICIAL_SPELLS,
  },
  {
    id: "level-50-caldera",
    level: 50,
    levelLabel: "50",
    title: "Abra a era de área",
    summary:
      "Divine Caldera e Shatterstorm Arrow permitem praticar pulls pequenos antes da Diamond Arrow.",
    actions: [
      "Comece com 2–4 criaturas e uma rota com espaço para kite.",
      "A Divine Caldera ficou com base power 150 no ajuste de 07/07/2026.",
      "Shatterstorm Arrow tem ataque 27 e cobre 13 quadrados.",
    ],
    tags: ["AoE", "Divine Caldera", "Shatterstorm"],
    ...OFFICIAL_FINAL_TUNING_2026,
  },
  {
    id: "level-60-ethereal-barrage",
    level: 60,
    levelLabel: "60",
    title: "Desbloqueie Ethereal Barrage",
    summary:
      "Magia física de área com base power 40, cooldown de 4 s e custo de 135 mana.",
    actions: [
      "Use quando o formato do pull encaixar melhor que uma magia de alvo.",
      "Não sacrifique o ataque básico para apertar a magia fora de ritmo.",
    ],
    tags: ["AoE", "físico", "magia nova 2026"],
    ...OFFICIAL_VOCATION_2026,
  },
  {
    id: "level-70-divine-barrage",
    level: 70,
    levelLabel: "70",
    title: "Desbloqueie Divine Barrage",
    summary:
      "Magia sagrada de área com base power 130, cooldown de 4 s e custo de 175 mana.",
    actions: [
      "A área acompanha o desenho da Diamond Arrow, mesmo antes de você equipá-la.",
      "Alterne a magia conforme resistência, posição e mana.",
    ],
    tags: ["AoE", "holy", "magia nova 2026"],
    ...OFFICIAL_FINAL_TUNING_2026,
  },
  {
    id: "level-90-crystalline",
    level: 90,
    levelLabel: "90",
    title: "Crystalline Arrow e Strong Ethereal Spear",
    summary:
      "O single target ganha força; é uma boa fase para aprimorar pathing e escolha de alvo.",
    actions: [
      "Use Crystalline Arrow, ataque 65, onde matar um alvo por vez ainda é mais seguro.",
      "Treine a alternância entre ataque básico, magia e cura sem sobrepor cooldowns.",
    ],
    tags: ["Crystalline Arrow", "single target", "controle"],
    ...WIKI_DISTANCE,
  },
  {
    id: "level-100-superior-mana",
    level: 100,
    levelLabel: "100",
    title: "Troque para Superior Mana Potion",
    summary:
      "A poção de level 100 restaura 240–360 mana e custa 254 gp no estado de release de 2026.",
    actions: [
      "Recalcule a quantidade por hunt: mais mana por uso muda capacidade e ritmo.",
      "Guarde cura de emergência em hotkey separada.",
    ],
    tags: ["suprimentos", "mana", "economia"],
    ...OFFICIAL_VOCATION_2026,
  },
  {
    id: "level-125-storm-arrows",
    level: 125,
    levelLabel: "125",
    title: "Carregue munição elemental de área",
    summary:
      "Firestorm, Terrastorm, Froststorm e Thunderstorm Arrows têm ataque 21 e cobrem 13 quadrados.",
    actions: [
      "Escolha o elemento pela criatura, não pela cor favorita.",
      "Compare no seu respawn: vulnerabilidade elemental pode ou não compensar o ataque menor.",
      "Leve uma opção física para não ficar preso a uma resistência ruim.",
    ],
    tags: ["munição elemental", "AoE", "teste por respawn"],
    ...OFFICIAL_VOCATION_2026,
  },
  {
    id: "level-150-diamond-spectral",
    level: 150,
    levelLabel: "150",
    title: "Diamond para área, Spectral para alvo",
    summary:
      "Diamond Arrow (ataque 37, área de 21 quadrados) e Spectral Bolt (ataque 78) definem duas funções diferentes.",
    actions: [
      "Use Diamond para pulls controlados; use Spectral em single target e chefes quando apropriado.",
      "Diamond é física e não recebe conversão de imbuement elemental.",
      "Aprenda a fechar o box gradualmente: sobrevivência vem antes de densidade.",
    ],
    tags: ["Diamond Arrow", "Spectral Bolt", "marco de build"],
    ...WIKI_DISTANCE,
  },
  {
    id: "level-200-modern-kit",
    level: 200,
    levelLabel: "200",
    title: "Monte o primeiro kit moderno",
    summary:
      "Bow of Destruction e armaduras situacionais abrem mais slots e proteção sem exigir um set único.",
    actions: [
      "Priorize arma, imbuements e proteção adequada antes de pensar em tier.",
      "Tenha ao menos duas armaduras para elementos diferentes quando o orçamento permitir.",
    ],
    tags: ["upgrade", "imbuements", "proteção"],
    ...COMMUNITY_EQUIPMENT,
  },
  {
    id: "level-300-falcon",
    level: 300,
    levelLabel: "300",
    title: "Entre na faixa Falcon",
    summary:
      "Falcon Bow, Falcon Coif e Falcon Greaves são referências duráveis, mas cada peça ainda depende da defesa exigida.",
    actions: [
      "Compare Falcon Bow com alternativas por preço, proficiência e proteção.",
      "Use o bônus de fogo do coif onde ele realmente reduz risco.",
    ],
    tags: ["Falcon", "endgame inicial", "contexto"],
    ...WIKI_PALADIN_SET,
  },
  {
    id: "level-400-soul-alicorn",
    level: 400,
    levelLabel: "400",
    title: "Soulbleeder, Alicorn e Soulstalkers",
    summary:
      "Uma faixa forte de equipamento para dano e proteção física, ainda sujeita a swaps por elemento.",
    actions: [
      "Compare o custo total já com imbuements.",
      "Não venda todos os itens antigos: uma proteção situacional pode valer mais que status bruto.",
    ],
    tags: ["Soul", "Alicorn", "swap"],
    ...COMMUNITY_EQUIPMENT,
  },
  {
    id: "level-600-sanguine",
    level: 600,
    levelLabel: "600",
    title: "Planeje Sanguine e Grand Sanguine",
    summary:
      "Sanguine Bow oferece ataque +9, hit +6, distance +3, três slots e 6% de proteção a terra.",
    actions: [
      "Avalie a árvore de proficiência antes de comprar.",
      "Só trate Grand Sanguine como upgrade quando o custo fizer sentido para seu objetivo.",
    ],
    tags: ["Sanguine", "proficiência", "alto investimento"],
    ...WIKI_DISTANCE,
  },
  {
    id: "level-800-trail-hood",
    level: 800,
    levelLabel: "800",
    title: "Moonsilver Trail Hood",
    summary:
      "Capacete de 2026 com distance +4, holy magic level +2, físico +6%, terra +10% e augment de Divine Barrage.",
    actions: [
      "Use o hood como opção de dano/terra, não como substituto automático para toda defesa.",
      "Considere o augment de +8% de critical extra damage da Divine Barrage na rotação.",
    ],
    tags: ["Moonsilver", "Summer 2026", "terra"],
    sourceUrl: "https://www.tibiawiki.com.br/wiki/Moonsilver_Trail_Hood",
    sourceName: "Tibia Wiki BR — Moonsilver Trail Hood",
    verifiedAt: LAST_VERIFIED,
    patch: "Summer Update, 13/07/2026",
    confidence: "média",
  },
  {
    id: "level-1000-moonsilver",
    level: 1000,
    levelLabel: "1000+",
    title: "Moonsilver e Stellar Moonsilver",
    summary:
      "Moonsilver Bow é a referência de dano bruto de level 1000; a variante Stellar acrescenta customização, não uma resposta universal.",
    actions: [
      "Compare perks e slots alterados da árvore de proficiência.",
      "Considere Moonsilver Bow pelo ataque +10, hit +7, distance +5, três slots e fogo +7%.",
      "Confirme atributos no cliente antes de uma compra de alto valor.",
    ],
    tags: ["Moonsilver", "Stellar", "BIS contextual"],
    ...OFFICIAL_SUMMER_2026,
  },
] as const;

export const PROGRESSION_BANDS: readonly ProgressionBand[] = [
  {
    id: "progression-8-19",
    minLevel: 8,
    maxLevel: 19,
    levelLabel: "8–19",
    title: "Aprenda o ciclo",
    focus: "Movimento, hotkeys, suprimentos e ataques sem perder distância.",
    goals: [
      "Sair da zona inicial com hotkeys funcionais.",
      "Ativar treino offline todos os dias.",
      "Juntar 20.000 gp para a promoção sem comprometer potions.",
    ],
    loadout: [
      "Spear ou bow simples com arrows baratas.",
      "Armadura leve que caiba no orçamento.",
      "Rope, shovel, comida e potions.",
    ],
    rotation:
      "Ataque básico → caminhe mantendo espaço → cura apenas quando necessário → próximo alvo.",
    caution:
      "Capacidade é curta. Levar loot pesado demais costuma ser mais perigoso que voltar cedo.",
    ...COMMUNITY_EQUIPMENT,
  },
  {
    id: "progression-20-49",
    minLevel: 20,
    maxLevel: 49,
    levelLabel: "20–49",
    title: "Promoção e ritmo",
    focus: "Royal Paladin, stances, primeiro feitiço de alvo e gestão de mana.",
    goals: [
      "Comprar a promoção.",
      "Testar Sharpshooter e Divine Defiance em situações seguras.",
      "Obter Royal Spear/Enchanted Spear ou um bow com bom custo.",
    ],
    loadout: [
      "Royal Spear no 25 ou Enchanted Spear no 42.",
      "Paladin Armor quando o preço for razoável.",
      "Elvish Bow como plataforma de três slots.",
    ],
    rotation:
      "Ataque básico → Ethereal Spear → reposicionamento; preserve mana para cura.",
    caution:
      "Skills e prática pesam mais que level isolado. Comece cada respawn puxando pouco.",
    ...OFFICIAL_FINAL_TUNING_2026,
  },
  {
    id: "progression-50-99",
    minLevel: 50,
    maxLevel: 99,
    levelLabel: "50–99",
    title: "Primeiras áreas",
    focus: "Packs pequenos, Shatterstorm, Caldera, Barrages e single target forte no 90.",
    goals: [
      "Aprender o formato das áreas.",
      "Alternar físico e sagrado conforme resistência.",
      "Chegar à Crystalline Arrow sem criar o hábito de boxar cedo demais.",
    ],
    loadout: [
      "Composite Hornbow ou opção de três slots.",
      "Shatterstorm para área; Crystalline no 90 para alvo.",
      "Zaoan Helmet para proteção física acessível.",
    ],
    rotation:
      "Ataque de munição → Caldera/Barrage disponível → movimento → cura; nunca cancele o disparo.",
    caution:
      "AoE aumenta a quantidade de criaturas tocadas e, portanto, a chance de um pull sair do controle.",
    ...OFFICIAL_FINAL_TUNING_2026,
  },
  {
    id: "progression-100-149",
    minLevel: 100,
    maxLevel: 149,
    levelLabel: "100–149",
    title: "Preparação para a virada",
    focus: "Superior Mana Potion, Rift Bow e munições elementais de área.",
    goals: [
      "Revisar suprimentos com a nova potion.",
      "Testar cada Storm Arrow em criatura vulnerável.",
      "Juntar reserva para a munição e os itens do 150.",
    ],
    loadout: [
      "Rift Bow com três slots.",
      "Crystalline para alvo e Storm Arrow adequada no 125.",
      "Proteção elemental alinhada à hunt.",
    ],
    rotation:
      "Ataque → Caldera/Divine Barrage → ataque → Ethereal/Divine Barrage conforme posição.",
    caution:
      "A maior vulnerabilidade elemental nem sempre compensa ataque menor; valide no analyzer.",
    ...OFFICIAL_VOCATION_2026,
  },
  {
    id: "progression-150-199",
    minLevel: 150,
    maxLevel: 199,
    levelLabel: "150–199",
    title: "Diamond e Spectral",
    focus: "Separar a build de área da build de single target.",
    goals: [
      "Dominar pulls de Diamond Arrow sem full box prematuro.",
      "Montar imbuements consistentes.",
      "Registrar XP, gasto e loot por sessão.",
    ],
    loadout: [
      "Diamond Arrow para área; Spectral Bolt para alvo.",
      "Jungle Bow ou Rift Bow conforme preço e slots.",
      "Vampirism/Void e Strike conforme elegibilidade do item.",
    ],
    rotation:
      "Diamond → magia de área → Diamond → segunda magia de área; cure e ande entre os turnos.",
    caution:
      "Diamond Arrow permanece física e não recebe conversão elemental de imbuement.",
    ...WIKI_DISTANCE,
  },
  {
    id: "progression-200-299",
    minLevel: 200,
    maxLevel: 299,
    levelLabel: "200–299",
    title: "Arsenal situacional",
    focus: "Bow of Destruction, armaduras com dois slots e proteção por respawn.",
    goals: [
      "Ter pelo menos uma alternativa defensiva.",
      "Desbloquear acessos úteis antes de perseguir tier.",
      "Comprar upgrades pela diferença real, não pelo nome.",
    ],
    loadout: [
      "Bow of Destruction → Living Vine → Cataclysm/Lion conforme mercado.",
      "Gnome Armor para energia; Ghost Chestplate para físico e flexibilidade.",
      "Pendulet ou Sleep Shawl conforme elemento.",
    ],
    rotation:
      "Mantenha o ciclo de dois ataques básicos e magias de área, adaptando a cura ao tamanho do pull.",
    caution:
      "Itens de proteção diferente não formam uma fila linear: mantenha swaps úteis.",
    ...COMMUNITY_EQUIPMENT,
  },
  {
    id: "progression-300-399",
    minLevel: 300,
    maxLevel: 399,
    levelLabel: "300–399",
    title: "Faixa Falcon",
    focus: "Aumentar consistência com dano e resistência, não apenas o pico no simulador.",
    goals: [
      "Avaliar Falcon Bow e Inferniarch/alternativas pelo preço do mundo.",
      "Completar acessos de hunts de alto risco.",
      "Aprender quando quebrar o box e resetar o pull.",
    ],
    loadout: [
      "Falcon Bow para físico e proteção a fogo.",
      "Falcon Coif quando fogo for relevante.",
      "Falcon Greaves para físico e gelo.",
    ],
    rotation:
      "Ciclo AoE contínuo; trate o reposicionamento defensivo como parte da rotação.",
    caution:
      "A morte custa mais que a diferença de XP entre duas rotas. Faça o primeiro teste com margem.",
    ...WIKI_PALADIN_SET,
  },
  {
    id: "progression-400-599",
    minLevel: 400,
    maxLevel: 599,
    levelLabel: "400–599",
    title: "Soul e Alicorn",
    focus: "Dano alto com proteção física consistente e troca refinada por elemento.",
    goals: [
      "Comparar Soulbleeder com sua arma proficiente atual.",
      "Montar Alicorn Headguard e Soulstalkers quando trouxerem ganho real.",
      "Priorizar charms, Wheel, rota e execução junto do equipamento.",
    ],
    loadout: [
      "Soulbleeder para dano físico.",
      "Alicorn Headguard para proteção ampla.",
      "Pair of Soulstalkers para físico e mobilidade.",
    ],
    rotation:
      "Use a mesma cadência base, mas escolha Barrage/Caldera e posicionamento pelo perfil do pack.",
    caution:
      "O simulador não conhece armadura, mitigação, charms, prey e todas as perks; trate o resultado como comparação.",
    ...COMMUNITY_EQUIPMENT,
  },
  {
    id: "progression-600-799",
    minLevel: 600,
    maxLevel: 799,
    levelLabel: "600–799",
    title: "Sanguine e especialização",
    focus: "Escolher perks, rota e proteção para um conjunto menor de hunts dominadas.",
    goals: [
      "Planejar a árvore de proficiência antes da compra.",
      "Medir o ganho de cada upgrade em sessões equivalentes.",
      "Manter set alternativo para o elemento principal de cada hunt.",
    ],
    loadout: [
      "Sanguine/Grand Sanguine Bow quando a árvore e o custo justificarem.",
      "Peças Soul/Alicorn e swaps de armor/amulet.",
      "Imbuements Powerful renovados antes do conteúdo difícil.",
    ],
    rotation:
      "Otimize a rotação somente depois de torná-la repetível sob pressão.",
    caution:
      "Tier alto é um luxo probabilístico; proficiência, imbuement e sobrevivência têm prioridade.",
    ...WIKI_DISTANCE,
  },
  {
    id: "progression-800-999",
    minLevel: 800,
    maxLevel: 999,
    levelLabel: "800–999",
    title: "Moonsilver defensivo/ofensivo",
    focus: "Incorporar Trail Hood e o augment de Divine Barrage em conteúdo de alto risco.",
    goals: [
      "Testar o hood em terra e físico.",
      "Comparar o ganho da Divine Barrage com sua rotação real.",
      "Preparar financeiramente o salto de arma do 1000 sem desmontar os swaps.",
    ],
    loadout: [
      "Moonsilver Trail Hood.",
      "Sanguine/Grand Sanguine ou a arma com melhor proficiência.",
      "Proteções específicas para o time e o boss.",
    ],
    rotation:
      "Alinhe Divine Barrage aos packs em que o augment gera valor; não force área ruim.",
    caution:
      "Conteúdo desta faixa frequentemente é de equipe: a função no grupo muda a melhor peça.",
    sourceUrl: "https://www.tibiawiki.com.br/wiki/Moonsilver_Trail_Hood",
    sourceName: "Tibia Wiki BR — Moonsilver Trail Hood",
    verifiedAt: LAST_VERIFIED,
    patch: "Summer Update, 13/07/2026",
    confidence: "média",
  },
  {
    id: "progression-1000-plus",
    minLevel: 1000,
    maxLevel: null,
    levelLabel: "1000+",
    title: "BIS é uma decisão",
    focus: "Moonsilver, Stellar e customização de proficiência orientada ao conteúdo.",
    goals: [
      "Comparar árvore, proteção, preço e custo de oportunidade.",
      "Usar practice mode em bosses antes de arriscar a tentativa real.",
      "Revalidar o set após cada patch importante.",
    ],
    loadout: [
      "Moonsilver ou Stellar Moonsilver Bow.",
      "Trail Hood e swaps defensivos já dominados.",
      "Consumíveis, charms, Wheel e proficiência planejados como um sistema.",
    ],
    rotation:
      "A rotação ideal depende do encontro; registre o analyzer e ajuste uma variável por vez.",
    caution:
      "“Maior dano no papel” não significa “melhor item” para sobreviver, lucrar ou cumprir seu papel.",
    ...OFFICIAL_SUMMER_2026,
  },
] as const;

export const HUNTS: readonly Hunt[] = [
  {
    id: "swamp-trolls",
    name: "Swamp Trolls",
    location: "Port Hope e arredores",
    minLevel: 8,
    focus: ["farm", "aprendizado"],
    xp: "20–45 k XP/h",
    loot: "20–60 k gp/h",
    metricStatus: "faixa-observada",
    risk: "baixo",
    ammo: "Spear ou arrows baratas; evite gastar mais que o loot.",
    access: "Sem quest relevante; escolha uma caverna próxima da cidade.",
    creatures: ["Swamp Troll"],
    tips: [
      "Medicine Pouch pode sustentar o começo financeiro.",
      "Use a hunt para acertar hotkeys e aprender a voltar antes de ficar sem potion.",
      "As faixas variam com preço do Medicine Pouch e população do mundo.",
    ],
    ...COMMUNITY_HUNTS,
  },
  {
    id: "amazon-camp",
    name: "Amazon Camp",
    location: "Venore",
    minLevel: 15,
    focus: ["farm", "aprendizado"],
    xp: "30–70 k XP/h",
    loot: "30–90 k gp/h",
    metricStatus: "faixa-observada",
    risk: "baixo",
    ammo: "Spear, Royal Spear no 25 ou bow econômico.",
    access: "Sem acesso complexo; marque a rota de ida e volta.",
    creatures: ["Amazon", "Valkyrie", "Witch"],
    tips: [
      "Protective Charms podem valer mais que o gold direto.",
      "Evite salas cheias até conhecer o alcance das witches.",
      "Compare o Market antes de calcular lucro.",
    ],
    ...COMMUNITY_HUNTS,
  },
  {
    id: "stonerefiners",
    name: "Stonerefiners",
    location: "Venore Corym Cave",
    minLevel: 25,
    focus: ["leveling", "equilibrada"],
    xp: "120–220 k XP/h",
    loot: "0–60 k gp/h",
    metricStatus: "faixa-observada",
    risk: "baixo",
    ammo: "Royal Spear ou bow econômico.",
    access: "Leve Stealth Ring; sem invisibilidade a recomendação deixa de ser iniciante.",
    creatures: ["Stonerefiner"],
    tips: [
      "Confira a duração do Stealth Ring antes de descer.",
      "Saia com margem: perder invisibilidade dentro da caverna muda o risco.",
      "É uma opção eficiente, mas ensina menos kite que uma hunt aberta.",
    ],
    ...COMMUNITY_HUNTS,
  },
  {
    id: "yalahar-cults",
    name: "Yalahar Cults",
    location: "Yalahar, Magician Quarter",
    minLevel: 50,
    focus: ["farm", "equilibrada"],
    xp: "180–350 k XP/h",
    loot: "120–300 k gp/h",
    metricStatus: "faixa-observada",
    risk: "moderado",
    ammo: "Onyx Arrow/Crystalline quando disponível ou Enchanted Spear.",
    access: "Requer acesso a Yalahar e navegação pelo Magician Quarter.",
    creatures: ["Novice of the Cult", "Acolyte of the Cult", "Adept of the Cult"],
    tips: [
      "Rope Belts alimentam imbuement de mana e costumam sustentar o lucro.",
      "Limpe a entrada devagar antes de acelerar a rota.",
      "Faça supplies para a volta, não apenas para o tempo de caça.",
    ],
    ...COMMUNITY_HUNTS,
  },
  {
    id: "iksupan",
    name: "Iksupan",
    location: "Kilmaresh",
    minLevel: 70,
    focus: ["leveling", "equilibrada"],
    xp: "350–600 k XP/h",
    loot: "50–150 k gp/h",
    metricStatus: "faixa-observada",
    risk: "moderado",
    ammo: "Shatterstorm para packs pequenos; Crystalline no 90 para alvo.",
    access: "Confirme a rota e os requisitos da região de Kilmaresh antes de levar supplies.",
    creatures: ["Iks Aucar", "Iks Chuka", "Iks Churrascan"],
    tips: [
      "Pratique Divine Barrage sem aumentar o pull de uma vez.",
      "Observe paralyze e caminho de fuga.",
      "A faixa é comunitária e depende muito do piso e da rota.",
    ],
    ...COMMUNITY_HUNTS,
  },
  {
    id: "krailos-nightmare-scions",
    name: "Krailos Nightmare Scions",
    location: "Krailos",
    minLevel: 90,
    focus: ["leveling"],
    xp: "Sem faixa pós-rebalance confiável",
    loot: "Tende a waste; valide no analyzer",
    metricStatus: "sem-faixa-pos-rebalance",
    risk: "alto",
    ammo: "Crystalline para alvo; Shatterstorm apenas com pull controlado.",
    access: "Acesso a Krailos; reconheça a saída antes de acelerar.",
    creatures: ["Nightmare Scion", "Undead Gladiator"],
    tips: [
      "É uma hunt orientada a XP, não uma recomendação de lucro.",
      "Comece pelas bordas e teste o combo recebido.",
      "Os números antigos foram omitidos após o rebalance de 2026.",
    ],
    ...COMMUNITY_HUNTS,
  },
  {
    id: "putrid-mummies",
    name: "Putrid Mummies",
    location: "Darashia",
    minLevel: 90,
    focus: ["farm", "equilibrada"],
    xp: "Sem faixa pós-rebalance confiável",
    loot: "Potencial de lucro; valide preços e analyzer",
    metricStatus: "sem-faixa-pos-rebalance",
    risk: "moderado",
    ammo: "Crystalline e magias sagradas; evite overpull.",
    access: "Confira o acesso da caverna e leve proteção compatível.",
    creatures: ["Putrid Mummy"],
    tips: [
      "O valor do loot varia por Market.",
      "Use o espaço para kite; não force box nesta faixa.",
      "Os números antigos foram omitidos após o rebalance de 2026.",
    ],
    ...COMMUNITY_HUNTS,
  },
  {
    id: "lava-lurkers",
    name: "Ravenous Lava Lurkers",
    location: "Kazordoon, Gnome Deep Hub",
    minLevel: 125,
    focus: ["leveling"],
    xp: "Sem faixa pós-rebalance confiável",
    loot: "Waste planejado: as criaturas não entregam loot normal",
    metricStatus: "sem-faixa-pos-rebalance",
    risk: "alto",
    ammo: "Froststorm Arrow no 125+; leve alternativa e compare o dano.",
    access: "Requer acesso à região e supplies completos.",
    creatures: ["Ravenous Lava Lurker"],
    tips: [
      "Entre sabendo o limite de waste.",
      "Proteção a fogo e distância segura importam mais que perseguir XP antiga.",
      "Não use a hunt para financiar seus upgrades.",
    ],
    ...COMMUNITY_HUNTS,
  },
  {
    id: "exotic-cave",
    name: "Exotic Cave",
    location: "Issavi/Pirats",
    minLevel: 150,
    focus: ["equilibrada", "farm"],
    xp: "Sem faixa pós-rebalance confiável",
    loot: "Potencial de saldo positivo; valide no analyzer",
    metricStatus: "sem-faixa-pos-rebalance",
    risk: "moderado",
    ammo: "Diamond Arrow com pulls pequenos; Spectral para isolar ameaça.",
    access: "Requer a linha de acesso dos Pirats/Exotic Cave.",
    creatures: ["Exotic Bat", "Exotic Cave Spider"],
    tips: [
      "Boa sala de aula para Diamond Arrow.",
      "Não copie o tamanho de pull de um personagem com skills maiores.",
      "Os números antigos foram omitidos após o rebalance de 2026.",
    ],
    ...COMMUNITY_HUNTS,
  },
  {
    id: "glooth-bandits",
    name: "Glooth Bandits",
    location: "Oramond",
    minLevel: 200,
    focus: ["farm", "equilibrada"],
    xp: "Sem faixa pós-rebalance confiável",
    loot: "Potencial de farm; depende do Market e da rota",
    metricStatus: "sem-faixa-pos-rebalance",
    risk: "moderado",
    ammo: "Diamond Arrow; teste Firestorm contra o pack antes de estocar.",
    access: "Requer pontos e acesso de Oramond.",
    creatures: ["Glooth Bandit", "Glooth Brigand"],
    tips: [
      "Acesso é parte da progressão: planeje os pontos cedo.",
      "Use walls e corredores para organizar o pull.",
      "Os números antigos foram omitidos após o rebalance de 2026.",
    ],
    ...COMMUNITY_HUNTS,
  },
  {
    id: "werehyaenas",
    name: "Werehyaenas",
    location: "Darashia, Grimvale",
    minLevel: 200,
    focus: ["equilibrada", "farm"],
    xp: "Sem faixa pós-rebalance confiável",
    loot: "Potencial de lucro; valide norte/sul separadamente",
    metricStatus: "sem-faixa-pos-rebalance",
    risk: "alto",
    ammo: "Diamond Arrow; proteção a death e físico conforme o piso.",
    access: "Linha de acesso de Grimvale; a ala sul é mais exigente.",
    creatures: ["Werehyaena", "Werehyaena Shaman"],
    tips: [
      "Comece no norte e só desça quando o combo estiver previsível.",
      "Priorize shamans quando a posição permitir.",
      "Os números antigos foram omitidos após o rebalance de 2026.",
    ],
    ...COMMUNITY_HUNTS,
  },
  {
    id: "medusa-tower",
    name: "Medusa Tower",
    location: "Tiquanda",
    minLevel: 250,
    focus: ["equilibrada"],
    xp: "Sem faixa pós-rebalance confiável",
    loot: "Sem faixa pós-rebalance confiável",
    metricStatus: "sem-faixa-pos-rebalance",
    risk: "alto",
    ammo: "Diamond Arrow; escolha proteção conforme o piso.",
    access: "Confirme acesso e rota vertical; cada andar muda o pull.",
    creatures: ["Medusa", "Serpent Spawn", "Behemoth"],
    tips: [
      "Nunca suba para um piso desconhecido com um pull vivo.",
      "Marque uma hotkey de energy ring se fizer parte do seu plano defensivo.",
      "Os números antigos foram omitidos após o rebalance de 2026.",
    ],
    ...COMMUNITY_HUNTS,
  },
  {
    id: "asura-palace",
    name: "Asura Palace",
    location: "Ankrahmun",
    minLevel: 300,
    focus: ["leveling", "equilibrada"],
    xp: "Sem faixa pós-rebalance confiável",
    loot: "Sem faixa pós-rebalance confiável",
    metricStatus: "sem-faixa-pos-rebalance",
    risk: "alto",
    ammo: "Diamond Arrow; proteção a death, fire e ice conforme a rota.",
    access: "Acesso ao palácio; Mirror é uma etapa posterior, não o ponto de entrada.",
    creatures: ["Dawnfire Asura", "Midnight Asura", "Frost Flower Asura"],
    tips: [
      "Aprenda o Palace antes de considerar Mirror.",
      "Quebre o pull cedo se perder o controle da posição.",
      "Os números antigos foram omitidos após o rebalance de 2026.",
    ],
    ...COMMUNITY_HUNTS,
  },
  {
    id: "werelions",
    name: "Werelions -1",
    location: "Bounac",
    minLevel: 300,
    focus: ["farm", "equilibrada"],
    xp: "Sem faixa pós-rebalance confiável",
    loot: "Potencial de farm; preço dos drops é decisivo",
    metricStatus: "sem-faixa-pos-rebalance",
    risk: "alto",
    ammo: "Diamond Arrow e dano sagrado; ajuste proteção por piso.",
    access: "Requer questline de Bounac.",
    creatures: ["Werelion", "Werelioness"],
    tips: [
      "Teste o -1 em volta curta antes da rota completa.",
      "Observe o dano recebido durante o box, não apenas a cura média.",
      "Os números antigos foram omitidos após o rebalance de 2026.",
    ],
    ...COMMUNITY_HUNTS,
  },
  {
    id: "oramond-catacombs",
    name: "Oramond Catacombs",
    location: "Oramond",
    minLevel: 400,
    focus: ["leveling", "farm"],
    xp: "Sem faixa pós-rebalance confiável",
    loot: "Sem faixa pós-rebalance confiável",
    metricStatus: "sem-faixa-pos-rebalance",
    risk: "muito alto",
    ammo: "Diamond Arrow e swaps elementais por composição do respawn.",
    access: "Acesso avançado de Oramond e configuração correta do respawn.",
    creatures: ["Destroyer", "Hellspawn", "Grim Reaper", "Dark Torturer"],
    tips: [
      "A composição muda; confira o voto/configuração do mundo.",
      "Leve proteção para o dano dominante da configuração atual.",
      "Os números antigos foram omitidos após o rebalance de 2026.",
    ],
    ...COMMUNITY_HUNTS,
  },
  {
    id: "roshamuul-west",
    name: "Roshamuul West",
    location: "Roshamuul",
    minLevel: 450,
    focus: ["leveling", "farm"],
    xp: "Sem faixa pós-rebalance confiável",
    loot: "Sem faixa pós-rebalance confiável",
    metricStatus: "sem-faixa-pos-rebalance",
    risk: "muito alto",
    ammo: "Diamond Arrow; proteção física/death e set testado.",
    access: "Acesso a Roshamuul; estado do world change afeta a área.",
    creatures: ["Frazzlemaw", "Guzzlemaw", "Silencer"],
    tips: [
      "Silencers alteram sua capacidade ofensiva; não julgue a rota por um único pull.",
      "Mantenha espaço para quebrar o box.",
      "Os números antigos foram omitidos após o rebalance de 2026.",
    ],
    ...COMMUNITY_HUNTS,
  },
  {
    id: "summer-winter-courts",
    name: "Summer/Winter Courts",
    location: "Feyrist",
    minLevel: 500,
    focus: ["leveling", "farm"],
    xp: "Sem faixa pós-rebalance confiável",
    loot: "Sem faixa pós-rebalance confiável",
    metricStatus: "sem-faixa-pos-rebalance",
    risk: "muito alto",
    ammo: "Diamond Arrow; armor e amulet específicos para fire ou ice.",
    access: "Requer acesso de The Dream Courts.",
    creatures: ["Crazed Summer Vanguard", "Crazed Winter Vanguard", "Thanatursus"],
    tips: [
      "Não use o mesmo set nos dois courts.",
      "Faça uma volta curta para medir o pico de dano.",
      "Os números antigos foram omitidos após o rebalance de 2026.",
    ],
    ...COMMUNITY_HUNTS,
  },
  {
    id: "girtablilu",
    name: "Girtablilu",
    location: "Ruins of Nuur, Kilmaresh",
    minLevel: 500,
    focus: ["leveling", "farm"],
    xp: "~4,4 kk XP/h em teste comunitário",
    loot: "~1,5 kk gp/h em teste comunitário",
    metricStatus: "teste-comunitario",
    risk: "muito alto",
    ammo: "Diamond Arrow; compare Thunderstorm e aproveite Divine Barrage onde a fraqueza favorecer.",
    access: "Requer acesso às Ruins of Nuur em Kilmaresh.",
    creatures: ["Girtablilu Warrior", "Venerable Girtablilu"],
    tips: [
      "Única faixa alta exibida porque foi reportada como teste pós-rebalance.",
      "Valores crus, variáveis e não normalizados: skills, charms, prey, stamina e rota mudam tudo.",
      "Holy e energy merecem teste; confirme o resultado no analyzer do seu personagem.",
    ],
    sourceUrl: "https://www.tibiabuddy.com/blog/paladin-hunting-guide-2026",
    sourceName: "TibiaBuddy — teste comunitário de Girtablilu",
    verifiedAt: LAST_VERIFIED,
    patch: "Teste comunitário variável após o rebalance de 2026",
    confidence: "baixa",
  },
] as const;

export const ITEMS: readonly Item[] = [
  {
    id: "elvish-bow",
    name: "Elvish Bow",
    slot: "weapon",
    minLevel: 8,
    attack: 0,
    hit: 5,
    imbueSlots: 3,
    tierClass: 1,
    useCase: ["começo econômico", "três imbuements", "single target"],
    icon: "🏹",
    summary:
      "O ataque vem da munição; hit +5 e três slots tornam o arco útil por muito mais tempo que o preço sugere.",
    stage: "progressão",
    ...WIKI_DISTANCE,
  },
  {
    id: "royal-spear",
    name: "Royal Spear",
    slot: "weapon",
    minLevel: 25,
    attack: 35,
    useCase: ["baixo custo", "hunt individual", "início"],
    icon: "➶",
    summary: "Arma de arremesso simples para atravessar os primeiros levels com pouco investimento.",
    stage: "progressão",
    ...COMMUNITY_EQUIPMENT,
  },
  {
    id: "enchanted-spear",
    name: "Enchanted Spear",
    slot: "weapon",
    minLevel: 42,
    attack: 38,
    useCase: ["single target", "baixo orçamento", "transição"],
    icon: "✧",
    summary: "Passo direto sobre Royal Spear para quem ainda não quer financiar bow e munição.",
    stage: "progressão",
    ...COMMUNITY_EQUIPMENT,
  },
  {
    id: "composite-hornbow",
    name: "Composite Hornbow",
    slot: "weapon",
    minLevel: 50,
    attack: 2,
    hit: 2,
    imbueSlots: 3,
    tierClass: 2,
    useCase: ["área inicial", "três imbuements", "orçamento"],
    icon: "🏹",
    summary: "Plataforma de três slots para a fase de Shatterstorm e Caldera.",
    stage: "progressão",
    ...WIKI_DISTANCE,
  },
  {
    id: "rift-bow",
    name: "Rift Bow",
    slot: "weapon",
    minLevel: 120,
    attack: 5,
    hit: 3,
    imbueSlots: 3,
    tierClass: 2,
    useCase: ["transição ao 150", "três imbuements", "custo-benefício"],
    icon: "🏹",
    summary: "Upgrade prático antes de Diamond Arrow, especialmente quando já vem imbuído no Market.",
    stage: "progressão",
    ...WIKI_DISTANCE,
  },
  {
    id: "jungle-bow",
    name: "Jungle Bow",
    slot: "weapon",
    minLevel: 150,
    attack: 6,
    hit: 5,
    distance: 1,
    protection: ["físico +3%"],
    imbueSlots: 2,
    tierClass: 4,
    useCase: ["físico", "entrada no level 150", "dois slots"],
    icon: "🏹",
    summary:
      "Alternativa moderna de 150 com atributos altos, trocando o terceiro slot por proteção física.",
    stage: "especialista",
    ...WIKI_DISTANCE,
  },
  {
    id: "bow-of-destruction",
    name: "Bow of Destruction",
    slot: "weapon",
    minLevel: 200,
    attack: 5,
    hit: 5,
    imbueSlots: 3,
    tierClass: 2,
    useCase: ["três imbuements", "progressão 200", "custo-benefício"],
    icon: "🏹",
    summary:
      "Referência acessível de três slots; compare com Jungle/Rift já imbuídos antes de trocar.",
    stage: "progressão",
    ...WIKI_DISTANCE,
  },
  {
    id: "living-vine-bow",
    name: "Living Vine Bow",
    slot: "weapon",
    minLevel: 220,
    attack: 5,
    hit: 5,
    distance: 1,
    protection: ["terra +4%"],
    imbueSlots: 3,
    tierClass: 3,
    useCase: ["proteção a terra", "três imbuements", "progressão"],
    icon: "🏹",
    summary: "Mantém três slots e adiciona distance/proteção a terra; upgrade contextual.",
    stage: "especialista",
    ...WIKI_DISTANCE,
  },
  {
    id: "bow-of-cataclysm",
    name: "Bow of Cataclysm",
    slot: "weapon",
    minLevel: 250,
    attack: 6,
    hit: 4,
    distance: 1,
    protection: ["death +4%"],
    imbueSlots: 3,
    tierClass: 3,
    useCase: ["proteção a death", "três imbuements", "área física"],
    icon: "🏹",
    summary: "Arco de progressão com defesa a death; não é automaticamente melhor fora desse contexto.",
    stage: "especialista",
    ...WIKI_DISTANCE,
  },
  {
    id: "lion-longbow",
    name: "Lion Longbow",
    slot: "weapon",
    minLevel: 270,
    attack: 6,
    hit: 6,
    distance: 1,
    protection: ["gelo +5%"],
    imbueSlots: 3,
    tierClass: 4,
    useCase: ["proteção a gelo", "três imbuements", "alta precisão"],
    icon: "🏹",
    summary: "Ótima precisão e proteção a gelo para uma faixa em que o set começa a se especializar.",
    stage: "especialista",
    ...WIKI_DISTANCE,
  },
  {
    id: "falcon-bow",
    name: "Falcon Bow",
    slot: "weapon",
    minLevel: 300,
    attack: 6,
    hit: 5,
    distance: 2,
    protection: ["fogo +5%"],
    imbueSlots: 3,
    tierClass: 4,
    useCase: ["proteção a fogo", "área física", "três imbuements"],
    icon: "🏹",
    summary: "Arco durável de level 300; dano consistente e proteção a fogo.",
    stage: "especialista",
    ...WIKI_DISTANCE,
  },
  {
    id: "soulbleeder",
    name: "Soulbleeder",
    slot: "weapon",
    minLevel: 400,
    attack: 8,
    hit: 5,
    distance: 3,
    protection: ["holy +7%"],
    imbueSlots: 3,
    tierClass: 4,
    useCase: ["dano físico", "proteção holy", "endgame"],
    icon: "🏹",
    summary:
      "Grande salto ofensivo no 400. Seu valor real depende da proficiência e do preço frente aos swaps.",
    stage: "bis-contextual",
    ...WIKI_DISTANCE,
  },
  {
    id: "sanguine-bow",
    name: "Sanguine Bow",
    slot: "weapon",
    minLevel: 600,
    attack: 9,
    hit: 6,
    distance: 3,
    protection: ["terra +6%"],
    imbueSlots: 3,
    tierClass: 4,
    useCase: ["dano alto", "proteção a terra", "proficiência"],
    icon: "🏹",
    summary:
      "Arco de alto investimento com árvore própria; compare Sanguine e Grand Sanguine pelo conjunto de perks.",
    stage: "bis-contextual",
    sourceUrl: "https://www.tibiawiki.com.br/wiki/Sanguine_Bow",
    sourceName: "Tibia Wiki BR — Sanguine Bow",
    verifiedAt: LAST_VERIFIED,
    patch: "Estado ao vivo em 28/07/2026",
    confidence: "média",
  },
  {
    id: "moonsilver-bow",
    name: "Moonsilver Bow",
    slot: "weapon",
    minLevel: 1000,
    attack: 10,
    hit: 7,
    distance: 5,
    protection: ["fogo +7%"],
    imbueSlots: 3,
    tierClass: 4,
    useCase: ["maior dano bruto", "proteção a fogo", "proficiência customizável"],
    icon: "🏹",
    summary:
      "Referência ofensiva do Summer 2026. A versão Stellar permite customização; confirme perks no cliente.",
    stage: "bis-contextual",
    sourceUrl: "https://www.tibiawiki.com.br/wiki/Moonsilver_Bow",
    sourceName: "Tibia Wiki BR — Moonsilver Bow",
    verifiedAt: LAST_VERIFIED,
    patch: "Summer Update, 13/07/2026",
    confidence: "média",
  },
  {
    id: "arrow",
    name: "Arrow",
    slot: "ammo",
    minLevel: 0,
    attack: 25,
    useCase: ["primeiros levels", "baixo custo", "bows"],
    icon: "➤",
    summary:
      "Munição básica para começar com bows sem inventar o dano de uma arrow de level alto.",
    stage: "progressão",
    ...WIKI_DISTANCE,
  },
  {
    id: "onyx-arrow",
    name: "Onyx Arrow",
    slot: "ammo",
    minLevel: 40,
    attack: 38,
    useCase: ["single target", "baixo level"],
    icon: "➤",
    summary: "Munição física simples para hunts de um alvo.",
    stage: "progressão",
    ...WIKI_DISTANCE,
  },
  {
    id: "shatterstorm-arrow",
    name: "Shatterstorm Arrow",
    slot: "ammo",
    minLevel: 50,
    attack: 27,
    useCase: ["área física", "13 quadrados", "treino de pull"],
    icon: "✣",
    summary: "Primeira munição física de área relevante no caminho do Royal Paladin de 2026.",
    stage: "progressão",
    ...OFFICIAL_VOCATION_2026,
  },
  {
    id: "crystalline-arrow",
    name: "Crystalline Arrow",
    slot: "ammo",
    minLevel: 90,
    attack: 65,
    useCase: ["single target", "pré-150"],
    icon: "➤",
    summary: "Munição física forte de alvo único antes e depois do 150.",
    stage: "progressão",
    ...WIKI_DISTANCE,
  },
  {
    id: "firestorm-arrow",
    name: "Firestorm Arrow",
    slot: "ammo",
    minLevel: 125,
    attack: 21,
    useCase: ["área de fogo", "13 quadrados", "fraqueza elemental"],
    icon: "♨",
    summary: "Área de fogo; teste se a vulnerabilidade compensa o ataque menor.",
    stage: "especialista",
    ...OFFICIAL_VOCATION_2026,
  },
  {
    id: "terrastorm-arrow",
    name: "Terrastorm Arrow",
    slot: "ammo",
    minLevel: 125,
    attack: 21,
    useCase: ["área de terra", "13 quadrados", "fraqueza elemental"],
    icon: "♣",
    summary: "Área de terra para criaturas vulneráveis; valide no analyzer.",
    stage: "especialista",
    ...OFFICIAL_VOCATION_2026,
  },
  {
    id: "froststorm-arrow",
    name: "Froststorm Arrow",
    slot: "ammo",
    minLevel: 125,
    attack: 21,
    useCase: ["área de gelo", "13 quadrados", "fraqueza elemental"],
    icon: "❄",
    summary: "Área de gelo, especialmente útil quando o respawn pune físico/fogo.",
    stage: "especialista",
    ...OFFICIAL_VOCATION_2026,
  },
  {
    id: "thunderstorm-arrow",
    name: "Thunderstorm Arrow",
    slot: "ammo",
    minLevel: 125,
    attack: 21,
    useCase: ["área de energia", "13 quadrados", "fraqueza elemental"],
    icon: "ϟ",
    summary: "Área de energia; opção para testes em criaturas como Girtablilu.",
    stage: "especialista",
    ...OFFICIAL_VOCATION_2026,
  },
  {
    id: "diamond-arrow",
    name: "Diamond Arrow",
    slot: "ammo",
    minLevel: 150,
    attack: 37,
    useCase: ["área física", "21 quadrados", "rotação principal"],
    icon: "◆",
    summary:
      "Pilar da área física do RP. Não recebe conversão elemental de imbuement e exige controle de pull.",
    stage: "bis-contextual",
    ...WIKI_DISTANCE,
  },
  {
    id: "spectral-bolt",
    name: "Spectral Bolt",
    slot: "ammo",
    minLevel: 150,
    attack: 78,
    useCase: ["single target", "boss", "alta precisão"],
    icon: "➸",
    summary: "Escolha de alvo único no 150; não substitui Diamond em packs.",
    stage: "bis-contextual",
    ...WIKI_DISTANCE,
  },
  {
    id: "zaoan-helmet",
    name: "Zaoan Helmet",
    slot: "head",
    minLevel: 0,
    armor: 9,
    protection: ["físico +5%"],
    imbueSlots: 1,
    tierClass: 2,
    useCase: ["proteção física", "orçamento", "início"],
    icon: "⛑",
    summary: "Capacete barato e resistente; o único slot costuma receber Void.",
    stage: "progressão",
    ...COMMUNITY_EQUIPMENT,
  },
  {
    id: "dark-whispers",
    name: "Dark Whispers",
    slot: "head",
    minLevel: 180,
    useCase: ["dois imbuements", "dano", "proteção a death"],
    icon: "♜",
    summary:
      "Opção flexível antes de Falcon; confirme a versão/atributos no Market porque variantes e preços mudam.",
    stage: "especialista",
    ...COMMUNITY_EQUIPMENT,
  },
  {
    id: "falcon-coif",
    name: "Falcon Coif",
    slot: "head",
    minLevel: 300,
    armor: 10,
    distance: 2,
    protection: ["físico +3%", "fogo +10%"],
    imbueSlots: 2,
    tierClass: 4,
    useCase: ["proteção a fogo", "distance", "dois imbuements"],
    icon: "♜",
    summary: "Capacete ofensivo/defensivo forte em fogo; não cobre todos os elementos.",
    stage: "bis-contextual",
    sourceUrl: "https://www.tibiawiki.com.br/wiki/Falcon_Coif",
    sourceName: "Tibia Wiki BR — Falcon Coif",
    verifiedAt: LAST_VERIFIED,
    patch: "Estado ao vivo em 28/07/2026",
    confidence: "média",
  },
  {
    id: "alicorn-headguard",
    name: "Alicorn Headguard",
    slot: "head",
    minLevel: 400,
    armor: 11,
    distance: 3,
    protection: [
      "físico +5%",
      "fogo +5%",
      "terra +5%",
      "energia +5%",
      "gelo +5%",
      "holy +5%",
      "death +5%",
    ],
    imbueSlots: 2,
    tierClass: 4,
    useCase: ["proteção geral", "distance", "dois imbuements"],
    icon: "♞",
    summary: "Referência versátil de level 400 quando nenhum único elemento domina.",
    stage: "bis-contextual",
    sourceUrl: "https://www.tibiawiki.com.br/wiki/Alicorn_Headguard",
    sourceName: "Tibia Wiki BR — Alicorn Headguard",
    verifiedAt: LAST_VERIFIED,
    patch: "Estado ao vivo em 28/07/2026",
    confidence: "média",
  },
  {
    id: "moonsilver-trail-hood",
    name: "Moonsilver Trail Hood",
    slot: "head",
    minLevel: 800,
    armor: 12,
    distance: 4,
    magic: 2,
    protection: ["físico +6%", "terra +10%"],
    imbueSlots: 2,
    tierClass: 4,
    useCase: ["proteção a terra", "holy magic", "Divine Barrage"],
    icon: "♛",
    summary:
      "O holy magic level +2 e o augment de +8% critical extra da Divine Barrage tornam o item ofensivo e defensivo.",
    stage: "bis-contextual",
    sourceUrl: "https://www.tibiawiki.com.br/wiki/Moonsilver_Trail_Hood",
    sourceName: "Tibia Wiki BR — Moonsilver Trail Hood",
    verifiedAt: LAST_VERIFIED,
    patch: "Summer Update, 13/07/2026",
    confidence: "média",
  },
  {
    id: "paladin-armor",
    name: "Paladin Armor",
    slot: "armor",
    minLevel: 0,
    armor: 12,
    distance: 2,
    imbueSlots: 1,
    tierClass: 2,
    useCase: ["início", "distance", "Vampirism"],
    icon: "▣",
    summary: "Upgrade inicial clássico; use o slot para Vampirism quando o orçamento permitir.",
    stage: "progressão",
    ...COMMUNITY_EQUIPMENT,
  },
  {
    id: "gnome-armor",
    name: "Gnome Armor",
    slot: "armor",
    minLevel: 200,
    armor: 17,
    distance: 3,
    protection: ["físico +4%", "energia +8%", "gelo -2%"],
    imbueSlots: 2,
    tierClass: 3,
    useCase: ["proteção a energia", "distance", "dois imbuements"],
    icon: "▣",
    summary:
      "Excelente contra energia, mas a penalidade de gelo impede tratá-la como upgrade universal.",
    stage: "bis-contextual",
    sourceUrl: "https://www.tibiawiki.com.br/wiki/Gnome_Armor",
    sourceName: "Tibia Wiki BR — Gnome Armor",
    verifiedAt: LAST_VERIFIED,
    patch: "Estado ao vivo em 28/07/2026",
    confidence: "média",
  },
  {
    id: "ghost-chestplate",
    name: "Ghost Chestplate",
    slot: "armor",
    minLevel: 230,
    armor: 17,
    distance: 2,
    protection: ["físico +3%"],
    imbueSlots: 2,
    tierClass: 3,
    useCase: ["proteção física", "dois imbuements", "flexibilidade"],
    icon: "▣",
    summary: "Boa base de dois slots para manter versões com proteções elementais diferentes.",
    stage: "especialista",
    sourceUrl: "https://www.tibiawiki.com.br/wiki/Ghost_Chestplate",
    sourceName: "Tibia Wiki BR — Ghost Chestplate",
    verifiedAt: LAST_VERIFIED,
    patch: "Estado ao vivo em 28/07/2026",
    confidence: "média",
  },
  {
    id: "soulshell",
    name: "Soulshell",
    slot: "armor",
    minLevel: 400,
    useCase: ["endgame", "proteção elemental", "distance"],
    icon: "◈",
    summary:
      "Armadura Soul de alto investimento. Compare sua proteção com Ghost/Gnome específicas antes de consolidar o set.",
    stage: "bis-contextual",
    ...COMMUNITY_EQUIPMENT,
  },
  {
    id: "dwarven-legs",
    name: "Dwarven Legs",
    slot: "legs",
    minLevel: 0,
    protection: ["físico +3%"],
    useCase: ["início", "proteção física", "baixo orçamento"],
    icon: "Ⅱ",
    summary: "Proteção física acessível para o início, mesmo sem bônus ofensivo.",
    stage: "progressão",
    ...COMMUNITY_EQUIPMENT,
  },
  {
    id: "prismatic-legs",
    name: "Prismatic Legs",
    slot: "legs",
    minLevel: 150,
    distance: 2,
    protection: ["físico +3%"],
    useCase: ["progressão", "distance", "proteção física"],
    icon: "Ⅱ",
    summary: "Passo equilibrado no 150; combina dano e defesa sem custo de endgame.",
    stage: "progressão",
    ...COMMUNITY_EQUIPMENT,
  },
  {
    id: "falcon-greaves",
    name: "Falcon Greaves",
    slot: "legs",
    minLevel: 300,
    armor: 10,
    distance: 3,
    protection: ["físico +7%", "gelo +7%"],
    tierClass: 4,
    useCase: ["proteção física", "proteção a gelo", "distance"],
    icon: "Ⅱ",
    summary: "Referência muito forte para físico e gelo; ainda pode perder para um swap de outro elemento.",
    stage: "bis-contextual",
    sourceUrl: "https://www.tibiawiki.com.br/wiki/Falcon_Greaves",
    sourceName: "Tibia Wiki BR — Falcon Greaves",
    verifiedAt: LAST_VERIFIED,
    patch: "Estado ao vivo em 28/07/2026",
    confidence: "média",
  },
  {
    id: "guardian-boots",
    name: "Guardian Boots",
    slot: "boots",
    minLevel: 70,
    protection: ["físico +2%"],
    useCase: ["início", "proteção física", "baixo orçamento"],
    icon: "♢",
    summary: "Botas simples para reduzir físico antes de opções ofensivas.",
    stage: "progressão",
    ...COMMUNITY_EQUIPMENT,
  },
  {
    id: "winged-boots",
    name: "Winged Boots",
    slot: "boots",
    minLevel: 200,
    distance: 1,
    useCase: ["mobilidade", "distance", "kite"],
    icon: "♢",
    summary: "Opção de mobilidade/dano; compare com proteção física em hunts de box.",
    stage: "especialista",
    ...COMMUNITY_EQUIPMENT,
  },
  {
    id: "soulstalkers",
    name: "Pair of Soulstalkers",
    slot: "boots",
    minLevel: 400,
    armor: 3,
    distance: 1,
    protection: ["físico +5%", "speed +20"],
    imbueSlots: 1,
    tierClass: 4,
    useCase: ["proteção física", "mobilidade", "distance"],
    icon: "♢",
    summary: "Combina físico, velocidade e distance; referência geral de botas no 400.",
    stage: "bis-contextual",
    sourceUrl: "https://www.tibiawiki.com.br/wiki/Pair_of_Soulstalkers",
    sourceName: "Tibia Wiki BR — Pair of Soulstalkers",
    verifiedAt: LAST_VERIFIED,
    patch: "Estado ao vivo em 28/07/2026",
    confidence: "média",
  },
  {
    id: "sleep-shawl",
    name: "Enchanted Sleep Shawl",
    slot: "amulet",
    minLevel: 180,
    armor: 3,
    distance: 3,
    protection: ["terra +24%", "físico +7%"],
    useCase: ["proteção a terra", "físico", "duração 60 min"],
    icon: "◉",
    summary: "Swap muito forte contra terra; é temporário e precisa ser recarregado/substituído.",
    stage: "bis-contextual",
    sourceUrl: "https://www.tibiawiki.com.br/wiki/Encantamento",
    sourceName: "Tibia Wiki BR — Itens encantados",
    verifiedAt: LAST_VERIFIED,
    patch: "Estado ao vivo em 28/07/2026",
    confidence: "média",
  },
  {
    id: "pendulet",
    name: "Enchanted Pendulet",
    slot: "amulet",
    minLevel: 180,
    armor: 2,
    distance: 3,
    protection: ["energia +18%", "físico +5%"],
    useCase: ["proteção a energia", "físico", "duração 120 min"],
    icon: "◉",
    summary: "Swap de energia que preserva distance; não use como padrão contra outro elemento.",
    stage: "bis-contextual",
    sourceUrl: "https://www.tibiawiki.com.br/wiki/Encantamento",
    sourceName: "Tibia Wiki BR — Itens encantados",
    verifiedAt: LAST_VERIFIED,
    patch: "Estado ao vivo em 28/07/2026",
    confidence: "média",
  },
  {
    id: "flamingo-precision",
    name: "Enchanted Flamingo Amulet of Precision",
    slot: "amulet",
    minLevel: 270,
    armor: 4,
    distance: 4,
    magic: 1,
    protection: ["físico +5%", "fogo +14%"],
    useCase: ["proteção a fogo", "holy magic", "duração 180 min"],
    icon: "◉",
    summary:
      "Novo swap de 2026 para fogo, com distance +4 e holy magic level +1; confirme custo de reposição.",
    stage: "bis-contextual",
    sourceUrl: "https://www.tibiawiki.com.br/wiki/Encantamento",
    sourceName: "Tibia Wiki BR — Enchanted Flamingo Amulet of Precision",
    verifiedAt: LAST_VERIFIED,
    patch: "Summer Update, 13/07/2026",
    confidence: "média",
  },
  {
    id: "blue-plasma-ring",
    name: "Ring of Blue Plasma",
    slot: "ring",
    minLevel: 150,
    distance: 3,
    useCase: ["dano", "janela curta", "boss"],
    icon: "◌",
    summary: "Bônus temporário de distance; reserve para quando o ganho pagar o consumo.",
    stage: "especialista",
    ...COMMUNITY_EQUIPMENT,
  },
  {
    id: "quiver",
    name: "Quiver",
    slot: "quiver",
    minLevel: 0,
    useCase: ["armazenar arrows/bolts", "organização"],
    icon: "⌁",
    summary:
      "Mantenha a munição correta carregada e uma alternativa no inventário; quiver não decide BIS sozinho.",
    stage: "progressão",
    ...COMMUNITY_EQUIPMENT,
  },
] as const;

export const BIS_CONTEXTS: readonly BisContext[] = [
  {
    id: "bis-budget-200",
    label: "Kit eficiente no 200",
    minLevel: 200,
    goal: "Manter três imbuements e proteção útil antes de upgrades caros.",
    slots: {
      weapon: ["bow-of-destruction", "jungle-bow"],
      ammo: ["diamond-arrow", "spectral-bolt"],
      head: ["dark-whispers", "zaoan-helmet"],
      armor: ["gnome-armor", "paladin-armor"],
      legs: ["prismatic-legs"],
      boots: ["winged-boots", "guardian-boots"],
      amulet: ["sleep-shawl", "pendulet"],
    },
    tradeoff:
      "Jungle Bow ganha atributos/proteção física, mas Bow of Destruction mantém três slots. Escolha pelo imbuement e pelo preço real.",
    ...COMMUNITY_EQUIPMENT,
  },
  {
    id: "bis-fire",
    label: "Conteúdo com fogo",
    minLevel: 300,
    goal: "Somar proteção a fogo sem abandonar a rotação.",
    slots: {
      weapon: ["falcon-bow", "moonsilver-bow"],
      head: ["falcon-coif", "alicorn-headguard"],
      amulet: ["flamingo-precision"],
      legs: ["falcon-greaves"],
      boots: ["soulstalkers"],
    },
    tradeoff:
      "Moonsilver exige level 1000; Falcon é acessível no 300. Proteção além de 100% efetivo e curvas de mitigação devem ser conferidas no cliente.",
    ...WIKI_PALADIN_SET,
  },
  {
    id: "bis-earth",
    label: "Conteúdo com terra",
    minLevel: 180,
    goal: "Reduzir terra com swaps que ainda oferecem distance.",
    slots: {
      weapon: ["living-vine-bow", "sanguine-bow"],
      head: ["moonsilver-trail-hood", "alicorn-headguard"],
      amulet: ["sleep-shawl"],
      legs: ["falcon-greaves"],
      boots: ["soulstalkers"],
    },
    tradeoff:
      "Trail Hood exige 800 e Sleep Shawl é temporária. Antes disso, Living Vine/Alicorn podem ser escolhas mais realistas.",
    ...WIKI_DISTANCE,
  },
  {
    id: "bis-energy",
    label: "Conteúdo com energia",
    minLevel: 180,
    goal: "Empilhar energia com atenção à penalidade de gelo.",
    slots: {
      armor: ["gnome-armor", "ghost-chestplate"],
      amulet: ["pendulet"],
      head: ["alicorn-headguard"],
      legs: ["falcon-greaves"],
    },
    tradeoff:
      "Gnome Armor tem penalidade a gelo. Em respawn misto, Ghost Chestplate com imbuement específico pode ser mais segura.",
    sourceUrl: "https://www.tibiawiki.com.br/wiki/Gnome_Armor",
    sourceName: "Tibia Wiki BR — Gnome Armor",
    verifiedAt: LAST_VERIFIED,
    patch: "Estado ao vivo em 28/07/2026",
    confidence: "média",
  },
  {
    id: "bis-general-400",
    label: "Geral no 400+",
    minLevel: 400,
    goal: "Um ponto de partida versátil para depois aplicar swaps.",
    slots: {
      weapon: ["soulbleeder"],
      ammo: ["diamond-arrow", "spectral-bolt"],
      head: ["alicorn-headguard"],
      armor: ["ghost-chestplate", "gnome-armor", "soulshell"],
      legs: ["falcon-greaves"],
      boots: ["soulstalkers"],
      amulet: ["sleep-shawl", "pendulet", "flamingo-precision"],
      ring: ["blue-plasma-ring"],
    },
    tradeoff:
      "Não existe armor ou amulet universal: selecione pelo dano dominante, tempo de duração e custo da hunt.",
    ...COMMUNITY_EQUIPMENT,
  },
  {
    id: "bis-raw-1000",
    label: "Dano bruto no 1000+",
    minLevel: 1000,
    goal: "Usar a referência do Summer 2026 sem ignorar proficiência e encontro.",
    slots: {
      weapon: ["moonsilver-bow"],
      ammo: ["diamond-arrow", "spectral-bolt"],
      head: ["moonsilver-trail-hood", "alicorn-headguard"],
      legs: ["falcon-greaves"],
      boots: ["soulstalkers"],
      amulet: ["flamingo-precision", "sleep-shawl", "pendulet"],
    },
    tradeoff:
      "Moonsilver/Stellar é a referência de poder, mas a melhor árvore e o melhor set mudam com boss, função no time e proteção necessária.",
    ...OFFICIAL_SUMMER_2026,
  },
] as const;

export const GUIDES: readonly Guide[] = [
  {
    id: "primeira-hora-rp",
    category: "primeiros-passos",
    title: "Sua primeira hora como Paladin",
    eyebrow: "Comece sem pressa",
    summary:
      "Configure o personagem para que movimento, ataque, cura e saída de emergência sejam automáticos na sua mão.",
    estimatedTime: "10 min de preparação",
    steps: [
      {
        title: "Organize a tela",
        body:
          "Deixe battle list, barras de vida/mana, cooldowns e analyzer visíveis. Remova janelas que escondem o chão.",
      },
      {
        title: "Monte hotkeys",
        body:
          "Separe ataque, cura, potion de mana, cura de emergência, rope e troca de alvo. Use teclas alcançáveis sem tirar a mão do movimento.",
      },
      {
        title: "Aprenda a cadência",
        body:
          "O ataque básico é o metrônomo. Caminhe e use magia sem cancelar o próximo tiro.",
      },
      {
        title: "Treine offline",
        body:
          "Selecione distance fighting sempre que desconectar. Skill melhora a segurança e a eficiência de toda a progressão.",
      },
      {
        title: "Leia o analyzer",
        body:
          "Ao voltar, registre XP/h, gasto, loot e maior dano recebido. Uma volta curta vale mais que uma estimativa genérica.",
      },
    ],
    checklist: [
      "Rope e shovel",
      "Comida",
      "Munição reserva",
      "Potions de cura e mana",
      "Rota de saída marcada",
      "Capacidade livre para loot",
    ],
    warnings: [
      "Spells passaram a ser concedidas automaticamente e sem custo em 27/01/2026; guias que mandam comprá-las estão desatualizados.",
      "Não persiga XP/h enquanto ainda procura suas hotkeys.",
    ],
    relatedSourceIds: ["official-spells-free-2026", "official-spell-library"],
    sourceUrl: "https://www.tibia.com/news/?id=8675&subtopic=newsarchive",
    sourceName: "Tibia.com — Spells automatically granted",
    verifiedAt: LAST_VERIFIED,
    patch: "Patch de 27/01/2026",
    confidence: "alta",
  },
  {
    id: "promotion-stances",
    category: "combate",
    title: "Promoção e stances de Royal Paladin",
    eyebrow: "Level 20",
    summary:
      "A promoção deixou de ser apenas regeneração: em 2026 ela também define sua postura ofensiva ou defensiva.",
    estimatedTime: "5 min + viagem",
    steps: [
      {
        title: "Reserve 20.000 gp",
        body: "Com Premium Account e level 20, procure o NPC de promoção da sua cidade.",
      },
      {
        title: "Use Sharpshooter para dano",
        body: "A stance concede +32% ao distance fighting total após o ajuste de 07/07/2026.",
      },
      {
        title: "Use Divine Defiance para estabilidade",
        body:
          "Converte 6% do distance total em holy/healing magic level e concede 12% de dodge contra ataques não adjacentes.",
      },
      {
        title: "Troque por objetivo",
        body:
          "Sharpshooter favorece dano bruto. Divine Defiance pode reduzir risco e fortalecer dano/curas sagradas. Teste ambas na mesma rota.",
      },
    ],
    checklist: ["Level 20", "Premium Account", "20.000 gp", "Hotkey/controle da stance"],
    warnings: [
      "Os valores de release foram reduzidos em 07/07/2026; use 32%, 6% e 12%, não os valores antigos.",
      "Dodge se aplica a ataques não adjacentes conforme a descrição oficial.",
    ],
    relatedSourceIds: ["official-vocation-release", "official-vocation-final-tuning"],
    ...OFFICIAL_FINAL_TUNING_2026,
  },
  {
    id: "rotacao-area",
    category: "combate",
    title: "Rotação de área sem cancelar ataques",
    eyebrow: "O ritmo vale mais que o spam",
    summary:
      "Pense em uma janela de 4 segundos: dois ataques de munição e magias de área encaixadas entre eles.",
    estimatedTime: "15 min em uma hunt segura",
    steps: [
      {
        title: "Ataque primeiro",
        body:
          "Dispare Diamond/Shatterstorm/Storm Arrow. A munição é a âncora; não use magia cedo a ponto de atrasar o próximo ataque.",
      },
      {
        title: "Use a primeira área",
        body:
          "Divine Caldera tem base power 150 após 07/07/2026. Escolha quando o formato e a resistência compensarem.",
      },
      {
        title: "Dispare novamente",
        body:
          "Reposicione durante o intervalo e confirme que o alvo continua em uma célula que acerta o pack.",
      },
      {
        title: "Use a Barrage adequada",
        body:
          "Divine Barrage tem base power 130, 4 s e 175 mana; Ethereal Barrage tem power 40, 4 s e 135 mana. Escolha santo ou físico por contexto.",
      },
      {
        title: "Cure e resete",
        body:
          "A cura faz parte da rotação. Se a vida cai mais rápido que sua janela de recuperação, reduza o pull.",
      },
    ],
    checklist: [
      "Ataque básico não cancelado",
      "Alvo central no pack",
      "Mana para dois ciclos",
      "Espaço de saída",
      "Proteção correta",
    ],
    warnings: [
      "A fórmula exata de dano de magias não é pública; qualquer simulador deve exibir uma aproximação.",
      "Diamond Arrow não recebe conversão elemental de imbuement.",
    ],
    relatedSourceIds: ["official-vocation-release", "official-vocation-final-tuning"],
    ...OFFICIAL_FINAL_TUNING_2026,
  },
  {
    id: "imbuements",
    category: "imbuement",
    title: "Imbuements sem mistério",
    eyebrow: "20 horas por aplicação",
    summary:
      "Ative o shrine, use um item elegível fora do corpo, entregue materiais e pague a taxa. Desde 2025, o sucesso é 100%.",
    estimatedTime: "10 min depois de reunir materiais",
    steps: [
      {
        title: "Ative o Imbuing Shrine",
        body:
          "Entregue 5 Heavy Old Tomes a Albinius para liberar o uso. Em seguida, procure um shrine disponível.",
      },
      {
        title: "Retire o item do corpo",
        body:
          "Use o item no shrine, selecione um slot elegível e escolha a categoria. O mesmo tipo de imbuement não pode ser duplicado no item.",
      },
      {
        title: "Escolha a potência",
        body:
          "Basic custa 7.500 gp, Intricate 60.000 gp e Powerful 250.000 gp, além dos materiais. Cada aplicação dura 20 horas de uso.",
      },
      {
        title: "Powerful Vampirism",
        body: "Fornece 25% de life leech.",
        detail: [
          "25 Vampire Teeth",
          "15 Bloody Pincers",
          "5 Pieces of Dead Brain",
        ],
      },
      {
        title: "Powerful Void",
        body: "Fornece 8% de mana leech.",
        detail: [
          "25 Rope Belts",
          "25 Silencer Claws",
          "5 Some Grimeleech Wings",
        ],
      },
      {
        title: "Powerful Strike",
        body:
          "Com a base global atual, o resultado típico fica em 10% de chance e +50% de dano crítico extra antes de outras fontes.",
        detail: [
          "20 Protective Charms",
          "25 Sabreteeth",
          "5 Vexclaw Talons",
          "Strike soma +5 pontos percentuais de chance e +40 de dano crítico extra no Powerful.",
        ],
      },
      {
        title: "Distribua por item",
        body:
          "No RP iniciante, arma costuma receber Strike + Void + Vampirism conforme slots; armor recebe Vampirism e helmet recebe Void/proteção.",
      },
    ],
    checklist: [
      "Shrine ativado",
      "Item desequipado",
      "Slot elegível",
      "Materiais completos",
      "Taxa em gold",
      "Desbloqueio/scroll para Powerful",
    ],
    warnings: [
      "Powerful exige o desbloqueio de conteúdo/boss correspondente ou um imbuement scroll negociável.",
      "Conversão elemental não altera Diamond/Burst ou munição já elemental, mas o tempo do imbuement ainda é consumido.",
      "Preços dos materiais são do seu Market; compare custo por hora antes de aplicar.",
    ],
    relatedSourceIds: [
      "official-imbuement-costs",
      "official-strike-2025",
      "official-imbuement-scrolls",
      "wiki-imbuements",
    ],
    ...OFFICIAL_IMBUEMENT_COSTS,
  },
  {
    id: "forge",
    category: "forge",
    title: "Exaltation Forge: só depois do essencial",
    eyebrow: "Tier não é upgrade gratuito",
    summary:
      "Forge adiciona procs probabilísticos e pode consumir itens, gold, Dust e cores. Para um iniciante, gear, skills e imbuements vêm primeiro.",
    estimatedTime: "Leitura de 12 min antes de clicar",
    steps: [
      {
        title: "Confira a classificação",
        body:
          "Classe 1 chega ao Tier 1, Classe 2 ao Tier 2, Classe 3 ao Tier 3 e Classe 4 ao Tier 10.",
      },
      {
        title: "Entenda o efeito do slot",
        body:
          "Weapon recebe Onslaught (+60% de dano no proc), armor recebe Ruse (evita o ataque), helmet recebe Momentum (-2 s de cooldown), legs recebe Transcendence e boots recebe Amplification.",
      },
      {
        title: "Fusion",
        body:
          "Usa dois itens idênticos em nome e tier, sem imbuements, além de 100 Dust e gold. A base é 50%; um core leva a 65% e outro reduz o risco de perda.",
      },
      {
        title: "Transfer",
        body:
          "Move tier de um item fonte Tier 2+ para alvo Tier 0 da mesma classe. É garantido, consome a fonte e entrega tier do alvo um nível abaixo.",
      },
      {
        title: "Convergence",
        body:
          "Para itens Classe 4 do mesmo slot, permite combinar itens diferentes com resultado garantido e custo maior de recursos.",
      },
      {
        title: "Decida pelo retorno",
        body:
          "Onslaught começa em 0,50% no Tier 1. Antes de investir, compare o ganho esperado com uma arma melhor, imbuements e proficiência.",
      },
    ],
    checklist: [
      "Item e classe confirmados",
      "Imbuements removidos/expirados quando exigido",
      "Dust, cores e gold conferidos na interface",
      "Risco de falha entendido",
      "Backup financeiro mantido",
    ],
    warnings: [
      "Custos altos mudam com classe, tier e operação; a janela da Forge é a fonte final antes da confirmação.",
      "Falha pode reduzir tier ou destruir o segundo item em Tier 0, conforme recursos usados.",
      "Tier e Weapon Proficiency são sistemas separados.",
    ],
    relatedSourceIds: ["official-forge-faq", "wiki-forge", "official-convergence-fusion"],
    ...OFFICIAL_FORGE,
  },
  {
    id: "forge-proc-table",
    category: "forge",
    title: "Chances por Tier",
    eyebrow: "Probabilidade, não dano constante",
    summary:
      "Use as chances para comparar expectativa, mas não conte com um proc para sobreviver.",
    estimatedTime: "3 min",
    steps: [
      {
        title: "Onslaught — weapon",
        body: "Chance de +60% de dano por tier.",
        detail: ["T1–T10: 0,50 · 1,05 · 1,70 · 2,45 · 3,30 · 4,25 · 5,30 · 6,45 · 7,70 · 9,05%"],
      },
      {
        title: "Ruse — armor",
        body: "Chance de evitar completamente um ataque.",
        detail: ["T1–T10: 0,50 · 1,03 · 1,62 · 2,28 · 3,00 · 3,78 · 4,62 · 5,52 · 6,48 · 7,51%"],
      },
      {
        title: "Momentum — helmet",
        body: "Chance de reduzir cooldowns em 2 segundos.",
        detail: ["T1–T10: 2,00 · 4,05 · 6,20 · 8,45 · 10,80 · 13,25 · 15,80 · 18,45 · 21,20 · 24,05%"],
      },
      {
        title: "Transcendence — legs",
        body: "Chance de avatar Stage 3 por 7 s, com redução de dano e crítico.",
        detail: ["T1–T10: 0,13 · 0,27 · 0,44 · 0,64 · 0,86 · 1,11 · 1,38 · 1,68 · 2,00 · 2,35%"],
      },
      {
        title: "Amplification — boots",
        body: "Multiplica a chance dos outros efeitos da Forge.",
        detail: ["T1–T10: 2,5 · 5,4 · 9,1 · 13,6 · 18,9 · 25,0 · 31,9 · 39,6 · 48,1 · 57,4%"],
      },
    ],
    checklist: ["Chance lida como porcentagem", "Custo total calculado", "Efeito compatível com o slot"],
    warnings: [
      "A média de longo prazo não garante proc em um pull.",
      "Confirme a tabela no cliente após patches.",
    ],
    relatedSourceIds: ["wiki-forge", "official-forge-faq"],
    ...WIKI_FORGE,
  },
  {
    id: "weapon-proficiency",
    category: "proficiency",
    title: "Weapon Proficiency antes do upgrade",
    eyebrow: "A arma é também uma árvore",
    summary:
      "Armas elegíveis podem ser evoluídas e customizadas. O Summer Update 2026 passou a permitir a troca de dois slots da skill tree.",
    estimatedTime: "8 min de planejamento",
    steps: [
      {
        title: "Abra a árvore da arma",
        body:
          "Veja quais perks afetam distance, Perfect Shot, leech, spells ou sua função. Duas armas com ataque parecido podem render diferente.",
      },
      {
        title: "Escolha pela sua rotação",
        body:
          "Se você joga principalmente em área, perks de Caldera/Barrage e sustain podem superar um bônus de single target.",
      },
      {
        title: "Use os dois swaps de 2026",
        body:
          "A atualização permite substituir dois slots da árvore; planeje a customização antes de fechar uma compra de alto valor.",
      },
      {
        title: "Compare no analyzer",
        body:
          "Teste a mesma rota, stance, supplies e duração. Mude uma variável por vez.",
      },
    ],
    checklist: [
      "Arma elegível",
      "Árvore lida por completo",
      "Objetivo definido: AoE, boss, sustain ou proteção",
      "Dois slots customizáveis planejados",
      "Teste equivalente registrado",
    ],
    warnings: [
      "Proficiency não é Tier da Forge.",
      "Perks podem valer mais que um ponto isolado de ataque.",
      "A interface do cliente é a fonte final para os perks disponíveis na sua arma.",
    ],
    relatedSourceIds: ["official-summer-2026", "wiki-sanguine-bow"],
    ...OFFICIAL_SUMMER_2026,
  },
] as const;

export const SOURCES: readonly Source[] = [
  {
    id: "official-vocation-release",
    name: "Vocation Adjustments Release State",
    publisher: "CipSoft / Tibia.com",
    url: "https://www.tibia.com/news/?id=8833&subtopic=newsarchive",
    kind: "oficial",
    verifiedAt: LAST_VERIFIED,
    patch: "Release em 16/06/2026",
    confidence: "alta",
    note:
      "Fonte primária para stances, novas Barrages, munições Storm, poção de mana e aumento global de attack value.",
  },
  {
    id: "official-vocation-final-tuning",
    name: "Fine-tuning após o Vocation Adjustment",
    publisher: "CipSoft / Tibia.com",
    url: "https://www.tibia.com/news/?id=8872&subtopic=newsarchive",
    kind: "oficial",
    verifiedAt: LAST_VERIFIED,
    patch: "07/07/2026",
    confidence: "alta",
    note:
      "Fonte primária para os valores finais de Sharpshooter, Divine Defiance, Divine Caldera e Divine Barrage.",
  },
  {
    id: "official-spell-library",
    name: "Paladin Spells",
    publisher: "CipSoft / Tibia.com Library",
    url: "https://www.tibia.com/library/?vocation=Paladin&subtopic=spells",
    kind: "oficial",
    verifiedAt: LAST_VERIFIED,
    patch: "Estado ao vivo em 28/07/2026",
    confidence: "alta",
    note: "Lista oficial de magias e requisitos da vocação.",
  },
  {
    id: "official-spells-free-2026",
    name: "Spells automatically granted",
    publisher: "CipSoft / Tibia.com",
    url: "https://www.tibia.com/news/?id=8675&subtopic=newsarchive",
    kind: "oficial",
    verifiedAt: LAST_VERIFIED,
    patch: "27/01/2026",
    confidence: "alta",
    note: "Confirma que spells são concedidas automaticamente e sem custo.",
  },
  {
    id: "official-summer-2026",
    name: "Tibia Summer Update 2026",
    publisher: "CipSoft",
    url: "https://www.cipsoft.com/en/press/press-releases/438-tibia-summer-update-2026",
    kind: "oficial",
    verifiedAt: LAST_VERIFIED,
    patch: "13/07/2026",
    confidence: "alta",
    note:
      "Confirma Moonsilver como linha de armas mais poderosa, Stellar/customização e mudanças na Weapon Proficiency.",
  },
  {
    id: "official-imbuement-costs",
    name: "Imbuement Success and Fees",
    publisher: "CipSoft / Tibia.com",
    url: "https://www.tibia.com/news/?id=8396&subtopic=newsarchive",
    kind: "oficial",
    verifiedAt: LAST_VERIFIED,
    patch: "Summer Update 2025",
    confidence: "alta",
    note: "Confirma 100% de sucesso e taxas de 7.500/60.000/250.000 gp.",
  },
  {
    id: "official-strike-2025",
    name: "Critical Damage and Strike Changes",
    publisher: "CipSoft / Tibia.com",
    url: "https://www.tibia.com/news/?id=8421&subtopic=newsarchive",
    kind: "oficial",
    verifiedAt: LAST_VERIFIED,
    patch: "Summer Update 2025",
    confidence: "alta",
    note: "Fonte primária para crítico base e bônus dos níveis de Strike.",
  },
  {
    id: "official-imbuement-scrolls",
    name: "Imbuement Scrolls",
    publisher: "CipSoft / Tibia.com",
    url: "https://www.tibia.com/news/?id=8436&subtopic=newsarchive",
    kind: "oficial",
    verifiedAt: LAST_VERIFIED,
    patch: "Summer Update 2025",
    confidence: "alta",
    note: "Confirma scrolls negociáveis para acesso a imbuements.",
  },
  {
    id: "wiki-imbuements",
    name: "Imbuements",
    publisher: "Tibia Wiki BR",
    url: "https://www.tibiawiki.com.br/wiki/Imbuements",
    kind: "wiki-comunitária",
    verifiedAt: LAST_VERIFIED,
    patch: "Consultado após o Summer Update 2026",
    confidence: "média",
    note: "Materiais, duração, compatibilidade e passos operacionais.",
  },
  {
    id: "official-forge-faq",
    name: "Exaltation Forge FAQ",
    publisher: "CipSoft / Tibia.com Support",
    url: "https://www.tibia.com/support/?entryid=224&subtopic=gethelp",
    kind: "oficial",
    verifiedAt: LAST_VERIFIED,
    patch: "Consultado em 28/07/2026",
    confidence: "alta",
    note: "Fonte primária para regras, risco e operações da Forge.",
  },
  {
    id: "official-convergence-fusion",
    name: "Exaltation Forge Improvements",
    publisher: "CipSoft / Tibia.com",
    url: "https://www.tibia.com/news/?id=7599&subtopic=newsarchive",
    kind: "oficial",
    verifiedAt: LAST_VERIFIED,
    patch: "Convergence Fusion/Transfer",
    confidence: "alta",
    note: "Fonte primária para operações de convergence em itens Classe 4.",
  },
  {
    id: "wiki-forge",
    name: "Exaltation Forge",
    publisher: "Tibia Wiki BR",
    url: "https://www.tibiawiki.com.br/wiki/Exaltation_Forge",
    kind: "wiki-comunitária",
    verifiedAt: LAST_VERIFIED,
    patch: "Consultado em 28/07/2026",
    confidence: "média",
    note: "Tabela de chances por tier; confirmar na interface após patches.",
  },
  {
    id: "wiki-distance",
    name: "Distância",
    publisher: "Tibia Wiki BR",
    url: "https://www.tibiawiki.com.br/wiki/Dist%C3%A2ncia",
    kind: "wiki-comunitária",
    verifiedAt: LAST_VERIFIED,
    patch: "Banco consultado após o Summer Update 2026",
    confidence: "média",
    note: "Atributos de bows, crossbows e armas de arremesso.",
  },
  {
    id: "wiki-sanguine-bow",
    name: "Sanguine Bow",
    publisher: "Tibia Wiki BR",
    url: "https://www.tibiawiki.com.br/wiki/Sanguine_Bow",
    kind: "wiki-comunitária",
    verifiedAt: LAST_VERIFIED,
    patch: "Consultado em 28/07/2026",
    confidence: "média",
    note: "Atributos e exemplo de árvore de Weapon Proficiency.",
  },
  {
    id: "wiki-summer-2026",
    name: "Summer Update 2026",
    publisher: "Tibia Wiki BR",
    url: "https://www.tibiawiki.com.br/wiki/Summer_Update_2026",
    kind: "wiki-comunitária",
    verifiedAt: LAST_VERIFIED,
    patch: "13/07/2026",
    confidence: "média",
    note: "Atributos comunitários dos itens novos; confirmar no cliente antes de comprar.",
  },
  {
    id: "community-equipment",
    name: "Paladin Equipment Guide",
    publisher: "TibiaMonk",
    url: "https://www.tibiamonk.com/en/equipment/paladin",
    kind: "guia-comunitário",
    verifiedAt: LAST_VERIFIED,
    patch: "Atualizado para o Summer Update 2026",
    confidence: "média",
    note: "Progressão geral de equipamento; recomendações dependem do Market.",
  },
  {
    id: "community-hunts",
    name: "Paladin Hunting Guide 2026",
    publisher: "TibiaBuddy",
    url: "https://www.tibiabuddy.com/blog/paladin-hunting-guide-2026",
    kind: "guia-comunitário",
    verifiedAt: LAST_VERIFIED,
    patch: "Consultado após o rebalance de 2026",
    confidence: "baixa",
    note:
      "Usado para opções e faixas iniciais. Métricas altas antigas foram omitidas; Girtablilu é exibida como teste comunitário variável.",
  },
  {
    id: "wiki-girtablilu",
    name: "Venerable Girtablilu",
    publisher: "Tibia Wiki BR",
    url: "https://www.tibiawiki.com.br/wiki/Venerable_Girtablilu",
    kind: "wiki-comunitária",
    verifiedAt: LAST_VERIFIED,
    patch: "Consultado em 28/07/2026",
    confidence: "média",
    note: "Resistências, localização e propriedades da criatura; não valida XP/h.",
  },
] as const;
