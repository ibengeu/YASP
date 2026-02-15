/**
 * StepConnector - Vertical connector line between workflow steps
 * Shows a hover-activated "+" button to insert a new step
 */

import { Plus } from 'lucide-react';

interface StepConnectorProps {
  onAddClick?: () => void;
}

export function StepConnector({ onAddClick }: StepConnectorProps) {
  return (
    <div className="flex flex-col items-center py-1 group/connector">
      {/* Top line segment */}
      <div className="w-px h-3 bg-border" />

      {/* Add button on hover */}
      {onAddClick ? (
        <button
          onClick={onAddClick}
          className="w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center
            opacity-0 group-hover/connector:opacity-100 scale-75 group-hover/connector:scale-100
            transition-all duration-200
            hover:border-primary hover:text-primary text-muted-foreground"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      ) : (
        <div className="w-px h-2 bg-border" />
      )}

      {/* Bottom line segment */}
      <div className="w-px h-3 bg-border" />
    </div>
  );
}
