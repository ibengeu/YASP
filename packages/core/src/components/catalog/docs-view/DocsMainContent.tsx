/**
 * DocsMainContent - Center documentation panel for documentation page
 * Matches the redesigned high-fidelity template
 *
 * Mitigation for OWASP A07:2025 – Injection: All schema values rendered via React JSX
 * (escaped by default), never via innerHTML or dangerouslySetInnerHTML.
 */

import {
  ChevronRight,
  Copy,
  Check,
  Lock,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getMethodColor } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { ParsedEndpoint, ParsedOpenAPISpec, SchemaEntry } from './types';
import { SchemaPropertyList, SchemaDetailView } from './SchemaPropertyList';
import { resolveInlineRef } from './utils';
import type { ParsedOpenAPISpec as ApiDetailsParsedSpec } from '@/components/api-details/types';
import { useEffect, useRef } from 'react';
import type { SchemaObject, ParameterObject, ResponseObject } from '@/types/openapi-spec';

interface DocsMainContentProps {
  endpoint: ParsedEndpoint | null;
  baseUrl: string;
  spec?: ParsedOpenAPISpec;
  selectedModel?: SchemaEntry | null;
  onBackFromModel?: () => void;
}

export function DocsMainContent({
  endpoint,
  baseUrl,
  spec,
  selectedModel,
  onBackFromModel,
  className,
}: DocsMainContentProps & { className?: string }) {
  const [copied, setCopied] = useState(false);
  const [selectedContentType, setSelectedContentType] = useState<string>('application/json');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to top when endpoint changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [endpoint, selectedModel]);

  // Show schema detail view when a model is selected
  if (selectedModel && spec) {
    return (
      <SchemaDetailView
        entry={selectedModel}
        spec={spec}
        onBack={onBackFromModel ?? (() => {})}
      />
    );
  }

  if (!endpoint) {
    return (
      <div className={cn("flex-1 flex items-center justify-center text-muted-foreground", className)}>
        <p className="text-base">Select an endpoint to view details</p>
      </div>
    );
  }

  const methodColor = getMethodColor(endpoint.method);
  const fullUrl = `${baseUrl}${endpoint.path}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success('Endpoint URL copied');
    setTimeout(() => setCopied(false), 2000);
  };

  // Extract request body content types — resolve $ref if needed
  // Mitigation for OWASP A04:2025 – Insecure Design: resolveInlineRef only follows '#/' local refs
  let requestBody = endpoint.operation.requestBody as any;
  if (requestBody?.$ref && spec) {
    requestBody = resolveInlineRef(requestBody.$ref, spec as unknown as ApiDetailsParsedSpec) ?? requestBody;
  }
  const contentTypes = requestBody?.content ? Object.keys(requestBody.content) : [];
  const effectiveContentType = contentTypes.includes(selectedContentType)
    ? selectedContentType
    : contentTypes[0] || 'application/json';

  // Group parameters by location
  const allParams = (endpoint.operation.parameters || []) as ParameterObject[];
  const paramGroups: Record<string, ParameterObject[]> = {
    path: allParams.filter((p) => p.in === 'path'),
    query: allParams.filter((p) => p.in === 'query'),
    header: allParams.filter((p) => p.in === 'header'),
    cookie: allParams.filter((p) => p.in === 'cookie'),
  };
  const hasAnyParams = allParams.length > 0;

  // Per-operation security
  const operationSecurity = (endpoint.operation as any).security as Record<string, string[]>[] | undefined;

  return (
    <div
      ref={scrollContainerRef}
      className={cn("flex-1 overflow-y-auto px-6 py-10 lg:px-12 xl:max-w-3xl custom-scroll bg-transparent", className)}
    >
      {/* Group 1: Identity & Context */}
      <div className="mb-20">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-muted-foreground mb-6">
          <a href="#" className="hover:text-foreground transition-colors cursor-pointer">
            API Reference
          </a>
          <ChevronRight className="mx-2 w-3.5 h-3.5 opacity-50" />
          <a href="#" className="hover:text-foreground transition-colors cursor-pointer">
            {endpoint.tags?.[0] || 'Reference'}
          </a>
          <ChevronRight className="mx-2 w-3.5 h-3.5 opacity-50" />
          <span className="text-foreground truncate font-medium">{endpoint.summary || endpoint.path}</span>
        </nav>

        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span
              className={cn(
                "px-2 py-0.5 rounded text-xs font-mono font-bold border uppercase tracking-wider",
                methodColor.bg,
                methodColor.text,
                methodColor.border
              )}
            >
              {endpoint.method}
            </span>
            <h1 className="text-2xl md:text-3xl tracking-tight font-bold text-foreground">
              {endpoint.summary || endpoint.path}
            </h1>
            {endpoint.operation.deprecated && (
              <Badge variant="destructive" className="uppercase text-xs font-bold px-1.5 py-0 h-5 tracking-wider">
                Deprecated
              </Badge>
            )}
          </div>

          {/* Per-operation security */}
          {operationSecurity && operationSecurity.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {operationSecurity.map((secReq, idx) =>
                Object.entries(secReq).map(([schemeName, scopes]) => (
                  <span
                    key={`${idx}-${schemeName}`}
                    className="flex items-center gap-1.5 text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded"
                  >
                    <Lock className="w-3 h-3" />
                    {schemeName}
                    {(scopes as string[]).length > 0 && (
                      <span className="text-muted-foreground">({(scopes as string[]).join(', ')})</span>
                    )}
                  </span>
                ))
              )}
            </div>
          )}

          <div className="text-base text-muted-foreground leading-relaxed max-w-2xl prose prose-sm md:prose-base prose-invert mb-8">
            {endpoint.operation.description ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {endpoint.operation.description}
              </ReactMarkdown>
            ) : (
              <p>No detailed description provided.</p>
            )}
          </div>
        </div>
      </div>

      {/* Group 2: Definition (Inputs) */}
      <div className="mb-20">
        {/* Endpoint URL */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Endpoint</h3>
          </div>
          <div className="flex items-center justify-between bg-muted/30 border border-border rounded-lg px-4 py-3 group hover:border-primary/50 transition-colors">
            <div className="font-mono text-sm flex items-center gap-1 overflow-x-auto whitespace-nowrap">
              <span className="text-muted-foreground">{baseUrl}</span>
              <span className="text-foreground font-semibold">{endpoint.path}</span>
            </div>
            <button
              onClick={handleCopy}
              className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all focus:opacity-100 pl-4 shrink-0 relative cursor-pointer"
              aria-label="Copy to clipboard"
            >
              {copied ? <Check className="w-4.5 h-4.5 text-green-500" /> : <Copy className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>

        {/* Request Body */}
        {requestBody && contentTypes.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl md:text-2xl tracking-tight font-bold text-foreground">
                Request Body
              </h2>
              <div className="flex items-center gap-2">
                {contentTypes.length === 1 ? (
                  <span className="text-xs md:text-sm text-muted-foreground font-mono font-medium">
                    {effectiveContentType}
                  </span>
                ) : (
                  contentTypes.map((ct) => (
                    <button
                      key={ct}
                      onClick={() => setSelectedContentType(ct)}
                      aria-label={ct}
                      className={cn(
                        "text-xs font-mono font-bold px-2.5 py-1 rounded border transition-colors cursor-pointer",
                        effectiveContentType === ct
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground hover:border-primary/20"
                      )}
                    >
                      {ct}
                    </button>
                  ))
                )}
              </div>
            </div>
            <Separator className="mb-2" />

            {/* Schema for selected content type */}
            {requestBody?.content?.[effectiveContentType]?.schema && spec ? (
              <SchemaPropertyList
                schema={requestBody.content[effectiveContentType].schema}
                spec={spec}
                requiredFields={requestBody.content[effectiveContentType].schema?.required || []}
              />
            ) : (
              <p className="text-sm text-muted-foreground italic py-4">No schema defined for this content type.</p>
            )}
          </div>
        )}

        {/* Parameters grouped by location */}
        {hasAnyParams && (
          <div className="mb-0 space-y-8">
            {(['path', 'query', 'header', 'cookie'] as const).map((loc) => {
              const params = paramGroups[loc];
              if (!params.length) return null;
              const label = loc.charAt(0).toUpperCase() + loc.slice(1) + ' Parameters';
              return (
                <div key={loc}>
                  <h2 className="text-xl md:text-2xl tracking-tight font-bold text-foreground mb-5">
                    {label}
                  </h2>
                  <Separator className="mb-2" />
                  <div className="space-y-0 divide-y divide-border">
                    {params.map((param, idx) => (
                      <ParameterRow key={idx} param={param} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Group 3: Outcomes (Responses) */}
      <div className="mb-16">
        <h2 className="text-xl md:text-2xl tracking-tight font-bold text-foreground mb-5">
          Responses
        </h2>
        <Separator className="mb-5" />
        <div className="space-y-4">
          {Object.entries(endpoint.operation.responses ?? {}).map(([code, responseOrRef]: [string, any]) => {
            const response = responseOrRef as ResponseObject;
            const isDefault = code.toLowerCase() === 'default';
            const isSuccess = isDefault || code.startsWith('2') || code.startsWith('3');
            const isWarning = code.startsWith('4');
            const jsonContent = response.content?.['application/json'];
            const hasSchema = jsonContent?.schema && spec;
            const hasExample = jsonContent?.example !== undefined || jsonContent?.examples;

            return (
              <div key={code} className="border border-border rounded-lg overflow-hidden bg-card/50">
                <div className="bg-muted/50 px-4 py-2.5 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      isSuccess ? "bg-green-500" : isWarning ? "bg-amber-500" : "bg-destructive"
                    )} />
                    <span className="text-base font-bold text-foreground font-mono">
                      {isDefault ? 'Default' : code}
                    </span>
                    {isDefault && (
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-bold uppercase tracking-tight">
                        Catch-all
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                    {response.description}
                  </p>

                  {/* Response schema */}
                  {hasSchema && (
                    <Accordion type="single" collapsible className="w-full mt-4">
                      <AccordionItem value="schema" className="border-none">
                        <AccordionTrigger className="py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-wider [&>svg]:size-3 no-underline hover:no-underline">
                          Response Schema
                        </AccordionTrigger>
                        <AccordionContent className="pt-3 pb-0 ml-1.5 border-l-2 border-border pl-4">
                          <SchemaPropertyList schema={jsonContent.schema!} spec={spec} />
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}

                  {/* Response example */}
                  {hasExample && !hasSchema && (
                    <pre className="mt-4 bg-muted border border-border rounded p-3 font-mono text-xs overflow-x-auto text-foreground">
                      {jsonContent.example !== undefined
                        ? typeof jsonContent.example === 'string'
                          ? jsonContent.example
                          : JSON.stringify(jsonContent.example, null, 2)
                        : JSON.stringify(Object.values(jsonContent.examples!)[0], null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="h-24"></div>
    </div>
  );
}

interface ParameterRowProps {
  param: ParameterObject;
}

function ParameterRow({ param }: ParameterRowProps) {
  const schema = param.schema as SchemaObject | undefined;
  return (
    <div className="py-5">
      <div className="flex items-baseline gap-3 mb-1.5 flex-wrap">
        <span className="font-mono text-sm md:text-base text-foreground font-bold">
          {param.name}
        </span>
        <span className="font-mono text-xs md:text-sm text-muted-foreground font-medium">
          {schema?.type || 'string'}
        </span>
        {param.required && (
          <Badge variant="destructive" className="text-xs font-bold px-1.5 py-0 h-4 uppercase tracking-wider">
            Required
          </Badge>
        )}
        <span className="text-xs text-muted-foreground/60 uppercase font-bold tracking-widest ml-auto">
          {param.in}
        </span>
      </div>
      {param.description && (
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-3">
          {param.description}
        </p>
      )}
      {/* Constraint badges */}
      {schema && (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {schema.format && (
            <code className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded font-mono">
              {schema.format}
            </code>
          )}
          {schema.pattern && (
            <code className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded font-mono truncate max-w-[12rem]" title={schema.pattern}>
              /{schema.pattern}/
            </code>
          )}
          {schema.minimum !== undefined && (
            <code className="text-[10px] bg-muted text-muted-foreground border border-border px-1.5 py-0.5 rounded font-mono">
              min: {schema.minimum}
            </code>
          )}
          {schema.maximum !== undefined && (
            <code className="text-[10px] bg-muted text-muted-foreground border border-border px-1.5 py-0.5 rounded font-mono">
              max: {schema.maximum}
            </code>
          )}
          {schema.enum && schema.enum.map((v: unknown) => (
            <code key={String(v)} className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono">
              {JSON.stringify(v)}
            </code>
          ))}
        </div>
      )}
      {schema?.default !== undefined && (
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
            Default:
          </span>
          <code className="font-mono text-xs md:text-sm text-foreground bg-muted px-1.5 py-0.5 rounded border border-border font-bold">
            {JSON.stringify(schema.default)}
          </code>
        </div>
      )}
    </div>
  );
}
