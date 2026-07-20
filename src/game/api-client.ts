import {
  API_PROTOCOL_VERSION,
  createCommandEnvelope,
  type ApiProblem,
  type GameBootstrapResponse,
  type GameCommand,
  type GameCommandResponse,
} from "./api-contract";
import { CONTENT_CONTRACT_VERSION, ERROR_CONTRACT_VERSION } from "./contract-versions";

export class GameApiError extends Error {
  public constructor(
    public readonly status: number,
    public readonly problem: ApiProblem,
  ) {
    super(problem.message);
    this.name = "GameApiError";
  }
}

export interface GameApiClient {
  bootstrap(signal?: AbortSignal): Promise<GameBootstrapResponse>;
  send(command: GameCommand, expectedRevision: number, signal?: AbortSignal): Promise<GameCommandResponse>;
}

export interface HttpGameClientOptions {
  baseUrl?: string;
  clientInstanceId?: string;
  fetchImpl?: typeof fetch;
}

const trimSlash = (value: string): string => value.replace(/\/+$/, "");

export class HttpGameClient implements GameApiClient {
  private readonly baseUrl: string;
  private readonly clientInstanceId: string;
  private readonly fetchImpl: typeof fetch;

  public constructor(options: HttpGameClientOptions = {}) {
    this.baseUrl = trimSlash(options.baseUrl ?? "/api");
    this.clientInstanceId = options.clientInstanceId ?? crypto.randomUUID();
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  public bootstrap(signal?: AbortSignal): Promise<GameBootstrapResponse> {
    return this.request<GameBootstrapResponse>("/game/state", { method: "GET", signal });
  }

  public send(command: GameCommand, expectedRevision: number, signal?: AbortSignal): Promise<GameCommandResponse> {
    const envelope = createCommandEnvelope(command, expectedRevision, this.clientInstanceId);
    return this.request<GameCommandResponse>("/game/commands", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(envelope),
      signal,
    });
  }

  private async request<T extends { protocolVersion: number }>(path: string, init: RequestInit): Promise<T> {
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        ...init,
        credentials: "include",
        headers: { accept: "application/json", ...init.headers },
      });
    } catch {
      throw new GameApiError(0, { errorContractVersion: ERROR_CONTRACT_VERSION, code: "UNAVAILABLE", message: "Der Spielserver ist momentan nicht erreichbar." });
    }

    const body = await response.json().catch(() => null) as T | ApiProblem | null;
    if (!response.ok) {
      const problem = body && "code" in body
        ? body as ApiProblem
        : { errorContractVersion: ERROR_CONTRACT_VERSION, code: "UNKNOWN" as const, message: `Serveranfrage fehlgeschlagen (${response.status}).` };
      if (problem.errorContractVersion !== ERROR_CONTRACT_VERSION) {
        throw new GameApiError(response.status, { errorContractVersion: ERROR_CONTRACT_VERSION, code: "UNKNOWN", message: "Frontend und Server verwenden unterschiedliche Fehlerverträge." });
      }
      throw new GameApiError(response.status, problem);
    }
    if (!body || !("protocolVersion" in body) || body.protocolVersion !== API_PROTOCOL_VERSION) {
      throw new GameApiError(response.status, { errorContractVersion: ERROR_CONTRACT_VERSION, code: "UNKNOWN", message: "Frontend und Server verwenden unterschiedliche Protokollversionen." });
    }
    if (!("contentContractVersion" in body) || body.contentContractVersion !== CONTENT_CONTRACT_VERSION) {
      throw new GameApiError(response.status, { errorContractVersion: ERROR_CONTRACT_VERSION, code: "UNKNOWN", message: "Frontend und Server verwenden unterschiedliche Content-Verträge." });
    }
    return body as T;
  }
}
