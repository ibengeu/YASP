import { Search, Filter, SortAsc } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';

interface AdvancedControlsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  onFilterClick?: () => void;
}

export function AdvancedControls({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  onFilterClick
}: AdvancedControlsProps) {
  return (
    <div className="space-y-4">
      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="Search specifications, descriptions, or tags..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 py-3 bg-card shadow-sm border-border"
          />
        </div>
        
        <div className="flex gap-3">
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-40 bg-card shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
              <SelectItem value="version">Version</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            className="bg-card shadow-sm"
            onClick={onFilterClick}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Sort Indicator */}
      <div className="flex items-center text-xs text-muted-foreground mb-4">
        <SortAsc className="h-3 w-3 mr-1" />
        <span>
          {sortBy === 'recent' && 'Sorted by most recent'}
          {sortBy === 'name' && 'Sorted alphabetically by name'}
          {sortBy === 'version' && 'Sorted by version'}
        </span>
      </div>
    </div>
  );
}