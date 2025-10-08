import {useCallback, useState} from 'react';
import {ChevronDown, ChevronRight} from 'lucide-react';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from '@/components/ui/collapsible';
import {Input} from '@/components/ui/input';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip';
import {EndpointGroup, EndpointInfo} from './types';

interface EndpointsListProps {
  endpointGroups: EndpointGroup[];
  selectedEndpoint: EndpointInfo | null;
  onEndpointSelect: (endpoint: EndpointInfo) => void;
  onGroupToggle: (tag: string) => void;
}

const methodColors = {
  get: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  post: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  put: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  patch: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  delete: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  head: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  options: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  trace: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
};

export function EndpointsList({ 
  endpointGroups, 
  selectedEndpoint, 
  onEndpointSelect, 
  onGroupToggle 
}: EndpointsListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGroups = endpointGroups.map(group => ({
    ...group,
    endpoints: group.endpoints.filter(endpoint => {
      const searchLower = searchQuery.toLowerCase();
      return (
        endpoint.path.toLowerCase().includes(searchLower) ||
        endpoint.method.toLowerCase().includes(searchLower) ||
        endpoint.summary?.toLowerCase().includes(searchLower) ||
        group.tag.toLowerCase().includes(searchLower)
      );
    })
  })).filter(group => group.endpoints.length > 0);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, endpoint: EndpointInfo) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onEndpointSelect(endpoint);
    }
  }, [onEndpointSelect]);

  const isSelected = useCallback((endpoint: EndpointInfo) => {
    return selectedEndpoint?.path === endpoint.path && selectedEndpoint?.method === endpoint.method;
  }, [selectedEndpoint]);

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col overflow-hidden">
        <div className="p-6 border-b border-border/50 bg-sidebar/50 flex-shrink-0">
        <h2 className="font-semibold mb-4 text-foreground">Endpoints</h2>
        <Input
          placeholder="Search endpoints..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="text-sm bg-input-background border-border/50"
        />
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2">
          {filteredGroups.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              {searchQuery ? 'No endpoints found matching your search.' : 'No endpoints available.'}
            </div>
          ) : (
            filteredGroups.map((group) => (
              <Collapsible
                key={group.tag}
                open={!group.collapsed}
                onOpenChange={() => onGroupToggle(group.tag)}
                className="mb-2"
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-2 h-auto hover:bg-accent"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{group.tag}</span>
                      <Badge variant="outline" className="text-xs">
                        {group.endpoints.length}
                      </Badge>
                    </div>
                    {group.collapsed ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="space-y-1 mt-1">
                  {group.endpoints.map((endpoint) => (
                    <Button
                      key={`${endpoint.method}-${endpoint.path}`}
                      variant={isSelected(endpoint) ? "secondary" : "ghost"}
                      className="w-full justify-start p-3 h-auto hover:bg-accent overflow-hidden"
                      onClick={() => onEndpointSelect(endpoint)}
                      onKeyDown={(e) => handleKeyDown(e, endpoint)}
                      tabIndex={0}
                    >
                      <div className="flex flex-col items-start gap-2 w-full min-w-0">
                        <div className="flex items-center gap-2 w-full min-w-0 overflow-hidden">
                          <Badge
                            className={`text-xs font-mono uppercase shrink-0 ${methodColors[endpoint.method as keyof typeof methodColors] || methodColors.get}`}
                            variant="secondary"
                          >
                            {endpoint.method}
                          </Badge>
                          {endpoint.path.length > 30 ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="font-mono text-xs flex-1 text-left truncate min-w-0 overflow-hidden">
                                  {endpoint.path}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-md">
                                <p className="text-xs font-mono break-all">{endpoint.path}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="font-mono text-xs flex-1 text-left truncate min-w-0 overflow-hidden">
                              {endpoint.path}
                            </span>
                          )}
                          {endpoint.deprecated && (
                            <Badge variant="outline" className="text-xs shrink-0">
                              Deprecated
                            </Badge>
                          )}
                        </div>
                        {endpoint.summary && (
                          endpoint.summary.length > 60 ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p className="text-xs text-muted-foreground text-left line-clamp-1 w-full min-w-0 break-words cursor-help">
                                  {endpoint.summary}
                                </p>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-sm">
                                <p className="text-xs break-words">{endpoint.summary}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <p className="text-xs text-muted-foreground text-left line-clamp-1 w-full min-w-0 break-words">
                              {endpoint.summary}
                            </p>
                          )
                        )}
                      </div>
                    </Button>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ))
          )}
        </div>
      </ScrollArea>
      </div>
    </TooltipProvider>
  );
}