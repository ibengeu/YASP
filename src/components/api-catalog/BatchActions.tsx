import React, { useState } from 'react';
import { Trash2, Archive, Download, MoreHorizontal, Eye, X, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '../ui/alert-dialog';
import { toast } from 'sonner@2.0.3';
import { motion } from 'motion/react';

interface BatchActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBatchAction: (action: string, selectedIds: string[]) => void;
  selectedIds: string[];
}

export function BatchActions({ 
  selectedCount, 
  onClearSelection, 
  onBatchAction,
  selectedIds 
}: BatchActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);

  if (selectedCount === 0) {
    return null;
  }

  const handleDelete = () => {
    onBatchAction('delete', selectedIds);
    setDeleteDialogOpen(false);
    onClearSelection();
    toast.success(`Successfully deleted ${selectedCount} API${selectedCount !== 1 ? 's' : ''}`);
  };

  const handleArchive = () => {
    onBatchAction('archive', selectedIds);
    setArchiveDialogOpen(false);
    onClearSelection();
    toast.success(`Successfully archived ${selectedCount} API${selectedCount !== 1 ? 's' : ''}`);
  };

  const handleExport = () => {
    // Simulate export functionality
    onBatchAction('export', selectedIds);
    toast.success(`Exporting ${selectedCount} API specification${selectedCount !== 1 ? 's' : ''}...`);
  };

  const handleViewDocumentation = () => {
    if (selectedCount === 1) {
      onBatchAction('view-docs', selectedIds);
    } else {
      toast.info('Please select only one API to view documentation');
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="border-primary/20 bg-primary/5 backdrop-blur-sm card-shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary/20 text-primary border-0 font-medium">
                        {selectedCount} selected
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedCount} API{selectedCount !== 1 ? 's' : ''} ready for action
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedCount === 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleViewDocumentation}
                    className="border-border/50 hover:bg-secondary/50 hover:border-primary/50"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Docs
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="border-border/50 hover:bg-secondary/50 hover:border-primary/50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setArchiveDialogOpen(true)}
                  className="border-border/50 hover:bg-secondary/50 hover:border-yellow-500/50 hover:text-yellow-700"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-border/50 hover:bg-secondary/50"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl border-border/50 card-shadow">
                    <DropdownMenuItem 
                      onClick={() => setDeleteDialogOpen(true)}
                      className="text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border/50" />
                    <DropdownMenuItem 
                      onClick={onClearSelection}
                      className="rounded-lg"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear Selection
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearSelection}
                  className="text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="border-border/50 card-shadow-lg rounded-xl">
          <AlertDialogHeader className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle className="text-xl tracking-tight">
                Delete APIs
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-muted-foreground leading-relaxed">
              Are you sure you want to delete {selectedCount} API{selectedCount !== 1 ? 's' : ''}? 
              This action cannot be undone and will permanently remove the API specifications 
              and their documentation from your catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="border-border/50 hover:bg-secondary/50 rounded-lg">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg shadow-sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete {selectedCount} API{selectedCount !== 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent className="border-border/50 card-shadow-lg rounded-xl">
          <AlertDialogHeader className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Archive className="h-5 w-5 text-yellow-600" />
              </div>
              <AlertDialogTitle className="text-xl tracking-tight">
                Archive APIs
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-muted-foreground leading-relaxed">
              Are you sure you want to archive {selectedCount} API{selectedCount !== 1 ? 's' : ''}? 
              Archived APIs will be hidden from the main catalog but can be restored later from 
              your archived items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="border-border/50 hover:bg-secondary/50 rounded-lg">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleArchive}
              className="bg-yellow-600 text-white hover:bg-yellow-600/90 rounded-lg shadow-sm"
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive {selectedCount} API{selectedCount !== 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}