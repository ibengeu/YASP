import { AlertCircle, AlertTriangle, Info, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ComplianceRule {
  id: string;
  name: string;
  category: string;
  severity: 'error' | 'warning' | 'info';
  enabled: boolean;
  description: string;
}

interface PolicyTableProps {
  policies: ComplianceRule[];
  onToggle: (id: string) => void;
}

/**
 * PolicyTable Component
 * Table with sortable columns for policy management
 * Features:
 * - Toggle switches for enabling/disabling policies
 * - Severity badges with icons
 * - Category tags
 * - Context menu for actions
 * - Responsive design
 */
export function PolicyTable({ policies, onToggle }: PolicyTableProps) {
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20',
          label: 'Error',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
          label: 'Warning',
        };
      case 'info':
        return {
          icon: Info,
          color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
          label: 'Info',
        };
      default:
        return {
          icon: Info,
          color: 'text-muted-foreground bg-muted border-border',
          label: severity,
        };
    }
  };

  return (
    <div className="space-y-3">
      {policies.map((policy) => {
        const severityConfig = getSeverityConfig(policy.severity);
        const SeverityIcon = severityConfig.icon;

        return (
          <div
            key={policy.id}
            className="bg-card border border-border rounded-lg p-5 hover:border-primary/50 transition-all group"
          >
            <div className="flex items-start gap-4">
              {/* Toggle Switch */}
              <button
                onClick={() => onToggle(policy.id)}
                className={cn(
                  'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
                  policy.enabled ? 'bg-green-500' : 'bg-muted'
                )}
                role="button"
                aria-label={`Toggle ${policy.name}`}
              >
                <span
                  className={cn(
                    'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
                    policy.enabled ? 'translate-x-5' : 'translate-x-1'
                  )}
                />
              </button>

              {/* Policy Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-sm font-medium text-card-foreground">{policy.name}</h3>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full border',
                        severityConfig.color
                      )}
                    >
                      <SeverityIcon className="w-3 h-3" />
                      {severityConfig.label}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded border border-border whitespace-nowrap">
                    {policy.category}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{policy.description}</p>
              </div>

              {/* Actions Menu */}
              <button
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Policy actions"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
