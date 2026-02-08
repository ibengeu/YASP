/**
 * EndpointSidebar - Shared endpoint navigation sidebar
 * Used in both the editor page (flat list) and ApiDetailDrawer (grouped with search)
 */

import { useState, useEffect, useMemo } from 'react';
import { Search, Folder, FolderOpen } from 'lucide-react';
import { getMethodColor } from '@/lib/constants';
import type { PathItemObject, OperationObject } from '@/types/openapi-spec';

const HTTP_METHODS = ['get', 'post', 'put', 'delete', 'patch'] as const;

interface ParsedEndpoint {
  path: string;
  method: string;
  operation: OperationObject;
  summary?: string;
  tags?: string[];
}

interface EndpointGroup {
  tag: string;
  endpoints: ParsedEndpoint[];
}

interface EndpointSidebarProps {
  spec: any;
  selectedEndpoint: { path: string; method: string } | null;
  onSelectEndpoint: (endpoint: { path: string; method: string; operation: OperationObject }) => void;
  variant?: 'editor' | 'detail';
  className?: string;
}

function parseEndpoints(spec: any): ParsedEndpoint[] {
  if (!spec?.paths) return [];

  const endpoints: ParsedEndpoint[] = [];
  Object.entries(spec.paths).forEach(([path, pathItem]: [string, any]) => {
    HTTP_METHODS.forEach((method) => {
      if (pathItem[method]) {
        endpoints.push({
          path,
          method: method.toUpperCase(),
          operation: pathItem[method],
          summary: pathItem[method].summary,
          tags: pathItem[method].tags || ['default'],
        });
      }
    });
  });
  return endpoints;
}

function groupByTag(endpoints: ParsedEndpoint[]): EndpointGroup[] {
  const grouped = new Map<string, ParsedEndpoint[]>();
  endpoints.forEach((endpoint) => {
    const tag = endpoint.tags?.[0] || 'default';
    if (!grouped.has(tag)) grouped.set(tag, []);
    grouped.get(tag)!.push(endpoint);
  });
  return Array.from(grouped.entries()).map(([tag, eps]) => ({ tag, endpoints: eps }));
}

export function EndpointSidebar({
  spec,
  selectedEndpoint,
  onSelectEndpoint,
  variant = 'detail',
  className = '',
}: EndpointSidebarProps) {
  const endpoints = useMemo(() => parseEndpoints(spec), [spec]);
  const groups = useMemo(() => groupByTag(endpoints), [endpoints]);

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Expand all groups initially
  useEffect(() => {
    setExpandedGroups(new Set(groups.map((g) => g.tag)));
  }, [groups]);

  if (endpoints.length === 0) return null;

  // Editor variant: flat list matching the current editor sidebar style
  if (variant === 'editor') {
    return (
      <div className={`flex flex-col ${className}`}>
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-card-foreground mb-1">Endpoints</h3>
          <p className="text-xs text-muted-foreground">{endpoints.length} operations</p>
        </div>
        <div className="flex-1 overflow-auto">
          {Object.entries(spec.paths).map(([path, pathItem]: [string, any]) => {
            return Object.entries(pathItem as PathItemObject)
              .filter(([method]) => HTTP_METHODS.includes(method as any))
              .map(([method, operation]: [string, any]) => {
                const op = operation as OperationObject;
                const colors = getMethodColor(method);
                const isSelected =
                  selectedEndpoint?.path === path &&
                  selectedEndpoint?.method === method;

                return (
                  <button
                    key={`${method}-${path}`}
                    onClick={() => onSelectEndpoint({ path, method, operation: op })}
                    className={`w-full text-left px-4 py-3 border-b border-border transition-colors group cursor-pointer ${
                      isSelected
                        ? 'bg-accent border-l-4 border-l-primary'
                        : 'hover:bg-muted border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${colors.bg} ${colors.text} border ${colors.border}`}
                      >
                        {method}
                      </span>
                    </div>
                    <div
                      className={`text-xs font-mono mb-1 transition-colors ${
                        isSelected
                          ? 'text-foreground font-semibold'
                          : 'text-muted-foreground group-hover:text-foreground'
                      }`}
                    >
                      {path}
                    </div>
                    <div
                      className={`text-xs transition-colors line-clamp-1 ${
                        isSelected
                          ? 'text-foreground'
                          : 'text-muted-foreground group-hover:text-foreground'
                      }`}
                    >
                      {op.summary || 'No summary'}
                    </div>
                  </button>
                );
              });
          })}
        </div>
      </div>
    );
  }

  // Detail variant: grouped with search (used in ApiDetailDrawer)
  const filteredGroups = groups
    .map((group) => ({
      ...group,
      endpoints: group.endpoints.filter(
        (e) =>
          e.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.summary?.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((g) => g.endpoints.length > 0);

  return (
    <div className={`flex flex-col bg-muted/30 ${className}`}>
      {/* Search */}
      <div className="p-3 border-b border-border shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search endpoints..."
            className="w-full bg-background border border-border text-foreground text-xs rounded pl-8 pr-3 h-8 focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Endpoint Groups */}
      <div className="flex-1 overflow-y-auto py-2">
        {filteredGroups.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-muted-foreground">
            No endpoints found
          </div>
        ) : (
          filteredGroups.map((group) => (
            <div key={group.tag} className="mb-2">
              <button
                onClick={() => {
                  setExpandedGroups((prev) => {
                    const next = new Set(prev);
                    if (next.has(group.tag)) {
                      next.delete(group.tag);
                    } else {
                      next.add(group.tag);
                    }
                    return next;
                  });
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/50 text-xs font-medium text-foreground"
              >
                {expandedGroups.has(group.tag) ? (
                  <FolderOpen className="w-4 h-4 text-foreground" />
                ) : (
                  <Folder className="w-4 h-4 text-foreground" />
                )}
                <span>{group.tag}</span>
                <span className="text-muted-foreground ml-auto">
                  {group.endpoints.length}
                </span>
              </button>
              {expandedGroups.has(group.tag) && (
                <div className="ml-2">
                  {group.endpoints.map((endpoint) => {
                    const isSelected =
                      selectedEndpoint?.path === endpoint.path &&
                      selectedEndpoint?.method.toUpperCase() === endpoint.method;

                    return (
                      <button
                        key={`${endpoint.method}-${endpoint.path}`}
                        onClick={() =>
                          onSelectEndpoint({
                            path: endpoint.path,
                            method: endpoint.method.toLowerCase(),
                            operation: endpoint.operation,
                          })
                        }
                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted/50 transition-colors ${
                          isSelected ? 'bg-muted' : ''
                        }`}
                      >
                        <span
                          className={`font-bold w-12 ${
                            endpoint.method === 'GET'
                              ? 'text-blue-600 dark:text-blue-400'
                              : endpoint.method === 'POST'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : endpoint.method === 'PUT'
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : endpoint.method === 'PATCH'
                                    ? 'text-secondary'
                                    : 'text-destructive'
                          }`}
                        >
                          {endpoint.method}
                        </span>
                        <code className="text-muted-foreground font-mono flex-1 text-left truncate">
                          {endpoint.path}
                        </code>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border text-xs text-muted-foreground shrink-0">
        <div className="flex items-center justify-between">
          <span>{endpoints.length} endpoints</span>
          <span>{groups.length} groups</span>
        </div>
      </div>
    </div>
  );
}
