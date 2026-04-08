import type {
  JerryErrorCode,
  JerryErrorKind,
  JerryKnownConfig,
  JerryResponse,
} from "../types";

export interface JerryErrorOptions<T = unknown, D = unknown> {
  code: JerryErrorCode;
  kind: JerryErrorKind;
  config?: JerryKnownConfig<D>;
  request?: unknown;
  response?: JerryResponse<T, D>;
  cause?: unknown;
}

export class JerryError<T = unknown, D = unknown> extends Error {
  public readonly code: JerryErrorCode;
  public readonly kind: JerryErrorKind;
  public readonly config?: JerryKnownConfig<D>;
  public readonly request?: unknown;
  public readonly response?: JerryResponse<T, D>;
  public readonly status?: number;
  public readonly cause?: unknown;
  public readonly isJerryError = true;

  public constructor(message: string, options: JerryErrorOptions<T, D>) {
    super(message);
    this.name = "JerryError";
    this.code = options.code;
    this.kind = options.kind;
    this.config = options.config;
    this.request = options.request;
    this.response = options.response;
    this.status = options.response?.status;
    this.cause = options.cause;
  }

  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      kind: this.kind,
      status: this.status,
      isJerryError: this.isJerryError,
    };
  }
}

export function isJerryError(value: unknown): value is JerryError {
  return value instanceof JerryError || isJerryErrorLike(value);
}

function isJerryErrorLike(value: unknown): value is JerryError {
  return Boolean(
    value &&
      typeof value === "object" &&
      "isJerryError" in value &&
      (value as { isJerryError?: boolean }).isJerryError === true,
  );
}

export function createBadConfigError(message: string, config?: JerryKnownConfig): JerryError {
  return new JerryError(message, {
    code: "ERR_BAD_CONFIG",
    kind: "config",
    config,
  });
}

export function createAdapterError(message: string, config?: JerryKnownConfig): JerryError {
  return new JerryError(message, {
    code: "ERR_ADAPTER",
    kind: "adapter",
    config,
  });
}

export function createNetworkError(
  message: string,
  options: Omit<JerryErrorOptions, "code" | "kind"> = {},
): JerryError {
  return new JerryError(message, {
    ...options,
    code: "ERR_NETWORK",
    kind: "network",
  });
}

export function createTimeoutError(
  timeout: number,
  options: Omit<JerryErrorOptions, "code" | "kind"> = {},
): JerryError {
  return new JerryError(`Request timed out after ${timeout}ms`, {
    ...options,
    code: "ERR_TIMEOUT",
    kind: "timeout",
  });
}

export function createAbortError(
  message: string,
  options: Omit<JerryErrorOptions, "code" | "kind"> = {},
): JerryError {
  return new JerryError(message, {
    ...options,
    code: "ERR_ABORTED",
    kind: "abort",
  });
}

export function createStatusError<T = unknown, D = unknown>(
  response: JerryResponse<T, D>,
): JerryError<T, D> {
  return new JerryError(
    `Request failed with status code ${response.status}`,
    {
      code: "ERR_BAD_STATUS",
      kind: "http",
      config: response.config,
      request: response.request,
      response,
    },
  );
}

export function createParseError(
  message: string,
  options: Omit<JerryErrorOptions, "code" | "kind"> = {},
): JerryError {
  return new JerryError(message, {
    ...options,
    code: "ERR_PARSE",
    kind: "parse",
  });
}

