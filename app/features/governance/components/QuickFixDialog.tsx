/**
 * Quick Fix Dialog Component
 * Displays AI-generated fixes for OpenAPI spec diagnostics
 *
 * Features:
 * - Diff view showing before/after code
 * - AI explanation of the fix
 * - Confidence indicator
 * - Accept/reject actions
 */

import { X, Sparkles, Check, AlertCircle } from 'lucide-react';
import type { QuickFixResponse } from '@/features/ai-catalyst/services/openrouter-provider';
import type { ISpectralDiagnostic } from '@/core/events/event-types';
import { DiffViewer } from '@/features/diff/components/DiffViewer';

interface QuickFixDialogProps {
  open: boolean;
  onClose: () => void;
  diagnostic: ISpectralDiagnostic;
  quickFix: QuickFixResponse | null;
  isLoading: boolean;
  onAccept: () => void;
}

export function QuickFixDialog({
  open,
  onClose,
  diagnostic,
  quickFix,
  isLoading,
  onAccept,
}: QuickFixDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 max-w-4xl mx-auto bg-background border border-border rounded-lg shadow-2xl animate-scaleIn flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">AI Quick Fix</h2>
              <p className="text-sm text-muted-foreground">{diagnostic.code}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                <p className="text-sm text-muted-foreground">Generating fix with AI...</p>
              </div>
            </div>
          ) : quickFix ? (
            <div className="space-y-4">
              {/* Error Message */}
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-foreground mb-1">Diagnostic Issue</h3>
                    <p className="text-sm text-muted-foreground">{diagnostic.message}</p>
                  </div>
                </div>
              </div>

              {/* Explanation */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h3 className="font-medium text-foreground mb-2">AI Explanation</h3>
                <p className="text-sm text-muted-foreground">{quickFix.explanation}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Confidence:</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    quickFix.confidence === 'high' ? 'bg-green-500/20 text-green-500' :
                    quickFix.confidence === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                    'bg-red-500/20 text-red-500'
                  }`}>
                    {quickFix.confidence.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Diff View */}
              <div className="space-y-2">
                <h3 className="font-medium text-foreground">Proposed Changes</h3>
                <DiffViewer
                  oldContent={quickFix.originalCode}
                  newContent={quickFix.fixedCode}
                  oldLabel="Before"
                  newLabel="After"
                  language="yaml"
                  showStats={true}
                />
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">Failed to generate fix</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-card">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-md hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          {quickFix && !isLoading && (
            <button
              onClick={onAccept}
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Apply Fix
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
