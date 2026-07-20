import "./styles.css";
import "./styles-v2.css";
import "./styles-game-first.css";
import "./styles-progression-v3.css";
import { AVATARS, BALANCE, COMBAT_ROLE_LABELS, FRAMES, GEM_COLORS, GEM_RARITIES, GEM_SHAPES, GEMS, getGem, getZone, ITEMS, ZONES } from "./game/catalog";
import { elementLabel, getMonster, getMonsterForm, MONSTERS } from "./game/content";
import { findEncounter, getEncounter } from "./game/encounters";
import { canCraft, CRAFTING_RECIPES, getCraftingRecipe } from "./game/crafting";
import { canStartExpedition, EXPEDITIONS, EXPEDITION_SLOT_COUNT, expeditionMatchCount, expeditionRewardMultiplier, getExpedition, isMonsterDispatched, type ExpeditionDefinition } from "./game/expeditions";
import { API_PROTOCOL_VERSION } from "./game/api-contract";
import { clientStatusCopy, type ClientUiState } from "./game/client-status";
import { CONTENT_RELEASE_ID } from "./game/contract-versions";
import { isAvatarUnlocked, isFrameUnlocked, LocalGameService } from "./game/game-service";
import { LocalGameServicePort } from "./game/game-service-port";
import { currentChapter, MILESTONES, nextMilestone, RESEARCH, type ResearchId } from "./game/progression";
import { isObjectiveClaimable, objectiveClaimKey, objectiveProgress, OBJECTIVES, refreshObjectivePeriods, type ObjectiveDefinition } from "./game/objectives";
import {
  activeZoneSynergy,
  enemyForZone,
  enemyStats,
  EVOLUTION_LABELS,
  cacheCapacity,
  canEvolve,
  createMonster,
  levelCost,
  monsterGemBonuses,
  monsterAttack,
  monsterMaxHp,
  playerAttack,
  playerMaxHp,
  prestigeCoreReward,
  rankForVictories,
  researchCost,
  hyperLevelCost,
} from "./game/rules";
import { loadGame, resetGame, STORAGE_KEY } from "./game/storage";
import { SYSTEM_MESSAGES } from "./game/system-messages";
import type { BattleState, GemShape, MonsterInstance, PlayerSettings } from "./game/types";

type View = "expedition" | "objectives" | "dispatch" | "habitat" | "incubation" | "inventory" | "research" | "guild" | "profile" | "prestige";
type NoticeTone = "violet" | "success" | "warning";
type CombatPanel = "missions" | "loot" | "duo" | "monsters" | "log";

interface UiNotice {
  title: string;
  message: string;
  tone: NoticeTone;
}

const appElement = document.querySelector<HTMLDivElement>("#app");
if (!appElement) throw new Error("App root is missing");
const app: HTMLDivElement = appElement;

const loaded = loadGame();
const service = new LocalGameService(loaded.state);
const servicePort = new LocalGameServicePort(service);
const game = service.state;
let activeView: View = "expedition";
let showLogin = true;
let showOfflineReport = false;
let battle: BattleState | null = createBattleState();
let lastFrame = performance.now();
let lastRender = 0;
let lastSave = performance.now();
let hatchNotice = "";
let uiNotice: UiNotice | null = null;
let noticeTimer = 0;
let prestigeActivating = false;
let starterDialogOpen = false;
let activeCombatPanel: CombatPanel | null = null;
let combatFocusMode = false;
const requestedUiState = new URLSearchParams(window.location.search).get("ui-state");
let clientUiState: ClientUiState = import.meta.env.DEV && ["loading", "online", "offline", "conflict", "error"].includes(requestedUiState ?? "")
  ? requestedUiState as ClientUiState
  : "local";

const compactNumberFormatter = new Intl.NumberFormat("de-DE", { notation: "compact", maximumFractionDigits: 1 });
const fullNumberFormatter = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });
const timeFormatter = new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" });

function formatNumber(value: number): string {
  return game.settings.numberFormat === "full" ? fullNumberFormatter.format(value) : compactNumberFormatter.format(value);
}

function playUiTone(tone: NoticeTone): void {
  if (!game.settings.soundEnabled || !globalThis.AudioContext) return;
  try {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = tone === "success" ? 620 : tone === "warning" ? 260 : 440;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.035, context.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.13);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.14);
    oscillator.addEventListener("ended", () => void context.close());
  } catch {
    // Audio is optional and must never block a game action.
  }
}

function activeMonster(): MonsterInstance | null {
  return game.roster.find((monster) => monster.uid === game.activeMonsterUid) ?? game.roster[0] ?? null;
}

function createBattleState(): BattleState | null {
  const player = activeMonster();
  if (!player) return null;
  const zoneProgress = game.zoneProgress[game.currentZoneId] ?? { stage: 1, clears: 0 };
  const enemy = enemyForZone(game.currentZoneId, zoneProgress.stage, game.runVictories, zoneProgress.clears);
  const enemyValues = enemyStats(enemy.definitionId, enemy.level);
  const now = performance.now();
  const synergy = activeZoneSynergy(game);
  const maxHp = playerMaxHp(player, game.research.vitality, synergy?.hpPercent);
  return {
    enemyDefinitionId: enemy.definitionId,
    enemyLevel: enemy.level,
    playerHp: maxHp,
    enemyHp: enemyValues.hp,
    playerMaxHp: maxHp,
    enemyMaxHp: enemyValues.hp,
    playerNextAttackAt: now + 700,
    enemyNextAttackAt: now + 1_250,
    recoveryUntil: 0,
    status: "fighting",
    log: ["Belias: Resonanz stabil. Der Kampf läuft automatisch."],
    playerHit: false,
    enemyHit: false,
    playerDamageTaken: 0,
    enemyDamageTaken: 0,
  };
}

function addLog(message: string): void {
  if (!battle) return;
  battle.log = [message, ...battle.log].slice(0, 4);
}

function tickBattle(now: number): void {
  if (!battle) return;
  if ((battle.status === "victory" || battle.status === "recovering") && now >= battle.recoveryUntil) {
    const recovered = battle.status === "recovering";
    battle = createBattleState();
    if (recovered) addLog("Belias hat dein Monster neu mit der Ether-Welt verbunden.");
    return;
  }
  if (battle.status !== "fighting") return;

  if (now >= battle.playerNextAttackAt) {
    const player = activeMonster();
    if (!player) return;
    const damage = playerAttack(player, game.research.power, activeZoneSynergy(game)?.attackPercent) + Math.floor(Math.random() * 5);
    battle.enemyHp = Math.max(0, battle.enemyHp - damage);
    battle.playerNextAttackAt = now + 1_650;
    const impactedBattle = battle;
    impactedBattle.enemyHit = true;
    impactedBattle.enemyDamageTaken = damage;
    render();
    window.setTimeout(() => {
      if (battle !== impactedBattle) return;
      battle.enemyHit = false;
      battle.enemyDamageTaken = 0;
      render();
    }, 420);
    addLog(`${getMonsterForm(player).name} trifft für ${damage}.`);

    if (battle.enemyHp <= 0) {
      const result = service.recordVictory(battle.enemyDefinitionId, battle.enemyLevel);
      battle.status = "victory";
      battle.recoveryUntil = now + 1_800;
      if (result.unlockedZoneId) addLog(`Zonenboss besiegt! ${getZone(result.unlockedZoneId).name} wurde freigeschaltet.`);
      else if (result.bossDefeated) addLog(`Zonenboss besiegt! Evolutionskern${result.gemId ? " und Gem" : ""} im Kampfspeicher.`);
      else if (result.cacheFull) addLog("Sieg gezählt. Der Kampfspeicher ist voll – bitte Beute einsammeln.");
      else if (result.eggDefinitionId) addLog(`Sieg! +${result.gold} Gold und ein ${getMonster(result.eggDefinitionId).name}-Ei im Speicher.`);
      else if (result.items.length > 0) addLog(`Sieg! +${result.gold} Gold und ${result.items.map((drop) => ITEMS.find((item) => item.id === drop.itemId)?.name).filter(Boolean).join(", ")}.`);
      else addLog(`Sieg! +${result.gold} Gold im Speicher.`);
      render();
      return;
    }
  }

  if (now >= battle.enemyNextAttackAt) {
    const values = enemyStats(battle.enemyDefinitionId, battle.enemyLevel);
    const damage = values.attack + Math.floor(Math.random() * 3);
    battle.playerHp = Math.max(0, battle.playerHp - damage);
    battle.enemyNextAttackAt = now + 1_900;
    const impactedBattle = battle;
    impactedBattle.playerHit = true;
    impactedBattle.playerDamageTaken = damage;
    render();
    window.setTimeout(() => {
      if (battle !== impactedBattle) return;
      battle.playerHit = false;
      battle.playerDamageTaken = 0;
      render();
    }, 420);
    addLog(`${combatantName(battle.enemyDefinitionId)} kontert für ${damage}.`);
    if (battle.playerHp <= 0) {
      battle.status = "recovering";
      battle.recoveryUntil = now + 3_000;
      addLog("Signal abgebrochen. Drei Sekunden Regeneration – kein Verlust.");
    }
  }
}

function showNotice(title: string, message: string, tone: NoticeTone = "violet"): void {
  uiNotice = { title, message, tone };
  window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => {
    uiNotice = null;
    render();
  }, 3_600);
  playUiTone(tone);
  render();
}

function collectCache(): void {
  const gold = game.pendingGold;
  const eggs = game.pendingEggs.length;
  const items = Object.values(game.pendingItems).reduce((sum, amount) => sum + amount, 0);
  const gems = game.pendingGems.length;
  if (service.collectCache()) showNotice("Beute gesichert", `${gold} Gold, ${eggs} Eier, ${items} Materialien und ${gems} Gems wurden übertragen.`, "success");
}

function collectOfflineRewards(): void {
  showOfflineReport = false;
  const gold = game.pendingGold;
  const eggs = game.pendingEggs.length;
  const items = Object.values(game.pendingItems).reduce((sum, amount) => sum + amount, 0);
  const gems = game.pendingGems.length;
  if (service.collectCache()) {
    showNotice("Willkommen zurück", `${gold} Gold, ${eggs} Eier, ${items} Materialien und ${gems} Gems wurden eingesammelt.`, "success");
  } else {
    render();
  }
  window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
}

function toggleCombatPanel(panel: CombatPanel): void {
  combatFocusMode = false;
  activeCombatPanel = activeCombatPanel === panel ? null : panel;
  render();
}

function toggleCombatFocus(): void {
  combatFocusMode = !combatFocusMode;
  activeCombatPanel = null;
  render();
}

function levelUp(uid: string): void {
  if (!service.levelUp(uid)) return;
  const monster = game.roster.find((entry) => entry.uid === uid);
  if (uid === game.activeMonsterUid) battle = createBattleState();
  showNotice("Run-Level erhöht", `${monster ? getMonsterForm(monster).name : "Monster"} ist jetzt Level ${monster?.level ?? "–"}.`);
}

function trainWithData(uid: string): void {
  if (!service.trainWithData(uid)) return;
  const monster = game.roster.find((entry) => entry.uid === uid);
  if (uid === game.activeMonsterUid) battle = createBattleState();
  showNotice("Trainingsdaten verwendet", `${monster ? getMonsterForm(monster).name : "Monster"} erhält ein kostenloses Run-Level.`, "success");
}

function evolveMonster(uid: string): void {
  if (!service.evolve(uid)) return;
  const monster = game.roster.find((entry) => entry.uid === uid);
  if (uid === game.activeMonsterUid) battle = createBattleState();
  showNotice("Evolution abgeschlossen", `${monster ? getMonsterForm(monster).name : "Die neue Form"} wurde dauerhaft freigeschaltet.`, "success");
}

function upgradeHyper(uid: string): void {
  if (!service.upgradeHyper(uid)) return;
  const monster = game.roster.find((entry) => entry.uid === uid);
  if (uid === game.activeMonsterUid) battle = createBattleState();
  showNotice("Permanente Resonanz", `Hyperlevel ${monster?.hyperLevel ?? "–"} bleibt über jedes Prestige hinaus bestehen.`, "success");
}

function equipGem(uid: string, gemId: string): void {
  if (!service.equipGem(uid, gemId)) return;
  if (uid === game.activeMonsterUid) battle = createBattleState();
  const gem = getGem(gemId);
  showNotice("Gem eingesetzt", `${gem?.name ?? "Der Gem"} verstärkt jetzt die Grundwerte.`, "success");
}

function unequipGem(uid: string, gemId: string): void {
  if (!service.unequipGem(uid, gemId)) return;
  if (uid === game.activeMonsterUid) battle = createBattleState();
  showNotice("Gem gelöst", `${getGem(gemId)?.name ?? "Der Gem"} liegt wieder im Inventar.`);
}

function makeActive(uid: string): void {
  if (!service.makeActive(uid)) return;
  battle = createBattleState();
  const active = activeMonster();
  showNotice("Verbindung gewechselt", `${active ? getMonsterForm(active).name : "Das Monster"} führt jetzt dein Team an.`);
}

function makeSupport(uid: string): void {
  if (!service.makeSupport(uid)) return;
  battle = createBattleState();
  const support = game.roster.find((monster) => monster.uid === uid);
  const synergy = activeZoneSynergy(game);
  showNotice("Support verbunden", synergy
    ? `${support ? getMonsterForm(support).name : "Das Monster"} aktiviert ${synergy.name}: ${synergy.description}.`
    : `${support ? getMonsterForm(support).name : "Das Monster"} ist im zweiten Expeditionsplatz. Für diese Zone passt die Rollenkombination noch nicht.`);
}

function selectZone(zoneId: string): void {
  if (!service.selectZone(zoneId)) return;
  battle = createBattleState();
  showNotice("Expeditionsziel geändert", `${getZone(zoneId).name} ist jetzt deine aktive Zone.`);
}

function chooseStarter(definitionId: string): void {
  if (!service.chooseStarter(definitionId)) return;
  starterDialogOpen = false;
  showLogin = false;
  showOfflineReport = true;
  activeView = "expedition";
  battle = createBattleState();
  const starter = activeMonster();
  showNotice("Resonanz verbunden", `${starter ? getMonsterForm(starter).name : "Dein Rookie"} ist dein erster Partner.`, "success");
}

function startIncubation(definitionId: string): void {
  if (!service.startIncubation(definitionId)) return;
  showNotice("Inkubation gestartet", `${getMonster(definitionId).name}-Ei wurde in Brutstation 01 eingesetzt.`);
}

function hatchIncubation(): void {
  const result = service.hatchIncubation();
  if (!result) return;
  const name = getMonster(result.definitionId).name;
  hatchNotice = result.kind === "discovery"
    ? `${name} wurde als neues Rookie-Monster in deine Sammlung aufgenommen.`
    : `${name} war bereits bekannt. Du erhältst ${result.fragments} ${name}-Fragmente.`;
  showNotice(result.kind === "discovery" ? "Neue Resonanz entdeckt" : "Fragmente gewonnen", hatchNotice, "success");
}

function accelerateIncubation(): void {
  if (service.useIncubatorCharge()) showNotice("Brutladung eingesetzt", "Die Inkubation wurde um 60 Sekunden verkürzt.", "success");
}

function setAvatar(avatarId: string): void {
  if (service.setAvatar(avatarId)) showNotice("Avatar gewechselt", `${AVATARS.find((avatar) => avatar.id === avatarId)?.name ?? "Avatar"} ist jetzt aktiv.`);
}

function setFrame(frameId: string): void {
  if (service.setFrame(frameId)) showNotice("Rahmen gewechselt", `${FRAMES.find((frame) => frame.id === frameId)?.name ?? "Rahmen"} ist jetzt aktiv.`);
}

function buyResearch(id: ResearchId): void {
  if (!service.buyResearch(id)) return;
  if (id === "power" || id === "vitality") battle = createBattleState();
  const definition = RESEARCH.find((entry) => entry.id === id);
  showNotice("Forschung abgeschlossen", `${definition?.name ?? "Projekt"} erreicht Stufe ${game.research[id]}.`, "success");
}

function claimMilestone(target: number): void {
  const milestone = MILESTONES.find((entry) => entry.target === target);
  if (service.claimMilestone(target)) showNotice("Story-Belohnung geborgen", `${milestone?.title ?? "Meilenstein"} wurde deinem Account gutgeschrieben.`, "success");
}

function claimObjective(objectiveId: string): void {
  const objective = OBJECTIVES.find((entry) => entry.id === objectiveId);
  if (!service.claimObjective(objectiveId)) return;
  showNotice("Belohnung geborgen", `${objective?.title ?? "Auftrag"} wurde deinem Inventar gutgeschrieben.`, "success");
}

function startTimedExpedition(slot: number, definitionId: string, monsterUid: string): void {
  const definition = getExpedition(definitionId);
  const monster = game.roster.find((entry) => entry.uid === monsterUid);
  if (!service.startExpedition(slot, definitionId, monsterUid)) return;
  showNotice("Expedition gestartet", `${monster ? getMonsterForm(monster).name : "Monster"} erkundet jetzt „${definition?.name ?? "unbekanntes Signal"}“.`, "success");
}

function claimTimedExpedition(expeditionId: string): void {
  const expedition = game.expeditions.find((entry) => entry.id === expeditionId);
  const definition = expedition ? getExpedition(expedition.definitionId) : undefined;
  const result = service.claimExpedition(expeditionId);
  if (!result) return;
  const itemCount = result.items.reduce((sum, item) => sum + item.amount, 0);
  showNotice("Expedition abgeschlossen", `${definition?.name ?? "Auftrag"}: ${result.gold} Gold${itemCount > 0 ? ` und ${itemCount} Materialien` : ""} gesichert.`, "success");
}

function craftRecipe(recipeId: string): void {
  const recipe = getCraftingRecipe(recipeId);
  if (!service.craftItem(recipeId)) return;
  const output = recipe ? ITEMS.find((item) => item.id === recipe.output.itemId) : undefined;
  showNotice("Herstellung abgeschlossen", `${recipe?.output.amount ?? 1}× ${output?.name ?? "Material"} wurde dem Inventar hinzugefügt.`, "success");
}

function updatePlayerSetting(key: keyof PlayerSettings, rawValue: string): void {
  const value = key === "numberFormat" ? rawValue : rawValue === "true";
  if (!service.setSetting(key, value as boolean | PlayerSettings["numberFormat"])) return;
  showNotice("Einstellung gespeichert", "Die Darstellung wurde sofort aktualisiert.", "success");
}

function advanceTutorial(skip = false): void {
  if (!service.advanceTutorial(skip)) return;
  render();
}

function claimSystemMessage(messageId: string): void {
  const message = SYSTEM_MESSAGES.find((entry) => entry.id === messageId);
  if (!service.claimSystemMessage(messageId)) return;
  showNotice("Systempost bestätigt", `${message?.title ?? "Nachricht"} wurde abgeschlossen.`, "success");
}

function openPrestigeScene(): void {
  setView("prestige");
}

function confirmPrestige(): void {
  if (prestigeActivating || prestigeCoreReward(game.runVictories) <= 0) return;
  prestigeActivating = true;
  render();
  window.setTimeout(() => {
    const reward = service.prestige();
    prestigeActivating = false;
    if (reward <= 0) return render();
    activeView = "expedition";
    battle = createBattleState();
    showNotice("Neue Zeitlinie gestartet", `${reward} permanenter Prestige-Kern wurde gesichert. Hyperlevel, Evolutionen und Gems sind erhalten.`, "success");
  }, 1_650);
}

function setView(view: View): void {
  if (game.roster.length === 0 && view !== "profile" && view !== "guild") {
    showLogin = false;
    starterDialogOpen = true;
    render();
    return;
  }
  showLogin = false;
  activeView = view;
  activeCombatPanel = null;
  combatFocusMode = false;
  window.scrollTo({ top: 0, behavior: "auto" });
  render();
}

function signIn(): void {
  if (clientUiState === "loading") return;
  showLogin = false;
  activeView = "expedition";
  if (game.roster.length === 0) {
    starterDialogOpen = true;
    render();
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
    return;
  }
  showOfflineReport = true;
  battle = createBattleState();
  render();
  window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
}

function icon(name: View | "home" | "shield" | "spark" | "arrow" | "check" | "eye"): string {
  const paths: Record<string, string> = {
    home: '<path d="M4 11.5 12 5l8 6.5V20h-5v-5H9v5H4z"/>',
    expedition: '<circle cx="12" cy="12" r="7"/><path d="m14.8 9.2-2 5.6-5.6 2 2-5.6z"/>',
    objectives: '<path d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h4"/><path d="m3.5 8 .8.8L6 7"/>',
    dispatch: '<path d="M4 18 9 6l3 5 3-8 5 15H4Z"/><path d="M7 18v2h10v-2M9 14h6"/>',
    habitat: '<path d="M7.2 11.5c-1.7 1-2.8 2.6-2.3 4.4.7 2.5 3.5 3.1 7.1 3.1s6.4-.6 7.1-3.1c.5-1.8-.6-3.4-2.3-4.4C15.6 10.8 14.6 10 12 10s-3.6.8-4.8 1.5Z"/><circle cx="6.5" cy="7.5" r="2"/><circle cx="11" cy="5.5" r="2"/><circle cx="17.5" cy="7.5" r="2"/>',
    incubation: '<path d="M12 3c4 0 7 7.1 7 11a7 7 0 0 1-14 0c0-3.9 3-11 7-11Z"/><path d="m8.5 12 2 2 4.5-5"/>',
    inventory: '<path d="M4 7h16v13H4z"/><path d="M8 7V4h8v3M4 12h16M10 12v3h4v-3"/>',
    research: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3"/><path d="M7.5 16h9"/>',
    guild: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 20c.3-4 2.3-6 6-6s5.7 2 6 6M15 15c3 0 4.7 1.7 5 4.5"/>',
    profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21c.4-5 3.1-7 8-7s7.6 2 8 7"/>',
    prestige: '<path d="M7 8c2-3 4-3 5 0s3 3 5 0M7 16c2 3 4 3 5 0s3-3 5 0"/>',
    shield: '<path d="M12 3 5 6v5c0 4.8 2.8 8 7 10 4.2-2 7-5.2 7-10V6z"/><path d="m9 12 2 2 4-4"/>',
    spark: '<path d="m12 2 1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5z"/>',
    arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    eye: '<path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/>',
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
}

function monsterAvatar(monster: MonsterInstance, side = "left", hit = false): string {
  const form = getMonsterForm(monster);
  const desiredFacing = side === "left" ? "right" : "left";
  const flipped = form.nativeFacing ? form.nativeFacing !== desiredFacing : desiredFacing === "left";
  return `
    <div class="monster-avatar monster-avatar--${side} ${flipped ? "is-flipped" : ""} ${hit ? "is-hit" : ""}" style="--monster-accent:${form.accent}">
      <span class="monster-avatar__glow"></span><span class="monster-avatar__platform"></span>
      ${form.sprite
        ? `<img class="monster-avatar__sprite" src="${form.sprite}" alt="${form.name}" width="200" height="200" draggable="false">`
        : `<span class="monster-avatar__body">${form.glyph}</span><small>${form.stage === "evolved" ? "EVOLUTIONS-ASSET FOLGT" : "UNKARTIERTES SIGNAL"}</small>`}
    </div>`;
}

function combatantName(definitionId: string): string {
  return findEncounter(definitionId)?.name ?? getMonster(definitionId).name;
}

function encounterAvatar(definitionId: string, side = "right", hit = false): string {
  const encounter = getEncounter(definitionId);
  const desiredFacing = side === "left" ? "right" : "left";
  const flipped = encounter.nativeFacing ? encounter.nativeFacing !== desiredFacing : desiredFacing === "left";
  return `<div class="monster-avatar monster-avatar--${side} ${flipped ? "is-flipped" : ""} ${hit ? "is-hit" : ""}" style="--monster-accent:${encounter.accent}">
    <span class="monster-avatar__glow"></span><span class="monster-avatar__platform"></span>
    ${encounter.sprite ? `<img class="monster-avatar__sprite" src="${encounter.sprite}" alt="${encounter.name}" width="200" height="200" draggable="false">` : `<span class="monster-avatar__body">${encounter.glyph}</span><small>${encounter.isBoss ? "BOSS-SIGNAL" : "WILDSIGNAL"}</small>`}
  </div>`;
}

function resourceIcon(kind: "gold" | "cores" | "eggs" | "fragments"): string {
  const label = { gold: "◆", cores: "◈", eggs: "○", fragments: "△" }[kind];
  return `<span class="resource-icon resource-icon--${kind}" aria-hidden="true">${label}</span>`;
}

function brandMarkup(compact = false): string {
  return `<span class="brand__mark"><i></i></span>${compact ? "" : `<span class="brand__copy"><strong>IDLE <span>TAMER</span></strong><small>ETHER PROTOCOL</small></span>`}`;
}

function navButton(view: View, label: string, locked = false): string {
  const shortLabel: Record<View, string> = { expedition: "Kampf", objectives: "Aufträge", dispatch: "Missionen", habitat: "Monster", incubation: "Brut", inventory: "Inventar", research: "Labor", guild: "Gilde", profile: "Profil", prestige: "Prestige" };
  return `<button class="nav-button ${activeView === view ? "is-active" : ""}" data-view="${view}" aria-label="${label}" aria-current="${activeView === view ? "page" : "false"}"><span>${icon(view)}</span><b><span class="nav-label-full">${label}</span><span class="nav-label-short">${shortLabel[view]}</span></b>${locked ? '<i title="Vorschau ab Rang 10">10</i>' : ""}</button>`;
}

function accountAvatar(size: "small" | "large" = "small"): string {
  const avatar = AVATARS.find((entry) => entry.id === game.profile.avatarId) ?? AVATARS[0];
  const frame = FRAMES.find((entry) => entry.id === game.profile.frameId) ?? FRAMES[0];
  return `<span class="account-avatar account-avatar--${size}" style="--avatar-a:${avatar.colors[0]};--avatar-b:${avatar.colors[1]};--frame-a:${frame.colors[0]};--frame-b:${frame.colors[1]}"><i>${avatar.glyph}</i></span>`;
}

function syncIndicator(): string {
  const healthy = service.lastSaveResult.ok && clientUiState !== "error";
  const copy = clientStatusCopy(clientUiState);
  return `<div class="sync-indicator ${healthy ? "is-synced" : "is-error"}" title="${copy.message}" data-testid="sync-indicator"><i></i><span><b>${healthy ? copy.title.toUpperCase() : "SPEICHERFEHLER"}</b><small>${healthy ? `${timeFormatter.format(game.lastSavedAt)} · ${servicePort.mode.toUpperCase()}` : "Browser-Speicher prüfen"}</small></span></div>`;
}

function clientStatusMarkup(): string {
  if (clientUiState === "local" || clientUiState === "online") return "";
  const copy = clientStatusCopy(clientUiState);
  if (clientUiState === "loading") return `<div class="client-state-overlay" role="status" data-testid="client-loading"><span class="client-state-spinner"></span><strong>${copy.title}</strong><small>${copy.message}</small></div>`;
  const actionLabel = copy.action === "reload" ? "NEUESTEN STAND LADEN" : "ERNEUT VERSUCHEN";
  return `<aside class="client-state-banner client-state-banner--${clientUiState}" role="alert" data-testid="client-${clientUiState}"><span>${icon(clientUiState === "conflict" ? "shield" : "spark")}</span><div><strong>${copy.title}</strong><small>${copy.message}</small></div><button class="secondary-button" id="client-state-action">${actionLabel}</button></aside>`;
}

function topShell(content: string): string {
  const rank = rankForVictories(game.totalVictories);
  return `
    <div class="app-shell app-shell--${activeView} app-shell--zone-${game.currentZoneId}">
      <div class="ambient ambient--game" aria-hidden="true"><i></i><i></i><i></i></div>
      <header class="topbar">
        <button class="brand" data-home aria-label="Zur Idle-Tamer-Homepage">${brandMarkup()}</button>
        <nav class="main-nav" aria-label="Spielbereiche">
          ${navButton("expedition", "Kampf")}${activeView === "objectives" ? navButton("objectives", "Aufträge") : ""}${navButton("dispatch", "Expeditionen")}${navButton("habitat", "Monster")}${navButton("incubation", "Brutstation")}${navButton("inventory", "Inventar")}${navButton("research", "Forschung")}${navButton("guild", "Gilde", rank < 10)}
        </nav>
        <div class="topbar__account">
          <div class="resources" aria-label="Ressourcen">
            <span title="Run-Gold">${resourceIcon("gold")}<b>${formatNumber(game.resources.gold)}</b></span>
            <span title="Prestige-Kerne">${resourceIcon("cores")}<b>${formatNumber(game.resources.cores)}</b></span>
          </div>
          <span class="rank-chip"><small>RANG</small>${rank}</span>
          <button class="profile-chip" data-view="profile" title="Profil, Avatar und Rahmen" aria-label="Profil öffnen">${accountAvatar()}</button>
        </div>
      </header>
      <main>${content}</main>
      <footer><div><span>VISUAL BUILD V2</span><i></i><span>SAVE V${game.version}</span><i></i><span>API PROTOKOLL ${API_PROTOCOL_VERSION}</span></div>${syncIndicator()}<button class="text-button" id="reset-game">Spielstand zurücksetzen</button></footer>
    </div>
    ${clientStatusMarkup()}${uiNoticeMarkup()}${starterDialog()}`;
}

function combatShell(content: string): string {
  return `
    <div class="combat-shell combat-shell--${game.currentZoneId} ${combatFocusMode ? "is-focus-mode" : ""}">${content}</div>
    ${clientStatusMarkup()}${uiNoticeMarkup()}${offlineReport()}${starterDialog()}`;
}

function prestigeShell(content: string): string {
  return `<div class="prestige-shell">${content}</div>${clientStatusMarkup()}${uiNoticeMarkup()}`;
}

function loginShell(): string {
  const previewMonster = activeMonster() ?? createMonster("pyrook", 1);
  const previewDefinition = getMonsterForm(previewMonster);
  return `
    <main class="login-screen" data-testid="login-screen">
      <div class="login-screen__backdrop" aria-hidden="true"></div>
      <section class="login-world" aria-label="Vorschau auf die Spielwelt">
        <div class="login-world__brand">${brandMarkup()}</div>
        <div class="login-world__copy">
          <span><i></i> ETHER-NETZWERK BEREIT</span>
          <h1>Dein Partner<br>kämpft weiter.</h1>
          <p>Einloggen, Offline-Beute sichern und direkt zurück in die laufende Expedition.</p>
        </div>
        <div class="login-world__monster">${monsterAvatar(previewMonster, "left")}<div><small>LETZTE RESONANZ</small><strong>${previewDefinition.name}</strong><span>LV ${previewMonster.level} · HYPER ${previewMonster.hyperLevel}</span></div></div>
        <div class="login-world__status"><span><i></i> AUTOMATISCHE EXPEDITION</span><small>Violetter Saum · Signal stabil</small></div>
      </section>
      <section class="login-panel" aria-labelledby="login-title">
        <div class="login-panel__mobile-brand">${brandMarkup()}</div>
        <span class="eyebrow">ACCOUNT-ZUGANG</span>
        <h2 id="login-title">Willkommen zurück.</h2>
        <p>Deine Expedition hat während deiner Abwesenheit weiter Ressourcen gesammelt.</p>
        <form id="login-form" class="login-form">
          <label for="login-identifier"><span>E-MAIL ODER TAMER-NAME</span><input id="login-identifier" name="identifier" type="text" autocomplete="username" value="demo@idletamer.local" required></label>
          <label for="login-password"><span>PASSWORT</span><input id="login-password" name="password" type="password" autocomplete="current-password" value="demo" required></label>
          <div class="login-form__meta"><label><input type="checkbox" checked> <span>Angemeldet bleiben</span></label><button type="button" disabled>Passwort vergessen</button></div>
          <button class="primary-button primary-button--large login-submit" type="submit" data-testid="login-submit" ${clientUiState === "loading" ? "disabled" : ""}>${clientUiState === "loading" ? "SPIELSTAND WIRD GELADEN …" : `EINLOGGEN ${icon("arrow")}`}</button>
        </form>
        <div class="login-panel__backend"><span>${icon("shield")}</span><div><strong>Lokaler Prototyp-Zugang</strong><small>Der Formularvertrag ist für die spätere Account-API vorbereitet. Aktuell bleibt der Spielstand in diesem Browser.</small></div></div>
        <small class="login-panel__version">CLIENT V0.1 · SAVE V${game.version} · API ${API_PROTOCOL_VERSION} · CONTENT ${CONTENT_RELEASE_ID}</small>
      </section>
    </main>
    ${clientStatusMarkup()}${uiNoticeMarkup()}${starterDialog()}`;
}

function combatZoneTabs(): string {
  return `<nav class="combat-zone-tabs" aria-label="Expeditionszonen">${ZONES.map((zone, index) => {
    const unlocked = game.unlockedZoneIds.includes(zone.id);
    const progress = game.zoneProgress[zone.id] ?? { stage: 1, clears: 0 };
    return `<button class="combat-zone-tab ${zone.id === game.currentZoneId ? "is-active" : ""}" data-zone="${zone.id}" ${unlocked ? "" : "disabled"} style="--zone-accent:${zone.accent}" aria-label="${zone.name}${unlocked ? `, Stage ${progress.stage}` : ", verschlossen"}">
      <span>0${index + 1}</span><div><strong>${zone.name}</strong><small>${unlocked ? `STAGE ${progress.stage}/${zone.stages}` : "VERSCHLOSSEN"}</small></div><i></i>
    </button>`;
  }).join("")}</nav>`;
}

function combatRail(): string {
  const entries: Array<[View, string]> = [
    ["expedition", "Kampf"],
    ["habitat", "Monster"],
    ["incubation", "Brut"],
    ["inventory", "Inventar"],
    ["research", "Forschung"],
    ["dispatch", "Missionen"],
  ];
  return `<nav class="combat-rail" aria-label="Spielbereiche">${entries.map(([view, label]) => `<button class="${view === "expedition" ? "is-active" : ""}" data-view="${view}" title="${label}" aria-label="${label}">${icon(view)}<span>${label}</span></button>`).join("")}</nav>`;
}

function combatMonsterSelector(): string {
  return `<section class="combat-monster-selector combat-panel--monsters ${activeCombatPanel === "monsters" ? "is-open" : ""}"><div class="combat-monster-selector__label"><span class="eyebrow">FRONT WÄHLEN</span><small>Wechsel startet das Duell neu</small></div><div class="combat-monster-options">${game.roster.map((monster) => {
    const definition = getMonsterForm(monster);
    const selected = monster.uid === game.activeMonsterUid;
    const dispatched = isMonsterDispatched(game, monster.uid);
    return `<button class="combat-monster-option ${selected ? "is-active" : ""}" data-active="${monster.uid}" ${selected || dispatched ? "disabled" : ""} style="--monster-accent:${definition.accent}" title="${dispatched ? "Monster ist auf Expedition" : `${definition.name} als Front wählen`}">${monsterAvatar(monster)}<span><strong>${definition.name}</strong><small>LV ${monster.level} · ${COMBAT_ROLE_LABELS[definition.combatRole]}</small></span>${selected ? "<i>AKTIV</i>" : dispatched ? "<i>ENTSANDT</i>" : ""}</button>`;
  }).join("")}</div><button class="combat-manage-team" data-view="habitat">DUO &amp; LEVEL ${icon("arrow")}</button></section>`;
}

function combatControlDock(claimable: boolean, cacheEmpty: boolean): string {
  const controls: Array<{ panel: CombatPanel; label: string; iconName: View | "spark"; badge?: string }> = [
    { panel: "missions", label: "Ziele", iconName: "spark", badge: claimable ? "!" : undefined },
    { panel: "loot", label: "Beute", iconName: "inventory", badge: cacheEmpty ? undefined : String(game.cacheSlotsUsed) },
    { panel: "duo", label: "Duo", iconName: "habitat", badge: game.supportMonsterUid ? undefined : "+" },
    { panel: "monsters", label: "Front", iconName: "profile" },
    { panel: "log", label: "Kampflog", iconName: "expedition" },
  ];
  return `<nav class="combat-control-dock" aria-label="Kampfoptionen">${controls.map((control) => `<button class="${activeCombatPanel === control.panel ? "is-active" : ""}" data-combat-panel="${control.panel}" aria-pressed="${activeCombatPanel === control.panel}" title="${control.label}">${icon(control.iconName)}<span>${control.label}</span>${control.badge ? `<i>${control.badge}</i>` : ""}</button>`).join("")}<button class="combat-focus-button ${combatFocusMode ? "is-active" : ""}" id="combat-focus-toggle" aria-pressed="${combatFocusMode}" title="${combatFocusMode ? "HUD einblenden" : "Fokusmodus"}">${icon("eye")}<span>${combatFocusMode ? "HUD ein" : "Fokus"}</span></button></nav>`;
}

function tutorialCoach(): string {
  if (game.tutorialStep >= 4) return "";
  const steps = [
    { kicker: "SCHRITT 1 · KAMPF", title: "Dein Monster kämpft automatisch.", copy: "Es gibt keine Angriffstaste und kein Tempo-Menü. Du entscheidest über Team, Level und Ausrüstung." },
    { kicker: "SCHRITT 2 · BEUTE", title: "Der Kampfspeicher ist begrenzt.", copy: "Siege laufen weiter, aber ein voller Speicher erzeugt keine neue Beute. Öffne links „Beute“ und sammle regelmäßig ein." },
    { kicker: "SCHRITT 3 · SAMMLUNG", title: "Eier bringen neue Monster oder Fragmente.", copy: "Der erste Schlupf schaltet die Art frei. Jedes weitere Ei derselben Art wird zu permanenten Fragmenten." },
    { kicker: "SCHRITT 4 · DAUERHAFT", title: "Hyperlevel, Evolution und Gems bleiben.", copy: "Normale Gold-Level gehen beim Prestige verloren. Deine wichtigen langfristigen Verbesserungen bleiben erhalten." },
  ];
  const step = steps[game.tutorialStep];
  return `<aside class="tutorial-coach panel" role="dialog" aria-label="Kurze Spieleinführung"><span>${icon("spark")}</span><div><small>${step.kicker}</small><strong>${step.title}</strong><p>${step.copy}</p><i>${steps.map((_, index) => `<em class="${index <= game.tutorialStep ? "is-active" : ""}"></em>`).join("")}</i></div><div><button class="text-button" id="skip-tutorial">ÜBERSPRINGEN</button><button class="primary-button" id="advance-tutorial">${game.tutorialStep === 3 ? "VERSTANDEN" : "WEITER"}</button></div></aside>`;
}

function expeditionView(): string {
  const player = activeMonster();
  if (!player || !battle) return starterGate();
  const playerDefinition = getMonsterForm(player);
  const playerLineage = getMonster(player.definitionId);
  const enemyDefinition = getEncounter(battle.enemyDefinitionId);
  const support = game.roster.find((monster) => monster.uid === game.supportMonsterUid) ?? null;
  const zoneSynergy = activeZoneSynergy(game);
  const playerHpPercent = Math.max(0, (battle.playerHp / battle.playerMaxHp) * 100);
  const enemyHpPercent = Math.max(0, (battle.enemyHp / battle.enemyMaxHp) * 100);
  const chapter = currentChapter(game.totalVictories);
  const claimable = MILESTONES.find((milestone) => game.totalVictories >= milestone.target && !game.claimedMilestones.includes(milestone.target));
  const upcoming = nextMilestone(game.totalVictories);
  const previousTarget = upcoming ? [...MILESTONES].reverse().find((milestone) => milestone.target < upcoming.target)?.target ?? 0 : 0;
  const missionPercent = upcoming ? Math.min(100, ((game.totalVictories - previousTarget) / (upcoming.target - previousTarget)) * 100) : 100;
  const pendingMaterialCount = Object.values(game.pendingItems).reduce((sum, amount) => sum + amount, 0);
  const pendingFindCount = pendingMaterialCount + game.pendingGems.length;
  const cacheEmpty = game.pendingGold === 0 && game.pendingEggs.length === 0 && pendingFindCount === 0;
  const capacity = cacheCapacity(game.research.extraction);
  const prestigeReward = prestigeCoreReward(game.runVictories);
  const prestigeProgress = Math.min(100, game.runVictories);
  const readyObjectives = OBJECTIVES.filter((objective) => isObjectiveClaimable(game, objective)).length;
  const eggGuarantee = Math.max(1, BALANCE.drops.eggPityMisses + 1 - game.eggPity);
  const zone = getZone(game.currentZoneId);
  const zoneNumber = ZONES.findIndex((entry) => entry.id === zone.id) + 1;
  const zoneProgress = game.zoneProgress[zone.id] ?? { stage: 1, clears: 0 };
  const bossStage = zoneProgress.stage >= zone.stages;
  const playerAttackProgress = battle.status === "fighting" ? Math.max(3, Math.min(100, 100 - ((battle.playerNextAttackAt - performance.now()) / 1_650) * 100)) : 100;
  const rank = rankForVictories(game.totalVictories);

  return `
    <main class="combat-main" data-testid="combat-scene">
      <section class="combat-battlefield battle-stage battle-stage--${zone.id} battle-stage--${battle.status}">
        <div class="battle-stage__sky" aria-hidden="true"><i></i><i></i><i></i></div>
        <div class="combat-vignette" aria-hidden="true"></div>
        <header class="combat-top-hud">
          <div class="combat-brand">${brandMarkup()}</div>
          ${combatZoneTabs()}
          <div class="combat-account"><div class="resources"><span title="Run-Gold">${resourceIcon("gold")}<b>${formatNumber(game.resources.gold)}</b></span><span title="Prestige-Kerne">${resourceIcon("cores")}<b>${formatNumber(game.resources.cores)}</b></span></div><span class="rank-chip"><small>RANG</small>${rank}</span><button class="profile-chip" data-view="profile" title="Profil öffnen">${accountAvatar()}</button></div>
        </header>
        ${combatRail()}
        <section class="combat-story-hud combat-panel--missions ${activeCombatPanel === "missions" ? "is-open" : ""}"><span class="combat-story-hud__chapter">${String(chapter.chapter).padStart(2, "0")}</span><div><small>AKTUELLES SIGNAL · RUN ${game.runVictories}</small><strong>${chapter.title}</strong><p>${chapter.story}</p></div></section>
        <div class="combat-world-label"><small>ZONE ${String(zoneNumber).padStart(2, "0")} · ${bossStage ? "BOSS-SIGNAL" : `STAGE ${zoneProgress.stage}/${zone.stages}`}</small><strong>${zone.name}</strong><span>${zone.subtitle}</span></div>
        ${battle.status !== "fighting" ? `<div class="battle-state-banner battle-state-banner--${battle.status}"><small>${battle.status === "victory" ? "SIGNAL GESICHERT" : "RESONANZ WIRD NEU GEKOPPELT"}</small><strong>${battle.status === "victory" ? "STAGE GESCHAFFT" : "REGENERATION"}</strong></div>` : ""}
        <div class="combat-duel">
          <div class="fighter fighter--player"><div class="nameplate"><div><span><small>DEINE RESONANZ</small><strong>${playerDefinition.name}</strong></span><b>LV ${player.level}<i>H${player.hyperLevel}</i></b></div><div class="hp-track"><i style="width:${playerHpPercent}%"></i></div><small>${battle.playerHp} / ${battle.playerMaxHp} HP</small></div>${monsterAvatar(player, "left", battle.playerHit && game.settings.combatEffects)}${battle.playerHit && game.settings.combatEffects ? `<span class="impact-number impact-number--player">−${battle.playerDamageTaken}</span>` : ""}</div>
          <div class="versus"><span>VS</span><small>AUTO</small></div>
          <div class="fighter fighter--enemy"><div class="nameplate"><div><span><small>${bossStage ? "ZONENBOSS" : "WILDSIGNAL"}</small><strong>${enemyDefinition.name}</strong></span><b>LV ${battle.enemyLevel}</b></div><div class="hp-track hp-track--enemy"><i style="width:${enemyHpPercent}%"></i></div><small>${battle.enemyHp} / ${battle.enemyMaxHp} HP</small></div>${encounterAvatar(enemyDefinition.id, "right", battle.enemyHit && game.settings.combatEffects)}${battle.enemyHit && game.settings.combatEffects ? `<span class="impact-number impact-number--enemy">−${battle.enemyDamageTaken}</span>` : ""}</div>
        </div>
        <aside class="combat-loot-hud combat-panel--loot ${activeCombatPanel === "loot" ? "is-open" : ""} ${cacheEmpty ? "is-empty" : "has-loot"}"><div class="combat-hud-heading"><span><i></i>KAMPFSPEICHER</span><small>${game.cacheSlotsUsed}/${capacity}</small></div><div class="combat-loot-values"><span>${resourceIcon("gold")}<small>GOLD</small><b>${formatNumber(game.pendingGold)}</b></span><span>${resourceIcon("eggs")}<small>EIER</small><b>${game.pendingEggs.length}</b></span><span>${icon("inventory")}<small>FUNDE</small><b>${pendingFindCount}</b></span></div><div class="combat-capacity"><i style="width:${Math.min(100, (game.cacheSlotsUsed / capacity) * 100)}%"></i></div><button class="primary-button" id="collect-cache" ${cacheEmpty ? "disabled" : ""}>${cacheEmpty ? "SPEICHER LEER" : `EINSAMMELN ${icon("arrow")}`}</button></aside>
        <aside class="combat-duo-hud combat-panel--duo ${activeCombatPanel === "duo" ? "is-open" : ""}"><div class="combat-hud-heading"><span>EXPEDITIONS-DUO</span><small>${elementLabel[playerLineage.element]}</small></div><div class="combat-duo-line"><div>${monsterAvatar(player)}<span><small>FRONT · ${COMBAT_ROLE_LABELS[playerDefinition.combatRole]}</small><strong>${playerDefinition.name}</strong></span></div><i>+</i><button data-view="habitat">${support ? `${monsterAvatar(support)}<span><small>SUPPORT · ${COMBAT_ROLE_LABELS[getMonsterForm(support).combatRole]}</small><strong>${getMonsterForm(support).name}</strong></span>` : `<b>+</b><span><small>SUPPORT FREI</small><strong>Zuweisen</strong></span>`}</button></div><div class="combat-synergy ${zoneSynergy ? "is-active" : ""}"><small>${zoneSynergy ? "ZONENBONUS AKTIV" : "ROLLEN KOMBINIEREN"}</small><strong>${zoneSynergy?.name ?? "Noch kein Duo-Bonus"}</strong><span>${zoneSynergy?.description ?? zone.synergies.map((entry) => `${COMBAT_ROLE_LABELS[entry.roles[0]]} + ${COMBAT_ROLE_LABELS[entry.roles[1]]}`).join(" oder ")}</span></div><div class="combat-mini-stats"><span><small>ATK</small><b>${playerAttack(player, game.research.power, zoneSynergy?.attackPercent)}</b></span><span><small>HP</small><b>${playerMaxHp(player, game.research.vitality, zoneSynergy?.hpPercent)}</b></span><span><small>EI IN</small><b>≤ ${eggGuarantee}</b></span></div><button class="combat-dispatch-link" data-view="dispatch">ZEIT-EXPEDITIONEN · ${game.expeditions.length}/${EXPEDITION_SLOT_COUNT} AKTIV ${icon("arrow")}</button></aside>
        <section class="combat-objective-hud combat-panel--missions ${activeCombatPanel === "missions" ? "is-open" : ""}">${claimable ? `<div><small>STORY-BELOHNUNG BEREIT</small><strong>${claimable.title}</strong><span>${claimable.reward.gold} Gold${claimable.reward.eggId ? ` · ${getMonster(claimable.reward.eggId).name}-Ei` : ""}</span></div><button class="primary-button" data-milestone="${claimable.target}">BERGEN</button>` : upcoming ? `<div><small>NÄCHSTER STORY-KNOTEN</small><strong>${upcoming.title}</strong><span>${game.totalVictories} / ${upcoming.target} Siege</span></div><div class="combat-objective-progress"><i style="width:${missionPercent}%"></i></div>` : `<div><small>KAPITEL ABGESCHLOSSEN</small><strong>Das nächste Signal wartet.</strong><span>500 / 500 Siege</span></div>`}<button class="combat-objectives-link" data-view="objectives"><span>${icon("objectives")}</span><div><small>AUFTRAGSZENTRALE</small><strong>${readyObjectives > 0 ? `${readyObjectives} BELOHNUNG${readyObjectives === 1 ? "" : "EN"} BEREIT` : "TÄGLICH · WÖCHENTLICH · ERFOLGE"}</strong></div></button><button class="combat-prestige" id="start-prestige"><span>∞</span><div><small>ETHER-KRISTALL ${game.runVictories}/100</small><strong>${prestigeReward > 0 ? `${prestigeReward} KERN${prestigeReward === 1 ? "" : "E"} BEREIT` : "PRESTIGE ANSEHEN"}</strong><i><em style="width:${prestigeProgress}%"></em></i></div></button></section>
        ${combatMonsterSelector()}
        <section class="combat-console-hud combat-panel--log ${activeCombatPanel === "log" ? "is-open" : ""}"><div class="combat-console-status"><span class="status-orb ${battle.status}"></span><div><strong>${battle.status === "victory" ? "STAGE GESCHAFFT" : battle.status === "recovering" ? "REGENERATION" : "KAMPF LÄUFT"}</strong><small>${battle.log[0]}</small></div></div><div class="combat-attack-cycle"><span><small>NÄCHSTE AKTION</small><b>${playerDefinition.name}</b></span><div><i style="width:${playerAttackProgress}%"></i></div></div><small class="combat-save-state"><i></i>${service.lastSaveResult.ok ? "LOKAL GESICHERT" : "SPEICHERFEHLER"}</small></section>
        ${combatControlDock(Boolean(claimable), cacheEmpty)}
        ${tutorialCoach()}
      </section>
    </main>`;
}

function pageHeading(kicker: string, title: string, copy: string, meta: string): string {
  return `<div class="page-heading"><div><span class="eyebrow">${kicker}</span><h1>${title}</h1><p>${copy}</p></div><span class="page-heading__meta">${meta}</span></div>`;
}

function habitatView(): string {
  if (game.roster.length === 0) return starterGate();
  const active = activeMonster();
  return `<section class="page">${pageHeading("SAMMLUNG · ENTWICKLUNG", "Monster-Habitat", "Run-Level kosten Gold. Evolutionen, Hyperlevel, Fragmente und eingesetzte Gems bleiben dauerhaft auf deinem Account.", `${game.roster.length} ENTDECKT · ${game.roster.length}/10 ARCHIV`)}${active ? gemLoadout(active) : ""}<div class="roster-grid">${game.roster.map(monsterCard).join("")}<div class="empty-slot"><span>${icon("spark")}</span><strong>Unbekannte Resonanz</strong><small>Weitere Rookie-Monster schlüpfen aus Eiern des Hauptkampfs.</small></div></div></section>`;
}

function gemEffect(gemId: string): string {
  const gem = getGem(gemId);
  if (!gem) return "Unbekannter Effekt";
  return [gem.attackPercent ? `+${gem.attackPercent}% ATK` : "", gem.hpPercent ? `+${gem.hpPercent}% HP` : ""].filter(Boolean).join(" · ");
}

function gemLoadout(monster: MonsterInstance): string {
  const definition = getMonsterForm(monster);
  const shapes: GemShape[] = ["triangle", "square", "diamond"];
  const available = GEMS.filter((gem) => (game.gemInventory[gem.id] ?? 0) > 0);
  const bonuses = monsterGemBonuses(monster);
  return `<section class="gem-workbench panel">
    <div class="gem-workbench__heading"><div><span class="eyebrow">GEM-AUSRÜSTUNG · PERMANENT</span><h2>${definition.name}s Grundwerte</h2><p>Jede Form besitzt drei feste Slots. Die Form liefert die Basis, der Gem verstärkt sie.</p></div><span><small>AKTIVER BONUS</small><b>+${bonuses.attackPercent}% ATK · +${bonuses.hpPercent}% HP</b></span></div>
    <div class="gem-loadout">${shapes.map((shape) => {
      const gemId = monster.gemSlots[shape];
      const gem = gemId ? getGem(gemId) : undefined;
      return `<article class="gem-slot ${gem ? "is-filled" : ""}" style="--gem-color:${gem ? GEM_COLORS[gem.color].hex : "#938da0"}">${gem ? `<img src="${gem.image}" alt="${gem.name}"><div><small>${GEM_SHAPES[shape].name.toUpperCase()} · ${GEM_RARITIES[gem.rarity].name.toUpperCase()}</small><strong>${gem.name}</strong><span>${gemEffect(gem.id)}</span></div><button data-unequip-gem="${gem.id}" data-monster="${monster.uid}" aria-label="${gem.name} ablegen">×</button>` : `<span>${GEM_SHAPES[shape].glyph}</span><div><small>${GEM_SHAPES[shape].name.toUpperCase()}-SLOT</small><strong>Noch leer</strong><span>${shape === "triangle" ? "Angriff" : shape === "square" ? "Leben" : "Ausgewogen"}</span></div>`}</article>`;
    }).join("")}</div>
    <div class="gem-inventory"><div><span class="eyebrow">VERFÜGBARE GEMS</span><small>Farben bilden später Element-Sets. Form und Seltenheit bestimmen schon jetzt den Effekt.</small></div>${available.length > 0 ? `<div class="gem-inventory__grid">${available.map((gem) => `<button class="gem-chip gem-chip--${gem.rarity}" data-equip-gem="${gem.id}" data-monster="${monster.uid}" style="--gem-color:${GEM_COLORS[gem.color].hex}"><img src="${gem.image}" alt=""><span><small>${GEM_RARITIES[gem.rarity].name}</small><strong>${gem.name}</strong><em>${gemEffect(gem.id)} · ${game.gemInventory[gem.id]}×</em></span></button>`).join("")}</div>` : `<span class="gem-inventory__empty">Alle verfügbaren Gems sind eingesetzt. Zonenbosse können neue Gems hinterlassen.</span>`}</div>
  </section>`;
}

function monsterCard(monster: MonsterInstance): string {
  const lineage = getMonster(monster.definitionId);
  const definition = getMonsterForm(monster);
  const isActive = monster.uid === game.activeMonsterUid;
  const isSupport = monster.uid === game.supportMonsterUid;
  const normalCost = levelCost(monster.level);
  const permanentCost = hyperLevelCost(monster.hyperLevel);
  const fragments = game.fragments[monster.definitionId] ?? 0;
  const evolutionReady = canEvolve(monster, game.inventory.evolution_core, fragments);
  const bonuses = monsterGemBonuses(monster);
  return `<article class="monster-card panel ${isActive ? "is-active" : ""} ${isSupport ? "is-support" : ""}" style="--monster-accent:${definition.accent}"><div class="monster-card__top"><span>${elementLabel[lineage.element]} · ${COMBAT_ROLE_LABELS[definition.combatRole]}</span><small>${EVOLUTION_LABELS[monster.evolution]} · GEN ${monster.generation}</small></div>${monsterAvatar(monster)}<div class="monster-card__body"><div><h3>${definition.name}</h3><span>${definition.role}</span></div>${isActive ? '<b class="active-badge">FRONT</b>' : isSupport ? '<b class="active-badge active-badge--support">SUPPORT</b>' : ""}<div class="stat-line"><span><small>RUN-LEVEL</small><b>${monster.level}</b></span><span><small>HYPER</small><b>${monster.hyperLevel}</b></span><span><small>HP</small><b>${monsterMaxHp(monster)}</b></span><span><small>ATK</small><b>${monsterAttack(monster)}</b></span></div><small class="gem-stat-note">GEMS · +${bonuses.attackPercent}% ATK · +${bonuses.hpPercent}% HP</small>${monster.evolution === "rookie" ? `<div class="evolution-line"><span><small>NÄCHSTE FORM</small><b>${lineage.evolution.name}</b></span><em>Level ${BALANCE.evolution.requiredLevel} · ${BALANCE.evolution.coreCost} Kerne · ${BALANCE.evolution.fragmentCost} Fragmente</em><button class="evolve-button" data-evolve="${monster.uid}" ${evolutionReady ? "" : "disabled"}>EVOLUTION</button></div>` : `<div class="evolution-line is-complete"><span><small>EVOLUTION PERMANENT</small><b>${lineage.name} → ${lineage.evolution.name}</b></span><em>Bestimmt neue Grundwerte und bleibt bei Prestige erhalten</em></div>`}<div class="fragment-line">${resourceIcon("fragments")}<span><small>ART-FRAGMENTE</small><b>${fragments} VERFÜGBAR</b></span><i><em style="width:${Math.min(100, (fragments / permanentCost) * 100)}%"></em></i></div></div><div class="monster-card__actions"><button class="secondary-button" data-active="${monster.uid}" ${isActive ? "disabled" : ""}>${isActive ? "FRONT AKTIV" : "ALS FRONT"}</button><button class="secondary-button" data-support="${monster.uid}" ${isSupport || isActive ? "disabled" : ""}>${isSupport ? "SUPPORT AKTIV" : "ALS SUPPORT"}</button><button class="primary-button" data-level="${monster.uid}" ${game.resources.gold < normalCost ? "disabled" : ""}>RUN-LEVEL +1 <small>${normalCost} G · RESET</small></button><button class="secondary-button" data-train="${monster.uid}" ${game.inventory.training_data <= 0 ? "disabled" : ""}>DATEN +1 <small>${game.inventory.training_data}×</small></button><button class="secondary-button" data-hyper="${monster.uid}" ${fragments < permanentCost ? "disabled" : ""}>HYPER +1 <small>${permanentCost} F · PERMANENT</small></button></div></article>`;
}

function incubationView(): string {
  const incubation = game.incubation;
  const ready = incubation ? Date.now() >= incubation.hatchAt : false;
  const remaining = incubation ? Math.max(0, Math.ceil((incubation.hatchAt - Date.now()) / 1000)) : 0;
  const eggEntries = Object.entries(game.eggInventory).filter(([, amount]) => amount > 0);
  const progress = incubation ? Math.min(100, ((Date.now() - incubation.startedAt) / (incubation.hatchAt - incubation.startedAt)) * 100) : 0;
  return `<section class="page">${pageHeading("INKUBATION · SAMMLUNG", "Ether-Brutstation", "Eier stammen ausschließlich aus Expeditionen. Erstschlüpfe erweitern die Sammlung, Duplikate liefern permanente Art-Fragmente.", `${eggEntries.reduce((sum, [, amount]) => sum + amount, 0)} EIER · 1 INKUBATOR`)}${hatchNotice ? `<div class="hatch-notice panel"><span>${icon("spark")}</span><div><strong>SCHLUPF ABGESCHLOSSEN</strong><small>${hatchNotice}</small></div><button id="close-hatch-notice" aria-label="Hinweis schließen">×</button></div>` : ""}<div class="incubator-layout"><section class="incubator-panel panel"><div class="card-heading"><span class="eyebrow">BRUTSTATION 01</span><span class="soft-chip ${incubation ? "is-live" : ""}">${incubation ? "AKTIV" : "BEREIT"}</span></div>${incubation ? `<div class="incubator-active"><div class="egg-chamber"><i></i><div class="egg-visual is-running"><span></span></div><b>${Math.round(progress)}%</b></div><div><span class="eyebrow">RESONANZAUFBAU</span><h2>${getMonster(incubation.definitionId).name}-Ei</h2><p>${ready ? "Die Etherschale ist offen. Das Monster kann jetzt schlüpfen." : `Das Ei wird stabilisiert. Noch ungefähr ${remaining} Sekunden.`}</p><div class="mission-progress"><i style="width:${progress}%"></i></div><button class="primary-button" id="hatch-egg" ${ready ? "" : "disabled"}>${ready ? `EI ÖFFNEN ${icon("spark")}` : `NOCH ${remaining}s`}</button>${ready ? "" : `<button class="secondary-button" id="accelerate-incubation" ${game.inventory.incubator_charge <= 0 ? "disabled" : ""}>BRUTLADUNG −60s · ${game.inventory.incubator_charge}×</button>`}</div></div>` : `<div class="incubator-empty"><div class="egg-chamber"><i></i><div class="egg-visual"><span></span></div></div><h2>Die Kammer ist frei.</h2><p>Wähle ein Ei aus deinem Inventar, um die Resonanz aufzubauen.</p></div>`}</section><aside class="gene-note panel"><span class="eyebrow">PERMANENTER KREISLAUF</span><h2>Jeder Schlupf zählt.</h2><p>Ein Ei ist niemals wertlos. Bekannte Arten werden automatisch zu den Fragmenten genau dieser Monsterlinie.</p><ol><li><b>01</b><span>Ei in der Expedition finden</span></li><li><b>02</b><span>Neue Art erstmals freischalten</span></li><li><b>03</b><span>Duplikate in 10 Fragmente wandeln</span></li><li><b>04</b><span>Hyperlevel oder Evolution bezahlen</span></li></ol></aside></div><div class="subsection-heading"><div><span class="eyebrow">EI-INVENTAR</span><h2>Gesicherte Signale</h2></div><span>ARTSPEZIFISCH · NICHT HANDELBAR</span></div><div class="egg-grid">${eggEntries.length > 0 ? eggEntries.map(([definitionId, amount]) => eggCard(definitionId, amount)).join("") : `<div class="empty-slot empty-slot--wide"><span>${icon("incubation")}</span><strong>Noch keine Eier im Inventar</strong><small>Kämpfe weiter oder sammle deinen Kampfspeicher ein.</small><button class="secondary-button" data-view="expedition">ZUR EXPEDITION</button></div>`}</div></section>`;
}

function eggCard(definitionId: string, amount: number): string {
  const definition = getMonster(definitionId);
  const known = game.roster.some((monster) => monster.definitionId === definitionId);
  return `<article class="egg-card panel" style="--monster-accent:${definition.accent}"><div class="egg-visual egg-visual--small"><span></span></div><div><span class="eyebrow">${known ? "BEKANNT · +10 FRAGMENTE" : "NEUER ARCHIV-EINTRAG"}</span><h3>${definition.name}-Ei</h3><p>${elementLabel[definition.element]} · ${amount} im Bestand</p></div><span class="quantity-chip">×${amount}</span><button class="primary-button" data-incubate="${definitionId}" ${game.incubation ? "disabled" : ""}>INKUBIEREN ${icon("arrow")}</button></article>`;
}

function craftingWorkbench(): string {
  return `<section class="crafting-workbench panel"><div class="crafting-workbench__heading"><span>${icon("research")}</span><div><small>ETHERWERKSTATT · FESTE REZEPTE</small><h2>Materialien veredeln</h2><p>Jedes Ergebnis ist garantiert. Kosten und Ausgabe werden später in einer einzigen SQL-Transaktion gebucht.</p></div><strong>${game.inventory.ether_dust}× ETHERSTAUB</strong></div><div class="crafting-recipes">${CRAFTING_RECIPES.map((recipe) => {
    const output = ITEMS.find((item) => item.id === recipe.output.itemId);
    const available = canCraft(game, recipe);
    const costs = [`${recipe.goldCost} Gold`, ...Object.entries(recipe.itemCosts).map(([itemId, amount]) => `${amount}× ${ITEMS.find((item) => item.id === itemId)?.name ?? itemId}`)];
    return `<article class="crafting-recipe ${available ? "is-ready" : ""}"><span class="crafting-recipe__output">${output?.icon ?? "◇"}</span><div><small>${recipe.output.amount}× ${output?.name ?? recipe.output.itemId}</small><h3>${recipe.name}</h3><p>${recipe.description}</p></div><div class="crafting-recipe__cost"><small>KOSTEN</small><strong>${costs.join(" · ")}</strong></div><button class="${available ? "primary-button" : "secondary-button"}" data-craft="${recipe.id}" ${available ? "" : "disabled"}>${available ? "HERSTELLEN" : "MATERIAL FEHLT"}</button></article>`;
  }).join("")}</div></section>`;
}

function inventoryView(): string {
  const active = activeMonster();
  const totalItems = Object.values(game.inventory).reduce((sum, amount) => sum + amount, 0);
  return `<section class="page">${pageHeading("BEUTE · MATERIALIEN", "Inventar", "Hier landet alles, was du aus dem Kampfspeicher einsammelst. Materialien sind nach Einsatz und Quelle getrennt.", `${totalItems} MATERIALIEN · ${Object.values(game.eggInventory).reduce((sum, amount) => sum + amount, 0)} EIER`)}
    <div class="inventory-summary panel"><div><span class="eyebrow">KAMPFSPEICHER</span><strong>${game.cacheSlotsUsed} / ${cacheCapacity(game.research.extraction)} Plätze belegt</strong><small>${Object.values(game.pendingItems).reduce((sum, amount) => sum + amount, 0)} Materialien, ${game.pendingEggs.length} Eier und ${game.pendingGems.length} Gems warten auf Abholung.</small></div><button class="primary-button" id="collect-cache" ${game.cacheSlotsUsed === 0 && game.pendingGold === 0 && game.pendingGems.length === 0 ? "disabled" : ""}>BEUTE EINSAMMELN ${icon("arrow")}</button></div>
    <div class="item-grid">${ITEMS.map((item) => `<article class="item-card panel item-card--${item.rarity.toLowerCase()}"><span class="item-card__icon">${item.icon}</span><div><span class="eyebrow">${item.rarity.toUpperCase()}</span><h2>${item.name}</h2><p>${item.description}</p><small>QUELLE · ${item.source}</small></div><b class="item-count">${game.inventory[item.id]}×</b>${item.action === "train" && active ? `<button class="secondary-button" data-train="${active.uid}" ${game.inventory[item.id] <= 0 ? "disabled" : ""}>${getMonsterForm(active).name} TRAINIEREN</button>` : item.action === "accelerate" ? `<button class="secondary-button" id="accelerate-incubation" ${!game.incubation || game.inventory[item.id] <= 0 ? "disabled" : ""}>BRUTZEIT −60s</button>` : item.id === "ether_dust" ? `<span class="item-reserved">ROHSTOFF · ETHERWERKSTATT</span>` : `<span class="item-reserved">VERBRAUCH · EVOLUTION</span>`}</article>`).join("")}</div>
    ${craftingWorkbench()}
    <div class="inventory-gem-callout panel"><div><span class="eyebrow">GEM-AUSRÜSTUNG</span><strong>${Object.values(game.gemInventory).reduce((sum, amount) => sum + amount, 0)} Gems im Inventar</strong><small>Dreieck verstärkt Angriff, Quadrat verstärkt Leben, Raute verstärkt beides. Fünf Farben und drei Seltenheiten sind vorbereitet.</small></div><div>${GEMS.filter((gem) => (game.gemInventory[gem.id] ?? 0) > 0).slice(0, 5).map((gem) => `<img src="${gem.image}" alt="${gem.name}" title="${gem.name}">`).join("")}</div><button class="secondary-button" data-view="habitat">GEMS AUSRÜSTEN</button></div>
    <div class="inventory-note panel"><span>${icon("shield")}</span><div><strong>Backend-Regel</strong><small>Der Browser zeigt Bestände nur an. Im Onlinebetrieb bestätigt ausschließlich der Server jeden Fund, Verbrauch und Tausch.</small></div></div>
  </section>`;
}

function objectiveRewardLabel(objective: ObjectiveDefinition): string {
  const parts: string[] = [];
  if (objective.reward.gold) parts.push(`${formatNumber(objective.reward.gold)} Gold`);
  if (objective.reward.cores) parts.push(`${objective.reward.cores} Prestige-Kern${objective.reward.cores === 1 ? "" : "e"}`);
  for (const [itemId, amount] of Object.entries(objective.reward.items ?? {})) {
    parts.push(`${amount}× ${ITEMS.find((item) => item.id === itemId)?.name ?? itemId}`);
  }
  if (objective.reward.gemId) parts.push(getGem(objective.reward.gemId)?.name ?? "Gem");
  return parts.join(" · ");
}

function objectiveCard(objective: ObjectiveDefinition): string {
  const progress = objectiveProgress(game, objective);
  const displayedProgress = Math.min(progress, objective.target);
  const claimed = game.claimedObjectives.includes(objectiveClaimKey(game, objective));
  const claimable = isObjectiveClaimable(game, objective);
  const percent = Math.min(100, (progress / objective.target) * 100);
  return `<article class="objective-card panel ${claimable ? "is-claimable" : ""} ${claimed ? "is-claimed" : ""}">
    <div class="objective-card__icon">${icon(claimed ? "check" : "objectives")}</div>
    <div class="objective-card__copy"><span class="eyebrow">${objective.cadence === "daily" ? "TÄGLICHER AUFTRAG" : objective.cadence === "weekly" ? "WOCHENZIEL" : "PERMANENTER ERFOLG"}</span><h3>${objective.title}</h3><p>${objective.description}</p></div>
    <span class="objective-card__progress"><b>${displayedProgress} / ${objective.target}</b><i><em style="width:${percent}%"></em></i></span>
    <div class="objective-card__reward"><small>BELOHNUNG</small><strong>${objectiveRewardLabel(objective)}</strong></div>
    <button class="${claimable ? "primary-button" : "secondary-button"}" data-objective="${objective.id}" ${claimable ? "" : "disabled"}>${claimed ? "ABGEHOLT" : claimable ? "BERGEN" : "IN ARBEIT"}</button>
  </article>`;
}

function objectivesView(): string {
  refreshObjectivePeriods(game);
  const daily = OBJECTIVES.filter((objective) => objective.cadence === "daily");
  const weekly = OBJECTIVES.filter((objective) => objective.cadence === "weekly");
  const achievements = OBJECTIVES.filter((objective) => objective.cadence === "achievement");
  const claimable = OBJECTIVES.filter((objective) => isObjectiveClaimable(game, objective)).length;
  const completedAchievements = achievements.filter((objective) => game.claimedObjectives.includes(objectiveClaimKey(game, objective))).length;
  return `<section class="page objectives-page">${pageHeading("AUFTRÄGE · ERFOLGE", "Resonanz-Aufträge", "Kurze Ziele führen durch die vorhandenen Systeme. Fortschritt entsteht nur aus echten Spielaktionen und wird später serverseitig bestätigt.", `${claimable} BELOHNUNGEN BEREIT`)}
    <section class="objective-overview panel"><div><span>${icon("objectives")}</span><div><small>AKTIVE PERIODE</small><strong>${game.objectivePeriods.dailyKey}</strong><em>WOCHE ${game.objectivePeriods.weeklyKey}</em></div></div><div><span><small>TÄGLICH</small><b>${daily.filter((objective) => objectiveProgress(game, objective) >= objective.target).length}/${daily.length}</b></span><span><small>WÖCHENTLICH</small><b>${weekly.filter((objective) => objectiveProgress(game, objective) >= objective.target).length}/${weekly.length}</b></span><span><small>ERFOLGE</small><b>${completedAchievements}/${achievements.length}</b></span></div><button class="secondary-button" data-view="expedition">ZURÜCK ZUM KAMPF</button></section>
    <div class="subsection-heading"><div><span class="eyebrow">HEUTE</span><h2>Tägliche Aufträge</h2></div><span>UTC · AUTOMATISCHER WECHSEL</span></div><div class="objective-grid">${daily.map(objectiveCard).join("")}</div>
    <div class="subsection-heading"><div><span class="eyebrow">DIESE WOCHE</span><h2>Wochenziele</h2></div><span>${game.objectivePeriods.weeklyKey}</span></div><div class="objective-grid">${weekly.map(objectiveCard).join("")}</div>
    <div class="subsection-heading"><div><span class="eyebrow">ACCOUNT</span><h2>Permanente Erfolge</h2></div><span>KEIN RESET</span></div><div class="objective-grid objective-grid--achievements">${achievements.map(objectiveCard).join("")}</div>
  </section>`;
}

function expeditionDurationLabel(durationMs: number): string {
  const minutes = Math.round(durationMs / 60_000);
  return minutes < 60 ? `${minutes} MIN` : `${Math.floor(minutes / 60)}H ${minutes % 60 ? `${minutes % 60}M` : ""}`.trim();
}

function expeditionRemainingLabel(completesAt: number, now = Date.now()): string {
  const seconds = Math.max(0, Math.ceil((completesAt - now) / 1_000));
  if (seconds <= 0) return "BEREIT";
  if (seconds < 60) return `0:${String(seconds).padStart(2, "0")}`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes < 60 ? `${minutes}:${String(rest).padStart(2, "0")}` : `${Math.floor(minutes / 60)}H ${minutes % 60}M`;
}

function expeditionRewardLabel(definition: ExpeditionDefinition, multiplier = 1): string {
  const parts = [`${formatNumber(Math.round(definition.reward.gold * multiplier))} Gold`];
  for (const [itemId, amount] of Object.entries(definition.reward.items ?? {})) {
    const adjusted = Math.max(amount ?? 0, Math.round((amount ?? 0) * multiplier));
    parts.push(`${adjusted}× ${ITEMS.find((item) => item.id === itemId)?.name ?? itemId}`);
  }
  return parts.join(" · ");
}

function activeExpeditionCard(slot: number): string {
  const expedition = game.expeditions.find((entry) => entry.slot === slot);
  if (!expedition) return `<article class="dispatch-slot panel is-empty"><span>${icon("dispatch")}</span><div><small>SLOT ${String(slot).padStart(2, "0")}</small><strong>Bereit für einen Auftrag</strong><p>Wähle unten eine Mission und ein freies Monster.</p></div></article>`;
  const definition = getExpedition(expedition.definitionId);
  const monster = game.roster.find((entry) => entry.uid === expedition.monsterUid);
  if (!definition || !monster) return "";
  const now = Date.now();
  const ready = now >= expedition.completesAt;
  const progress = Math.min(100, ((now - expedition.startedAt) / (expedition.completesAt - expedition.startedAt)) * 100);
  return `<article class="dispatch-slot panel ${ready ? "is-ready" : "is-running"}">
    <div class="dispatch-slot__monster">${monsterAvatar(monster)}</div>
    <div class="dispatch-slot__copy"><small>SLOT ${String(slot).padStart(2, "0")} · ${getZone(definition.zoneId).name}</small><strong>${definition.name}</strong><p>${getMonsterForm(monster).name} · LV ${monster.level} · ${Math.round((expedition.rewardMultiplier - 1) * 100)}% Bonus</p></div>
    <span class="dispatch-slot__timer"><small>${ready ? "RÜCKKEHR BESTÄTIGT" : "RESTZEIT"}</small><b>${expeditionRemainingLabel(expedition.completesAt, now)}</b></span>
    <div class="dispatch-slot__progress"><i style="width:${progress}%"></i></div>
    <div class="dispatch-slot__reward"><small>GESICHERTE BELOHNUNG</small><strong>${expeditionRewardLabel(definition, expedition.rewardMultiplier)}</strong></div>
    <button class="${ready ? "primary-button" : "secondary-button"}" data-claim-expedition="${expedition.id}" ${ready ? "" : "disabled"}>${ready ? "RÜCKKEHR BERGEN" : "EXPEDITION LÄUFT"}</button>
  </article>`;
}

function dispatchDefinitionCard(definition: ExpeditionDefinition, freeSlot: number | undefined): string {
  const unlocked = game.unlockedZoneIds.includes(definition.zoneId);
  const candidates = freeSlot && unlocked
    ? game.roster.filter((monster) => canStartExpedition(game, definition, monster, freeSlot))
    : [];
  const requirementTags = [
    `LV ${definition.minimumLevel}+`,
    definition.requiresEvolved ? "EVOLUTION NÖTIG" : "ROOKIE MÖGLICH",
    definition.preferredRole ? `BONUS ${COMBAT_ROLE_LABELS[definition.preferredRole]}` : "",
    definition.preferredElement ? `BONUS ${elementLabel[definition.preferredElement]}` : "",
  ].filter(Boolean);
  const reason = !unlocked ? `${getZone(definition.zoneId).name.toUpperCase()} NOCH GESPERRT`
    : !freeSlot ? "BEIDE EXPEDITIONS-SLOTS SIND BELEGT"
      : "KEIN FREIES MONSTER ERFÜLLT DIE ANFORDERUNGEN";
  return `<article class="dispatch-contract panel ${unlocked ? "" : "is-locked"}">
    <div class="dispatch-contract__heading"><span>${icon("dispatch")}</span><div><small>${getZone(definition.zoneId).name} · ${expeditionDurationLabel(definition.durationMs)}</small><h3>${definition.name}</h3><p>${definition.description}</p></div></div>
    <div class="dispatch-contract__tags">${requirementTags.map((tag) => `<span>${tag}</span>`).join("")}</div>
    <div class="dispatch-contract__reward"><small>GRUNDBELOHNUNG</small><strong>${expeditionRewardLabel(definition)}</strong></div>
    ${candidates.length > 0 ? `<div class="dispatch-candidates"><small>MONSTER ENTSENDEN · SLOT ${freeSlot}</small>${candidates.map((monster) => {
      const form = getMonsterForm(monster);
      const matchCount = expeditionMatchCount(monster, definition);
      const multiplier = expeditionRewardMultiplier(monster, definition);
      return `<button data-start-expedition="${definition.id}" data-expedition-slot="${freeSlot}" data-expedition-monster="${monster.uid}" style="--monster-accent:${form.accent}">${monsterAvatar(monster)}<span><strong>${form.name}</strong><small>LV ${monster.level} · ${matchCount} MATCHES · +${Math.round((multiplier - 1) * 100)}%</small></span>${icon("arrow")}</button>`;
    }).join("")}</div>` : `<div class="dispatch-contract__blocked">${icon("shield")}<span>${reason}</span></div>`}
  </article>`;
}

function dispatchView(): string {
  const freeSlot = Array.from({ length: EXPEDITION_SLOT_COUNT }, (_, index) => index + 1)
    .find((slot) => !game.expeditions.some((entry) => entry.slot === slot));
  const ready = game.expeditions.filter((entry) => entry.completesAt <= Date.now()).length;
  return `<section class="page dispatch-page">${pageHeading("ZEIT · SAMMLUNG", "Monster-Expeditionen", "Nicht eingesetzte Monster übernehmen zeitbasierte Aufträge. Rollen, Elemente und Evolutionen erhöhen die Belohnung, ohne den Hauptkampf zu unterbrechen.", `${game.expeditions.length}/${EXPEDITION_SLOT_COUNT} AKTIV · ${ready} BEREIT`)}
    <section class="dispatch-rules panel"><span>${icon("shield")}</span><div><strong>Klare Bindung statt Doppelverwendung</strong><small>Front, Support und bereits entsandte Monster stehen nicht zur Auswahl. Start- und Endzeit werden gespeichert; Reload und Offline-Zeit erzeugen keine zweite Belohnung.</small></div><button class="secondary-button" data-view="expedition">ZUM HAUPTKAMPF</button></section>
    <div class="dispatch-slots">${Array.from({ length: EXPEDITION_SLOT_COUNT }, (_, index) => activeExpeditionCard(index + 1)).join("")}</div>
    <div class="subsection-heading"><div><span class="eyebrow">VERFÜGBARE SIGNALE</span><h2>Auftragsbrett</h2></div><span>6 MISSIONEN · 3 ZONEN</span></div>
    <div class="dispatch-contracts">${EXPEDITIONS.map((definition) => dispatchDefinitionCard(definition, freeSlot)).join("")}</div>
  </section>`;
}

function systemInbox(): string {
  const available = SYSTEM_MESSAGES.filter((message) => message.available(game));
  const unread = available.filter((message) => !game.claimedSystemMessages.includes(message.id)).length;
  return `<section class="profile-system panel"><div class="profile-section-heading"><div><span class="eyebrow">SYSTEMPOST · LOKAL</span><h2>Archiv-Nachrichten</h2><p>Nur Systemhinweise und einmalige Belohnungen. Echte Spielermails folgen erst mit Accounts und Server.</p></div><strong>${unread} OFFEN</strong></div><div class="system-message-list">${available.map((message) => {
    const claimed = game.claimedSystemMessages.includes(message.id);
    const rewards = [message.reward?.gold ? `${message.reward.gold} Gold` : "", ...Object.entries(message.reward?.items ?? {}).map(([itemId, amount]) => `${amount}× ${ITEMS.find((item) => item.id === itemId)?.name ?? itemId}`)].filter(Boolean);
    return `<article class="system-message ${claimed ? "is-claimed" : ""}"><span>${message.category === "welcome" ? icon("spark") : icon("objectives")}</span><div><small>${message.category === "welcome" ? "WILLKOMMEN" : "FORTSCHRITT"}</small><strong>${message.title}</strong><p>${message.body}</p>${rewards.length ? `<em>${rewards.join(" · ")}</em>` : ""}</div><button class="${claimed ? "secondary-button" : "primary-button"}" data-system-message="${message.id}" ${claimed ? "disabled" : ""}>${claimed ? "BESTÄTIGT" : "BERGEN"}</button></article>`;
  }).join("")}</div></section>`;
}

function playerSettings(): string {
  const toggles: Array<{ key: keyof PlayerSettings; title: string; copy: string }> = [
    { key: "soundEnabled", title: "UI-Klänge", copy: "Kurze synthetische Bestätigungstöne bei erfolgreichen Aktionen." },
    { key: "combatEffects", title: "Kampfeffekte", copy: "Trefferblitze und Schadenszahlen im automatischen Kampf." },
    { key: "reducedMotion", title: "Reduzierte Bewegung", copy: "Stoppt längere Schwebe-, Puls- und Szenenanimationen." },
  ];
  return `<section class="profile-settings panel"><div class="profile-section-heading"><div><span class="eyebrow">KOMFORT · BARRIEREARM</span><h2>Darstellung &amp; Feedback</h2><p>Alle Einstellungen werden im Spielstand gespeichert und später accountweit synchronisiert.</p></div></div><div class="settings-grid">${toggles.map((setting) => {
    const enabled = Boolean(game.settings[setting.key]);
    return `<button class="setting-toggle ${enabled ? "is-enabled" : ""}" data-setting="${setting.key}" data-setting-value="${!enabled}"><span><strong>${setting.title}</strong><small>${setting.copy}</small></span><i><em></em></i></button>`;
  }).join("")}<div class="setting-format"><span><strong>Zahlenformat</strong><small>Kompakte Werte für Idle-Zahlen oder vollständig ausgeschriebene Bestände.</small></span><div><button class="${game.settings.numberFormat === "compact" ? "is-active" : ""}" data-setting="numberFormat" data-setting-value="compact">1,2 MIO.</button><button class="${game.settings.numberFormat === "full" ? "is-active" : ""}" data-setting="numberFormat" data-setting-value="full">1.200.000</button></div></div></div></section>`;
}

function profileView(): string {
  const rank = rankForVictories(game.totalVictories);
  const activeAvatar = AVATARS.find((entry) => entry.id === game.profile.avatarId) ?? AVATARS[0];
  const activeFrame = FRAMES.find((entry) => entry.id === game.profile.frameId) ?? FRAMES[0];
  return `<section class="page profile-page">${pageHeading("ACCOUNT · KOSMETIK", "Tamer-Profil", "Runder Avatar und Rahmen werden als getrennte Katalogeinträge gespeichert. So können Events, Gilden und Erfolge später neue Kombinationen freischalten.", `RANG ${rank} · ${game.totalVictories} SIEGE`)}
    <section class="profile-hero panel">${accountAvatar("large")}<div><span class="eyebrow">AKTIVES PROFIL</span><h1>${game.playerName}</h1><p>${activeAvatar.name} · ${activeFrame.name}</p><div class="profile-stats"><span><small>MONSTER</small><b>${game.roster.length}/10</b></span><span><small>PRESTIGE</small><b>${game.prestigeCount}</b></span><span><small>ZONEN</small><b>${game.unlockedZoneIds.length}/${ZONES.length}</b></span><span><small>RANG</small><b>${rank}</b></span></div></div><aside><small>ACCOUNT-ID</small><b>LOCAL-PROTOTYPE</b><span>Später vom Backend vergeben</span></aside></section>
    ${systemInbox()}${playerSettings()}
    <div class="customization-section"><div class="subsection-heading"><div><span class="eyebrow">AVATARE</span><h2>Tamer-Identität</h2></div><span>RUND · WECHSELBAR</span></div><div class="cosmetic-grid">${AVATARS.map((avatar) => { const unlocked = isAvatarUnlocked(game, avatar.id); const selected = avatar.id === game.profile.avatarId; return `<button class="cosmetic-card panel ${selected ? "is-selected" : ""}" data-avatar="${avatar.id}" ${unlocked ? "" : "disabled"} style="--avatar-a:${avatar.colors[0]};--avatar-b:${avatar.colors[1]}"><span class="cosmetic-avatar"><i>${avatar.glyph}</i></span><strong>${avatar.name}</strong><small>${unlocked ? selected ? "AKTIV" : "AUSWÄHLEN" : `GESPERRT · ${avatar.unlock}`}</small></button>`; }).join("")}</div></div>
    <div class="customization-section"><div class="subsection-heading"><div><span class="eyebrow">RAHMEN</span><h2>Profilrahmen</h2></div><span>SEPARATER KATALOG</span></div><div class="frame-grid">${FRAMES.map((frame) => { const unlocked = isFrameUnlocked(game, frame.id); const selected = frame.id === game.profile.frameId; return `<button class="frame-card panel ${selected ? "is-selected" : ""}" data-frame="${frame.id}" ${unlocked ? "" : "disabled"} style="--frame-a:${frame.colors[0]};--frame-b:${frame.colors[1]}"><span><i></i></span><div><strong>${frame.name}</strong><small>${unlocked ? selected ? "AKTIV" : "AUSWÄHLEN" : `GESPERRT · ${frame.unlock}`}</small></div></button>`; }).join("")}</div></div>
  </section>`;
}

function starterGate(): string {
  return `<section class="page starter-gate"><span>${icon("spark")}</span><p class="eyebrow">ERSTE RESONANZ</p><h1>Wähle zuerst deinen Rookie-Partner.</h1><p>Zehn eigenständige Linien stehen bereit. Die Wahl bestimmt deinen Start, nicht deinen gesamten Account – alle anderen Arten findest du später als Eier.</p><button class="primary-button primary-button--large" id="open-starter">STARTER WÄHLEN ${icon("arrow")}</button></section>`;
}

function starterDialog(): string {
  if (!starterDialogOpen || game.roster.length > 0) return "";
  return `<div class="modal-backdrop starter-backdrop" role="presentation"><section class="modal starter-modal" role="dialog" aria-modal="true" aria-labelledby="starter-title" data-testid="starter-dialog"><button class="modal__close" id="close-starter" aria-label="Starterwahl schließen">×</button><span class="eyebrow">ZEHN ROOKIE-LINIEN · EINE ERSTE WAHL</span><h2 id="starter-title">Welche Resonanz antwortet dir?</h2><p>Jeder Starter besitzt eine feste erste Evolution. Werte und Namen lassen sich zentral im Monsterkatalog ändern.</p><div class="starter-grid">${MONSTERS.map((monster) => { const preview = createMonster(monster.id, 1); return `<article class="starter-card" style="--monster-accent:${monster.accent}"><div class="starter-card__visual">${monsterAvatar(preview)}</div><div><span class="eyebrow">${elementLabel[monster.element]} · ${monster.role}</span><h3>${monster.name}</h3><p>${monster.description}</p><div class="starter-evolution"><span>${monster.glyph}</span><i>→</i><span>${monster.evolution.glyph}</span><small>${monster.evolution.name}</small></div><button class="primary-button" data-starter="${monster.id}" data-testid="starter-${monster.id}">${monster.name.toUpperCase()} WÄHLEN</button></div></article>`; }).join("")}</div><div class="starter-modal__foot"><span>${icon("shield")} Die Starterwahl wird später serverseitig einmalig bestätigt.</span><button class="text-button" id="close-starter-alt">SPÄTER ENTSCHEIDEN</button></div></section></div>`;
}

function researchView(): string {
  return `<section class="page">${pageHeading("ACCOUNT · DAUERHAFT", "Ether-Forschung", "Investiere Prestige-Kerne in accountweite Verbesserungen. Kein Forschungszweig wird durch einen neuen Run zurückgesetzt.", `${game.resources.cores} KERNE VERFÜGBAR`)}<div class="research-grid">${RESEARCH.map((research) => { const level = game.research[research.id]; const cost = researchCost(level); const isMax = level >= research.maxLevel; return `<article class="research-card panel"><span class="research-card__icon">${research.icon}</span><div><span class="eyebrow">FORSCHUNG ${String(RESEARCH.indexOf(research) + 1).padStart(2, "0")}</span><h2>${research.name}</h2><p>${research.description}</p></div><span class="level-chip">STUFE ${level} / ${research.maxLevel}</span><div class="research-levels">${Array.from({ length: research.maxLevel }, (_, index) => `<i class="${index < level ? "is-filled" : ""}"></i>`).join("")}</div><strong>${research.effectPerLevel}</strong><button class="primary-button" data-research="${research.id}" ${isMax || game.resources.cores < cost ? "disabled" : ""}>${isMax ? "MAXIMAL" : `ERFORSCHEN · ${cost} P`}</button></article>`; }).join("")}</div><section class="research-summary panel"><span class="eyebrow">AKTIVE ACCOUNT-EFFEKTE</span><span><small>ANGRIFF</small><b>+${game.research.power * 7}%</b></span><span><small>LEBEN</small><b>+${game.research.vitality * 8}%</b></span><span><small>GOLD</small><b>+${game.research.extraction * 10}%</b></span><span><small>BRUTZEIT</small><b>−${game.research.incubation * 10}%</b></span></section></section>`;
}

function guildView(): string {
  const rank = rankForVictories(game.totalVictories);
  const genes = ["Ökonomie", "Kampf", "Hyper", "Expedition", "Forschung", "Elemente"];
  return `<section class="page guild-page"><div class="guild-hero"><span class="guild-lock">${icon("guild")}</span><span class="eyebrow">ONLINE-SYSTEM · KONZEPTVORSCHAU</span><h1>Gilden-DNA</h1><p>Ein gemeinsamer permanenter Fortschritt, dessen Entscheidungen als lebende Doppelhelix sichtbar werden. Keine lokalen Fake-Mitglieder, keine erfundenen Ressourcen.</p><div class="guild-tags"><span>GEMEINSAME ZIELE</span><span>GILDENBOSSE</span><span>CHROMOSOMEN</span><span>ABSTIMMUNGEN</span></div></div><div class="dna-layout panel"><div class="dna-visual"><div class="dna-axis"></div><div class="dna-helix">${genes.map((gene, index) => `<div class="dna-gene" style="--gene-index:${index}"><i></i><span><small>GEN 0${index + 1}</small>${gene}</span><i></i></div>`).join("")}</div></div><div class="dna-copy"><span class="eyebrow">CHROMOSOM 01 · GRUNDLAGEN</span><h2>Spezialisierung statt endloser Kampfkraft.</h2><p>Frühe Gene verbessern Gold, Bosse, Hyper-Fortschritt und Expeditionen. Spätere Chromosomen konzentrieren sich auf Komfort, neue Mechaniken und abnehmende Prozentboni.</p><ul><li><span>${icon("check")}</span>Gildenleitung, Offiziere oder Mitgliederabstimmung</li><li><span>${icon("check")}</span>Sichtbar leuchtende freigeschaltete Segmente</li><li><span>${icon("check")}</span>Neue Themen als zusätzliche Chromosomen</li><li><span>${icon("shield")}</span>Ressourcen und Rechte ausschließlich serverseitig</li></ul><div class="locked-callout"><span>FREISCHALTUNG</span><b>RANG 10 + ONLINE-ACCOUNT</b><small>Dein aktueller Rang: ${rank}</small></div></div></div></section>`;
}

function prestigeView(): string {
  const reward = prestigeCoreReward(game.runVictories);
  const charge = Math.min(100, game.runVictories);
  const permanentHyper = game.roster.reduce((sum, monster) => sum + monster.hyperLevel, 0);
  const equippedGems = game.roster.reduce((sum, monster) => sum + Object.keys(monster.gemSlots).length, 0);
  return `<main class="prestige-scene ${prestigeActivating ? "is-activating" : ""}">
    <div class="prestige-scene__ambient" aria-hidden="true"><i></i><i></i><i></i></div>
    <header class="prestige-header"><button class="brand" data-home>${brandMarkup()}</button><button class="secondary-button" data-view="expedition" ${prestigeActivating ? "disabled" : ""}>← ZURÜCK ZUM KAMPF</button></header>
    <section class="prestige-copy"><span class="eyebrow">PRESTIGE · ETHER-RESONANZ</span><h1>Eine Zeitlinie endet.<br><em>Deine Bindung bleibt.</em></h1><p>Der Ether-Kristall speichert nur, was deinen Account wirklich stärker macht. Der aktuelle Run wird freigegeben und beginnt anschließend wieder bei null.</p></section>
    <section class="ether-crystal-stage" aria-label="Ether-Kristall zu ${charge} Prozent geladen">
      <div class="ether-orbit ether-orbit--outer"><i></i><i></i><i></i></div><div class="ether-orbit ether-orbit--inner"><i></i><i></i></div>
      <div class="ether-crystal"><i></i><i></i><i></i><span></span></div>
      <div class="ether-charge"><span><small>KRISTALL-LADUNG</small><b>${game.runVictories} / 100</b></span><i><em style="width:${charge}%"></em></i><strong>${reward > 0 ? `${reward} ETHER-KERN${reward === 1 ? "" : "E"} BEREIT` : `${100 - game.runVictories} SIEGE BIS PRESTIGE`}</strong></div>
    </section>
    <section class="prestige-ledger">
      <article><span class="eyebrow">WIRD FREIGEGEBEN</span><h2>Run-Fortschritt</h2><ul><li><b>${formatNumber(game.resources.gold)}</b><span>Run-Gold</span></li><li><b>${game.roster.reduce((sum, monster) => sum + Math.max(0, monster.level - 1), 0)}</b><span>zusätzliche normale Level</span></li><li><b>${getZone(game.currentZoneId).name}</b><span>Zone und Stage-Fortschritt</span></li></ul></article>
      <article class="is-permanent"><span class="eyebrow">BLEIBT GESPEICHERT</span><h2>Permanente Bindung</h2><ul><li><b>${permanentHyper}</b><span>Hyperlevel</span></li><li><b>${game.roster.filter((monster) => monster.evolution === "evolved").length}</b><span>Evolutionen</span></li><li><b>${equippedGems}</b><span>eingesetzte Gems</span></li><li><b>${Object.values(game.fragments).reduce((sum, amount) => sum + amount, 0)}</b><span>Art-Fragmente</span></li></ul></article>
    </section>
    <div class="prestige-action"><button class="primary-button primary-button--large" id="confirm-prestige" ${reward <= 0 || prestigeActivating ? "disabled" : ""}>${prestigeActivating ? "ZEITLINIE WIRD GELÖST …" : reward > 0 ? "ETHER-KRISTALL AKTIVIEREN" : "KRISTALL NOCH NICHT GELADEN"}</button><small>${prestigeActivating ? "Hyperlevel, Evolutionen und Gems werden verankert." : "Diese Aktion setzt nur den oben aufgeführten Run-Fortschritt zurück."}</small></div>
  </main>`;
}

function uiNoticeMarkup(): string {
  if (!uiNotice) return "";
  return `<div class="ui-notice ui-notice--${uiNotice.tone}" role="status" aria-live="polite"><span>${uiNotice.tone === "success" ? icon("check") : icon("spark")}</span><div><strong>${uiNotice.title}</strong><small>${uiNotice.message}</small></div><button id="close-ui-notice" aria-label="Hinweis schließen">×</button><i></i></div>`;
}

function formatOfflineDuration(seconds: number): string {
  if (seconds < 60) return "weniger als 1 Minute";
  const hours = Math.floor(seconds / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  if (hours === 0) return `${minutes} Minute${minutes === 1 ? "" : "n"}`;
  return `${hours} Stunde${hours === 1 ? "" : "n"}${minutes > 0 ? ` ${minutes} Min.` : ""}`;
}

function offlineReport(): string {
  if (!showOfflineReport) return "";
  const offlineMaterialCount = Object.values(loaded.offlineItems).reduce((sum, amount) => sum + amount, 0);
  const pendingMaterialCount = Object.values(game.pendingItems).reduce((sum, amount) => sum + amount, 0);
  const hasPendingRewards = game.pendingGold > 0 || game.pendingEggs.length > 0 || pendingMaterialCount > 0 || game.pendingGems.length > 0;
  return `<div class="offline-report-backdrop" role="presentation"><section class="offline-report" role="dialog" aria-modal="true" aria-labelledby="offline-report-title" data-testid="offline-report">
    <div class="offline-report__signal"><span>${icon("spark")}</span><i></i></div>
    <span class="eyebrow">EXPEDITION FORTGESETZT</span>
    <h2 id="offline-report-title">Willkommen zurück.</h2>
    <p>Du warst <strong>${formatOfflineDuration(loaded.offlineSeconds)}</strong> offline. Dein Team hat in dieser Zeit automatisch weitergekämpft.</p>
    <div class="offline-report__rewards">
      <span><small>ZEIT OFFLINE</small><b>${formatOfflineDuration(loaded.offlineSeconds)}</b></span>
      <span>${resourceIcon("gold")}<small>GESAMMELTES GOLD</small><b>+${formatNumber(loaded.offlineGold)}</b></span>
      <span>${icon("inventory")}<small>MATERIALIEN</small><b>+${offlineMaterialCount}</b></span>
      <span>${icon("shield")}<small>SPEICHERPLÄTZE</small><b>+${loaded.offlineSlots}</b></span>
    </div>
    <div class="offline-report__cache"><div><small>JETZT IM KAMPFSPEICHER</small><strong>${formatNumber(game.pendingGold)} Gold · ${game.pendingEggs.length} Eier · ${pendingMaterialCount} Materialien · ${game.pendingGems.length} Gems</strong></div><span>${game.cacheSlotsUsed}/${cacheCapacity(game.research.extraction)}</span></div>
    <div class="offline-report__actions"><button class="secondary-button" id="offline-continue">OHNE EINSAMMELN ZUM KAMPF</button><button class="primary-button primary-button--large" id="offline-collect" data-testid="offline-collect" ${hasPendingRewards ? "" : "disabled"}>${hasPendingRewards ? `ALLES EINSAMMELN ${icon("arrow")}` : "NICHTS ZUM EINSAMMELN"}</button></div>
    <small class="offline-report__note">Offline-Fortschritt ist durch die Kapazität deines Kampfspeichers begrenzt.</small>
  </section></div>`;
}

function render(): void {
  const combatActive = !showLogin && activeView === "expedition";
  const prestigeActive = !showLogin && activeView === "prestige";
  document.documentElement.classList.toggle("user-reduced-motion", game.settings.reducedMotion);
  document.body.classList.toggle("is-combat-active", combatActive);
  document.body.classList.toggle("is-prestige-active", prestigeActive);
  if (combatActive) {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }
  if (showLogin) app.innerHTML = loginShell();
  else {
    const views: Record<View, () => string> = { expedition: expeditionView, objectives: objectivesView, dispatch: dispatchView, habitat: habitatView, incubation: incubationView, inventory: inventoryView, research: researchView, guild: guildView, profile: profileView, prestige: prestigeView };
    const content = views[activeView]();
    app.innerHTML = activeView === "expedition" ? combatShell(content) : activeView === "prestige" ? prestigeShell(content) : topShell(content);
  }
  bindEvents();
  bindModalKeyboard();
}

function bindModalKeyboard(): void {
  const dialog = document.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]');
  if (!dialog) return;
  const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'));
  const focusFirst = (): void => (focusable[0] ?? dialog).focus();
  if (!dialog.contains(document.activeElement)) queueMicrotask(focusFirst);
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      if (starterDialogOpen) starterDialogOpen = false;
      else if (showOfflineReport) showOfflineReport = false;
      render();
      return;
    }
    if (event.key !== "Tab" || focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

function bindEvents(): void {
  document.querySelectorAll<HTMLElement>("[data-view]").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view as View)));
  document.querySelectorAll<HTMLElement>("[data-combat-panel]").forEach((button) => button.addEventListener("click", () => toggleCombatPanel(button.dataset.combatPanel as CombatPanel)));
  document.querySelector("#combat-focus-toggle")?.addEventListener("click", toggleCombatFocus);
  document.querySelectorAll<HTMLElement>("[data-home]").forEach((button) => button.addEventListener("click", () => { showLogin = true; showOfflineReport = false; starterDialogOpen = false; window.scrollTo({ top: 0, behavior: "smooth" }); render(); }));
  document.querySelector<HTMLFormElement>("#login-form")?.addEventListener("submit", (event) => { event.preventDefault(); signIn(); });
  document.querySelector("#collect-cache")?.addEventListener("click", collectCache);
  document.querySelector("#offline-collect")?.addEventListener("click", collectOfflineRewards);
  document.querySelector("#offline-continue")?.addEventListener("click", () => { showOfflineReport = false; render(); window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" })); });
  document.querySelectorAll<HTMLElement>("[data-level]").forEach((button) => button.addEventListener("click", () => levelUp(button.dataset.level ?? "")));
  document.querySelectorAll<HTMLElement>("[data-train]").forEach((button) => button.addEventListener("click", () => trainWithData(button.dataset.train ?? "")));
  document.querySelectorAll<HTMLElement>("[data-evolve]").forEach((button) => button.addEventListener("click", () => evolveMonster(button.dataset.evolve ?? "")));
  document.querySelectorAll<HTMLElement>("[data-hyper]").forEach((button) => button.addEventListener("click", () => upgradeHyper(button.dataset.hyper ?? "")));
  document.querySelectorAll<HTMLElement>("[data-equip-gem]").forEach((button) => button.addEventListener("click", () => equipGem(button.dataset.monster ?? "", button.dataset.equipGem ?? "")));
  document.querySelectorAll<HTMLElement>("[data-unequip-gem]").forEach((button) => button.addEventListener("click", () => unequipGem(button.dataset.monster ?? "", button.dataset.unequipGem ?? "")));
  document.querySelectorAll<HTMLElement>("[data-active]").forEach((button) => button.addEventListener("click", () => makeActive(button.dataset.active ?? "")));
  document.querySelectorAll<HTMLElement>("[data-support]").forEach((button) => button.addEventListener("click", () => makeSupport(button.dataset.support ?? "")));
  document.querySelectorAll<HTMLElement>("[data-zone]").forEach((button) => button.addEventListener("click", () => selectZone(button.dataset.zone ?? "")));
  document.querySelectorAll<HTMLElement>("[data-starter]").forEach((button) => button.addEventListener("click", () => chooseStarter(button.dataset.starter ?? "")));
  document.querySelectorAll<HTMLElement>("[data-avatar]").forEach((button) => button.addEventListener("click", () => setAvatar(button.dataset.avatar ?? "")));
  document.querySelectorAll<HTMLElement>("[data-frame]").forEach((button) => button.addEventListener("click", () => setFrame(button.dataset.frame ?? "")));
  document.querySelectorAll<HTMLElement>("[data-incubate]").forEach((button) => button.addEventListener("click", () => startIncubation(button.dataset.incubate ?? "")));
  document.querySelector("#hatch-egg")?.addEventListener("click", hatchIncubation);
  document.querySelector("#accelerate-incubation")?.addEventListener("click", accelerateIncubation);
  document.querySelector("#open-starter")?.addEventListener("click", () => { starterDialogOpen = true; render(); });
  ["close-starter", "close-starter-alt"].forEach((id) => document.querySelector(`#${id}`)?.addEventListener("click", () => { starterDialogOpen = false; render(); }));
  document.querySelector("#close-hatch-notice")?.addEventListener("click", () => { hatchNotice = ""; render(); });
  document.querySelectorAll<HTMLElement>("[data-milestone]").forEach((button) => button.addEventListener("click", () => claimMilestone(Number(button.dataset.milestone))));
  document.querySelectorAll<HTMLElement>("[data-objective]").forEach((button) => button.addEventListener("click", () => claimObjective(button.dataset.objective ?? "")));
  document.querySelectorAll<HTMLElement>("[data-start-expedition]").forEach((button) => button.addEventListener("click", () => startTimedExpedition(Number(button.dataset.expeditionSlot), button.dataset.startExpedition ?? "", button.dataset.expeditionMonster ?? "")));
  document.querySelectorAll<HTMLElement>("[data-claim-expedition]").forEach((button) => button.addEventListener("click", () => claimTimedExpedition(button.dataset.claimExpedition ?? "")));
  document.querySelectorAll<HTMLElement>("[data-craft]").forEach((button) => button.addEventListener("click", () => craftRecipe(button.dataset.craft ?? "")));
  document.querySelectorAll<HTMLElement>("[data-setting]").forEach((button) => button.addEventListener("click", () => updatePlayerSetting(button.dataset.setting as keyof PlayerSettings, button.dataset.settingValue ?? "")));
  document.querySelectorAll<HTMLElement>("[data-system-message]").forEach((button) => button.addEventListener("click", () => claimSystemMessage(button.dataset.systemMessage ?? "")));
  document.querySelectorAll<HTMLElement>("[data-research]").forEach((button) => button.addEventListener("click", () => buyResearch(button.dataset.research as ResearchId)));
  document.querySelector("#start-prestige")?.addEventListener("click", openPrestigeScene);
  document.querySelector("#confirm-prestige")?.addEventListener("click", confirmPrestige);
  document.querySelector("#close-ui-notice")?.addEventListener("click", () => { uiNotice = null; render(); });
  document.querySelector("#client-state-action")?.addEventListener("click", () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("ui-state");
    window.history.replaceState({}, "", url);
    if (clientUiState === "conflict") return window.location.reload();
    clientUiState = "local";
    render();
  });
  document.querySelector("#advance-tutorial")?.addEventListener("click", () => advanceTutorial(false));
  document.querySelector("#skip-tutorial")?.addEventListener("click", () => advanceTutorial(true));
  document.querySelector("#reset-game")?.addEventListener("click", () => { if (!window.confirm("Lokalen Idle-Tamer-Spielstand wirklich löschen?")) return; resetGame(); window.location.reload(); });
}

function frame(now: number): void {
  const delta = now - lastFrame;
  lastFrame = now;
  if (delta < 1_000) tickBattle(now);
  const dynamicView = !showLogin && !showOfflineReport && !starterDialogOpen && (activeView === "expedition" || activeView === "incubation" || activeView === "dispatch");
  if (dynamicView && now - lastRender >= 500) { render(); lastRender = now; }
  if (clientUiState !== "conflict" && now - lastSave >= 5_000) { service.save(); lastSave = now; }
  requestAnimationFrame(frame);
}

window.addEventListener("storage", (event) => {
  if (event.storageArea !== localStorage || event.key !== STORAGE_KEY || event.newValue === event.oldValue) return;
  clientUiState = "conflict";
  render();
});
window.addEventListener("beforeunload", () => {
  if (clientUiState !== "conflict") service.save();
});
render();
requestAnimationFrame(frame);
