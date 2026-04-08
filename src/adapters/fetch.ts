import type {
  JerryAdapter,
  JerryHeaders,
  JerryResponseMode,
  ResolvedJerryRequestConfig,
} from "../types";
import {
  createAbortError,
  createAdapterError,
  createNetworkError,
  createParseError,
  createTimeoutError,
  isJerryError,
} from "../core/JerryError";
import { prepareRequestBody } from "../utils/body";
import { headersFromResponse } from "../utils/headers";
import { parseResponseData } from "../utils/response";

type FetchRuntime = "browser" | "node";

interface AbortState {
  signal: AbortSignal | null;
  cleanup: () => void;
  timedOut: () => boolean;
  aborted: () => boolean;
}

function createAbortState(config: ResolvedJerryRequestConfig<unknown, JerryResponseMode>): AbortState {
  const externalSignal = config.signal ?? null;
  const timeout = config.timeout;

  if (!externalSignal && timeout === 0) {
    return {
      signal: null,
      cleanup: () => undefined,
      timedOut: () => false,
      aborted: () => false,
    };
  }

  const controller = new AbortController();
  let timedOut = false;
  let aborted = false;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const abortFromExternalSignal = (): void => {
    aborted = true;
    controller.abort(externalSignal?.reason);
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      abortFromExternalSignal();
    } else {
      externalSignal.addEventListener("abort", abortFromExternalSignal, { once: true });
    }
  }

  if (timeout > 0) {
    timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort(new Error(`Timed out after ${timeout}ms`));
    }, timeout);
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      externalSignal?.removeEventListener("abort", abortFromExternalSignal);
    },
    timedOut: () => timedOut,
    aborted: () => aborted || Boolean(externalSignal?.aborted),
  };
}

function resolveFetchImplementation(
  config: ResolvedJerryRequestConfig<unknown, JerryResponseMode>,
): typeof fetch {
  if (config.fetch) {
    return config.fetch;
  }

  if (typeof fetch === "function") {
    return fetch;
  }

  throw createAdapterError("No fetch implementation is available for the selected adapter", config);
}

function buildRequestMeta(url: string, method: string, headers: JerryHeaders): unknown {
  return {
    url,
    method,
    headers: { ...headers },
  };
}

function toFetchHeaders(headers: JerryHeaders): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [name, value] of Object.entries(headers)) {
    if (value === null || typeof value === "undefined") {
      continue;
    }

    result[name] = String(value);
  }

  return result;
}

function isAbortLikeError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "name" in error &&
      (error as { name?: string }).name === "AbortError",
  );
}

export function createFetchAdapter(runtime: FetchRuntime): JerryAdapter {
  return async <
    T = unknown,
    D = unknown,
    M extends JerryResponseMode = JerryResponseMode,
  >(
    config: ResolvedJerryRequestConfig<D, M>,
  ) => {
    const fetchImpl = resolveFetchImplementation(config);
    const headers = { ...config.headers };
    const body = prepareRequestBody(config.data, headers, config.method);
    const requestHeaders = toFetchHeaders(headers);
    const abortState = createAbortState(config);
    const request = buildRequestMeta(config.url, config.method, requestHeaders);

    try {
      const rawResponse = await fetchImpl(config.url, {
        body,
        headers: requestHeaders,
        method: config.method,
        signal: abortState.signal,
      });

      let data: unknown;

      try {
        data = await parseResponseData(rawResponse, config.responseType, config.method);
      } catch (error) {
        throw createParseError("Failed to parse response body", {
          cause: error,
          config,
          request,
        });
      }

      return {
        config,
        data: data as T,
        headers: headersFromResponse(rawResponse.headers),
        raw: rawResponse,
        request,
        status: rawResponse.status,
        statusText: rawResponse.statusText,
      };
    } catch (error) {
      if (isJerryError(error)) {
        throw error;
      }

      if (abortState.timedOut()) {
        throw createTimeoutError(config.timeout, {
          cause: error,
          config,
          request,
        });
      }

      if (abortState.aborted() || isAbortLikeError(error)) {
        throw createAbortError("Request was aborted", {
          cause: error,
          config,
          request,
        });
      }

      throw createNetworkError(
        `Network request failed in ${runtime} adapter`,
        {
          cause: error,
          config,
          request,
        },
      );
    } finally {
      abortState.cleanup();
    }
  };
}
