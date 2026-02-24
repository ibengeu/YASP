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

  return (
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-6 shrink-0">
      {/* Left: Logo + Breadcrumb */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 select-none cursor-pointer">
          <span className="tracking-tighter font-bold text-xl leading-none text-foreground">
            YASP
          </span>
        </div>

        <Separator orientation="vertical" className="h-4" />

        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="text-foreground text-sm">API Catalog</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
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
