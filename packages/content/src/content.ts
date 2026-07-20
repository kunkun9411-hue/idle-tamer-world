import type { EvolutionStage, MonsterDefinition, MonsterInstance } from "@idle-tamer/contracts";

/**
 * Edit this catalog to change names, roles, stats, colors and the first
 * evolution of every starter line. Gameplay code only consumes these records.
 */
export const MONSTERS: MonsterDefinition[] = [
  {
    id: "pyrook", name: "Pyrook", species: "Glutküken", element: "fire", role: "Burst-Schaden", combatRole: "attacker",
    baseHp: 112, baseAttack: 18, accent: "#ff7b4f", glyph: "PY",
    description: "Ein furchtloses Feuer-Rookie, dessen Kern wie eine kleine Sonne pulsiert.",
    sprite: "/assets/monsters/pyrook_idle_right.png", nativeFacing: "right",
    evolution: { name: "Solaraptor", species: "Sonnenraptor", role: "Explosiver Angreifer", baseHp: 214, baseAttack: 36, accent: "#ff6b45", glyph: "SR", description: "Verdichtet seinen Glutkern zu einer flammengekrönten Raptorenform." },
  },
  {
    id: "mossbit", name: "Mossbit", species: "Wurzelknirps", element: "earth", role: "Tank", combatRole: "defender",
    baseHp: 138, baseAttack: 13, accent: "#64dc98", glyph: "MO",
    description: "Sammelt Erinnerungen in seinem Blätterpanzer und schützt sein Rudel.",
    sprite: "/assets/monsters/mossbit_idle_left.png", nativeFacing: "left",
    evolution: { name: "Groveguard", species: "Hainwächter", role: "Unbeugsamer Tank", baseHp: 285, baseAttack: 25, accent: "#54c78a", glyph: "GG", description: "Ein lebender Schutzwall aus uraltem Holz, Moos und gespeicherten Erinnerungen." },
  },
  {
    id: "voltfin", name: "Voltfin", species: "Stromflosse", element: "lightning", role: "Fernkämpfer", combatRole: "scout",
    baseHp: 98, baseAttack: 21, accent: "#f5d94c", glyph: "VF",
    description: "Schwimmt durch Datenströme und schlägt zu, bevor ein Signal ankommt.",
    sprite: "/assets/monsters/voltfin_idle_right.png", nativeFacing: "right",
    evolution: { name: "Stormray", species: "Gewitterrochen", role: "Schneller Artillerist", baseHp: 184, baseAttack: 43, accent: "#f4ca39", glyph: "ST", description: "Breitet elektrische Flügel aus und reitet auf den Magnetfeldern der Ether-Welt." },
  },
  {
    id: "tideram", name: "Tideram", species: "Flutbock", element: "water", role: "Nahkämpfer", combatRole: "defender",
    baseHp: 124, baseAttack: 17, accent: "#55bff6", glyph: "TR",
    description: "Seine Hörner speichern Druckwellen aus den tiefsten Rift-Kanälen.",
    sprite: "/assets/monsters/tideram_idle_right.png", nativeFacing: "right",
    evolution: { name: "Abysshorn", species: "Tiefseebock", role: "Brecher", baseHp: 248, baseAttack: 34, accent: "#4da7e8", glyph: "AH", description: "Panzerplatten und Strömungshörner machen jeden Ansturm zu einer Flutwelle." },
  },
  {
    id: "nyxlet", name: "Nyxlet", species: "Nachtfunke", element: "dark", role: "Kontrolle", combatRole: "controller",
    baseHp: 105, baseAttack: 20, accent: "#a78bfa", glyph: "NX",
    description: "Taucht in gestörten Signalen auf und verschwindet im nächsten Augenblick.",
    sprite: "/assets/monsters/nyxlet_idle_right.png", nativeFacing: "right",
    evolution: { name: "Noctyra", species: "Dämmerjäger", role: "Kontroll-Assassine", baseHp: 198, baseAttack: 40, accent: "#8f74e8", glyph: "NO", description: "Faltet Dunkelheit zu scharfen Schwingen und unterbricht gegnerische Resonanz." },
  },
  {
    id: "bramblet", name: "Bramblet", species: "Dornenkind", element: "earth", role: "Unterstützer", combatRole: "support",
    baseHp: 130, baseAttack: 16, accent: "#9cdb60", glyph: "BR",
    description: "Ein verspieltes Rookie, das heilende Samen in seiner Dornenkrone trägt.",
    sprite: "/assets/monsters/bramblet_idle_right.png", nativeFacing: "right",
    evolution: { name: "Thornwarden", species: "Dornenwächter", role: "Schutz-Unterstützer", baseHp: 260, baseAttack: 30, accent: "#83c54f", glyph: "TW", description: "Kontrolliert ein Geflecht aus Schutzranken, das Verbündete stärkt und Feinde bindet." },
  },
  {
    id: "glimmite", name: "Glimmite", species: "Kristallmilbe", element: "light", role: "Sammler", combatRole: "scout",
    baseHp: 118, baseAttack: 18, accent: "#7cf4dc", glyph: "GL",
    description: "Verdichtet lose Daten zu schimmernden Kristallen in seinem Panzer.",
    sprite: "/assets/monsters/glimmite_idle_right.png", nativeFacing: "right",
    evolution: { name: "Prismantis", species: "Prismenschrecke", role: "Licht-Duellant", baseHp: 220, baseAttack: 38, accent: "#71e5d1", glyph: "PM", description: "Seine Kristallklingen brechen Angriffe in heilende und zerstörerische Spektren." },
  },
  {
    id: "riftjaw", name: "Riftjaw", species: "Spaltenbeißer", element: "dark", role: "Jäger", combatRole: "attacker",
    baseHp: 146, baseAttack: 19, accent: "#d37cff", glyph: "RJ",
    description: "Folgt instabilen Rissen und verteidigt sie mit unerwarteter Geduld.",
    sprite: "/assets/monsters/riftjaw_idle_right.png", nativeFacing: "right",
    evolution: { name: "Voidmaw", species: "Leerenbrecher", role: "Boss-Jäger", baseHp: 276, baseAttack: 39, accent: "#b96ee8", glyph: "VM", description: "Ein massiver Rift-Räuber, dessen Kiefer selbst verdichtete Zonenbarrieren zerreißt." },
  },
  {
    id: "frostel", name: "Frostel", species: "Schneeluchs", element: "ice", role: "Verlangsamung", combatRole: "controller",
    baseHp: 116, baseAttack: 19, accent: "#8fd7ff", glyph: "FR",
    description: "Hinterlässt leise Eiskristalle, die gegnerische Signale verlangsamen.",
    sprite: "/assets/monsters/frostel_idle_right.png", nativeFacing: "right",
    evolution: { name: "Cryolupus", species: "Frostwolf", role: "Tempo-Kontrolleur", baseHp: 232, baseAttack: 37, accent: "#76c5f2", glyph: "CL", description: "Jagt auf gefrorenen Datenbahnen und sperrt ganze Kampffelder mit Kristallatem." },
  },
  {
    id: "lumipup", name: "Lumipup", species: "Lichtwelpe", element: "light", role: "Heiler", combatRole: "support",
    baseHp: 126, baseAttack: 15, accent: "#f1cf82", glyph: "LU",
    description: "Ein neugieriges Rookie, das beschädigte Resonanzen mit warmem Licht flickt.",
    sprite: "/assets/monsters/lumipup_idle_right.png", nativeFacing: "right",
    evolution: { name: "Auralion", species: "Auroralöwe", role: "Heiliger Unterstützer", baseHp: 252, baseAttack: 31, accent: "#e7bd67", glyph: "AL", description: "Trägt eine schimmernde Mähne und stabilisiert Verbündete selbst in kollabierenden Zonen." },
  },
];

export const ENEMY_ROTATION = ["mossbit", "voltfin", "pyrook"];

export const getMonster = (id: string): MonsterDefinition => {
  const monster = MONSTERS.find((entry) => entry.id === id);
  if (!monster) throw new Error(`Unknown monster definition: ${id}`);
  return monster;
};

export interface MonsterFormView {
  name: string;
  species: string;
  role: string;
  combatRole: MonsterDefinition["combatRole"];
  baseHp: number;
  baseAttack: number;
  accent: string;
  glyph: string;
  description: string;
  sprite?: string;
  nativeFacing?: "left" | "right";
  stage: EvolutionStage;
}

export const getMonsterForm = (monster: MonsterInstance | { definitionId: string; evolution: EvolutionStage }): MonsterFormView => {
  const definition = getMonster(monster.definitionId);
  if (monster.evolution === "evolved") return { ...definition.evolution, combatRole: definition.evolution.combatRole ?? definition.combatRole, stage: "evolved" };
  return {
    name: definition.name,
    species: definition.species,
    role: definition.role,
    combatRole: definition.combatRole,
    baseHp: definition.baseHp,
    baseAttack: definition.baseAttack,
    accent: definition.accent,
    glyph: definition.glyph,
    description: definition.description,
    sprite: definition.sprite,
    nativeFacing: definition.nativeFacing,
    stage: "rookie",
  };
};

export const elementLabel: Record<MonsterDefinition["element"], string> = {
  fire: "Feuer",
  water: "Wasser",
  earth: "Erde",
  lightning: "Blitz",
  ice: "Eis",
  light: "Licht",
  dark: "Dunkelheit",
};
