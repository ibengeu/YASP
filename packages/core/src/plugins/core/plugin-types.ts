/**
 * Plugin System Type Definitions
 * Defines plugin interfaces and contracts
 *
 * Architecture: MVP_ARCHITECTURE.md § 5 - Plugin System
 */

/**
 * Plugin Context
 * Provides plugins with access to core services
 */
export interface PluginContext {
  storage: any; // IDBStorage instance
  events: any; // EventDispatcher instance
  http: any; // HTTP client instance
  config: any; // App configuration
  logger: Console; // Structured logging
}

/**
 * Base Plugin Interface
 * All plugins must implement this
 */
export interface BasePlugin {
  id: string;
  name: string;
  version: string;
  type: PluginType;

  onLoad(context: PluginContext): void | Promise<void>;
  onUnload(): void | Promise<void>;
}

export type PluginType = 'linter' | 'generator' | 'exporter' | 'transformer';

/**
 * Linter Plugin
 * Validates and lints OpenAPI specifications
 */
export interface LinterPlugin extends BasePlugin {
  type: 'linter';
  lint(content: string, options?: LinterOptions): Promise<LintResult>;
}

export interface LinterOptions {
  ruleset?: string;
  severity?: 'error' | 'warning' | 'info';
}

export interface LintResult {
  diagnostics: ISpectralDiagnostic[];
  score: number;
}

export interface ISpectralDiagnostic {
  code: string;
  message: string;
  severity: 0 | 1 | 2 | 3; // Error | Warning | Info | Hint
  range: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
  path: string[];
}

/**
 * Generator Plugin
 * Creates or augments OpenAPI specifications
 */
export interface GeneratorPlugin extends BasePlugin {
  type: 'generator';
  generate(prompt: string, options?: GeneratorOptions): Promise<GeneratorResult>;
}

export interface GeneratorOptions {
  specVersion?: '3.0' | '3.1';
  outputFormat?: 'yaml' | 'json';
}

export interface GeneratorResult {
  content: string; // Generated spec (YAML/JSON)
  metadata?: {
    provider?: string;
    model?: string;
    tokensUsed?: number;
  };
}

/**
 * Exporter Plugin
 * Exports specs in different formats
 */
export interface ExporterPlugin extends BasePlugin {
  type: 'exporter';
  export(spec: string, options?: ExporterOptions): Promise<ExporterResult>;
}

export interface ExporterOptions {
  format: 'json' | 'yaml' | 'postman' | 'html' | 'markdown';
  pretty?: boolean;
}

export interface ExporterResult {
  content: string | Blob;
  filename: string;
  mimeType: string;
}

/**
 * Transformer Plugin
 * Converts between formats or normalizes specs
 */
export interface TransformerPlugin extends BasePlugin {
  type: 'transformer';
  transform(spec: string, options?: TransformerOptions): Promise<TransformerResult>;
}

export interface TransformerOptions {
  from?: 'swagger' | 'openapi-3.0' | 'openapi-3.1';
  to?: 'openapi-3.0' | 'openapi-3.1';
  normalize?: boolean;
}

export interface TransformerResult {
  content: string;
  warnings?: string[];
}

/**
 * Plugin Manifest
 * Metadata for plugin discovery
 */
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  type: PluginType;
  description: string;
  author?: string;
  capabilities: string[];
  dependencies?: string[];
  configSchema?: Record<string, any>;
}
