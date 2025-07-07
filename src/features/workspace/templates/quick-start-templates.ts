export interface QuickStartTemplate {
  id: string;
  name: string;
  description: string;
  category: 'e-commerce' | 'user-management' | 'social' | 'basic';
  workspace: {
    name: string;
    description: string;
  };
  specs: Array<{
    name: string;
    format: 'yaml' | 'json';
    content: string;
  }>;
}

export const quickStartTemplates: QuickStartTemplate[] = [
  {
    id: 'basic-api',
    name: 'Basic REST API',
    description: 'Simple REST API with basic CRUD operations',
    category: 'basic',
    workspace: {
      name: 'My First API',
      description: 'A basic REST API workspace to get started'
    },
    specs: [
      {
        name: 'Basic API',
        format: 'yaml',
        content: `openapi: 3.0.0
info:
  title: Basic API
  description: A simple API to get started with OpenAPI
  version: 1.0.0
servers:
  - url: https://api.example.com/v1
    description: Production server
paths:
  /items:
    get:
      summary: Get all items
      tags:
        - Items
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Item'
    post:
      summary: Create a new item
      tags:
        - Items
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/NewItem'
      responses:
        '201':
          description: Item created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Item'
  /items/{id}:
    get:
      summary: Get item by ID
      tags:
        - Items
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Item'
        '404':
          description: Item not found
    put:
      summary: Update an item
      tags:
        - Items
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateItem'
      responses:
        '200':
          description: Item updated successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Item'
        '404':
          description: Item not found
    delete:
      summary: Delete an item
      tags:
        - Items
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '204':
          description: Item deleted successfully
        '404':
          description: Item not found
components:
  schemas:
    Item:
      type: object
      properties:
        id:
          type: string
          example: "123"
        name:
          type: string
          example: "Sample Item"
        description:
          type: string
          example: "A sample item for demonstration"
        createdAt:
          type: string
          format: date-time
          example: "2023-01-01T12:00:00Z"
        updatedAt:
          type: string
          format: date-time
          example: "2023-01-01T12:00:00Z"
      required:
        - id
        - name
    NewItem:
      type: object
      properties:
        name:
          type: string
          example: "New Item"
        description:
          type: string
          example: "Description of the new item"
      required:
        - name
    UpdateItem:
      type: object
      properties:
        name:
          type: string
          example: "Updated Item"
        description:
          type: string
          example: "Updated description"
`
      }
    ]
  },
  {
    id: 'user-auth',
    name: 'User Authentication',
    description: 'Complete user authentication and profile management API',
    category: 'user-management',
    workspace: {
      name: 'User Management System',
      description: 'Authentication and user profile management APIs'
    },
    specs: [
      {
        name: 'Auth API',
        format: 'yaml',
        content: `openapi: 3.0.0
info:
  title: User Authentication API
  description: Complete authentication and user management system
  version: 1.0.0
servers:
  - url: https://auth.example.com/api/v1
    description: Authentication server
paths:
  /auth/register:
    post:
      summary: Register a new user
      tags:
        - Authentication
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RegisterRequest'
      responses:
        '201':
          description: User registered successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'
        '400':
          description: Invalid input
        '409':
          description: User already exists
  /auth/login:
    post:
      summary: Login user
      tags:
        - Authentication
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginRequest'
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'
        '401':
          description: Invalid credentials
  /auth/refresh:
    post:
      summary: Refresh access token
      tags:
        - Authentication
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RefreshRequest'
      responses:
        '200':
          description: Token refreshed successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'
        '401':
          description: Invalid refresh token
  /user/profile:
    get:
      summary: Get user profile
      tags:
        - User Profile
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Profile retrieved successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserProfile'
        '401':
          description: Unauthorized
    put:
      summary: Update user profile
      tags:
        - User Profile
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateProfileRequest'
      responses:
        '200':
          description: Profile updated successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserProfile'
        '401':
          description: Unauthorized
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    RegisterRequest:
      type: object
      properties:
        email:
          type: string
          format: email
          example: "user@example.com"
        password:
          type: string
          minLength: 8
          example: "securepassword123"
        firstName:
          type: string
          example: "John"
        lastName:
          type: string
          example: "Doe"
      required:
        - email
        - password
        - firstName
        - lastName
    LoginRequest:
      type: object
      properties:
        email:
          type: string
          format: email
          example: "user@example.com"
        password:
          type: string
          example: "securepassword123"
      required:
        - email
        - password
    RefreshRequest:
      type: object
      properties:
        refreshToken:
          type: string
          example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      required:
        - refreshToken
    AuthResponse:
      type: object
      properties:
        accessToken:
          type: string
          example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        refreshToken:
          type: string
          example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        user:
          $ref: '#/components/schemas/UserProfile'
      required:
        - accessToken
        - refreshToken
        - user
    UserProfile:
      type: object
      properties:
        id:
          type: string
          example: "user123"
        email:
          type: string
          format: email
          example: "user@example.com"
        firstName:
          type: string
          example: "John"
        lastName:
          type: string
          example: "Doe"
        createdAt:
          type: string
          format: date-time
          example: "2023-01-01T12:00:00Z"
        updatedAt:
          type: string
          format: date-time
          example: "2023-01-01T12:00:00Z"
      required:
        - id
        - email
        - firstName
        - lastName
    UpdateProfileRequest:
      type: object
      properties:
        firstName:
          type: string
          example: "John"
        lastName:
          type: string
          example: "Doe"
`
      }
    ]
  }
];