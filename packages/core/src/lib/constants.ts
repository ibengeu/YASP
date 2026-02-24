/**
 * Shared constants and configuration values
 * Centralizes hardcoded values for maintainability
 */

/** Quality score thresholds for API specification quality badges */
export const SCORE_THRESHOLDS = {
  excellent: 80,
  good: 60,
} as const;

/** Returns a quality label based on score */
export function getQualityLabel(score: number): string {
  if (score >= SCORE_THRESHOLDS.excellent) return 'Excellent';
  if (score >= SCORE_THRESHOLDS.good) return 'Good';
  return 'Needs Attention';
}

/** Returns a Tailwind color class for score bar based on threshold */
export function getScoreColor(score: number): string {
  if (score >= SCORE_THRESHOLDS.excellent) return 'bg-green-500';
  if (score >= SCORE_THRESHOLDS.good) return 'bg-amber-500';
  return 'bg-destructive';
}

/** Workspace type badge color classes */
export const WORKSPACE_TYPE_COLORS: Record<string, string> = {
  partner: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
  public: 'bg-green-500/10 text-green-600 border-green-500/20',
  personal: 'bg-muted text-muted-foreground border-border',
};

/** Returns workspace badge color, defaulting to personal */
export function getWorkspaceColor(type: string): string {
  return WORKSPACE_TYPE_COLORS[type] || WORKSPACE_TYPE_COLORS.personal;
}

/** HTTP method color classes (bg, text, border) — semantic Tailwind + YASP tokens */
export const HTTP_METHOD_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  get:    { bg: 'bg-sky-500/10',     text: 'text-sky-500',     border: 'border-sky-500/30' },
  post:   { bg: 'bg-green-500/10',   text: 'text-green-500',   border: 'border-green-500/30' },
  put:    { bg: 'bg-amber-500/10',   text: 'text-amber-500',   border: 'border-amber-500/30' },
  patch:  { bg: 'bg-blue-400/10',    text: 'text-blue-400',    border: 'border-blue-400/30' },
  delete: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/30' },
};

/** Returns HTTP method color object, defaulting to GET colors */
export function getMethodColor(method: string): { bg: string; text: string; border: string } {
  return HTTP_METHOD_COLORS[method.toLowerCase()] || HTTP_METHOD_COLORS.get;
}

/** localStorage key names */
export const STORAGE_KEYS = {
  sidebarCollapsed: 'api-drawer-sidebar-collapsed',
} as const;

/** Default HTTP headers for API requests */
export const DEFAULT_HEADERS = [
  { enabled: true, key: 'Content-Type', value: 'application/json' },
  { enabled: true, key: 'Accept', value: 'application/json' },
] as const;

/** Fallback URL used when a spec has no servers defined */
export const DEFAULT_FALLBACK_URL = 'https://api.example.com';

/** Default user profile for unauthenticated/local sessions */
export const DEFAULT_USER_PROFILE = {
  initials: 'YS',
  name: 'YASP User',
  subtitle: 'Local Environment',
} as const;

/** Request timeout in milliseconds */
export const REQUEST_TIMEOUT_MS = 30_000;

/** File size limits in bytes */
export const FILE_SIZE_LIMITS = {
  specUpload: 5 * 1024 * 1024,
  maxInput: 10 * 1024 * 1024,
} as const;

/** Status badge configurations for API catalog */
export const API_STATUS_BADGES = {
  active:     { label: 'Active',      color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  deprecated: { label: 'Deprecated',  color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  draft:      { label: 'Draft',       color: 'bg-muted text-muted-foreground border-border' },
} as const;

/** CodeMirror one-dark theme colors */
export const EDITOR_THEME = {
  background: '#282c34',
  gutterBackground: '#21252b',
  gutterForeground: '#636d83',
} as const;

/** Cloud metadata hosts blocked for SSRF prevention */
export const BLOCKED_METADATA_HOSTS = [
  '169.254.169.254',
  'metadata.google.internal',
  'metadata.azure.com',
] as const;

/** Input validation limits */
export const VALIDATION_LIMITS = {
  markdownMaxLength: 10_000,
  textMaxLength: 500,
  titleMin: 3,
  titleMax: 100,
  tagMax: 20,
  descriptionMax: 500,
  versionMax: 20,
  serverUrlMax: 50,
} as const;

/** Workspace type filter options */
export const WORKSPACE_TYPES = ['personal', 'partner', 'public'] as const;

/** Accepted spec file extensions */
export const ACCEPTED_SPEC_EXTENSIONS = /\.(yaml|yml|json)$/i;

/** Workflow feature limits */
export const WORKFLOW_LIMITS = {
  maxSteps: 20,
  maxExtractions: 10,
  maxVariableNameLength: 50,
  maxJsonPathLength: 500,
  maxWorkflowNameLength: 100,
} as const;

/** Regex pattern for {{variable}} template syntax */
export const WORKFLOW_VARIABLE_PATTERN = /\{\{(\w+)\}\}/g;

/** Body content type options for the request body editor */
export const BODY_CONTENT_TYPES = [
  {value: 'json', label: 'JSON', contentType: 'application/json'},
  {value: 'form-data', label: 'Form Data', contentType: 'multipart/form-data'},
  {value: 'x-www-form-urlencoded', label: 'URL Encoded', contentType: 'application/x-www-form-urlencoded'},
  {value: 'binary', label: 'Binary', contentType: 'application/octet-stream'},
  {value: 'none', label: 'None', contentType: ''},
] as const;
