/**
 * Stub OpenAPI Spec Generator
 *
 * Generates a minimal but functional OpenAPI 3.1.0 spec for manual registrations.
 * Ensures Try It Out has at least one endpoint to render (Gap 2 fix).
 *
 * Security: OWASP A07:2025 – Injection: User-provided strings are placed only
 * in safe positions (info.title, info.description, servers[].url). No interpolation
 * into executable contexts.
 */

export interface StubSpecInput {
  name: string;
  version: string;
  description?: string;
  endpoint: string;
}

export interface StubSpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: { url: string; description: string }[];
  paths: Record<string, any>;
}

/**
 * Generate a minimal OpenAPI 3.1.0 spec with a health-check GET / endpoint.
 * Used when a user registers an API without providing a spec file.
 */
export function generateStubSpec(input: StubSpecInput): StubSpec {
  return {
    openapi: '3.1.0',
    info: {
      title: input.name,
      version: input.version,
      description: input.description ?? '',
    },
    servers: [
      {
        url: input.endpoint,
        description: 'Default server',
      },
    ],
    paths: {
      '/': {
        get: {
          summary: 'Health check',
          operationId: 'healthCheck',
          tags: ['default'],
          responses: {
            '200': {
              description: 'OK',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}
