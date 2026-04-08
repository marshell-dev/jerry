import type { JerryRequestConfig, JerryResponseMode, JerryValidateStatus } from "../types";
import { getDefaultAdapter } from "../adapters";

export const defaultValidateStatus: JerryValidateStatus = (status) =>
  status >= 200 && status < 300;

export function createDefaultConfig<
  M extends JerryResponseMode = "response",
>(): JerryRequestConfig<unknown, M> & { responseMode: M } {
  return {
    method: "GET",
    headers: {},
    timeout: 0,
    responseType: "auto",
    responseMode: "response" as M,
    validateStatus: defaultValidateStatus,
    adapter: getDefaultAdapter(),
  };
}

