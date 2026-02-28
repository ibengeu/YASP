import { useNavigate, useLocation, Link } from 'react-router';
import { Moon, Sun, Menu, Share2, Play, Upload, Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/features/editor/store/editor.store';
import { useWorkbenchStore } from '@/stores/workbench-store';
import { useSpectralValidation } from '@/features/editor/hooks/useSpectralValidation';

interface WorkbenchHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenRegister: () => void;
  onJoinBeta: () => void;
  activeView?: 'collections' | 'workbench';
}

export function WorkbenchHeader({
  onOpenRegister,
  activeView,
}: WorkbenchHeaderProps) {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const content = useEditorStore((s) => s.content);
  const { isValidating } = useWorkbenchStore();
  const { validate } = useSpectralValidation();

  // Detect language for export filename
  const trimmed = content.trimStart();
  const isJson = trimmed.startsWith('{') || trimmed.startsWith('[');

  function handleValidate() {
    validate(content);
  }

  function handleExport() {
    if (!content.trim()) return;
    const ext = isJson ? 'json' : 'yaml';
    const mimeType = isJson ? 'application/json' : 'text/yaml';
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `openapi-spec.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // OWASP A04:2025 – revoke object URL to avoid memory leak
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  const isActive = (path: string) => location.pathname.startsWith(path);

  // Constants for sliding indicator to ensure alignment with text
  const NAV_ITEM_WIDTH = 100;
  const NAV_GAP = 4;

  return (
    <header className="h-14 border-b border-border/60 bg-background/95 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-5 shrink-0">
      {/* Left: Logo + Nav */}
      <div className="flex items-center gap-8 h-full">
        <div 
          className="flex items-center gap-2.5 text-lg tracking-tight font-medium text-foreground select-none cursor-pointer group"
          onClick={() => navigate('/')}
        >
          <div className="bg-primary text-primary-foreground text-xs leading-none px-1.5 py-1 rounded-sm font-semibold tracking-wider transition-colors group-hover:bg-primary/90 scale-90">
            OAS
          </div>
          <span className="font-semibold">YASP</span>
        </div>

        <nav className="flex items-center gap-1 h-full relative">
          <Link
            to="/catalog"
            style={{ width: `${NAV_ITEM_WIDTH}px` }}
            className={cn(
              "text-sm transition-colors font-normal cursor-pointer relative z-10 h-full flex items-center justify-center",
              isActive('/catalog') 
                ? "text-foreground font-medium" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Collections
          </Link>
          <Link
            to="/workbench"
            style={{ width: `${NAV_ITEM_WIDTH}px` }}
            className={cn(
              "text-sm transition-colors font-normal cursor-pointer relative z-10 h-full flex items-center justify-center",
              isActive('/workbench') 
                ? "text-foreground font-medium" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Workbench
          </Link>
          
          {/* Sliding Indicator - precisely aligned with text (inset 12px) */}
          <div 
            className="absolute bottom-0 h-px bg-primary transition-all duration-300 ease-out shadow-[0_0_8px_rgba(var(--primary),0.4)]"
            style={{
              left: isActive('/catalog') ? '12px' : `${NAV_ITEM_WIDTH + NAV_GAP + 12}px`,
              width: `${NAV_ITEM_WIDTH - 24}px`
            }}
          />
        </nav>
      </div>

      {/* Right: Contextual Actions + Theme Toggle + Menu */}
      <div className="flex items-center gap-4">
        {/* Contextual Tools */}
        <div className="flex items-center gap-2 pr-2 border-r border-border/40">
          {activeView === 'workbench' ? (
            <div className="flex items-center gap-1">
              <button
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-normal cursor-pointer group rounded-md hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={handleExport}
                disabled={!content.trim()}
              >
                <Share2 className="w-3.5 h-3.5 group-hover:text-foreground transition-colors" />
                Export
              </button>

              <button
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-normal cursor-pointer group rounded-md hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={handleValidate}
                disabled={isValidating || !content.trim()}
              >
                {isValidating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 group-hover:text-foreground transition-colors" />
                )}
                {isValidating ? 'Validating…' : 'Validate'}
              </button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenRegister}
              className="gap-2 text-muted-foreground hover:text-foreground cursor-pointer font-normal hover:bg-muted h-9"
            >
              <Upload className="w-4 h-4" />
              Import Collection
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-foreground transition-colors relative cursor-pointer hover:bg-muted"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Toggle theme</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground lg:hidden cursor-pointer hover:bg-muted">
            <Menu className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
