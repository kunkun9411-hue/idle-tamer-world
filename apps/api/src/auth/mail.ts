import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

export interface VerificationMail {
  recipient: string;
  displayName: string;
  verificationUrl: string;
  expiresAt: string;
}

export interface PasswordResetMail {
  recipient: string;
  displayName: string;
  resetUrl: string;
  expiresAt: string;
}

export interface AuthMailPort {
  sendVerification(message: VerificationMail): Promise<void>;
  sendPasswordReset(message: PasswordResetMail): Promise<void>;
}

export class FileAuthMailAdapter implements AuthMailPort {
  public constructor(private readonly outboxPath: string) {}

  public async sendVerification(message: VerificationMail): Promise<void> {
    await mkdir(dirname(this.outboxPath), { recursive: true });
    await appendFile(this.outboxPath, `${JSON.stringify({ kind: "verify_email", ...message })}\n`, { encoding: "utf8", mode: 0o600 });
  }

  public async sendPasswordReset(message: PasswordResetMail): Promise<void> {
    await mkdir(dirname(this.outboxPath), { recursive: true });
    await appendFile(this.outboxPath, `${JSON.stringify({ kind: "reset_password", ...message })}\n`, { encoding: "utf8", mode: 0o600 });
  }
}

export class MemoryAuthMailAdapter implements AuthMailPort {
  public readonly verificationMessages: VerificationMail[] = [];
  public readonly passwordResetMessages: PasswordResetMail[] = [];

  public async sendVerification(message: VerificationMail): Promise<void> {
    this.verificationMessages.push(message);
  }

  public async sendPasswordReset(message: PasswordResetMail): Promise<void> {
    this.passwordResetMessages.push(message);
  }
}
