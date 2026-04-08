import type { JerryAdapter } from "../types";
import { hasFetch, isNodeLikeEnvironment } from "../utils/env";
import { browserAdapter } from "./browser";
import { createFetchAdapter } from "./fetch";
import { nodeAdapter } from "./node";

export function getDefaultAdapter(): JerryAdapter {
  if (isNodeLikeEnvironment()) {
    return nodeAdapter;
  }

  if (hasFetch()) {
    return browserAdapter;
  }

  return createFetchAdapter("browser");
}

export { browserAdapter, nodeAdapter, createFetchAdapter };

