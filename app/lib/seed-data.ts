/**
 * Seed data for initial catalog population
 * Used when the IndexedDB is empty to provide a starting example
 */

/** Example E-Commerce API specification YAML */
export const SEED_SPEC = `openapi: 3.1.0
info:
  title: E-Commerce API
  version: 1.0.0
  description: RESTful API for managing products, orders, and customers
servers:
  - url: https://api.example.com/v1
paths:
  /products:
    get:
      summary: List all products
      operationId: getProducts
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    id:
                      type: string
                    name:
                      type: string
                    price:
                      type: number
  /orders:
    post:
      summary: Create a new order
      operationId: createOrder
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                productId:
                  type: string
                quantity:
                  type: integer
      responses:
        '201':
          description: Order created
`;

/** Metadata for the seed spec when inserting into storage */
export const SEED_SPEC_METADATA = {
  type: 'openapi' as const,
  title: 'E-Commerce API',
  version: '1.0.0',
  description: 'RESTful API for managing products, orders, and customers',
  metadata: {
    score: 85,
    tags: ['ecommerce', 'rest', 'example'],
    workspaceType: 'personal' as const,
    syncStatus: 'synced' as const,
    isDiscoverable: true,
  },
};
