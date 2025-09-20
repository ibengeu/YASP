import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@/core/components/ui/input';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Checkbox } from '@/core/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Separator } from '@/core/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/core/components/ui/collapsible';
import { Skeleton } from '@/core/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/core/components/ui/pagination';
import {
  Search,
  Plus,
  Filter,
  ChevronDown,
  ChevronRight,
  X,
  Calendar,
  Globe,
  Trash2,
  Archive,
  ExternalLink,
  AlertCircle,
  Package
} from 'lucide-react';
import { OpenApiDocument } from '@/common/openapi-spec';

interface ApiCatalogItem {
  id: string | number;
  title: string;
  version: string;
  lifecycle: 'stable' | 'beta' | 'alpha' | 'deprecated';
  description?: string;
  category: string;
  tags: string[];
  isDemo?: boolean;
  lastUpdated: string;
  endpoints: number;
  spec?: OpenApiDocument;
  workspaceType?: 'Personal' | 'Team' | 'Partner' | 'Public';
  syncStatus?: 'synced' | 'syncing' | 'offline';
  isDiscoverable?: boolean;
}

interface ApiCatalogViewProps {
  onViewDocumentation: (apiId: string | number) => void;
  onAddApi: () => void;
  items: ApiCatalogItem[];
  loading: boolean;
}

const ITEMS_PER_PAGE = 9;

// Mock categories and data for filtering
const categories = ['Demo', 'Identity', 'Finance', 'Communication', 'Analytics', 'Storage', 'Location', 'Commerce', 'Search', 'Content', 'Integration'];
const lifecycles = ['stable', 'beta', 'alpha', 'deprecated'] as const;

export function ApiCatalogView({ onViewDocumentation, onAddApi, items, loading }: ApiCatalogViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedLifecycles, setSelectedLifecycles] = useState<string[]>([]);
  const [selectedApis, setSelectedApis] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'version' | 'updated'>('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categoryFiltersOpen, setCategoryFiltersOpen] = useState(true);
  const [tagFiltersOpen, setTagFiltersOpen] = useState(false);
  const [lifecycleFiltersOpen, setLifecycleFiltersOpen] = useState(true);

  // Extract unique tags from items
  const allTags = useMemo(() => {
    return [...new Set(items.flatMap(item => item.tags || []))];
  }, [items]);

  // Filter and sort APIs
  const filteredAndSortedApis = useMemo(() => {
    let filtered = items.filter(api => {
      const matchesSearch = searchQuery === '' ||
        api.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (api.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (api.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategories.length === 0 ||
        selectedCategories.includes(api.category);

      const matchesTags = selectedTags.length === 0 ||
        selectedTags.some(tag => (api.tags || []).includes(tag));

      const matchesLifecycle = selectedLifecycles.length === 0 ||
        selectedLifecycles.includes(api.lifecycle);

      return matchesSearch && matchesCategory && matchesTags && matchesLifecycle;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.title.localeCompare(b.title);
        case 'version':
          return b.version.localeCompare(a.version);
        case 'updated':
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [items, searchQuery, selectedCategories, selectedTags, selectedLifecycles, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedApis.length / ITEMS_PER_PAGE);
  const paginatedApis = filteredAndSortedApis.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategories, selectedTags, selectedLifecycles]);

  const hasActiveFilters = selectedCategories.length > 0 || selectedTags.length > 0 || selectedLifecycles.length > 0;

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedTags([]);
    setSelectedLifecycles([]);
    setSearchQuery('');
  };

  const toggleCategoryFilter = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const toggleLifecycleFilter = (lifecycle: string) => {
    setSelectedLifecycles(prev =>
      prev.includes(lifecycle)
        ? prev.filter(l => l !== lifecycle)
        : [...prev, lifecycle]
    );
  };

  const toggleApiSelection = (apiId: string | number) => {
    setSelectedApis(prev =>
      prev.includes(apiId.toString())
        ? prev.filter(id => id !== apiId.toString())
        : [...prev, apiId.toString()]
    );
  };

  const selectAllApis = () => {
    setSelectedApis(paginatedApis.map(api => api.id.toString()));
  };

  const clearSelection = () => {
    setSelectedApis([]);
  };

  const getLifecycleBadgeVariant = (lifecycle: string) => {
    switch (lifecycle) {
      case 'stable': return 'default' as const;
      case 'beta': return 'secondary' as const;
      case 'alpha': return 'outline' as const;
      case 'deprecated': return 'destructive' as const;
      default: return 'outline' as const;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      clearSelection();
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col">
        {/* Header Skeleton */}
        <div className="border-b border-input p-6">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-8 w-48" />
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 flex">
          <div className="w-80 border-r border-input p-6">
            <Skeleton className="h-6 w-20 mb-4" />
            {[1, 2, 3].map(i => (
              <div key={i} className="mb-4">
                <Skeleton className="h-5 w-24 mb-2" />
                <div className="space-y-2">
                  {[1, 2, 3].map(j => (
                    <Skeleton key={j} className="h-4 w-32" />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex-1 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Header */}
      <div className="border-b border-input bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="h-6 w-6" />
                <h1 className="text-2xl">API Catalog</h1>
              </div>
              <Button onClick={onAddApi} className="gap-2">
                <Plus className="h-4 w-4" />
                Add API
              </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search APIs, descriptions, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Sort */}
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="version">Version</SelectItem>
                  <SelectItem value="updated">Last Updated</SelectItem>
                </SelectContent>
              </Select>

              {/* Mobile filter toggle */}
              <Button
                variant="outline"
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="md:hidden gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && <Badge variant="secondary" className="ml-1 text-xs">{selectedCategories.length + selectedTags.length + selectedLifecycles.length}</Badge>}
              </Button>
            </div>

            {/* Active filters */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {selectedCategories.map(category => (
                  <Badge key={category} variant="secondary" className="gap-1">
                    Category: {category}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => toggleCategoryFilter(category)}
                    />
                  </Badge>
                ))}
                {selectedTags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    Tag: {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => toggleTagFilter(tag)}
                    />
                  </Badge>
                ))}
                {selectedLifecycles.map(lifecycle => (
                  <Badge key={lifecycle} variant="secondary" className="gap-1">
                    {lifecycle}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => toggleLifecycleFilter(lifecycle)}
                    />
                  </Badge>
                ))}
                <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-6 text-xs">
                  Clear all
                </Button>
              </div>
            )}

            {/* Batch actions */}
            {selectedApis.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                <span className="text-sm">
                  {selectedApis.length} API{selectedApis.length > 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllApis}>
                    Select all on page
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    Clear selection
                  </Button>
                  <Separator orientation="vertical" className="h-6" />
                  <Button variant="outline" size="sm" className="gap-2">
                    <Archive className="h-4 w-4" />
                    Archive
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2 text-destructive">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Desktop */}
        <div className={`w-80 border-r border-input bg-background overflow-y-auto ${filtersOpen || window.innerWidth >= 768 ? 'block' : 'hidden'} md:block`}>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Filters</h3>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  Clear all
                </Button>
              )}
            </div>

            {/* Category Filter */}
            <Collapsible open={categoryFiltersOpen} onOpenChange={setCategoryFiltersOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-2 -ml-2 hover:bg-accent rounded">
                <span className="font-medium text-sm">Category</span>
                {categoryFiltersOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                {categories.map(category => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category}`}
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={() => toggleCategoryFilter(category)}
                    />
                    <label
                      htmlFor={`category-${category}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {category}
                    </label>
                    <span className="text-xs text-muted-foreground">
                      {items.filter(api => api.category === category).length}
                    </span>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* Lifecycle Filter */}
            <Collapsible open={lifecycleFiltersOpen} onOpenChange={setLifecycleFiltersOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-2 -ml-2 hover:bg-accent rounded">
                <span className="font-medium text-sm">Lifecycle</span>
                {lifecycleFiltersOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                {lifecycles.map(lifecycle => (
                  <div key={lifecycle} className="flex items-center space-x-2">
                    <Checkbox
                      id={`lifecycle-${lifecycle}`}
                      checked={selectedLifecycles.includes(lifecycle)}
                      onCheckedChange={() => toggleLifecycleFilter(lifecycle)}
                    />
                    <label
                      htmlFor={`lifecycle-${lifecycle}`}
                      className="text-sm cursor-pointer flex-1 capitalize"
                    >
                      {lifecycle}
                    </label>
                    <span className="text-xs text-muted-foreground">
                      {items.filter(api => api.lifecycle === lifecycle).length}
                    </span>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* Tags Filter */}
            <Collapsible open={tagFiltersOpen} onOpenChange={setTagFiltersOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-2 -ml-2 hover:bg-accent rounded">
                <span className="font-medium text-sm">Tags</span>
                {tagFiltersOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2 max-h-64 overflow-y-auto">
                {allTags.map(tag => {
                  const count = items.filter(api => (api.tags || []).includes(tag)).length;
                  if (count === 0) return null;

                  return (
                    <div key={tag} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag}`}
                        checked={selectedTags.includes(tag)}
                        onCheckedChange={() => toggleTagFilter(tag)}
                      />
                      <label
                        htmlFor={`tag-${tag}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {tag}
                      </label>
                      <span className="text-xs text-muted-foreground">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Results info */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                Showing {paginatedApis.length} of {filteredAndSortedApis.length} APIs
              </p>
              {currentPage > 1 && (
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
              )}
            </div>

            {/* Empty state */}
            {filteredAndSortedApis.length === 0 && (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No APIs found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || hasActiveFilters
                    ? "Try adjusting your search or filters"
                    : "Get started by adding your first API"}
                </p>
                <div className="space-x-2">
                  {(searchQuery || hasActiveFilters) && (
                    <Button variant="outline" onClick={clearAllFilters}>
                      Clear filters
                    </Button>
                  )}
                  <Button onClick={onAddApi}>
                    Add API
                  </Button>
                </div>
              </div>
            )}

            {/* API Grid */}
            {filteredAndSortedApis.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {paginatedApis.map(api => (
                    <Card
                      key={api.id}
                      className={`relative transition-colors hover:bg-accent/50 ${
                        selectedApis.includes(api.id.toString()) ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <div className="absolute top-4 left-4">
                        <Checkbox
                          checked={selectedApis.includes(api.id.toString())}
                          onCheckedChange={() => toggleApiSelection(api.id)}
                          aria-label={`Select ${api.title}`}
                        />
                      </div>

                      <CardHeader className="pb-3 pt-12">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate">{api.title}</CardTitle>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                v{api.version}
                              </Badge>
                              <Badge variant={getLifecycleBadgeVariant(api.lifecycle)} className="text-xs capitalize">
                                {api.lifecycle}
                              </Badge>
                              {api.isDemo && (
                                <Badge variant="secondary" className="text-xs">
                                  Demo
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <CardDescription className="text-sm line-clamp-3">
                          {api.description || 'No description available'}
                        </CardDescription>

                        <div className="flex flex-wrap gap-1">
                          {(api.tags || []).slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {(api.tags || []).length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{(api.tags || []).length - 3}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(api.lastUpdated)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {api.endpoints} endpoints
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-2"
                            onClick={() => onViewDocumentation(api.id)}
                          >
                            <ExternalLink className="h-3 w-3" />
                            View Documentation
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentPage > 1) setCurrentPage(currentPage - 1);
                            }}
                            className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                          />
                        </PaginationItem>

                        {/* Page numbers */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
                          if (pageNum > totalPages) return null;

                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCurrentPage(pageNum);
                                }}
                                isActive={currentPage === pageNum}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}

                        {totalPages > 5 && currentPage < totalPages - 2 && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}

                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                            }}
                            className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}