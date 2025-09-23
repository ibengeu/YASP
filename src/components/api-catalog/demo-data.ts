import { ApiMetadata, SortOption } from './types';

export const demoApis: ApiMetadata[] = [
  {
    id: 'pet-store-v3',
    title: 'Pet Store API',
    version: '3.0.0',
    description: 'A comprehensive API for managing pet store operations including inventory, orders, and customer management.',
    category: 'E-commerce',
    tags: ['pets', 'retail', 'inventory'],
    lifecycle: 'production',
    lastUpdated: '2024-01-15T10:30:00Z',
    author: 'API Team',
    isPublic: true,
    endpoints: 24,
    workspaceId: 'ws_team_001'
  },
  {
    id: 'user-management-v2',
    title: 'User Management API',
    version: '2.1.0',
    description: 'Complete user lifecycle management with authentication, authorization, and profile management capabilities.',
    category: 'Authentication',
    tags: ['users', 'auth', 'profiles'],
    lifecycle: 'production',
    lastUpdated: '2024-01-10T14:20:00Z',
    author: 'Security Team',
    isPublic: false,
    endpoints: 18,
    workspaceId: 'ws_team_001'
  },
  {
    id: 'payment-gateway-v1',
    title: 'Payment Gateway API',
    version: '1.5.2',
    description: 'Secure payment processing with support for multiple payment methods, refunds, and transaction tracking.',
    category: 'Financial',
    tags: ['payments', 'transactions', 'billing'],
    lifecycle: 'production',
    lastUpdated: '2024-01-08T09:15:00Z',
    author: 'Finance Team',
    isPublic: false,
    endpoints: 32,
    workspaceId: 'ws_project_001'
  },
  {
    id: 'notification-service-v1',
    title: 'Notification Service API',
    version: '1.2.0',
    description: 'Multi-channel notification system supporting email, SMS, push notifications, and webhooks.',
    category: 'Communication',
    tags: ['notifications', 'email', 'sms', 'webhooks'],
    lifecycle: 'staging',
    lastUpdated: '2024-01-12T16:45:00Z',
    author: 'Platform Team',
    isPublic: true,
    endpoints: 15,
    workspaceId: 'ws_team_001'
  },
  {
    id: 'analytics-api-v2',
    title: 'Analytics API',
    version: '2.0.0-beta',
    description: 'Real-time analytics and reporting with custom metrics, dashboards, and data export capabilities.',
    category: 'Analytics',
    tags: ['analytics', 'metrics', 'reporting'],
    lifecycle: 'development',
    lastUpdated: '2024-01-14T11:00:00Z',
    author: 'Data Team',
    isPublic: true,
    endpoints: 28,
    workspaceId: 'ws_public_001'
  },
  {
    id: 'inventory-v1',
    title: 'Inventory Management API',
    version: '1.0.0',
    description: 'Comprehensive inventory tracking with stock levels, warehouse management, and automated reordering.',
    category: 'Operations',
    tags: ['inventory', 'warehouse', 'stock'],
    lifecycle: 'production',
    lastUpdated: '2024-01-05T13:30:00Z',
    author: 'Operations Team',
    isPublic: false,
    endpoints: 22,
    workspaceId: 'ws_project_001'
  },
  {
    id: 'legacy-orders-v1',
    title: 'Legacy Orders API',
    version: '1.8.5',
    description: 'Legacy order processing system. Please migrate to Order Management API v2 for new integrations.',
    category: 'E-commerce',
    tags: ['orders', 'legacy'],
    lifecycle: 'deprecated',
    lastUpdated: '2023-12-20T10:00:00Z',
    author: 'Legacy Team',
    isPublic: false,
    endpoints: 16,
    workspaceId: 'ws_team_001'
  },
  {
    id: 'content-api-v3',
    title: 'Content Management API',
    version: '3.1.0',
    description: 'Headless CMS API for managing articles, media, and dynamic content with versioning support.',
    category: 'Content',
    tags: ['cms', 'content', 'media'],
    lifecycle: 'production',
    lastUpdated: '2024-01-11T08:20:00Z',
    author: 'Content Team',
    isPublic: true,
    endpoints: 35,
    workspaceId: 'ws_public_001'
  },
  {
    id: 'geolocation-v2',
    title: 'Geolocation API',
    version: '2.0.1',
    description: 'Location-based services with geocoding, reverse geocoding, and proximity search capabilities.',
    category: 'Location',
    tags: ['geolocation', 'maps', 'geocoding'],
    lifecycle: 'production',
    lastUpdated: '2024-01-09T15:10:00Z',
    author: 'Maps Team',
    isPublic: true,
    endpoints: 12,
    workspaceId: 'ws_public_001'
  },
  {
    id: 'file-storage-v1',
    title: 'File Storage API',
    version: '1.3.0',
    description: 'Secure file upload, storage, and retrieval with support for multiple file formats and CDN integration.',
    category: 'Storage',
    tags: ['files', 'storage', 'upload'],
    lifecycle: 'staging',
    lastUpdated: '2024-01-13T12:40:00Z',
    author: 'Infrastructure Team',
    isPublic: false,
    endpoints: 19,
    workspaceId: 'ws_project_001'
  },
  {
    id: 'search-api-v2',
    title: 'Search API',
    version: '2.2.0',
    description: 'Powerful search engine with full-text search, faceted search, and auto-complete functionality.',
    category: 'Search',
    tags: ['search', 'elasticsearch', 'autocomplete'],
    lifecycle: 'production',
    lastUpdated: '2024-01-07T14:55:00Z',
    author: 'Search Team',
    isPublic: true,
    endpoints: 8,
    workspaceId: 'ws_public_001'
  },
  {
    id: 'ml-predictions-v1',
    title: 'ML Predictions API',
    version: '1.0.0-alpha',
    description: 'Machine learning prediction service with pre-trained models for classification and regression tasks.',
    category: 'Machine Learning',
    tags: ['ml', 'predictions', 'ai'],
    lifecycle: 'development',
    lastUpdated: '2024-01-16T09:30:00Z',
    author: 'ML Team',
    isPublic: false,
    endpoints: 6,
    workspaceId: 'ws_personal_001'
  }
];

export const sortOptions: SortOption[] = [
  { value: 'title-asc', label: 'Name A-Z', key: 'title', direction: 'asc' },
  { value: 'title-desc', label: 'Name Z-A', key: 'title', direction: 'desc' },
  { value: 'lastUpdated-desc', label: 'Recently Updated', key: 'lastUpdated', direction: 'desc' },
  { value: 'lastUpdated-asc', label: 'Oldest Updated', key: 'lastUpdated', direction: 'asc' },
  { value: 'version-desc', label: 'Version (High to Low)', key: 'version', direction: 'desc' },
  { value: 'version-asc', label: 'Version (Low to High)', key: 'version', direction: 'asc' }
];

export const lifecycleColors = {
  development: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  staging: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  production: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  deprecated: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
};

// Generate filter options from demo data
export const getFilterOptions = (apis: ApiMetadata[]) => {
  const categories = [...new Set(apis.map(api => api.category))].sort();
  const tags = [...new Set(apis.flatMap(api => api.tags))].sort();
  const lifecycles = [...new Set(apis.map(api => api.lifecycle))].sort();

  return {
    categories: categories.map(cat => ({
      value: cat,
      label: cat,
      count: apis.filter(api => api.category === cat).length
    })),
    tags: tags.map(tag => ({
      value: tag,
      label: tag,
      count: apis.filter(api => api.tags.includes(tag)).length
    })),
    lifecycles: lifecycles.map(lifecycle => ({
      value: lifecycle,
      label: lifecycle.charAt(0).toUpperCase() + lifecycle.slice(1),
      count: apis.filter(api => api.lifecycle === lifecycle).length
    }))
  };
};

// Helper function to get APIs for a specific workspace
export const getWorkspaceApis = (workspaceId: string): ApiMetadata[] => {
  return demoApis.filter(api => api.workspaceId === workspaceId);
};

// Helper function to get APIs the user has access to based on workspace membership
export const getUserAccessibleApis = (userId: string, userWorkspaces: string[]): ApiMetadata[] => {
  return demoApis.filter(api => {
    // User has access if they're a member of the workspace or it's a public API in a public workspace
    return userWorkspaces.includes(api.workspaceId) || api.isPublic;
  });
};