/**
 * Templates for creating new API specifications
 */

/** Default title for newly created specs */
export const NEW_SPEC_DEFAULT_TITLE = 'Untitled Spec';

/** OpenAPI YAML template for new specifications */
export const NEW_SPEC_TEMPLATE = `openapi: 3.1.0
info:
  title: My API
  version: 1.0.0
  description: API description
servers:
  - url: https://api.example.com/v1
paths:
  /example:
    get:
      summary: Example endpoint
      operationId: getExample
      tags: [Examples]
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: object
`;
