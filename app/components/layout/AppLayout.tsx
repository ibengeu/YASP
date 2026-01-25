/**
 * App Layout Component
 * Main layout wrapper with navigation and content area
 */

import { ReactNode } from 'react';
import { AppNavigation, type User } from './AppNavigation';

export interface AppLayoutProps {
  children: ReactNode;
  user?: User;
  maxWidth?: string;
  padding?: boolean;
}

export function AppLayout({
  children,
  user,
  maxWidth = 'max-w-7xl',
  padding = true,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppNavigation user={user} />

      <main
        className={`mx-auto ${maxWidth} ${
          padding ? 'px-6 py-8' : ''
        } bg-background text-foreground`}
      >
        {children}
      </main>
    </div>
  );
}
