import type { JerryInstance, JerryRequestConfig, JerryResponseMode } from "../types";
import { Jerry } from "./Jerry";

export function createJerryInstance<
  M extends JerryResponseMode = "response",
>(defaults?: JerryRequestConfig<unknown, M>): JerryInstance<M> {
  const context = new Jerry(defaults);

  const instance = context.request.bind(context) as JerryInstance<M>;

  instance.defaults = context.defaults;
  instance.interceptors = context.interceptors;
  instance.create = context.create.bind(context) as JerryInstance<M>["create"];
  instance.request = context.request.bind(context) as JerryInstance<M>["request"];
  instance.get = context.get.bind(context) as JerryInstance<M>["get"];
  instance.delete = context.delete.bind(context) as JerryInstance<M>["delete"];
  instance.head = context.head.bind(context) as JerryInstance<M>["head"];
  instance.options = context.options.bind(context) as JerryInstance<M>["options"];
  instance.post = context.post.bind(context) as JerryInstance<M>["post"];
  instance.put = context.put.bind(context) as JerryInstance<M>["put"];
  instance.patch = context.patch.bind(context) as JerryInstance<M>["patch"];

  return instance;
}

