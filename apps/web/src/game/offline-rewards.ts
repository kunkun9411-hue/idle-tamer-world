import type { AuthoritativeRunSnapshot } from "@idle-tamer/contracts";

export interface LocalOfflineProgress {
  offlineSeconds: number;
  cacheSlotsUsed: number;
  pendingGold: number;
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
