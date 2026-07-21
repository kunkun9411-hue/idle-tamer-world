import { argon2, createHash, randomBytes, timingSafeEqual } from "node:crypto";

const ARGON_MEMORY_KIB = 65_536;
const ARGON_PASSES = 3;
const ARGON_PARALLELISM = 1;
const ARGON_TAG_LENGTH = 32;
const ARGON_VERSION = 19;

const commonPasswords = new Set([
  "123456789012345",
  "passwordpassword",
  "passwortpasswort",
  "qwertyqwertyqwerty",
  "idle-tamer-world",
]);

const base64 = (value: Uint8Array): string => Buffer.from(value).toString("base64").replace(/=+$/u, "");
const fromBase64 = (value: string): Buffer => Buffer.from(value, "base64");

const deriveArgon2id = async (password: string, salt: Buffer): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    argon2("argon2id", {
      message: Buffer.from(password, "utf8"),
      nonce: salt,
      parallelism: ARGON_PARALLELISM,
      memory: ARGON_MEMORY_KIB,
      passes: ARGON_PASSES,
      tagLength: ARGON_TAG_LENGTH,
    }, (error, derivedKey) => error ? reject(error) : resolve(Buffer.from(derivedKey)));
  });

export const normalizePassword = (password: string): string => password.normalize("NFC");

export const passwordPolicyError = (password: string): string | null => {
  const normalized = normalizePassword(password);
  const length = Array.from(normalized).length;
  if (length < 15) return "Das Passwort muss mindestens 15 Zeichen lang sein.";
  if (length > 128) return "Das Passwort darf höchstens 128 Zeichen lang sein.";
  if (commonPasswords.has(normalized.toLocaleLowerCase("und"))) return "Dieses Passwort ist zu häufig oder leicht zu erraten.";
  return null;
};

export const hashPassword = async (password: string): Promise<string> => {
  const normalized = normalizePassword(password);
  const salt = randomBytes(16);
  const digest = await deriveArgon2id(normalized, salt);
  return `$argon2id$v=${ARGON_VERSION}$m=${ARGON_MEMORY_KIB},t=${ARGON_PASSES},p=${ARGON_PARALLELISM}$${base64(salt)}$${base64(digest)}`;
};

export const verifyPassword = async (password: string, phc: string): Promise<boolean> => {
  const match = /^\$argon2id\$v=19\$m=65536,t=3,p=1\$([A-Za-z0-9+/]+)\$([A-Za-z0-9+/]+)$/u.exec(phc);
  if (!match) return false;
  const expected = fromBase64(match[2]);
  const actual = await deriveArgon2id(normalizePassword(password), fromBase64(match[1]));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
};

export const randomOpaqueToken = (): string => randomBytes(32).toString("base64url");
export const sha256 = (value: string): Buffer => createHash("sha256").update(value, "utf8").digest();

export const normalizeEmail = (value: string): string | null => {
  const normalized = value.trim().normalize("NFC").toLocaleLowerCase("und");
  if (normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(normalized)) return null;
  return normalized;
};

const disallowedDisplayName = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/u;
const allowedDisplayName = /^[\p{L}\p{N}_-]+(?: [\p{L}\p{N}_-]+)*$/u;

export interface NormalizedDisplayName {
  display: string;
  normalized: string;
}

export const normalizeDisplayName = (value: string): NormalizedDisplayName | null => {
  const display = value.normalize("NFC").trim().replace(/\s+/gu, " ");
  const graphemeCount = Array.from(new Intl.Segmenter("de", { granularity: "grapheme" }).segment(display)).length;
  if (graphemeCount < 3 || graphemeCount > 20 || disallowedDisplayName.test(display) || !allowedDisplayName.test(display)) return null;
  return { display, normalized: display.toLocaleLowerCase("und") };
};

export const maskEmail = (email: string): string => {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  return `${local.slice(0, 1)}${"*".repeat(Math.min(5, Math.max(2, local.length - 1)))}@${domain}`;
};

export const summarizeDevice = (userAgent: string | undefined): { deviceName: string; userAgentSummary: string } => {
  const source = userAgent ?? "Unbekannter Browser";
  const browser = /Firefox\//u.test(source) ? "Firefox" : /Edg\//u.test(source) ? "Edge" : /Chrome\//u.test(source) ? "Chrome" : /Safari\//u.test(source) ? "Safari" : "Browser";
  const system = /Windows/u.test(source) ? "Windows" : /Android/u.test(source) ? "Android" : /iPhone|iPad/u.test(source) ? "iOS" : /Mac OS/u.test(source) ? "macOS" : /Linux/u.test(source) ? "Linux" : "unbekanntes System";
  return { deviceName: `${browser} auf ${system}`, userAgentSummary: `${browser}; ${system}`.slice(0, 160) };
};
