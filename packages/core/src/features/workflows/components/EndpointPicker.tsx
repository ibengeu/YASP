/**
 * EndpointPicker - Dialog with command palette for choosing spec endpoints
 * Cross-collection: groups endpoints by spec title, then by tag
 */

import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { getMethodColor } from '@/lib/constants';
import type { WorkflowStep, SpecEntry } from '../types/workflow.types';

const HTTP_METHODS = ['get', 'post', 'put', 'delete', 'patch'] as const;

interface ParsedEndpoint {
  specId: string;
  specTitle: string;
  serverUrl: string;
  path: string;
  method: string;
  summary?: string;
  tags: string[];
  operation: any;
  spec: any;
}

interface EndpointPickerProps {
  open: boolean;
  onClose: () => void;
  specs: Map<string, SpecEntry>;
  onSelect: (step: WorkflowStep) => void;
}

function parseAllEndpoints(specs: Map<string, SpecEntry>): ParsedEndpoint[] {
  const endpoints: ParsedEndpoint[] = [];
  for (const [specId, entry] of specs) {
    const spec = entry.parsed;
    if (!spec?.paths) continue;
    const serverUrl = spec.servers?.[0]?.url || '';
    for (const [path, pathItem] of Object.entries(spec.paths) as [string, any][]) {
      for (const method of HTTP_METHODS) {
        if (pathItem[method]) {
          endpoints.push({
            specId,
            specTitle: entry.title,
            serverUrl,
            path,
            method: method.toUpperCase(),
            summary: pathItem[method].summary,
            tags: pathItem[method].tags || ['default'],
            operation: pathItem[method],
            spec,
          });
        }
      }
    }
  }
  return endpoints;
}

/** Group by "SpecTitle > Tag" */
function groupBySpecAndTag(endpoints: ParsedEndpoint[]): Map<string, ParsedEndpoint[]> {
  const grouped = new Map<string, ParsedEndpoint[]>();
  for (const ep of endpoints) {
    const tag = ep.tags[0] || 'default';
    const key = `${ep.specTitle} > ${tag}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(ep);
  }
  return grouped;
}

/**
 * Generate example JSON body from an OpenAPI schema (simplified)
 */
function generateBodyFromSchema(schema: any, depth = 0, spec?: any): string {
  if (depth > 3) return '{}';
  if (schema?.$ref && spec) {
    const parts = schema.$ref.slice(2).split('/');
    let resolved = spec;
    for (const p of parts) resolved = resolved?.[p];
    if (resolved) return generateBodyFromSchema(resolved, depth, spec);
  }
  if (schema?.example !== undefined) return JSON.stringify(schema.example, null, 2);
  if (schema?.type === 'object' && schema.properties) {
    const obj: any = {};
    for (const [key, prop] of Object.entries(schema.properties) as [string, any][]) {
      const resolved = prop.$ref && spec
        ? (() => { let r = spec; for (const p of prop.$ref.slice(2).split('/')) r = r?.[p]; return r; })()
        : prop;
      if (!resolved) { obj[key] = null; continue; }
      if (resolved.example !== undefined) obj[key] = resolved.example;
      else if (resolved.type === 'string') obj[key] = resolved.default || 'string';
      else if (resolved.type === 'number' || resolved.type === 'integer') obj[key] = resolved.default ?? 0;
      else if (resolved.type === 'boolean') obj[key] = resolved.default ?? true;
      else if (resolved.type === 'array') obj[key] = [];
      else if (resolved.type === 'object') {
        try { obj[key] = JSON.parse(generateBodyFromSchema(resolved, depth + 1, spec)); }
        catch { obj[key] = {}; }
      }
      else obj[key] = null;
    }
    return JSON.stringify(obj, null, 2);
  }
  return '{\n  \n}';
}

export function EndpointPicker({ open, onClose, specs, onSelect }: EndpointPickerProps) {
  const endpoints = useMemo(() => parseAllEndpoints(specs), [specs]);
  const grouped = useMemo(() => groupBySpecAndTag(endpoints), [endpoints]);

  const handleSelect = (ep: ParsedEndpoint) => {
    // Build headers from spec parameters
    const headers: Record<string, string> = {};
    const queryParams: Record<string, string> = {};
    const params = [
      ...(ep.spec?.paths?.[ep.path]?.parameters || []),
      ...(ep.operation?.parameters || []),
    ];
    for (const param of params) {
      if (param.in === 'header') headers[param.name] = param.schema?.default || '';
      if (param.in === 'query') queryParams[param.name] = param.schema?.default?.toString() || '';
    }

    // Default content-type for methods with body
    if (['POST', 'PUT', 'PATCH'].includes(ep.method)) {
      headers['Content-Type'] = 'application/json';
    }

    // Generate body from request body schema
    let body: string | undefined;
    const reqBody = ep.operation?.requestBody;
    if (reqBody?.content?.['application/json']?.schema) {
      body = generateBodyFromSchema(reqBody.content['application/json'].schema, 0, ep.spec);
    }

    const step: WorkflowStep = {
      id: crypto.randomUUID(),
      order: 0,
      name: ep.operation?.summary || `${ep.method} ${ep.path}`,
      request: {
        method: ep.method as WorkflowStep['request']['method'],
        path: ep.path,
        headers,
        queryParams,
        body,
        serverUrl: ep.serverUrl || undefined,
      },
      extractions: [],
      specEndpoint: {
        specId: ep.specId,
        path: ep.path,
        method: ep.method.toLowerCase(),
        operationId: ep.operation?.operationId,
      },
    };

    onSelect(step);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="p-0 max-w-lg">
        <DialogHeader className="sr-only">
          <DialogTitle>Select Endpoint</DialogTitle>
          <DialogDescription>Choose an API endpoint to add as a workflow step</DialogDescription>
        </DialogHeader>
        <Command className="rounded-lg">
          <CommandInput placeholder="Search endpoints..." />
          <CommandList className="max-h-80">
            <CommandEmpty>No endpoints found.</CommandEmpty>
            {Array.from(grouped.entries()).map(([heading, eps]) => (
              <CommandGroup key={heading} heading={heading}>
                {eps.map((ep) => {
                  const colors = getMethodColor(ep.method);
                  return (
                    <CommandItem
                      key={`${ep.specId}-${ep.method}-${ep.path}`}
                      onSelect={() => handleSelect(ep)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <span className={cn(
                        'px-1.5 py-0.5 rounded text-xs font-bold uppercase min-w-[42px] text-center',
                        colors.bg, colors.text
                      )}>
                        {ep.method}
                      </span>
                      <code className="text-xs font-mono text-foreground">{ep.path}</code>
                      {ep.summary && (
                        <span className="text-xs text-muted-foreground truncate ml-auto">
                          {ep.summary}
                        </span>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
