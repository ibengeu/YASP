/**
 * ApiDocumentation - Standalone API documentation renderer
 * Extracted from editor.$id.tsx for reuse in ApiDetailDrawer and editor page
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getMethodColor } from '@/lib/constants';
import type { PathItemObject, OperationObject } from '@/types/openapi-spec';

interface ParsedOpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: { url: string; description?: string }[];
  paths?: Record<string, PathItemObject>;
  components?: any;
}

interface ApiDocumentationProps {
  spec: ParsedOpenAPISpec;
}

const PROSE_CLASSES =
  'prose prose-sm prose-invert max-w-none [&_table]:border-collapse [&_table]:w-full [&_th]:border [&_th]:border-border [&_th]:px-4 [&_th]:py-2 [&_th]:bg-muted [&_th]:text-left [&_th]:font-semibold [&_td]:border [&_td]:border-border [&_td]:px-4 [&_td]:py-2 [&_code]:text-xs [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded [&_pre]:overflow-x-auto';

export function ApiDocumentation({ spec }: ApiDocumentationProps) {
  if (!spec.paths || Object.keys(spec.paths).length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No API documentation available. Add paths to your OpenAPI specification.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* API Info Header */}
      <div className="mb-12">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-3 text-foreground">
          {spec.info.title}
        </h1>
        <div className={`text-base md:text-lg leading-relaxed text-muted-foreground ${PROSE_CLASSES}`}>
          {spec.info.description ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {spec.info.description}
            </ReactMarkdown>
          ) : (
            'No description provided'
          )}
        </div>
        <div className="mt-3 flex items-center gap-3 text-sm md:text-base text-muted-foreground">
          <span>Version {spec.info.version}</span>
          {spec.servers?.[0] && (
            <>
              <span>&bull;</span>
              <code className="px-2 py-1 rounded bg-muted border border-border text-foreground font-mono text-sm">
                {spec.servers[0].url}
              </code>
            </>
          )}
        </div>
      </div>

      {/* Endpoints */}
      {Object.entries(spec.paths).map(([path, pathItem]) => {
        return Object.entries(pathItem as PathItemObject)
          .filter(([method]) =>
            ['get', 'post', 'put', 'patch', 'delete'].includes(method)
          )
          .map(([method, operation]: [string, any]) => {
            const op = operation as OperationObject;
            const colors = getMethodColor(method);

            return (
              <div
                key={`${method}-${path}`}
                id={`endpoint-${method}-${path.replace(/\//g, '-')}`}
                className="mb-16 scroll-mt-16"
              >
                {/* Accent Strip */}
                <div className="h-1 w-16 bg-gradient-to-r from-primary to-secondary mb-4 rounded-full" />

                {/* Operation Summary */}
                <h2 className="text-xl md:text-2xl uppercase font-bold tracking-tight mb-3 text-foreground">
                  {op.summary || `${method.toUpperCase()} ${path}`}
                </h2>
                <div className={`text-base md:text-lg leading-relaxed mb-6 text-muted-foreground ${PROSE_CLASSES}`}>
                  {op.description ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {op.description}
                    </ReactMarkdown>
                  ) : (
                    'No detailed description provided in the specification.'
                  )}
                </div>

                {/* Endpoint Badge */}
                <div className="flex items-center gap-3 mb-6 p-3 bg-card border border-border rounded-lg">
                  <span
                    className={`px-3 py-1.5 rounded-md font-bold text-sm uppercase ${colors.bg} ${colors.text} border ${colors.border}`}
                  >
                    {method.toUpperCase()}
                  </span>
                  <code className="text-sm md:text-base font-mono text-foreground">{path}</code>
                </div>

                {/* Parameters */}
                {op.parameters && op.parameters.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-base font-bold text-foreground mb-3">Parameters</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border border-border rounded-lg overflow-hidden">
                        <thead className="bg-muted">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-wider">
                              In
                            </th>
                            <th className="px-4 py-3 text-left text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-4 py-3 text-left text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-wider">
                              Required
                            </th>
                            <th className="px-4 py-3 text-left text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-wider">
                              Description
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {op.parameters.map((param: any, idx: number) => (
                            <tr key={idx} className="hover:bg-muted transition-colors">
                              <td className="px-4 py-3 text-sm md:text-base font-mono text-foreground">
                                {param.name}
                              </td>
                              <td className="px-4 py-3 text-sm md:text-base">
                                <span className="px-2 py-1 rounded bg-primary/10 text-primary text-xs md:text-sm border border-primary/30">
                                  {param.in}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm md:text-base text-muted-foreground">
                                {param.schema?.type || 'any'}
                              </td>
                              <td className="px-4 py-3 text-sm md:text-base">
                                {param.required ? (
                                  <span className="text-destructive font-bold">{'\u2713'}</span>
                                ) : (
                                  <span className="text-muted-foreground">&mdash;</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm md:text-base text-muted-foreground">
                                {param.description || '\u2014'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Request Body */}
                {op.requestBody && (
                  <div className="mb-6">
                    <h3 className="text-base font-bold text-foreground mb-3">Request Body</h3>
                    <div className="p-4 bg-card border border-border rounded-lg">
                      <p className="text-sm md:text-base text-muted-foreground mb-2">
                        {(op.requestBody as any).description || 'Request body'}
                      </p>
                      {(op.requestBody as any).required && (
                        <span className="text-xs md:text-sm text-destructive font-bold uppercase tracking-wider">Required</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Responses */}
                <div className="mb-6">
                  <h3 className="text-base font-bold text-foreground mb-3">Responses</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border border-border rounded-lg overflow-hidden">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-wider">
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {op.responses &&
                          Object.entries(op.responses).map(
                            ([code, response]: [string, any]) => (
                              <tr key={code} className="hover:bg-muted transition-colors">
                                <td className="px-4 py-3">
                                  <span
                                    className={`px-3 py-1 rounded font-mono text-xs md:text-sm font-bold ${
                                      code.startsWith('2')
                                        ? 'bg-green-500/10 text-green-600 border border-green-500/30'
                                        : code.startsWith('4')
                                          ? 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
                                          : code.startsWith('5')
                                            ? 'bg-destructive/10 text-destructive border border-destructive/30'
                                            : 'bg-primary/10 text-primary border border-primary/30'
                                    }`}
                                  >
                                    {code}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm md:text-base text-muted-foreground">
                                  {response.description || 'No description'}
                                </td>
                              </tr>
                            )
                          )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          });
      })}
    </div>
  );
}
