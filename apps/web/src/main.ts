import "./styles.css";
import "./styles-v2.css";
import "./styles-game-first.css";
import "./styles-progression-v3.css";
import "./styles-guild.css";
import type { AccountBootstrapResponse, AuthoritativeRunSnapshot, GuildCommand, GuildSnapshot, RunCommandResponse } from "@idle-tamer/contracts";
import { ACTIVE_ACCOUNT_NAMESPACE_KEY, AccountApiError, AccountClient, getClientInstanceId, RunApiError } from "./account/client";
import { AVATARS, BALANCE, COMBAT_ROLE_LABELS, FRAMES, GEM_COLORS, GEM_RARITIES, GEM_SHAPES, GEMS, getGem, getZone, ITEMS, ZONES } from "./game/catalog";
import { GUILD_EXPEDITION, GUILD_GENES, GUILD_TASKS } from "@idle-tamer/content";
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
import { formatGameNumber } from "./game/number-scale";
import { applyAuthoritativeRunSnapshot, combatMonsterForAuthority } from "./game/online-run-state";
import { isObjectiveClaimable, objectiveClaimKey, objectiveProgress, OBJECTIVES, refreshObjectivePeriods, type ObjectiveDefinition } from "./game/objectives";
import { applyQaPreset, type QaPreset } from "./game/qa-tools";
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
import { loadGame, resetGame, STORAGE_KEY, storageKeyForNamespace, type StorageDependencies } from "./game/storage";
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

const accountApiEnabled = import.meta.env.PROD || import.meta.env.VITE_ACCOUNT_API === "true";
const accountClient = new AccountClient();
const clientInstanceId = getClientInstanceId();
const persistedAccountNamespace = localStorage.getItem(ACTIVE_ACCOUNT_NAMESPACE_KEY);
const activeStorageKey = persistedAccountNamespace ? storageKeyForNamespace(persistedAccountNamespace) : STORAGE_KEY;
const storageDependencies: StorageDependencies = { storageKey: activeStorageKey };
const loaded = loadGame(storageDependencies);
const service = new LocalGameService(loaded.state, Math.random, storageDependencies);
const servicePort = new LocalGameServicePort(service);
const game = service.state;
let activeView: View = "expedition";
let showLogin = true;
let accountBootstrap: AccountBootstrapResponse | null = null;
let onlineRun: AuthoritativeRunSnapshot | null = null;
let guildSnapshot: GuildSnapshot | null = null;
let guildSyncBusy = false;
let lastGuildSync = 0;
let runSyncBusy = false;
let lastRunSync = 0;
let authMode: "login" | "register" = "login";
let authBusy = false;
let authMessage = "";
let authMessageTone: "error" | "success" = "success";
let deletionPending = false;
let showOfflineReport = false;
let battle: BattleState | null = createBattleState();
let lastFrame = performance.now();
let lastSave = performance.now();
let hatchNotice = "";
let uiNotice: UiNotice | null = null;
let noticeTimer = 0;
let prestigeActivating = false;
let starterDialogOpen = false;
let activeCombatPanel: CombatPanel | null = null;
let combatFocusMode = false;
let pointerInteractionActive = false;
let keyboardInteractionActive = false;
let renderDeferred = false;
let combatStructuralRefreshDeferred = false;
let lastDynamicRefresh = 0;
const actionLocks = new Map<string, number>();
const requestedUiState = new URLSearchParams(window.location.search).get("ui-state");
const qaEnabled = import.meta.env.DEV && import.meta.env.VITE_ENABLE_QA === "true";
let clientUiState: ClientUiState = import.meta.env.DEV && ["loading", "online", "offline", "conflict", "error"].includes(requestedUiState ?? "")
  ? requestedUiState as ClientUiState
  : accountApiEnabled ? "loading" : "local";

const timeFormatter = new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" });

function isRunOnline(): boolean {
  return accountApiEnabled && Boolean(accountBootstrap?.authority.server.includes("run"));
}

function isGuildOnline(): boolean {
  return accountApiEnabled && Boolean(accountBootstrap?.features.guilds);
}

async function synchronizeGuild(): Promise<void> {
  if (!isGuildOnline() || guildSyncBusy) return;
  guildSyncBusy = true;
  lastGuildSync = performance.now();
  let synchronized = false;
  try {
    guildSnapshot = (await accountClient.bootstrapGuild()).snapshot;
    synchronized = true;
  } catch (error) {
    showNotice("Gildenserver nicht erreichbar", error instanceof Error ? error.message : "Die Gildendaten konnten nicht geladen werden.", "warning");
  } finally {
    guildSyncBusy = false;
  }
  if (synchronized && activeView === "guild") render();
}

async function sendGuildCommand(command: GuildCommand): Promise<boolean> {
  if (!guildSnapshot || guildSyncBusy) return false;
  guildSyncBusy = true;
  try {
    const response = await accountClient.guildCommand(command, guildSnapshot.revision, clientInstanceId);
    guildSnapshot = response.snapshot;
    return true;
  } catch (error) {
    if (error instanceof AccountApiError && error.problem.code === "CONFLICT") {
      guildSyncBusy = false;
      await synchronizeGuild();
    }
    showNotice("Gildenaktion abgelehnt", error instanceof Error ? error.message : "Die Aktion konnte nicht bestätigt werden.", "warning");
    return false;
  } finally {
    guildSyncBusy = false;
  }
}

function applyOnlineRun(snapshot: AuthoritativeRunSnapshot): void {
  const previous = onlineRun;
  const combatChanged = !previous
    || previous.currentZoneId !== snapshot.currentZoneId
    || previous.activeMonster.level !== snapshot.activeMonster.level
    || previous.runVictories !== snapshot.runVictories
    || JSON.stringify(previous.zoneProgress) !== JSON.stringify(snapshot.zoneProgress);
  onlineRun = snapshot;
  applyAuthoritativeRunSnapshot(game, snapshot);
  if (combatChanged) battle = createBattleState();
  service.save();
}

async function synchronizeOnlineRun(showReport = false): Promise<void> {
  if (!isRunOnline() || !accountBootstrap?.onboarding.starterDefinitionId || runSyncBusy) return;
  runSyncBusy = true;
  lastRunSync = performance.now();
  try {
    const response = await accountClient.bootstrapRun();
    applyOnlineRun(response.snapshot);
    if (showReport && (response.settlement.victoriesAdded > 0 || response.snapshot.cacheSlotsUsed > 0)) showOfflineReport = true;
    clientUiState = "online";
    render();
  } catch (error) {
    clientUiState = error instanceof RunApiError && error.status === 401 ? "local" : "offline";
    showNotice("Online-Run nicht erreichbar", error instanceof Error ? error.message : "Der Run-Server antwortet nicht.", "warning");
  } finally {
    runSyncBusy = false;
  }
}

async function sendOnlineRunCommand(command: Parameters<AccountClient["runCommand"]>[0]): Promise<RunCommandResponse | null> {
  if (!onlineRun || runSyncBusy) return null;
  runSyncBusy = true;
  try {
    const response = await accountClient.runCommand(command, onlineRun.revision, clientInstanceId);
    applyOnlineRun(response.snapshot);
    clientUiState = "online";
    return response;
  } catch (error) {
    runSyncBusy = false;
    if (error instanceof RunApiError && error.problem.code === "CONFLICT") await synchronizeOnlineRun();
    showNotice("Run-Aktion abgelehnt", error instanceof Error ? error.message : "Die Aktion konnte nicht bestätigt werden.", "warning");
    return null;
  } finally {
    runSyncBusy = false;
  }
}

function interactionActive(): boolean {
  return pointerInteractionActive || keyboardInteractionActive;
}

function runSingleAction(key: string, action: () => void): void {
  const now = performance.now();
  if ((actionLocks.get(key) ?? 0) > now) return;
  actionLocks.set(key, now + 300);
  action();
}

function formatNumber(value: number): string {
  return formatGameNumber(value, game.settings.numberFormat);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/gu, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

function activeCacheCapacity(): number {
  return isRunOnline() ? onlineRun?.cacheCapacity ?? 90 : cacheCapacity(game.research.extraction);
}

function eggImage(definitionId = "mystery"): string {
  return `/assets/eggs/${definitionId}.png`;
}

function zoneBackgroundUrl(backgroundKey: string): string {
  const assetId = backgroundKey.replace("zone.", "");
  return `/assets/zones/${assetId}-v2.webp`;
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

function activeCombatMonster(): MonsterInstance | null {
  const monster = activeMonster();
  return monster ? combatMonsterForAuthority(monster, isRunOnline()) : null;
}

function createBattleState(): BattleState | null {
  const player = activeCombatMonster();
  if (!player) return null;
  const zoneProgress = game.zoneProgress[game.currentZoneId] ?? { stage: 1, clears: 0 };
  const enemy = enemyForZone(game.currentZoneId, zoneProgress.stage, game.runVictories, zoneProgress.clears);
  const enemyValues = enemyStats(enemy.definitionId, enemy.level, game.prestigeCount);
  const now = performance.now();
  const synergy = activeZoneSynergy(game);
  const maxHp = playerMaxHp(player, game.research.vitality, synergy?.hpPercent, game.prestigeCount);
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
    refreshCombatUi(now);
    return;
  }
  if (battle.status !== "fighting") return;

  if (now >= battle.playerNextAttackAt) {
    const player = activeCombatMonster();
    if (!player) return;
    const online = isRunOnline();
    const damage = playerAttack(player, game.research.power, activeZoneSynergy(game)?.attackPercent, game.prestigeCount) + (online ? 0 : Math.floor(Math.random() * 5));
    battle.enemyHp = Math.max(0, battle.enemyHp - damage);
    battle.playerNextAttackAt = now + 1_650;
    const impactedBattle = battle;
    impactedBattle.enemyHit = true;
    impactedBattle.enemyDamageTaken = damage;
    addLog(`${getMonsterForm(player).name} trifft für ${damage}.`);
    refreshCombatUi(now);
    window.setTimeout(() => {
      if (battle !== impactedBattle) return;
      battle.enemyHit = false;
      battle.enemyDamageTaken = 0;
      refreshCombatUi(performance.now());
    }, 420);

    if (battle.enemyHp <= 0) {
      battle.status = "victory";
      battle.recoveryUntil = now + 1_800;
      if (isRunOnline()) {
        addLog("Kampf beendet. Der Server bestätigt Fortschritt und Beute unabhängig vom Browser.");
        void synchronizeOnlineRun();
        refreshCombatUi(now, true);
        return;
      }
      const result = service.recordVictory(battle.enemyDefinitionId, battle.enemyLevel);
      if (result.unlockedZoneId) addLog(`Zonenboss besiegt! ${getZone(result.unlockedZoneId).name} wurde freigeschaltet.`);
      else if (result.bossDefeated) addLog(`Zonenboss besiegt! Evolutionskern${result.gemId ? " und Gem" : ""} im Kampfspeicher.`);
      else if (result.cacheFull) addLog("Sieg gezählt. Der Kampfspeicher ist voll – bitte Beute einsammeln.");
      else if (result.eggDefinitionId) addLog(`Sieg! +${result.gold} Gold und ein ${getMonster(result.eggDefinitionId).name}-Ei im Speicher.`);
      else if (result.items.length > 0) addLog(`Sieg! +${result.gold} Gold und ${result.items.map((drop) => ITEMS.find((item) => item.id === drop.itemId)?.name).filter(Boolean).join(", ")}.`);
      else addLog(`Sieg! +${result.gold} Gold im Speicher.`);
      refreshCombatUi(now, true);
      return;
    }
  }

  if (now >= battle.enemyNextAttackAt) {
    const online = isRunOnline();
    const values = enemyStats(battle.enemyDefinitionId, battle.enemyLevel, game.prestigeCount);
    const damage = values.attack + (online ? 0 : Math.floor(Math.random() * 3));
    battle.playerHp = Math.max(0, battle.playerHp - damage);
    battle.enemyNextAttackAt = now + 1_900;
    const impactedBattle = battle;
    impactedBattle.playerHit = true;
    impactedBattle.playerDamageTaken = damage;
    addLog(`${combatantName(battle.enemyDefinitionId)} kontert für ${damage}.`);
    refreshCombatUi(now);
    window.setTimeout(() => {
      if (battle !== impactedBattle) return;
      battle.playerHit = false;
      battle.playerDamageTaken = 0;
      refreshCombatUi(performance.now());
    }, 420);
    if (battle.playerHp <= 0) {
      battle.status = "recovering";
      battle.recoveryUntil = now + 3_000;
      addLog("Signal abgebrochen. Drei Sekunden Regeneration – kein Verlust.");
      refreshCombatUi(now);
    }
  }
}

function showNotice(title: string, message: string, tone: NoticeTone = "violet"): void {
  uiNotice = { title, message, tone };
  window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(dismissNotice, 3_600);
  playUiTone(tone);
  render();
}

function dismissNotice(): void {
  uiNotice = null;
  document.querySelector(".ui-notice")?.remove();
}

function applyQaState(preset: QaPreset): void {
  if (!qaEnabled) return;
  applyQaPreset(game, preset);
  if (preset === "prestige") activeView = "prestige";
  else if (preset === "zone-next" || preset === "zone-10" || preset === "combat") activeView = "expedition";
  battle = createBattleState();
  service.save();
  showNotice("QA-Status gesetzt", `Entwicklungs-Preset „${preset}“ wurde lokal angewendet.`, "success");
}

async function collectCache(): Promise<void> {
  const gold = game.pendingGold;
  const eggs = game.pendingEggs.length;
  const items = Object.values(game.pendingItems).reduce((sum, amount) => sum + amount, 0);
  const gems = game.pendingGems.length;
  if (isRunOnline()) {
    const response = await sendOnlineRunCommand({ type: "cache.claim" });
    if (response) showNotice("Beute serverseitig gesichert", `${response.event.payload.gold ?? gold} Gold wurden exakt einmal gebucht.`, "success");
    return;
  }
  if (service.collectCache()) showNotice("Beute gesichert", `${gold} Gold, ${eggs} Eier, ${items} Materialien und ${gems} Gems wurden übertragen.`, "success");
}

async function collectOfflineRewards(): Promise<void> {
  showOfflineReport = false;
  const gold = game.pendingGold;
  const eggs = game.pendingEggs.length;
  const items = Object.values(game.pendingItems).reduce((sum, amount) => sum + amount, 0);
  const gems = game.pendingGems.length;
  if (isRunOnline()) {
    const response = await sendOnlineRunCommand({ type: "cache.claim" });
    if (response) showNotice("Willkommen zurück", `${response.event.payload.gold ?? gold} serverseitig berechnetes Gold wurde eingesammelt.`, "success");
    else render();
  } else if (service.collectCache()) {
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

async function levelUp(uid: string): Promise<void> {
  const monster = game.roster.find((entry) => entry.uid === uid);
  if (isRunOnline()) {
    if (!monster) return;
    const response = await sendOnlineRunCommand({ type: "monster.level_up", definitionId: monster.definitionId });
    if (response) showNotice("Run-Level serverseitig erhöht", `${getMonsterForm(monster).name} ist jetzt Level ${response.event.payload.level}.`, "success");
    return;
  }
  if (!service.levelUp(uid)) return;
  if (uid === game.activeMonsterUid) battle = createBattleState();
  showNotice("Run-Level erhöht", `${monster ? getMonsterForm(monster).name : "Monster"} ist jetzt Level ${monster?.level ?? "–"}.`);
}

async function trainWithData(uid: string): Promise<void> {
  if (isRunOnline()) {
    const response = await sendOnlineRunCommand({ type: "monster.train", monsterUid: uid });
    if (response) showNotice("Trainingsdaten verwendet", `Run-Level ${response.event.payload.level} wurde serverseitig bestätigt.`, "success");
    return;
  }
  if (!service.trainWithData(uid)) return;
  const monster = game.roster.find((entry) => entry.uid === uid);
  if (uid === game.activeMonsterUid) battle = createBattleState();
  showNotice("Trainingsdaten verwendet", `${monster ? getMonsterForm(monster).name : "Monster"} erhält ein kostenloses Run-Level.`, "success");
}

async function evolveMonster(uid: string): Promise<void> {
  if (isRunOnline()) {
    const response = await sendOnlineRunCommand({ type: "monster.evolve", monsterUid: uid });
    if (response) { battle = createBattleState(); showNotice("Evolution abgeschlossen", "Die neue Form wurde dauerhaft auf deinem Account verankert.", "success"); }
    return;
  }
  if (!service.evolve(uid)) return;
  const monster = game.roster.find((entry) => entry.uid === uid);
  if (uid === game.activeMonsterUid) battle = createBattleState();
  showNotice("Evolution abgeschlossen", `${monster ? getMonsterForm(monster).name : "Die neue Form"} wurde dauerhaft freigeschaltet.`, "success");
}

async function upgradeHyper(uid: string): Promise<void> {
  if (isRunOnline()) {
    const response = await sendOnlineRunCommand({ type: "monster.hyper_up", monsterUid: uid });
    if (response) { battle = createBattleState(); showNotice("Permanente Resonanz", `Hyperlevel ${response.event.payload.hyperLevel} ist serverseitig gesichert.`, "success"); }
    return;
  }
  if (!service.upgradeHyper(uid)) return;
  const monster = game.roster.find((entry) => entry.uid === uid);
  if (uid === game.activeMonsterUid) battle = createBattleState();
  showNotice("Permanente Resonanz", `Hyperlevel ${monster?.hyperLevel ?? "–"} bleibt über jedes Prestige hinaus bestehen.`, "success");
}

async function equipGem(uid: string, gemId: string): Promise<void> {
  if (isRunOnline()) {
    const response = await sendOnlineRunCommand({ type: "gem.equip", monsterUid: uid, gemId });
    if (response) { battle = createBattleState(); showNotice("Gem eingesetzt", `${getGem(gemId)?.name ?? "Der Gem"} wirkt jetzt auch in der Serversimulation.`, "success"); }
    return;
  }
  if (!service.equipGem(uid, gemId)) return;
  if (uid === game.activeMonsterUid) battle = createBattleState();
  const gem = getGem(gemId);
  showNotice("Gem eingesetzt", `${gem?.name ?? "Der Gem"} verstärkt jetzt die Grundwerte.`, "success");
}

async function unequipGem(uid: string, gemId: string): Promise<void> {
  if (isRunOnline()) {
    const gem = getGem(gemId);
    if (!gem) return;
    const response = await sendOnlineRunCommand({ type: "gem.unequip", monsterUid: uid, shape: gem.shape });
    if (response) { battle = createBattleState(); showNotice("Gem gelöst", `${gem.name} liegt wieder im serverseitigen Inventar.`, "success"); }
    return;
  }
  if (!service.unequipGem(uid, gemId)) return;
  if (uid === game.activeMonsterUid) battle = createBattleState();
  showNotice("Gem gelöst", `${getGem(gemId)?.name ?? "Der Gem"} liegt wieder im Inventar.`);
}

async function makeActive(uid: string): Promise<void> {
  if (isRunOnline()) {
    const response = await sendOnlineRunCommand({ type: "monster.activate", monsterUid: uid });
    if (response) { battle = createBattleState(); showNotice("Verbindung gewechselt", "Das aktive Monster wurde serverseitig gewechselt.", "success"); }
    return;
  }
  if (!service.makeActive(uid)) return;
  battle = createBattleState();
  const active = activeMonster();
  showNotice("Verbindung gewechselt", `${active ? getMonsterForm(active).name : "Das Monster"} führt jetzt dein Team an.`);
}

async function makeSupport(uid: string): Promise<void> {
  if (isRunOnline()) {
    const response = await sendOnlineRunCommand({ type: "monster.support", monsterUid: uid });
    if (response) { battle = createBattleState(); showNotice("Support verbunden", "Das Kampfduo und sein Zonenbonus sind serverseitig aktiv.", "success"); }
    return;
  }
  if (!service.makeSupport(uid)) return;
  battle = createBattleState();
  const support = game.roster.find((monster) => monster.uid === uid);
  const synergy = activeZoneSynergy(game);
  showNotice("Support verbunden", synergy
    ? `${support ? getMonsterForm(support).name : "Das Monster"} aktiviert ${synergy.name}: ${synergy.description}.`
    : `${support ? getMonsterForm(support).name : "Das Monster"} ist im zweiten Expeditionsplatz. Für diese Zone passt die Rollenkombination noch nicht.`);
}

async function selectZone(zoneId: string): Promise<void> {
  if (isRunOnline()) {
    const response = await sendOnlineRunCommand({ type: "zone.select", zoneId });
    if (response) showNotice("Expeditionsziel serverseitig geändert", `${getZone(zoneId).name} ist jetzt deine aktive Zone.`, "success");
    return;
  }
  if (!service.selectZone(zoneId)) return;
  battle = createBattleState();
  showNotice("Expeditionsziel geändert", `${getZone(zoneId).name} ist jetzt deine aktive Zone.`);
}

async function chooseStarter(definitionId: string): Promise<void> {
  if (accountApiEnabled) {
    if (!accountBootstrap || authBusy) return;
    authBusy = true;
    try {
      const response = await accountClient.command({ type: "starter.choose", definitionId }, accountBootstrap.profile.revision, clientInstanceId);
      accountBootstrap = response.bootstrap;
    } catch (error) {
      authBusy = false;
      showNotice("Starterwahl nicht gespeichert", error instanceof AccountApiError ? error.message : "Der Account-Server ist nicht erreichbar.", "warning");
      return;
    }
    authBusy = false;
  }
  if (!service.chooseStarter(definitionId)) return;
  starterDialogOpen = false;
  showLogin = false;
  showOfflineReport = false;
  activeView = "expedition";
  clientUiState = accountApiEnabled ? "online" : "local";
  battle = createBattleState();
  const starter = activeMonster();
  showNotice("Resonanz verbunden", `${starter ? getMonsterForm(starter).name : "Dein Rookie"} ist dein erster Partner.`, "success");
  if (accountApiEnabled) await synchronizeOnlineRun();
}

async function startIncubation(definitionId: string): Promise<void> {
  if (isRunOnline()) {
    const response = await sendOnlineRunCommand({ type: "incubation.start", definitionId });
    if (response) showNotice("Inkubation gestartet", `${getMonster(definitionId).name}-Ei wird nach Serverzeit ausgebrütet.`, "success");
    return;
  }
  if (!service.startIncubation(definitionId)) return;
  showNotice("Inkubation gestartet", `${getMonster(definitionId).name}-Ei wurde in Brutstation 01 eingesetzt.`);
}

async function hatchIncubation(): Promise<void> {
  if (isRunOnline()) {
    const response = await sendOnlineRunCommand({ type: "incubation.hatch" });
    if (!response) return;
    const name = getMonster(String(response.event.payload.definitionId)).name;
    hatchNotice = response.event.payload.kind === "discovery" ? `${name} wurde deiner Sammlung hinzugefügt.` : `${response.event.payload.fragments} ${name}-Fragmente wurden gutgeschrieben.`;
    showNotice(response.event.payload.kind === "discovery" ? "Neue Resonanz entdeckt" : "Fragmente gewonnen", hatchNotice, "success");
    return;
  }
  const result = service.hatchIncubation();
  if (!result) return;
  const name = getMonster(result.definitionId).name;
  hatchNotice = result.kind === "discovery"
    ? `${name} wurde als neues Rookie-Monster in deine Sammlung aufgenommen.`
    : `${name} war bereits bekannt. Du erhältst ${result.fragments} ${name}-Fragmente.`;
  showNotice(result.kind === "discovery" ? "Neue Resonanz entdeckt" : "Fragmente gewonnen", hatchNotice, "success");
}

async function accelerateIncubation(): Promise<void> {
  if (isRunOnline()) {
    const response = await sendOnlineRunCommand({ type: "incubation.accelerate" });
    if (response) showNotice("Brutladung eingesetzt", "Die serverseitige Fertigzeit wurde um 60 Sekunden verkürzt.", "success");
    return;
  }
  if (service.useIncubatorCharge()) showNotice("Brutladung eingesetzt", "Die Inkubation wurde um 60 Sekunden verkürzt.", "success");
}

async function setAvatar(avatarId: string): Promise<void> {
  if (accountApiEnabled) {
    if (!accountBootstrap) return;
    try {
      const response = await accountClient.command({ type: "profile.avatar", avatarId }, accountBootstrap.profile.revision, clientInstanceId);
      accountBootstrap = response.bootstrap;
    } catch (error) {
      showNotice("Avatar nicht gespeichert", error instanceof AccountApiError ? error.message : "Der Account-Server ist nicht erreichbar.", "warning");
      return;
    }
  }
  if (service.setAvatar(avatarId)) showNotice("Avatar gewechselt", `${AVATARS.find((avatar) => avatar.id === avatarId)?.name ?? "Avatar"} ist jetzt aktiv.`);
}

async function setFrame(frameId: string): Promise<void> {
  if (accountApiEnabled) {
    if (!accountBootstrap) return;
    try {
      const response = await accountClient.command({ type: "profile.frame", frameId }, accountBootstrap.profile.revision, clientInstanceId);
      accountBootstrap = response.bootstrap;
    } catch (error) {
      showNotice("Rahmen nicht gespeichert", error instanceof AccountApiError ? error.message : "Der Account-Server ist nicht erreichbar.", "warning");
      return;
    }
  }
  if (service.setFrame(frameId)) showNotice("Rahmen gewechselt", `${FRAMES.find((frame) => frame.id === frameId)?.name ?? "Rahmen"} ist jetzt aktiv.`);
}

async function buyResearch(id: ResearchId): Promise<void> {
  if (isRunOnline()) {
    const response = await sendOnlineRunCommand({ type: "research.buy", researchId: id });
    if (response) { battle = createBattleState(); showNotice("Forschung abgeschlossen", `Stufe ${response.event.payload.level} ist dauerhaft gespeichert.`, "success"); }
    return;
  }
  if (!service.buyResearch(id)) return;
  if (id === "power" || id === "vitality") battle = createBattleState();
  const definition = RESEARCH.find((entry) => entry.id === id);
  showNotice("Forschung abgeschlossen", `${definition?.name ?? "Projekt"} erreicht Stufe ${game.research[id]}.`, "success");
}

async function claimMilestone(target: number): Promise<void> {
  if (isRunOnline()) {
    const response = await sendOnlineRunCommand({ type: "milestone.claim", target });
    if (response) showNotice("Story-Belohnung geborgen", `${response.event.payload.title} wurde exakt einmal gutgeschrieben.`, "success");
    return;
  }
  const milestone = MILESTONES.find((entry) => entry.target === target);
  if (service.claimMilestone(target)) showNotice("Story-Belohnung geborgen", `${milestone?.title ?? "Meilenstein"} wurde deinem Account gutgeschrieben.`, "success");
}

async function claimObjective(objectiveId: string): Promise<void> {
  if (isRunOnline()) {
    const response = await sendOnlineRunCommand({ type: "objective.claim", objectiveId });
    if (response) showNotice("Belohnung geborgen", "Der Auftrag wurde serverseitig geprüft und gebucht.", "success");
    return;
  }
  const objective = OBJECTIVES.find((entry) => entry.id === objectiveId);
  if (!service.claimObjective(objectiveId)) return;
  showNotice("Belohnung geborgen", `${objective?.title ?? "Auftrag"} wurde deinem Inventar gutgeschrieben.`, "success");
}

async function startTimedExpedition(slot: number, definitionId: string, monsterUid: string): Promise<void> {
  if (isRunOnline()) {
    const response = await sendOnlineRunCommand({ type: "expedition.start", slot, definitionId, monsterUid });
    if (response) showNotice("Expedition gestartet", "Monster, Slot und Rückkehrzeit sind serverseitig reserviert.", "success");
    return;
  }
  const definition = getExpedition(definitionId);
  const monster = game.roster.find((entry) => entry.uid === monsterUid);
  if (!service.startExpedition(slot, definitionId, monsterUid)) return;
  showNotice("Expedition gestartet", `${monster ? getMonsterForm(monster).name : "Monster"} erkundet jetzt „${definition?.name ?? "unbekanntes Signal"}“.`, "success");
}

async function claimTimedExpedition(expeditionId: string): Promise<void> {
  if (isRunOnline()) {
    const response = await sendOnlineRunCommand({ type: "expedition.claim", expeditionId });
    if (response) showNotice("Expedition abgeschlossen", `${response.event.payload.gold} Gold und Materialien wurden serverseitig gebucht.`, "success");
    return;
  }
  const expedition = game.expeditions.find((entry) => entry.id === expeditionId);
  const definition = expedition ? getExpedition(expedition.definitionId) : undefined;
  const result = service.claimExpedition(expeditionId);
  if (!result) return;
  const itemCount = result.items.reduce((sum, item) => sum + item.amount, 0);
  showNotice("Expedition abgeschlossen", `${definition?.name ?? "Auftrag"}: ${result.gold} Gold${itemCount > 0 ? ` und ${itemCount} Materialien` : ""} gesichert.`, "success");
}

async function craftRecipe(recipeId: string): Promise<void> {
  if (isRunOnline()) {
    const response = await sendOnlineRunCommand({ type: "crafting.craft", recipeId });
    if (response) showNotice("Herstellung abgeschlossen", "Kosten und Ergebnis wurden atomar im Ledger gebucht.", "success");
    return;
  }
  const recipe = getCraftingRecipe(recipeId);
  if (!service.craftItem(recipeId)) return;
  const output = recipe ? ITEMS.find((item) => item.id === recipe.output.itemId) : undefined;
  showNotice("Herstellung abgeschlossen", `${recipe?.output.amount ?? 1}× ${output?.name ?? "Material"} wurde dem Inventar hinzugefügt.`, "success");
}

async function updatePlayerSetting(key: keyof PlayerSettings, rawValue: string): Promise<void> {
  const value = key === "numberFormat" ? rawValue : rawValue === "true";
  if (isRunOnline()) {
    const response = await sendOnlineRunCommand({ type: "settings.update", key, value: value as boolean | PlayerSettings["numberFormat"] });
    if (response) showNotice("Einstellung gespeichert", "Die Einstellung gilt jetzt auf allen Geräten.", "success");
    return;
  }
  if (!service.setSetting(key, value as boolean | PlayerSettings["numberFormat"])) return;
  showNotice("Einstellung gespeichert", "Die Darstellung wurde sofort aktualisiert.", "success");
}

async function advanceTutorial(skip = false): Promise<void> {
  if (isRunOnline()) { await sendOnlineRunCommand({ type: "tutorial.advance", skip }); render(); return; }
  if (!service.advanceTutorial(skip)) return;
  render();
}

async function claimSystemMessage(messageId: string): Promise<void> {
  if (isRunOnline()) {
    const response = await sendOnlineRunCommand({ type: "system_message.claim", messageId });
    if (response) showNotice("Systempost bestätigt", "Die Belohnung wurde exakt einmal gutgeschrieben.", "success");
    return;
  }
  const message = SYSTEM_MESSAGES.find((entry) => entry.id === messageId);
  if (!service.claimSystemMessage(messageId)) return;
  showNotice("Systempost bestätigt", `${message?.title ?? "Nachricht"} wurde abgeschlossen.`, "success");
}

function openPrestigeScene(): void {
  setView("prestige");
}

function confirmPrestige(): void {
  if (prestigeActivating || prestigeCoreReward(game.runVictories, game.highestZoneNumber) <= 0) return;
  prestigeActivating = true;
  render();
  window.setTimeout(async () => {
    if (isRunOnline()) {
      const response = await sendOnlineRunCommand({ type: "prestige.activate" });
      prestigeActivating = false;
      if (!response) return render();
      activeView = "expedition";
      battle = createBattleState();
      showNotice("Neue Zeitlinie gestartet", `${response.event.payload.cores} Ether-Kern(e) gesichert. Sammlung, Hyperlevel, Evolutionen und Gems blieben erhalten.`, "success");
      return;
    }
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
  if (view === "guild") void synchronizeGuild();
}

function enterLocalPrototype(): void {
  showLogin = false;
  activeView = "expedition";
  if (game.roster.length === 0) starterDialogOpen = true;
  else {
    showOfflineReport = true;
    battle = createBattleState();
  }
  render();
  window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
}

function activateAccount(bootstrap: AccountBootstrapResponse): boolean {
  const namespace = bootstrap.authority.localStorageNamespace;
  if (persistedAccountNamespace !== namespace) {
    localStorage.setItem(ACTIVE_ACCOUNT_NAMESPACE_KEY, namespace);
    window.location.reload();
    return false;
  }
  accountBootstrap = bootstrap;
  if (bootstrap.account.status === "deletion_pending") {
    deletionPending = true;
    showLogin = true;
    clientUiState = "online";
    authMessageTone = "error";
    authMessage = "Dieser Account ist zur Löschung vorgemerkt. Der Spielzugang bleibt bis zum Abbruch gesperrt.";
    render();
    return false;
  }
  deletionPending = false;
  game.playerName = bootstrap.profile.displayName;
  game.profile.avatarId = bootstrap.profile.avatarId;
  game.profile.frameId = bootstrap.profile.frameId;
  service.save();
  const serverStarter = bootstrap.onboarding.starterDefinitionId;
  if (serverStarter && game.roster.length === 0) service.chooseStarter(serverStarter);
  if (serverStarter && game.roster[0]?.definitionId !== serverStarter) {
    clientUiState = "conflict";
    authMessage = "Der lokale Starter passt nicht zum Account. Der lokale Spielstand wurde sicherheitshalber nicht geöffnet.";
    authMessageTone = "error";
    showLogin = true;
    render();
    return false;
  }
  showLogin = false;
  clientUiState = "online";
  activeView = "expedition";
  starterDialogOpen = !serverStarter;
  showOfflineReport = Boolean(serverStarter && (loaded.offlineSeconds > 0 || game.cacheSlotsUsed > 0));
  battle = createBattleState();
  render();
  if (serverStarter) void synchronizeOnlineRun(true);
  if (bootstrap.features.guilds) void synchronizeGuild();
  return true;
}

async function signIn(form: HTMLFormElement): Promise<void> {
  if (authBusy || clientUiState === "loading") return;
  if (!accountApiEnabled) return enterLocalPrototype();
  const formData = new FormData(form);
  authBusy = true;
  authMessage = "";
  render();
  try {
    const bootstrap = await accountClient.login(
      String(formData.get("identifier") ?? ""),
      String(formData.get("password") ?? ""),
      formData.get("rememberMe") === "on",
      clientInstanceId,
    );
    authBusy = false;
    activateAccount(bootstrap);
  } catch (error) {
    authBusy = false;
    authMessageTone = "error";
    authMessage = error instanceof AccountApiError ? error.message : "Der Account-Server ist gerade nicht erreichbar.";
    clientUiState = "local";
    render();
  }
}

async function registerAccount(form: HTMLFormElement): Promise<void> {
  if (!accountApiEnabled || authBusy) return;
  const formData = new FormData(form);
  authBusy = true;
  authMessage = "";
  render();
  try {
    await accountClient.register({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      displayName: String(formData.get("displayName") ?? ""),
      clientInstanceId,
      termsVersion: "alpha-foundation-1",
      privacyVersion: "alpha-foundation-1",
    });
    authMode = "login";
    authMessageTone = "success";
    authMessage = "Account vorbereitet. Diese geschlossene Alpha verschickt noch keine externen E-Mails – das Testteam bestätigt deinen Zugang über die private Alpha-Mailbox.";
  } catch (error) {
    authMessageTone = "error";
    authMessage = error instanceof AccountApiError ? error.message : "Die Registrierung konnte nicht abgeschlossen werden.";
  }
  authBusy = false;
  render();
}

async function initializeAccount(): Promise<void> {
  if (!accountApiEnabled) return;
  const fragment = new URLSearchParams(window.location.hash.replace(/^#/u, ""));
  const verificationToken = fragment.get("verify-email");
  if (verificationToken) {
    try {
      await accountClient.verifyEmail(verificationToken);
      authMessageTone = "success";
      authMessage = "E-Mail bestätigt. Du kannst dich jetzt einloggen.";
    } catch (error) {
      authMessageTone = "error";
      authMessage = error instanceof AccountApiError ? error.message : "Der Bestätigungslink konnte nicht geprüft werden.";
    }
    window.history.replaceState({}, "", `${window.location.pathname}${window.location.search}`);
  }
  try {
    const bootstrap = await accountClient.bootstrap();
    activateAccount(bootstrap);
  } catch (error) {
    showLogin = true;
    clientUiState = error instanceof AccountApiError && error.status === 401 ? "local" : "offline";
    render();
  }
}

async function logoutAccount(): Promise<void> {
  if (!accountApiEnabled) {
    showLogin = true;
    return render();
  }
  try { await accountClient.logout(); } catch { /* local logout must still complete */ }
  localStorage.removeItem(ACTIVE_ACCOUNT_NAMESPACE_KEY);
  window.location.reload();
}

async function cancelAccountDeletion(): Promise<void> {
  if (!deletionPending || authBusy) return;
  authBusy = true;
  try {
    const bootstrap = await accountClient.cancelDeletion();
    authBusy = false;
    authMessage = "Löschung abgebrochen. Dein Account ist wieder aktiv.";
    authMessageTone = "success";
    activateAccount(bootstrap);
  } catch (error) {
    authBusy = false;
    authMessageTone = "error";
    authMessage = error instanceof AccountApiError ? error.message : "Die Löschung konnte nicht abgebrochen werden.";
    render();
  }
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
  const image = kind === "cores" ? "/assets/items/prestige-core.png" : kind === "eggs" ? "/assets/eggs/mystery.png" : undefined;
  if (image) return `<span class="resource-icon resource-icon--${kind}" aria-hidden="true"><img src="${image}" alt=""></span>`;
  const label = { gold: "◆", cores: "◈", eggs: "○", fragments: "△" }[kind];
  return `<span class="resource-icon resource-icon--${kind}" aria-hidden="true">${label}</span>`;
}

function brandMarkup(compact = false): string {
  return `<span class="brand__mark"><i></i></span>${compact ? "" : `<span class="brand__copy"><strong>IDLE <span>TAMER</span></strong><small>ETHER PROTOCOL</small></span>`}`;
}

function officialLogoMarkup(): string {
  return `<img class="official-logo" src="/assets/branding/idle-tamer-world-logo.png" alt="Idle Tamer World" width="1024" height="1024" draggable="false">`;
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

function qaPanel(): string {
  if (!qaEnabled || showLogin) return "";
  return `<aside class="qa-panel" aria-label="Lokale Entwicklungswerkzeuge" data-testid="qa-panel">
    <span><b>DEV QA</b><small>nur lokaler Build</small></span>
    <button data-qa="zone-next">+ ZONE</button>
    <button data-qa="zone-10">ZONE 10</button>
    <button data-qa="resources">RESSOURCEN</button>
    <button data-qa="combat">KAMPF</button>
    <button data-qa="prestige">PRESTIGE</button>
  </aside>`;
}

function topShell(content: string): string {
  const rank = rankForVictories(game.totalVictories);
  return `
    <div class="app-shell app-shell--${activeView} app-shell--zone-${game.currentZoneId}">
      <div class="ambient ambient--game" aria-hidden="true"><i></i><i></i><i></i></div>
      <header class="topbar">
        <button class="brand" data-home aria-label="Zur Idle-Tamer-Homepage">${brandMarkup()}</button>
        <nav class="main-nav" aria-label="Spielbereiche">
          ${navButton("expedition", "Kampf")}${activeView === "objectives" ? navButton("objectives", "Aufträge") : ""}${navButton("dispatch", "Expeditionen")}${navButton("habitat", "Monster")}${navButton("incubation", "Brutstation")}${navButton("inventory", "Inventar")}${navButton("research", "Forschung")}${navButton("guild", "Gilde")}
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
    ${qaPanel()}${clientStatusMarkup()}${uiNoticeMarkup()}${starterDialog()}`;
}

function combatShell(content: string): string {
  return `
    <div class="combat-shell combat-shell--${game.currentZoneId} ${combatFocusMode ? "is-focus-mode" : ""}">${content}</div>
    ${qaPanel()}${clientStatusMarkup()}${uiNoticeMarkup()}${offlineReport()}${starterDialog()}`;
}

function prestigeShell(content: string): string {
  return `<div class="prestige-shell">${content}</div>${qaPanel()}${clientStatusMarkup()}${uiNoticeMarkup()}`;
}

function loginShell(): string {
  const previewMonster = activeMonster() ?? createMonster("pyrook", 1);
  const previewDefinition = getMonsterForm(previewMonster);
  const accountForm = authMode === "login" ? `
        <form id="login-form" class="login-form">
          <label for="login-identifier"><span>E-MAIL</span><input id="login-identifier" name="identifier" type="email" autocomplete="username" value="${accountApiEnabled ? "" : "demo@idletamer.local"}" required></label>
          <label for="login-password"><span>PASSWORT</span><input id="login-password" name="password" type="password" autocomplete="current-password" value="${accountApiEnabled ? "" : "demo"}" required></label>
          <div class="login-form__meta"><label><input name="rememberMe" type="checkbox" checked> <span>Angemeldet bleiben</span></label><button type="button" disabled>Passwort vergessen</button></div>
          <button class="primary-button primary-button--large login-submit" type="submit" data-testid="login-submit" ${authBusy || clientUiState === "loading" ? "disabled" : ""}>${authBusy ? "VERBINDUNG WIRD GEPRÜFT …" : `EINLOGGEN ${icon("arrow")}`}</button>
        </form>` : `
        <form id="register-form" class="login-form">
          <label for="register-email"><span>E-MAIL</span><input id="register-email" name="email" type="email" autocomplete="email" required></label>
          <label for="register-name"><span>TAMER-NAME</span><input id="register-name" name="displayName" type="text" autocomplete="nickname" minlength="3" maxlength="20" required></label>
          <label for="register-password"><span>PASSPHRASE · MINDESTENS 15 ZEICHEN</span><input id="register-password" name="password" type="password" autocomplete="new-password" minlength="15" maxlength="128" required></label>
          <label class="login-policy"><input name="policy" type="checkbox" required><span>Ich akzeptiere die Alpha-Nutzungsbedingungen und Datenschutzhinweise.</span></label>
          <button class="primary-button primary-button--large login-submit" type="submit" ${authBusy ? "disabled" : ""}>${authBusy ? "ACCOUNT WIRD VORBEREITET …" : `ACCOUNT ERSTELLEN ${icon("arrow")}`}</button>
        </form>`;
  return `
    <main class="login-screen" data-testid="login-screen">
      <div class="login-screen__backdrop" aria-hidden="true"></div>
      <section class="login-world" aria-label="Vorschau auf die Spielwelt">
        <div class="login-world__brand">${officialLogoMarkup()}</div>
        <div class="login-world__copy">
          <span><i></i> ETHER-NETZWERK BEREIT</span>
          <h1>Dein Partner<br>kämpft weiter.</h1>
          <p>Einloggen, Offline-Beute sichern und direkt zurück in die laufende Expedition.</p>
        </div>
        <div class="login-world__monster">${monsterAvatar(previewMonster, "left")}<div><small>LETZTE RESONANZ</small><strong>${previewDefinition.name}</strong><span>LV ${previewMonster.level} · HYPER ${previewMonster.hyperLevel}</span></div></div>
        <div class="login-world__status"><span><i></i> AUTOMATISCHE EXPEDITION</span><small>Violetter Saum · Signal stabil</small></div>
      </section>
      <section class="login-panel" aria-labelledby="login-title">
        <div class="login-panel__mobile-brand">${officialLogoMarkup()}</div>
        <span class="eyebrow">ACCOUNT-ZUGANG</span>
        <h2 id="login-title">${authMode === "login" ? "Willkommen zurück." : "Neue Resonanz beginnen."}</h2>
        <p>${authMode === "login" ? "Einloggen, Offline-Ertrag prüfen und direkt in den automatischen Kampf zurückkehren." : "Dein Accountprofil und dein Starter werden online gesichert. Bestätigungen erfolgen in der geschlossenen Alpha noch durch das Testteam."}</p>
        <div class="auth-mode-tabs"><button id="auth-mode-login" class="${authMode === "login" ? "is-active" : ""}" type="button">EINLOGGEN</button><button id="auth-mode-register" class="${authMode === "register" ? "is-active" : ""}" type="button">REGISTRIEREN</button></div>
        ${authMessage ? `<div class="auth-message auth-message--${authMessageTone}" role="status">${authMessage}${deletionPending ? '<button class="secondary-button" id="cancel-account-deletion" data-testid="cancel-account-deletion" type="button">LÖSCHUNG ABBRECHEN</button>' : ""}</div>` : ""}
        ${accountForm}
        <div class="login-panel__backend"><span>${icon("shield")}</span><div><strong>${accountApiEnabled ? "Account, Sammlung & Gilden online" : "Lokaler UI-Testmodus"}</strong><small>${accountApiEnabled ? "Kampf, Besitz, Zeitjobs, Prestige und soziale Änderungen werden von PostgreSQL bestätigt." : "Der Entwicklungsbrowser nutzt weiterhin den schnellen lokalen Testzugang."}</small></div></div>
        <small class="login-panel__version">CLIENT V0.2 · SAVE V${game.version} · API ${API_PROTOCOL_VERSION} · CONTENT ${CONTENT_RELEASE_ID}</small>
      </section>
    </main>
    ${clientStatusMarkup()}${uiNoticeMarkup()}${starterDialog()}`;
}

function combatZoneTabs(): string {
  const currentIndex = Math.max(0, ZONES.findIndex((zone) => zone.id === game.currentZoneId));
  const startIndex = Math.max(0, Math.min(currentIndex - 1, ZONES.length - 3));
  const visibleZones = ZONES.slice(startIndex, startIndex + 3);
  return `<nav class="combat-zone-tabs" aria-label="Expeditionszonen">${visibleZones.map((zone, localIndex) => {
    const index = startIndex + localIndex;
    const unlocked = game.unlockedZoneIds.includes(zone.id);
    const progress = game.zoneProgress[zone.id] ?? { stage: 1, clears: 0 };
    return `<button class="combat-zone-tab ${zone.id === game.currentZoneId ? "is-active" : ""}" data-zone="${zone.id}" ${unlocked ? "" : "disabled"} style="--zone-accent:${zone.accent}" aria-label="${zone.name}${unlocked ? `, Stage ${progress.stage}` : ", verschlossen"}">
      <span>${String(index + 1).padStart(2, "0")}</span><div><strong>${zone.name}</strong><small>${unlocked ? `STAGE ${progress.stage}/${zone.stages}` : "VERSCHLOSSEN"}</small></div><i></i>
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
    ["guild", "Gilde"],
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
  return `<nav class="combat-control-dock" aria-label="Kampfoptionen">${controls.map((control) => `<button class="${activeCombatPanel === control.panel ? "is-active" : ""}" data-combat-panel="${control.panel}" aria-pressed="${activeCombatPanel === control.panel}" title="${control.label}">${icon(control.iconName)}<span>${control.label}</span><i data-live="control-badge-${control.panel}" ${control.badge ? "" : "hidden"}>${control.badge ?? ""}</i></button>`).join("")}<button class="combat-focus-button ${combatFocusMode ? "is-active" : ""}" id="combat-focus-toggle" aria-pressed="${combatFocusMode}" title="${combatFocusMode ? "HUD einblenden" : "Fokusmodus"}">${icon("eye")}<span>${combatFocusMode ? "HUD ein" : "Fokus"}</span></button></nav>`;
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

function combatPlayerMarkup(player: MonsterInstance, currentBattle: BattleState): string {
  const definition = getMonsterForm(player);
  const hpPercent = Math.max(0, (currentBattle.playerHp / currentBattle.playerMaxHp) * 100);
  return `<div class="nameplate"><div><span><small>DEINE RESONANZ</small><strong>${definition.name}</strong></span><b>LV ${player.level}<i>H${player.hyperLevel}</i></b></div><div class="hp-track"><i style="width:${hpPercent}%"></i></div><small>${currentBattle.playerHp} / ${currentBattle.playerMaxHp} HP</small></div>${monsterAvatar(player, "left", currentBattle.playerHit && game.settings.combatEffects)}${currentBattle.playerHit && game.settings.combatEffects ? `<span class="impact-number impact-number--player">−${currentBattle.playerDamageTaken}</span>` : ""}`;
}

function combatEnemyMarkup(currentBattle: BattleState, bossStage: boolean): string {
  const definition = getEncounter(currentBattle.enemyDefinitionId);
  const hpPercent = Math.max(0, (currentBattle.enemyHp / currentBattle.enemyMaxHp) * 100);
  return `<div class="nameplate"><div><span><small>${bossStage ? "ZONENBOSS" : "WILDSIGNAL"}</small><strong>${definition.name}</strong></span><b>LV ${currentBattle.enemyLevel}</b></div><div class="hp-track hp-track--enemy"><i style="width:${hpPercent}%"></i></div><small>${currentBattle.enemyHp} / ${currentBattle.enemyMaxHp} HP</small></div>${encounterAvatar(definition.id, "right", currentBattle.enemyHit && game.settings.combatEffects)}${currentBattle.enemyHit && game.settings.combatEffects ? `<span class="impact-number impact-number--enemy">−${currentBattle.enemyDamageTaken}</span>` : ""}`;
}

function combatObjectiveMarkup(): string {
  const claimable = MILESTONES.find((milestone) => game.totalVictories >= milestone.target && !game.claimedMilestones.includes(milestone.target));
  const upcoming = nextMilestone(game.totalVictories);
  const previousTarget = upcoming ? [...MILESTONES].reverse().find((milestone) => milestone.target < upcoming.target)?.target ?? 0 : 0;
  const missionPercent = upcoming ? Math.min(100, ((game.totalVictories - previousTarget) / (upcoming.target - previousTarget)) * 100) : 100;
  const readyObjectives = OBJECTIVES.filter((objective) => isObjectiveClaimable(game, objective)).length;
  const prestigeZoneReady = game.highestZoneNumber >= BALANCE.prestige.requiredZoneNumber;
  const prestigeReward = prestigeCoreReward(game.runVictories, game.highestZoneNumber);
  const prestigeProgress = prestigeZoneReady ? Math.min(100, game.runVictories) : Math.min(100, (game.highestZoneNumber / BALANCE.prestige.requiredZoneNumber) * 100);
  const milestone = claimable
    ? `<div><small>STORY-BELOHNUNG BEREIT</small><strong>${claimable.title}</strong><span>${claimable.reward.gold} Gold${claimable.reward.eggId ? ` · ${getMonster(claimable.reward.eggId).name}-Ei` : ""}</span></div><button class="primary-button" data-milestone="${claimable.target}">BERGEN</button>`
    : upcoming
      ? `<div><small>NÄCHSTER STORY-KNOTEN</small><strong>${upcoming.title}</strong><span>${game.totalVictories} / ${upcoming.target} Siege</span></div><div class="combat-objective-progress"><i style="width:${missionPercent}%"></i></div>`
      : `<div><small>KAPITEL ABGESCHLOSSEN</small><strong>Das nächste Signal wartet.</strong><span>500 / 500 Siege</span></div>`;
  return `${milestone}<button class="combat-objectives-link" data-view="objectives"><span>${icon("objectives")}</span><div><small>AUFTRAGSZENTRALE</small><strong>${readyObjectives > 0 ? `${readyObjectives} BELOHNUNG${readyObjectives === 1 ? "" : "EN"} BEREIT` : "TÄGLICH · WÖCHENTLICH · ERFOLGE"}</strong></div></button><button class="combat-prestige" id="start-prestige"><span>∞</span><div><small>${prestigeZoneReady ? `ETHER-KRISTALL ${game.runVictories}/100` : `PRESTIGE-ZUGANG · ZONE ${game.highestZoneNumber}/${BALANCE.prestige.requiredZoneNumber}`}</small><strong>${prestigeReward > 0 ? `${prestigeReward} KERN${prestigeReward === 1 ? "" : "E"} BEREIT` : prestigeZoneReady ? "PRESTIGE ANSEHEN" : `AB ZONE ${BALANCE.prestige.requiredZoneNumber}`}</strong><i><em style="width:${prestigeProgress}%"></em></i></div></button>`;
}

function expeditionView(): string {
  const player = activeCombatMonster();
  if (!player || !battle) return starterGate();
  const playerDefinition = getMonsterForm(player);
  const playerLineage = getMonster(player.definitionId);
  const support = game.roster.find((monster) => monster.uid === game.supportMonsterUid) ?? null;
  const zoneSynergy = activeZoneSynergy(game);
  const chapter = currentChapter(game.totalVictories);
  const claimable = MILESTONES.find((milestone) => game.totalVictories >= milestone.target && !game.claimedMilestones.includes(milestone.target));
  const pendingMaterialCount = Object.values(game.pendingItems).reduce((sum, amount) => sum + amount, 0);
  const pendingFindCount = pendingMaterialCount + game.pendingGems.length;
  const cacheEmpty = game.pendingGold === 0 && game.pendingEggs.length === 0 && pendingFindCount === 0;
  const capacity = activeCacheCapacity();
  const eggGuarantee = Math.max(1, BALANCE.drops.eggPityMisses + 1 - game.eggPity);
  const zone = getZone(game.currentZoneId);
  const zoneNumber = ZONES.findIndex((entry) => entry.id === zone.id) + 1;
  const zoneProgress = game.zoneProgress[zone.id] ?? { stage: 1, clears: 0 };
  const bossStage = zoneProgress.stage >= zone.stages;
  const playerAttackProgress = battle.status === "fighting" ? Math.max(3, Math.min(100, 100 - ((battle.playerNextAttackAt - performance.now()) / 1_650) * 100)) : 100;
  const rank = rankForVictories(game.totalVictories);

  return `
    <main class="combat-main" data-testid="combat-scene">
      <section class="combat-battlefield battle-stage battle-stage--${zone.id} battle-stage--${battle.status}" style="--battle-background:url('${zoneBackgroundUrl(zone.backgroundKey)}')">
        <div class="battle-stage__sky" aria-hidden="true"><i></i><i></i><i></i></div>
        <div class="combat-vignette" aria-hidden="true"></div>
        <header class="combat-top-hud">
          <div class="combat-brand">${brandMarkup()}</div>
          ${combatZoneTabs()}
          <div class="combat-account"><div class="resources"><span title="Run-Gold">${resourceIcon("gold")}<b data-live="run-gold">${formatNumber(game.resources.gold)}</b></span><span title="Prestige-Kerne">${resourceIcon("cores")}<b data-live="prestige-cores">${formatNumber(game.resources.cores)}</b></span></div><span class="rank-chip"><small>RANG</small><b data-live="rank">${rank}</b></span><button class="profile-chip" data-view="profile" title="Profil öffnen">${accountAvatar()}</button></div>
        </header>
        ${combatRail()}
        <section class="combat-story-hud combat-panel--missions ${activeCombatPanel === "missions" ? "is-open" : ""}"><span class="combat-story-hud__chapter" data-live="story-chapter">${String(chapter.chapter).padStart(2, "0")}</span><div><small data-live="story-run">AKTUELLES SIGNAL · RUN ${game.runVictories}</small><strong data-live="story-title">${chapter.title}</strong><p data-live="story-copy">${chapter.story}</p></div></section>
        <div class="combat-world-label"><small data-live="zone-stage">ZONE ${String(zoneNumber).padStart(2, "0")} · ${bossStage ? "BOSS-SIGNAL" : `STAGE ${zoneProgress.stage}/${zone.stages}`}</small><strong data-live="zone-name">${zone.name}</strong><span data-live="zone-subtitle">${zone.subtitle}</span></div>
        <div class="battle-state-banner battle-state-banner--${battle.status}" data-live="battle-banner" ${battle.status === "fighting" ? "hidden" : ""}><small>${battle.status === "victory" ? "SIGNAL GESICHERT" : "RESONANZ WIRD NEU GEKOPPELT"}</small><strong>${battle.status === "victory" ? "STAGE GESCHAFFT" : "REGENERATION"}</strong></div>
        <div class="combat-duel">
          <div class="fighter fighter--player">${combatPlayerMarkup(player, battle)}</div>
          <div class="versus"><span>VS</span><small>AUTO</small></div>
          <div class="fighter fighter--enemy">${combatEnemyMarkup(battle, bossStage)}</div>
        </div>
        <aside class="combat-loot-hud combat-panel--loot ${activeCombatPanel === "loot" ? "is-open" : ""} ${cacheEmpty ? "is-empty" : "has-loot"}"><div class="combat-hud-heading"><span><i></i>KAMPFSPEICHER</span><small data-live="cache-slots">${game.cacheSlotsUsed}/${capacity}</small></div><div class="combat-loot-values"><span>${resourceIcon("gold")}<small>GOLD</small><b data-live="pending-gold">${formatNumber(game.pendingGold)}</b></span><span>${resourceIcon("eggs")}<small>EIER</small><b data-live="pending-eggs">${game.pendingEggs.length}</b></span><span>${icon("inventory")}<small>FUNDE</small><b data-live="pending-finds">${pendingFindCount}</b></span></div><div class="combat-capacity"><i data-live="cache-progress" style="width:${Math.min(100, (game.cacheSlotsUsed / capacity) * 100)}%"></i></div><button class="primary-button" id="collect-cache" ${cacheEmpty ? "disabled" : ""}>${cacheEmpty ? "SPEICHER LEER" : `EINSAMMELN ${icon("arrow")}`}</button></aside>
        <aside class="combat-duo-hud combat-panel--duo ${activeCombatPanel === "duo" ? "is-open" : ""}"><div class="combat-hud-heading"><span>EXPEDITIONS-DUO</span><small>${elementLabel[playerLineage.element]}</small></div><div class="combat-duo-line"><div>${monsterAvatar(player)}<span><small>FRONT · ${COMBAT_ROLE_LABELS[playerDefinition.combatRole]}</small><strong>${playerDefinition.name}</strong></span></div><i>+</i><button data-view="habitat">${support ? `${monsterAvatar(support)}<span><small>SUPPORT · ${COMBAT_ROLE_LABELS[getMonsterForm(support).combatRole]}</small><strong>${getMonsterForm(support).name}</strong></span>` : `<b>+</b><span><small>SUPPORT FREI</small><strong>Zuweisen</strong></span>`}</button></div><div class="combat-synergy ${zoneSynergy ? "is-active" : ""}"><small>${zoneSynergy ? "ZONENBONUS AKTIV" : "ROLLEN KOMBINIEREN"}</small><strong>${zoneSynergy?.name ?? "Noch kein Duo-Bonus"}</strong><span>${zoneSynergy?.description ?? zone.synergies.map((entry) => `${COMBAT_ROLE_LABELS[entry.roles[0]]} + ${COMBAT_ROLE_LABELS[entry.roles[1]]}`).join(" oder ")}</span></div><div class="combat-mini-stats"><span><small>ATK</small><b>${playerAttack(player, game.research.power, zoneSynergy?.attackPercent, game.prestigeCount)}</b></span><span><small>HP</small><b>${playerMaxHp(player, game.research.vitality, zoneSynergy?.hpPercent, game.prestigeCount)}</b></span><span><small>EI IN</small><b>≤ ${eggGuarantee}</b></span></div><button class="combat-dispatch-link" data-view="dispatch">ZEIT-EXPEDITIONEN · ${game.expeditions.length}/${EXPEDITION_SLOT_COUNT} AKTIV ${icon("arrow")}</button></aside>
        <section class="combat-objective-hud combat-panel--missions ${activeCombatPanel === "missions" ? "is-open" : ""}" data-live="combat-objectives">${combatObjectiveMarkup()}</section>
        ${combatMonsterSelector()}
        <section class="combat-console-hud combat-panel--log ${activeCombatPanel === "log" ? "is-open" : ""}"><div class="combat-console-status"><span class="status-orb ${battle.status}" data-live="battle-status-orb"></span><div><strong data-live="battle-status">${battle.status === "victory" ? "STAGE GESCHAFFT" : battle.status === "recovering" ? "REGENERATION" : "KAMPF LÄUFT"}</strong><small data-live="battle-log">${battle.log[0]}</small></div></div><div class="combat-attack-cycle"><span><small>NÄCHSTE AKTION</small><b>${playerDefinition.name}</b></span><div><i data-live="attack-progress" style="width:${playerAttackProgress}%"></i></div></div><small class="combat-save-state"><i></i>${service.lastSaveResult.ok ? "LOKAL GESICHERT" : "SPEICHERFEHLER"}</small></section>
        ${combatControlDock(Boolean(claimable), cacheEmpty)}
        ${tutorialCoach()}
      </section>
    </main>`;
}

function pageHeading(kicker: string, title: string, copy: string, meta: string, metaLiveName?: string): string {
  return `<div class="page-heading"><div><span class="eyebrow">${kicker}</span><h1>${title}</h1><p>${copy}</p></div><span class="page-heading__meta"${metaLiveName ? ` data-live="${metaLiveName}"` : ""}>${meta}</span></div>`;
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
  const onlineLocked = isRunOnline();
  return `<section class="gem-workbench panel">
    <div class="gem-workbench__heading"><div><span class="eyebrow">GEM-AUSRÜSTUNG · ${onlineLocked ? "BLOCK 6" : "PERMANENT"}</span><h2>${definition.name}s Grundwerte</h2><p>${onlineLocked ? "Deine lokalen Gems bleiben sicher erhalten. Einsetzen und Kampfwirkung werden mit der Sammlung serverautoritativ freigeschaltet." : "Jede Form besitzt drei feste Slots. Die Form liefert die Basis, der Gem verstärkt sie."}</p></div><span><small>${onlineLocked ? "LOKALER ARCHIVBONUS" : "AKTIVER BONUS"}</small><b>+${bonuses.attackPercent}% ATK · +${bonuses.hpPercent}% HP</b></span></div>
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
  const onlineLocked = isRunOnline();
  return `<article class="monster-card panel ${isActive ? "is-active" : ""} ${isSupport ? "is-support" : ""}" style="--monster-accent:${definition.accent}"><div class="monster-card__top"><span>${elementLabel[lineage.element]} · ${COMBAT_ROLE_LABELS[definition.combatRole]}</span><small>${EVOLUTION_LABELS[monster.evolution]} · GEN ${monster.generation}</small></div>${monsterAvatar(monster)}<div class="monster-card__body"><div><h3>${definition.name}</h3><span>${definition.role}</span></div>${isActive ? '<b class="active-badge">FRONT</b>' : isSupport ? '<b class="active-badge active-badge--support">SUPPORT</b>' : ""}<div class="stat-line"><span><small>RUN-LEVEL</small><b>${monster.level}</b></span><span><small>HYPER</small><b>${monster.hyperLevel}</b></span><span><small>HP</small><b>${monsterMaxHp(monster, game.prestigeCount)}</b></span><span><small>ATK</small><b>${monsterAttack(monster, game.prestigeCount)}</b></span></div><small class="gem-stat-note">GEMS · +${bonuses.attackPercent}% ATK · +${bonuses.hpPercent}% HP${onlineLocked ? " · WIRKUNG AB BLOCK 6" : game.prestigeCount > 0 ? ` · PRESTIGE +${(game.prestigeCount * BALANCE.prestige.playerBaseStatPerPrestige * 100).toFixed(1).replace(".0", "").replace(".", ",")}% BASIS` : ""}</small>${monster.evolution === "rookie" ? `<div class="evolution-line"><span><small>NÄCHSTE FORM</small><b>${lineage.evolution.name}</b></span><em>Level ${BALANCE.evolution.requiredLevel} · ${BALANCE.evolution.coreCost} Kerne · ${BALANCE.evolution.fragmentCost} Fragmente</em><button class="evolve-button" data-evolve="${monster.uid}" ${evolutionReady ? "" : "disabled"}>${onlineLocked ? "EVOLUTION · BLOCK 6" : "EVOLUTION"}</button></div>` : `<div class="evolution-line is-complete"><span><small>EVOLUTION PERMANENT</small><b>${lineage.name} → ${lineage.evolution.name}</b></span><em>Bestimmt neue Grundwerte und bleibt bei Prestige erhalten</em></div>`}<div class="fragment-line">${resourceIcon("fragments")}<span><small>ART-FRAGMENTE</small><b>${fragments} VERFÜGBAR</b></span><i><em style="width:${Math.min(100, (fragments / permanentCost) * 100)}%"></em></i></div></div><div class="monster-card__actions"><button class="secondary-button" data-active="${monster.uid}" ${isActive ? "disabled" : ""}>${isActive ? "FRONT AKTIV" : "ALS FRONT"}</button><button class="secondary-button" data-support="${monster.uid}" ${isSupport || isActive ? "disabled" : ""}>${isSupport ? "SUPPORT AKTIV" : "ALS SUPPORT"}</button><button class="primary-button" data-level="${monster.uid}" ${game.resources.gold < normalCost ? "disabled" : ""}>RUN-LEVEL +1 <small>${normalCost} G · RESET</small></button><button class="secondary-button" data-train="${monster.uid}" ${game.inventory.training_data <= 0 ? "disabled" : ""}>${onlineLocked ? "DATEN · BLOCK 6" : "DATEN +1"} <small>${game.inventory.training_data}×</small></button><button class="secondary-button" data-hyper="${monster.uid}" ${fragments < permanentCost ? "disabled" : ""}>${onlineLocked ? "HYPER · BLOCK 6" : "HYPER +1"} <small>${permanentCost} F · PERMANENT</small></button></div></article>`;
}

function incubationView(): string {
  const incubation = game.incubation;
  const ready = incubation ? Date.now() >= incubation.hatchAt : false;
  const remaining = incubation ? Math.max(0, Math.ceil((incubation.hatchAt - Date.now()) / 1000)) : 0;
  const eggEntries = Object.entries(game.eggInventory).filter(([, amount]) => amount > 0);
  const progress = incubation ? Math.min(100, ((Date.now() - incubation.startedAt) / (incubation.hatchAt - incubation.startedAt)) * 100) : 0;
  return `<section class="page">${pageHeading("INKUBATION · SAMMLUNG", "Ether-Brutstation", "Eier stammen ausschließlich aus Expeditionen. Erstschlüpfe erweitern die Sammlung, Duplikate liefern permanente Art-Fragmente.", `${eggEntries.reduce((sum, [, amount]) => sum + amount, 0)} EIER · 1 INKUBATOR`)}${hatchNotice ? `<div class="hatch-notice panel"><span>${icon("spark")}</span><div><strong>SCHLUPF ABGESCHLOSSEN</strong><small>${hatchNotice}</small></div><button id="close-hatch-notice" aria-label="Hinweis schließen">×</button></div>` : ""}<div class="incubator-layout"><section class="incubator-panel panel"><div class="card-heading"><span class="eyebrow">BRUTSTATION 01</span><span class="soft-chip ${incubation ? "is-live" : ""}">${incubation ? "AKTIV" : "BEREIT"}</span></div>${incubation ? `<div class="incubator-active"><div class="egg-chamber"><img class="incubator-frame" src="/assets/incubator/incubator-frame-v1.png" alt=""><img class="egg-asset is-running" src="${eggImage(incubation.definitionId)}" alt="${getMonster(incubation.definitionId).name}-Ei"><b data-live="incubation-percent">${Math.round(progress)}%</b></div><div><span class="eyebrow">RESONANZAUFBAU</span><h2>${getMonster(incubation.definitionId).name}-Ei</h2><p data-live="incubation-copy">${ready ? "Die Etherschale ist offen. Das Monster kann jetzt schlüpfen." : `Das Ei wird stabilisiert. Noch ungefähr ${remaining} Sekunden.`}</p><div class="mission-progress"><i data-live="incubation-progress" style="width:${progress}%"></i></div><button class="primary-button" id="hatch-egg" ${ready ? "" : "disabled"}>${ready ? `EI ÖFFNEN ${icon("spark")}` : `NOCH ${remaining}s`}</button><button class="secondary-button" id="accelerate-incubation" ${ready ? "hidden disabled" : game.inventory.incubator_charge <= 0 ? "disabled" : ""}>BRUTLADUNG −60s · ${game.inventory.incubator_charge}×</button></div></div>` : `<div class="incubator-empty"><div class="egg-chamber"><img class="incubator-frame" src="/assets/incubator/incubator-frame-v1.png" alt=""><img class="egg-asset is-idle" src="${eggImage()}" alt="Unbestimmtes Monsterei">${hatchNotice ? '<img class="hatch-vfx" src="/assets/effects/hatch/ether-hatch-burst-v1.png" alt="">' : ""}</div><h2>Die Kammer ist frei.</h2><p>Wähle ein Ei aus deinem Inventar, um die Resonanz aufzubauen.</p></div>`}</section><aside class="gene-note panel"><span class="eyebrow">PERMANENTER KREISLAUF</span><h2>Jeder Schlupf zählt.</h2><p>Ein Ei ist niemals wertlos. Bekannte Arten werden automatisch zu den Fragmenten genau dieser Monsterlinie.</p><ol><li><b>01</b><span>Ei in der Expedition finden</span></li><li><b>02</b><span>Neue Art erstmals freischalten</span></li><li><b>03</b><span>Duplikate in 10 Fragmente wandeln</span></li><li><b>04</b><span>Hyperlevel oder Evolution bezahlen</span></li></ol></aside></div><div class="subsection-heading"><div><span class="eyebrow">EI-INVENTAR</span><h2>Gesicherte Signale</h2></div><span>ARTSPEZIFISCH · NICHT HANDELBAR</span></div><div class="egg-grid">${eggEntries.length > 0 ? eggEntries.map(([definitionId, amount]) => eggCard(definitionId, amount)).join("") : `<div class="empty-slot empty-slot--wide"><span>${icon("incubation")}</span><strong>Noch keine Eier im Inventar</strong><small>Kämpfe weiter oder sammle deinen Kampfspeicher ein.</small><button class="secondary-button" data-view="expedition">ZUR EXPEDITION</button></div>`}</div></section>`;
}

function eggCard(definitionId: string, amount: number): string {
  const definition = getMonster(definitionId);
  const known = game.roster.some((monster) => monster.definitionId === definitionId);
  return `<article class="egg-card panel" style="--monster-accent:${definition.accent}"><img class="egg-asset egg-asset--small" src="${eggImage(definitionId)}" alt="${definition.name}-Ei"><div><span class="eyebrow">${known ? "BEKANNT · +10 FRAGMENTE" : "NEUER ARCHIV-EINTRAG"}</span><h3>${definition.name}-Ei</h3><p>${elementLabel[definition.element]} · ${amount} im Bestand</p></div><span class="quantity-chip">×${amount}</span><button class="primary-button" data-incubate="${definitionId}" ${game.incubation ? "disabled" : ""}>INKUBIEREN ${icon("arrow")}</button></article>`;
}

function craftingWorkbench(): string {
  return `<section class="crafting-workbench panel"><div class="crafting-workbench__heading"><span>${icon("research")}</span><div><small>ETHERWERKSTATT · FESTE REZEPTE</small><h2>Materialien veredeln</h2><p>Jedes Ergebnis ist garantiert. Kosten und Ausgabe werden später in einer einzigen SQL-Transaktion gebucht.</p></div><strong>${game.inventory.ether_dust}× ETHERSTAUB</strong></div><div class="crafting-recipes">${CRAFTING_RECIPES.map((recipe) => {
    const output = ITEMS.find((item) => item.id === recipe.output.itemId);
    const available = canCraft(game, recipe);
    const costs = [`${recipe.goldCost} Gold`, ...Object.entries(recipe.itemCosts).map(([itemId, amount]) => `${amount}× ${ITEMS.find((item) => item.id === itemId)?.name ?? itemId}`)];
    return `<article class="crafting-recipe ${available ? "is-ready" : ""}"><span class="crafting-recipe__output">${output ? `<img src="${output.image}" alt="">` : "◇"}</span><div><small>${recipe.output.amount}× ${output?.name ?? recipe.output.itemId}</small><h3>${recipe.name}</h3><p>${recipe.description}</p></div><div class="crafting-recipe__cost"><small>KOSTEN</small><strong>${costs.join(" · ")}</strong></div><button class="${available ? "primary-button" : "secondary-button"}" data-craft="${recipe.id}" ${available ? "" : "disabled"}>${available ? "HERSTELLEN" : "MATERIAL FEHLT"}</button></article>`;
  }).join("")}</div></section>`;
}

function inventoryView(): string {
  const active = activeMonster();
  const totalItems = Object.values(game.inventory).reduce((sum, amount) => sum + amount, 0);
  return `<section class="page">${pageHeading("BEUTE · MATERIALIEN", "Inventar", "Hier landet alles, was du aus dem Kampfspeicher einsammelst. Materialien sind nach Einsatz und Quelle getrennt.", `${totalItems} MATERIALIEN · ${Object.values(game.eggInventory).reduce((sum, amount) => sum + amount, 0)} EIER`)}
    <div class="inventory-summary panel"><div><span class="eyebrow">KAMPFSPEICHER</span><strong>${game.cacheSlotsUsed} / ${activeCacheCapacity()} Plätze belegt</strong><small>${Object.values(game.pendingItems).reduce((sum, amount) => sum + amount, 0)} Materialien, ${game.pendingEggs.length} Eier und ${game.pendingGems.length} Gems warten auf Abholung.</small></div><button class="primary-button" id="collect-cache" ${game.cacheSlotsUsed === 0 && game.pendingGold === 0 && game.pendingGems.length === 0 ? "disabled" : ""}>BEUTE EINSAMMELN ${icon("arrow")}</button></div>
    <div class="item-grid">${ITEMS.map((item) => `<article class="item-card panel item-card--${item.rarity.toLowerCase()}"><span class="item-card__icon"><img src="${item.image}" alt=""></span><div><span class="eyebrow">${item.rarity.toUpperCase()}</span><h2>${item.name}</h2><p>${item.description}</p><small>QUELLE · ${item.source}</small></div><b class="item-count">${game.inventory[item.id]}×</b>${item.action === "train" && active ? `<button class="secondary-button" data-train="${active.uid}" ${game.inventory[item.id] <= 0 ? "disabled" : ""}>${getMonsterForm(active).name} TRAINIEREN</button>` : item.action === "accelerate" ? `<button class="secondary-button" id="accelerate-incubation" ${!game.incubation || game.inventory[item.id] <= 0 ? "disabled" : ""}>BRUTZEIT −60s</button>` : item.id === "ether_dust" ? `<span class="item-reserved">ROHSTOFF · ETHERWERKSTATT</span>` : `<span class="item-reserved">VERBRAUCH · EVOLUTION</span>`}</article>`).join("")}</div>
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
  return `<article class="dispatch-slot panel ${ready ? "is-ready" : "is-running"}" data-expedition-id="${expedition.id}">
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
  return `<section class="page dispatch-page">${pageHeading("ZEIT · SAMMLUNG", "Monster-Expeditionen", "Nicht eingesetzte Monster übernehmen zeitbasierte Aufträge. Rollen, Elemente und Evolutionen erhöhen die Belohnung, ohne den Hauptkampf zu unterbrechen.", `${game.expeditions.length}/${EXPEDITION_SLOT_COUNT} AKTIV · ${ready} BEREIT`, "dispatch-ready")}
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
  }).join("")}<div class="setting-format"><span><strong>Zahlenformat</strong><small>Lesbare Werte bleiben bis 1e15 erhalten. Erst danach wechselt das Spiel automatisch zur wissenschaftlichen Darstellung.</small></span><div><button class="${game.settings.numberFormat === "compact" ? "is-active" : ""}" data-setting="numberFormat" data-setting-value="compact">1,2 MIO.</button><button class="${game.settings.numberFormat === "full" ? "is-active" : ""}" data-setting="numberFormat" data-setting-value="full">1.200.000</button></div></div></div></section>`;
}

function profileView(): string {
  const rank = rankForVictories(game.totalVictories);
  const activeAvatar = AVATARS.find((entry) => entry.id === game.profile.avatarId) ?? AVATARS[0];
  const activeFrame = FRAMES.find((entry) => entry.id === game.profile.frameId) ?? FRAMES[0];
  return `<section class="page profile-page">${pageHeading("ACCOUNT · KOSMETIK", "Tamer-Profil", "Runder Avatar und Rahmen werden als getrennte Katalogeinträge gespeichert. So können Events, Gilden und Erfolge später neue Kombinationen freischalten.", `RANG ${rank} · ${game.totalVictories} SIEGE`)}
    <section class="profile-hero panel">${accountAvatar("large")}<div><span class="eyebrow">AKTIVES PROFIL</span><h1>${accountBootstrap?.profile.displayName ?? game.playerName}</h1><p>${activeAvatar.name} · ${activeFrame.name}</p><div class="profile-stats"><span><small>MONSTER</small><b>${game.roster.length}/10</b></span><span><small>PRESTIGE</small><b>${game.prestigeCount}</b></span><span><small>ZONEN</small><b>${game.unlockedZoneIds.length}/${ZONES.length}</b></span><span><small>RANG</small><b>${rank}</b></span></div></div><aside><small>ACCOUNT-STATUS</small><b>${accountBootstrap ? "ONLINE · PROFIL & STARTER" : "LOCAL-PROTOTYPE"}</b><span>${accountBootstrap?.account.emailMasked ?? "Noch ohne Backendkonto"}</span>${accountBootstrap ? '<button class="text-button" id="logout-account">ACCOUNT ABMELDEN</button>' : ""}</aside></section>
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
  return `<div class="modal-backdrop starter-backdrop" role="presentation"><section class="modal starter-modal" role="dialog" aria-modal="true" aria-labelledby="starter-title" data-testid="starter-dialog"><button class="modal__close" id="close-starter" aria-label="Starterwahl schließen">×</button><span class="eyebrow">ZEHN ROOKIE-LINIEN · EINE ERSTE WAHL</span><h2 id="starter-title">Welche Resonanz antwortet dir?</h2><p>Jeder Starter besitzt eine feste erste Evolution. Werte und Namen lassen sich zentral im Monsterkatalog ändern.</p><div class="starter-grid">${MONSTERS.map((monster) => { const preview = createMonster(monster.id, 1); return `<article class="starter-card" style="--monster-accent:${monster.accent}"><div class="starter-card__visual">${monsterAvatar(preview)}</div><div><span class="eyebrow">${elementLabel[monster.element]} · ${monster.role}</span><h3>${monster.name}</h3><p>${monster.description}</p><div class="starter-evolution"><span>${monster.glyph}</span><i>→</i><span>${monster.evolution.glyph}</span><small>${monster.evolution.name}</small></div><button class="primary-button" data-starter="${monster.id}" data-testid="starter-${monster.id}" ${authBusy ? "disabled" : ""}>${monster.name.toUpperCase()} WÄHLEN</button></div></article>`; }).join("")}</div><div class="starter-modal__foot"><span>${icon("shield")} ${accountApiEnabled ? "Diese Wahl wird jetzt einmalig auf deinem Account gespeichert." : "Im lokalen UI-Testmodus bleibt die Wahl nur in diesem Browser."}</span><button class="text-button" id="close-starter-alt">SPÄTER ENTSCHEIDEN</button></div></section></div>`;
}

function researchView(): string {
  return `<section class="page">${pageHeading("ACCOUNT · DAUERHAFT", "Ether-Forschung", "Investiere Prestige-Kerne in accountweite Verbesserungen. Kein Forschungszweig wird durch einen neuen Run zurückgesetzt.", `${game.resources.cores} KERNE VERFÜGBAR`)}<div class="research-grid">${RESEARCH.map((research) => { const level = game.research[research.id]; const cost = researchCost(level); const isMax = level >= research.maxLevel; return `<article class="research-card panel"><span class="research-card__icon">${research.icon}</span><div><span class="eyebrow">FORSCHUNG ${String(RESEARCH.indexOf(research) + 1).padStart(2, "0")}</span><h2>${research.name}</h2><p>${research.description}</p></div><span class="level-chip">STUFE ${level} / ${research.maxLevel}</span><div class="research-levels">${Array.from({ length: research.maxLevel }, (_, index) => `<i class="${index < level ? "is-filled" : ""}"></i>`).join("")}</div><strong>${research.effectPerLevel}</strong><button class="primary-button" data-research="${research.id}" ${isMax || game.resources.cores < cost ? "disabled" : ""}>${isMax ? "MAXIMAL" : `ERFORSCHEN · ${cost} P`}</button></article>`; }).join("")}</div><section class="research-summary panel"><span class="eyebrow">AKTIVE ACCOUNT-EFFEKTE</span><span><small>ANGRIFF</small><b>+${game.research.power * 7}%</b></span><span><small>LEBEN</small><b>+${game.research.vitality * 8}%</b></span><span><small>GOLD</small><b>+${game.research.extraction * 10}%</b></span><span><small>BRUTZEIT</small><b>−${game.research.incubation * 10}%</b></span></section></section>`;
}

function guildFriendsMarkup(friends: GuildSnapshot["friends"]): string {
  return `<section class="panel guild-friends-panel"><div class="section-heading"><span><small>ACCOUNTWEIT</small><h2>Freunde</h2></span></div><form id="friend-request-form"><input name="displayName" maxlength="20" placeholder="Tamer-Name" required><button class="secondary-button">ANFRAGEN</button></form><div>${friends.length ? friends.map((friend) => `<article><span class="profile-medallion frame-${friend.frameId}"><i>${escapeHtml(friend.displayName.slice(0, 1))}</i></span><div><b>${escapeHtml(friend.displayName)}</b><small>${friend.status === "accepted" ? "FREUND" : friend.status === "pending_incoming" ? "ANFRAGE ERHALTEN" : "ANFRAGE GESENDET"}</small></div>${friend.status === "pending_incoming" ? `<button data-friend-accept="${friend.playerId}">ANNEHMEN</button>` : ""}${friend.status === "accepted" ? `<button data-friend-remove="${friend.playerId}">LÖSEN</button>` : ""}<button class="danger-text" data-player-block="${friend.playerId}">BLOCKIEREN</button></article>`).join("") : `<small>Noch keine Kontakte.</small>`}</div></section>`;
}

function guildView(): string {
  if (!isGuildOnline()) return `<section class="page guild-page">${pageHeading("ONLINE-SYSTEM", "Gilden-DNA", "Das Gildensystem ist auf dieser Umgebung noch nicht freigeschaltet.", "FEATURE-FLAG AUS")}<div class="locked-callout"><b>FEATURE-FLAG GUILDS IST AUS</b></div></section>`;
  if (!guildSnapshot) return `<section class="page guild-page">${pageHeading("SERVERAUTORITATIV", "Gilden-DNA", "Mitgliedschaften, Gene und Chat werden geladen.", "LIVE-SYNC")}<div class="guild-loading panel"><span class="status-orb fighting"></span><b>DNA-ARCHIV WIRD SYNCHRONISIERT</b></div></section>`;
  const membership = guildSnapshot.membership;
  if (!membership) {
    const joinLocked = Date.parse(guildSnapshot.joinAvailableAt) > Date.now();
    return `<section class="page guild-page">${pageHeading("BLOCK 7 · ONLINE", "Finde deine Gilde", "Gründe eine eigene Gemeinschaft oder tritt einer offenen Gilde bei. Mitgliedschaft, Rollen und Ressourcen liegen ausschließlich in PostgreSQL.", `${guildSnapshot.directory.length} GILDEN SICHTBAR`)}
      ${joinLocked ? `<div class="guild-cooldown panel">${icon("shield")}<span><b>GILDENWECHSEL-SPERRE</b><small>Neuer Beitritt ab ${new Date(guildSnapshot.joinAvailableAt).toLocaleString("de-DE")}.</small></span></div>` : ""}
      ${guildSnapshot.invitations.length ? `<section class="guild-invitations panel"><span class="eyebrow">OFFENE EINLADUNGEN</span>${guildSnapshot.invitations.map((invite) => `<article><span class="guild-tag">${escapeHtml(invite.guildTag)}</span><div><b>${escapeHtml(invite.guildName)}</b><small>von ${escapeHtml(invite.invitedByDisplayName)} · gültig bis ${new Date(invite.expiresAt).toLocaleDateString("de-DE")}</small></div><button data-guild-invite-accept="${invite.inviteId}" ${joinLocked ? "disabled" : ""}>ANNEHMEN</button><button class="danger-text" data-guild-invite-decline="${invite.inviteId}">ABLEHNEN</button></article>`).join("")}</section>` : ""}
      <div class="guild-onboarding-grid"><form id="guild-create-form" class="panel guild-create-card"><span class="eyebrow">NEUE GILDE</span><h2>Eigenes Chromosom gründen</h2><label>Name<input name="name" minlength="3" maxlength="32" placeholder="Etherwacht" required></label><label>Tag<input name="tag" minlength="2" maxlength="5" placeholder="ETW" required></label><label>Beschreibung<textarea name="description" maxlength="240" placeholder="Wofür steht eure Gilde?"></textarea></label><button class="primary-button" ${joinLocked || guildSyncBusy ? "disabled" : ""}>GILDE GRÜNDEN ${icon("arrow")}</button></form>
      <section class="guild-directory"><span class="eyebrow">OFFENE GILDEN</span>${guildSnapshot.directory.length ? guildSnapshot.directory.map((guild) => `<article class="panel guild-directory-card"><span class="guild-tag">${escapeHtml(guild.tag)}</span><div><h3>${escapeHtml(guild.name)}</h3><p>${guild.memberCount}/${guild.memberLimit} Mitglieder · DNA-Stufe ${guild.dnaLevel}</p></div><button class="secondary-button" data-guild-join="${guild.guildId}" ${joinLocked || guild.joinPolicy !== "open" || guild.memberCount >= guild.memberLimit ? "disabled" : ""}>BEITRETEN</button></article>`).join("") : `<div class="empty-state panel"><b>Noch keine Gilde gegründet.</b><small>Du kannst die erste Doppelhelix der Welt beginnen.</small></div>`}</section></div>${guildFriendsMarkup(guildSnapshot.friends)}</section>`;
  }

  const canManage = membership.role === "leader" || membership.role === "officer";
  const bossHp = Number(membership.boss.hp);
  const bossMax = Math.max(1, Number(membership.boss.maxHp));
  const bossReady = !membership.boss.defeated && (!membership.boss.nextAttackAt || Date.parse(membership.boss.nextAttackAt) <= Date.now());
  return `<section class="page guild-page guild-page--active">
    <header class="guild-command-hero panel"><div><span class="eyebrow">[${escapeHtml(membership.tag)}] · ${membership.role.toUpperCase()}</span><h1>${escapeHtml(membership.name)}</h1><p>${escapeHtml(membership.description || "Gemeinsame Resonanz ohne Beschreibung.")}</p></div><div class="guild-command-stats"><span><small>MITGLIEDER</small><b>${membership.memberCount}/${membership.memberLimit}</b></span><span><small>GILDEN-DNA</small><b>${membership.dnaBalance}</b></span><span><small>DEIN DNA-VORRAT</small><b>${membership.personalDna}</b></span></div><div class="guild-command-actions"><button class="secondary-button" data-guild-donate="10" ${Number(membership.personalDna) < 10 ? "disabled" : ""}>10 DNA SPENDEN</button><button class="text-button danger-text" id="guild-leave">GILDE VERLASSEN</button></div></header>
    <section class="guild-management-bar panel"><span><b>${membership.joinPolicy === "open" ? "OFFENER BEITRITT" : "NUR EINLADUNG"}</b><small>Offiziere dürfen einladen und Gene investieren. Jedes Mitglied darf eine DNA-Abstimmung anstoßen.</small></span>${canManage ? `<form id="guild-invite-form"><input name="displayName" minlength="3" maxlength="20" placeholder="Tamer einladen" required><button class="secondary-button">EINLADEN</button></form>` : ""}<form id="guild-vote-form"><select name="subject">${GUILD_GENES.map((gene) => `<option value="${gene.id}">${escapeHtml(gene.name)}</option>`).join("")}</select><button class="secondary-button">DNA-ABSTIMMUNG</button></form>${membership.role === "leader" ? `<button data-guild-policy="${membership.joinPolicy === "open" ? "invite" : "open"}">${membership.joinPolicy === "open" ? "AUF EINLADUNG STELLEN" : "BEITRITT ÖFFNEN"}</button>` : ""}</section>
    <div class="guild-live-grid"><section class="panel guild-dna-live"><div class="section-heading"><span><small>CHROMOSOM 01</small><h2>Lebende Gilden-DNA</h2></span><strong>${membership.genes.reduce((sum, gene) => sum + gene.level, 0)} GEN-STUFEN</strong></div><div class="dna-live-layout"><div class="dna-visual"><div class="dna-axis"></div><div class="dna-helix">${membership.genes.map((gene, index) => { const definition = GUILD_GENES.find((entry) => entry.id === gene.geneId)!; return `<div class="dna-gene ${gene.level > 0 ? "is-unlocked" : ""}" style="--gene-index:${index};--gene-color:${definition.color}"><i></i><span><small>LV ${gene.level}/${gene.maxLevel}</small>${escapeHtml(definition.chromosome)}</span><i></i></div>`; }).join("")}</div></div><div class="guild-gene-list">${membership.genes.map((gene) => { const definition = GUILD_GENES.find((entry) => entry.id === gene.geneId)!; return `<article class="guild-gene-card ${gene.level > 0 ? "is-active" : ""}" style="--gene-color:${definition.color}"><span><small>${escapeHtml(definition.chromosome)}</small><b>${escapeHtml(definition.name)}</b><em>${escapeHtml(definition.description)}</em></span><strong>+${(definition.effectPerLevel * gene.level).toFixed(2).replace(".00", "").replace(".", ",")}${definition.effectUnit}</strong><button data-guild-gene="${gene.geneId}" ${!canManage || gene.nextCost === null || BigInt(membership.dnaBalance) < BigInt(gene.nextCost ?? "0") ? "disabled" : ""}>${gene.nextCost ? `${gene.nextCost} DNA · VERBESSERN` : "MAXIMAL"}</button></article>`; }).join("")}</div></div></section>
      <aside class="guild-activity-column"><section class="panel guild-boss-card"><span class="eyebrow">WOCHENBOSS · ${escapeHtml(membership.boss.periodKey)}</span><h2>Chromawyrm Prime</h2><p>Jedes Mitglied greift getrennt mit 30 Sekunden Abklingzeit an. Der letzte Treffer bucht die Belohnung atomar.</p><div class="guild-boss-orb"><i style="--boss-health:${Math.max(0, bossHp / bossMax * 100)}%"></i><b>${membership.boss.hp}</b><small>/ ${membership.boss.maxHp} HP</small></div><span class="guild-personal-damage">DEIN SCHADEN · ${membership.boss.personalDamage}</span><button class="primary-button" id="guild-boss-attack" ${bossReady ? "" : "disabled"}>${membership.boss.defeated ? "BOSS BESIEGT" : bossReady ? "AUTO-DUO ENTSENDEN" : "ANGRIFF LÄDT"}</button></section>
      <section class="panel guild-task-card"><span class="eyebrow">GEMEINSAME TAGESZIELE</span>${membership.tasks.map((task) => { const definition = GUILD_TASKS.find((entry) => entry.id === task.taskId); const progress = Number(task.progress); const target = Math.max(1, Number(task.target)); return `<article><span><b>${escapeHtml(definition?.name ?? task.taskId)}</b><small>${task.progress}/${task.target} · +${task.rewardDna} DNA</small></span><i><em style="width:${Math.min(100, progress / target * 100)}%"></em></i><button data-guild-task="${task.taskId}" ${!task.completed || task.claimed ? "disabled" : ""}>${task.claimed ? "GEBORGEN" : "BERGEN"}</button></article>`; }).join("")}</section>
      <section class="panel guild-expedition-card"><span class="eyebrow">GEMEINSAME EXPEDITION</span><h2>${GUILD_EXPEDITION.name}</h2>${membership.expedition ? `<p>${membership.expedition.status === "active" ? `Rückkehr ${new Date(membership.expedition.completesAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}` : membership.expedition.status === "claimable" ? `${membership.expedition.rewardDna} DNA bereit` : "Heute geborgen"}</p><button class="primary-button" data-guild-expedition-claim="${membership.expedition.expeditionId}" ${membership.expedition.status !== "claimable" ? "disabled" : ""}>${membership.expedition.status === "claimable" ? "RÜCKKEHR BERGEN" : membership.expedition.status === "claimed" ? "ABGESCHLOSSEN" : "EXPEDITION LÄUFT"}</button>` : `<p>Ein gemeinsamer Fünf-Minuten-Auftrag pro Tag. Die Belohnung fließt direkt und prüfbar ins Gilden-Ledger.</p><button class="primary-button" id="guild-expedition-start" ${!canManage ? "disabled" : ""}>EXPEDITION STARTEN</button>`}</section>
      ${membership.votes.length ? `<section class="panel guild-vote-card"><span class="eyebrow">OFFENE ABSTIMMUNGEN</span>${membership.votes.map((vote) => `<article><b>${vote.kind === "gene_upgrade" ? `Gen: ${escapeHtml(GUILD_GENES.find((gene) => gene.id === vote.subject)?.name ?? vote.subject)}` : `Beitritt: ${escapeHtml(vote.subject)}`}</b><small>JA ${vote.yes} · NEIN ${vote.no} · ${vote.eligibleVoters} Stimmberechtigte</small><span><button data-guild-vote="${vote.voteId}" data-guild-vote-choice="yes" ${vote.myChoice === "yes" ? "disabled" : ""}>JA</button><button data-guild-vote="${vote.voteId}" data-guild-vote-choice="no" ${vote.myChoice === "no" ? "disabled" : ""}>NEIN</button>${canManage ? `<button data-guild-vote-resolve="${vote.voteId}">AUSWERTEN</button>` : ""}</span></article>`).join("")}</section>` : ""}</aside></div>
    <div class="guild-social-grid"><section class="panel guild-member-panel"><div class="section-heading"><span><small>ROSTER</small><h2>Mitglieder</h2></span></div>${membership.members.map((member) => `<article class="guild-member-row"><span class="profile-medallion frame-${member.frameId}"><i>${escapeHtml(member.displayName.slice(0, 1))}</i></span><div><b>${escapeHtml(member.displayName)}</b><small>${member.role.toUpperCase()} · ${member.contribution} DNA</small></div>${canManage && member.playerId !== accountBootstrap?.profile.playerId && member.role !== "leader" ? `<button data-guild-role="${member.playerId}" data-guild-role-value="${member.role === "officer" ? "member" : "officer"}">${member.role === "officer" ? "ZUM MITGLIED" : "ZUM OFFIZIER"}</button>${membership.role === "leader" ? `<button data-guild-leadership="${member.playerId}">LEITUNG</button>` : ""}<button class="danger-text" data-guild-kick="${member.playerId}">ENTFERNEN</button>` : ""}${member.playerId !== accountBootstrap?.profile.playerId ? `<button class="danger-text" data-player-report="${member.playerId}">MELDEN</button>` : ""}</article>`).join("")}</section>
      <section class="panel guild-chat-panel"><div class="section-heading"><span><small>MODERIERT · LETZTE 50</small><h2>Gildenchat</h2></span></div><div class="guild-chat-log">${membership.chat.length ? membership.chat.map((message) => `<article><span><b>${escapeHtml(message.displayName)}</b><small>${new Date(message.createdAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}${message.playerId !== accountBootstrap?.profile.playerId ? `<button data-message-report="${message.messageId}" data-message-player="${message.playerId}">MELDEN</button>` : ""}</small></span><p>${escapeHtml(message.body)}</p></article>`).join("") : `<small>Noch keine Nachricht. Begrüße deine Gilde.</small>`}</div><form id="guild-chat-form"><input name="body" maxlength="280" autocomplete="off" placeholder="Nachricht an [${escapeHtml(membership.tag)}]" required><button class="primary-button">SENDEN</button></form></section>${guildFriendsMarkup(guildSnapshot.friends)}</div>
  </section>`;
}

function prestigeView(): string {
  const zoneReady = game.highestZoneNumber >= BALANCE.prestige.requiredZoneNumber;
  const reward = prestigeCoreReward(game.runVictories, game.highestZoneNumber);
  const charge = Math.min(100, game.runVictories);
  const visualCharge = zoneReady ? charge : Math.min(100, game.highestZoneNumber / BALANCE.prestige.requiredZoneNumber * 100);
  const permanentHyper = game.roster.reduce((sum, monster) => sum + monster.hyperLevel, 0);
  const equippedGems = game.roster.reduce((sum, monster) => sum + Object.keys(monster.gemSlots).length, 0);
  const currentStatBonus = (game.prestigeCount * BALANCE.prestige.playerBaseStatPerPrestige * 100).toFixed(1).replace(".0", "").replace(".", ",");
  const currentGoldBonus = (game.prestigeCount * BALANCE.prestige.repeatableGoldPerPrestige * 100).toFixed(1).replace(".0", "").replace(".", ",");
  const currentDropBonus = (game.prestigeCount * BALANCE.prestige.dropChancePerPrestige * 100).toFixed(3).replace(".", ",");
  return `<main class="prestige-scene ${prestigeActivating ? "is-activating" : ""}" style="--ether-charge:${visualCharge}%" data-testid="prestige-scene">
    <div class="prestige-scene__backdrop" data-testid="prestige-backdrop" aria-hidden="true"></div>
    <div class="prestige-scene__ambient" aria-hidden="true"><i></i><i></i><i></i></div>
    <div class="prestige-scene__flash" aria-hidden="true"></div>
    <header class="prestige-header"><button class="brand" data-home>${brandMarkup()}</button><button class="secondary-button" data-view="expedition" ${prestigeActivating ? "disabled" : ""}>← ZURÜCK ZUM KAMPF</button></header>
    <section class="prestige-copy"><span class="eyebrow">PRESTIGE · ETHER-RESONANZ</span><h1>Eine Zeitlinie endet.<br><em>Deine Bindung bleibt.</em></h1><p>Der Ether-Kristall verankert nur, was deinen Account dauerhaft stärker macht. Dein Run wird freigegeben – Hyperlevel, Evolutionen und Gems überdauern den Wandel.</p><span class="prestige-access-seal"><i></i>${zoneReady ? "RITUALZUGANG BESTÄTIGT" : `RESONANZSPERRE · ZONE ${BALANCE.prestige.requiredZoneNumber}`}</span></section>
    <section class="ether-crystal-stage" aria-label="Ether-Kristall zu ${charge} Prozent geladen">
      <div class="ether-beam" aria-hidden="true"></div>
      <div class="ether-sigil ether-sigil--outer" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      <div class="ether-sigil ether-sigil--inner" aria-hidden="true"><i></i><i></i><i></i></div>
      <img class="ether-ritual-ring ether-ritual-ring--outer" src="/assets/effects/prestige/ether-ritual-ring-v1.png" alt="" aria-hidden="true"><img class="ether-ritual-ring ether-ritual-ring--inner" src="/assets/effects/prestige/ether-ritual-ring-v1.png" alt="" aria-hidden="true">
      <div class="ether-fragments" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
      <img class="ether-release-burst" src="/assets/effects/prestige/ether-release-burst-v1.png" alt="" aria-hidden="true">
      <div class="ether-crystal" data-testid="prestige-crystal"><img src="/assets/prestige/ether-crystal-v2.png" alt=""><span></span></div>
      <div class="ether-pedestal" aria-hidden="true"><i></i><span></span></div>
      <div class="ether-charge"><span><small>${zoneReady ? "KRISTALL-LADUNG" : "PRESTIGE-ZUGANG"}</small><b>${zoneReady ? `${game.runVictories} / 100` : `ZONE ${game.highestZoneNumber} / ${BALANCE.prestige.requiredZoneNumber}`}</b></span><i><em></em></i><strong>${reward > 0 ? `${reward} ETHER-KERN${reward === 1 ? "" : "E"} BEREIT` : zoneReady ? `${Math.max(0, 100 - game.runVictories)} SIEGE BIS PRESTIGE` : `ERREICHE ZONE ${BALANCE.prestige.requiredZoneNumber}`}</strong></div>
    </section>
    <section class="prestige-ledger">
      <article><span class="eyebrow">WIRD FREIGEGEBEN</span><h2>Run-Fortschritt</h2><ul><li><b>${formatNumber(game.resources.gold)}</b><span>Run-Gold</span></li><li><b>${game.roster.reduce((sum, monster) => sum + Math.max(0, monster.level - 1), 0)}</b><span>zusätzliche normale Level</span></li><li><b>${getZone(game.currentZoneId).name}</b><span>Zone und Stage-Fortschritt</span></li></ul></article>
      <article class="is-permanent"><span class="eyebrow">BLEIBT GESPEICHERT</span><h2>Permanente Bindung</h2><ul><li><b>${permanentHyper}</b><span>Hyperlevel</span></li><li><b>${game.roster.filter((monster) => monster.evolution === "evolved").length}</b><span>Evolutionen</span></li><li><b>${equippedGems}</b><span>eingesetzte Gems</span></li><li><b>${Object.values(game.fragments).reduce((sum, amount) => sum + amount, 0)}</b><span>Art-Fragmente</span></li><li><b>+0,2 %</b><span>Grundwerte je Prestige · aktuell +${currentStatBonus} %</span></li><li><b>+0,1 %</b><span>Gold je Prestige · aktuell +${currentGoldBonus} %</span></li><li><b>+0,001 PP</b><span>Dropchance je Prestige · aktuell +${currentDropBonus} PP</span></li></ul><small class="prestige-balance-note">Alle 100 Prestige werden Gegner um 2 % stärker.</small></article>
    </section>
    <div class="prestige-action"><button class="primary-button primary-button--large" id="confirm-prestige" ${reward <= 0 || prestigeActivating ? "disabled" : ""}>${prestigeActivating ? "ZEITLINIE WIRD GELÖST …" : reward > 0 ? "ETHER-KRISTALL AKTIVIEREN" : zoneReady ? "KRISTALL NOCH NICHT GELADEN" : `PRESTIGE AB ZONE ${BALANCE.prestige.requiredZoneNumber}`}</button><small>${prestigeActivating ? "Hyperlevel, Evolutionen und Gems werden verankert." : zoneReady ? "Diese Aktion setzt nur den oben aufgeführten Run-Fortschritt zurück." : "Die höchste erreichte Zone bleibt permanent gespeichert. Frühe Runs können Prestige nicht beschleunigen."}</small></div>
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
    <div class="offline-report__cache"><div><small>JETZT IM KAMPFSPEICHER</small><strong>${formatNumber(game.pendingGold)} Gold · ${game.pendingEggs.length} Eier · ${pendingMaterialCount} Materialien · ${game.pendingGems.length} Gems</strong></div><span>${game.cacheSlotsUsed}/${activeCacheCapacity()}</span></div>
    <div class="offline-report__actions"><button class="secondary-button" id="offline-continue">OHNE EINSAMMELN ZUM KAMPF</button><button class="primary-button primary-button--large" id="offline-collect" data-testid="offline-collect" ${hasPendingRewards ? "" : "disabled"}>${hasPendingRewards ? `ALLES EINSAMMELN ${icon("arrow")}` : "NICHTS ZUM EINSAMMELN"}</button></div>
    <small class="offline-report__note">Offline-Fortschritt ist durch die Kapazität deines Kampfspeichers begrenzt.</small>
  </section></div>`;
}

function liveElement<T extends HTMLElement>(name: string): T | null {
  return document.querySelector<T>(`[data-live="${name}"]`);
}

function setLiveText(name: string, value: string): void {
  const element = liveElement(name);
  if (element && element.textContent !== value) element.textContent = value;
}

function refreshCombatUi(now = performance.now(), structural = false): void {
  if (showLogin || activeView !== "expedition" || !battle) return;
  const player = activeCombatMonster();
  const battlefield = document.querySelector<HTMLElement>(".combat-battlefield");
  if (!player || !battlefield) return;

  const zone = getZone(game.currentZoneId);
  const zoneNumber = ZONES.findIndex((entry) => entry.id === zone.id) + 1;
  const progress = game.zoneProgress[zone.id] ?? { stage: 1, clears: 0 };
  const bossStage = progress.stage >= zone.stages;
  const chapter = currentChapter(game.totalVictories);
  const pendingFindCount = Object.values(game.pendingItems).reduce((sum, amount) => sum + amount, 0) + game.pendingGems.length;
  const capacity = activeCacheCapacity();
  const cacheEmpty = game.pendingGold === 0 && game.pendingEggs.length === 0 && pendingFindCount === 0;
  const attackProgress = battle.status === "fighting" ? Math.max(3, Math.min(100, 100 - ((battle.playerNextAttackAt - now) / 1_650) * 100)) : 100;

  battlefield.className = `combat-battlefield battle-stage battle-stage--${zone.id} battle-stage--${battle.status}`;
  battlefield.style.setProperty("--battle-background", `url('${zoneBackgroundUrl(zone.backgroundKey)}')`);
  const playerFighter = document.querySelector<HTMLElement>(".fighter--player");
  const enemyFighter = document.querySelector<HTMLElement>(".fighter--enemy");
  if (playerFighter) playerFighter.innerHTML = combatPlayerMarkup(player, battle);
  if (enemyFighter) enemyFighter.innerHTML = combatEnemyMarkup(battle, bossStage);

  const banner = liveElement("battle-banner");
  if (banner) {
    banner.className = `battle-state-banner battle-state-banner--${battle.status}`;
    banner.hidden = battle.status === "fighting";
    const small = banner.querySelector("small");
    const strong = banner.querySelector("strong");
    if (small) small.textContent = battle.status === "victory" ? "SIGNAL GESICHERT" : "RESONANZ WIRD NEU GEKOPPELT";
    if (strong) strong.textContent = battle.status === "victory" ? "STAGE GESCHAFFT" : "REGENERATION";
  }

  setLiveText("zone-stage", `ZONE ${String(zoneNumber).padStart(2, "0")} · ${bossStage ? "BOSS-SIGNAL" : `STAGE ${progress.stage}/${zone.stages}`}`);
  setLiveText("zone-name", zone.name);
  setLiveText("zone-subtitle", zone.subtitle);
  setLiveText("story-chapter", String(chapter.chapter).padStart(2, "0"));
  setLiveText("story-run", `AKTUELLES SIGNAL · RUN ${game.runVictories}`);
  setLiveText("story-title", chapter.title);
  setLiveText("story-copy", chapter.story);
  setLiveText("run-gold", formatNumber(game.resources.gold));
  setLiveText("prestige-cores", formatNumber(game.resources.cores));
  setLiveText("rank", String(rankForVictories(game.totalVictories)));
  setLiveText("cache-slots", `${game.cacheSlotsUsed}/${capacity}`);
  setLiveText("pending-gold", formatNumber(game.pendingGold));
  setLiveText("pending-eggs", String(game.pendingEggs.length));
  setLiveText("pending-finds", String(pendingFindCount));
  setLiveText("battle-status", battle.status === "victory" ? "STAGE GESCHAFFT" : battle.status === "recovering" ? "REGENERATION" : "KAMPF LÄUFT");
  setLiveText("battle-log", battle.log[0] ?? "Kampf läuft.");

  const attackBar = liveElement("attack-progress");
  if (attackBar) attackBar.style.width = `${attackProgress}%`;
  const cacheBar = liveElement("cache-progress");
  if (cacheBar) cacheBar.style.width = `${Math.min(100, (game.cacheSlotsUsed / capacity) * 100)}%`;
  const statusOrb = liveElement("battle-status-orb");
  if (statusOrb) statusOrb.className = `status-orb ${battle.status}`;
  const lootHud = document.querySelector<HTMLElement>(".combat-loot-hud");
  lootHud?.classList.toggle("is-empty", cacheEmpty);
  lootHud?.classList.toggle("has-loot", !cacheEmpty);
  const collectButton = document.querySelector<HTMLButtonElement>("#collect-cache");
  if (collectButton) {
    collectButton.disabled = cacheEmpty;
    collectButton.innerHTML = cacheEmpty ? "SPEICHER LEER" : `EINSAMMELN ${icon("arrow")}`;
  }
  const lootBadge = liveElement("control-badge-loot");
  if (lootBadge) {
    lootBadge.hidden = cacheEmpty;
    lootBadge.textContent = cacheEmpty ? "" : String(game.cacheSlotsUsed);
  }
  const missionBadge = liveElement("control-badge-missions");
  if (missionBadge && structural) {
    const claimableMilestone = MILESTONES.some((milestone) => game.totalVictories >= milestone.target && !game.claimedMilestones.includes(milestone.target));
    missionBadge.hidden = !claimableMilestone;
    missionBadge.textContent = claimableMilestone ? "!" : "";
  }

  for (const button of document.querySelectorAll<HTMLButtonElement>(".combat-zone-tab[data-zone]")) {
    const definition = ZONES.find((entry) => entry.id === button.dataset.zone);
    if (!definition) continue;
    const unlocked = game.unlockedZoneIds.includes(definition.id);
    const zoneProgress = game.zoneProgress[definition.id] ?? { stage: 1, clears: 0 };
    button.disabled = !unlocked;
    button.classList.toggle("is-active", definition.id === game.currentZoneId);
    button.setAttribute("aria-label", `${definition.name}${unlocked ? `, Stage ${zoneProgress.stage}` : ", verschlossen"}`);
    const label = button.querySelector("small");
    if (label) label.textContent = unlocked ? `STAGE ${zoneProgress.stage}/${definition.stages}` : "VERSCHLOSSEN";
  }

  if (structural) {
    if (interactionActive()) {
      combatStructuralRefreshDeferred = true;
    } else {
      const objectivePanel = liveElement("combat-objectives");
      if (objectivePanel) objectivePanel.innerHTML = combatObjectiveMarkup();
      combatStructuralRefreshDeferred = false;
    }
  }
}

function refreshIncubationUi(now = Date.now()): void {
  if (showLogin || activeView !== "incubation" || !game.incubation) return;
  const incubation = game.incubation;
  const ready = now >= incubation.hatchAt;
  const remaining = Math.max(0, Math.ceil((incubation.hatchAt - now) / 1_000));
  const duration = Math.max(1, incubation.hatchAt - incubation.startedAt);
  const progress = Math.min(100, ((now - incubation.startedAt) / duration) * 100);
  setLiveText("incubation-percent", `${Math.round(progress)}%`);
  setLiveText("incubation-copy", ready ? "Die Etherschale ist offen. Das Monster kann jetzt schlüpfen." : `Das Ei wird stabilisiert. Noch ungefähr ${remaining} Sekunden.`);
  const progressBar = liveElement("incubation-progress");
  if (progressBar) progressBar.style.width = `${progress}%`;
  const hatchButton = document.querySelector<HTMLButtonElement>("#hatch-egg");
  if (hatchButton) {
    hatchButton.disabled = !ready;
    hatchButton.innerHTML = ready ? `EI ÖFFNEN ${icon("spark")}` : `NOCH ${remaining}s`;
  }
  const chargeButton = document.querySelector<HTMLButtonElement>("#accelerate-incubation");
  if (chargeButton) {
    chargeButton.hidden = ready;
    chargeButton.disabled = ready || game.inventory.incubator_charge <= 0;
    chargeButton.textContent = `BRUTLADUNG −60s · ${game.inventory.incubator_charge}×`;
  }
}

function refreshDispatchUi(now = Date.now()): void {
  if (showLogin || activeView !== "dispatch") return;
  let readyCount = 0;
  for (const card of document.querySelectorAll<HTMLElement>(".dispatch-slot[data-expedition-id]")) {
    const expedition = game.expeditions.find((entry) => entry.id === card.dataset.expeditionId);
    if (!expedition) continue;
    const ready = now >= expedition.completesAt;
    if (ready) readyCount += 1;
    const duration = Math.max(1, expedition.completesAt - expedition.startedAt);
    const progress = Math.min(100, ((now - expedition.startedAt) / duration) * 100);
    card.classList.toggle("is-ready", ready);
    card.classList.toggle("is-running", !ready);
    const timerLabel = card.querySelector<HTMLElement>(".dispatch-slot__timer small");
    const timerValue = card.querySelector<HTMLElement>(".dispatch-slot__timer b");
    const progressBar = card.querySelector<HTMLElement>(".dispatch-slot__progress i");
    const claimButton = card.querySelector<HTMLButtonElement>("[data-claim-expedition]");
    if (timerLabel) timerLabel.textContent = ready ? "RÜCKKEHR BESTÄTIGT" : "RESTZEIT";
    if (timerValue) timerValue.textContent = expeditionRemainingLabel(expedition.completesAt, now);
    if (progressBar) progressBar.style.width = `${progress}%`;
    if (claimButton) {
      claimButton.disabled = !ready;
      claimButton.className = ready ? "primary-button" : "secondary-button";
      claimButton.textContent = ready ? "RÜCKKEHR BERGEN" : "EXPEDITION LÄUFT";
    }
  }
  setLiveText("dispatch-ready", `${game.expeditions.length}/${EXPEDITION_SLOT_COUNT} AKTIV · ${readyCount} BEREIT`);
}

function refreshDynamicUi(now = performance.now()): void {
  refreshCombatUi(now);
  refreshIncubationUi(Date.now());
  refreshDispatchUi(Date.now());
}

function render(): void {
  if (interactionActive()) {
    renderDeferred = true;
    return;
  }
  renderDeferred = false;
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
  bindModalKeyboard();
}

function flushDeferredUi(): void {
  if (interactionActive()) return;
  if (renderDeferred) render();
  if (combatStructuralRefreshDeferred) refreshCombatUi(performance.now(), true);
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

async function runGuildAction(command: GuildCommand, success: string): Promise<void> {
  if (!await sendGuildCommand(command)) return;
  showNotice("Gildenserver bestätigt", success, "success");
  render();
}

async function submitGuildCreate(form: HTMLFormElement): Promise<void> {
  const data = new FormData(form);
  await runGuildAction({
    type: "guild.create",
    name: String(data.get("name") ?? ""),
    tag: String(data.get("tag") ?? ""),
    description: String(data.get("description") ?? ""),
  }, "Deine Gilde und ihr erstes Chromosom wurden angelegt.");
}

async function submitGuildChat(form: HTMLFormElement): Promise<void> {
  const data = new FormData(form);
  if (await sendGuildCommand({ type: "guild.chat_send", body: String(data.get("body") ?? "") })) {
    form.reset();
    render();
  }
}

async function submitFriendRequest(form: HTMLFormElement): Promise<void> {
  const data = new FormData(form);
  await runGuildAction({ type: "friend.request", displayName: String(data.get("displayName") ?? "") }, "Freundschaftsanfrage wurde zugestellt.");
}

async function submitGuildInvite(form: HTMLFormElement): Promise<void> {
  const data = new FormData(form);
  await runGuildAction({ type: "guild.invite", displayName: String(data.get("displayName") ?? "") }, "Die Gildeneinladung ist sieben Tage gültig.");
}

async function submitGuildVote(form: HTMLFormElement): Promise<void> {
  const data = new FormData(form);
  await runGuildAction({ type: "guild.vote_create", kind: "gene_upgrade", subject: String(data.get("subject") ?? "") }, "Die DNA-Abstimmung läuft für 24 Stunden. Deine Ja-Stimme ist gesetzt.");
}

function bindEvents(): void {
  app.addEventListener("submit", (event) => {
    if (!(event.target instanceof HTMLFormElement)) return;
    event.preventDefault();
    if (event.target.id === "login-form") void signIn(event.target);
    if (event.target.id === "register-form") void registerAccount(event.target);
    if (event.target.id === "guild-create-form") void submitGuildCreate(event.target);
    if (event.target.id === "guild-chat-form") void submitGuildChat(event.target);
    if (event.target.id === "friend-request-form") void submitFriendRequest(event.target);
    if (event.target.id === "guild-invite-form") void submitGuildInvite(event.target);
    if (event.target.id === "guild-vote-form") void submitGuildVote(event.target);
  });
  app.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>("button") : null;
    if (!target || target.disabled) return;
    const run = (key: string, action: () => void): void => runSingleAction(key, action);

    if (target.dataset.qa) return run(`qa:${target.dataset.qa}`, () => applyQaState(target.dataset.qa as QaPreset));
    if (target.dataset.view) return setView(target.dataset.view as View);
    if (target.dataset.combatPanel) return toggleCombatPanel(target.dataset.combatPanel as CombatPanel);
    if (target.hasAttribute("data-home")) return setView("expedition");
    if (target.dataset.level) return run(`level:${target.dataset.level}`, () => levelUp(target.dataset.level ?? ""));
    if (target.dataset.train) return run(`train:${target.dataset.train}`, () => trainWithData(target.dataset.train ?? ""));
    if (target.dataset.evolve) return run(`evolve:${target.dataset.evolve}`, () => evolveMonster(target.dataset.evolve ?? ""));
    if (target.dataset.hyper) return run(`hyper:${target.dataset.hyper}`, () => upgradeHyper(target.dataset.hyper ?? ""));
    if (target.dataset.equipGem) return run(`equip:${target.dataset.monster}:${target.dataset.equipGem}`, () => equipGem(target.dataset.monster ?? "", target.dataset.equipGem ?? ""));
    if (target.dataset.unequipGem) return run(`unequip:${target.dataset.monster}:${target.dataset.unequipGem}`, () => unequipGem(target.dataset.monster ?? "", target.dataset.unequipGem ?? ""));
    if (target.dataset.active) return run(`active:${target.dataset.active}`, () => makeActive(target.dataset.active ?? ""));
    if (target.dataset.support) return run(`support:${target.dataset.support}`, () => makeSupport(target.dataset.support ?? ""));
    if (target.dataset.zone) return run(`zone:${target.dataset.zone}`, () => selectZone(target.dataset.zone ?? ""));
    if (target.dataset.starter) return run("starter", () => void chooseStarter(target.dataset.starter ?? ""));
    if (target.dataset.avatar) return run(`avatar:${target.dataset.avatar}`, () => void setAvatar(target.dataset.avatar ?? ""));
    if (target.dataset.frame) return run(`frame:${target.dataset.frame}`, () => void setFrame(target.dataset.frame ?? ""));
    if (target.dataset.incubate) return run(`incubate:${target.dataset.incubate}`, () => startIncubation(target.dataset.incubate ?? ""));
    if (target.dataset.milestone) return run(`milestone:${target.dataset.milestone}`, () => claimMilestone(Number(target.dataset.milestone)));
    if (target.dataset.objective) return run(`objective:${target.dataset.objective}`, () => claimObjective(target.dataset.objective ?? ""));
    if (target.dataset.startExpedition) return run(`expedition-start:${target.dataset.expeditionSlot}`, () => startTimedExpedition(Number(target.dataset.expeditionSlot), target.dataset.startExpedition ?? "", target.dataset.expeditionMonster ?? ""));
    if (target.dataset.claimExpedition) return run(`expedition-claim:${target.dataset.claimExpedition}`, () => claimTimedExpedition(target.dataset.claimExpedition ?? ""));
    if (target.dataset.craft) return run(`craft:${target.dataset.craft}`, () => craftRecipe(target.dataset.craft ?? ""));
    if (target.dataset.setting) return run(`setting:${target.dataset.setting}`, () => updatePlayerSetting(target.dataset.setting as keyof PlayerSettings, target.dataset.settingValue ?? ""));
    if (target.dataset.systemMessage) return run(`message:${target.dataset.systemMessage}`, () => claimSystemMessage(target.dataset.systemMessage ?? ""));
    if (target.dataset.research) return run(`research:${target.dataset.research}`, () => buyResearch(target.dataset.research as ResearchId));
    if (target.dataset.guildJoin) return run(`guild-join:${target.dataset.guildJoin}`, () => void runGuildAction({ type: "guild.join", guildId: target.dataset.guildJoin ?? "" }, "Du bist der Gilde beigetreten."));
    if (target.dataset.guildDonate) return run("guild-donate", () => void runGuildAction({ type: "guild.donate", amount: Number(target.dataset.guildDonate) }, "Deine DNA-Spende wurde im Gilden-Ledger gebucht."));
    if (target.dataset.guildGene) return run(`guild-gene:${target.dataset.guildGene}`, () => void runGuildAction({ type: "guild.gene_upgrade", geneId: target.dataset.guildGene ?? "" }, "Das Gen leuchtet jetzt eine Stufe stärker."));
    if (target.dataset.guildTask) return run(`guild-task:${target.dataset.guildTask}`, () => void runGuildAction({ type: "guild.task_claim", taskId: target.dataset.guildTask ?? "" }, "Die gemeinsame Aufgabe wurde genau einmal geborgen."));
    if (target.dataset.guildRole) return run(`guild-role:${target.dataset.guildRole}`, () => void runGuildAction({ type: "guild.role_set", playerId: target.dataset.guildRole ?? "", role: target.dataset.guildRoleValue === "officer" ? "officer" : "member" }, "Die Gildenrolle wurde geändert."));
    if (target.dataset.guildKick) return run(`guild-kick:${target.dataset.guildKick}`, () => {
      if (window.confirm("Dieses Mitglied wirklich aus der Gilde entfernen?")) void runGuildAction({ type: "guild.kick", playerId: target.dataset.guildKick ?? "" }, "Das Mitglied wurde entfernt und erhält eine Wechselsperre.");
    });
    if (target.dataset.guildLeadership) return run(`guild-leadership:${target.dataset.guildLeadership}`, () => {
      if (window.confirm("Gildenleitung dauerhaft an dieses Mitglied übertragen? Du wirst Offizier.")) void runGuildAction({ type: "guild.leadership_transfer", playerId: target.dataset.guildLeadership ?? "" }, "Die neue Gildenleitung ist eingesetzt.");
    });
    if (target.dataset.guildPolicy) return run("guild-policy", () => void runGuildAction({ type: "guild.policy_set", joinPolicy: target.dataset.guildPolicy === "invite" ? "invite" : "open" }, "Die Beitrittsregel wurde geändert."));
    if (target.dataset.guildInviteAccept) return run(`guild-invite-accept:${target.dataset.guildInviteAccept}`, () => void runGuildAction({ type: "guild.invite_accept", inviteId: target.dataset.guildInviteAccept ?? "" }, "Du bist der eingeladenen Gilde beigetreten."));
    if (target.dataset.guildInviteDecline) return run(`guild-invite-decline:${target.dataset.guildInviteDecline}`, () => void runGuildAction({ type: "guild.invite_decline", inviteId: target.dataset.guildInviteDecline ?? "" }, "Die Einladung wurde abgelehnt."));
    if (target.dataset.guildVote) return run(`guild-vote:${target.dataset.guildVote}`, () => void runGuildAction({ type: "guild.vote_cast", voteId: target.dataset.guildVote ?? "", choice: target.dataset.guildVoteChoice === "no" ? "no" : "yes" }, "Deine Stimme ist serverseitig gespeichert."));
    if (target.dataset.guildVoteResolve) return run(`guild-vote-resolve:${target.dataset.guildVoteResolve}`, () => void runGuildAction({ type: "guild.vote_resolve", voteId: target.dataset.guildVoteResolve ?? "" }, "Die Abstimmung wurde nach der aktuellen Mehrheit ausgewertet."));
    if (target.dataset.guildExpeditionClaim) return run(`guild-expedition-claim:${target.dataset.guildExpeditionClaim}`, () => void runGuildAction({ type: "guild.expedition_claim", expeditionId: target.dataset.guildExpeditionClaim ?? "" }, "Die Expeditions-DNA wurde ins unveränderliche Ledger gebucht."));
    if (target.dataset.friendAccept) return run(`friend-accept:${target.dataset.friendAccept}`, () => void runGuildAction({ type: "friend.accept", playerId: target.dataset.friendAccept ?? "" }, "Die Freundschaft ist bestätigt."));
    if (target.dataset.friendRemove) return run(`friend-remove:${target.dataset.friendRemove}`, () => void runGuildAction({ type: "friend.remove", playerId: target.dataset.friendRemove ?? "" }, "Die Freundschaft wurde gelöst."));
    if (target.dataset.playerBlock) return run(`player-block:${target.dataset.playerBlock}`, () => {
      if (window.confirm("Diesen Spieler blockieren? Freundschaft und sichtbare Chatnachrichten werden ausgeblendet.")) void runGuildAction({ type: "player.block", playerId: target.dataset.playerBlock ?? "" }, "Der Spieler wurde blockiert.");
    });
    if (target.dataset.playerReport) return run(`player-report:${target.dataset.playerReport}`, () => {
      const details = window.prompt("Kurze Beschreibung für das Moderationsteam:", "Unangemessenes Verhalten");
      if (details !== null) void runGuildAction({ type: "player.report", playerId: target.dataset.playerReport ?? "", reason: "harassment", details }, "Die Meldung liegt ohne automatische Strafe in der Moderationswarteschlange.");
    });
    if (target.dataset.messageReport) return run(`message-report:${target.dataset.messageReport}`, () => {
      const details = window.prompt("Warum soll diese Chatnachricht geprüft werden?", "Unangemessene Chatnachricht");
      if (details !== null) void runGuildAction({ type: "player.report", playerId: target.dataset.messagePlayer ?? "", messageId: target.dataset.messageReport, reason: "harassment", details }, "Nachricht und Autor wurden der Moderation eindeutig zugeordnet.");
    });

    switch (target.id) {
      case "auth-mode-login": authMode = "login"; authMessage = ""; return render();
      case "auth-mode-register": authMode = "register"; authMessage = ""; return render();
      case "cancel-account-deletion": return void cancelAccountDeletion();
      case "logout-account": return void logoutAccount();
      case "combat-focus-toggle": return toggleCombatFocus();
      case "collect-cache": return run("collect-cache", collectCache);
      case "offline-collect": return run("offline-collect", collectOfflineRewards);
      case "offline-continue":
        showOfflineReport = false;
        render();
        return window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
      case "hatch-egg": return run("hatch", hatchIncubation);
      case "accelerate-incubation": return run("incubation-charge", accelerateIncubation);
      case "open-starter": starterDialogOpen = true; return render();
      case "close-starter":
      case "close-starter-alt": starterDialogOpen = false; return render();
      case "close-hatch-notice": hatchNotice = ""; return render();
      case "start-prestige": return openPrestigeScene();
      case "confirm-prestige": return run("prestige", confirmPrestige);
      case "guild-boss-attack": return run("guild-boss", () => void runGuildAction({ type: "guild.boss_attack" }, "Dein Duo hat den Wochenboss getroffen."));
      case "guild-expedition-start": return run("guild-expedition-start", () => void runGuildAction({ type: "guild.expedition_start" }, "Die gemeinsame Expedition ist unterwegs."));
      case "guild-leave": return run("guild-leave", () => {
        if (window.confirm("Gilde wirklich verlassen? Danach gilt eine 24-stündige Wechselsperre.")) void runGuildAction({ type: "guild.leave" }, "Du hast die Gilde verlassen. Die Wechselsperre ist sichtbar aktiv.");
      });
      case "close-ui-notice": return dismissNotice();
      case "client-state-action": {
        const url = new URL(window.location.href);
        url.searchParams.delete("ui-state");
        window.history.replaceState({}, "", url);
        if (clientUiState === "conflict") return window.location.reload();
        clientUiState = "local";
        return render();
      }
      case "advance-tutorial": return run("tutorial", () => advanceTutorial(false));
      case "skip-tutorial": return run("tutorial", () => advanceTutorial(true));
      case "reset-game":
        if (!window.confirm("Lokalen Idle-Tamer-Spielstand wirklich löschen?")) return;
        resetGame(storageDependencies);
        return window.location.reload();
    }
  });
  document.addEventListener("pointerdown", () => { pointerInteractionActive = true; }, true);
  const releasePointer = (): void => {
    pointerInteractionActive = false;
    window.requestAnimationFrame(flushDeferredUi);
  };
  document.addEventListener("pointerup", releasePointer, true);
  document.addEventListener("pointercancel", releasePointer, true);
  document.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && event.target instanceof Element && event.target.closest("button")) keyboardInteractionActive = true;
  }, true);
  document.addEventListener("keyup", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    keyboardInteractionActive = false;
    window.requestAnimationFrame(flushDeferredUi);
  }, true);
}

function frame(now: number): void {
  const delta = now - lastFrame;
  lastFrame = now;
  if (delta < 1_000) tickBattle(now);
  if (now - lastDynamicRefresh >= 100) {
    refreshDynamicUi(now);
    lastDynamicRefresh = now;
  }
  if (clientUiState !== "conflict" && now - lastSave >= 5_000) {
    const saveResult = service.save();
    lastSave = now;
    if (!saveResult.ok && saveResult.reason === "stale-revision") {
      clientUiState = "conflict";
      render();
    }
  }
  if (isRunOnline() && !showLogin && now - lastRunSync >= 5_000 && !runSyncBusy) void synchronizeOnlineRun();
  if (isGuildOnline() && !showLogin && activeView === "guild" && now - lastGuildSync >= 5_000 && !guildSyncBusy) void synchronizeGuild();
  requestAnimationFrame(frame);
}

window.addEventListener("storage", (event) => {
  if (event.storageArea !== localStorage || event.key !== activeStorageKey || event.newValue === event.oldValue) return;
  clientUiState = "conflict";
  render();
});
window.addEventListener("beforeunload", () => {
  if (clientUiState !== "conflict") service.save();
});
bindEvents();
render();
void initializeAccount();
requestAnimationFrame(frame);
