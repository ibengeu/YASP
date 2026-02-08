/**
 * Dependency Injection Container
 * Manages service lifecycle and dependencies
 *
 * Architecture: SRS_01 § 6.6 - Dependency Injection
 * Pattern: Service Locator with singleton management
 */

type ServiceFactory<T> = () => T;
type ServiceInstance<T> = T;

export class DIContainer {
  private services = new Map<string, ServiceInstance<any>>();
  private factories = new Map<string, ServiceFactory<any>>();

  /**
   * Register a service factory (lazy initialization)
   */
  register<T>(name: string, factory: ServiceFactory<T>): void {
    this.factories.set(name, factory);
  }

  /**
   * Register a service instance (eager initialization)
   */
  registerInstance<T>(name: string, instance: T): void {
    this.services.set(name, instance);
  }

  /**
   * Resolve a service (creates if not exists)
   */
  resolve<T>(name: string): T {
    // Return existing instance if available
    if (this.services.has(name)) {
      return this.services.get(name) as T;
    }

    // Create new instance from factory
    const factory = this.factories.get(name);
    if (!factory) {
      throw new Error(`Service "${name}" not registered in DI container`);
    }

    const instance = factory();
    this.services.set(name, instance);
    return instance as T;
  }

  /**
   * Check if service is registered
   */
  has(name: string): boolean {
    return this.services.has(name) || this.factories.has(name);
  }

  /**
   * Clear all services (useful for testing)
   */
  clear(): void {
    this.services.clear();
    this.factories.clear();
  }
}

// Singleton instance
export const container = new DIContainer();
