import type { ApiProblem } from "./api-contract";
import type { ServiceConnectionState } from "./game-service-port";

export type ClientUiState = "local" | "loading" | "online" | "offline" | "conflict" | "error";

export interface ClientStatusCopy {
  state: ClientUiState;
  title: string;
  message: string;
  action: "none" | "retry" | "reload";
}

export const clientStatusFromConnection = (connection: ServiceConnectionState, mode: "local" | "remote"): ClientUiState => {
  if (mode === "local") return "local";
  if (connection === "loading" || connection === "idle") return "loading";
  if (connection === "ready") return "online";
  return connection;
};

export const clientStatusFromProblem = (problem: ApiProblem): ClientUiState => {
  if (problem.code === "CONFLICT") return "conflict";
  if (problem.code === "UNAVAILABLE") return "offline";
  return "error";
};

const CLIENT_STATUS_COPY: Record<ClientUiState, ClientStatusCopy> = {
  local: { state: "local", title: "Lokal gesichert", message: "Der Prototyp speichert in diesem Browser. Der HTTP-Wechselvertrag ist vorbereitet.", action: "none" },
  loading: { state: "loading", title: "Spielstand wird synchronisiert", message: "Session, Content-Version und autoritativer Spielstand werden geprüft.", action: "none" },
  online: { state: "online", title: "Online synchronisiert", message: "Die angezeigte Revision wurde vom Spielserver bestätigt.", action: "none" },
  offline: { state: "offline", title: "Verbindung unterbrochen", message: "Es werden keine Online-Kommandos gesendet. Stelle die Verbindung wieder her und versuche es erneut.", action: "retry" },
  conflict: { state: "conflict", title: "Neuerer Spielstand gefunden", message: "Ein anderer Tab oder ein anderes Gerät hat bereits gespeichert. Lade die neueste Serverrevision, bevor du weiterspielst.", action: "reload" },
  error: { state: "error", title: "Spielstand nicht verfügbar", message: "Der Vorgang wurde nicht übernommen. Deine letzte bestätigte Revision bleibt unverändert.", action: "retry" },
};

export const clientStatusCopy = (state: ClientUiState): ClientStatusCopy => ({ ...CLIENT_STATUS_COPY[state], state });
