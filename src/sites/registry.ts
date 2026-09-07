import { SiteHandler } from "./base-handler";

export class SiteHandlerRegistry {
  private handlers: SiteHandler[] = [];

  register(handler: SiteHandler): void {
    this.handlers.push(handler);
  }

  findHandler(location: Location): SiteHandler | null {
    for (const handler of this.handlers) {
      if (handler.matches(location)) {
        return handler;
      }
    }
    return null;
  }

  getAll(): SiteHandler[] {
    return [...this.handlers];
  }

  clear(): void {
    for (const h of this.handlers) {
      h.cleanup?.();
    }
    this.handlers = [];
  }
}
