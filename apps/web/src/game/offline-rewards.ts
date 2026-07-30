import type { AuthoritativeRunSnapshot, RunBootstrapResponse } from "@idle-tamer/contracts";

export interface LocalOfflineProgress {
  offlineSeconds: number;
  cacheSlotsUsed: number;
  pendingGold: number;
}

export interface LocalReturnActivity {
  offlineSeconds: number;
  offlineGold: number;
  offlineSlots: number;
  offlineItemCount: number;
}

export interface ReturnReportActivity {
  authority: "local" | "server";
  durationSeconds: number | null;
  victoriesAdded: number;
  goldAdded: number;
  slotsAdded: number;
  itemCountAdded: number;
  eggsAdded: number;
  gemsAdded: number;
}

export const authoritativeCacheHasRewards = (snapshot: AuthoritativeRunSnapshot): boolean =>
  BigInt(snapshot.pendingGold) > 0n
  || snapshot.cacheSlotsUsed > 0
  || snapshot.collection.pendingEggs.length > 0
  || snapshot.collection.pendingGems.length > 0
  || Object.values(snapshot.collection.pendingItems).some((amount) => BigInt(amount) > 0n);

/**
 * Local progress may open the return report only for a local run. Online
 * accounts wait for the authoritative bootstrap so a stale browser cache can
 * never offer a claim that the server has already settled.
 */
export const shouldShowOfflineReport = (
  online: boolean,
  local: LocalOfflineProgress,
  snapshot: AuthoritativeRunSnapshot | null = null,
): boolean => online
  ? Boolean(snapshot && authoritativeCacheHasRewards(snapshot))
  : local.offlineSeconds > 0 || local.cacheSlotsUsed > 0 || local.pendingGold > 0;

/**
 * Never mix a browser's stale offline calculation with a server-authoritative
 * run. Online reports use only the settlement returned by the current
 * bootstrap; current cache totals are rendered separately from the snapshot.
 */
export const returnReportActivity = (
  online: boolean,
  local: LocalReturnActivity,
  settlement: RunBootstrapResponse["settlement"] | null = null,
): ReturnReportActivity => online
  ? {
      authority: "server",
      durationSeconds: null,
      victoriesAdded: settlement?.victoriesAdded ?? 0,
      goldAdded: Number(settlement?.goldAdded ?? 0),
      slotsAdded: 0,
      itemCountAdded: settlement?.itemsAdded ?? 0,
      eggsAdded: settlement?.eggsAdded ?? 0,
      gemsAdded: settlement?.gemsAdded ?? 0,
    }
  : {
      authority: "local",
      durationSeconds: local.offlineSeconds,
      victoriesAdded: local.offlineSlots,
      goldAdded: local.offlineGold,
      slotsAdded: local.offlineSlots,
      itemCountAdded: local.offlineItemCount,
      eggsAdded: 0,
      gemsAdded: 0,
    };
