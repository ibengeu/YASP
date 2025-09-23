/**
 * OpenAPI Catalog Types
 * Types for OpenAPI specification management and catalog functionality
 */

import { User } from "../auth/types";
import { Workspace } from "../workspace/types";

export interface OpenAPISpec {
  id: string;
  workspaceId: string;
  workspace?: Workspace;
  
  // OpenAPI Metadata (extracted from spec)
  title: string;
  description: string;
  version: string;
  servers: OpenAPIServer[];
  paths: Record<string, any>;
  tags: OpenAPITag[];
  
  // Platform Metadata
  displayName?: string; // User-provided name override
  category?: string;
  owner: User;
  ownerContact?: string;
  
  // File Information
  fileName: string;
  fileFormat: 'json' | 'yaml';
  fileSize: number;
  originalContent: string; // The raw OpenAPI spec content
  
  // Status and Lifecycle
  status: OpenAPISpecStatus;
  validationStatus: ValidationStatus;
  validationErrors: ValidationError[];
  
  // Versioning
  versionHistory: OpenAPISpecVersion[];
  currentVersionId: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  
  // Access Control
  visibility: 'private' | 'workspace' | 'organization' | 'public';
  permissions: OpenAPISpecPermissions;
  
  // Analytics
  downloadCount: number;
  lastDownloadedAt?: Date;
  
  // Compliance
  auditLogs: AuditLogEntry[];
  retentionPolicy?: RetentionPolicy;
}

export interface OpenAPISpecVersion {
  id: string;
  specId: string;
  version: string;
  content: string;
  changeLog?: string;
  createdAt: Date;
  createdBy: User;
  isActive: boolean;
}

export interface OpenAPIServer {
  url: string;
  description?: string;
  variables?: Record<string, any>;
}

export interface OpenAPITag {
  name: string;
  description?: string;
  externalDocs?: {
    url: string;
    description?: string;
  };
}

export interface ValidationError {
  id: string;
  type: 'schema' | 'policy' | 'security' | 'naming' | 'custom';
  severity: 'error' | 'warning' | 'info';
  message: string;
  path?: string; // JSON path to the problematic field
  line?: number;
  column?: number;
  rule?: string; // The validation rule that failed
}

export interface OpenAPISpecPermissions {
  canView: string[]; // User IDs or role names
  canEdit: string[];
  canDelete: string[];
  canDownload: string[];
  canManageVersions: string[];
}

export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  performedBy: User;
  timestamp: Date;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface RetentionPolicy {
  maxVersions?: number;
  maxAge?: number; // in days
  archiveAfter?: number; // in days
}

export type OpenAPISpecStatus = 
  | 'draft' 
  | 'validating' 
  | 'validation_failed' 
  | 'pending_approval' 
  | 'published' 
  | 'archived' 
  | 'deprecated';

export type ValidationStatus = 
  | 'pending' 
  | 'validating' 
  | 'valid' 
  | 'invalid' 
  | 'warnings';

export type AuditAction =
  | 'spec_uploaded'
  | 'spec_updated'
  | 'spec_published'
  | 'spec_archived'
  | 'spec_deleted'
  | 'spec_downloaded'
  | 'version_created'
  | 'version_activated'
  | 'permissions_changed'
  | 'validation_run';

// Search and Filter Types
export interface OpenAPISearchFilters {
  query?: string;
  workspaceIds?: string[];
  categories?: string[];
  tags?: string[];
  status?: OpenAPISpecStatus[];
  validationStatus?: ValidationStatus[];
  owners?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  hasWarnings?: boolean;
  visibility?: Array<'private' | 'workspace' | 'organization' | 'public'>;
}

export interface OpenAPISearchResult {
  specs: OpenAPISpec[];
  totalCount: number;
  facets: {
    categories: { name: string; count: number }[];
    tags: { name: string; count: number }[];
    workspaces: { id: string; name: string; count: number }[];
    owners: { id: string; name: string; count: number }[];
  };
}

// Upload and Creation Types
export interface OpenAPIUploadRequest {
  file: File;
  workspaceId: string;
  displayName?: string;
  category?: string;
  ownerContact?: string;
  visibility: 'private' | 'workspace' | 'organization' | 'public';
  autoPublish?: boolean;
}

export interface OpenAPIValidationRequest {
  content: string;
  format: 'json' | 'yaml';
  policies?: ValidationPolicy[];
}

export interface ValidationPolicy {
  id: string;
  name: string;
  description: string;
  type: 'schema' | 'naming' | 'security' | 'structure' | 'custom';
  enabled: boolean;
  configuration: Record<string, any>;
}

// Batch Operations
export interface BatchOperation {
  type: 'publish' | 'archive' | 'delete' | 'change_visibility' | 'move_workspace';
  specIds: string[];
  parameters?: Record<string, any>;
}

export interface BatchOperationResult {
  successful: string[];
  failed: Array<{
    specId: string;
    error: string;
  }>;
}

// Statistics and Analytics
export interface CatalogStatistics {
  totalSpecs: number;
  specsByStatus: Record<OpenAPISpecStatus, number>;
  specsByValidation: Record<ValidationStatus, number>;
  specsByWorkspace: Array<{ workspaceId: string; name: string; count: number }>;
  recentActivity: AuditLogEntry[];
  topDownloaded: Array<{ spec: OpenAPISpec; downloadCount: number }>;
  validationIssues: {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<'error' | 'warning' | 'info', number>;
  };
}

// Component Props Types
export interface OpenAPICatalogProps {
  workspaceId?: string;
  onSpecSelect?: (spec: OpenAPISpec) => void;
  onSpecUpload?: (spec: OpenAPISpec) => void;
}

export interface OpenAPISpecCardProps {
  spec: OpenAPISpec;
  onView?: (spec: OpenAPISpec) => void;
  onEdit?: (spec: OpenAPISpec) => void;
  onDownload?: (spec: OpenAPISpec) => void;
  onDelete?: (spec: OpenAPISpec) => void;
  onSelect?: (spec: OpenAPISpec, selected: boolean) => void;
  selected?: boolean;
  showWorkspace?: boolean;
  compact?: boolean;
  showSimpleView?: boolean;
}

export interface OpenAPIUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSpecUploaded: (spec: OpenAPISpec) => void;
  workspaceId?: string;
  initialData?: Partial<OpenAPIUploadRequest>;
}