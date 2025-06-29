"use client"

import React, {useEffect, useMemo, useState} from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {Badge} from "@/core/components/ui/badge.tsx"
import {cn} from "@/core/lib/utils.ts"
import {ScrollArea} from "@/core/components/ui/scroll-area.tsx"

import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/core/components/ui/tabs.tsx"
import {SchemaTable} from "./schema-table"
import {
    ComponentsObject,
    OperationObject,
    ParameterObject,
    ReferenceObject,
    RequestBodyObject,
    ResponseObject, SchemaObject
} from "@/common/openapi-spec.ts";

interface EndpointDetailProps {
    path: string
    method: string
    operation: OperationObject
    components: ComponentsObject
}

const methodColors: Record<string, string> = {
    get: "bg-chart-1 text-white",
    post: "bg-chart-2 text-white",
    put: "bg-chart-3 text-white",
    delete: "bg-destructive text-destructive-foreground",
    patch: "bg-chart-4 text-white",
    options: "bg-chart-5 text-white",
    head: "bg-primary text-primary-foreground",
    trace: "bg-secondary text-secondary-foreground",
}

export const EndpointDetail: React.FC<EndpointDetailProps> = ({path, method, operation, components}) => {
    const [selectedContentType, setSelectedContentType] = useState<string | null>(null)
    const [selectedResponseTypes, setSelectedResponseTypes] = useState<Record<string, string>>({})

    // Use operation.requestBody directly, assuming it's already resolved
    const requestBody = useMemo(() => operation.requestBody as RequestBodyObject | undefined, [operation.requestBody])

    // Use operation.parameters directly, assuming they are already resolved
    const parameters = useMemo(
        () => (operation.parameters ?? []) as ParameterObject[],
        [operation.parameters]
    )

    // Use operation.responses directly, assuming they are already resolved
    const responses = useMemo(
        () => (operation.responses ?? {}) as Record<string, ResponseObject>,
        [operation.responses]
    )

    const contentTypes = useMemo(
        () => (requestBody?.content ? Object.keys(requestBody.content) : []),
        [requestBody]
    )

    // Set default content type for request body
    useEffect(() => {
        if (contentTypes.length > 0 && selectedContentType === null) {
            setSelectedContentType(contentTypes[0])
        }
    }, [contentTypes, selectedContentType])

    // Set default content types for responses
    useEffect(() => {
        const newResponseTypes: Record<string, string> = {}
        Object.entries(responses).forEach(([code, response]) => {
            if (response.content) {
                const responseContentTypes = Object.keys(response.content)
                if (responseContentTypes.length > 0 && !selectedResponseTypes[code]) {
                    newResponseTypes[code] = responseContentTypes[0]
                }
            }
        })
        if (Object.keys(newResponseTypes).length > 0) {
            setSelectedResponseTypes(prev => ({...prev, ...newResponseTypes}))
        }
    }, [responses, selectedResponseTypes])

    const handleResponseTypeChange = (code: string, contentType: string) => {
        setSelectedResponseTypes(prev => ({...prev, [code]: contentType}))
    }

    // Updated getSchemaType to assume schema is already resolved
    const getSchemaType = (schema: SchemaObject | ReferenceObject | undefined): string => {
        if (!schema) return "-";

        let resolvedSchema: SchemaObject | undefined;

        if ("$ref" in schema) {
            const refKey = schema.$ref.split("/").pop();
            resolvedSchema = components?.schemas?.[refKey as string] as SchemaObject | undefined;
        } else {
            resolvedSchema = schema;
        }

        if (!resolvedSchema) return "-";

        if (resolvedSchema.type) {
            if (resolvedSchema.type === "array" && resolvedSchema.items) {
                const itemSchema = resolvedSchema.items as SchemaObject | ReferenceObject;
                const itemType = getSchemaType(itemSchema);
                return `array of ${itemType}`;
            }
            return resolvedSchema.type;
        }

        
        
        if (resolvedSchema.properties) {
            return "object";
        }
        return "any";
    };

    return (
        <div className="h-full overflow-hidden ">
            <ScrollArea className="h-full">
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <Badge
                            className={cn(
                                "uppercase text-white",
                                methodColors[method.toLowerCase()] ?? "bg-gray-500"
                            )}
                        >
                            {method}
                        </Badge>
                        <code className="text-sm font-mono">{path}</code>
                    </div>

                    {operation.summary && <h3 className="font-semibold mb-2">{operation.summary}</h3>}
                    {operation.description && (
                        <div className="text-muted-foreground mb-6 prose dark:prose-invert">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{operation.description}</ReactMarkdown>
                        </div>
                    )}

                    {parameters.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-sm font-semibold mb-2">Parameters</h4>
                            <div className="rounded-lg border border-border shadow-sm bg-background">
                                {parameters.map((parameter, index) => (
                                    <div
                                        key={index}
                                        className={cn(
                                            "flex flex-col py-3 px-4 border-b border-border/50 last:border-0",
                                            "hover:bg-muted/50 transition-colors"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="font-mono text-sm font-medium text-foreground truncate">
                                                        {parameter.name}
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs bg-slate-100 text-slate-700"
                                                    >
                                                        {parameter.in}
                                                    </Badge>
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {getSchemaType(parameter.schema)}
                                                </div>
                                            </div>
                                            <Badge
                                                variant={parameter.required ? "destructive" : "secondary"}
                                                className="text-xs font-medium"

                                            >
                                                {parameter.required ? "Required" : "Optional"}
                                            </Badge>
                                        </div>
                                        {parameter.description && (
                                            <div className="mt-1 text-sm text-muted-foreground pl-2 prose dark:prose-invert">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{parameter.description}</ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {requestBody?.content && selectedContentType && requestBody.content[selectedContentType]?.schema && (
                        <div className="mb-6">
                            <h4 className="text-sm font-semibold mb-2">Request Body</h4>
                            <div className="mb-4">
                                <SchemaTable
                                    schema={requestBody.content[selectedContentType].schema!}
                                    components={components}
                                />
                            </div>
                        </div>
                    )}

                    {Object.keys(responses).length > 0 && (
                        <div className="space-y-6">
                            <h4 className="text-sm font-semibold mb-2">Responses</h4>
                            {Object.entries(responses).map(([code, response]) => {
                                if (!response) {
                                    return (
                                        <div key={code} className="mb-4">
                                            <Badge variant="outline">{code}</Badge>
                                            <span className="text-sm text-muted-foreground ml-2">
                                                No response details
                                            </span>
                                        </div>
                                    )
                                }

                                const responseContentTypes = response.content ? Object.keys(response.content) : []
                                const selectedResponseType =
                                    selectedResponseTypes[code] ?? responseContentTypes[0]

                                return (
                                    <div key={code} className="mb-6 rounded-lg">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Badge
                                                variant={
                                                    code.startsWith("2")
                                                        ? "default"
                                                        : code.startsWith("4") || code.startsWith("5")
                                                            ? "destructive"
                                                            : "outline"
                                                }
                                                className="text-sm"
                                            >
                                                {code}
                                            </Badge>
                                            <span className="text-sm font-medium">
                                                <div className="prose dark:prose-invert inline">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{response.description ?? "No description"}</ReactMarkdown>
                                                </div>
                                            </span>
                                        </div>

                                        {response.content && responseContentTypes.length > 1 && (
                                            <div className="mb-4">
                                                <Tabs
                                                    value={selectedResponseType}
                                                    onValueChange={value => handleResponseTypeChange(code, value)}
                                                    className="w-full"
                                                >
                                                    <TabsList className="mb-2 bg-muted">
                                                        {responseContentTypes.map(type => (
                                                            <TabsTrigger key={type} value={type} className="text-xs">
                                                                {type}
                                                            </TabsTrigger>
                                                        ))}
                                                    </TabsList>
                                                    {responseContentTypes.map(contentType => (
                                                        <TabsContent key={contentType} value={contentType}>
                                                            {response.content && response.content[contentType]?.schema && (
                                                                <SchemaTable
                                                                    schema={response.content[contentType].schema!}
                                                                    components={components}
                                                                />
                                                            )}
                                                        </TabsContent>
                                                    ))}
                                                </Tabs>
                                            </div>
                                        )}

                                        {response.content &&
                                            responseContentTypes.length === 1 &&
                                            selectedResponseType && (
                                                <div className="mt-2">
                                                    <Badge variant="outline" className="mb-2">
                                                        {selectedResponseType}
                                                    </Badge>
                                                    {response.content[selectedResponseType]?.schema && (
                                                        <SchemaTable
                                                            schema={response.content[selectedResponseType].schema!}
                                                            components={components}
                                                        />
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    )
}