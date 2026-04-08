import type {
  JerryRequestConfig,
  JerryResponseMode,
  ResolvedJerryRequestConfig,
} from "../types";
import { createBadConfigError } from "./JerryError";
import { defaultValidateStatus } from "./defaults";
import { getDefaultAdapter } from "../adapters";
import { mergeHeaders, normalizeHeaders } from "../utils/headers";
import { normalizeMethod } from "../utils/http";
import { isPlainObject } from "../utils/isPlainObject";

function mergeParams(
  base?: JerryRequestConfig["params"],
  override?: JerryRequestConfig["params"],
): JerryRequestConfig["params"] {
  if (!base) {
    return override;
  }

  if (!override) {
    return base;
  }

  if (base instanceof URLSearchParams || override instanceof URLSearchParams) {
    return override;
  }

  if (isPlainObject(base) && isPlainObject(override)) {
    return { ...base, ...override };
  }

  return override;
}

export function mergeConfig<
  D = unknown,
  M extends JerryResponseMode = JerryResponseMode,
>(
  defaults: JerryRequestConfig = {},
  config: JerryRequestConfig<D, M> = {} as JerryRequestConfig<D, M>,
): JerryRequestConfig<D, M> {
  return {
    ...defaults,
    ...config,
    headers: mergeHeaders(defaults.headers, config.headers),
    params: mergeParams(defaults.params, config.params),
    fetch: config.fetch ?? defaults.fetch,
    adapter: config.adapter ?? defaults.adapter,
    validateStatus: config.validateStatus ?? defaults.validateStatus,
    paramsSerializer: config.paramsSerializer ?? defaults.paramsSerializer,
    responseType: config.responseType ?? defaults.responseType,
    responseMode: (config.responseMode ?? defaults.responseMode) as M,
    timeout: config.timeout ?? defaults.timeout,
    signal: config.signal ?? defaults.signal,
  } as JerryRequestConfig<D, M>;
}

export function resolveRequestConfig<
  D = unknown,
  M extends JerryResponseMode = "response",
>(
  config: JerryRequestConfig<D, M>,
): ResolvedJerryRequestConfig<D, M> {
  if (!config.url) {
    throw createBadConfigError("Request URL is required", config);
  }

  const timeout = config.timeout ?? 0;

  if (!Number.isFinite(timeout) || timeout < 0) {
    throw createBadConfigError("Timeout must be a non-negative finite number", config);
  }

  return {
    ...config,
    url: config.url,
    method: normalizeMethod(config.method),
    headers: normalizeHeaders(config.headers),
    timeout,
    responseType: config.responseType ?? "auto",
    responseMode: (config.responseMode ?? "response") as M,
    validateStatus: config.validateStatus ?? defaultValidateStatus,
    adapter: config.adapter ?? getDefaultAdapter(),
  };
}
