import { OpenAPISpec } from './types';

export const demoApiSpec: OpenAPISpec = {
  openapi: "3.0.0",
  info: {
    title: "Pet Store API",
    version: "1.0.0",
    description: "A sample API that uses a petstore as an example to demonstrate features in the OpenAPI 3.0 specification"
  },
  servers: [
    {
      url: "https://petstore3.swagger.io/api/v3",
      description: "Production server"
    },
    {
      url: "https://staging.petstore3.swagger.io/api/v3", 
      description: "Staging server"
    }
  ],
  tags: [
    {
      name: "pets",
      description: "Everything about your Pets"
    },
    {
      name: "store",
      description: "Operations about user orders"
    },
    {
      name: "users",
      description: "Operations about users"
    }
  ],
  paths: {
    "/pets": {
      get: {
        tags: ["pets"],
        summary: "List all pets",
        description: "Returns a list of all pets in the store with optional filtering",
        operationId: "listPets",
        parameters: [
          {
            name: "limit",
            in: "query",
            description: "How many items to return at one time (max 100)",
            required: false,
            schema: {
              type: "integer",
              format: "int32",
              example: 10
            }
          },
          {
            name: "tag",
            in: "query", 
            description: "Filter pets by tag",
            required: false,
            schema: {
              type: "string",
              example: "friendly"
            }
          }
        ],
        responses: {
          "200": {
            description: "A paged array of pets",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/Pet"
                  }
                },
                example: [
                  {
                    id: 1,
                    name: "Buddy",
                    tag: "friendly",
                    status: "available"
                  }
                ]
              }
            }
          },
          "400": {
            description: "Bad request"
          }
        }
      },
      post: {
        tags: ["pets"],
        summary: "Create a pet",
        description: "Add a new pet to the store",
        operationId: "createPet",
        requestBody: {
          description: "Pet object that needs to be added to the store",
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Pet"
              },
              example: {
                name: "Max",
                tag: "playful",
                status: "available"
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Pet created successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Pet"
                }
              }
            }
          },
          "400": {
            description: "Invalid input"
          }
        }
      }
    },
    "/pets/{petId}": {
      get: {
        tags: ["pets"],
        summary: "Get a pet by ID",
        description: "Returns a single pet",
        operationId: "getPetById",
        parameters: [
          {
            name: "petId",
            in: "path",
            description: "ID of pet to return",
            required: true,
            schema: {
              type: "integer",
              format: "int64",
              example: 1
            }
          }
        ],
        responses: {
          "200": {
            description: "Pet details",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Pet"
                }
              }
            }
          },
          "404": {
            description: "Pet not found"
          }
        }
      },
      put: {
        tags: ["pets"],
        summary: "Update a pet",
        description: "Update an existing pet by ID",
        operationId: "updatePet",
        parameters: [
          {
            name: "petId",
            in: "path",
            description: "ID of pet to update",
            required: true,
            schema: {
              type: "integer",
              format: "int64"
            }
          }
        ],
        requestBody: {
          description: "Updated pet object",
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Pet"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Pet updated successfully"
          },
          "404": {
            description: "Pet not found"
          }
        }
      },
      delete: {
        tags: ["pets"],
        summary: "Delete a pet",
        description: "Deletes a pet by ID",
        operationId: "deletePet",
        parameters: [
          {
            name: "petId",
            in: "path",
            description: "Pet ID to delete",
            required: true,
            schema: {
              type: "integer",
              format: "int64"
            }
          }
        ],
        responses: {
          "204": {
            description: "Pet deleted successfully"
          },
          "404": {
            description: "Pet not found"
          }
        }
      }
    },
    "/store/orders": {
      post: {
        tags: ["store"],
        summary: "Place an order",
        description: "Place an order for a pet",
        operationId: "placeOrder",
        requestBody: {
          description: "Order placed for purchasing the pet",
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Order"
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Order placed successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Order"
                }
              }
            }
          },
          "400": {
            description: "Invalid order"
          }
        }
      }
    },
    "/users": {
      post: {
        tags: ["users"],
        summary: "Create user",
        description: "Create a new user account",
        operationId: "createUser",
        requestBody: {
          description: "Created user object",
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/User"
              }
            }
          }
        },
        responses: {
          "201": {
            description: "User created successfully"
          },
          "400": {
            description: "Invalid user supplied"
          }
        }
      }
    },
    "/users/{username}": {
      get: {
        tags: ["users"],
        summary: "Get user by username",
        description: "Get user information by username",
        operationId: "getUserByName",
        parameters: [
          {
            name: "username",
            in: "path",
            description: "The name that needs to be fetched",
            required: true,
            schema: {
              type: "string",
              example: "john_doe"
            }
          }
        ],
        responses: {
          "200": {
            description: "User found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/User"
                }
              }
            }
          },
          "404": {
            description: "User not found"
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Pet: {
        type: "object",
        required: ["name"],
        properties: {
          id: {
            type: "integer",
            format: "int64",
            example: 1,
            description: "Unique identifier for the pet"
          },
          name: {
            type: "string",
            example: "Buddy",
            description: "Pet name"
          },
          tag: {
            type: "string", 
            example: "friendly",
            description: "Pet tag for categorization"
          },
          status: {
            type: "string",
            enum: ["available", "pending", "sold"],
            example: "available",
            description: "Pet status in the store"
          }
        }
      },
      Order: {
        type: "object",
        properties: {
          id: {
            type: "integer",
            format: "int64",
            example: 1
          },
          petId: {
            type: "integer",
            format: "int64",
            example: 1
          },
          quantity: {
            type: "integer",
            format: "int32",
            example: 1
          },
          shipDate: {
            type: "string",
            format: "date-time"
          },
          status: {
            type: "string",
            enum: ["placed", "approved", "delivered"],
            example: "placed"
          },
          complete: {
            type: "boolean",
            example: false
          }
        }
      },
      User: {
        type: "object",
        properties: {
          id: {
            type: "integer",
            format: "int64",
            example: 1
          },
          username: {
            type: "string",
            example: "john_doe"
          },
          firstName: {
            type: "string",
            example: "John"
          },
          lastName: {
            type: "string",
            example: "Doe"
          },
          email: {
            type: "string",
            example: "john@example.com"
          },
          phone: {
            type: "string",
            example: "+1-555-123-4567"
          }
        }
      }
    }
  }
};

export const mockResponses = {
  "GET /pets": {
    status: 200,
    statusText: "OK",
    headers: { "content-type": "application/json" },
    body: [
      { id: 1, name: "Buddy", tag: "friendly", status: "available" },
      { id: 2, name: "Max", tag: "playful", status: "available" },
      { id: 3, name: "Bella", tag: "calm", status: "pending" }
    ]
  },
  "POST /pets": {
    status: 201,
    statusText: "Created",
    headers: { "content-type": "application/json" },
    body: { id: 4, name: "Luna", tag: "energetic", status: "available" }
  },
  "GET /pets/{petId}": {
    status: 200,
    statusText: "OK", 
    headers: { "content-type": "application/json" },
    body: { id: 1, name: "Buddy", tag: "friendly", status: "available" }
  },
  "PUT /pets/{petId}": {
    status: 200,
    statusText: "OK",
    headers: { "content-type": "application/json" },
    body: { message: "Pet updated successfully" }
  },
  "DELETE /pets/{petId}": {
    status: 204,
    statusText: "No Content",
    headers: {},
    body: null
  }
};