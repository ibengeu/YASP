import { useNavigate, useLocation } from 'react-router';
import { Upload, Sparkles, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface WorkbenchHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenRegister: () => void;
  onJoinBeta: () => void;
}

export function WorkbenchHeader({
  onOpenRegister,
  onJoinBeta,
}: WorkbenchHeaderProps) {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (to: string, e: React.MouseEvent) => {
    e.preventDefault();
    navigate(to);
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-6 shrink-0">
      {/* Left: Logo + Navigation */}
      <div className="flex items-center gap-10">
        <div 
          className="flex items-center gap-2 select-none cursor-pointer group"
          onClick={() => navigate('/')}
        >
          <div className="w-6 h-6 bg-foreground rounded flex items-center justify-center group-hover:bg-primary transition-colors">
            <span className="text-background text-[10px] font-bold tracking-tighter">
              OAS
            </span>
          </div>
          <span className="tracking-tighter font-bold text-lg leading-none text-foreground hidden sm:inline">
            YASP
          </span>
        </div>

        <nav className="flex items-center gap-8">
          <a
            href="/catalog"
            onClick={(e) => handleNavigate('/catalog', e)}
            className={cn(
              "text-sm font-medium transition-all hover:text-foreground relative py-1",
              isActive('/catalog') 
                ? "text-foreground font-semibold" 
                : "text-muted-foreground"
            )}
          >
            Collections
            {isActive('/catalog') && (
              <div className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </a>
          <a
            href="/workbench"
            onClick={(e) => handleNavigate('/workbench', e)}
            className={cn(
              "text-sm font-medium transition-all hover:text-foreground relative py-1",
              isActive('/workbench') 
                ? "text-foreground font-semibold" 
                : "text-muted-foreground"
            )}
          >
            Workbench
            {isActive('/workbench') && (
              <div className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </a>
        </nav>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        <Separator orientation="vertical" className="h-4 hidden sm:block" />
        {/* Join Beta — shadcn Button with reduced opacity */}
        <Button
          variant="outline"
          size="sm"
          onClick={onJoinBeta}
          className="gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground border-border hover:border-foreground/50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Join Beta
        </Button>

        {/* Import — shadcn Button primary */}
        <Button
          size="sm"
          onClick={onOpenRegister}
          className="gap-1.5 cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          Import
        </Button>

        <Separator orientation="vertical" className="h-4" />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors relative cursor-pointer"
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
      </div>
    </header>
  );
}
