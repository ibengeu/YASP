// API Catalog types
export interface ApiMetadata {
  id: string;
  title: string;
  version: string;
  description: string;
  category: string;
  tags: string[];
  lifecycle: 'development' | 'staging' | 'production' | 'deprecated';
  lastUpdated: string;
  author: string;
  specUrl?: string;
  documentationUrl?: string;
  isPublic: boolean;
  endpoints: number;
  workspaceId: string; // Added workspace association
}

export interface FilterState {
  categories: string[];
  tags: string[];
  lifecycles: string[];
}

export interface SortOption {
  value: string;
  label: string;
  key: keyof ApiMetadata | 'title' | 'lastUpdated' | 'version';
  direction: 'asc' | 'desc';
}

export interface CatalogState {
  apis: ApiMetadata[];
  filteredApis: ApiMetadata[];
  selectedApis: Set<string>;
  searchQuery: string;
  filters: FilterState;
  sortBy: string;
  currentPage: number;
  itemsPerPage: number;
  loading: boolean;
  error: string | null;
}

export interface FilterSection {
  key: keyof FilterState;
  title: string;
  options: FilterOption[];
  collapsed: boolean;
}

export interface FilterOption {
  value: string;
  label: string;
  count: number;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  startItem: number;
  endItem: number;
}