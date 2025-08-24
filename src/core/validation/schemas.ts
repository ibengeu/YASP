import { z } from 'zod';

// OpenAPI specification validation schema
export const OpenAPISpecSchema = z.object({
  openapi: z.string().regex(/^3\.[0-1]\.\d+$/, 'Must be OpenAPI 3.0.x or 3.1.x'),
  info: z.object({
    title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
    version: z.string().min(1, 'Version is required').max(50, 'Version too long'),
    description: z.string().max(5000, 'Description too long').optional(),
    contact: z.object({
      name: z.string().max(100).optional(),
      url: z.string().url().optional(),
      email: z.string().email().optional()
    }).optional(),
    license: z.object({
      name: z.string().min(1, 'License name required').max(100),
      url: z.string().url().optional(),
      identifier: z.string().max(50).optional()
    }).optional(),
    termsOfService: z.string().url().optional()
  }),
  servers: z.array(z.object({
    url: z.string().url('Invalid server URL'),
    description: z.string().max(500).optional(),
    variables: z.record(z.object({
      enum: z.array(z.string()).optional(),
      default: z.string(),
      description: z.string().max(500).optional()
    })).optional()
  })).optional(),
  paths: z.record(z.any()).refine((paths) => Object.keys(paths).length > 0, 'At least one path required'),
  components: z.object({
    schemas: z.record(z.any()).optional(),
    responses: z.record(z.any()).optional(),
    parameters: z.record(z.any()).optional(),
    requestBodies: z.record(z.any()).optional(),
    headers: z.record(z.any()).optional(),
    securitySchemes: z.record(z.any()).optional()
  }).optional(),
  security: z.array(z.record(z.array(z.string()))).optional(),
  tags: z.array(z.object({
    name: z.string().min(1, 'Tag name required').max(50),
    description: z.string().max(500).optional()
  })).optional(),
  externalDocs: z.object({
    description: z.string().max(500).optional(),
    url: z.string().url('Invalid external docs URL')
  }).optional()
}).strict();

// Import validation schemas
export const FileImportSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.size <= 10 * 1024 * 1024, // 10MB limit
    'File size must be less than 10MB'
  ).refine(
    (file) => ['application/json', 'text/plain', 'application/x-yaml', 'text/yaml'].includes(file.type) || 
             file.name.match(/\.(json|yaml|yml)$/i),
    'File must be JSON or YAML format'
  )
});

export const URLImportSchema = z.object({
  url: z.string()
    .url('Invalid URL format')
    .refine((url) => {
      const parsedUrl = new URL(url);
      // Security checks for SSRF prevention
      return parsedUrl.protocol === 'https:' && 
             !parsedUrl.hostname.match(/^(localhost|127\.0\.0\.1|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.)/) &&
             parsedUrl.port === '' || ['80', '443', '8080', '8443'].includes(parsedUrl.port);
    }, 'URL must be HTTPS and not point to internal networks')
});

export const PasteContentSchema = z.object({
  content: z.string()
    .min(1, 'Content cannot be empty')
    .max(10 * 1024 * 1024, 'Content too large (10MB limit)')
    .refine((content) => {
      try {
        JSON.parse(content);
        return true;
      } catch {
        // Try YAML parsing if available
        return false;
      }
    }, 'Content must be valid JSON or YAML')
});

// API request validation schemas
export const APIRequestSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']),
  url: z.string().url('Invalid API URL').refine((url) => {
    const parsedUrl = new URL(url);
    // SSRF protection - more restrictive for API testing
    return parsedUrl.protocol === 'https:' && 
           !parsedUrl.hostname.match(/^(localhost|127\.0\.0\.1|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.)/);
  }, 'URL must be HTTPS and not point to internal networks'),
  headers: z.record(z.string().max(1000, 'Header value too long')),
  body: z.string().max(1024 * 1024, 'Request body too large (1MB limit)').optional(),
  timeout: z.number().min(1000).max(30000).default(10000)
});

// Search and filter schemas
export const SearchQuerySchema = z.object({
  query: z.string().max(100, 'Search query too long').optional(),
  workspaceType: z.enum(['Personal', 'Team', 'Partner', 'Public']).optional(),
  tags: z.array(z.string().max(50)).optional(),
  sortBy: z.enum(['name', 'recent', 'version']).default('recent'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Workspace management schemas
export const WorkspaceSchema = z.object({
  type: z.enum(['Personal', 'Team', 'Partner', 'Public']),
  syncStatus: z.enum(['synced', 'syncing', 'offline']).default('synced'),
  tags: z.array(z.string().max(50, 'Tag too long')).max(20, 'Too many tags'),
  isDiscoverable: z.boolean().default(false)
});

// Security validation schemas
export const SecurityCredentialSchema = z.object({
  type: z.enum(['apiKey', 'bearerToken', 'basicAuth', 'oauth2']),
  value: z.string().max(1000, 'Credential value too long'),
  location: z.enum(['header', 'query', 'cookie']).optional()
});

// Export and sharing schemas
export const ExportConfigSchema = z.object({
  format: z.enum(['json', 'yaml', 'html', 'postman']),
  includeExamples: z.boolean().default(true),
  includeDescriptions: z.boolean().default(true),
  minify: z.boolean().default(false)
});

// Rate limiting and security
export const RateLimitSchema = z.object({
  requests: z.number().max(100, 'Too many requests'),
  timeWindow: z.number().min(1000).max(3600000), // 1 second to 1 hour
  lastReset: z.date()
});

export type OpenAPISpec = z.infer<typeof OpenAPISpecSchema>;
export type FileImport = z.infer<typeof FileImportSchema>;
export type URLImport = z.infer<typeof URLImportSchema>;
export type PasteContent = z.infer<typeof PasteContentSchema>;
export type APIRequest = z.infer<typeof APIRequestSchema>;
export type SearchQuery = z.infer<typeof SearchQuerySchema>;
export type Workspace = z.infer<typeof WorkspaceSchema>;
export type SecurityCredential = z.infer<typeof SecurityCredentialSchema>;
export type ExportConfig = z.infer<typeof ExportConfigSchema>;
export type RateLimit = z.infer<typeof RateLimitSchema>;