import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OperationObject } from '@/types/openapi-spec';
import { TryItOut } from '@/features/api-explorer/components/TryItOut';

interface TryItOutDrawerProps {
  open: boolean;
  onClose: () => void;
  operation: OperationObject;
  path: string;
  method: string;
  baseUrl: string;
}

/**
 * TryItOutDrawer Component
 * Drawer that slides in from right for API testing
 * Features:
 * - Slides in from right with animation
 * - Method badge (GET/POST/PUT/DELETE)
 * - Full TryItOut component integration
 * - Close button and backdrop
 * - Responsive design
 *
 * Security:
 * - Mitigation for OWASP A09:2025 – SSRF: API requests are validated in TryItOut component
 * - Mitigation for OWASP A07:2025 – Injection: Input is sanitized before sending requests
 */
export function TryItOutDrawer({
  open,
  onClose,
  operation,
  path,
  method,
  baseUrl,
}: TryItOutDrawerProps) {
  if (!open) return null;

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'POST':
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
      case 'PUT':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'DELETE':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      case 'PATCH':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 animate-fadeIn"
        style={{ zIndex: 'var(--z-modal-backdrop)' }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="fixed top-0 right-0 bottom-0 w-full md:w-2/3 lg:w-1/2 bg-background border-l border-border overflow-y-auto animate-slideInRight"
        style={{ zIndex: 'var(--z-modal)' }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-start justify-between gap-4"
             style={{ zIndex: 'var(--z-sticky)' }}>
          <div className="flex-1 min-w-0">
            <h2 id="drawer-title" className="text-xl font-semibold text-card-foreground mb-2">
              Test API
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  'px-2 py-0.5 rounded text-xs font-semibold border uppercase',
                  getMethodColor(method)
                )}
              >
                {method}
              </span>
              <code className="text-sm text-muted-foreground font-mono">{path}</code>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <TryItOut
            operation={operation}
            path={path}
            method={method}
            baseUrl={baseUrl}
          />
        </div>
      </div>
    </>
  );
}
