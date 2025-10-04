export interface ApiRequestContext {
  readonly method: string;
  readonly url: string;
  readonly payloadPreview: string | null;
}

export class ApiRequestError extends Error {
  readonly details: readonly string[];

  constructor(
    public readonly context: ApiRequestContext,
    public readonly status: number | null,
    public readonly statusText: string | null,
    message: string,
    details: readonly string[],
    cause: unknown,
  ) {
    super(message);
    this.name = 'ApiRequestError';
    this.details = Object.freeze([...details]);
    if (cause !== undefined) {
      (this as { cause?: unknown }).cause = cause;
    }
  }

  get userMessage(): string {
    return this.message;
  }
}
