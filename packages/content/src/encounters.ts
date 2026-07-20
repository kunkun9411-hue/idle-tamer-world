import type { CombatRole, Element } from "@idle-tamer/contracts";

export interface EncounterDefinition {
  id: string;
  name: string;
  species: string;
  element: Element;
  combatRole: CombatRole;
  baseHp: number;
  baseAttack: number;
  accent: string;
  glyph: string;
  description: string;
  eggMonsterId: string;
  zoneId: string;
  isBoss: boolean;
  design: string;
  sprite?: string;
  nativeFacing?: "left" | "right";
}

const enemy = (definition: Omit<EncounterDefinition, "isBoss">): EncounterDefinition => ({
  ...definition,
  isBoss: false,
  sprite: definition.sprite ?? `/assets/enemies/${definition.id}_idle_left.png`,
  nativeFacing: definition.nativeFacing ?? "left",
});
const boss = (definition: Omit<EncounterDefinition, "isBoss">): EncounterDefinition => ({
  ...definition,
  isBoss: true,
  sprite: definition.sprite ?? `/assets/bosses/${definition.id}_idle_left.png`,
  nativeFacing: definition.nativeFacing ?? "left",
});

/**
 * Thirty normal opponents are separate from the ten collectible lines. Their
 * eggMonsterId decides which collectible Rookie egg can drop after the fight.
 */
export const ENEMIES: EncounterDefinition[] = [
  enemy({ id: "flickerimp", name: "Flickerimp", species: "Flackerwicht", element: "fire", combatRole: "attacker", baseHp: 92, baseAttack: 19, accent: "#ff805c", glyph: "FI", eggMonsterId: "pyrook", zoneId: "violet-rim", description: "Springt zwischen den Glutresten alter Portale.", design: "small coral ember imp with wing-like ears, ivory mask face, coal paws and a glowing diamond belly core" }),
  enemy({ id: "rootkin", name: "Rootkin", species: "Wurzelwacht", element: "earth", combatRole: "defender", baseHp: 135, baseAttack: 12, accent: "#72c98b", glyph: "RK", eggMonsterId: "mossbit", zoneId: "violet-rim", description: "Bewacht vergessene Pfade mit einem Schild aus Wurzeln.", design: "sturdy root creature with moss hood, ivory face, branch forelegs and a mint hexagonal shoulder core" }),
  enemy({ id: "zapplet", name: "Zapplet", species: "Funkenhopser", element: "lightning", combatRole: "scout", baseHp: 86, baseAttack: 21, accent: "#f3d84f", glyph: "ZA", eggMonsterId: "voltfin", zoneId: "violet-rim", description: "Liest den nächsten Angriff aus statischer Luft.", design: "tiny navy electric jerboa with lightning ears, cyan eyes, yellow circuit stripes and a pale chest core" }),
  enemy({ id: "rainskip", name: "Rainskip", species: "Tropfenspringer", element: "water", combatRole: "support", baseHp: 106, baseAttack: 15, accent: "#5ec7ed", glyph: "RS", eggMonsterId: "tideram", zoneId: "violet-rim", description: "Hinterlässt stabilisierende Tropfensiegel.", design: "round aqua frog-deer hybrid with translucent fin ears, pearl face, turquoise throat core and short wave legs" }),
  enemy({ id: "gloamite", name: "Gloamite", species: "Dämmerkrabbler", element: "dark", combatRole: "controller", baseHp: 100, baseAttack: 17, accent: "#a182e4", glyph: "GM", eggMonsterId: "nyxlet", zoneId: "violet-rim", description: "Verwebt Schatten mit gestörten Erinnerungssplittern.", design: "small violet night moth crawler with crescent antennae, lavender eyes and a faceted throat core" }),
  enemy({ id: "emberling", name: "Emberling", species: "Aschefloh", element: "fire", combatRole: "attacker", baseHp: 88, baseAttack: 22, accent: "#f56f51", glyph: "EM", eggMonsterId: "pyrook", zoneId: "violet-rim", description: "Explodiert in Funken und setzt sich sofort neu zusammen.", design: "compact ash feline with flame tail, bright amber eyes, coral markings and an orange crystal core" }),
  enemy({ id: "pebblit", name: "Pebblit", species: "Kieselrücken", element: "earth", combatRole: "defender", baseHp: 142, baseAttack: 11, accent: "#9dbb74", glyph: "PB", eggMonsterId: "bramblet", zoneId: "violet-rim", description: "Rollt sich vor jedem Treffer zu einer festen Kugel.", design: "low round stone armadillo creature with leaf seams, warm face, lime eyes and a green geometric back core" }),
  enemy({ id: "currentail", name: "Currentail", species: "Stromschweif", element: "water", combatRole: "scout", baseHp: 94, baseAttack: 19, accent: "#58bfe5", glyph: "CU", eggMonsterId: "tideram", zoneId: "violet-rim", description: "Reitet auf dünnen Wasserfäden zwischen den Ruinen.", design: "sleek blue otter-lizard with long current tail, fin cheeks, pearl belly and a cyan diamond core" }),
  enemy({ id: "halopeep", name: "Halopeep", species: "Lichtküken", element: "light", combatRole: "support", baseHp: 108, baseAttack: 14, accent: "#e9c977", glyph: "HP", eggMonsterId: "lumipup", zoneId: "violet-rim", description: "Sein Ruf flickt kleine Risse in der Zone.", design: "tiny cream owl chick with floating gold halo feathers, honey eyes and a soft sun core" }),
  enemy({ id: "frostnip", name: "Frostnip", species: "Reifmarder", element: "ice", combatRole: "controller", baseHp: 98, baseAttack: 18, accent: "#8fd8f6", glyph: "FN", eggMonsterId: "frostel", zoneId: "violet-rim", description: "Friert die letzte Bewegung seines Gegners ein.", design: "small pale blue snow ferret with crystal whiskers, sapphire eyes and a snowflake chest core" }),

  enemy({ id: "glasscarab", name: "Glasscarab", species: "Archivkäfer", element: "light", combatRole: "defender", baseHp: 160, baseAttack: 15, accent: "#78ddc6", glyph: "GC", eggMonsterId: "glimmite", zoneId: "glass-gardens", description: "Speichert Angriffe als Muster in seinem transparenten Panzer.", design: "mint crystal scarab with ivory face, broad translucent shell, aqua eyes and a glowing hex core" }),
  enemy({ id: "vinecoil", name: "Vinecoil", species: "Rankenschlange", element: "earth", combatRole: "controller", baseHp: 126, baseAttack: 19, accent: "#79c85d", glyph: "VC", eggMonsterId: "bramblet", zoneId: "glass-gardens", description: "Bindet fremde Resonanzen mit lebenden Ranken.", design: "leaf-green serpent with blooming thorn collar, warm eyes, bark scales and a lime heart core" }),
  enemy({ id: "prismole", name: "Prismole", species: "Spektralgräber", element: "light", combatRole: "scout", baseHp: 112, baseAttack: 22, accent: "#7be5d8", glyph: "PR", eggMonsterId: "glimmite", zoneId: "glass-gardens", description: "Gräbt Tunnel durch kristallisierte Erinnerungen.", design: "small prism mole with faceted claws, ivory snout, aqua goggles-like eyes and a mint crystal core" }),
  enemy({ id: "staticress", name: "Staticress", species: "Spannungsfasan", element: "lightning", combatRole: "attacker", baseHp: 108, baseAttack: 25, accent: "#ebce48", glyph: "SA", eggMonsterId: "voltfin", zoneId: "glass-gardens", description: "Lädt seine Kristallfedern bis zum grellen Entladen.", design: "navy electric pheasant with yellow glass feathers, cyan eye mask and a pale capacitor core" }),
  enemy({ id: "bloomcap", name: "Bloomcap", species: "Blütenpilz", element: "earth", combatRole: "support", baseHp: 132, baseAttack: 16, accent: "#a7d36b", glyph: "BC", eggMonsterId: "bramblet", zoneId: "glass-gardens", description: "Verteilt heilende Sporen zwischen der Kristallflora.", design: "cute walking mushroom creature with layered green flower cap, tan face, seed pods and a lime core" }),
  enemy({ id: "mistray", name: "Mistray", species: "Nebelrochen", element: "water", combatRole: "controller", baseHp: 118, baseAttack: 21, accent: "#70c8e8", glyph: "MR", eggMonsterId: "tideram", zoneId: "glass-gardens", description: "Verdeckt Angriffslinien hinter schimmerndem Nebel.", design: "floating pale blue ray with mist fins, pearl face, turquoise markings and a teardrop core" }),
  enemy({ id: "cindervex", name: "Cindervex", species: "Glutfuchs", element: "fire", combatRole: "attacker", baseHp: 110, baseAttack: 26, accent: "#f37a58", glyph: "CV", eggMonsterId: "pyrook", zoneId: "glass-gardens", description: "Jagt Spiegelbilder durch leuchtende Hecken.", design: "lean coral fox creature with ember ears, cream chest, charcoal paws and an orange diamond core" }),
  enemy({ id: "quartzling", name: "Quartzling", species: "Quarzpanzer", element: "ice", combatRole: "defender", baseHp: 170, baseAttack: 14, accent: "#9acff0", glyph: "QL", eggMonsterId: "frostel", zoneId: "glass-gardens", description: "Verdichtet Kälte zu einem spiegelnden Schutzpanzer.", design: "stocky frost turtle with quartz shell, pale blue face, sapphire eyes and a snowflake core" }),
  enemy({ id: "sunmidge", name: "Sunmidge", species: "Sonnenmücke", element: "light", combatRole: "scout", baseHp: 96, baseAttack: 25, accent: "#efcf70", glyph: "SM", eggMonsterId: "lumipup", zoneId: "glass-gardens", description: "Markiert verborgene Beute mit kurzen Lichtblitzen.", design: "tiny golden moth-dragonfly with cream body, honey eyes, four clear light wings and a sun core" }),
  enemy({ id: "mirehorn", name: "Mirehorn", species: "Sumpfhorn", element: "water", combatRole: "defender", baseHp: 176, baseAttack: 15, accent: "#5db9bc", glyph: "MH", eggMonsterId: "mossbit", zoneId: "glass-gardens", description: "Schützt empfindliche Archive unter einer Sumpfschale.", design: "broad teal beetle-ram with moss shell, ivory face, curved water horns and a mint core" }),

  enemy({ id: "obsidrake", name: "Obsidrake", species: "Schwarzsplitter", element: "dark", combatRole: "attacker", baseHp: 142, baseAttack: 30, accent: "#a06cdb", glyph: "OD", eggMonsterId: "riftjaw", zoneId: "obsidian-fjord", description: "Schneidet mit heißen Obsidianflügeln durch die Kälte.", design: "small dark plum drake with obsidian blade wings, magenta cracks, bright eyes and a violet core" }),
  enemy({ id: "riftling", name: "Riftling", species: "Spaltengleiter", element: "dark", combatRole: "scout", baseHp: 120, baseAttack: 28, accent: "#9f7ce5", glyph: "RL", eggMonsterId: "nyxlet", zoneId: "obsidian-fjord", description: "Verschwindet zwischen zwei aufeinanderfolgenden Bildern.", design: "slender violet glider beast with floating ear fragments, lavender eyes and a crescent throat core" }),
  enemy({ id: "cryobat", name: "Cryobat", species: "Eislauscher", element: "ice", combatRole: "controller", baseHp: 130, baseAttack: 25, accent: "#86ccef", glyph: "CB", eggMonsterId: "frostel", zoneId: "obsidian-fjord", description: "Ortungsschreie frieren getroffene Signale ein.", design: "pale blue crystal bat with large sapphire ears, frost membrane wings and a snowflake chest core" }),
  enemy({ id: "ashmaw", name: "Ashmaw", species: "Aschenbeißer", element: "fire", combatRole: "attacker", baseHp: 150, baseAttack: 31, accent: "#e66d54", glyph: "AM", eggMonsterId: "pyrook", zoneId: "obsidian-fjord", description: "Trägt Glut unter einem kalten schwarzen Panzer.", design: "stocky charcoal hound with coral ember jaw, cream eyes, molten seams and an orange core" }),
  enemy({ id: "nullshell", name: "Nullshell", species: "Leerenpanzer", element: "dark", combatRole: "defender", baseHp: 205, baseAttack: 18, accent: "#8a79bd", glyph: "NS", eggMonsterId: "riftjaw", zoneId: "obsidian-fjord", description: "Schluckt schwache Angriffe vollständig aus dem Signal.", design: "heavy dark tortoise creature with floating void shell plates, violet seams and a faceted forehead core" }),
  enemy({ id: "stormelk", name: "Stormelk", species: "Gewitterhirsch", element: "lightning", combatRole: "defender", baseHp: 190, baseAttack: 22, accent: "#e4c84d", glyph: "SE", eggMonsterId: "voltfin", zoneId: "obsidian-fjord", description: "Leitet Rift-Blitze durch sein verzweigtes Geweih.", design: "compact navy elk with electric yellow antlers, cyan eyes, sturdy legs and a pale capacitor core" }),
  enemy({ id: "duskweaver", name: "Duskweaver", species: "Dämmerweber", element: "dark", combatRole: "support", baseHp: 150, baseAttack: 22, accent: "#b17cc5", glyph: "DW", eggMonsterId: "nyxlet", zoneId: "obsidian-fjord", description: "Näht beschädigte Schatten zu einem Schutzmantel.", design: "friendly plum spider-moth with six clear legs, soft wing cape, lavender eyes and a violet core" }),
  enemy({ id: "glacifin", name: "Glacifin", species: "Gletscherflosse", element: "ice", combatRole: "scout", baseHp: 124, baseAttack: 29, accent: "#7cc8ee", glyph: "GF", eggMonsterId: "frostel", zoneId: "obsidian-fjord", description: "Schwimmt durch Eiswände wie durch offenes Wasser.", design: "sleek ice shark-lizard with translucent fins, sapphire eyes, white belly and a snowflake core" }),
  enemy({ id: "eclipsprout", name: "Eclipsprout", species: "Finsterspross", element: "dark", combatRole: "controller", baseHp: 158, baseAttack: 24, accent: "#806bb9", glyph: "ES", eggMonsterId: "bramblet", zoneId: "obsidian-fjord", description: "Seine Blätter verdunkeln selbst gespeichertes Licht.", design: "dark indigo plant cub with eclipse leaf crown, silver face, violet eyes and a dim lime heart core" }),
  enemy({ id: "deepflare", name: "Deepflare", species: "Tiefenleuchte", element: "water", combatRole: "attacker", baseHp: 148, baseAttack: 30, accent: "#55b1d9", glyph: "DF", eggMonsterId: "tideram", zoneId: "obsidian-fjord", description: "Feuert verdichtetes Licht aus kaltem Tiefenwasser.", design: "dark teal angler-drake with luminous cyan fins, pearl jaw, bright lure and a teardrop core" }),
];

export const BOSSES: EncounterDefinition[] = [
  boss({ id: "crownroot-colossus", name: "Kronwurzel-Koloss", species: "Uralter Hainkern", element: "earth", combatRole: "defender", baseHp: 315, baseAttack: 22, accent: "#67c487", glyph: "KC", eggMonsterId: "mossbit", zoneId: "violet-rim", description: "Ein wandernder Ruinenhain, der den ersten Zonenausgang versiegelt.", design: "colossal quadruped ancient tree guardian, broad root armor, moss crown, ivory mask face, mint core in chest, imposing but readable game boss silhouette" }),
  boss({ id: "pyroclast-seraph", name: "Pyroklast-Seraph", species: "Portalbrand", element: "fire", combatRole: "attacker", baseHp: 270, baseAttack: 31, accent: "#f06e50", glyph: "PS", eggMonsterId: "pyrook", zoneId: "violet-rim", description: "Ein geflügelter Feuerkern, der nach jedem Saum-Abschluss erwacht.", design: "large original fire bird-dragon boss, four ember wing shapes, coral and charcoal armor feathers, cream face, radiant orange diamond core, no angel human traits" }),
  boss({ id: "mirrormaw-hydra", name: "Spiegelschlund-Hydra", species: "Archivspalter", element: "water", combatRole: "controller", baseHp: 355, baseAttack: 29, accent: "#70d5cf", glyph: "SH", eggMonsterId: "glimmite", zoneId: "glass-gardens", description: "Drei kristalline Köpfe spiegeln unterschiedliche Erinnerungen.", design: "three-headed aquatic crystal beast, mint glass scales, pearl faces, aqua eyes, shared hexagonal chest core, heads clearly separated, elegant game boss" }),
  boss({ id: "tempest-leviathan", name: "Sturm-Leviathan", species: "Himmelsspannung", element: "lightning", combatRole: "attacker", baseHp: 320, baseAttack: 38, accent: "#e6ce4c", glyph: "SL", eggMonsterId: "voltfin", zoneId: "glass-gardens", description: "Schwimmt über den Gärten und lädt jedes Kristallblatt auf.", design: "massive airborne manta serpent boss, deep navy body, electric yellow fins, cyan eyes, pale capacitor core, sweeping storm silhouette" }),
  boss({ id: "nihil-warden", name: "Nihil-Wächter", species: "Festungsriss", element: "dark", combatRole: "defender", baseHp: 430, baseAttack: 36, accent: "#9a77d3", glyph: "NW", eggMonsterId: "riftjaw", zoneId: "obsidian-fjord", description: "Der letzte Wächter trägt eine zerbrochene Gildenfestung als Panzer.", design: "huge original void hound fortress boss, dark plum body, obsidian shoulder citadel plates, magenta rift cracks, violet forehead core, powerful readable quadruped silhouette" }),
];

export const ENCOUNTERS: EncounterDefinition[] = [...ENEMIES, ...BOSSES];

export const getEncounter = (id: string): EncounterDefinition => {
  const encounter = ENCOUNTERS.find((entry) => entry.id === id);
  if (!encounter) throw new Error(`Unknown encounter definition: ${id}`);
  return encounter;
};

export const findEncounter = (id: string): EncounterDefinition | undefined => ENCOUNTERS.find((entry) => entry.id === id);
