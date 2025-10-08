import React, {useState} from 'react';
import {ChevronRight, Filter, X} from 'lucide-react';
import {Button} from '../ui/button';
import {Card, CardContent} from '../ui/card';
import {Checkbox} from '../ui/checkbox';
import {ScrollArea} from '../ui/scroll-area';
import {Badge} from '../ui/badge';
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from '../ui/collapsible';
import {FilterOption, FilterState} from './types';
import {AnimatePresence, motion} from 'motion/react';

interface FilterSidebarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  categoriesOptions: FilterOption[];
  tagsOptions: FilterOption[];
  lifecyclesOptions: FilterOption[];
  onClearFilters: () => void;
}

export function FilterSidebar({
  filters,
  onFiltersChange,
  categoriesOptions,
  tagsOptions,
  lifecyclesOptions,
  onClearFilters
}: FilterSidebarProps) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const hasActiveFilters = 
    filters.categories.length > 0 || 
    filters.tags.length > 0 || 
    filters.lifecycles.length > 0;

  const activeFilterCount = 
    filters.categories.length + 
    filters.tags.length + 
    filters.lifecycles.length;

  const toggleSection = (section: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(section)) {
      newCollapsed.delete(section);
    } else {
      newCollapsed.add(section);
    }
    setCollapsedSections(newCollapsed);
  };

  const handleFilterChange = (
    section: keyof FilterState,
    value: string,
    checked: boolean
  ) => {
    const currentValues = filters[section];
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);

    onFiltersChange({
      ...filters,
      [section]: newValues
    });
  };

  const FilterSection = ({ 
    title, 
    sectionKey, 
    options, 
    selectedValues 
  }: {
    title: string;
    sectionKey: keyof FilterState;
    options: FilterOption[];
    selectedValues: string[];
  }) => {
    const isCollapsed = collapsedSections.has(sectionKey);
    const selectedCount = selectedValues.length;

    return (
      <div className="border-b border-border/30 last:border-b-0">
        <Collapsible open={!isCollapsed} onOpenChange={() => toggleSection(sectionKey)}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between px-4 py-4 h-auto hover:bg-secondary/30 rounded-none"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium text-left">{title}</span>
                {selectedCount > 0 && (
                  <Badge className="text-xs bg-primary/10 text-primary border-0 font-medium">
                    {selectedCount}
                  </Badge>
                )}
              </div>
              <motion.div
                animate={{ rotate: isCollapsed ? 0 : 90 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </motion.div>
            </Button>
          </CollapsibleTrigger>

          <AnimatePresence>
            {!isCollapsed && (
              <CollapsibleContent forceMount>
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4">
                    <ScrollArea className="max-h-48">
                      <div className="space-y-3">
                        {options.map((option) => {
                          const isSelected = selectedValues.includes(option.value);
                          return (
                            <motion.div
                              key={option.value}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.15, delay: options.indexOf(option) * 0.02 }}
                              className="flex items-center space-x-3"
                            >
                              <Checkbox
                                id={`${sectionKey}-${option.value}`}
                                checked={isSelected}
                                onCheckedChange={(checked) =>
                                  handleFilterChange(sectionKey, option.value, !!checked)
                                }
                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                              <label
                                htmlFor={`${sectionKey}-${option.value}`}
                                className="flex-1 text-sm cursor-pointer flex items-center justify-between group"
                              >
                                <span className={`transition-colors ${isSelected ? 'text-primary font-medium' : 'text-foreground group-hover:text-primary'}`}>
                                  {option.label}
                                </span>
                                <Badge 
                                  variant="outline" 
                                  className="text-xs bg-background/50 border-border/50 text-muted-foreground"
                                >
                                  {option.count}
                                </Badge>
                              </label>
                            </motion.div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </div>
                </motion.div>
              </CollapsibleContent>
            )}
          </AnimatePresence>
        </Collapsible>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Filter className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold tracking-tight">Filters</h2>
            {activeFilterCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} applied
              </p>
            )}
          </div>
        </div>

        {/* Clear Filters */}
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                className="w-full border-border/50 hover:bg-destructive/5 hover:border-destructive/50 hover:text-destructive"
              >
                <X className="h-4 w-4 mr-2" />
                Clear All Filters
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Filters */}
      <Card className="border-border/50 card-shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-0">
          <FilterSection
            title="Category"
            sectionKey="categories"
            options={categoriesOptions}
            selectedValues={filters.categories}
          />
          
          <FilterSection
            title="Lifecycle Stage"
            sectionKey="lifecycles"
            options={lifecyclesOptions}
            selectedValues={filters.lifecycles}
          />
          
          <FilterSection
            title="Tags"
            sectionKey="tags"
            options={tagsOptions}
            selectedValues={filters.tags}
          />
        </CardContent>
      </Card>

      {/* Active Filters Summary */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <h3 className="text-sm font-medium text-muted-foreground">Active Filters</h3>
            <div className="space-y-2">
              {filters.categories.map((category) => (
                <motion.div
                  key={`category-${category}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center justify-between group"
                >
                  <Badge 
                    variant="secondary" 
                    className="bg-primary/10 text-primary border-0 font-medium"
                  >
                    {category}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFilterChange('categories', category, false)}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </motion.div>
              ))}
              
              {filters.lifecycles.map((lifecycle) => (
                <motion.div
                  key={`lifecycle-${lifecycle}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center justify-between group"
                >
                  <Badge 
                    variant="secondary" 
                    className="bg-primary/10 text-primary border-0 font-medium"
                  >
                    {lifecycle}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFilterChange('lifecycles', lifecycle, false)}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </motion.div>
              ))}
              
              {filters.tags.map((tag) => (
                <motion.div
                  key={`tag-${tag}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center justify-between group"
                >
                  <Badge 
                    variant="secondary" 
                    className="bg-primary/10 text-primary border-0 font-medium"
                  >
                    {tag}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFilterChange('tags', tag, false)}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}