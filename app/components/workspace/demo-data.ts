/**
 * Demo data for OpenAPI Catalog
 */

import { OpenAPISpec, OpenAPISpecVersion, ValidationError, AuditLogEntry, CatalogStatistics, ValidationPolicy } from './types';
import { demoWorkspaces } from '../workspace/demo-data';
import { User } from '../auth/types';

// Demo users for OpenAPI catalog
export const demoUsers: User[] = [
  {
    id: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    name: 'John Doe',
    avatar: '',
    role: 'admin',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    lastLoginAt: new Date('2024-01-23T10:30:00Z'),
    emailVerified: true,
    twoFactorEnabled: false,
    preferences: {
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      language: 'en'
    }
  },
  {
    id: 'user-2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    name: 'Jane Smith',
    avatar: '',
    role: 'developer',
    createdAt: new Date('2024-01-05T00:00:00Z'),
    lastLoginAt: new Date('2024-01-22T15:45:00Z'),
    emailVerified: true,
    twoFactorEnabled: true,
    preferences: {
      theme: 'dark',
      notifications: {
        email: true,
        push: false,
        sms: false
      },
      language: 'en'
    }
  },
  {
    id: 'user-3',
    firstName: 'Mike',
    lastName: 'Wilson',
    email: 'mike.wilson@example.com',
    name: 'Mike Wilson',
    avatar: '',
    role: 'developer',
    createdAt: new Date('2024-01-08T00:00:00Z'),
    lastLoginAt: new Date('2024-01-21T09:20:00Z'),
    emailVerified: true,
    twoFactorEnabled: false,
    preferences: {
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        sms: true
      },
      language: 'en'
    }
  },
  {
    id: 'user-4',
    firstName: 'Sarah',
    lastName: 'Davis',
    email: 'sarah.davis@example.com',
    name: 'Sarah Davis',
    avatar: '',
    role: 'viewer',
    createdAt: new Date('2024-01-12T00:00:00Z'),
    lastLoginAt: new Date('2024-01-20T14:10:00Z'),
    emailVerified: true,
    twoFactorEnabled: false,
    preferences: {
      theme: 'light',
      notifications: {
        email: false,
        push: true,
        sms: false
      },
      language: 'en'
    }
  }
];

export const demoValidationPolicies: ValidationPolicy[] = [
  {
    id: 'policy-1',
    name: 'OpenAPI 3.x Schema Validation',
    description: 'Validates against OpenAPI 3.x specification schema',
    type: 'schema',
    enabled: true,
    configuration: {
      version: '3.0.x',
      strict: true
    }
  },
  {
    id: 'policy-2',
    name: 'API Naming Conventions',
    description: 'Enforces consistent naming patterns for paths, operations, and schemas',
    type: 'naming',
    enabled: true,
    configuration: {
      pathCasing: 'kebab-case',
      operationIdRequired: true,
      schemaNameCasing: 'PascalCase'
    }
  },
  {
    id: 'policy-3',
    name: 'Security Requirements',
    description: 'Ensures proper security schemes and requirements are defined',
    type: 'security',
    enabled: true,
    configuration: {
      requireAuth: true,
      allowedSchemes: ['bearer', 'apiKey', 'oauth2']
    }
  },
  {
    id: 'policy-4',
    name: 'Documentation Standards',
    description: 'Requires comprehensive documentation for all endpoints',
    type: 'structure',
    enabled: false,
    configuration: {
      requireDescriptions: true,
      requireExamples: true,
      minDescriptionLength: 20
    }
  }
];

export const demoValidationErrors: ValidationError[] = [
  {
    id: 'error-1',
    type: 'schema',
    severity: 'error',
    message: 'Missing required field "openapi" in root object',
    path: '/',
    line: 1,
    rule: 'openapi-required'
  },
  {
    id: 'error-2',
    type: 'naming',
    severity: 'warning',
    message: 'Operation ID should be in camelCase format',
    path: '/paths/users/get/operationId',
    line: 45,
    rule: 'operation-id-casing'
  },
  {
    id: 'error-3',
    type: 'security',
    severity: 'warning',
    message: 'Endpoint lacks security requirements',
    path: '/paths/users/post',
    line: 67,
    rule: 'security-required'
  }
];

export const demoAuditLogs: AuditLogEntry[] = [
  {
    id: 'audit-1',
    action: 'spec_uploaded',
    performedBy: demoUsers[0],
    timestamp: new Date('2024-01-15T10:30:00Z'),
    details: {
      specId: 'spec-1',
      fileName: 'users-api.yaml',
      fileSize: 15420
    },
    ipAddress: '192.168.1.100'
  },
  {
    id: 'audit-2',
    action: 'spec_published',
    performedBy: demoUsers[0],
    timestamp: new Date('2024-01-15T11:00:00Z'),
    details: {
      specId: 'spec-1',
      version: '1.0.0'
    },
    ipAddress: '192.168.1.100'
  },
  {
    id: 'audit-3',
    action: 'spec_downloaded',
    performedBy: demoUsers[1],
    timestamp: new Date('2024-01-16T09:15:00Z'),
    details: {
      specId: 'spec-1',
      format: 'yaml'
    },
    ipAddress: '10.0.0.50'
  },
  {
    id: 'audit-4',
    action: 'version_created',
    performedBy: demoUsers[0],
    timestamp: new Date('2024-01-20T14:20:00Z'),
    details: {
      specId: 'spec-2',
      newVersion: '1.1.0',
      previousVersion: '1.0.0'
    },
    ipAddress: '192.168.1.100'
  }
];

export const demoSpecVersions: OpenAPISpecVersion[] = [
  {
    id: 'version-1',
    specId: 'spec-1',
    version: '1.0.0',
    content: '{"openapi": "3.0.0", "info": {"title": "User Management API", "version": "1.0.0"}}',
    changeLog: 'Initial version of the User Management API',
    createdAt: new Date('2024-01-15T10:30:00Z'),
    createdBy: demoUsers[0],
    isActive: false
  },
  {
    id: 'version-2',
    specId: 'spec-1',
    version: '1.1.0',
    content: '{"openapi": "3.0.0", "info": {"title": "User Management API", "version": "1.1.0"}}',
    changeLog: 'Added user profile endpoints and improved error handling',
    createdAt: new Date('2024-01-20T14:20:00Z'),
    createdBy: demoUsers[0],
    isActive: true
  },
  {
    id: 'version-3',
    specId: 'spec-2',
    version: '2.0.0',
    content: '{"openapi": "3.0.0", "info": {"title": "Payment Processing API", "version": "2.0.0"}}',
    changeLog: 'Major version update with breaking changes to payment flow',
    createdAt: new Date('2024-01-18T16:45:00Z'),
    createdBy: demoUsers[1],
    isActive: true
  }
];

export const demoOpenAPISpecs: OpenAPISpec[] = [
  {
    id: 'spec-1',
    workspaceId: demoWorkspaces[0].id,
    workspace: demoWorkspaces[0],
    title: 'User Management API',
    description: 'Comprehensive API for managing user accounts, profiles, and authentication in our platform.',
    version: '1.1.0',
    servers: [
      {
        url: 'https://api.example.com/v1',
        description: 'Production server'
      },
      {
        url: 'https://staging-api.example.com/v1',
        description: 'Staging server'
      }
    ],
    paths: {
      '/users': {},
      '/users/{id}': {},
      '/users/{id}/profile': {},
      '/auth/login': {},
      '/auth/logout': {}
    },
    tags: [
      { name: 'Users', description: 'User management operations' },
      { name: 'Authentication', description: 'Authentication and authorization' },
      { name: 'Profiles', description: 'User profile management' }
    ],
    displayName: 'User Management API v1.1',
    category: 'Authentication',
    owner: demoUsers[0],
    ownerContact: 'john.doe@example.com',
    fileName: 'users-api.yaml',
    fileFormat: 'yaml',
    fileSize: 15420,
    originalContent: `openapi: 3.0.0
info:
  title: User Management API
  version: 1.1.0
  description: Comprehensive API for managing user accounts...`,
    status: 'published',
    validationStatus: 'valid',
    validationErrors: [],
    versionHistory: demoSpecVersions.filter(v => v.specId === 'spec-1'),
    currentVersionId: 'version-2',
    createdAt: new Date('2024-01-15T10:30:00Z'),
    updatedAt: new Date('2024-01-20T14:20:00Z'),
    publishedAt: new Date('2024-01-15T11:00:00Z'),
    visibility: 'workspace',
    permissions: {
      canView: ['user-1', 'user-2', 'user-3'],
      canEdit: ['user-1'],
      canDelete: ['user-1'],
      canDownload: ['user-1', 'user-2', 'user-3'],
      canManageVersions: ['user-1']
    },
    downloadCount: 45,
    lastDownloadedAt: new Date('2024-01-22T09:15:00Z'),
    auditLogs: demoAuditLogs.filter(log => log.details.specId === 'spec-1'),
    retentionPolicy: {
      maxVersions: 10,
      maxAge: 365,
      archiveAfter: 180
    }
  },
  {
    id: 'spec-2',
    workspaceId: demoWorkspaces[1].id,
    workspace: demoWorkspaces[1],
    title: 'Payment Processing API',
    description: 'Secure payment processing and transaction management API with support for multiple payment methods.',
    version: '2.0.0',
    servers: [
      {
        url: 'https://payments.example.com/api/v2',
        description: 'Production payment server'
      }
    ],
    paths: {
      '/payments': {},
      '/payments/{id}': {},
      '/payments/{id}/refund': {},
      '/payment-methods': {},
      '/transactions': {}
    },
    tags: [
      { name: 'Payments', description: 'Payment processing operations' },
      { name: 'Refunds', description: 'Refund and cancellation handling' },
      { name: 'Payment Methods', description: 'Manage payment methods' },
      { name: 'Transactions', description: 'Transaction history and reporting' }
    ],
    displayName: 'Payments API v2.0',
    category: 'Financial',
    owner: demoUsers[1],
    ownerContact: 'jane.smith@example.com',
    fileName: 'payments-api.json',
    fileFormat: 'json',
    fileSize: 28350,
    originalContent: `{
  "openapi": "3.0.0",
  "info": {
    "title": "Payment Processing API",
    "version": "2.0.0"
  }
}`,
    status: 'published',
    validationStatus: 'warnings',
    validationErrors: [demoValidationErrors[1], demoValidationErrors[2]],
    versionHistory: demoSpecVersions.filter(v => v.specId === 'spec-2'),
    currentVersionId: 'version-3',
    createdAt: new Date('2024-01-10T14:20:00Z'),
    updatedAt: new Date('2024-01-18T16:45:00Z'),
    publishedAt: new Date('2024-01-10T15:00:00Z'),
    visibility: 'organization',
    permissions: {
      canView: ['user-1', 'user-2', 'user-3', 'user-4'],
      canEdit: ['user-2'],
      canDelete: ['user-2'],
      canDownload: ['user-1', 'user-2', 'user-3'],
      canManageVersions: ['user-2']
    },
    downloadCount: 23,
    lastDownloadedAt: new Date('2024-01-21T16:30:00Z'),
    auditLogs: demoAuditLogs.filter(log => log.details.specId === 'spec-2'),
    retentionPolicy: {
      maxVersions: 15,
      maxAge: 730,
      archiveAfter: 365
    }
  },
  {
    id: 'spec-3',
    workspaceId: demoWorkspaces[0].id,
    workspace: demoWorkspaces[0],
    title: 'Notification Service API',
    description: 'Real-time notification delivery system supporting email, SMS, push notifications, and webhooks.',
    version: '1.0.0',
    servers: [
      {
        url: 'https://notifications.example.com/v1',
        description: 'Production notification server'
      }
    ],
    paths: {
      '/notifications': {},
      '/notifications/send': {},
      '/templates': {},
      '/subscribers': {},
      '/webhooks': {}
    },
    tags: [
      { name: 'Notifications', description: 'Send and manage notifications' },
      { name: 'Templates', description: 'Notification templates' },
      { name: 'Subscribers', description: 'Manage notification subscribers' },
      { name: 'Webhooks', description: 'Webhook management' }
    ],
    category: 'Communication',
    owner: demoUsers[2],
    ownerContact: 'mike.wilson@example.com',
    fileName: 'notifications-api.yaml',
    fileFormat: 'yaml',
    fileSize: 12800,
    originalContent: `openapi: 3.0.0
info:
  title: Notification Service API
  version: 1.0.0`,
    status: 'draft',
    validationStatus: 'pending',
    validationErrors: [],
    versionHistory: [],
    currentVersionId: '',
    createdAt: new Date('2024-01-22T11:15:00Z'),
    updatedAt: new Date('2024-01-22T11:15:00Z'),
    visibility: 'private',
    permissions: {
      canView: ['user-3'],
      canEdit: ['user-3'],
      canDelete: ['user-3'],
      canDownload: ['user-3'],
      canManageVersions: ['user-3']
    },
    downloadCount: 0,
    auditLogs: [],
    retentionPolicy: {
      maxVersions: 5,
      maxAge: 180
    }
  },
  {
    id: 'spec-4',
    workspaceId: demoWorkspaces[2].id,
    workspace: demoWorkspaces[2],
    title: 'Analytics & Reporting API',
    description: 'Business intelligence and analytics API providing comprehensive reporting capabilities.',
    version: '3.2.1',
    servers: [
      {
        url: 'https://analytics.example.com/api/v3',
        description: 'Production analytics server'
      }
    ],
    paths: {
      '/reports': {},
      '/dashboards': {},
      '/metrics': {},
      '/exports': {},
      '/visualizations': {}
    },
    tags: [
      { name: 'Reports', description: 'Generate and manage reports' },
      { name: 'Dashboards', description: 'Dashboard management' },
      { name: 'Metrics', description: 'Metrics and KPIs' },
      { name: 'Data Export', description: 'Data export functionality' }
    ],
    category: 'Analytics',
    owner: demoUsers[3],
    ownerContact: 'sarah.davis@example.com',
    fileName: 'analytics-api.json',
    fileFormat: 'json',
    fileSize: 45200,
    originalContent: `{
  "openapi": "3.0.0",
  "info": {
    "title": "Analytics & Reporting API",
    "version": "3.2.1"
  }
}`,
    status: 'published',
    validationStatus: 'valid',
    validationErrors: [],
    versionHistory: [],
    currentVersionId: '',
    createdAt: new Date('2024-01-05T09:00:00Z'),
    updatedAt: new Date('2024-01-19T13:30:00Z'),
    publishedAt: new Date('2024-01-05T10:00:00Z'),
    visibility: 'organization',
    permissions: {
      canView: ['user-1', 'user-2', 'user-3', 'user-4'],
      canEdit: ['user-4'],
      canDelete: ['user-4'],
      canDownload: ['user-1', 'user-2', 'user-3', 'user-4'],
      canManageVersions: ['user-4']
    },
    downloadCount: 67,
    lastDownloadedAt: new Date('2024-01-23T08:45:00Z'),
    auditLogs: [],
    retentionPolicy: {
      maxVersions: 20,
      maxAge: 1095
    }
  }
];

export const demoCatalogStatistics: CatalogStatistics = {
  totalSpecs: demoOpenAPISpecs.length,
  specsByStatus: {
    draft: 1,
    validating: 0,
    validation_failed: 0,
    pending_approval: 0,
    published: 3,
    archived: 0,
    deprecated: 0
  },
  specsByValidation: {
    pending: 1,
    validating: 0,
    valid: 2,
    invalid: 0,
    warnings: 1
  },
  specsByWorkspace: [
    { workspaceId: demoWorkspaces[0].id, name: demoWorkspaces[0].name, count: 2 },
    { workspaceId: demoWorkspaces[1].id, name: demoWorkspaces[1].name, count: 1 },
    { workspaceId: demoWorkspaces[2].id, name: demoWorkspaces[2].name, count: 1 }
  ],
  recentActivity: demoAuditLogs.slice(0, 5),
  topDownloaded: [
    { spec: demoOpenAPISpecs[3], downloadCount: 67 },
    { spec: demoOpenAPISpecs[0], downloadCount: 45 },
    { spec: demoOpenAPISpecs[1], downloadCount: 23 }
  ],
  validationIssues: {
    total: 3,
    byType: {
      schema: 1,
      naming: 1,
      security: 1,
      policy: 0,
      custom: 0
    },
    bySeverity: {
      error: 1,
      warning: 2,
      info: 0
    }
  }
};

// Mock API responses
export const mockOpenAPISpecsResponse = {
  specs: demoOpenAPISpecs,
  totalCount: demoOpenAPISpecs.length,
  facets: {
    categories: [
      { name: 'Authentication', count: 1 },
      { name: 'Financial', count: 1 },
      { name: 'Communication', count: 1 },
      { name: 'Analytics', count: 1 }
    ],
    tags: [
      { name: 'Users', count: 1 },
      { name: 'Authentication', count: 1 },
      { name: 'Payments', count: 1 },
      { name: 'Notifications', count: 1 },
      { name: 'Reports', count: 1 }
    ],
    workspaces: [
      { id: demoWorkspaces[0].id, name: demoWorkspaces[0].name, count: 2 },
      { id: demoWorkspaces[1].id, name: demoWorkspaces[1].name, count: 1 },
      { id: demoWorkspaces[2].id, name: demoWorkspaces[2].name, count: 1 }
    ],
    owners: [
      { id: demoUsers[0].id, name: demoUsers[0].name, count: 1 },
      { id: demoUsers[1].id, name: demoUsers[1].name, count: 1 },
      { id: demoUsers[2].id, name: demoUsers[2].name, count: 1 },
      { id: demoUsers[3].id, name: demoUsers[3].name, count: 1 }
    ]
  }
};