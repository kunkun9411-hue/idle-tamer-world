import type { GameFeatureFlags } from "./api-contract";

export const AUTH_CONTRACT_VERSION = 1 as const;
export const AUTH_ERROR_CONTRACT_VERSION = 2 as const;

export type AccountRole = "player" | "support" | "moderator" | "admin";
export type AccountStatus = "pending_verification" | "active" | "locked" | "deletion_pending" | "deleted";
export type ServerAuthorityScope = "account" | "profile" | "starter" | "run" | "economy" | "collection" | "incubation" | "expeditions" | "research" | "prestige";
export type LocalAuthorityScope = "collection" | "incubation" | "expeditions" | "research" | "prestige";

export interface AccountBootstrapResponse {
  authContractVersion: typeof AUTH_CONTRACT_VERSION;
  serverTime: string;
  session: {
    sessionId: string;
    deviceName: string;
    createdAt: string;
    lastSeenAt: string;
    idleExpiresAt: string;
    absoluteExpiresAt: string;
    reauthenticatedAt: string;
  };
  account: {
    userId: string;
    status: "active" | "deletion_pending";
    emailMasked: string;
    emailVerified: true;
    roles: AccountRole[];
    createdAt: string;
  };
  profile: {
    playerId: string;
    displayName: string;
    avatarId: string;
    frameId: string;
    revision: number;
  };
  onboarding: {
    starterDefinitionId: string | null;
    availableStarterDefinitionIds: string[];
    requiredAction: "starter_choice" | null;
  };
  authority: {
    mode: "solo-online";
    server: ServerAuthorityScope[];
    local: LocalAuthorityScope[];
    localStorageNamespace: string;
  };
  features: GameFeatureFlags;
  csrfToken: string;
}

export interface LoginRequest {
  identifier: string;
  password: string;
  rememberMe: boolean;
  clientInstanceId: string;
}

export interface LoginResponse {
  authContractVersion: typeof AUTH_CONTRACT_VERSION;
  accepted: true;
  bootstrap: AccountBootstrapResponse;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  clientInstanceId: string;
  termsVersion: string;
  privacyVersion: string;
}

export interface AcceptedAuthResponse {
  authContractVersion: typeof AUTH_CONTRACT_VERSION;
  accepted: true;
  message: string;
  serverTime: string;
}

export type AccountCommand =
  | { type: "starter.choose"; definitionId: string }
  | { type: "profile.avatar"; avatarId: string }
  | { type: "profile.frame"; frameId: string }
  | { type: "profile.display_name"; displayName: string };

export interface AccountCommandEnvelope {
  commandId: string;
  clientInstanceId: string;
  expectedRevision: number;
  issuedAt: string;
  command: AccountCommand;
}

export interface AccountCommandResponse {
  authContractVersion: typeof AUTH_CONTRACT_VERSION;
  accepted: true;
  resultingRevision: number;
  bootstrap: AccountBootstrapResponse;
}

export interface AuthApiProblem {
  errorContractVersion: typeof AUTH_ERROR_CONTRACT_VERSION;
  code: "UNAUTHENTICATED" | "FORBIDDEN" | "CONFLICT" | "VALIDATION" | "RATE_LIMITED" | "UNAVAILABLE" | "UNKNOWN";
  reason?:
    | "AUTH_INVALID_CREDENTIALS"
    | "AUTH_EMAIL_UNVERIFIED"
    | "AUTH_ACCOUNT_UNAVAILABLE"
    | "SESSION_EXPIRED"
    | "CSRF_INVALID"
    | "ORIGIN_INVALID"
    | "TOKEN_INVALID"
    | "DISPLAY_NAME_TAKEN"
    | "DISPLAY_NAME_COOLDOWN"
    | "STARTER_ALREADY_CHOSEN"
    | "STARTER_INVALID"
    | "IDEMPOTENCY_MISMATCH"
    | "REVISION_MISMATCH"
    | "REAUTHENTICATION_REQUIRED";
  message: string;
  correlationId: string;
  retryAfterSeconds?: number;
  latestRevision?: number;
  fieldErrors?: Record<string, string>;
}
