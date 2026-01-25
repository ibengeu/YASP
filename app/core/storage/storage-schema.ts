/**
 * IndexedDB Storage Schema Definitions
 * Defines data structures for all stored entities
 *
 * Architecture: SRS_01 § 2.1 - IndexedDB Schema
 */

/**
 * OpenAPI Specification Document
 * Primary entity storing complete OpenAPI 3.x specs
 */
export interface OpenApiDocument {
  id: string; // UUID
  type: 'openapi'; // Document type (future: 'asyncapi', 'graphql')
  content: string; // YAML/JSON string of full spec
  title: string; // Spec title (from info.title)
  version: string; // Spec version (from info.version)
  description?: string; // Spec description (from info.description)
  metadata: SpecMetadata;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Spec Metadata
 * Additional metadata for organization and governance
 */
export interface SpecMetadata {
  score: number; // Governance score (0-100)
  tags: string[]; // User-defined tags
  workspaceType: WorkspaceType; // Workspace classification
  syncStatus: SyncStatus; // Sync state (future feature)
  isDiscoverable: boolean; // Public visibility flag
}

export type WorkspaceType = 'personal' | 'team' | 'partner' | 'public';
export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'conflict';

/**
 * Settings Entry
 * Key-value store for user preferences
 */
export interface SettingEntry {
  key: string; // Setting identifier (e.g., 'theme', 'editor.fontSize')
  value: any; // JSON-serializable value
}

/**
 * Secret Entry
 * Encrypted API keys for Try It Out feature
 * Security: OWASP A02:2025 - Cryptographic storage for credentials
 */
export interface SecretEntry {
  key_id: string; // UUID
  service_name: string; // Identifier (e.g., 'github', 'stripe')
  enc_value: string; // AES-GCM encrypted value
  created_at: string; // ISO timestamp
}

/**
 * Complete Storage Schema
 * Type-safe schema definition
 */
export interface StorageSchema {
  specs: OpenApiDocument;
  settings: SettingEntry;
  secrets: SecretEntry;
}
