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
  if (score >= SCORE_THRESHOLDS.excellent) return 'bg-emerald-500';
  if (score >= SCORE_THRESHOLDS.good) return 'bg-amber-500';
  return 'bg-destructive';
}

/** Workspace type badge color classes */
export const WORKSPACE_TYPE_COLORS: Record<string, string> = {
  team: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  partner: 'bg-secondary/10 text-secondary border-secondary/20',
  public: 'bg-accent/20 text-accent-foreground border-accent-foreground/20',
  personal: 'bg-muted text-muted-foreground border-border',
};

/** Returns workspace badge color, defaulting to personal */
export function getWorkspaceColor(type: string): string {
  return WORKSPACE_TYPE_COLORS[type] || WORKSPACE_TYPE_COLORS.personal;
}

/** HTTP method color classes (bg, text, border) */
export const HTTP_METHOD_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  get: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30' },
  post: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30' },
  put: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30' },
  patch: { bg: 'bg-secondary/10', text: 'text-secondary', border: 'border-secondary/30' },
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
