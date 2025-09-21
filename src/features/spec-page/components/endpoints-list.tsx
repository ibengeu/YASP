import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/core/components/ui/accordion';
import { Badge } from '@/core/components/ui/badge';
import { ScrollArea } from '@/core/components/ui/scroll-area';
import { Button } from '@/core/components/ui/button';

export interface EndpointInfo {
  path: string;
  method: string;
  operation: any;
  tag?: string;
}

interface EndpointsListProps {
  endpoints: EndpointInfo[];
  selectedEndpoint: EndpointInfo | null;
  onEndpointSelect: (endpoint: EndpointInfo) => void;
}

const methodColors = {
  get: 'bg-blue-500',
  post: 'bg-green-500',
  put: 'bg-orange-500',
  delete: 'bg-red-500',
  patch: 'bg-purple-500',
  head: 'bg-gray-500',
  options: 'bg-gray-500',
};

export function EndpointsList({ endpoints, selectedEndpoint, onEndpointSelect }: EndpointsListProps) {
  // Group endpoints by tag
  const groupedEndpoints = endpoints.reduce((acc, endpoint) => {
    const tag = endpoint.tag || 'default';
    if (!acc[tag]) {
      acc[tag] = [];
    }
    acc[tag].push(endpoint);
    return acc;
  }, {} as Record<string, EndpointInfo[]>);

  const handleKeyDown = (event: React.KeyboardEvent, endpoint: EndpointInfo) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onEndpointSelect(endpoint);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-input">
        <h2>Endpoints</h2>
        <p className="text-muted-foreground text-sm">
          {endpoints.length} endpoints available
        </p>
      </div>
      <ScrollArea className="flex-1 h-0">
        <div className="p-2">
          <Accordion type="multiple" defaultValue={Object.keys(groupedEndpoints)} className="w-full">
            {Object.entries(groupedEndpoints).map(([tag, tagEndpoints]) => (
              <AccordionItem key={tag} value={tag}>
                <AccordionTrigger className="hover:no-underline px-2">
                  <div className="flex items-center gap-2">
                    <span className="capitalize">{tag}</span>
                    <Badge variant="secondary" className="text-xs">
                      {tagEndpoints.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-2">
                  <div className="space-y-1 ml-2">
                    {tagEndpoints.map((endpoint, index) => (
                      <Button
                        key={`${endpoint.method}-${endpoint.path}-${index}`}
                        variant={selectedEndpoint === endpoint ? "secondary" : "ghost"}
                        className="w-full justify-start h-auto py-2 px-2"
                        onClick={() => onEndpointSelect(endpoint)}
                        onKeyDown={(e) => handleKeyDown(e, endpoint)}
                        role="button"
                        tabIndex={0}
                        aria-label={`${endpoint.method.toUpperCase()} ${endpoint.path}`}
                      >
                        <div className="flex items-center gap-2 w-full min-w-0">
                          <Badge
                            className={`text-white text-xs px-2 py-0 ${methodColors[endpoint.method as keyof typeof methodColors] || 'bg-gray-500'}`}
                          >
                            {endpoint.method.toUpperCase()}
                          </Badge>
                          <span className="text-sm truncate flex-1 text-left">
                            {endpoint.path}
                          </span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </ScrollArea>
    </div>
  );
}