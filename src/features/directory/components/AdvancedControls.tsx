import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, SortAsc, X, Tag, Clock, Layers } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Badge } from '@/core/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/core/components/ui/popover';
import { Checkbox } from '@/core/components/ui/checkbox';
import { Label } from '@/core/components/ui/label';
import { Separator } from '@/core/components/ui/separator';

export interface FilterOptions {
  workspaceTypes: string[];
  syncStatuses: string[];
  tags: string[];
}

export interface ActiveFilters {
  workspaceTypes: string[];
  syncStatuses: string[];
  tags: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

interface AdvancedControlsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  filterOptions?: FilterOptions;
  activeFilters: ActiveFilters;
  onFiltersChange: (filters: ActiveFilters) => void;
  suggestions?: string[];
  onClearAll?: () => void;
  resultCount?: number;
}

export function AdvancedControls({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  filterOptions,
  activeFilters,
  onFiltersChange,
  suggestions = [],
  onClearAll,
  resultCount
}: AdvancedControlsProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Filter active filter count
  const activeFilterCount = useMemo(() => {
    return (
      activeFilters.workspaceTypes.length +
      activeFilters.syncStatuses.length +
      activeFilters.tags.length +
      (activeFilters.dateRange ? 1 : 0)
    );
  }, [activeFilters]);
  
  const handleFilterChange = (type: keyof ActiveFilters, value: string, checked: boolean) => {
    if (type === 'dateRange') return; // Handle separately
    
    const currentValues = activeFilters[type] as string[];
    const newValues = checked 
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);
    
    onFiltersChange({
      ...activeFilters,
      [type]: newValues
    });
  };
  
  const clearFilter = (type: keyof ActiveFilters, value?: string) => {
    if (type === 'dateRange') {
      onFiltersChange({
        ...activeFilters,
        dateRange: undefined
      });
    } else if (value) {
      const currentValues = activeFilters[type] as string[];
      onFiltersChange({
        ...activeFilters,
        [type]: currentValues.filter(v => v !== value)
      });
    } else {
      onFiltersChange({
        ...activeFilters,
        [type]: []
      });
    }
  };
  
  const clearAllFilters = () => {
    onFiltersChange({
      workspaceTypes: [],
      syncStatuses: [],
      tags: []
    });
    onClearAll?.();
  };
  
  return (
    <div className="space-y-4">
      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="Search specifications, descriptions, or tags..."
            value={searchTerm}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setShowSuggestions(e.target.value.length > 1);
            }}
            onFocus={() => setShowSuggestions(searchTerm.length > 1)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="pl-10 py-3 bg-card shadow-sm border-border"
          />
          
          {/* Search Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 bg-popover border rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                  onClick={() => {
                    onSearchChange(suggestion);
                    setShowSuggestions(false);
                  }}
                >
                  <Search className="w-3 h-3 mr-2 inline" />
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex gap-3">
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-40 bg-card shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
              <SelectItem value="version">Version</SelectItem>
            </SelectContent>
          </Select>
          
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="bg-card shadow-sm relative"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
                {activeFilterCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center text-xs"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Filter Options</h3>
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                      Clear All
                    </Button>
                  )}
                </div>
                
                {/* Workspace Types */}
                {filterOptions?.workspaceTypes && filterOptions.workspaceTypes.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      <Label className="text-sm font-medium">Workspace Type</Label>
                    </div>
                    <div className="space-y-2 pl-6">
                      {filterOptions.workspaceTypes.map(type => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={`workspace-${type}`}
                            checked={activeFilters.workspaceTypes.includes(type)}
                            onCheckedChange={(checked) => 
                              handleFilterChange('workspaceTypes', type, checked as boolean)
                            }
                          />
                          <Label htmlFor={`workspace-${type}`} className="text-sm">
                            {type}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {filterOptions?.workspaceTypes && filterOptions.syncStatuses && (
                  <Separator />
                )}
                
                {/* Sync Status */}
                {filterOptions?.syncStatuses && filterOptions.syncStatuses.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <Label className="text-sm font-medium">Sync Status</Label>
                    </div>
                    <div className="space-y-2 pl-6">
                      {filterOptions.syncStatuses.map(status => (
                        <div key={status} className="flex items-center space-x-2">
                          <Checkbox
                            id={`sync-${status}`}
                            checked={activeFilters.syncStatuses.includes(status)}
                            onCheckedChange={(checked) => 
                              handleFilterChange('syncStatuses', status, checked as boolean)
                            }
                          />
                          <Label htmlFor={`sync-${status}`} className="text-sm capitalize">
                            {status}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {filterOptions?.syncStatuses && filterOptions.tags && (
                  <Separator />
                )}
                
                {/* Tags */}
                {filterOptions?.tags && filterOptions.tags.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      <Label className="text-sm font-medium">Tags</Label>
                    </div>
                    <div className="space-y-2 pl-6 max-h-32 overflow-y-auto">
                      {filterOptions.tags.slice(0, 10).map(tag => (
                        <div key={tag} className="flex items-center space-x-2">
                          <Checkbox
                            id={`tag-${tag}`}
                            checked={activeFilters.tags.includes(tag)}
                            onCheckedChange={(checked) => 
                              handleFilterChange('tags', tag, checked as boolean)
                            }
                          />
                          <Label htmlFor={`tag-${tag}`} className="text-sm">
                            {tag}
                          </Label>
                        </div>
                      ))}
                      {filterOptions.tags.length > 10 && (
                        <p className="text-xs text-muted-foreground pl-6">
                          ...and {filterOptions.tags.length - 10} more
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.workspaceTypes.map(type => (
            <Badge key={`workspace-${type}`} variant="secondary" className="flex items-center gap-1">
              <Layers className="w-3 h-3" />
              {type}
              <X 
                className="w-3 h-3 cursor-pointer hover:text-destructive" 
                onClick={() => clearFilter('workspaceTypes', type)}
              />
            </Badge>
          ))}
          {activeFilters.syncStatuses.map(status => (
            <Badge key={`sync-${status}`} variant="secondary" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {status}
              <X 
                className="w-3 h-3 cursor-pointer hover:text-destructive" 
                onClick={() => clearFilter('syncStatuses', status)}
              />
            </Badge>
          ))}
          {activeFilters.tags.map(tag => (
            <Badge key={`tag-${tag}`} variant="secondary" className="flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {tag}
              <X 
                className="w-3 h-3 cursor-pointer hover:text-destructive" 
                onClick={() => clearFilter('tags', tag)}
              />
            </Badge>
          ))}
        </div>
      )}
      
      {/* Results Info */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <SortAsc className="h-3 w-3" />
            <span>
              {sortBy === 'relevance' && 'Sorted by relevance'}
              {sortBy === 'recent' && 'Sorted by most recent'}
              {sortBy === 'name' && 'Sorted alphabetically by name'}
              {sortBy === 'version' && 'Sorted by version'}
            </span>
          </div>
          {resultCount !== undefined && (
            <span>• {resultCount} result{resultCount !== 1 ? 's' : ''}</span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-auto p-1 text-xs"
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}