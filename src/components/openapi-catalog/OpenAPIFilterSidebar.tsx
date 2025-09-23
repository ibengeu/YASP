/**
 * OpenAPI Filter Sidebar Component
 * Advanced filtering and search functionality for the OpenAPI catalog
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import {
  Search,
  Filter,
  X,
  ChevronDown,
  CalendarIcon,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Globe,
  Lock,
  Building,
} from 'lucide-react';
import { OpenAPISearchFilters } from './types';
import { useWorkspace } from '../workspace/WorkspaceContext';
import { format } from 'date-fns@3.6.0';

interface OpenAPIFilterSidebarProps {
  filters: OpenAPISearchFilters;
  onFiltersChange: (filters: OpenAPISearchFilters) => void;
  facets?: {
    categories: { name: string; count: number }[];
    tags: { name: string; count: number }[];
    workspaces: { id: string; name: string; count: number }[];
    owners: { id: string; name: string; count: number }[];
  };
  isLoading?: boolean;
}

export function OpenAPIFilterSidebar({
  filters,
  onFiltersChange,
  facets,
  isLoading = false,
}: OpenAPIFilterSidebarProps) {
  const { workspaces } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState(filters.query || '');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    status: true,
    validation: true,
    workspace: true,
    category: true,
    tags: false,
    owner: false,
    date: false,
    advanced: false,
  });

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onFiltersChange({ ...filters, query: value || undefined });
  };

  const handleFilterChange = (key: keyof OpenAPISearchFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleArrayFilterToggle = (key: keyof OpenAPISearchFilters, value: string) => {
    const currentArray = (filters[key] as string[]) || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    handleFilterChange(key, newArray.length > 0 ? newArray : undefined);
  };

  const clearFilters = () => {
    setSearchQuery('');
    onFiltersChange({});
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.query) count++;
    if (filters.status?.length) count++;
    if (filters.validationStatus?.length) count++;
    if (filters.workspaceIds?.length) count++;
    if (filters.categories?.length) count++;
    if (filters.tags?.length) count++;
    if (filters.owners?.length) count++;
    if (filters.dateRange) count++;
    if (filters.hasWarnings !== undefined) count++;
    if (filters.visibility?.length) count++;
    return count;
  };

  const statusOptions = [
    { value: 'draft', label: 'Draft', icon: Clock },
    { value: 'published', label: 'Published', icon: CheckCircle },
    { value: 'pending_approval', label: 'Pending Approval', icon: Clock },
    { value: 'validation_failed', label: 'Validation Failed', icon: AlertTriangle },
    { value: 'archived', label: 'Archived', icon: X },
    { value: 'deprecated', label: 'Deprecated', icon: AlertTriangle },
  ];

  const validationOptions = [
    { value: 'valid', label: 'Valid', icon: CheckCircle },
    { value: 'warnings', label: 'Has Warnings', icon: AlertTriangle },
    { value: 'invalid', label: 'Invalid', icon: X },
    { value: 'pending', label: 'Pending', icon: Clock },
    { value: 'validating', label: 'Validating', icon: RefreshCw },
  ];

  const visibilityOptions = [
    { value: 'private', label: 'Private', icon: Lock },
    { value: 'workspace', label: 'Workspace', icon: Users },
    { value: 'organization', label: 'Organization', icon: Building },
    { value: 'public', label: 'Public', icon: Globe },
  ];

  return (
    <div className="w-80 border-r bg-background overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <h3 className="font-semibold text-sm">Filters</h3>
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary" className="text-xs">
                {getActiveFilterCount()}
              </Badge>
            )}
          </div>
          {getActiveFilterCount() > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-auto p-1 text-xs"
            >
              Clear all
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search" className="text-xs font-medium">
            Search
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by title, description, tags..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 text-sm"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => handleSearchChange('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <Separator />

        {/* Status Filter */}
        <Collapsible open={expandedSections.status} onOpenChange={() => toggleSection('status')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <span className="text-xs font-medium">Status</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${expandedSections.status ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {statusOptions.map((option) => {
              const Icon = option.icon;
              return (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${option.value}`}
                    checked={filters.status?.includes(option.value as any) || false}
                    onCheckedChange={() => handleArrayFilterToggle('status', option.value)}
                  />
                  <Label
                    htmlFor={`status-${option.value}`}
                    className="text-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Icon className="h-3 w-3" />
                    {option.label}
                  </Label>
                </div>
              );
            })}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Validation Status Filter */}
        <Collapsible open={expandedSections.validation} onOpenChange={() => toggleSection('validation')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <span className="text-xs font-medium">Validation</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${expandedSections.validation ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {validationOptions.map((option) => {
              const Icon = option.icon;
              return (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`validation-${option.value}`}
                    checked={filters.validationStatus?.includes(option.value as any) || false}
                    onCheckedChange={() => handleArrayFilterToggle('validationStatus', option.value)}
                  />
                  <Label
                    htmlFor={`validation-${option.value}`}
                    className="text-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Icon className="h-3 w-3" />
                    {option.label}
                  </Label>
                </div>
              );
            })}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Workspace Filter */}
        <Collapsible open={expandedSections.workspace} onOpenChange={() => toggleSection('workspace')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <span className="text-xs font-medium">Workspace</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${expandedSections.workspace ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {facets?.workspaces?.map((workspace) => (
              <div key={workspace.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`workspace-${workspace.id}`}
                  checked={filters.workspaceIds?.includes(workspace.id) || false}
                  onCheckedChange={() => handleArrayFilterToggle('workspaceIds', workspace.id)}
                />
                <Label
                  htmlFor={`workspace-${workspace.id}`}
                  className="text-xs flex items-center justify-between w-full cursor-pointer"
                >
                  <span className="truncate">{workspace.name}</span>
                  <Badge variant="secondary" className="text-xs ml-2">
                    {workspace.count}
                  </Badge>
                </Label>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Category Filter */}
        <Collapsible open={expandedSections.category} onOpenChange={() => toggleSection('category')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <span className="text-xs font-medium">Category</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${expandedSections.category ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {facets?.categories?.map((category) => (
              <div key={category.name} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category.name}`}
                  checked={filters.categories?.includes(category.name) || false}
                  onCheckedChange={() => handleArrayFilterToggle('categories', category.name)}
                />
                <Label
                  htmlFor={`category-${category.name}`}
                  className="text-xs flex items-center justify-between w-full cursor-pointer"
                >
                  <span>{category.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {category.count}
                  </Badge>
                </Label>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Tags Filter */}
        <Collapsible open={expandedSections.tags} onOpenChange={() => toggleSection('tags')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <span className="text-xs font-medium">Tags</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${expandedSections.tags ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2 max-h-40 overflow-y-auto">
            {facets?.tags?.map((tag) => (
              <div key={tag.name} className="flex items-center space-x-2">
                <Checkbox
                  id={`tag-${tag.name}`}
                  checked={filters.tags?.includes(tag.name) || false}
                  onCheckedChange={() => handleArrayFilterToggle('tags', tag.name)}
                />
                <Label
                  htmlFor={`tag-${tag.name}`}
                  className="text-xs flex items-center justify-between w-full cursor-pointer"
                >
                  <span>{tag.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {tag.count}
                  </Badge>
                </Label>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Visibility Filter */}
        <Collapsible open={expandedSections.advanced} onOpenChange={() => toggleSection('advanced')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <span className="text-xs font-medium">Visibility</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${expandedSections.advanced ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {visibilityOptions.map((option) => {
              const Icon = option.icon;
              return (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`visibility-${option.value}`}
                    checked={filters.visibility?.includes(option.value as any) || false}
                    onCheckedChange={() => handleArrayFilterToggle('visibility', option.value)}
                  />
                  <Label
                    htmlFor={`visibility-${option.value}`}
                    className="text-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Icon className="h-3 w-3" />
                    {option.label}
                  </Label>
                </div>
              );
            })}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Date Range Filter */}
        <Collapsible open={expandedSections.date} onOpenChange={() => toggleSection('date')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <span className="text-xs font-medium">Date Range</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${expandedSections.date ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left text-xs h-8"
                >
                  <CalendarIcon className="mr-2 h-3 w-3" />
                  {filters.dateRange
                    ? `${format(filters.dateRange.start, 'MMM dd')} - ${format(filters.dateRange.end, 'MMM dd')}`
                    : 'Select date range'
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{
                    from: filters.dateRange?.start,
                    to: filters.dateRange?.end,
                  }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      handleFilterChange('dateRange', { start: range.from, end: range.to });
                    } else {
                      handleFilterChange('dateRange', undefined);
                    }
                    setDatePickerOpen(false);
                  }}
                  numberOfMonths={1}
                />
              </PopoverContent>
            </Popover>
            
            {filters.dateRange && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFilterChange('dateRange', undefined)}
                className="w-full text-xs h-6"
              >
                Clear date range
              </Button>
            )}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Advanced Options */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasWarnings"
              checked={filters.hasWarnings || false}
              onCheckedChange={(checked) => 
                handleFilterChange('hasWarnings', checked ? true : undefined)
              }
            />
            <Label htmlFor="hasWarnings" className="text-xs cursor-pointer">
              Has validation warnings
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}