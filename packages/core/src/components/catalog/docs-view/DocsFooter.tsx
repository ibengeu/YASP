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
    <footer className="h-14 border-t border-border bg-background/80 backdrop-blur-md flex items-center justify-center gap-6 px-6 shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-foreground">YASP</span>
      </div>

      <div className="text-xs text-muted-foreground">
        © {currentYear} YASP
      </div>
    </footer>
  );
}
