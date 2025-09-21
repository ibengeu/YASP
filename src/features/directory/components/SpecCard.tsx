import React from 'react';
import { Cloud, Eye, /* Settings, */ FileJson, Tag, Trash2, Download } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { cn } from '@/core/lib/utils';

interface SpecCardProps {
  id: string | number;
  title: string;
  version: string;
  description?: string;
  createdAt: string | number | Date;
  workspaceType?: 'Personal' | 'Team' | 'Partner' | 'Public';
  syncStatus?: 'synced' | 'syncing' | 'offline';
  tags?: string[];
  isDiscoverable?: boolean;
  isRecentlyAdded?: boolean;
  onClick: () => void;
  // onSettingsClick?: (id: string | number) => void; // Hidden for now
  onDeleteClick?: (id: string | number) => void;
}

export function SpecCard({
  id,
  title,
  version,
  description,
  createdAt,
  // workspaceType = 'Personal', // Hidden for now
  syncStatus = 'synced',
  tags = [],
  isDiscoverable = false,
  isRecentlyAdded = false,
  onClick,
  // onSettingsClick, // Hidden for now
  onDeleteClick
}: SpecCardProps) {
  // Workspace color function hidden for now
  // const getWorkspaceColor = (type: string) => {
  //   switch (type) {
  //     case 'Personal': return 'bg-chart-1/20 text-chart-1 border-chart-1/30';
  //     case 'Team': return 'bg-chart-2/20 text-chart-2 border-chart-2/30';
  //     case 'Partner': return 'bg-chart-3/20 text-chart-3 border-chart-3/30';
  //     case 'Public': return 'bg-chart-4/20 text-chart-4 border-chart-4/30';
  //     default: return 'bg-muted text-muted-foreground border-border';
  //   }
  // };

  const getSyncIcon = () => {
    switch (syncStatus) {
      case 'synced': return <Cloud className="w-4 h-4 text-chart-2" />;
      case 'syncing': return <Cloud className="w-4 h-4 text-chart-1 animate-pulse" />;
      case 'offline': return <Cloud className="w-4 h-4 text-destructive" />;
      default: return <Cloud className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTimeAgo = (date: string | number | Date) => {
    const now = new Date();
    const createdDate = new Date(date);
    const diffInDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  // Settings click handler hidden for now
  // const handleSettingsClick = (e: React.MouseEvent) => {
  //   e.stopPropagation();
  //   onSettingsClick?.(id);
  // };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteClick?.(id);
  };

  return (
    <div className="relative group">
      <div
        className="card-apple cursor-pointer h-full group"
        onClick={onClick}
      >
        <div className="h-full flex flex-col">
          {/* Header Section */}
          <div className="flex-shrink-0 mb-3">
            <div className="flex items-start gap-3">
              <div className="mt-1 bg-primary/10 rounded-lg p-2">
                <FileJson className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-headline font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {title}
                  </h3>
                  {isRecentlyAdded && (
                    <span className="text-caption2 bg-primary/10 text-primary px-2 py-1 rounded-full">
                      New
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 flex flex-col space-y-3">
            {/* Fixed height description area */}
            <div className="h-10">
              {description && (
                <p className="text-subheadline text-muted-foreground line-clamp-2 leading-relaxed">
                  {description}
                </p>
              )}
            </div>

            {/* Metadata and status row - always at same position */}
            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center gap-3 text-footnote text-muted-foreground">
                <span className="font-medium flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  v{version}
                </span>
                <span>•</span>
                <span>{getTimeAgo(createdAt)}</span>
              </div>

              <div className="flex items-center gap-2">
                {getSyncIcon()}
                {isDiscoverable && (
                  <div className="relative group/tooltip">
                    <Eye className="w-4 h-4 text-chart-1" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-caption2 text-primary-foreground bg-foreground rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap z-20">
                      Visible to community
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Section */}
          {tags.length > 0 && (
            <div className="border-t border-border pt-3 mt-3 flex-shrink-0">
              <div className="flex flex-wrap gap-1 w-full">
                {tags.map((tag, index) => (
                  <span key={index} className="text-caption2 bg-secondary text-secondary-foreground px-2 py-1 rounded-md">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Hover Actions - Side Panel */}
      <div className={cn(
        "absolute top-1/2 -translate-y-1/2 -right-2 flex flex-col gap-1 bg-card border border-border rounded-lg shadow-lg p-1 transition-all duration-200 z-10",
        "opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 pointer-events-none group-hover:pointer-events-auto"
      )}>
        {/* Settings button hidden for now */}
        
        <div className="relative group/tooltip">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement download functionality
            }}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
          >
            <Download className="w-4 h-4" />
          </Button>
          <div className="absolute top-1/2 -translate-y-1/2 right-full mr-2 px-2 py-1 text-xs text-primary-foreground bg-foreground rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Download
          </div>
        </div>
        
        {onDeleteClick && (
          <div className="relative group/tooltip">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteClick}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <div className="absolute top-1/2 -translate-y-1/2 right-full mr-2 px-2 py-1 text-xs text-destructive-foreground bg-destructive rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Delete
            </div>
          </div>
        )}
      </div>
    </div>
  );
}