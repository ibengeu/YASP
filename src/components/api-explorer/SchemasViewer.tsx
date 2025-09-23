import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Search, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Separator } from '../ui/separator';
import { JsonEditor } from './JsonEditor';
import { OpenAPISpec, Schema } from './types';

interface SchemasViewerProps {
  apiSpec: OpenAPISpec;
  onSchemaSelect?: (schemaName: string, schema: Schema) => void;
}

interface SchemaItemProps {
  name: string;
  schema: Schema;
  depth?: number;
  onSchemaSelect?: (schemaName: string, schema: Schema) => void;
}

function SchemaItem({ name, schema, depth = 0, onSchemaSelect }: SchemaItemProps) {
  const [isExpanded, setIsExpanded] = useState(depth === 0);
  
  const getSchemaType = (schema: Schema): string => {
    if (schema.$ref) {
      return schema.$ref.split('/').pop() || 'reference';
    }
    if (schema.type === 'object') {
      const propCount = schema.properties ? Object.keys(schema.properties).length : 0;
      return `object (${propCount} ${propCount === 1 ? 'property' : 'properties'})`;
    }
    if (schema.type === 'array') {
      return `array of ${schema.items ? getSchemaType(schema.items) : 'items'}`;
    }
    return schema.type || 'unknown';
  };

  const getSchemaDescription = (schema: Schema): string => {
    if (schema.description) return schema.description;
    if (schema.type === 'object' && schema.properties) {
      const keys = Object.keys(schema.properties).slice(0, 3);
      const suffix = Object.keys(schema.properties).length > 3 ? '...' : '';
      return `Object with properties: ${keys.join(', ')}${suffix}`;
    }
    return '';
  };

  const renderPropertyValue = (prop: Schema, propName: string, depth: number) => {
    if (prop.$ref) {
      return (
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-blue-600 dark:text-blue-400 font-mono text-xs"
          onClick={() => onSchemaSelect?.(prop.$ref!.split('/').pop()!, prop)}
        >
          {prop.$ref.split('/').pop()}
          <ExternalLink className="h-3 w-3 ml-1" />
        </Button>
      );
    }

    if (prop.type === 'object' && prop.properties && depth < 2) {
      return (
        <div className="ml-4 mt-2 space-y-1">
          {Object.entries(prop.properties).map(([subKey, subProp]) => (
            <div key={subKey} className="text-xs">
              <span className="text-blue-600 dark:text-blue-400 font-mono">"{subKey}"</span>
              <span className="text-muted-foreground mx-1">:</span>
              {renderPropertyValue(subProp, subKey, depth + 1)}
              {prop.required?.includes(subKey) && (
                <Badge variant="destructive" className="ml-2 text-[10px] h-4">
                  required
                </Badge>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (prop.type === 'array' && prop.items) {
      return (
        <div className="inline-flex items-center gap-1">
          <span className="text-muted-foreground font-mono text-xs">array[</span>
          {renderPropertyValue(prop.items, 'items', depth + 1)}
          <span className="text-muted-foreground font-mono text-xs">]</span>
        </div>
      );
    }

    let typeDisplay = prop.type || 'unknown';
    if (prop.format) typeDisplay += ` (${prop.format})`;
    if (prop.enum) typeDisplay += ` | ${prop.enum.join(' | ')}`;

    return (
      <span className="text-green-600 dark:text-green-400 font-mono text-xs">
        {typeDisplay}
      </span>
    );
  };

  if (schema.$ref) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="justify-start p-2 h-auto w-full"
        onClick={() => onSchemaSelect?.(schema.$ref!.split('/').pop()!, schema)}
      >
        <div className="flex items-center gap-2">
          <ExternalLink className="h-3 w-3 text-blue-600 dark:text-blue-400" />
          <span className="text-blue-600 dark:text-blue-400 font-mono text-sm">
            {schema.$ref.split('/').pop()}
          </span>
        </div>
      </Button>
    );
  }

  return (
    <div className={`ml-${depth * 2}`}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start p-2 h-auto hover:bg-accent/50"
          >
            <div className="flex items-center gap-2 w-full">
              {schema.type === 'object' && schema.properties ? (
                isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )
              ) : (
                <div className="w-3" />
              )}
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium">{name}</span>
                  <Badge variant="outline" className="text-[10px] h-4">
                    {getSchemaType(schema)}
                  </Badge>
                </div>
                {getSchemaDescription(schema) && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {getSchemaDescription(schema)}
                  </p>
                )}
              </div>
            </div>
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="ml-6 mt-2 space-y-2">
          {schema.type === 'object' && schema.properties && (
            <div className="space-y-2">
              {Object.entries(schema.properties).map(([propName, prop]) => (
                <div key={propName} className="text-sm border-l-2 border-border/50 pl-3 py-1">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-mono text-xs">
                      "{propName}"
                    </span>
                    <span className="text-muted-foreground text-xs">:</span>
                    <div className="flex-1">
                      {renderPropertyValue(prop, propName, depth)}
                      {schema.required?.includes(propName) && (
                        <Badge variant="destructive" className="ml-2 text-[10px] h-4">
                          required
                        </Badge>
                      )}
                      {prop.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {prop.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {schema.example && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Example:</p>
              <JsonEditor
                value={JSON.stringify(schema.example, null, 2)}
                onChange={() => {}}
                readOnly
                className="text-xs"
              />
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function SchemasViewer({ apiSpec, onSchemaSelect }: SchemasViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchema, setSelectedSchema] = useState<{ name: string; schema: Schema } | null>(null);

  const schemas = apiSpec.components?.schemas || {};

  const filteredSchemas = useMemo(() => {
    if (!searchQuery) return schemas;
    
    const query = searchQuery.toLowerCase();
    return Object.fromEntries(
      Object.entries(schemas).filter(([name, schema]) => {
        return (
          name.toLowerCase().includes(query) ||
          schema.description?.toLowerCase().includes(query) ||
          (schema.type && schema.type.toLowerCase().includes(query))
        );
      })
    );
  }, [schemas, searchQuery]);

  const handleSchemaSelect = (schemaName: string, schema: Schema) => {
    setSelectedSchema({ name: schemaName, schema });
    onSchemaSelect?.(schemaName, schema);
  };

  if (Object.keys(schemas).length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">No schemas defined in this API specification</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">API Schemas</h2>
          <Badge variant="outline" className="text-xs">
            {Object.keys(schemas).length} {Object.keys(schemas).length === 1 ? 'schema' : 'schemas'}
          </Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Search schemas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-sm h-8 rounded-lg bg-input-background border-border/50 focus:border-primary focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Schemas List */}
        <div className="w-1/2 border-r border-border/50">
          <ScrollArea className="h-full">
            <div className="p-2">
              {Object.keys(filteredSchemas).length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  {searchQuery ? 'No schemas found matching your search.' : 'No schemas available.'}
                </div>
              ) : (
                <div className="space-y-1">
                  {Object.entries(filteredSchemas).map(([name, schema]) => (
                    <div key={name}>
                      <SchemaItem
                        name={name}
                        schema={schema}
                        onSchemaSelect={handleSchemaSelect}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Schema Details */}
        <div className="w-1/2">
          {selectedSchema ? (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-mono text-lg font-medium">{selectedSchema.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    {selectedSchema.schema.type || 'object'}
                  </Badge>
                </div>
                {selectedSchema.schema.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedSchema.schema.description}
                  </p>
                )}
              </div>
              
              <ScrollArea className="flex-1">
                <div className="p-4">
                  <SchemaItem
                    name={selectedSchema.name}
                    schema={selectedSchema.schema}
                    onSchemaSelect={handleSchemaSelect}
                  />
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <p className="text-sm">Select a schema to view its details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}