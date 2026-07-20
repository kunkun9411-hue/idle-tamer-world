export interface Milestone {
  target: number;
  chapter: string;
  title: string;
  story: string;
  reward: { gold: number; eggId?: string };
}

export const MILESTONES: Milestone[] = [
  { target: 5, chapter: "01", title: "Belias' Ruf", story: "Der Veteran öffnet dir den ersten stabilen Pfad in die Ether-Welt.", reward: { gold: 75 } },
  { target: 15, chapter: "02", title: "Spuren des Virus", story: "In besiegten Monstern bleibt ein fremdes, schwarzes Signal zurück.", reward: { gold: 140, eggId: "voltfin" } },
  { target: 30, chapter: "03", title: "Der Ether-Ritter", story: "Liam hält allein ein Tor gegen eine endlose Welle korrumpierter Echos.", reward: { gold: 220 } },
  { target: 50, chapter: "04", title: "Das gebrochene Archiv", story: "Belias findet Aufzeichnungen über verlorene Entwicklungszweige.", reward: { gold: 320, eggId: "tideram" } },
  { target: 80, chapter: "05", title: "Nyx-Frequenz", story: "Ein Schattenmonster spricht mit der Stimme eines verschwundenen Tamers.", reward: { gold: 450 } },
  { target: 120, chapter: "06", title: "Erster Neubeginn", story: "Die Ether-Welt reagiert auf deinen Prestige-Kern wie auf eine Erinnerung.", reward: { gold: 600, eggId: "nyxlet" } },
  { target: 180, chapter: "07", title: "Die stumme Zone", story: "Wo der Virus siegt, verschwinden nicht Körper, sondern Namen.", reward: { gold: 800 } },
  { target: 260, chapter: "08", title: "Liams letzter Schlag", story: "Der Ritter erreicht den Kern des Virus und die Welt hält den Atem an.", reward: { gold: 1_050, eggId: "glimmite" } },
  { target: 360, chapter: "09", title: "Falscher Frieden", story: "Das Siegel bricht. Vielleicht war der Virus nie die eigentliche Bedrohung.", reward: { gold: 1_350 } },
  { target: 500, chapter: "10", title: "Das zweite Erwachen", story: "Hinter dem Virus antwortet etwas, das beide Welten schon lange kennt.", reward: { gold: 1_800, eggId: "riftjaw" } },
];

export const currentChapter = (totalVictories: number): Milestone =>
  [...MILESTONES].reverse().find((milestone) => totalVictories >= milestone.target) ?? MILESTONES[0];

export const nextMilestone = (totalVictories: number): Milestone | undefined =>
  MILESTONES.find((milestone) => totalVictories < milestone.target);

export type ResearchId = "power" | "vitality" | "extraction" | "incubation";

export interface ResearchDefinition {
  id: ResearchId;
  name: string;
  icon: string;
  maxLevel: number;
  effectPerLevel: string;
  description: string;
}

export const RESEARCH: ResearchDefinition[] = [
  { id: "power", name: "Hyper-Resonanz", icon: "↗", maxLevel: 8, effectPerLevel: "+7% Angriff", description: "Permanente Account-Forschung, die nach einem Prestige erhalten bleibt." },
  { id: "vitality", name: "Ether-Panzer", icon: "⬡", maxLevel: 8, effectPerLevel: "+8% Lebenspunkte", description: "Stabilisiert alle projizierten Monsterformen über jeden Run hinweg." },
  { id: "extraction", name: "Gold-Filter", icon: "⌁", maxLevel: 8, effectPerLevel: "+10% Gold", description: "Gewinnt dauerhaft mehr Run-Gold aus automatischen Kämpfen." },
  { id: "incubation", name: "Brut-Resonanz", icon: "◇", maxLevel: 5, effectPerLevel: "−10% Brutzeit", description: "Verkürzt permanent die Inkubation aller gefundenen Eier." },
];
