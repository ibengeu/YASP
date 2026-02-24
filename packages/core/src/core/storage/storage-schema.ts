/**
 * IndexedDB Storage Schema Definitions
 * Defines data structures for all stored entities
 *
 * Architecture: SRS_01 § 2.1 - IndexedDB Schema
 */

import type { ServerConfig, AuthConfig } from '@/features/registration/utils/spec-inference';
import type { WorkflowDocument } from '@/features/workflows/types/workflow.types';

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
 * Additional metadata for organization and quality tracking
 */
export interface SpecMetadata {
  score: number; // Quality score (0-100)
  tags: string[]; // User-defined tags
  workspaceType: WorkspaceType; // Workspace classification
  syncStatus: SyncStatus; // Sync state (future feature)
  isDiscoverable: boolean; // Public visibility flag

  // Source URL for auditing/debugging and future re-fetch functionality
  sourceUrl?: string; // URL from which spec was fetched (null for file/paste uploads)

  // Try It Out Support (Gap 0 fix)
  // Mitigation for gaps preventing API testing with registered specs
  specType?: 'openapi' | 'asyncapi'; // Type of specification
  servers?: ServerConfig[]; // Server configurations from OpenAPI spec
  defaultAuth?: AuthConfig; // Default authentication configuration (without credentials)
  inferredFields?: string[]; // List of fields auto-populated from spec
  specQuality?: {
    confidence: 'high' | 'medium' | 'low'; // Inference confidence level
    endpointCount: number; // Number of API endpoints
    hasAuth: boolean; // Whether authentication is configured
    hasMultipleServers: boolean; // Whether multiple servers defined
    validationIssues: number; // Count of validation issues
  };
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
 * Workspace Document
 * Groups API specs by project/service (Postman/Insomnia-style)
 */
export interface WorkspaceDocument {
  id: string; // UUID
  name: string; // Display name
  description?: string; // Optional description
  specIds: string[]; // Ordered list of spec IDs in this workspace
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  isDefault: boolean; // True for the auto-created "Personal" workspace
}

/**
 * Complete Storage Schema
 * Type-safe schema definition
 */
export interface StorageSchema {
  specs: OpenApiDocument;
  settings: SettingEntry;
  secrets: SecretEntry;
  workflows: WorkflowDocument;
  workspaces: WorkspaceDocument;
}
