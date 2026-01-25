/**
 * Diagnostics Panel Component
 * Linear-inspired panel for displaying linting diagnostics
 *
 * Architecture: SRS_02 § 2.3.1 - Diagnostics Panel Component
 * Design: Linear's surgical minimalism with precise spacing
 */

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, AlertCircle, AlertTriangle, Info, Check } from 'lucide-react';
import type { ISpectralDiagnostic } from '@/core/events/event-types';

interface DiagnosticsPanelProps {
  diagnostics: ISpectralDiagnostic[];
  onJumpToIssue: (diagnostic: ISpectralDiagnostic) => void;
  isOpen?: boolean;
}

const SEVERITY_CONFIG = {
  0: {
    label: 'Errors',
    icon: AlertCircle,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
  1: {
    label: 'Warnings',
    icon: AlertTriangle,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  2: {
    label: 'Info',
    icon: Info,
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  3: {
    label: 'Hints',
    icon: Info,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/10',
  },
};

export function DiagnosticsPanel({
  diagnostics,
  onJumpToIssue,
  isOpen: initialIsOpen = true,
}: DiagnosticsPanelProps) {
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const panelRef = useRef<HTMLDivElement>(null);

  // Group diagnostics by severity
  const groupedDiagnostics = diagnostics.reduce(
    (acc, diagnostic) => {
      const severity = diagnostic.severity;
      if (!acc[severity]) acc[severity] = [];
      acc[severity].push(diagnostic);
      return acc;
    },
    {} as Record<number, ISpectralDiagnostic[]>
  );

  // Flatten for keyboard navigation
  const flatDiagnostics = Object.values(groupedDiagnostics).flat();

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || flatDiagnostics.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < flatDiagnostics.length - 1 ? prev + 1 : prev
          );
          break;

        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;

        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < flatDiagnostics.length) {
            onJumpToIssue(flatDiagnostics[selectedIndex]);
          }
          break;

        case 'Escape':
          setIsOpen(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, flatDiagnostics, onJumpToIssue]);

  // Auto-focus selected item
  useEffect(() => {
    if (selectedIndex >= 0) {
      const buttons = panelRef.current?.querySelectorAll('[data-diagnostic-index]');
      const button = buttons?.[selectedIndex] as HTMLButtonElement;
      button?.focus();
    }
  }, [selectedIndex]);

  const totalCount = diagnostics.length;
  const errorCount = groupedDiagnostics[0]?.length || 0;
  const warningCount = groupedDiagnostics[1]?.length || 0;
  const infoCount = groupedDiagnostics[2]?.length || 0;

  return (
    <div
      ref={panelRef}
      role="region"
      aria-label="Diagnostics"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card shadow-lg"
      style={{
        transition: 'transform 0.2s ease-out',
        transform: isOpen ? 'translateY(0)' : 'translateY(calc(100% - 40px))',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-6 py-3 text-left hover:bg-muted/50 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-card-foreground">
            Diagnostics
          </span>

          {totalCount > 0 && (
            <div className="flex items-center gap-2 text-xs">
              {errorCount > 0 && (
                <span className="flex items-center gap-1 text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errorCount}
                </span>
              )}
              {warningCount > 0 && (
                <span className="flex items-center gap-1 text-warning">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {warningCount}
                </span>
              )}
              {infoCount > 0 && (
                <span className="flex items-center gap-1 text-info">
                  <Info className="h-3.5 w-3.5" />
                  {infoCount}
                </span>
              )}
            </div>
          )}

          {totalCount === 0 && (
            <span className="flex items-center gap-1.5 text-xs text-success">
              <Check className="h-3.5 w-3.5" />
              No issues found
            </span>
          )}
        </div>

        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Content */}
      {isOpen && (
        <div className="max-h-96 overflow-y-auto border-t border-border">
          {totalCount === 0 ? (
            <EmptyState />
          ) : (
            <div className="divide-y divide-border">
              {([0, 1, 2, 3] as const).map((severity) => {
                const diagnosticsForSeverity = groupedDiagnostics[severity];
                if (!diagnosticsForSeverity || diagnosticsForSeverity.length === 0) {
                  return null;
                }

                const config = SEVERITY_CONFIG[severity];
                const Icon = config.icon;

                return (
                  <div key={severity} className="px-6 py-4">
                    {/* Severity Group Header */}
                    <div className="mb-3 flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${config.color}`} />
                      <span className="text-sm font-semibold text-card-foreground">
                        {config.label}
                      </span>
                      <span className={`ml-auto rounded-sm px-2 py-0.5 text-xs font-medium ${config.bgColor} ${config.color}`}>
                        {diagnosticsForSeverity.length}
                      </span>
                    </div>

                    {/* Diagnostic Items */}
                    <div className="space-y-2">
                      {diagnosticsForSeverity.map((diagnostic, index) => {
                        const globalIndex = flatDiagnostics.indexOf(diagnostic);

                        return (
                          <DiagnosticItem
                            key={`${diagnostic.code}-${index}`}
                            diagnostic={diagnostic}
                            severity={severity}
                            isSelected={selectedIndex === globalIndex}
                            dataIndex={globalIndex}
                            onClick={() => {
                              setSelectedIndex(globalIndex);
                              onJumpToIssue(diagnostic);
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==================== Sub-Components ====================

function DiagnosticItem({
  diagnostic,
  severity,
  isSelected,
  dataIndex,
  onClick,
}: {
  diagnostic: ISpectralDiagnostic;
  severity: number;
  isSelected: boolean;
  dataIndex: number;
  onClick: () => void;
}) {
  const config = SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG];

  return (
    <button
      data-diagnostic-index={dataIndex}
      onClick={onClick}
      className={`group w-full rounded-md border p-3 text-left transition-all ${
        isSelected
          ? 'border-ring bg-accent shadow-sm'
          : 'border-transparent hover:border-border hover:bg-muted/50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded ${config.bgColor}`}>
          <div className={`h-1.5 w-1.5 rounded-full ${config.color.replace('text-', 'bg-')}`} />
        </div>

        <div className="flex-1 space-y-1">
          {/* Message */}
          <p className="text-sm font-medium text-card-foreground group-hover:text-primary transition-colors">
            {diagnostic.message}
          </p>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="font-mono">{diagnostic.code}</span>
            <span>•</span>
            <span>Line {diagnostic.range.start.line}</span>
            <span>•</span>
            <span className="font-mono">
              {diagnostic.path.join(' → ')}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
        <Check className="h-6 w-6 text-success" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-card-foreground">
        No issues found
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Your API specification passes all validation rules
      </p>
    </div>
  );
}
