import type {
  JerryFulfilled,
  JerryInterceptorHandler,
  JerryInterceptorManager,
  JerryRejected,
} from "../types";

export class InterceptorManager<V> implements JerryInterceptorManager<V> {
  private readonly handlers: Array<JerryInterceptorHandler<V> | null> = [];

  public use(onFulfilled?: JerryFulfilled<V>, onRejected?: JerryRejected): number {
    this.handlers.push({ onFulfilled, onRejected });
    return this.handlers.length - 1;
  }

  public eject(id: number): void {
    if (typeof this.handlers[id] !== "undefined") {
      this.handlers[id] = null;
    }
  }

  public clear(): void {
    this.handlers.length = 0;
  }

  public forEach(iterator: (handler: JerryInterceptorHandler<V>) => void): void {
    for (const handler of this.handlers) {
      if (handler) {
        iterator(handler);
      }
    }
  }
}

