/**
 * API Specification Inference Utility
 *
 * Automatically extracts metadata from OpenAPI 3.x and AsyncAPI 2.x/3.x specifications
 * to reduce manual data entry during API registration.
 *
 * Security: Implements input validation and sanitization per OWASP A03:2025 (Injection)
 */

import { resolveServerUrl } from './resolve-server-url';

export interface InferredData {
  // Basic Information
  name?: string;
  version?: string;
  description?: string;

  // Server Configuration
  servers: ServerConfig[];
  primaryServerUrl?: string;

  // Authentication
  auth: AuthConfig | null;
  multipleAuthSupported: boolean;

  // Organization
  tags: string[];

  // Endpoints
  endpointCount: number;
  endpointsByMethod: Record<string, number>;

  // Quality Metrics
  confidence: 'high' | 'medium' | 'low';
  fieldsPopulated: number;
  totalFields: number;
  validationIssues: ValidationIssue[];
}

export interface ServerConfig {
  url: string;
  description?: string;
  variables?: Record<string, any>;
  isDefault: boolean;
}

export interface AuthConfig {
  type: 'none' | 'api-key' | 'bearer' | 'basic' | 'user-password' | 'scram-sha256' | 'x509';
  scheme?: string;
  bearerFormat?: string;
  keyLocation?: 'header' | 'query' | 'cookie';
  keyName?: string;
  description?: string;
}

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  field: string;
  message: string;
}

/**
 * Main inference function - extracts all available metadata from API spec (OpenAPI or AsyncAPI)
 *
 * @param spec - Parsed specification object
 * @param sourceUrl - Optional URL from which the spec was fetched, used to resolve relative server URLs
 * @returns InferredData with all extracted metadata and quality metrics
 */
export function inferAllData(spec: any, sourceUrl?: string): InferredData {
  // Mitigation for OWASP A03:2025 – Injection: Validate input structure
  if (!spec || typeof spec !== 'object') {
    throw new Error('Invalid spec: must be an object');
  }

  const isAsyncAPI = !!(spec.asyncapi);
  const validationIssues: ValidationIssue[] = [];

  // Extract basic information
  const name = spec.info?.title;
  const version = spec.info?.version;
  const description = spec.info?.description;

  // Extract and process servers
  // Mitigation for OWASP A09:2025 (SSRF): Resolve relative server URLs at registration time
  const servers = isAsyncAPI 
    ? extractAsyncApiServers(spec.servers, validationIssues, sourceUrl)
    : extractServers(spec.servers, validationIssues, sourceUrl);
    
  const primaryServerUrl = servers.find(s => s.isDefault)?.url || servers[0]?.url;

  // Extract authentication
  const { auth, multipleAuthSupported } = isAsyncAPI 
    ? extractAsyncApiAuth(spec)
    : extractAuth(spec);

  // Extract tags
  const tags = extractTags(spec.tags);

  // Count endpoints (channels for AsyncAPI)
  const { endpointCount, endpointsByMethod } = isAsyncAPI
    ? countAsyncApiChannels(spec.channels)
    : countEndpoints(spec.paths);

  // Validate and calculate quality metrics
  if (isAsyncAPI) {
    validateAsyncApiSpec(spec, validationIssues);
  } else {
    validateSpec(spec, validationIssues);
  }

  const { fieldsPopulated, totalFields, confidence } = calculateQuality({
    name,
    version,
    description,
    servers,
    auth,
    tags,
    endpointCount,
  });

  return {
    name,
    version,
    description,
    servers,
    primaryServerUrl,
    auth,
    multipleAuthSupported,
    tags,
    endpointCount,
    endpointsByMethod,
    confidence,
    fieldsPopulated,
    totalFields,
    validationIssues,
  };
}

/**
 * Extract and prioritize servers from OpenAPI spec
 * Production servers are prioritized over staging/dev
 */
function extractServers(
  serversArray: any[] | undefined,
  validationIssues: ValidationIssue[],
  sourceUrl?: string
): ServerConfig[] {
  if (!serversArray || !Array.isArray(serversArray) || serversArray.length === 0) {
    validationIssues.push({
      severity: 'error',
      field: 'servers',
      message: 'No server URLs defined. At least one server is required for Try It Out.',
    });
    return [];
  }

  const servers: ServerConfig[] = serversArray.map((server) => ({
    url: resolveServerUrl(server.url, sourceUrl),
    description: server.description,
    variables: server.variables,
    isDefault: false, // Will be set below
  }));

  // Prioritize production server as default
  const productionIndex = servers.findIndex(
    s =>
      s.description?.toLowerCase().includes('production') ||
      s.description?.toLowerCase().includes('prod') ||
      (!s.url.includes('localhost') &&
        !s.url.includes('staging') &&
        !s.url.includes('dev') &&
        !s.url.includes('test'))
  );

  if (productionIndex >= 0) {
    servers[productionIndex].isDefault = true;
  } else {
    // No production server found, mark first HTTPS server as default
    const httpsIndex = servers.findIndex(s => s.url.startsWith('https://'));
    if (httpsIndex >= 0) {
      servers[httpsIndex].isDefault = true;
    } else if (servers.length > 0) {
      servers[0].isDefault = true;
    }
  }

  return servers;
}

/**
 * Extract and prioritize servers from AsyncAPI spec
 */
function extractAsyncApiServers(
  serversObj: any | undefined,
  validationIssues: ValidationIssue[],
  sourceUrl?: string
): ServerConfig[] {
  if (!serversObj || typeof serversObj !== 'object' || Object.keys(serversObj).length === 0) {
    validationIssues.push({
      severity: 'error',
      field: 'servers',
      message: 'No servers defined in AsyncAPI. At least one server is required.',
    });
    return [];
  }

  const servers: ServerConfig[] = Object.entries(serversObj).map(([name, server]: [string, any]) => ({
    url: resolveServerUrl(server.url, sourceUrl),
    description: server.description || name,
    variables: server.variables,
    isDefault: false,
  }));

  // Prioritize production
  const productionIndex = servers.findIndex(
    s =>
      s.description?.toLowerCase().includes('production') ||
      s.description?.toLowerCase().includes('prod') ||
      (!s.url.includes('localhost') &&
        !s.url.includes('staging') &&
        !s.url.includes('dev') &&
        !s.url.includes('test'))
  );

  if (productionIndex >= 0) {
    servers[productionIndex].isDefault = true;
  } else if (servers.length > 0) {
    servers[0].isDefault = true;
  }

  return servers;
}

/**
 * Extract authentication configuration from OpenAPI security schemes
 */
function extractAuth(spec: any): {
  auth: AuthConfig | null;
  multipleAuthSupported: boolean;
} {
  const securitySchemes = spec.components?.securitySchemes;
  const globalSecurity = spec.security;

  if (!securitySchemes || !globalSecurity || globalSecurity.length === 0) {
    return { auth: null, multipleAuthSupported: false };
  }

  // Check if multiple auth schemes are supported
  const multipleAuthSupported = globalSecurity.length > 1;

  // Get the first security scheme
  const firstSecurityName = Object.keys(globalSecurity[0])[0];
  const scheme = securitySchemes[firstSecurityName];

  if (!scheme) {
    return { auth: null, multipleAuthSupported };
  }

  // Map OpenAPI security scheme to our AuthConfig
  let auth: AuthConfig | null = null;

  if (scheme.type === 'http') {
    if (scheme.scheme === 'bearer') {
      auth = {
        type: 'bearer',
        scheme: 'bearer',
        bearerFormat: scheme.bearerFormat,
        description: scheme.description,
      };
    } else if (scheme.scheme === 'basic') {
      auth = {
        type: 'basic',
        scheme: 'basic',
        description: scheme.description,
      };
    }
  } else if (scheme.type === 'apiKey') {
    auth = {
      type: 'api-key',
      keyLocation: scheme.in,
      keyName: scheme.name,
      description: scheme.description,
    };
  }

  return { auth, multipleAuthSupported };
}

/**
 * Extract authentication configuration from AsyncAPI security schemes
 */
function extractAsyncApiAuth(spec: any): {
  auth: AuthConfig | null;
  multipleAuthSupported: boolean;
} {
  const securitySchemes = spec.components?.securitySchemes;
  if (!securitySchemes || Object.keys(securitySchemes).length === 0) {
    return { auth: null, multipleAuthSupported: false };
  }

  const schemeNames = Object.keys(securitySchemes);
  const firstScheme = securitySchemes[schemeNames[0]];
  
  let auth: AuthConfig | null = null;

  if (firstScheme.type === 'userPassword') {
    auth = { type: 'user-password', description: firstScheme.description };
  } else if (firstScheme.type === 'scramSha256') {
    auth = { type: 'scram-sha256', description: firstScheme.description };
  } else if (firstScheme.type === 'X509' || firstScheme.type === 'x509') {
    auth = { type: 'x509', description: firstScheme.description };
  } else if (firstScheme.type === 'http' && firstScheme.scheme === 'bearer') {
    auth = { type: 'bearer', scheme: 'bearer', description: firstScheme.description };
  } else if (firstScheme.type === 'apiKey') {
    auth = { type: 'api-key', keyLocation: firstScheme.in, keyName: firstScheme.name, description: firstScheme.description };
  }

  return { auth, multipleAuthSupported: schemeNames.length > 1 };
}

/**
 * Extract tags from spec
 */
function extractTags(tagsArray: any[] | undefined): string[] {
  if (!tagsArray || !Array.isArray(tagsArray)) {
    return [];
  }

  // Mitigation for OWASP A03:2025 – Injection: Sanitize tag names
  return tagsArray
    .filter(tag => tag && typeof tag === 'object' && tag.name)
    .map(tag => String(tag.name).trim())
    .filter(name => name.length > 0 && name.length <= 50); // Reasonable length limit
}

/**
 * Count endpoints and group by HTTP method (OpenAPI)
 */
function countEndpoints(paths: any): {
  endpointCount: number;
  endpointsByMethod: Record<string, number>;
} {
  if (!paths || typeof paths !== 'object') {
    return { endpointCount: 0, endpointsByMethod: {} };
  }

  const endpointsByMethod: Record<string, number> = {};
  let endpointCount = 0;

  const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

  Object.values(paths).forEach((pathItem: any) => {
    if (!pathItem || typeof pathItem !== 'object') return;

    validMethods.forEach(method => {
      const methodLower = method.toLowerCase();
      if (pathItem[methodLower]) {
        endpointCount++;
        endpointsByMethod[method] = (endpointsByMethod[method] || 0) + 1;
      }
    });
  });

  return { endpointCount, endpointsByMethod };
}

/**
 * Count AsyncAPI channels
 */
function countAsyncApiChannels(channels: any): {
  endpointCount: number;
  endpointsByMethod: Record<string, number>;
} {
  if (!channels || typeof channels !== 'object') {
    return { endpointCount: 0, endpointsByMethod: {} };
  }

  const channelNames = Object.keys(channels);
  const endpointCount = channelNames.length;
  const endpointsByMethod: Record<string, number> = { 'PUB/SUB': endpointCount };

  return { endpointCount, endpointsByMethod };
}

/**
 * Validate OpenAPI spec and add issues
 */
function validateSpec(spec: any, validationIssues: ValidationIssue[]): void {
  // Check for empty paths
  if (!spec.paths || Object.keys(spec.paths).length === 0) {
    validationIssues.push({
      severity: 'warning',
      field: 'paths',
      message: 'No API endpoints defined. Add paths to enable Try It Out.',
    });
  }

  // Check for missing info fields
  if (!spec.info?.title) {
    validationIssues.push({
      severity: 'error',
      field: 'info.title',
      message: 'API title is required',
    });
  }

  if (!spec.info?.version) {
    validationIssues.push({
      severity: 'warning',
      field: 'info.version',
      message: 'API version is recommended',
    });
  }

  // Check OpenAPI version
  if (!spec.openapi && !spec.swagger) {
    validationIssues.push({
      severity: 'error',
      field: 'openapi',
      message: 'Not a valid OpenAPI specification',
    });
  }
}

/**
 * Validate AsyncAPI spec
 */
function validateAsyncApiSpec(spec: any, validationIssues: ValidationIssue[]): void {
  if (!spec.info?.title) {
    validationIssues.push({
      severity: 'error',
      field: 'info.title',
      message: 'AsyncAPI title is required',
    });
  }

  if (!spec.channels || Object.keys(spec.channels).length === 0) {
    validationIssues.push({
      severity: 'warning',
      field: 'channels',
      message: 'No channels defined in AsyncAPI.',
    });
  }
}

/**
 * Calculate quality metrics and confidence score
 */
function calculateQuality(data: {
  name?: string;
  version?: string;
  description?: string;
  servers: ServerConfig[];
  auth: AuthConfig | null;
  tags: string[];
  endpointCount: number;
}): {
  fieldsPopulated: number;
  totalFields: number;
  confidence: 'high' | 'medium' | 'low';
} {
  const totalFields = 7; // name, version, description, servers, auth, tags, endpoints
  let fieldsPopulated = 0;

  if (data.name) fieldsPopulated++;
  if (data.version) fieldsPopulated++;
  if (data.description) fieldsPopulated++;
  if (data.servers.length > 0) fieldsPopulated++;
  if (data.auth) fieldsPopulated++;
  if (data.tags.length > 0) fieldsPopulated++;
  if (data.endpointCount > 0) fieldsPopulated++;

  const percentage = (fieldsPopulated / totalFields) * 100;

  let confidence: 'high' | 'medium' | 'low';
  if (percentage >= 85) {
    confidence = 'high';
  } else if (percentage >= 50) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  return { fieldsPopulated, totalFields, confidence };
}
