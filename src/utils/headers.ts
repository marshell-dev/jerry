import type { JerryHeaderValue, JerryHeaders } from "../types";

export function normalizeHeaderName(name: string): string {
  return name.trim().toLowerCase();
}

export function normalizeHeaders(headers?: JerryHeaders): JerryHeaders {
  const normalized: JerryHeaders = {};

  if (!headers) {
    return normalized;
  }

  for (const [name, value] of Object.entries(headers)) {
    if (typeof value === "undefined") {
      continue;
    }

    normalized[normalizeHeaderName(name)] = value;
  }

  return normalized;
}

export function mergeHeaders(...headerSets: Array<JerryHeaders | undefined>): JerryHeaders {
  const merged: JerryHeaders = {};

  for (const headerSet of headerSets) {
    const normalized = normalizeHeaders(headerSet);

    for (const [name, value] of Object.entries(normalized)) {
      merged[name] = value;
    }
  }

  return merged;
}

export function setHeaderIfMissing(
  headers: JerryHeaders,
  name: string,
  value: JerryHeaderValue,
): void {
  const normalizedName = normalizeHeaderName(name);

  if (typeof headers[normalizedName] === "undefined") {
    headers[normalizedName] = value;
  }
}

export function headersFromResponse(headers: Headers): JerryHeaders {
  const result: JerryHeaders = {};

  headers.forEach((value, name) => {
    result[normalizeHeaderName(name)] = value;
  });

  return result;
}

