import type { AuthApiProblem } from "@idle-tamer/contracts";

export class AuthError extends Error {
  public constructor(
    public readonly statusCode: number,
    public readonly code: AuthApiProblem["code"],
    public readonly reason: AuthApiProblem["reason"],
    message: string,
    public readonly options: {
      retryAfterSeconds?: number;
      latestRevision?: number;
      fieldErrors?: Record<string, string>;
    } = {},
  ) {
    super(message);
    this.name = "AuthError";
  }
}
