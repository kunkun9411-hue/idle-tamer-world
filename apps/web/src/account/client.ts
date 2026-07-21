import {
  AUTH_CONTRACT_VERSION,
  GUILD_CONTRACT_VERSION,
  RUN_CONTRACT_VERSION,
  type AccountBootstrapResponse,
  type AccountCommand,
  type AccountCommandResponse,
  type AuthApiProblem,
  type LoginResponse,
  type RegisterRequest,
  type ApiProblem,
  type RunBootstrapResponse,
  type RunCommand,
  type RunCommandResponse,
  type GuildBootstrapResponse,
  type GuildCommand,
  type GuildCommandResponse,
} from "@idle-tamer/contracts";

export const ACTIVE_ACCOUNT_NAMESPACE_KEY = "idle-tamer.active-account-namespace.v1";
export const CLIENT_INSTANCE_KEY = "idle-tamer.client-instance.v1";

export class AccountApiError extends Error {
  public constructor(public readonly status: number, public readonly problem: AuthApiProblem) {
    super(problem.message);
    this.name = "AccountApiError";
  }
}

export class RunApiError extends Error {
  public constructor(public readonly status: number, public readonly problem: ApiProblem) {
    super(problem.message);
    this.name = "RunApiError";
  }
}

const fallbackProblem = (message: string): AuthApiProblem => ({
  errorContractVersion: 2,
  code: "UNAVAILABLE",
  message,
  correlationId: "client",
});

const parseResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let problem = fallbackProblem("Der Account-Server ist vorübergehend nicht erreichbar.");
    try { problem = await response.json() as AuthApiProblem; } catch { /* keep safe fallback */ }
    throw new AccountApiError(response.status, problem);
  }
  return response.json() as Promise<T>;
};

const parseRunResponse = async <T extends { runContractVersion: number }>(response: Response): Promise<T> => {
  const body = await response.json().catch(() => null) as T | ApiProblem | null;
  if (!response.ok) {
    const problem = body && "code" in body
      ? body as ApiProblem
      : { errorContractVersion: 1 as const, code: "UNKNOWN" as const, message: "Der Run-Server ist vorübergehend nicht erreichbar." };
    throw new RunApiError(response.status, problem);
  }
  if (!body || !("runContractVersion" in body) || body.runContractVersion !== RUN_CONTRACT_VERSION) {
    throw new RunApiError(response.status, { errorContractVersion: 1, code: "UNKNOWN", message: "Client und Run-Server verwenden unterschiedliche Verträge." });
  }
  return body as T;
};

const parseGuildResponse = async <T extends { guildContractVersion: number }>(response: Response): Promise<T> => {
  const body = await parseResponse<T>(response);
  if (body.guildContractVersion !== GUILD_CONTRACT_VERSION) throw new AccountApiError(409, {
    errorContractVersion: 2, code: "CONFLICT", message: "Client und Gildenserver verwenden unterschiedliche Verträge.", correlationId: "guild-contract",
  });
  return body;
};

export const getClientInstanceId = (storage: Pick<Storage, "getItem" | "setItem"> = localStorage): string => {
  const current = storage.getItem(CLIENT_INSTANCE_KEY);
  if (current) return current;
  const created = crypto.randomUUID();
  storage.setItem(CLIENT_INSTANCE_KEY, created);
  return created;
};

export class AccountClient {
  private csrfToken = "";
  private readonly fetchImpl: typeof fetch;

  public constructor(fetchImpl: typeof fetch = fetch) {
    this.fetchImpl = (...arguments_) => fetchImpl(...arguments_);
  }

  public async bootstrap(): Promise<AccountBootstrapResponse> {
    const response = await this.fetchImpl("/api/v1/bootstrap", { credentials: "include", headers: { accept: "application/json" } });
    const bootstrap = await parseResponse<AccountBootstrapResponse>(response);
    this.acceptBootstrap(bootstrap);
    return bootstrap;
  }

  public async login(identifier: string, password: string, rememberMe: boolean, clientInstanceId: string): Promise<AccountBootstrapResponse> {
    const response = await this.fetchImpl("/api/v1/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ identifier, password, rememberMe, clientInstanceId }),
    });
    const payload = await parseResponse<LoginResponse>(response);
    this.acceptBootstrap(payload.bootstrap);
    return payload.bootstrap;
  }

  public async register(request: RegisterRequest): Promise<void> {
    const response = await this.fetchImpl("/api/v1/auth/register", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(request),
    });
    await parseResponse(response);
  }

  public async verifyEmail(token: string): Promise<void> {
    const response = await this.fetchImpl("/api/v1/auth/verify-email", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!response.ok) await parseResponse(response);
  }

  public async command(command: AccountCommand, expectedRevision: number, clientInstanceId: string, commandId = crypto.randomUUID()): Promise<AccountCommandResponse> {
    const response = await this.fetchImpl("/api/v1/account/commands", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json", accept: "application/json", "x-csrf-token": this.csrfToken },
      body: JSON.stringify({ commandId, clientInstanceId, expectedRevision, issuedAt: new Date().toISOString(), command }),
    });
    const payload = await parseResponse<AccountCommandResponse>(response);
    this.acceptBootstrap(payload.bootstrap);
    return payload;
  }

  public async bootstrapRun(): Promise<RunBootstrapResponse> {
    const response = await this.fetchImpl("/api/v1/run", { credentials: "include", headers: { accept: "application/json" } });
    return parseRunResponse<RunBootstrapResponse>(response);
  }

  public async runCommand(command: RunCommand, expectedRevision: number, clientInstanceId: string, commandId = crypto.randomUUID()): Promise<RunCommandResponse> {
    const response = await this.fetchImpl("/api/v1/run/commands", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json", accept: "application/json", "x-csrf-token": this.csrfToken },
      body: JSON.stringify({ commandId, clientInstanceId, expectedRevision, issuedAt: new Date().toISOString(), command }),
    });
    return parseRunResponse<RunCommandResponse>(response);
  }

  public async bootstrapGuild(): Promise<GuildBootstrapResponse> {
    const response = await this.fetchImpl("/api/v1/guild", { credentials: "include", headers: { accept: "application/json" } });
    return parseGuildResponse<GuildBootstrapResponse>(response);
  }

  public async guildCommand(command: GuildCommand, expectedRevision: number, clientInstanceId: string, commandId = crypto.randomUUID()): Promise<GuildCommandResponse> {
    const response = await this.fetchImpl("/api/v1/guild/commands", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json", accept: "application/json", "x-csrf-token": this.csrfToken },
      body: JSON.stringify({ commandId, clientInstanceId, expectedRevision, issuedAt: new Date().toISOString(), command }),
    });
    return parseGuildResponse<GuildCommandResponse>(response);
  }

  public async logout(): Promise<void> {
    const response = await this.fetchImpl("/api/v1/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json", "x-csrf-token": this.csrfToken },
      body: "{}",
    });
    if (!response.ok) await parseResponse(response);
    this.csrfToken = "";
  }

  public async cancelDeletion(): Promise<AccountBootstrapResponse> {
    const response = await this.fetchImpl("/api/v1/account/deletion/cancel", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json", "x-csrf-token": this.csrfToken },
      body: "{}",
    });
    if (!response.ok) await parseResponse(response);
    return this.bootstrap();
  }

  private acceptBootstrap(bootstrap: AccountBootstrapResponse): void {
    if (bootstrap.authContractVersion !== AUTH_CONTRACT_VERSION) throw new AccountApiError(409, {
      errorContractVersion: 2,
      code: "CONFLICT",
      message: "Client und Account-Server verwenden unterschiedliche Vertragsversionen.",
      correlationId: "client-contract",
    });
    this.csrfToken = bootstrap.csrfToken;
  }
}
