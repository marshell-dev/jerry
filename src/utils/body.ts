import type { JerryHeaders } from "../types";
import { setHeaderIfMissing } from "./headers";
import { isPlainObject } from "./isPlainObject";

function isURLSearchParams(value: unknown): value is URLSearchParams {
  return typeof URLSearchParams !== "undefined" && value instanceof URLSearchParams;
}

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

function isBlob(value: unknown): value is Blob {
  return typeof Blob !== "undefined" && value instanceof Blob;
}

function isArrayBuffer(value: unknown): value is ArrayBuffer {
  return typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer;
}

function isArrayBufferView(value: unknown): value is ArrayBufferView {
  return typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView(value);
}

function isReadableStream(value: unknown): value is ReadableStream {
  return typeof ReadableStream !== "undefined" && value instanceof ReadableStream;
}

export function prepareRequestBody(
  data: unknown,
  headers: JerryHeaders,
  method: string,
): BodyInit | null | undefined {
  if (typeof data === "undefined") {
    return undefined;
  }

  if (method === "GET" || method === "HEAD") {
    return undefined;
  }

  if (data === null) {
    return null;
  }

  if (
    typeof data === "string" ||
    isBlob(data) ||
    isFormData(data) ||
    isURLSearchParams(data) ||
    isArrayBuffer(data) ||
    isArrayBufferView(data) ||
    isReadableStream(data)
  ) {
    if (isURLSearchParams(data)) {
      setHeaderIfMissing(headers, "content-type", "application/x-www-form-urlencoded;charset=UTF-8");
    }

    return data as BodyInit;
  }

  if (isPlainObject(data) || Array.isArray(data)) {
    setHeaderIfMissing(headers, "content-type", "application/json");
    return JSON.stringify(data);
  }

  return data as BodyInit;
}

