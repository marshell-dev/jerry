import type { JerryResponseType } from "../types";

const JSON_CONTENT_TYPE_RE = /(^|\+|\/)json($|;)/i;

function isBodylessResponse(method: string, status: number): boolean {
  return method === "HEAD" || status === 204 || status === 205 || status === 304;
}

export async function parseResponseData(
  response: Response,
  responseType: JerryResponseType,
  method: string,
): Promise<unknown> {
  if (isBodylessResponse(method, response.status)) {
    return undefined;
  }

  if (responseType === "arrayBuffer") {
    return response.arrayBuffer();
  }

  if (responseType === "blob") {
    return response.blob();
  }

  const text = await response.text();

  if (responseType === "text") {
    return text;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const shouldParseJson =
    responseType === "json" || (responseType === "auto" && JSON_CONTENT_TYPE_RE.test(contentType));

  if (!shouldParseJson) {
    return text;
  }

  if (text.trim() === "") {
    return undefined;
  }

  return JSON.parse(text);
}

