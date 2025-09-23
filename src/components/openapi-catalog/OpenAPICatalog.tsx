/**
 * OpenAPI Catalog Main Component
 * Central repository for browsing and managing OpenAPI specifications
 */

import React, { useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Plus,
  Search,
  FileText,
} from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '../ui/pagination';
import { OpenAPISpecCard } from './OpenAPISpecCard';
import { AddApiDialog } from '../api-catalog/AddApiDialog';
import { OpenAPISpec, OpenAPISearchFilters, OpenAPICatalogProps } from './types';
import { useWorkspace } from '../workspace/WorkspaceContext';
import { demoOpenAPISpecs } from './demo-data';
import { toast } from 'sonner@2.0.3';

type SortOption = 'title' | 'created';

export function OpenAPICatalog({
  workspaceId,
  onSpecSelect,
  onSpecUpload,
}: OpenAPICatalogProps) {
  const { activeWorkspace } = useWorkspace();
  const [specs, setSpecs] = useState<OpenAPISpec[]>(demoOpenAPISpecs);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('title');
  const [addApiDialogOpen, setAddApiDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Filter and sort specs
  const filteredAndSortedSpecs = useMemo(() => {
    let filtered = specs;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        spec =>
          spec.title.toLowerCase().includes(query) ||
          spec.description.toLowerCase().includes(query) ||
          spec.tags.some(tag => tag.name.toLowerCase().includes(query)) ||
          spec.category?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortBy) {
        case 'title':
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        case 'created':
          aVal = new Date(a.createdAt);
          bVal = new Date(b.createdAt);
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
      return 0;
    });

    return filtered;
  }, [specs, searchQuery, sortBy]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedSpecs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageSpecs = filteredAndSortedSpecs.slice(startIndex, endIndex);

  // Reset to first page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleApiAdded = (api: any) => {
    // Convert to OpenAPI spec format and add to list
    const newSpec: OpenAPISpec = {
      id: api.id,
      workspaceId: workspaceId || 'default',
      title: api.title,
      description: api.description,
      version: api.version,
      servers: [],
      paths: {},
      tags: api.tags.map((name: string) => ({ name })),
      displayName: api.title,
      category: api.category,
      owner: {
        id: 'current-user',
        firstName: api.author.split(' ')[0] || 'Unknown',
        lastName: api.author.split(' ')[1] || '',
        name: api.author,
        email: 'current@example.com',
        avatar: '',
        role: 'developer',
        createdAt: new Date(),
        lastLoginAt: new Date(),
        emailVerified: true,
        twoFactorEnabled: false,
        preferences: {
          theme: 'light',
          notifications: { email: true, push: false, sms: false },
          language: 'en'
        }
      },
      fileName: `${api.title.toLowerCase().replace(/\s+/g, '-')}.json`,
      fileFormat: 'json',
      fileSize: 1024,
      originalContent: '{}',
      status: 'draft',
      validationStatus: 'pending',
      validationErrors: [],
      versionHistory: [],
      currentVersionId: 'v1',
      createdAt: new Date(),
      updatedAt: new Date(),
      visibility: 'workspace',
      permissions: {
        canView: [],
        canEdit: [],
        canDelete: [],
        canDownload: [],
        canManageVersions: []
      },
      downloadCount: 0,
      auditLogs: []
    };
    
    setSpecs(prev => [newSpec, ...prev]);
    toast.success('API specification added successfully!');
  };

  return (
    <div className="flex h-screen">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b bg-background p-6 space-y-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">API Catalog</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Discover and manage your API specifications
              </p>
            </div>
            <Button 
              onClick={() => setAddApiDialogOpen(true)}
              size="sm"
              className="h-8 px-3"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add API
            </Button>
          </div>

          {/* Search and Sort */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search APIs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {filteredAndSortedSpecs.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No APIs found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? 'Try adjusting your search criteria.'
                  : 'Get started by adding your first API specification.'}
              </p>
              <Button onClick={() => setAddApiDialogOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add API
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Grid of specs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {currentPageSpecs.map((spec) => (
                  <OpenAPISpecCard
                    key={spec.id}
                    spec={spec}
                    onView={onSpecSelect}
                    showSimpleView={true}
                  />
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
                            if (currentPage > 1) {
                              setCurrentPage(currentPage - 1);
                            }
                          }}
                          className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Show first page, last page, current page, and pages around current
                        const showPage = page === 1 || 
                                        page === totalPages || 
                                        Math.abs(page - currentPage) <= 1;
                        
                        if (!showPage) {
                          // Show ellipsis if there's a gap
                          if (page === 2 && currentPage > 4) {
                            return (
                              <PaginationItem key={`ellipsis-${page}`}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          if (page === totalPages - 1 && currentPage < totalPages - 3) {
                            return (
                              <PaginationItem key={`ellipsis-${page}`}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          return null;
                        }
                        
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(page);
                              }}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) {
                              setCurrentPage(currentPage + 1);
                            }
                          }}
                          className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}

              {/* Results info */}
              <div className="text-center text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedSpecs.length)} of {filteredAndSortedSpecs.length} APIs
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add API Dialog */}
      <AddApiDialog
        open={addApiDialogOpen}
        onOpenChange={setAddApiDialogOpen}
        onApiAdded={handleApiAdded}
      />
    </div>
  );
}