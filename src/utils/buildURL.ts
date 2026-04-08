import type { JerryParams, JerryParamsSerializer, JerryParamValue } from "../types";

function encode(value: string): string {
  return encodeURIComponent(value).replace(/%20/g, "+");
}

function appendValue(parts: string[], key: string, value: JerryParamValue): void {
  if (value === null || typeof value === "undefined") {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      appendValue(parts, key, item);
    }

    return;
  }

  let serialized: string;

  if (value instanceof Date) {
    serialized = value.toISOString();
  } else if (typeof value === "object") {
    serialized = JSON.stringify(value);
  } else {
    serialized = String(value);
  }

  parts.push(`${encode(key)}=${encode(serialized)}`);
}

export function defaultParamsSerializer(params: JerryParams | URLSearchParams): string {
  if (params instanceof URLSearchParams) {
    return params.toString();
  }

  const parts: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    appendValue(parts, key, value);
  }

  return parts.join("&");
}

export function buildURL(
  url: string,
  params?: JerryParams | URLSearchParams,
  paramsSerializer?: JerryParamsSerializer,
): string {
  if (!params) {
    return url;
  }

  const serialized = (paramsSerializer ?? defaultParamsSerializer)(params);

  if (!serialized) {
    return url;
  }

  const hashIndex = url.indexOf("#");
  const target = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
  const separator = target.includes("?") ? "&" : "?";

  return `${target}${separator}${serialized}`;
}

