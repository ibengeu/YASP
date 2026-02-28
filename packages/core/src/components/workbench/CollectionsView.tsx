import { useState, useMemo } from 'react';
import { Plus, Search, FolderOpen } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { cn } from '@/lib/utils';

export function CollectionsView() {
  const [searchQuery, setSearchQuery] = useState('');
  const { workspaces } = useWorkspaceStore();

  // Filter workspaces based on search
  const filteredWorkspaces = useMemo(() => {
    return workspaces.filter((ws) =>
      ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ws.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    );
  }, [workspaces, searchQuery]);

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Collections</h2>
          <p className="text-sm text-muted-foreground">
            Organize your API requests into groups
          </p>
        </div>
        <Button size="sm" className="cursor-pointer gap-1.5">
          <Plus className="w-4 h-4" />
          New Collection
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search collections..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 text-sm"
        />
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredWorkspaces.length > 0 ? (
          filteredWorkspaces.map((workspace) => (
            <Card
              key={workspace.id}
              className={cn(
                'cursor-pointer hover:border-primary/30 transition-colors group',
                'border-border/60'
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10">
                    <FolderOpen className="w-5 h-5 text-primary" />
                  </div>
                  <Badge variant="secondary" className="text-xs font-bold">
                    {workspace.specIds.length} {workspace.specIds.length === 1 ? 'API' : 'APIs'}
                  </Badge>
                </div>
                <CardTitle className="text-base font-bold mt-3 group-hover:text-primary transition-colors">
                  {workspace.name}
                </CardTitle>
                {workspace.description && (
                  <CardDescription className="text-sm">
                    {workspace.description}
                  </CardDescription>
                )}
              </CardHeader>
            </Card>
          ))
        ) : (
          <div className="col-span-full p-12 text-center bg-card/50 rounded-lg border border-border/60">
            <FolderOpen className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium mb-3">
              {searchQuery
                ? 'No collections match your search.'
                : 'No collections yet. Create one to organize your APIs.'}
            </p>
            {!searchQuery && (
              <Button size="sm" className="cursor-pointer gap-1.5">
                <Plus className="w-4 h-4" />
                Create First Collection
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
