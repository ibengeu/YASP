/**
 * Plugin Registry
 * Manages plugin lifecycle and discovery
 *
 * Architecture: MVP_ARCHITECTURE.md § 5.2 - Plugin Lifecycle
 */

import type {
  BasePlugin,
  PluginContext,
  PluginType,
  LinterPlugin,
  GeneratorPlugin,
  ExporterPlugin,
  TransformerPlugin,
} from './plugin-types';

export class PluginRegistry {
  private plugins = new Map<string, BasePlugin>();
  private context: PluginContext | null = null;

  /**
   * Initialize plugin system with context
   */
  async init(context: PluginContext): Promise<void> {
    this.context = context;
  }

  /**
   * Register a plugin
   */
  async register(plugin: BasePlugin): Promise<void> {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin "${plugin.id}" is already registered`);
    }

    // Call plugin's onLoad hook
    if (this.context) {
      await plugin.onLoad(this.context);
    }

    this.plugins.set(plugin.id, plugin);
  }

  /**
   * Unregister a plugin
   */
  async unregister(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin "${pluginId}" not found`);
    }

    // Call plugin's onUnload hook
    await plugin.onUnload();

    this.plugins.delete(pluginId);
  }

  /**
   * Get plugin by ID
   */
  get<T extends BasePlugin>(pluginId: string): T | undefined {
    return this.plugins.get(pluginId) as T;
  }

  /**
   * Get all plugins of a specific type
   */
  getByType<T extends BasePlugin>(type: PluginType): T[] {
    return Array.from(this.plugins.values()).filter(
      (plugin) => plugin.type === type
    ) as T[];
  }

  /**
   * Get all registered plugins
   */
  getAll(): BasePlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Check if plugin is registered
   */
  has(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }

  /**
   * Get linter plugins
   */
  getLinters(): LinterPlugin[] {
    return this.getByType<LinterPlugin>('linter');
  }

  /**
   * Get generator plugins
   */
  getGenerators(): GeneratorPlugin[] {
    return this.getByType<GeneratorPlugin>('generator');
  }

  /**
   * Get exporter plugins
   */
  getExporters(): ExporterPlugin[] {
    return this.getByType<ExporterPlugin>('exporter');
  }

  /**
   * Get transformer plugins
   */
  getTransformers(): TransformerPlugin[] {
    return this.getByType<TransformerPlugin>('transformer');
  }

  /**
   * Clear all plugins (useful for testing)
   */
  async clear(): Promise<void> {
    const unloadPromises = Array.from(this.plugins.values()).map((plugin) =>
      plugin.onUnload()
    );

    await Promise.all(unloadPromises);
    this.plugins.clear();
  }
}

// Singleton instance
export const pluginRegistry = new PluginRegistry();
