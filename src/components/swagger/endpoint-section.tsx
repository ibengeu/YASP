/* eslint-disable @typescript-eslint/ban-ts-comment */
import {Card} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {cn} from "@/lib/utils"
import React, {useState} from "react"
import {ChevronRight, FileJson} from "lucide-react"
import {OperationObject, ReferenceObject, ResponseObject, SchemaObject} from "@/types/swagger"

const methodColors: Record<string, string> = {
    get: "bg-blue-500",
    post: "bg-green-500",
    put: "bg-orange-500",
    delete: "bg-red-500",
    patch: "bg-yellow-500",
}

interface EndpointSectionProps {
    tag: string;
    endpoints: Array<{
        path: string;
        method: string;
        operation: {
            summary?: string;
            description?: string;
            requestBody?: {
                content: Record<string, {
                    schema: SchemaObject;
                }>;
            };
            responses?: Record<string, ResponseObject>;
        };
    }>;
    components: {
        schemas?: Record<string, SchemaObject>;
    };
}


interface SchemaTableProps {
    schema: SchemaObject | ReferenceObject;
    components: {
        schemas?: Record<string, SchemaObject>;
    };
}

interface EndpointSectionProps {
    tag: string;
    // @ts-expect-error
    endpoints: Array<{
        path: string;
        method: string;
        operation: OperationObject;
    }>;
    components: {
        schemas?: Record<string, SchemaObject>;
    };
}


const SchemaTable = ({schema, components}: SchemaTableProps) => {
    const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set());

    if (!schema) return null;

    const resolveSchema = (schema: SchemaObject | ReferenceObject): SchemaObject => {
        if ('$ref' in schema && schema.$ref?.startsWith('#/components/schemas/')) {
            const refKey = schema.$ref.split('/').pop();
            return components.schemas?.[refKey as string] || schema as SchemaObject;
        }
        return schema as SchemaObject;
    };

    const handleToggleSchema = (path: string, event: React.MouseEvent<HTMLTableRowElement>): void => {
        event.stopPropagation();
        setExpandedSchemas(prev => {
            const next = new Set(prev);
            if (next.has(path)) {
                next.delete(path);
            } else {
                next.add(path);
            }
            return next;
        });
    };
    const renderSchema = (
        schema: SchemaObject | ReferenceObject,
        name: string = '',
        required: string[] = [],
        path = ''
    ) => {
        const resolvedSchema = resolveSchema(schema);
        const fullPath = path ? `${path}.${name}` : name;
        const isArray = resolvedSchema.type === 'array';
        const arrayItemSchema = isArray ? resolveSchema(resolvedSchema.items as SchemaObject) : null;
        const hasNestedProperties = resolvedSchema.properties || (isArray && arrayItemSchema?.properties);
        const isExpanded = expandedSchemas.has(fullPath);
        const depth = path.split('.').length;

        return (
            <React.Fragment key={fullPath}>
                <tr
                    className={cn(
                        "border-b transition-colors relative group cursor-pointer",
                        hasNestedProperties && "bg-blue-50/50 hover:bg-blue-50/70 dark:bg-blue-950/20 dark:hover:bg-blue-950/30",
                        !isExpanded && hasNestedProperties && "border-b-2 border-b-blue-100 dark:border-b-blue-900"
                    )}
                    onClick={(e) => hasNestedProperties && handleToggleSchema(fullPath, e)}
                    role="row"
                    aria-expanded={isExpanded}
                >
                    <td className="px-4 py-2 font-mono relative">
                        {depth > 0 && (
                            <div
                                className="absolute left-0 h-full  border-blue-100 dark:border-blue-900"
                                style={{marginLeft: `${depth * 12}px`}}
                            />
                        )}
                        <div className="flex items-center gap-2" style={{paddingLeft: `${depth * 16}px`}}>
                            {hasNestedProperties && (
                                <ChevronRight
                                    className={cn(
                                        "h-4 w-4 transition-transform text-blue-500",
                                        isExpanded && "rotate-90"
                                    )}
                                    aria-hidden="true"
                                />
                            )}
                            <span className="flex items-center gap-2">
                                {hasNestedProperties &&
                                    <FileJson className="h-4 w-4 text-blue-500" aria-hidden="true"/>}
                                {name}
                                {isArray && <span className="text-blue-500 font-semibold">[]</span>}
                            </span>
                            {hasNestedProperties && (
                                <Badge
                                    variant="outline"
                                    className="ml-2 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                                >
                                    {isArray ? 'array object' : 'object'}
                                </Badge>
                            )}
                        </div>
                    </td>
                    <td className="px-4 py-2">
                        <span className={cn(
                            "font-medium",
                            hasNestedProperties && "text-blue-600 dark:text-blue-400"
                        )}>
                            {isArray ? `array of ${arrayItemSchema?.type || 'object'}` : resolvedSchema.type}
                        </span>
                        {resolvedSchema.format && (
                            <span className="text-muted-foreground ml-2">
                                ({resolvedSchema.format})
                            </span>
                        )}
                    </td>
                    <td className="px-4 py-2">
                        <Badge variant={required?.includes(name) ? "destructive" : "secondary"}>
                            {required?.includes(name) ? "Required" : "Optional"}
                        </Badge>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                        {resolvedSchema.description || '-'}
                    </td>
                </tr>

                {isExpanded && hasNestedProperties && (
                    <tr>
                        <td colSpan={4} className="p-0 bg-blue-50/30 dark:bg-blue-950/10">
                            <table className="w-full border-collapse">
                                <tbody>
                                {resolvedSchema.properties &&
                                    Object.entries(resolvedSchema.properties).map(([propName, prop]) =>
                                        renderSchema(prop as SchemaObject, propName, resolvedSchema.required, fullPath)
                                    )}
                                {isArray && arrayItemSchema?.properties &&
                                    Object.entries(arrayItemSchema.properties).map(([propName, prop]) =>
                                        renderSchema(prop as SchemaObject, propName, arrayItemSchema.required, `${fullPath}[]`)
                                    )}
                                </tbody>
                            </table>
                        </td>
                    </tr>
                )}
            </React.Fragment>
        );
    };

    const resolvedRootSchema = resolveSchema(schema);

    return (
        <div className="rounded-lg border overflow-hidden">
            <table className="w-full border-collapse">
                <thead>
                <tr className="bg-muted border-b">
                    <th className="px-4 py-2 text-left font-semibold">Property</th>
                    <th className="px-4 py-2 text-left font-semibold">Type</th>
                    <th className="px-4 py-2 text-left font-semibold">Required</th>
                    <th className="px-4 py-2 text-left font-semibold">Description</th>
                </tr>
                </thead>
                <tbody>
                {resolvedRootSchema.properties ?
                    Object.entries(resolvedRootSchema.properties).map(([name, prop]) =>
                        renderSchema(prop as SchemaObject, name, resolvedRootSchema.required)
                    ) :
                    renderSchema(resolvedRootSchema)}
                </tbody>
            </table>
        </div>
    );
};

const EndpointSection = ({tag, endpoints, components}: EndpointSectionProps) => {
    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">{tag}</h2>
            <div className="space-y-6">
                {endpoints.map(({path, method, operation}) => (
                    <Card key={`${path}-${method}`} className="p-4">
                        <div className="flex items-center gap-4 mb-4">
                            <Badge className={cn("uppercase text-white", methodColors[method])}>
                                {method}
                            </Badge>
                            <code className="text-sm font-mono">{path}</code>
                        </div>

                        {operation.summary && (
                            <h3 className="font-semibold mb-2">{operation.summary}</h3>
                        )}
                        {operation.description && (
                            <p className="text-muted-foreground mb-4">{operation.description}</p>
                        )}

                        {operation.requestBody?.content && (
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold mb-2">Request Body</h4>
                                {(() => {
                                    const [contentType, content] = Object.entries(operation.requestBody.content)[0];
                                    return (
                                        <SchemaTable
                                            key={contentType}
                                            schema={content.schema}
                                            components={components}
                                        />
                                    );
                                })()}
                            </div>
                        )}

                        {operation.responses && (
                            <div className="space-y-6">
                                {Object.entries(operation.responses).map(([code, response]) => {
                                    const typedResponse = response as ResponseObject;
                                    if (!typedResponse.content) return null;

                                    const [contentType, content] = Object.entries(typedResponse.content)[0];

                                    return (
                                        <div key={code} className="mb-6">
                                            <h4 className="text-sm font-semibold mb-2">
                                                Response {code}
                                            </h4>
                                            <SchemaTable
                                                key={`${code}-${contentType}`}
                                                schema={content.schema}
                                                components={components}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default EndpointSection;

