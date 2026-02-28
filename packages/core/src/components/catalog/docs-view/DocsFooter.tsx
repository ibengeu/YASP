/**
 * DocsFooter - Simplified footer for documentation page
 */

import { useEffect, useState } from 'react';

export function DocsFooter() {
  const currentYear = new Date().getFullYear();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <footer className="h-14 border-t border-border bg-background/80 backdrop-blur-md flex items-center justify-center px-6 shrink-0">
      <div className="text-xs text-muted-foreground">
        © {currentYear} yasp
      </div>
    </footer>
  );
}
