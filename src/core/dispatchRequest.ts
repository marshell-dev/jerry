import type { JerryResponse, JerryResponseMode, ResolvedJerryRequestConfig } from "../types";
import { buildURL } from "../utils/buildURL";
import { combineURLs, isAbsoluteURL, normalizeMethod } from "../utils/http";
import { createBadConfigError, createStatusError } from "./JerryError";
import { normalizeHeaders } from "../utils/headers";

function buildResolvedURL<
  D = unknown,
  M extends JerryResponseMode = JerryResponseMode,
>(config: ResolvedJerryRequestConfig<D, M>): string {
  const requestURL = config.baseURL && !isAbsoluteURL(config.url)
    ? combineURLs(config.baseURL, config.url)
    : config.url;

  return buildURL(requestURL, config.params, config.paramsSerializer);
}

function finalizeRequestConfig<
  D = unknown,
  M extends JerryResponseMode = JerryResponseMode,
>(
  config: ResolvedJerryRequestConfig<D, M>,
): ResolvedJerryRequestConfig<D, M> {
  if (!config.url) {
    throw createBadConfigError("Request URL is required", config);
  }

  return {
    ...config,
    url: buildResolvedURL(config),
    method: normalizeMethod(config.method),
    headers: normalizeHeaders(config.headers),
  };
}

export async function dispatchRequest<
  T = unknown,
  D = unknown,
  M extends JerryResponseMode = JerryResponseMode,
>(
  config: ResolvedJerryRequestConfig<D, M>,
): Promise<JerryResponse<T, D, M>> {
  const finalizedConfig = finalizeRequestConfig(config);
  const response = await finalizedConfig.adapter<T, D, M>(finalizedConfig);

  if (!finalizedConfig.validateStatus(response.status)) {
    throw createStatusError(response);
  }

  return response;
}
