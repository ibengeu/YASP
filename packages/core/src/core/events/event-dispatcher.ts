/**
 * Event Dispatcher System
 * Enables loosely-coupled communication between feature modules
 *
 * Architecture: SRS_01 § 6.2 - Event System
 * Pattern: Pub/Sub with typed events
 */

import type { DomainEvent, EventHandler, EventMiddleware } from './event-types';

export class EventDispatcher {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private middleware: EventMiddleware[] = [];

  /**
   * Subscribe to an event
   * @param eventName - Event name to listen for
   * @param handler - Callback function when event is emitted
   * @returns Unsubscribe function
   */
  on<T = any>(eventName: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }

    this.handlers.get(eventName)!.add(handler as EventHandler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(eventName)?.delete(handler as EventHandler);
    };
  }

  /**
   * Subscribe to an event once (auto-unsubscribe after first emission)
   */
  once<T = any>(eventName: string, handler: EventHandler<T>): () => void {
    const wrapper: EventHandler<T> = (event) => {
      handler(event);
      this.off(eventName, wrapper);
    };

    return this.on(eventName, wrapper);
  }

  /**
   * Unsubscribe from an event
   */
  off<T = any>(eventName: string, handler: EventHandler<T>): void {
    this.handlers.get(eventName)?.delete(handler as EventHandler);
  }

  /**
   * Emit an event to all subscribers
   * @param eventName - Event name
   * @param payload - Event data
   * @param metadata - Optional metadata (source, timestamp)
   */
  async emit<T = any>(
    eventName: string,
    payload: T,
    metadata?: { source?: string; correlationId?: string }
  ): Promise<void> {
    const event: DomainEvent<T> = {
      name: eventName,
      payload,
      timestamp: new Date().toISOString(),
      source: metadata?.source || 'unknown',
      correlationId: metadata?.correlationId || crypto.randomUUID(),
    };

    // Run middleware chain
    let processedEvent = event;
    for (const mw of this.middleware) {
      processedEvent = await mw(processedEvent);
    }

    // Emit to all handlers
    const handlers = this.handlers.get(eventName);
    if (handlers) {
      const promises = Array.from(handlers).map((handler) =>
        Promise.resolve(handler(processedEvent))
      );
      await Promise.all(promises);
    }
  }

  /**
   * Add middleware to event processing pipeline
   * Middleware runs before handlers are invoked
   */
  use(middleware: EventMiddleware): void {
    this.middleware.push(middleware);
  }

  /**
   * Remove all event handlers (useful for testing)
   */
  clear(): void {
    this.handlers.clear();
  }

  /**
   * Get count of listeners for an event
   */
  listenerCount(eventName: string): number {
    return this.handlers.get(eventName)?.size || 0;
  }
}

// Singleton instance
export const eventDispatcher = new EventDispatcher();
