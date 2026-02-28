import { useState } from 'react';
import {
  ChevronsLeft,
  ChevronsRight,
  Bug,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { CodeEditor } from '@/features/editor/components/CodeEditor';
import { useEditorStore } from '@/features/editor/store/editor.store';
import { useWorkbenchStore } from '@/stores/workbench-store';
import { useAutoValidation } from '@/features/editor/hooks/useSpectralValidation';
import type { ISpectralDiagnostic } from '@/core/events/event-types';

// ── Severity helpers ──────────────────────────────────────────────────────────

const SEVERITY_LABELS = ['Error', 'Warning', 'Info', 'Hint'] as const;
type SeverityLabel = typeof SEVERITY_LABELS[number];

function severityLabel(s: 0 | 1 | 2 | 3): SeverityLabel {
  return SEVERITY_LABELS[s];
}

function SeverityIcon({ severity }: { severity: 0 | 1 | 2 | 3 }) {
  if (severity === 0)
    return <AlertCircle className="w-3.5 h-3.5 shrink-0 text-destructive" />;
  if (severity === 1)
    return <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-yellow-500" />;
  return <Info className="w-3.5 h-3.5 shrink-0 text-blue-400" />;
}

// ── Issue Item ────────────────────────────────────────────────────────────────

function IssueItem({ diag }: { diag: ISpectralDiagnostic }) {
  const label = severityLabel(diag.severity);
  const line = diag.range.start.line + 1;
  const pathStr = diag.path.length > 0 ? diag.path.join(' › ') : null;

  return (
    <div className="px-4 py-3 border-b border-border/40 hover:bg-muted/20 transition-colors group">
      <div className="flex items-start gap-2">
        <SeverityIcon severity={diag.severity} />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-foreground/90 leading-snug">{diag.message}</p>
          {pathStr && (
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate font-mono">{pathStr}</p>
          )}
          <p className="text-[10px] text-muted-foreground mt-0.5">
            <span
              className={cn(
                'font-medium mr-1',
                diag.severity === 0 && 'text-destructive',
                diag.severity === 1 && 'text-yellow-500',
                diag.severity >= 2 && 'text-blue-400'
              )}
            >
              {label}
            </span>
            · Line {line} · {diag.code}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Issue Summary Counts ──────────────────────────────────────────────────────

function IssueSummary({ diagnostics }: { diagnostics: ISpectralDiagnostic[] }) {
  const errors = diagnostics.filter((d) => d.severity === 0).length;
  const warnings = diagnostics.filter((d) => d.severity === 1).length;
  const infos = diagnostics.filter((d) => d.severity >= 2).length;

  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      {errors > 0 && (
        <span className="flex items-center gap-1 text-destructive font-medium">
          <AlertCircle className="w-3 h-3" />
          {errors}
        </span>
      )}
      {warnings > 0 && (
        <span className="flex items-center gap-1 text-yellow-500 font-medium">
          <AlertTriangle className="w-3 h-3" />
          {warnings}
        </span>
      )}
      {infos > 0 && (
        <span className="flex items-center gap-1 text-blue-400 font-medium">
          <Info className="w-3 h-3" />
          {infos}
        </span>
      )}
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export function IdeWorkbench() {
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const content = useEditorStore((s) => s.content);
  const { diagnostics, isValidating, score } = useWorkbenchStore();

  // Auto-validate on content change (debounced)
  useAutoValidation();

  // Auto-detect language based on content
  const trimmed = content.trimStart();
  const currentLanguage: 'yaml' | 'json' =
    trimmed.startsWith('{') || trimmed.startsWith('[') ? 'json' : 'yaml';

  const errors = diagnostics.filter((d) => d.severity === 0).length;
  const hasIssues = diagnostics.length > 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background text-foreground">
      <div className="flex-1 flex overflow-hidden">

        {/* Center Editor */}
        <section className="flex-1 flex flex-col min-w-0 border-r border-border/60 bg-background/50">
          <div className="flex-1 relative overflow-hidden bg-background">
            <CodeEditor language={currentLanguage} />
          </div>
        </section>

        {/* Right Sidebar: Issues */}
        <aside
          className={cn(
            'border-l border-border/60 flex flex-col bg-muted/10 shrink-0 transition-all duration-200 overflow-hidden relative z-10',
            rightCollapsed ? 'w-10' : 'w-80 md:w-96'
          )}
        >
          {rightCollapsed ? (
            <div className="flex flex-col items-center py-3 gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={() => setRightCollapsed(false)}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Separator className="w-6 mx-auto bg-border/40" />
              <div className="flex flex-col gap-3 items-center">
                <Bug className="w-4 h-4 text-muted-foreground" />
                {errors > 0 && (
                  <span className="text-xs font-bold bg-destructive/10 text-destructive px-1 rounded-full">
                    {errors}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Issues Toolbar */}
              <div className="h-12 flex items-center justify-between px-4 shrink-0 bg-muted/20">
                <div className="flex items-center gap-2 font-normal text-foreground text-sm">
                  <Bug className="w-4 h-4 text-muted-foreground" />
                  Issues
                  {isValidating && (
                    <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                  )}
                  {!isValidating && hasIssues && (
                    <IssueSummary diagnostics={diagnostics} />
                  )}
                </div>
                <button
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => setRightCollapsed(true)}
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>

              {/* Issues Content */}
              <div className={cn('flex-1 overflow-hidden', hasIssues ? 'overflow-y-auto' : 'flex items-center justify-center p-8 bg-background/30')}>
                {isValidating && !hasIssues ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/40" />
                    <p className="text-muted-foreground text-sm italic text-center font-normal">
                      Validating spec…
                    </p>
                  </div>
                ) : !content ? (
                  <p className="text-muted-foreground text-sm italic text-center font-normal">
                    Paste a specification to start validation.
                  </p>
                ) : !hasIssues ? (
                  <div className="flex flex-col items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500/40" />
                    <p className="text-muted-foreground text-sm italic text-center font-normal">
                      All clear! No issues found.
                    </p>
                    {score < 100 && (
                      <p className="text-xs text-muted-foreground">Score: {score}/100</p>
                    )}
                  </div>
                ) : (
                  <div className="w-full">
                    {diagnostics.map((diag, i) => (
                      <IssueItem key={`${diag.code}-${i}`} diag={diag} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Footer / Status Bar */}
      <footer className="h-7 border-t border-border/60 bg-background flex items-center justify-between px-4 text-xs text-muted-foreground shrink-0 select-none">
        <div className="flex items-center gap-3">
          {isValidating ? (
            <span className="flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Validating…
            </span>
          ) : hasIssues ? (
            <span className="flex items-center gap-1">
              {errors > 0 ? (
                <AlertCircle className="w-3 h-3 text-destructive" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-yellow-500" />
              )}
              {errors > 0 ? `${errors} error${errors !== 1 ? 's' : ''}` : `${diagnostics.length - errors} warning${diagnostics.length - errors !== 1 ? 's' : ''}`}
            </span>
          ) : content ? (
            <span className="flex items-center gap-1 text-emerald-500/60">
              <CheckCircle2 className="w-3 h-3" />
              Valid · Score {score}/100
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-5">
          <span className="font-normal uppercase">UTF-8</span>
          <span className="font-medium text-foreground/70 uppercase">{currentLanguage}</span>
        </div>
      </footer>
    </div>
  );
}
