import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  extraContent?: ReactNode;
}

/**
 * PageHeader component for consistent page headers across the app
 * Provides title, description, optional actions, and extra content row
 */
export function PageHeader({ title, description, actions, extraContent }: PageHeaderProps) {
  return (
    <div className="bg-card border-b border-border">
      <div className="px-4 md:px-6 lg:px-8 py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold text-card-foreground tracking-tight">
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
        {extraContent && (
          <div className="mt-4">
            {extraContent}
          </div>
        )}
      </div>
    </div>
  );
}
