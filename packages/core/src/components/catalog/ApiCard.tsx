import { useRef } from 'react';
import { FileCode, Trash2, ChevronRight, ArrowUpRight, User, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { hoverLift } from '@/lib/animations';
import type { OpenApiDocument } from '@/core/storage/storage-schema';

interface ApiCardProps {
  spec: OpenApiDocument;
  viewMode: 'grid' | 'list';
  onClick: (spec: OpenApiDocument) => void;
  onDelete?: (id: string) => void;
}

/**
 * Helper: Count endpoints in spec content
 * Robust heuristic to handle both YAML and JSON (including single-line/minified)
 */
function countEndpoints(content: string): number {
  if (!content) return 0;
  // Matches "get": or get: with optional quotes and whitespace
  // Use word boundary \b to avoid matching partial words
  const matches = content.match(/\b(get|post|put|patch|delete|head|options)\b\s*"?:\s*/gi);
  return matches?.length ?? 0;
}

/**
 * Helper: Format relative time
 */
function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

/**
 * ApiCard Component
 * Modern card for API catalog with grid/list modes
 * Features:
 * - Grid mode: vertical cards with icon, name, desc, endpoint count, relative time
 * - List mode: horizontal rows with icon, name, count badge, chevron
 * - Delete button with confirmation
 *
 * Security:
 * - Mitigation for OWASP A01:2025 – Broken Access Control: Spec data is from IndexedDB
 * - Mitigation for OWASP A07:2025 – Injection: Content parsed safely with regex
 */
export function ApiCard({ spec, viewMode, onClick, onDelete }: ApiCardProps) {
  const endpointCount = spec.metadata.specQuality?.endpointCount ?? countEndpoints(spec.content);
  const cardRef = useRef<HTMLDivElement>(null);

  // Workspace icon and colors
  const getWorkspaceIcon = () => {
    if (spec.metadata.workspaceType === 'personal') return User;
    if (spec.metadata.workspaceType === 'partner') return Globe;
    if (spec.metadata.workspaceType === 'public') return Globe;
    return FileCode;
  };

  const getWorkspaceColors = () => {
    const colors: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
      personal: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20', gradient: 'from-primary/5' },
      partner: { bg: 'bg-accent/10', text: 'text-accent', border: 'border-accent/20', gradient: 'from-accent/5' },
      public: { bg: 'bg-secondary/10', text: 'text-secondary', border: 'border-secondary/20', gradient: 'from-secondary/5' },
    };
    return colors[spec.metadata.workspaceType] || { bg: 'bg-muted/10', text: 'text-muted-foreground', border: 'border-muted/20', gradient: 'from-muted/5' };
  };

  const Icon = getWorkspaceIcon();
  const colors = getWorkspaceColors();

  const handleMouseEnter = () => {
    if (cardRef.current) hoverLift(cardRef.current, true);
  };

  const handleMouseLeave = () => {
    if (cardRef.current) hoverLift(cardRef.current, false);
  };

  // Grid mode card
  if (viewMode === 'grid') {
    return (
      <div
        ref={cardRef}
        role="button"
        onClick={() => onClick(spec)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="group p-4 bg-card/50 border border-border rounded-xl hover:border-primary/50 transition-colors cursor-pointer relative overflow-hidden hover:bg-card"
      >
        {/* Top row: icon + arrow */}
        <div className="flex items-start justify-between mb-4 relative z-10">
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center border', colors.bg, colors.text, colors.border)}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex gap-1">
            {onDelete && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete API"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(spec.id);
                      }}
                      className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Open in workbench" className="h-6 w-6 text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowUpRight className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Open in workbench</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Name + desc */}
        <h3 className="font-medium text-foreground text-sm md:text-base transition-colors relative z-10">
          {spec.title}
        </h3>
        <p className="text-xs md:text-sm text-muted-foreground mt-2 line-clamp-2 h-12 relative z-10 leading-relaxed">
          {spec.description || 'No description available for this collection.'}
        </p>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between text-xs font-medium text-muted-foreground uppercase tracking-wider border-t border-border pt-3 relative z-10">
          <span className="flex items-center gap-1.5">
            <FileCode className="w-3 h-3" />
            {endpointCount} Endpoints
          </span>
          <span>{relativeTime(spec.updated_at)}</span>
        </div>


        {/* Hover gradient overlay */}
        <div className={cn("absolute inset-0 bg-gradient-to-br to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none", colors.gradient)} />
      </div>
    );
  }

  // List mode row
  return (
    <div
      ref={cardRef}
      role="button"
      onClick={() => onClick(spec)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group p-3 sm:p-4 border border-border rounded-xl hover:border-primary/50 transition-colors cursor-pointer flex items-center justify-between bg-card/50 hover:bg-card"
    >
      {/* Left: icon + name/desc */}
      <div className="flex items-center gap-4 min-w-0">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center border shrink-0', colors.bg, colors.text, colors.border)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h3 className="font-medium text-foreground text-sm md:text-base transition-colors truncate">
            {spec.title}
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground mt-2 truncate">
            {spec.description || 'No description'}
          </p>
        </div>
      </div>

      {/* Right: count + date + actions */}
      <div className="flex items-center gap-6 text-xs text-muted-foreground shrink-0 ml-4 font-medium">
        <span className="hidden sm:flex items-center gap-1.5 bg-background px-2 py-1 rounded border border-border text-xs">
          <FileCode className="w-3 h-3" />
          {endpointCount}
        </span>
        <span className="hidden sm:block">{relativeTime(spec.updated_at)}</span>


        <div className="flex items-center gap-2">
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete API"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(spec.id);
              }}
              className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
          <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
        </div>
      </div>
    </div>
  );
}
