/**
 * PersistentAnalysisSummary - Collapsible spec analysis summary
 *
 * Shows condensed view of spec analysis results that persists
 * across wizard steps after spec upload.
 */

import { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { InferredData } from '@/features/registration/utils/spec-inference';

export interface PersistentAnalysisSummaryProps {
  inferredData: InferredData;
  currentStep: number;
  className?: string;
}

export function PersistentAnalysisSummary({ inferredData, currentStep, className }: PersistentAnalysisSummaryProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Only show after Step 1
  if (currentStep <= 1) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-medium">
            Spec analyzed: {inferredData.fieldsPopulated}/{inferredData.totalFields} fields auto-filled
          </span>
          <Badge variant="outline" className="text-xs">
            {inferredData.confidence} confidence
          </Badge>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {showDetails && (
        <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <span>📋</span>
            <span>{inferredData.endpointCount} endpoints</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🔐</span>
            <span>{inferredData.auth?.type || 'No auth'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🌐</span>
            <span>{inferredData.servers.length} servers</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🏷️</span>
            <span>{inferredData.tags.length} tags</span>
          </div>
        </div>
      )}
    </div>
  );
}
