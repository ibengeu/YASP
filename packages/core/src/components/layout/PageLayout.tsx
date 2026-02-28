/**
 * PageLayout - Wraps content with header and footer
 * Provides consistent layout structure across all pages
 */

import { ReactNode, useEffect, useState } from 'react';
import { WorkbenchHeader } from '@/components/workbench/WorkbenchHeader';

interface PageLayoutProps {
  children: ReactNode;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onOpenRegister?: () => void;
  onJoinBeta?: () => void;
}

interface PageLayoutPropsWithView extends PageLayoutProps {
  activeView?: 'collections' | 'workbench';
}

export function PageLayout({
  children,
  searchQuery = '',
  onSearchChange = () => {},
  onOpenRegister = () => {},
  onJoinBeta = () => {},
  activeView = 'collections',
}: PageLayoutPropsWithView) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <WorkbenchHeader
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onOpenRegister={onOpenRegister}
        onJoinBeta={onJoinBeta}
        activeView={activeView}
      />

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>

      {/* Footer - Hidden in workbench mode as it has its own status bar */}
      {activeView !== 'workbench' && <Footer />}
    </div>
  );
}

function Footer() {
  const currentYear = new Date().getFullYear();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <footer className="h-14 border-t border-border/60 bg-background/80 backdrop-blur-md flex items-center justify-center px-6 shrink-0">
      {/* Right: Year */}
      <div className="text-xs text-muted-foreground">
        © {currentYear} yasp
      </div>
    </footer>
  );
}
