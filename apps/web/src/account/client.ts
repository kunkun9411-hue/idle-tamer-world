import {
  AUTH_CONTRACT_VERSION,
  type AccountBootstrapResponse,
  type AccountCommand,
  type AccountCommandResponse,
  type AuthApiProblem,
  type LoginResponse,
  type RegisterRequest,
} from "@idle-tamer/contracts";

export const ACTIVE_ACCOUNT_NAMESPACE_KEY = "idle-tamer.active-account-namespace.v1";
export const CLIENT_INSTANCE_KEY = "idle-tamer.client-instance.v1";

export class AccountApiError extends Error {
  public constructor(public readonly status: number, public readonly problem: AuthApiProblem) {
    super(problem.message);
    this.name = "AccountApiError";
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

export const getClientInstanceId = (storage: Pick<Storage, "getItem" | "setItem"> = localStorage): string => {
  const current = storage.getItem(CLIENT_INSTANCE_KEY);
  if (current) return current;
  const created = crypto.randomUUID();
  storage.setItem(CLIENT_INSTANCE_KEY, created);
  return created;
};

export class AccountClient {
  private csrfToken = "";

  public constructor(private readonly fetchImpl: typeof fetch = fetch) {}

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
