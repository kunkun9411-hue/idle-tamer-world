# Auth- und Account-API-Vertrag 1

Dieser Vertrag ist die baubare HTTP-Grenze für Block 4. Authentifizierung und Account-Bootstrap sind von API-Protokoll 8 für den späteren vollständigen Spielzustand getrennt.

## Gemeinsame Regeln

- Basis: `/api/v1`
- Request und Response: UTF-8-JSON
- Session: Cookie `__Host-idle_tamer_session`
- mutierende authentifizierte Requests: `X-CSRF-Token`
- jede Antwort: `x-request-id`
- Zeitwerte: ISO-8601 UTC
- IDs: UUID-Strings
- Auth-Vertragsversion in Bootstrap und Fehlern: `1`
- kein Endpoint gibt Token-, Cookie- oder Passwort-Hashes zurück

## Routenübersicht

| Methode | Route | Auth | Zweck |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | nein | Account anlegen und Verifikation senden |
| `POST` | `/auth/verify-email` | Token | E-Mail bestätigen |
| `POST` | `/auth/verification/resend` | nein | Verifikation erneut senden |
| `POST` | `/auth/login` | nein | Session erstellen |
| `POST` | `/auth/logout` | ja + CSRF | aktuelle Session widerrufen |
| `POST` | `/auth/logout-others` | ja + CSRF | alle anderen Sessions widerrufen |
| `GET` | `/auth/sessions` | ja | Geräte anzeigen |
| `DELETE` | `/auth/sessions/:sessionId` | ja + CSRF | bestimmte Session widerrufen |
| `POST` | `/auth/reauthenticate` | ja + CSRF | sensible Aktion freigeben |
| `POST` | `/auth/password/forgot` | nein | generischen Recoveryablauf starten |
| `POST` | `/auth/password/reset` | Token | Passwort ersetzen |
| `POST` | `/auth/password/change` | ja + CSRF + frisch | Passwort ändern |
| `GET` | `/bootstrap` | ja | Account, Profil, Starter und Autorität laden |
| `POST` | `/account/commands` | ja + CSRF | idempotente Profil-/Starterabsicht |
| `POST` | `/account/export` | ja + CSRF + frisch | Exportjob anlegen |
| `GET` | `/account/export/:exportId` | ja | Status oder Downloadinformation |
| `POST` | `/account/deletion` | ja + CSRF + frisch | Löschung vormerken |
| `POST` | `/account/deletion/cancel` | eingeschränkt + CSRF | Löschung abbrechen |

## Registrierung

```ts
interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  clientInstanceId: string;
  termsVersion: string;
  privacyVersion: string;
}

interface AcceptedResponse {
  authContractVersion: 1;
  accepted: true;
  message: string;
  serverTime: string;
}
```

Erfolg und bereits bekannte E-Mail antworten beide mit HTTP 202. Anzeigenamen dürfen als öffentlich sichtbare Kennung einen `409 VALIDATION / DISPLAY_NAME_TAKEN` erzeugen.

Der Server akzeptiert nur die aktuell angebotenen Policy-Versionen. Er übernimmt Versionsstrings niemals ungeprüft als Zustimmung.

## Verifikation

```ts
interface VerifyEmailRequest {
  token: string;
}
```

- Erfolg: HTTP 204
- ungültig, verbraucht oder abgelaufen: HTTP 400 mit demselben Grund `TOKEN_INVALID`
- keine Sessionerstellung durch Verifikation

## Login

```ts
interface LoginRequest {
  identifier: string;
  password: string;
  rememberMe: boolean;
  clientInstanceId: string;
}

interface LoginResponse {
  authContractVersion: 1;
  accepted: true;
  bootstrap: AccountBootstrapResponse;
}
```

`identifier` akzeptiert E-Mail; spätere Anmeldung über Tamer-Namen wird erst nach einer Enumeration- und Recoveryprüfung aktiviert. Falscher Identifier und falsches Passwort liefern dieselbe Antwort.

## Account-Bootstrap

```ts
type ServerAuthorityScope = "account" | "profile" | "starter" | "run" | "economy";
type LocalAuthorityScope =
  | "collection"
  | "incubation"
  | "expeditions"
  | "research"
  | "prestige";

interface AccountBootstrapResponse {
  authContractVersion: 1;
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
    roles: Array<"player" | "support" | "moderator" | "admin">;
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
    mode: "run-online-collection-local";
    server: ServerAuthorityScope[];
    local: LocalAuthorityScope[];
    localStorageNamespace: string;
  };
  features: {
    guilds: boolean;
    guildDna: boolean;
    liveEvents: boolean;
    pvp: boolean;
  };
  csrfToken: string;
}
```

`localStorageNamespace` ist eine undurchsichtige servererzeugte Kennung pro Spieler, nicht die E-Mail. Die Starterliste enthält in Block 4 die zehn anfänglichen Auswahlstarter.

## Accountkommandos

```ts
type AccountCommand =
  | { type: "starter.choose"; definitionId: string }
  | { type: "profile.avatar"; avatarId: string }
  | { type: "profile.frame"; frameId: string }
  | { type: "profile.display_name"; displayName: string };

interface AccountCommandEnvelope {
  commandId: string;
  clientInstanceId: string;
  expectedRevision: number;
  issuedAt: string;
  command: AccountCommand;
}

interface AccountCommandResponse {
  authContractVersion: 1;
  accepted: true;
  resultingRevision: number;
  bootstrap: AccountBootstrapResponse;
}
```

`starter.choose` ist nur erlaubt, solange `starterDefinitionId` null ist. Derselbe `commandId` mit identischem Request liefert dasselbe Ergebnis; anderer Inhalt unter derselben ID ist `VALIDATION / IDEMPOTENCY_MISMATCH`.

## Sessions

```ts
interface SessionListItem {
  sessionId: string;
  deviceName: string;
  createdAt: string;
  lastSeenAt: string;
  idleExpiresAt: string;
  absoluteExpiresAt: string;
  current: boolean;
}

interface SessionListResponse {
  authContractVersion: 1;
  sessions: SessionListItem[];
}
```

Das Löschen einer bereits widerrufenen oder fremden Session antwortet idempotent mit 204 und verrät keine fremde Existenz. Die aktuelle Session wird nur über `/auth/logout` beendet.

## Recovery und Passwortwechsel

```ts
interface ForgotPasswordRequest { email: string }
interface ResetPasswordRequest { token: string; password: string; passwordConfirmation: string }
interface ChangePasswordRequest { currentPassword: string; password: string; passwordConfirmation: string }
interface ReauthenticateRequest { password: string }

interface SessionRotationResponse {
  authContractVersion: 1;
  bootstrap: AccountBootstrapResponse;
}
```

- Forgot: immer HTTP 202
- Reset: HTTP 204, danach alle Sessions widerrufen
- Change: HTTP 200 mit `SessionRotationResponse`; andere Sessions widerrufen, aktuelle Session und CSRF rotieren
- Reauth: HTTP 200 mit `SessionRotationResponse`; `reauthenticatedAt`, Sessiontoken und CSRF rotieren

## Export

```ts
interface AccountExportResponse {
  authContractVersion: 1;
  exportId: string;
  status: "pending" | "ready" | "failed" | "expired";
  requestedAt: string;
  readyAt?: string;
  expiresAt?: string;
  downloadUrl?: string;
}
```

`downloadUrl` ist kurzlebig, einmalig oder eng ablaufend und nur für den aktuellen Account gültig. Ein zweites POST während eines offenen Jobs liefert denselben Job.

## Löschung

```ts
interface RequestDeletionRequest {
  confirmation: "DELETE";
  password: string;
}

interface DeletionResponse {
  authContractVersion: 1;
  status: "deletion_pending";
  deleteAfter: string;
}
```

Nach erfolgreichem Request werden alle Sessions widerrufen. Eine eingeschränkte neue Anmeldung darf nur den Löschstatus, Exportstatus und den Abbruchendpunkt verwenden.

## Fehlervertrag 2

```ts
interface AuthApiProblem {
  errorContractVersion: 2;
  code:
    | "UNAUTHENTICATED"
    | "FORBIDDEN"
    | "CONFLICT"
    | "VALIDATION"
    | "RATE_LIMITED"
    | "UNAVAILABLE"
    | "UNKNOWN";
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
```

Öffentliche Meldungen dürfen keine E-Mail-Existenz, Tokenhashes, internen Sperrgrund oder Stacktraces verraten. `fieldErrors` enthält nur vorher definierte Feldnamen.

## HTTP-Statusmatrix

| Status | Verwendung |
| --- | --- |
| 200 | Bootstrap, Login, Listen, Kommandoergebnis |
| 202 | Registrierung, Forgot Password, asynchroner Export |
| 204 | Logout, Widerruf, Verifikation und Reset |
| 400 | syntaktisch oder fachlich ungültige Eingabe |
| 401 | keine, ungültige oder abgelaufene Session; falsche Credentials |
| 403 | gültige Identität ohne Freigabe, CSRF oder Statuszugang |
| 409 | Revision, Idempotenz oder öffentlich sichtbarer Namenskonflikt |
| 429 | Rate-Limit mit `Retry-After` |
| 503 | Abhängigkeit vorübergehend nicht verfügbar |

## Browserzustände

| Zustand | sichtbares Verhalten |
| --- | --- |
| keine Session | Login/Registrierung |
| Verifikation offen | neutrale Bestätigung und Resend mit Cooldown |
| aktive Session, kein Starter | Starterdialog aus zehn Linien |
| aktive Session, Starter vorhanden | Kampf und „Account & Run online · Sammlung lokal“ |
| Session abgelaufen | Login, lokaler Save bleibt unangetastet |
| Revision veraltet | Account-Bootstrap neu laden, nie blind wiederholen |
| Löschung vorgemerkt | nur Status, Export und Abbruch |
| Server nicht erreichbar | lokales Spiel nur nach klarer Offline-Anzeige; keine serverautoritativen Profiländerungen |
