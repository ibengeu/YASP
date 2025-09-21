# YASP Platform - RESTful API Design Specification

Following Microsoft Azure API Design Best Practices

## API Design Principles

### 1. Resource-Oriented Design
- **Collections**: Use plural nouns (`/specifications`, `/users`, `/workspaces`)
- **Items**: Access via collection + identifier (`/specifications/{id}`)
- **Relationships**: Keep simple, avoid deep nesting beyond `collection/item/collection`

### 2. HTTP Methods Usage
- **GET**: Retrieve resources (idempotent)
- **POST**: Create new resources (non-idempotent)
- **PUT**: Replace entire resource (idempotent)
- **PATCH**: Partial updates (not necessarily idempotent)
- **DELETE**: Remove resources (idempotent)

### 3. URI Structure
- Base URI: `https://api.yasp.dev/v1`
- Pattern: `/{collection}` or `/{collection}/{id}` or `/{collection}/{id}/{subcollection}`
- Maximum nesting: 3 levels

---

## Core Resource Design

### Authentication Resources

```
POST   /auth/login              # Create session
POST   /auth/logout             # Delete session
POST   /auth/refresh            # Refresh access token
POST   /auth/register           # Create user account
POST   /auth/forgot-password    # Initiate password reset
POST   /auth/reset-password     # Complete password reset
```

### User Resources

```
GET    /users/{id}              # Get user profile
PUT    /users/{id}              # Update entire user profile
PATCH  /users/{id}              # Update user profile fields
DELETE /users/{id}              # Delete user account

GET    /users/{id}/preferences  # Get user preferences
PUT    /users/{id}/preferences  # Update preferences
```

### Specification Resources

```
GET    /specifications                    # List specifications (with filtering)
POST   /specifications                    # Create specification
GET    /specifications/{id}               # Get specification
PUT    /specifications/{id}               # Replace specification
PATCH  /specifications/{id}               # Update specification fields
DELETE /specifications/{id}               # Delete specification

POST   /specifications/{id}/validate      # Validate specification
POST   /specifications/{id}/duplicate     # Duplicate specification
POST   /specifications/import             # Import from file/URL
```

### Workspace Resources

```
GET    /workspaces                        # List user workspaces
POST   /workspaces                        # Create workspace
GET    /workspaces/{id}                   # Get workspace
PUT    /workspaces/{id}                   # Update workspace
DELETE /workspaces/{id}                   # Delete workspace

GET    /workspaces/{id}/specifications    # List workspace specifications
GET    /workspaces/{id}/members           # List workspace members
POST   /workspaces/{id}/members           # Add member
DELETE /workspaces/{id}/members/{userId}  # Remove member
```

---

## Query Parameters & Filtering

### Standardized Query Parameters

```
# Pagination
?page=1&size=20&cursor=eyJpZCI6IjEyMyJ9

# Filtering
?filter=status eq 'active' and createdDate gt '2024-01-01'
?category=backend&tags=auth,users
?search=user%20management

# Sorting
?orderBy=createdDate desc,title asc

# Field Selection (Partial Responses)
?select=id,title,version,createdDate

# Expansion
?expand=author,workspace
```

### Advanced Filtering (OData-style)

```
# Logical operators
?filter=title contains 'API' and status eq 'active'

# Date ranges
?filter=createdDate ge '2024-01-01' and createdDate lt '2024-02-01'

# Collection operations
?filter=tags/any(t: t eq 'authentication')
```

---

## Request/Response Examples

### 1. List Specifications with Filtering

```http
GET /v1/specifications?filter=workspaceType eq 'team'&orderBy=updatedDate desc&page=1&size=10&expand=author

{
  "value": [
    {
      "id": "spec_abc123",
      "title": "User Management API",
      "version": "1.2.0",
      "workspaceType": "team",
      "status": "active",
      "createdDate": "2024-01-15T10:30:00Z",
      "updatedDate": "2024-01-20T14:22:00Z",
      "author": {
        "id": "user_123",
        "displayName": "John Doe",
        "email": "john@example.com"
      },
      "_links": {
        "self": { "href": "/v1/specifications/spec_abc123" },
        "workspace": { "href": "/v1/workspaces/ws_team456" },
        "validate": { "href": "/v1/specifications/spec_abc123/validate" }
      }
    }
  ],
  "_metadata": {
    "page": 1,
    "size": 10,
    "totalCount": 45,
    "totalPages": 5
  },
  "_links": {
    "self": { "href": "/v1/specifications?page=1&size=10" },
    "next": { "href": "/v1/specifications?page=2&size=10" },
    "last": { "href": "/v1/specifications?page=5&size=10" }
  }
}
```

### 2. Create Specification

```http
POST /v1/specifications
Content-Type: application/json

{
  "title": "Payment Processing API",
  "description": "Secure payment processing endpoints",
  "workspaceId": "ws_team456",
  "tags": ["payments", "billing"],
  "category": "backend",
  "visibility": "private",
  "specification": {
    "openapi": "3.1.0",
    "info": {
      "title": "Payment Processing API",
      "version": "1.0.0",
      "description": "Secure payment processing endpoints"
    },
    "paths": {}
  }
}

# Response (201 Created)
Location: /v1/specifications/spec_xyz789

{
  "id": "spec_xyz789",
  "title": "Payment Processing API",
  "version": "1.0.0",
  "status": "draft",
  "createdDate": "2024-01-22T09:15:00Z",
  "updatedDate": "2024-01-22T09:15:00Z",
  "_links": {
    "self": { "href": "/v1/specifications/spec_xyz789" },
    "workspace": { "href": "/v1/workspaces/ws_team456" }
  }
}
```

### 3. Partial Update (PATCH)

```http
PATCH /v1/specifications/spec_xyz789
Content-Type: application/json

{
  "title": "Payment Processing API v2",
  "tags": ["payments", "billing", "v2"]
}

# Response (200 OK)
{
  "id": "spec_xyz789",
  "title": "Payment Processing API v2",
  "version": "1.0.0",
  "tags": ["payments", "billing", "v2"],
  "updatedDate": "2024-01-22T10:30:00Z",
  "_links": {
    "self": { "href": "/v1/specifications/spec_xyz789" }
  }
}
```

---

## Asynchronous Operations

For long-running operations (imports, validations, bulk operations):

### 1. Initiate Async Operation

```http
POST /v1/specifications/import
Content-Type: application/json

{
  "source": "url",
  "url": "https://api.example.com/openapi.json",
  "workspaceId": "ws_team456"
}

# Response (202 Accepted)
Location: /v1/operations/op_async123

{
  "operationId": "op_async123",
  "status": "running",
  "createdDate": "2024-01-22T10:00:00Z",
  "_links": {
    "self": { "href": "/v1/operations/op_async123" },
    "cancel": { "href": "/v1/operations/op_async123/cancel" }
  }
}
```

### 2. Check Operation Status

```http
GET /v1/operations/op_async123

{
  "operationId": "op_async123",
  "status": "completed",
  "createdDate": "2024-01-22T10:00:00Z",
  "completedDate": "2024-01-22T10:02:30Z",
  "result": {
    "specificationId": "spec_imported456",
    "validationResults": {
      "valid": true,
      "warnings": []
    }
  },
  "_links": {
    "result": { "href": "/v1/specifications/spec_imported456" }
  }
}
```

---

## Error Handling

### Standard HTTP Status Codes

- **200 OK**: Successful GET, PUT, PATCH
- **201 Created**: Successful POST
- **202 Accepted**: Async operation started
- **204 No Content**: Successful DELETE
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource doesn't exist
- **409 Conflict**: Resource conflict
- **422 Unprocessable Entity**: Validation errors
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

### Error Response Format

```json
{
  "error": {
    "code": "ValidationError",
    "message": "The request contains invalid data",
    "target": "specifications",
    "details": [
      {
        "code": "InvalidField",
        "message": "The 'openapi' field is required",
        "target": "specification.openapi"
      }
    ],
    "innererror": {
      "requestId": "req_abc123",
      "timestamp": "2024-01-22T10:30:00Z"
    }
  }
}
```

---

## Versioning Strategy

### URI Versioning (Recommended)

```
https://api.yasp.dev/v1/specifications
https://api.yasp.dev/v2/specifications
```

### Version Lifecycle

- **v1**: Current stable version
- **v2**: Next version (beta)
- **Deprecation**: 12-month notice period
- **Sunset**: Version removed after deprecation period

### Version Headers

```http
API-Version: 1.0
API-Supported-Versions: 1.0, 1.1, 2.0-beta
API-Deprecated-Versions: 0.9
```

---

## Content Negotiation

### Supported Media Types

```http
# Request
Accept: application/json
Accept: application/vnd.yasp.v1+json
Accept: application/yaml

# Response
Content-Type: application/json; charset=utf-8
Content-Type: application/vnd.yasp.v1+json
```

### Compression

```http
Accept-Encoding: gzip, deflate, br
Content-Encoding: gzip
```

---

## Security Headers

```http
# Rate Limiting
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642856400

# Security
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block

# CORS
Access-Control-Allow-Origin: https://app.yasp.dev
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE
Access-Control-Allow-Headers: Authorization, Content-Type
```

---

## Multitenancy Considerations

### Tenant Isolation

```http
# Header-based tenancy
X-Tenant-ID: tenant_abc123

# Subdomain-based tenancy
https://acme.api.yasp.dev/v1/specifications

# Path-based tenancy
https://api.yasp.dev/v1/tenants/acme/specifications
```

---

## Performance Optimization

### Caching

```http
# Response caching
Cache-Control: public, max-age=300
ETag: "v1.0-abc123"
Last-Modified: Mon, 22 Jan 2024 10:30:00 GMT

# Conditional requests
If-None-Match: "v1.0-abc123"
If-Modified-Since: Mon, 22 Jan 2024 10:30:00 GMT
```

### Batch Operations

```http
POST /v1/specifications/batch
Content-Type: application/json

{
  "operations": [
    {
      "method": "POST",
      "path": "/specifications",
      "body": { "title": "API 1" }
    },
    {
      "method": "PUT",
      "path": "/specifications/spec_123",
      "body": { "title": "Updated API" }
    }
  ]
}
```

---

## API Documentation

### OpenAPI Specification

The complete API is documented using OpenAPI 3.1.0:

```yaml
openapi: 3.1.0
info:
  title: YASP Platform API
  version: 1.0.0
  description: |
    Comprehensive OpenAPI specification management platform

    ## Authentication
    This API uses Bearer token authentication.

servers:
  - url: https://api.yasp.dev/v1
    description: Production server
  - url: https://staging-api.yasp.dev/v1
    description: Staging server

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

security:
  - BearerAuth: []
```

This design follows Microsoft Azure's best practices for creating maintainable, scalable, and developer-friendly RESTful APIs.