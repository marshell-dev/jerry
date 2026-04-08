import type {
  JerryInstance,
  JerryInterceptors,
  JerryRequestConfig,
  JerryResponse,
  JerryResponseMode,
  JerryResult,
  ResolvedJerryRequestConfig,
} from "../types";
import { InterceptorManager } from "../interceptors";
import { createDefaultConfig } from "./defaults";
import { dispatchRequest } from "./dispatchRequest";
import { mergeConfig, resolveRequestConfig } from "./mergeConfig";
import { createJerryInstance } from "./createInstance";

export class Jerry<DefaultMode extends JerryResponseMode = "response"> {
  public readonly defaults: JerryRequestConfig<unknown, DefaultMode>;
  public readonly interceptors: JerryInterceptors;

  public constructor(defaults?: JerryRequestConfig<unknown, DefaultMode>) {
    this.defaults = mergeConfig(
      createDefaultConfig<DefaultMode>() as unknown as JerryRequestConfig,
      defaults ?? {},
    ) as
      JerryRequestConfig<unknown, DefaultMode>;
    this.interceptors = {
      request: new InterceptorManager<ResolvedJerryRequestConfig>(),
      response: new InterceptorManager<JerryResponse>(),
    };
  }

  public create<M extends JerryResponseMode = DefaultMode>(
    defaultConfig?: JerryRequestConfig<unknown, M>,
  ): JerryInstance<M> {
    const mergedDefaults = mergeConfig(
      this.defaults as unknown as JerryRequestConfig,
      defaultConfig ?? ({} as JerryRequestConfig<unknown, M>),
    );
    return createJerryInstance<M>(mergedDefaults as JerryRequestConfig<unknown, M>);
  }

  public request<T = unknown, D = unknown, M extends JerryResponseMode = DefaultMode>(
    config: JerryRequestConfig<D, M>,
  ): Promise<JerryResult<T, M, D>>;
  public request<T = unknown, D = unknown, M extends JerryResponseMode = DefaultMode>(
    url: string,
    config?: JerryRequestConfig<D, M>,
  ): Promise<JerryResult<T, M, D>>;
  public async request<T = unknown, D = unknown, M extends JerryResponseMode = DefaultMode>(
    urlOrConfig: string | JerryRequestConfig<D, M>,
    config?: JerryRequestConfig<D, M>,
  ): Promise<JerryResult<T, M, D>> {
    const requestConfig = this.normalizeRequestArgs(urlOrConfig, config);
    const mergedConfig = mergeConfig(
      this.defaults as JerryRequestConfig,
      requestConfig,
    );
    const resolvedConfig = resolveRequestConfig(
      mergedConfig as JerryRequestConfig<D, M>,
    );

    let chain: Promise<ResolvedJerryRequestConfig> = Promise.resolve(
      resolvedConfig as ResolvedJerryRequestConfig,
    );

    this.interceptors.request.forEach((interceptor) => {
      chain = chain.then(interceptor.onFulfilled, interceptor.onRejected) as
        Promise<ResolvedJerryRequestConfig>;
    });

    let responseChain = chain.then((finalConfig) =>
      dispatchRequest<T, D, M>(
        finalConfig as ResolvedJerryRequestConfig<D, M>,
      ),
    );

    this.interceptors.response.forEach((interceptor) => {
      responseChain = responseChain.then(interceptor.onFulfilled, interceptor.onRejected) as
        Promise<JerryResponse<T, D, M>>;
    });

    const response = await responseChain;

    if (response.config.responseMode === "data") {
      return response.data as JerryResult<T, M, D>;
    }

    return response as JerryResult<T, M, D>;
  }

  public get<T = unknown, D = unknown, M extends JerryResponseMode = DefaultMode>(
    url: string,
    config?: JerryRequestConfig<D, M>,
  ): Promise<JerryResult<T, M, D>> {
    return this.request<T, D, M>(url, { ...(config ?? {}), method: "GET" } as
      JerryRequestConfig<D, M>);
  }

  public delete<T = unknown, D = unknown, M extends JerryResponseMode = DefaultMode>(
    url: string,
    config?: JerryRequestConfig<D, M>,
  ): Promise<JerryResult<T, M, D>> {
    return this.request<T, D, M>(url, { ...(config ?? {}), method: "DELETE" } as
      JerryRequestConfig<D, M>);
  }

  public head<T = unknown, D = unknown, M extends JerryResponseMode = DefaultMode>(
    url: string,
    config?: JerryRequestConfig<D, M>,
  ): Promise<JerryResult<T, M, D>> {
    return this.request<T, D, M>(url, { ...(config ?? {}), method: "HEAD" } as
      JerryRequestConfig<D, M>);
  }

  public options<T = unknown, D = unknown, M extends JerryResponseMode = DefaultMode>(
    url: string,
    config?: JerryRequestConfig<D, M>,
  ): Promise<JerryResult<T, M, D>> {
    return this.request<T, D, M>(url, { ...(config ?? {}), method: "OPTIONS" } as
      JerryRequestConfig<D, M>);
  }

  public post<T = unknown, D = unknown, M extends JerryResponseMode = DefaultMode>(
    url: string,
    data?: D,
    config?: JerryRequestConfig<D, M>,
  ): Promise<JerryResult<T, M, D>> {
    return this.request<T, D, M>(url, {
      ...(config ?? {}),
      data: data as D,
      method: "POST",
    } as JerryRequestConfig<D, M>);
  }

  public put<T = unknown, D = unknown, M extends JerryResponseMode = DefaultMode>(
    url: string,
    data?: D,
    config?: JerryRequestConfig<D, M>,
  ): Promise<JerryResult<T, M, D>> {
    return this.request<T, D, M>(url, {
      ...(config ?? {}),
      data: data as D,
      method: "PUT",
    } as JerryRequestConfig<D, M>);
  }

  public patch<T = unknown, D = unknown, M extends JerryResponseMode = DefaultMode>(
    url: string,
    data?: D,
    config?: JerryRequestConfig<D, M>,
  ): Promise<JerryResult<T, M, D>> {
    return this.request<T, D, M>(url, {
      ...(config ?? {}),
      data: data as D,
      method: "PATCH",
    } as JerryRequestConfig<D, M>);
  }

  private normalizeRequestArgs<D = unknown, M extends JerryResponseMode = DefaultMode>(
    urlOrConfig: string | JerryRequestConfig<D, M>,
    config?: JerryRequestConfig<D, M>,
  ): JerryRequestConfig<D, M> {
    if (typeof urlOrConfig === "string") {
      return {
        ...(config ?? {}),
        url: urlOrConfig,
      };
    }

    return urlOrConfig;
  }
}
