/**
 * API Catalog - Browse and manage specifications
 * Sidebar + Workbench layout: catalog grid or inline workbench view
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Upload, FileCode, LayoutGrid, List } from 'lucide-react';
import { ApiCard } from '@/components/catalog/ApiCard';
import { PageLayout } from '@/components/layout/PageLayout';
import { ImportSpecDialog } from '@/components/registration/ImportSpecDialog';
import { EmailGateModal } from '@/components/lead-capture/EmailGateModal';
import { idbStorage } from '@/core/storage/idb-storage';
import type { OpenApiDocument } from '@/core/storage/storage-schema';
import { staggerFadeIn, pageTransition } from '@/lib/animations';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useActionTracker } from '@/hooks/useActionTracker';
import { markEmailCaptured } from '@/lib/action-tracker';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CatalogPageProps {
  /** Platform-specific URL fetcher forwarded to ImportSpecDialog. */
  fetchUrl: (url: string) => Promise<string>;
}

export default function CatalogPage({ fetchUrl }: CatalogPageProps) {
  const navigate = useNavigate();
  const [showRegisterDrawer, setShowRegisterDrawer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [specs, setSpecs] = useState<OpenApiDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { workspaces, activeWorkspaceId } = useWorkspaceStore();
  const { showGate, trackAction, dismiss, captureEmail } = useActionTracker();

  const pageRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => { loadSpecs(); loadFavorites(); }, []);

  useEffect(() => {
    if (pageRef.current) {
      pageTransition(pageRef.current);
    }
  }, []);

  const loadSpecs = async () => {
    setIsLoading(true);
    try {
      const allSpecs = await idbStorage.getAllSpecs();
      setSpecs(allSpecs);
    } catch (error) {
      console.error('Failed to load specs:', error);
      toast.error('Failed to load APIs. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      await idbStorage.getFavoriteSpecIds();
    } catch { /* non-critical */ }
  };

  const handleDelete = async (id: string) => {
    try {
      await idbStorage.removeSpecFromWorkflows(id);
      await idbStorage.removeSpecFromWorkspaces(id);
      await idbStorage.deleteSpec(id);
      toast.success('API deleted successfully');
      loadSpecs();
    } catch (error) {
      console.error('Failed to delete spec:', error);
      toast.error('Failed to delete API. Please try again.');
    }
  };


  // Filter specs based on active workspace and search
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const filteredSpecs = specs.filter(
    (spec) => {
    if (activeWorkspace && !activeWorkspace.isDefault) {
      if (!activeWorkspace.specIds.includes(spec.id)) return false;
    }
    const matchesSearch =
      spec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spec.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spec.metadata.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  // Animate cards when loaded
  useEffect(() => {
    if (!isLoading && filteredSpecs.length > 0) {
      const validRefs = cardsRef.current.filter((ref): ref is HTMLDivElement => ref !== null);
      if (validRefs.length > 0) staggerFadeIn(validRefs, 50);
    }
  }, [isLoading, filteredSpecs.length]);

  return (
    <PageLayout
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onOpenRegister={() => setShowRegisterDrawer(true)}
      onJoinBeta={() => { trackAction(); }}
      activeView="collections"
    >
      <div ref={pageRef} className="flex-1 overflow-y-auto custom-scroll" style={{ opacity: 0 }}>
        <div className="relative z-10 p-8 max-w-6xl mx-auto w-full">
          {/* Page header */}
          <div className="flex items-end justify-between mb-8 pb-6 border-b border-border">
            <div>
              <h1 className="text-3xl font-bold text-foreground">API Collections</h1>
              <p className="text-base text-muted-foreground mt-2 max-w-lg leading-relaxed">
                Browse documentation for all internal and external services.
                Import new specifications to expand the catalog.
              </p>
            </div>
            {/* Grid / List toggle - Pattern: active primary with shadow */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('list')}
                className={cn(
                  "h-9 w-9 border transition-all",
                  viewMode === 'list' 
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 hover:bg-primary/90" 
                    : "bg-muted/50 border-border text-muted-foreground hover:text-foreground"
                )}
                title="List view"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('grid')}
                className={cn(
                  "h-9 w-9 border transition-all",
                  viewMode === 'grid' 
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 hover:bg-primary/90" 
                    : "bg-muted/50 border-border text-muted-foreground hover:text-foreground"
                )}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent" />
            </div>
          ) : filteredSpecs.length === 0 ? (
            <div className="col-span-full p-16 text-center rounded-xl border border-border bg-card/30">
              <FileCode className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium mb-4">
                {searchQuery ? 'No APIs match your search.' : 'No APIs registered yet. Import your first spec to get started.'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowRegisterDrawer(true)} className="gap-1.5">
                  <Upload className="w-4 h-4" /> Import API
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Grid Mode */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredSpecs.map((spec, index) => (
                    <div
                      key={spec.id}
                      ref={(el) => { cardsRef.current[index] = el; }}
                    >
                      <ApiCard
                        spec={spec}
                        viewMode="grid"
                        onClick={() => navigate(`/catalog/${spec.id}`)}
                        onDelete={handleDelete}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* List Mode */}
              {viewMode === 'list' && (
                <div className="flex flex-col gap-3">
                  {filteredSpecs.map((spec, index) => (
                    <div
                      key={spec.id}
                      ref={(el) => { cardsRef.current[index] = el; }}
                    >
                      <ApiCard
                        spec={spec}
                        viewMode="list"
                        onClick={() => navigate(`/catalog/${spec.id}`)}
                        onDelete={handleDelete}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ImportSpecDialog
        isOpen={showRegisterDrawer}
        onClose={() => setShowRegisterDrawer(false)}
        onSuccess={() => {
          setShowRegisterDrawer(false);
          loadSpecs();
        }}
        fetchUrl={fetchUrl}
      />

      <EmailGateModal
        open={showGate}
        onSubmit={async (email) => {
          const response = await fetch('/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, source: 'catalog_gate' }),
          });
          if (!response.ok) throw new Error('Failed to submit');
          captureEmail(email);
          markEmailCaptured(email);
        }}
        onDismiss={dismiss}
      />
    </PageLayout>
  );
}
