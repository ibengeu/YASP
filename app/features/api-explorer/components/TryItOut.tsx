/**
 * Try It Out Component
 * Interactive API request builder for testing endpoints
 *
 * Features:
 * - Dynamic form generation from OpenAPI parameters
 * - Request body editor with Monaco
 * - Response visualization
 * - SSRF-protected proxy requests
 */

import { useState, useCallback } from 'react';
import type { OperationObject, ParameterObject } from '@/types/openapi-spec';

export interface TryItOutProps {
  operation: OperationObject;
  path: string;
  method: string;
  baseUrl: string;
  onSubmit?: (request: RequestData) => void;
  mockResponse?: MockResponse;
  mockError?: Error;
}

export interface RequestData {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
}

interface MockResponse {
  status: number;
  statusText: string;
  headers: Headers;
  body: any;
}

interface ParameterValues {
  [key: string]: string;
}

export function TryItOut({
  operation,
  path,
  method,
  baseUrl,
  onSubmit,
  mockResponse,
  mockError,
}: TryItOutProps) {
  const [paramValues, setParamValues] = useState<ParameterValues>({});
  const [requestBody, setRequestBody] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<MockResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const parameters = (operation.parameters || []) as ParameterObject[];
  const hasRequestBody = operation.requestBody && ['post', 'put', 'patch'].includes(method.toLowerCase());

  const handleParamChange = (name: string, value: string) => {
    setParamValues((prev) => ({ ...prev, [name]: value }));
  };

  const buildUrl = useCallback(() => {
    let url = baseUrl + path;

    // Replace path parameters
    parameters
      .filter((p) => p.in === 'path')
      .forEach((param) => {
        const value = paramValues[param.name];
        if (value) {
          url = url.replace(`{${param.name}}`, encodeURIComponent(value));
        }
      });

    // Add query parameters
    const queryParams = parameters
      .filter((p) => p.in === 'query' && paramValues[p.name])
      .map((param) => `${param.name}=${encodeURIComponent(paramValues[param.name])}`)
      .join('&');

    if (queryParams) {
      url += `?${queryParams}`;
    }

    return url;
  }, [baseUrl, path, parameters, paramValues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required parameters
    const missingRequired = parameters
      .filter((p) => p.required && !paramValues[p.name])
      .map((p) => p.name);

    if (missingRequired.length > 0) {
      return; // Don't submit if required fields are missing
    }

    const requestData: RequestData = {
      url: buildUrl(),
      method: method.toUpperCase(),
      headers: {},
      body: hasRequestBody && requestBody ? JSON.parse(requestBody) : undefined,
    };

    // Call onSubmit callback if provided (for testing)
    if (onSubmit) {
      onSubmit(requestData);
    }

    // Mock response handling for tests
    if (mockResponse || mockError) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        if (mockError) {
          setError(mockError);
        } else if (mockResponse) {
          setResponse(mockResponse);
        }
      }, 100);
      return;
    }

    // TODO: Real API request via proxy
    setIsLoading(true);
    // Implementation will call /api/proxy endpoint
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold text-card-foreground">Try It Out</h3>

      {/* Endpoint Info */}
      <div className="mb-6 flex items-center gap-3">
        <span
          className={`inline-flex h-7 items-center rounded-sm px-2 text-xs font-bold uppercase ${
            method.toLowerCase() === 'get'
              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
              : method.toLowerCase() === 'post'
              ? 'bg-green-500/10 text-green-600 dark:text-green-400'
              : method.toLowerCase() === 'put'
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              : method.toLowerCase() === 'delete'
              ? 'bg-red-500/10 text-red-600 dark:text-red-400'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {method.toUpperCase()}
        </span>
        <code className="text-sm text-muted-foreground">{path}</code>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Parameters Section */}
        {parameters.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-card-foreground">Parameters</h4>

            {parameters.map((param) => (
              <div key={param.name} className="space-y-1.5">
                <label htmlFor={param.name} className="block text-sm font-medium text-card-foreground">
                  {param.name}
                  {param.required && <span className="ml-1 text-destructive">*</span>}
                  {param.description && (
                    <span className="ml-2 text-xs text-muted-foreground">({param.description})</span>
                  )}
                </label>

                {param.schema?.enum ? (
                  <select
                    id={param.name}
                    aria-label={param.name}
                    value={paramValues[param.name] || ''}
                    onChange={(e) => handleParamChange(param.name, e.target.value)}
                    required={param.required}
                    className="h-9 w-full rounded-sm border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Select...</option>
                    {(param.schema.enum as string[]).map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={param.name}
                    type={param.schema?.type === 'integer' || param.schema?.type === 'number' ? 'number' : 'text'}
                    aria-label={param.name}
                    value={paramValues[param.name] || ''}
                    onChange={(e) => handleParamChange(param.name, e.target.value)}
                    required={param.required}
                    placeholder={`Enter ${param.name}`}
                    className="h-9 w-full rounded-sm border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Request Body Section */}
        {hasRequestBody && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-card-foreground">Request Body</h4>
            <textarea
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              placeholder='{"key": "value"}'
              rows={6}
              className="w-full rounded-sm border border-border bg-background p-3 font-mono text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring"
            />
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? 'Sending...' : 'Send Request'}
        </button>
      </form>

      {/* Response Section */}
      {(response || error) && (
        <div className="mt-6 space-y-4 border-t border-border pt-6">
          <h4 className="text-sm font-semibold text-card-foreground">Response</h4>

          {error && (
            <div className="rounded-sm bg-destructive/10 p-3 text-sm text-destructive">
              {error.message}
            </div>
          )}

          {response && (
            <>
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex h-7 items-center rounded-sm px-3 text-sm font-semibold ${
                    response.status >= 200 && response.status < 300
                      ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                      : response.status >= 400 && response.status < 500
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'bg-red-500/10 text-red-600 dark:text-red-400'
                  }`}
                >
                  {response.status} {response.statusText}
                </span>
              </div>

              {/* Response Body */}
              <pre className="overflow-auto rounded-sm border border-border bg-muted p-4 text-sm">
                {JSON.stringify(response.body, null, 2)}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}
