/**
 * DocsSidebar - Navigation sidebar for documentation page
 * Includes Guides, API Reference (grouped), and Data Models
 */

import { Box, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMethodColor } from '@/lib/constants';
import { Input } from '@/components/ui/input';
import type { ParsedEndpoint, EndpointGroup, SchemaEntry } from './types';

interface DocsSidebarProps {
  groups: EndpointGroup[];
  selectedEndpoint: ParsedEndpoint | null;
  onSelectEndpoint: (endpoint: ParsedEndpoint) => void;
  dataModels: SchemaEntry[];
  filterQuery: string;
  setFilterQuery: (query: string) => void;
  selectedModel?: SchemaEntry | null;
  onSelectModel?: (entry: SchemaEntry) => void;
}

export function DocsSidebar({
  groups,
  selectedEndpoint,
  onSelectEndpoint,
  dataModels,
  filterQuery,
  setFilterQuery,
  selectedModel,
  onSelectModel,
  className,
}: DocsSidebarProps & { className?: string }) {
  return (
    <aside className={cn("w-64 border-r border-border bg-transparent overflow-y-auto shrink-0 pt-6 pb-12 fade-bottom", className)}>
      <nav className="px-4 space-y-8" aria-label="Sidebar Navigation">
        {/* Search */}
        <div className="relative group px-2">
           <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-3.5 h-3.5 z-10" />
           <Input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search docs..."
            className="w-full bg-background/50 border-border text-sm pl-8 h-8.5 focus-visible:ring-primary/20 transition-colors"
          />
        </div>

        {/* Reference Section */}
        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-2 opacity-70">
            API Reference
          </h3>
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.tag}>
                <div className="flex items-center justify-between px-2 py-1 mb-1">
                  <h4 className="text-sm font-bold text-foreground">
                    {group.tag}
                  </h4>
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-bold">
                    {group.count}
                  </span>
                </div>
                <ul className="mt-1 space-y-0.5 border-l border-border ml-3 pl-2">
                  {group.endpoints.map((endpoint) => {
                    const isSelected =
                      selectedEndpoint?.path === endpoint.path &&
                      selectedEndpoint?.method === endpoint.method;
                    const methodColor = getMethodColor(endpoint.method);

                    return (
                      <li key={`${endpoint.method}-${endpoint.path}`}>
                        <button
                          onClick={() => onSelectEndpoint(endpoint)}
                          className={cn(
                            "w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-md transition-colors cursor-pointer",
                            isSelected
                              ? "text-primary bg-primary/10 font-bold"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium"
                          )}
                        >
                          <span className="truncate flex-1 text-left">{endpoint.summary || endpoint.path.split('/').pop()}</span>
                          <span
                            className={cn(
                              "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-current opacity-80 ml-2 uppercase tracking-tighter scale-90 origin-right",
                              methodColor.text
                            )}
                          >
                            {endpoint.method}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Data Models */}
        {dataModels.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-2 opacity-70">
              Data Models
            </h3>
            <ul className="space-y-0.5 border-l border-border ml-3 pl-2">
              {dataModels.map((entry) => {
                const isSelected = selectedModel?.name === entry.name;
                return (
                  <li key={entry.name}>
                    {/* Mitigation for OWASP A01:2025 – Broken Access Control: Using button instead of
                        anchor prevents unintended navigation; model selection stays client-side only */}
                    <button
                      onClick={() => onSelectModel?.(entry)}
                      className={cn(
                        "flex items-center gap-2 w-full px-2 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer",
                        isSelected
                          ? "text-primary bg-primary/10 font-bold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <Box className="w-4 h-4 text-muted-foreground/70 shrink-0" />
                      {entry.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </nav>
    </aside>
  );
}
