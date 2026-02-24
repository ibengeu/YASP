import type { OperationObject, SchemaObject } from '@/types/openapi-spec';

export interface SchemaEntry { name: string; schema: SchemaObject; }

export interface ParsedEndpoint {
  path: string;
  method: string;
  operation: OperationObject;
  summary?: string;
  tags?: string[];
}

export interface EndpointGroup {
  tag: string;
  endpoints: ParsedEndpoint[];
  count: number;
}

export interface ParsedOpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: Array<{
    url: string;
    description?: string;
    variables?: Record<string, { default: string; enum?: string[] }>;
  }>;
  paths?: Record<string, unknown>;
  tags?: Array<{ name: string; description?: string }>;
  security?: Record<string, string[]>[];
  components?: {
    schemas?: Record<string, SchemaObject>;
    securitySchemes?: Record<string, unknown>;
    requestBodies?: Record<string, unknown>;
    parameters?: Record<string, unknown>;
    responses?: Record<string, unknown>;
    headers?: Record<string, unknown>;
    examples?: Record<string, unknown>;
    links?: Record<string, unknown>;
    callbacks?: Record<string, unknown>;
  };
  webhooks?: Record<string, unknown>;
}
