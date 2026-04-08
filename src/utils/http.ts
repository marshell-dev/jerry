import type { JerryMethod } from "../types";

export function normalizeMethod(method?: JerryMethod): Uppercase<JerryMethod> {
  return (method ?? "GET").toUpperCase() as Uppercase<JerryMethod>;
}

export function isAbsoluteURL(url: string): boolean {
  return /^[a-z][a-z\d+\-.]*:\/\//i.test(url) || /^\/\//.test(url);
}

export function combineURLs(baseURL: string, relativeURL: string): string {
  return `${baseURL.replace(/\/+$/, "")}/${relativeURL.replace(/^\/+/, "")}`;
}

