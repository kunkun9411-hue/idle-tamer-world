import type { ApiProblem } from "@idle-tamer/contracts";

export class ApiError extends Error {
  public constructor(
    public readonly statusCode: number,
    public readonly code: ApiProblem["code"],
    message: string,
    public readonly latestRevision?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
