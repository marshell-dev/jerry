import type { JerryStatic } from "./types";
import { browserAdapter, createFetchAdapter, nodeAdapter } from "./adapters";
import { createJerryInstance, JerryError, isJerryError } from "./core";

const jerry = createJerryInstance() as JerryStatic;

jerry.JerryError = JerryError;
jerry.isJerryError = isJerryError;

export default jerry;

export { JerryError, isJerryError, browserAdapter, nodeAdapter, createFetchAdapter };

export type {
  JerryAdapter,
  JerryCallable,
  JerryDataRequestConfig,
  JerryErrorCode,
  JerryErrorKind,
  JerryHeaders,
  JerryInstance,
  JerryInterceptorHandler,
  JerryInterceptorManager,
  JerryInterceptors,
  JerryKnownConfig,
  JerryMethod,
  JerryParams,
  JerryParamValue,
  JerryRequestConfig,
  JerryResponseRequestConfig,
  JerryResponse,
  JerryResponseMode,
  JerryResponseType,
  JerryResult,
  JerryStatic,
  ResolveResponseMode,
  ResolvedJerryRequestConfig,
} from "./types";
