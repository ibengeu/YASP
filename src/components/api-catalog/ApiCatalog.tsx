import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Plus, Grid, List, SortAsc, Command } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '../ui/pagination';
import { Alert, AlertDescription } from '../ui/alert';
import { FilterSidebar } from './FilterSidebar';
import { ApiCard } from './ApiCard';
import { BatchActions } from './BatchActions';
import { ApiMetadata, CatalogState, FilterState, PaginationInfo } from './types';
import { demoApis, sortOptions, getFilterOptions, getWorkspaceApis } from './demo-data';
import { useWorkspace } from '../workspace/WorkspaceContext';
import { toast } from 'sonner';
import { motion } from 'motion/react';

interface ApiCatalogProps {
  onViewDocumentation: (api: ApiMetadata) => void;
  onAddApi: () => void;
}

export function ApiCatalog({ onViewDocumentation, onAddApi }: ApiCatalogProps) {
  const { currentWorkspace, permissions } = useWorkspace();
  const [state, setState] = useState<CatalogState>({
    apis: [],
    filteredApis: [],
    selectedApis: new Set(),
    searchQuery: '',
    filters: { categories: [], tags: [], lifecycles: [] },
    sortBy: 'title-asc',
    currentPage: 1,
    itemsPerPage: 12,
    loading: true,
    error: null
  });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Load workspace APIs when workspace changes
  useEffect(() => {
    const loadData = async () => {
      if (!currentWorkspace) {
        setState(prev => ({ ...prev, loading: false, apis: [], filteredApis: [] }));
        return;
      }

      setState(prev => ({ ...prev, loading: true }));
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Get APIs for current workspace
      const workspaceApis = getWorkspaceApis(currentWorkspace.id);
      
      setState(prev => ({
        ...prev,
        apis: workspaceApis,
        filteredApis: workspaceApis,
        loading: false
      }));
    };

    loadData();
  }, [currentWorkspace]);

  // Filter and search logic
  const filteredAndSearchedApis = useMemo(() => {
    let result = state.apis;

    // Apply search
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      result = result.filter(api =>
        api.title.toLowerCase().includes(query) ||
        api.description.toLowerCase().includes(query) ||
        api.category.toLowerCase().includes(query) ||
        api.tags.some(tag => tag.toLowerCase().includes(query)) ||
        api.author.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (state.filters.categories.length > 0) {
      result = result.filter(api => state.filters.categories.includes(api.category));
    }
    if (state.filters.lifecycles.length > 0) {
      result = result.filter(api => state.filters.lifecycles.includes(api.lifecycle));
    }
    if (state.filters.tags.length > 0) {
      result = result.filter(api => 
        api.tags.some(tag => state.filters.tags.includes(tag))
      );
    }

    // Apply sorting
    const sortOption = sortOptions.find(opt => opt.value === state.sortBy);
    if (sortOption) {
      result.sort((a, b) => {
        let aVal = a[sortOption.key];
        let bVal = b[sortOption.key];

        // Handle date sorting
        if (sortOption.key === 'lastUpdated') {
          aVal = new Date(aVal as string).getTime();
          bVal = new Date(bVal as string).getTime();
        }

        // Handle version sorting
        if (sortOption.key === 'version') {
          // Simple version comparison (works for semantic versioning)
          const parseVersion = (v: string) => v.split('.').map(n => parseInt(n) || 0);
          const aParts = parseVersion(aVal as string);
          const bParts = parseVersion(bVal as string);
          
          for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
            const aPart = aParts[i] || 0;
            const bPart = bParts[i] || 0;
            if (aPart !== bPart) {
              return sortOption.direction === 'asc' ? aPart - bPart : bPart - aPart;
            }
          }
          return 0;
        }

        // Handle string sorting
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortOption.direction === 'asc' 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        // Handle number sorting
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortOption.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }

        return 0;
      });
    }

    return result;
  }, [state.apis, state.searchQuery, state.filters, state.sortBy]);

  // Pagination logic
  const paginationInfo: PaginationInfo = useMemo(() => {
    const totalItems = filteredAndSearchedApis.length;
    const totalPages = Math.ceil(totalItems / state.itemsPerPage);
    const startItem = (state.currentPage - 1) * state.itemsPerPage;
    const endItem = Math.min(startItem + state.itemsPerPage, totalItems);

    return {
      currentPage: state.currentPage,
      totalPages,
      totalItems,
      itemsPerPage: state.itemsPerPage,
      startItem: startItem + 1,
      endItem
    };
  }, [filteredAndSearchedApis.length, state.currentPage, state.itemsPerPage]);

  const paginatedApis = useMemo(() => {
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    return filteredAndSearchedApis.slice(startIndex, startIndex + state.itemsPerPage);
  }, [filteredAndSearchedApis, state.currentPage, state.itemsPerPage]);

  // Filter options based on current APIs
  const filterOptions = useMemo(() => getFilterOptions(state.apis), [state.apis]);

  const handleSearch = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query, currentPage: 1 }));
  }, []);

  const handleFiltersChange = useCallback((filters: FilterState) => {
    setState(prev => ({ ...prev, filters, currentPage: 1 }));
  }, []);

  const handleSortChange = useCallback((sortBy: string) => {
    setState(prev => ({ ...prev, sortBy, currentPage: 1 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setState(prev => ({ ...prev, currentPage: page }));
  }, []);

  const handleApiSelect = useCallback((apiId: string, selected: boolean) => {
    setState(prev => {
      const newSelected = new Set(prev.selectedApis);
      if (selected) {
        newSelected.add(apiId);
      } else {
        newSelected.delete(apiId);
      }
      return { ...prev, selectedApis: newSelected };
    });
  }, []);

  const handleSelectAll = useCallback((selected: boolean) => {
    setState(prev => ({
      ...prev,
      selectedApis: selected 
        ? new Set(paginatedApis.map(api => api.id))
        : new Set()
    }));
  }, [paginatedApis]);

  const handleClearSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedApis: new Set() }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: { categories: [], tags: [], lifecycles: [] },
      currentPage: 1
    }));
  }, []);

  const handleBatchAction = useCallback((action: string, selectedIds: string[]) => {
    switch (action) {
      case 'delete':
        setState(prev => ({
          ...prev,
          apis: prev.apis.filter(api => !selectedIds.includes(api.id)),
          selectedApis: new Set()
        }));
        break;
      case 'archive':
        // In a real app, this would update the API status
        console.log('Archiving APIs:', selectedIds);
        break;
      case 'export':
        // In a real app, this would trigger a download
        console.log('Exporting APIs:', selectedIds);
        break;
      case 'view-docs':
        if (selectedIds.length === 1) {
          const api = state.apis.find(a => a.id === selectedIds[0]);
          if (api) {
            onViewDocumentation(api);
          }
        }
        break;
    }
  }, [state.apis, onViewDocumentation]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
      searchInput?.focus();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault();
      handleSelectAll(!Array.from(state.selectedApis).some(id => 
        paginatedApis.some(api => api.id === id)
      ));
    }
  }, [state.selectedApis, paginatedApis, handleSelectAll]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (state.loading) {
    return (
      <div className="h-full flex bg-background">
        <div className="w-80 p-6 border-r border-border bg-sidebar/30">
          <Skeleton className="h-8 w-full mb-6 rounded-lg" />
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-6 w-full rounded-md" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 p-8">
          <div className="flex justify-between items-start mb-8">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48 rounded-lg" />
              <Skeleton className="h-4 w-32 rounded" />
            </div>
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-10 w-80 rounded-lg" />
            <Skeleton className="h-10 w-48 rounded-lg" />
            <Skeleton className="h-10 w-20 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <Alert variant="destructive" className="max-w-md card-shadow border-destructive/20">
          <AlertDescription>
            {state.error}
            <Button variant="outline" size="sm" className="mt-3 w-full">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-semibold">No Workspace Selected</h2>
          <p className="text-muted-foreground">
            Please select a workspace from the dropdown above to view your APIs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r border-border bg-sidebar/30 overflow-y-auto">
        <div className="p-(--spacing-06)">
          <FilterSidebar
            filters={state.filters}
            onFiltersChange={handleFiltersChange}
            categoriesOptions={filterOptions.categories}
            tagsOptions={filterOptions.tags}
            lifecyclesOptions={filterOptions.lifecycles}
            onClearFilters={handleClearFilters}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="p-(--spacing-07) pb-0">
            <div className="flex items-start justify-between mb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl tracking-tight">API Catalog</h1>
                  {currentWorkspace && (
                    <Badge 
                      variant="secondary" 
                      className="px-2 py-1"
                      style={{ backgroundColor: `${currentWorkspace.color}20`, color: currentWorkspace.color }}
                    >
                      {currentWorkspace.name}
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground">
                  {paginationInfo.totalItems} API{paginationInfo.totalItems !== 1 ? 's' : ''} available
                  {currentWorkspace && ` in ${currentWorkspace.name}`}
                </p>
              </div>
              {permissions.canCreateResources && (
                <Button 
                  onClick={onAddApi} 
                  variant="primary"
                  size="lg"
                >
                  Add API
                </Button>
              )}
            </div>

            <div className="flex items-center gap-4 pb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search APIs..."
                  value={state.searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-12 h-12 bg-input-background border-border/50 focus:border-primary focus:ring-primary/30 rounded-xl"
                />
              </div>

              <Select value={state.sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-48 h-12 bg-input-background border-border/50 focus:border-primary focus:ring-primary/30 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50 card-shadow">
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="rounded-lg">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center bg-input-background border border-border/50 rounded-xl overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={`rounded-none h-12 px-4 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary/50'}`}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`rounded-none h-12 px-4 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary/50'}`}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Batch Actions */}
          {state.selectedApis.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="px-8 pb-4"
            >
              <BatchActions
                selectedCount={state.selectedApis.size}
                selectedIds={Array.from(state.selectedApis)}
                onClearSelection={handleClearSelection}
                onBatchAction={handleBatchAction}
              />
            </motion.div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-(--spacing-07) overflow-y-auto">
          {paginatedApis.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <div className="max-w-md space-y-4">
                {state.searchQuery || Object.values(state.filters).some(f => f.length > 0) ? (
                  <>
                    <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
                      <Search className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium tracking-tight">No APIs found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search terms or filters to find what you're looking for.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Plus className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium tracking-tight">No APIs yet</h3>
                      <p className="text-muted-foreground">
                        Get started by adding your first API specification to the catalog.
                      </p>
                    </div>
                  </>
                )}
                <Button 
                  onClick={onAddApi} 
                  variant={state.searchQuery || Object.values(state.filters).some(f => f.length > 0) ? "outline" : "default"}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add API
                </Button>
              </div>
            </div>
          ) : (
            <>
              <motion.div 
                className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                    : 'grid-cols-1'
                }`}
                layout
              >
                {paginatedApis.map((api, index) => (
                  <motion.div
                    key={api.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    layout
                  >
                    <ApiCard
                      api={api}
                      isSelected={state.selectedApis.has(api.id)}
                      onSelect={(selected) => handleApiSelect(api.id, selected)}
                      onViewDocumentation={() => onViewDocumentation(api)}
                      viewMode={viewMode}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {/* Pagination */}
              {paginationInfo.totalPages > 1 && (
                <div className="mt-12 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {paginationInfo.startItem}–{paginationInfo.endItem} of {paginationInfo.totalItems} APIs
                  </div>
                  
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => handlePageChange(Math.max(1, state.currentPage - 1))}
                          className={`${state.currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-secondary/50'} rounded-lg`}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(5, paginationInfo.totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => handlePageChange(page)}
                              isActive={page === state.currentPage}
                              className="cursor-pointer rounded-lg hover:bg-secondary/50 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => handlePageChange(Math.min(paginationInfo.totalPages, state.currentPage + 1))}
                          className={`${state.currentPage === paginationInfo.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-secondary/50'} rounded-lg`}
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
  );
}