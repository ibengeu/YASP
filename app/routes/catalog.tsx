/**
 * API Catalog - Browse and manage specifications
 * Transformed with modern ApiCard components and PageHeader
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Plus, Upload, Search, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/navigation/PageHeader';
import { ApiCard } from '@/components/catalog/ApiCard';
import { GenerateSpecDialog } from '@/features/ai-catalyst/components/GenerateSpecDialog';
import { ImportSpecDialog } from '@/features/library/components/ImportSpecDialog';
import { RegisterApiDrawer } from '@/components/registration/RegisterApiDrawer';
import { idbStorage } from '@/core/storage/idb-storage';
import type { OpenApiDocument } from '@/core/storage/storage-schema';
import { staggerFadeIn, pageTransition } from '@/lib/animations';

export default function CatalogPage() {
  const navigate = useNavigate();
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showRegisterDrawer, setShowRegisterDrawer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [specs, setSpecs] = useState<OpenApiDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Refs for anime.js animations (React pattern)
  const pageRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    loadSpecs();
  }, []);

  // Animate page entrance
  useEffect(() => {
    if (pageRef.current) {
      pageTransition(pageRef.current);
    }
  }, []);

  const loadSpecs = async () => {
    setIsLoading(true);
    try {
      let allSpecs = await idbStorage.getAllSpecs();

      // Add dummy data if empty
      if (allSpecs.length === 0) {
        const dummySpec = `openapi: 3.1.0
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

        await idbStorage.createSpec({
          type: 'openapi',
          content: dummySpec,
          title: 'E-Commerce API',
          version: '1.0.0',
          description: 'RESTful API for managing products, orders, and customers',
          metadata: {
            score: 85,
            tags: ['ecommerce', 'rest', 'example'],
            workspaceType: 'personal',
            syncStatus: 'synced',
            isDiscoverable: true,
          },
        });

        allSpecs = await idbStorage.getAllSpecs();
      }

      setSpecs(allSpecs);
    } catch (error) {
      console.error('Failed to load specs:', error);
      // Mitigation for OWASP A09:2025 – Security Logging and Monitoring Failures:
      // Log errors without exposing sensitive implementation details to users
      toast.error('Failed to load specifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await idbStorage.deleteSpec(id);
      toast.success('Specification deleted');
      loadSpecs();
    } catch (error) {
      console.error('Failed to delete spec:', error);
      toast.error('Failed to delete specification');
    }
  };

  // Filter specs based on search and filters
  const filteredSpecs = specs.filter((spec) => {
    const matchesSearch =
      spec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spec.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spec.metadata.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && spec.metadata.syncStatus === 'synced') ||
      (statusFilter === 'draft' && spec.metadata.syncStatus !== 'synced');

    const matchesType =
      typeFilter === 'all' ||
      spec.metadata.workspaceType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Animate cards when loaded (following anime.js React docs)
  useEffect(() => {
    if (!isLoading && filteredSpecs.length > 0) {
      // Filter out null refs
      const validRefs = cardsRef.current.filter((ref): ref is HTMLDivElement => ref !== null);

      if (validRefs.length > 0) {
        staggerFadeIn(validRefs, 50);
      }
    }
  }, [isLoading, filteredSpecs.length]);

  return (
    <div ref={pageRef} className="bg-[#FAFBFC] dark:bg-[#0E1420] min-h-screen" style={{ opacity: 0 }}>
      <PageHeader
        title="API Catalog"
        description={`Browse ${specs.length} registered APIs`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImportDialog(true)}
              className="px-3 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-md hover:bg-muted transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
            <button
              onClick={() => setShowRegisterDrawer(true)}
              className="px-3 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Register New API
            </button>
          </div>
        }
        extraContent={
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search APIs, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-card border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Types</option>
              <option value="personal">Personal</option>
              <option value="team">Team</option>
              <option value="partner">Partner</option>
              <option value="public">Public</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-card border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        }
      />

      <div className="px-4 md:px-6 lg:px-8 pb-8 mt-6">
        {/* Catalog Grid */}
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-border border-r-primary"></div>
          </div>
        ) : filteredSpecs.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#0a0a0a] rounded-lg border border-border">
            <div className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'No specifications match your filters'
                : 'No specifications yet'}
            </div>
            {!searchQuery && statusFilter === 'all' && typeFilter === 'all' && (
              <button
                onClick={() => setShowGenerateDialog(true)}
                className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:opacity-90 transition-opacity cursor-pointer"
              >
                Create Your First API
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop: Table View (lg and above) */}
            <div className="hidden lg:block">
              <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                        Version
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                        Quality
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                        Updated
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredSpecs.map((spec, index) => {
                      const score = spec.metadata.score || 0;
                      const statusBadge = spec.metadata.syncStatus === 'synced'
                        ? { label: 'Active', color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' }
                        : spec.content.includes('deprecated: true')
                        ? { label: 'Deprecated', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' }
                        : { label: 'Draft', color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20' };

                      return (
                        <tr
                          key={spec.id}
                          ref={(el) => {
                            cardsRef.current[index] = el;
                          }}
                          className="hover:bg-muted/50 cursor-pointer transition-colors animate-in fade-in duration-300"
                          style={{ animationDelay: `${index * 50}ms` }}
                          onClick={() => navigate(`/editor/${spec.id}`)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusBadge.color}`}>
                              {statusBadge.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-foreground">
                              {spec.title}
                            </div>
                            {spec.description && (
                              <div className="text-xs text-muted-foreground truncate max-w-md">
                                {spec.description}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {spec.version}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20">
                              {spec.metadata.workspaceType}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="bg-muted rounded-full h-1.5 w-20 overflow-hidden">
                                <div
                                  className={`h-full transition-all ${
                                    score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${score}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-foreground">{score}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {new Date(spec.updated_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(spec.id);
                              }}
                              className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors"
                              aria-label="Delete specification"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Medium Devices: 2-Column Card Grid (md to lg) */}
            <div className="hidden md:grid lg:hidden grid-cols-2 gap-4">
              {filteredSpecs.map((spec, index) => (
                <div
                  key={spec.id}
                  className="animate-in fade-in duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ApiCard
                    spec={spec}
                    onClick={() => navigate(`/editor/${spec.id}`)}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>

            {/* Mobile: Single Column Cards (below md) */}
            <div className="md:hidden flex flex-col gap-4">
              {filteredSpecs.map((spec, index) => (
                <div
                  key={spec.id}
                  className="animate-in fade-in duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ApiCard
                    spec={spec}
                    onClick={() => navigate(`/editor/${spec.id}`)}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Dialogs */}
      <GenerateSpecDialog
        open={showGenerateDialog}
        onClose={() => setShowGenerateDialog(false)}
        onGenerated={async (yamlSpec) => {
          const yaml = await import('yaml');
          const parsed = yaml.parse(yamlSpec);

          const newSpec = await idbStorage.createSpec({
            type: 'openapi',
            content: yamlSpec,
            title: parsed.info?.title || 'Generated API',
            version: parsed.info?.version || '1.0.0',
            description: parsed.info?.description,
            metadata: {
              score: 0,
              tags: ['ai-generated'],
              workspaceType: 'personal',
              syncStatus: 'offline',
              isDiscoverable: false,
            },
          });

          toast.success('Specification generated successfully');
          navigate(`/editor/${newSpec.id}`);
        }}
      />

      <ImportSpecDialog open={showImportDialog} onOpenChange={setShowImportDialog} />

      <RegisterApiDrawer
        isOpen={showRegisterDrawer}
        onClose={() => setShowRegisterDrawer(false)}
        onSuccess={() => {
          setShowRegisterDrawer(false);
          loadSpecs();
        }}
      />
    </div>
  );
}
