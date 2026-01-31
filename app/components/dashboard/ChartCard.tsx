import type { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  children: ReactNode;
}

/**
 * ChartCard Component
 * Card wrapper for Recharts and other visualizations
 * Features:
 * - Title header
 * - Responsive container
 * - Consistent card styling
 */
export function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-border p-5">
      <h3 className="text-base font-semibold text-card-foreground mb-4">
        {title}
      </h3>
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}
