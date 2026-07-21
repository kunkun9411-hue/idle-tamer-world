export const GUILD_CONTRACT_VERSION = 1 as const;

export type GuildRole = "leader" | "officer" | "member";
export type FriendshipStatus = "pending_incoming" | "pending_outgoing" | "accepted";

export interface GuildDirectoryEntry {
  guildId: string;
  name: string;
  tag: string;
  memberCount: number;
  memberLimit: number;
  dnaLevel: number;
  joinPolicy: "open" | "invite";
}

export interface GuildMemberSnapshot {
  playerId: string;
  displayName: string;
  avatarId: string;
  frameId: string;
  role: GuildRole;
  contribution: string;
  joinedAt: string;
}

export interface GuildGeneSnapshot {
  geneId: string;
  level: number;
  maxLevel: number;
  nextCost: string | null;
}

export interface GuildTaskSnapshot {
  taskId: string;
  periodKey: string;
  progress: string;
  target: string;
  rewardDna: string;
  completed: boolean;
  claimed: boolean;
}

export interface GuildBossSnapshot {
  periodKey: string;
  definitionId: string;
  hp: string;
  maxHp: string;
  defeated: boolean;
  nextAttackAt: string | null;
  personalDamage: string;
}

export interface GuildInviteSnapshot {
  inviteId: string;
  guildId: string;
  guildName: string;
  guildTag: string;
  invitedByDisplayName: string;
  expiresAt: string;
}

export interface GuildVoteSnapshot {
  voteId: string;
  kind: "gene_upgrade" | "policy_change";
  subject: string;
  yes: number;
  no: number;
  eligibleVoters: number;
  myChoice: "yes" | "no" | null;
  closesAt: string;
}

export interface GuildExpeditionSnapshot {
  expeditionId: string;
  definitionId: string;
  status: "active" | "claimable" | "claimed";
  startedAt: string;
  completesAt: string;
  rewardDna: string;
}

export interface GuildChatMessageSnapshot {
  messageId: string;
  playerId: string;
  displayName: string;
  role: GuildRole;
  body: string;
  createdAt: string;
}

export interface GuildMembershipSnapshot {
  guildId: string;
  name: string;
  tag: string;
  description: string;
  joinPolicy: "open" | "invite";
  memberLimit: number;
  memberCount: number;
  role: GuildRole;
  dnaBalance: string;
  personalDna: string;
  genes: GuildGeneSnapshot[];
  members: GuildMemberSnapshot[];
  tasks: GuildTaskSnapshot[];
  boss: GuildBossSnapshot;
  votes: GuildVoteSnapshot[];
  expedition: GuildExpeditionSnapshot | null;
  chat: GuildChatMessageSnapshot[];
}

export interface FriendSnapshot {
  playerId: string;
  displayName: string;
  avatarId: string;
  frameId: string;
  status: FriendshipStatus;
}

export interface GuildSnapshot {
  revision: number;
  serverTime: string;
  membership: GuildMembershipSnapshot | null;
  directory: GuildDirectoryEntry[];
  friends: FriendSnapshot[];
  blockedPlayerIds: string[];
  invitations: GuildInviteSnapshot[];
  joinAvailableAt: string;
}

export interface GuildBootstrapResponse {
  guildContractVersion: typeof GUILD_CONTRACT_VERSION;
  snapshot: GuildSnapshot;
}

export type GuildCommand =
  | { type: "guild.create"; name: string; tag: string; description: string }
  | { type: "guild.join"; guildId: string }
  | { type: "guild.leave" }
  | { type: "guild.leadership_transfer"; playerId: string }
  | { type: "guild.role_set"; playerId: string; role: Exclude<GuildRole, "leader"> }
  | { type: "guild.kick"; playerId: string }
  | { type: "guild.policy_set"; joinPolicy: "open" | "invite" }
  | { type: "guild.invite"; displayName: string }
  | { type: "guild.invite_accept"; inviteId: string }
  | { type: "guild.invite_decline"; inviteId: string }
  | { type: "guild.donate"; amount: number }
  | { type: "guild.gene_upgrade"; geneId: string }
  | { type: "guild.vote_create"; kind: "gene_upgrade" | "policy_change"; subject: string }
  | { type: "guild.vote_cast"; voteId: string; choice: "yes" | "no" }
  | { type: "guild.vote_resolve"; voteId: string }
  | { type: "guild.task_claim"; taskId: string }
  | { type: "guild.boss_attack" }
  | { type: "guild.expedition_start" }
  | { type: "guild.expedition_claim"; expeditionId: string }
  | { type: "guild.chat_send"; body: string }
  | { type: "friend.request"; displayName: string }
  | { type: "friend.accept"; playerId: string }
  | { type: "friend.remove"; playerId: string }
  | { type: "player.block"; playerId: string }
  | { type: "player.unblock"; playerId: string }
  | { type: "player.report"; playerId: string; reason: string; details: string; messageId?: string };

export interface GuildCommandEnvelope {
  commandId: string;
  clientInstanceId: string;
  expectedRevision: number;
  issuedAt: string;
  command: GuildCommand;
}

export interface GuildCommandResponse {
  guildContractVersion: typeof GUILD_CONTRACT_VERSION;
  accepted: true;
  replayed: boolean;
  snapshot: GuildSnapshot;
  event: {
    type: string;
    payload: Record<string, string | number | boolean>;
  };
}
