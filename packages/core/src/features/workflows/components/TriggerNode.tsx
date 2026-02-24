/**
 * TriggerNode - Fixed trigger card at top of every workflow canvas
 * Glass morphism style with primary accent, not draggable or removable
 */

import { Zap } from 'lucide-react';

export function TriggerNode() {
  return (
    <div className="w-full max-w-md">
      <div className="glass-panel rounded-xl border-l-4 border-l-primary p-4 flex items-center gap-3 hover:border-border transition-all cursor-pointer">
        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
          <Zap className="w-5 h-5 text-primary" />
        </div>
        <div>
          <span className="text-xs font-mono font-medium text-primary uppercase tracking-wider">
            Trigger
          </span>
          <p className="text-sm font-medium text-foreground">Manual Trigger</p>
        </div>
      </div>
    </div>
  );
}
