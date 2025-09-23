import React from 'react';
import { AppHeader, AppView } from './AppHeader';
import { WorkspaceBreadcrumb } from '../workspace/WorkspaceBreadcrumb';
import { User } from '../auth/types';

/**
 * Carbon Design System App Layout
 * 
 * Provides consistent layout structure with:
 * - Global header
 * - Optional breadcrumb navigation
 * - Main content area with proper spacing
 * - Responsive behavior
 */

interface AppLayoutProps {
  currentUser: User | null;
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
  onCreateWorkspace: () => void;
  children: React.ReactNode;
  showBreadcrumb?: boolean;
  breadcrumbCurrentPage?: 'dashboard' | 'catalog' | 'explorer' | 'settings';
  onBreadcrumbNavigate?: (path: string) => void;
  className?: string;
}

export function AppLayout({
  currentUser,
  currentView,
  onNavigate,
  onLogout,
  onCreateWorkspace,
  children,
  showBreadcrumb = false,
  breadcrumbCurrentPage,
  onBreadcrumbNavigate,
  className = '',
}: AppLayoutProps) {
  const isAuthenticatedView = currentUser && currentView !== 'landing' && currentView !== 'auth';

  return (
    <div className={`flex min-h-screen flex-col ${className}`}>
      {/* Global Header - Full Width */}
      <AppHeader
        currentUser={currentUser}
        currentView={currentView}
        onNavigate={onNavigate}
        onLogout={onLogout}
        onCreateWorkspace={onCreateWorkspace}
        className="w-full"
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Breadcrumb Navigation (for workspace pages) */}
        {isAuthenticatedView && showBreadcrumb && breadcrumbCurrentPage && onBreadcrumbNavigate && (
          <div className="border-b border-border bg-background">
            <div className="px-6 py-4">
              <WorkspaceBreadcrumb
                currentPage={breadcrumbCurrentPage}
                onNavigate={onBreadcrumbNavigate}
              />
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}

/**
 * Page Container Component
 * 
 * Provides consistent content spacing and structure
 */
interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export function PageContainer({
  children,
  className = '',
  maxWidth = '7xl',
  padding = 'md',
  fullWidth = false,
}: PageContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div className={`w-full ${fullWidth ? '' : `mx-auto ${maxWidthClasses[maxWidth]}`} ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
}

/**
 * Section Component
 * 
 * Provides consistent section spacing following Carbon 8px grid
 */
interface SectionProps {
  children: React.ReactNode;
  className?: string;
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Section({
  children,
  className = '',
  spacing = 'md',
}: SectionProps) {
  const spacingClasses = {
    sm: 'py-4', // 16px
    md: 'py-6', // 24px  
    lg: 'py-8', // 32px
    xl: 'py-12', // 48px
  };

  return (
    <section className={`${spacingClasses[spacing]} ${className}`}>
      {children}
    </section>
  );
}