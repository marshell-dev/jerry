export type JerryMethod =
  | "get"
  | "post"
  | "put"
  | "patch"
  | "delete"
  | "head"
  | "options"
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

export type JerryResponseType = "auto" | "json" | "text" | "blob" | "arrayBuffer";
export type JerryResponseMode = "response" | "data";

export type JerryHeaderValue = string | number | boolean | null | undefined;
export type JerryHeaders = Record<string, JerryHeaderValue>;

export type JerryParamPrimitive = string | number | boolean | bigint | Date | null | undefined;
export type JerryParamValue =
  | JerryParamPrimitive
  | JerryParamPrimitive[]
  | Record<string, unknown>;
export type JerryParams = Record<string, JerryParamValue>;

export type JerryParamsSerializer = (params: JerryParams | URLSearchParams) => string;
export type JerryValidateStatus = (status: number) => boolean;
export type ResolveResponseMode<
  DefaultMode extends JerryResponseMode,
  RequestMode extends JerryResponseMode = DefaultMode,
> = RequestMode;

export interface JerryRequestConfig<
  D = unknown,
  M extends JerryResponseMode = JerryResponseMode,
> {
  url?: string;
  method?: JerryMethod;
  baseURL?: string;
  headers?: JerryHeaders;
  params?: JerryParams | URLSearchParams;
  paramsSerializer?: JerryParamsSerializer;
  data?: D;
  timeout?: number;
  signal?: AbortSignal | null;
  responseType?: JerryResponseType;
  responseMode?: M;
  validateStatus?: JerryValidateStatus;
  adapter?: JerryAdapter;
  fetch?: typeof fetch;
}

export interface ResolvedJerryRequestConfig<
  D = unknown,
  M extends JerryResponseMode = "response",
> extends JerryRequestConfig<D, M> {
  url: string;
  method: Uppercase<JerryMethod>;
  headers: JerryHeaders;
  timeout: number;
  responseType: JerryResponseType;
  responseMode: M;
  validateStatus: JerryValidateStatus;
  adapter: JerryAdapter;
}

export interface JerryResponse<
  T = unknown,
  D = unknown,
  M extends JerryResponseMode = JerryResponseMode,
> {
  data: T;
  status: number;
  statusText: string;
  headers: JerryHeaders;
  config: ResolvedJerryRequestConfig<D, M>;
  request?: unknown;
  raw?: Response;
}

export type JerryResult<
  T,
  M extends JerryResponseMode = "response",
  D = unknown,
> = M extends "data" ? T : JerryResponse<T, D, M>;

export type JerryErrorKind =
  | "network"
  | "timeout"
  | "abort"
  | "http"
  | "parse"
  | "config"
  | "adapter"
  | "unknown";

export type JerryErrorCode =
  | "ERR_NETWORK"
  | "ERR_TIMEOUT"
  | "ERR_ABORTED"
  | "ERR_BAD_STATUS"
  | "ERR_PARSE"
  | "ERR_BAD_CONFIG"
  | "ERR_ADAPTER"
  | "ERR_UNKNOWN";

export type JerryKnownConfig<D = unknown> =
  | JerryRequestConfig<D, JerryResponseMode>
  | ResolvedJerryRequestConfig<D, JerryResponseMode>;

export type JerryDataRequestConfig<D = unknown> =
  JerryRequestConfig<D, "data"> & { responseMode: "data" };

export type JerryResponseRequestConfig<D = unknown> =
  JerryRequestConfig<D, "response"> & { responseMode: "response" };

export interface JerryInterceptorHandler<V> {
  onFulfilled?: JerryFulfilled<V>;
  onRejected?: JerryRejected;
}

export type JerryFulfilled<V> = (value: V) => V | Promise<V>;
export type JerryRejected = (error: unknown) => unknown;

export interface JerryInterceptorManager<V> {
  use(onFulfilled?: JerryFulfilled<V>, onRejected?: JerryRejected): number;
  eject(id: number): void;
  clear(): void;
  forEach(iterator: (handler: JerryInterceptorHandler<V>) => void): void;
}

export interface JerryInterceptors {
  request: JerryInterceptorManager<ResolvedJerryRequestConfig>;
  response: JerryInterceptorManager<JerryResponse<unknown, unknown, JerryResponseMode>>;
}

export type JerryAdapter = <
  T = unknown,
  D = unknown,
  M extends JerryResponseMode = JerryResponseMode,
>(
  config: ResolvedJerryRequestConfig<D, M>,
) => Promise<JerryResponse<T, D, M>>;

export interface JerryCallable<DefaultMode extends JerryResponseMode = "response"> {
  <T = unknown, D = unknown>(config: JerryDataRequestConfig<D>): Promise<T>;
  <T = unknown, D = unknown>(
    config: JerryResponseRequestConfig<D>,
  ): Promise<JerryResponse<T, D, "response">>;
  <T = unknown, D = unknown>(
    config: JerryRequestConfig<D, DefaultMode>,
  ): Promise<JerryResult<T, DefaultMode, D>>;
  <T = unknown, D = unknown>(url: string, config: JerryDataRequestConfig<D>): Promise<T>;
  <T = unknown, D = unknown>(
    url: string,
    config: JerryResponseRequestConfig<D>,
  ): Promise<JerryResponse<T, D, "response">>;
  <T = unknown, D = unknown>(
    url: string,
    config?: JerryRequestConfig<D, DefaultMode>,
  ): Promise<JerryResult<T, DefaultMode, D>>;
}

export interface JerryInstance<
  DefaultMode extends JerryResponseMode = "response",
> extends JerryCallable<DefaultMode> {
  defaults: JerryRequestConfig<unknown, DefaultMode>;
  interceptors: JerryInterceptors;

  create(): JerryInstance<DefaultMode>;
  create(defaultConfig: JerryRequestConfig): JerryInstance<DefaultMode>;
  create<M extends JerryResponseMode>(
    defaultConfig: JerryRequestConfig<unknown, M> & { responseMode: M },
  ): JerryInstance<M>;

  request<T = unknown, D = unknown>(config: JerryDataRequestConfig<D>): Promise<T>;
  request<T = unknown, D = unknown>(
    config: JerryResponseRequestConfig<D>,
  ): Promise<JerryResponse<T, D, "response">>;
  request<T = unknown, D = unknown>(
    config: JerryRequestConfig<D, DefaultMode>,
  ): Promise<JerryResult<T, DefaultMode, D>>;
  request<T = unknown, D = unknown>(url: string, config: JerryDataRequestConfig<D>): Promise<T>;
  request<T = unknown, D = unknown>(
    url: string,
    config: JerryResponseRequestConfig<D>,
  ): Promise<JerryResponse<T, D, "response">>;
  request<T = unknown, D = unknown>(
    url: string,
    config?: JerryRequestConfig<D, DefaultMode>,
  ): Promise<JerryResult<T, DefaultMode, D>>;

  get<T = unknown, D = unknown>(url: string, config: JerryDataRequestConfig<D>): Promise<T>;
  get<T = unknown, D = unknown>(
    url: string,
    config: JerryResponseRequestConfig<D>,
  ): Promise<JerryResponse<T, D, "response">>;
  get<T = unknown, D = unknown>(
    url: string,
    config?: JerryRequestConfig<D, DefaultMode>,
  ): Promise<JerryResult<T, DefaultMode, D>>;

  delete<T = unknown, D = unknown>(url: string, config: JerryDataRequestConfig<D>): Promise<T>;
  delete<T = unknown, D = unknown>(
    url: string,
    config: JerryResponseRequestConfig<D>,
  ): Promise<JerryResponse<T, D, "response">>;
  delete<T = unknown, D = unknown>(
    url: string,
    config?: JerryRequestConfig<D, DefaultMode>,
  ): Promise<JerryResult<T, DefaultMode, D>>;

  head<T = unknown, D = unknown>(url: string, config: JerryDataRequestConfig<D>): Promise<T>;
  head<T = unknown, D = unknown>(
    url: string,
    config: JerryResponseRequestConfig<D>,
  ): Promise<JerryResponse<T, D, "response">>;
  head<T = unknown, D = unknown>(
    url: string,
    config?: JerryRequestConfig<D, DefaultMode>,
  ): Promise<JerryResult<T, DefaultMode, D>>;

  options<T = unknown, D = unknown>(url: string, config: JerryDataRequestConfig<D>): Promise<T>;
  options<T = unknown, D = unknown>(
    url: string,
    config: JerryResponseRequestConfig<D>,
  ): Promise<JerryResponse<T, D, "response">>;
  options<T = unknown, D = unknown>(
    url: string,
    config?: JerryRequestConfig<D, DefaultMode>,
  ): Promise<JerryResult<T, DefaultMode, D>>;

  post<T = unknown, D = unknown>(url: string, data: D, config: JerryDataRequestConfig<D>): Promise<T>;
  post<T = unknown, D = unknown>(
    url: string,
    data: D,
    config: JerryResponseRequestConfig<D>,
  ): Promise<JerryResponse<T, D, "response">>;
  post<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: JerryRequestConfig<D, DefaultMode>,
  ): Promise<JerryResult<T, DefaultMode, D>>;

  put<T = unknown, D = unknown>(url: string, data: D, config: JerryDataRequestConfig<D>): Promise<T>;
  put<T = unknown, D = unknown>(
    url: string,
    data: D,
    config: JerryResponseRequestConfig<D>,
  ): Promise<JerryResponse<T, D, "response">>;
  put<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: JerryRequestConfig<D, DefaultMode>,
  ): Promise<JerryResult<T, DefaultMode, D>>;

  patch<T = unknown, D = unknown>(url: string, data: D, config: JerryDataRequestConfig<D>): Promise<T>;
  patch<T = unknown, D = unknown>(
    url: string,
    data: D,
    config: JerryResponseRequestConfig<D>,
  ): Promise<JerryResponse<T, D, "response">>;
  patch<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: JerryRequestConfig<D, DefaultMode>,
  ): Promise<JerryResult<T, DefaultMode, D>>;
}

export interface JerryStatic extends JerryInstance<"response"> {
  JerryError: typeof import("../core/JerryError").JerryError;
  isJerryError(value: unknown): value is import("../core/JerryError").JerryError;
}
