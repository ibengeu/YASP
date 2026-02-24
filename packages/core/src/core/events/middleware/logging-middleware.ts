/**
 * Logging Event Middleware
 * Logs all events to console in development mode
 *
 * Architecture: SRS_00 § 5.2 - Event Middleware
 */

import type { DomainEvent, EventMiddleware } from '../event-types';

/**
 * Creates logging middleware for event debugging
 */
export const createLoggingMiddleware = (enabled: boolean = import.meta.env.DEV): EventMiddleware => {
  return async (event: DomainEvent): Promise<DomainEvent> => {
    if (!enabled) return event;

    const timestamp = new Date(event.timestamp).toLocaleTimeString();
    const style = 'color: #10b981; font-weight: bold;';

    console.groupCollapsed(
      `%c[Event] ${event.name}`,
      style,
      timestamp
    );
    console.log('Payload:', event.payload);
    console.log('Source:', event.source);
    console.log('Correlation ID:', event.correlationId);
    console.groupEnd();

    return event;
  };
};
