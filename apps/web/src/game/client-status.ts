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
  local: { state: "local", title: "Auf diesem Gerät gesichert", message: "Dein Fortschritt wird sicher in diesem Browser gespeichert.", action: "none" },
  loading: { state: "loading", title: "Spielstand wird synchronisiert", message: "Dein aktueller Fortschritt wird sicher geladen.", action: "none" },
  online: { state: "online", title: "Online synchronisiert", message: "Dein Fortschritt ist sicher mit deinem Konto synchronisiert.", action: "none" },
  offline: { state: "offline", title: "Verbindung unterbrochen", message: "Stelle die Verbindung wieder her und versuche es gleich noch einmal.", action: "retry" },
  conflict: { state: "conflict", title: "Neuerer Spielstand gefunden", message: "Ein anderer Tab oder ein anderes Gerät hat bereits gespeichert. Lade den neuesten Spielstand, bevor du weiterspielst.", action: "reload" },
  error: { state: "error", title: "Spielstand nicht verfügbar", message: "Der Vorgang wurde nicht übernommen. Dein zuletzt gespeicherter Fortschritt bleibt erhalten.", action: "retry" },
};

export const clientStatusCopy = (state: ClientUiState): ClientStatusCopy => ({ ...CLIENT_STATUS_COPY[state], state });
