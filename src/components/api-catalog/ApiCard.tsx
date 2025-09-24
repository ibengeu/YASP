import React from 'react';
import { ExternalLink, Eye, Calendar, User, Hash, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { ApiMetadata } from './types';
import { lifecycleColors } from './demo-data';
import { motion } from 'motion/react';

interface ApiCardProps {
  api: ApiMetadata;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onViewDocumentation: () => void;
  showCheckbox?: boolean;
  viewMode?: 'grid' | 'list';
}

export function ApiCard({
  api,
  isSelected,
  onSelect,
  onViewDocumentation,
  showCheckbox = true,
  viewMode = 'grid'
}: ApiCardProps) {
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(dateString));
  };

  const formatDateRelative = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return formatDate(dateString);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent card click when clicking on interactive elements
    if (
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('input[type="checkbox"]') ||
      (e.target as HTMLElement).closest('[role="checkbox"]')
    ) {
      return;
    }
    onViewDocumentation();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (e.shiftKey) {
        e.preventDefault();
        onSelect(!isSelected);
      } else {
        e.preventDefault();
        onViewDocumentation();
      }
    }
  };

  const getLifecycleColor = (lifecycle: string) => {
    switch (lifecycle) {
      case 'production':
        return 'bg-chart-3/10 text-chart-3 border-chart-3/20';
      case 'staging':
        return 'bg-chart-5/10 text-chart-5 border-chart-5/20';
      case 'development':
        return 'bg-chart-1/10 text-chart-1 border-chart-1/20';
      case 'deprecated':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted/50 text-muted-foreground border-border';
    }
  };

  if (viewMode === 'list') {
    return (
      <Card
        className={`cursor-pointer transition-all duration-75 ease-in-out hover:shadow-sm border-border group ${
          isSelected ? 'shadow-[inset_0_0_0_1px_var(--primary)] bg-primary/5' : 'hover:bg-muted/30'
        }`}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`${api.title} - ${api.description}`}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-6">
            {showCheckbox && (
              <div className="shrink-0">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={onSelect}
                  aria-label={`Select ${api.title}`}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-sans text-lg font-normal leading-tight tracking-normal truncate">{api.title}</h3>
                    <Badge variant="outline" className="text-xs font-normal border-border">
                      v{api.version}
                    </Badge>
                    <Badge className={`text-xs font-normal ${getLifecycleColor(api.lifecycle)}`}>
                      {api.lifecycle.charAt(0).toUpperCase() + api.lifecycle.slice(1)}
                    </Badge>
                    {!api.isPublic && (
                      <Badge variant="secondary" className="text-xs font-normal bg-muted/50 text-muted-foreground border-0">
                        Private
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                    {api.description}
                  </p>
                  
                  {api.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {api.tags.slice(0, 4).map((tag) => (
                        <Badge 
                          key={tag} 
                          variant="outline" 
                          className="text-xs font-normal border-border/50 bg-background/50"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {api.tags.length > 4 && (
                        <Badge variant="outline" className="text-xs font-normal border-border/50 bg-background/50">
                          +{api.tags.length - 4} more
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Updated {formatDateRelative(api.lastUpdated)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{api.author}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      <span>{api.endpoints} endpoints</span>
                    </div>
                    <Badge variant="secondary" className="bg-muted/50 text-muted-foreground border-0">
                      {api.category}
                    </Badge>
                  </div>
                </div>
                
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDocumentation();
                  }}
                  className="shrink-0"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Docs
                  <ExternalLink className="h-3 w-3 ml-2 opacity-50" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`cursor-pointer transition-all duration-75 ease-in-out hover:shadow border-border bg-card group ${
          isSelected ? 'shadow-[inset_0_0_0_1px_var(--primary)] bg-primary/5' : 'hover:bg-muted/30'
        }`}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`${api.title} - ${api.description}`}
      >
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {showCheckbox && (
                  <div className="shrink-0 mt-1">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={onSelect}
                      aria-label={`Select ${api.title}`}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-sans text-lg font-normal leading-tight tracking-normal truncate">{api.title}</h3>
                    <Badge variant="outline" className="text-xs font-normal border-border">
                      v{api.version}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={`text-xs font-normal ${getLifecycleColor(api.lifecycle)}`}>
                      {api.lifecycle === 'production' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {api.lifecycle.charAt(0).toUpperCase() + api.lifecycle.slice(1)}
                    </Badge>
                    {!api.isPublic && (
                      <Badge variant="secondary" className="text-xs font-normal bg-muted/50 text-muted-foreground border-0">
                        Private
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs font-normal bg-muted/50 text-muted-foreground border-0">
                      {api.category}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDocumentation();
                }}
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-secondary/50"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>

            {/* Description */}
            <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
              {api.description}
            </p>

            {/* Tags */}
            {api.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {api.tags.slice(0, 3).map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="outline" 
                    className="text-xs font-normal border-border/50 bg-background/50"
                  >
                    {tag}
                  </Badge>
                ))}
                {api.tags.length > 3 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="outline" className="text-xs font-normal border-border/50 bg-background/50">
                          +{api.tags.length - 3}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {api.tags.slice(3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/30">
              <div className="flex items-center gap-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDateRelative(api.lastUpdated)}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Last updated on {formatDate(api.lastUpdated)}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5">
                        <User className="h-3 w-3" />
                        <span>{api.author}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Maintained by {api.author}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5">
                      <Hash className="h-3 w-3" />
                      <span>{api.endpoints}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{api.endpoints} endpoints available</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}