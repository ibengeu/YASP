"use client"

import React, {useEffect, useMemo, useState} from "react"
import {Badge} from "@/components/ui/badge"
import {cn} from "@/lib/utils"
import {ScrollArea} from "@/components/ui/scroll-area"
import type {
    ComponentsObject,
    OperationObject,
    ParameterObject,
    ReferenceObject,
    ResponseObject,
    SchemaObject
} from "@/common/swagger.types.ts"
import {SchemaTable} from "@/routes/spec-page/components/schema-table"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"

// Type guard to check if an object is a ReferenceObject
function isReferenceObject(obj: unknown): obj is ReferenceObject {
    return obj !== null && typeof obj === 'object' && '$ref' in (obj as Record<string, unknown>);
}

interface EndpointDetailProps {
    path: string
    method: string
    operation: OperationObject
    components: ComponentsObject
}

const methodColors: Record<string, string> = {
    get: "bg-blue-500",
    post: "bg-green-500",
    put: "bg-orange-500",
    delete: "bg-red-500",
    patch: "bg-yellow-500",
    options: "bg-purple-500",
    head: "bg-cyan-500",
    trace: "bg-indigo-500",
}

export const EndpointDetail: React.FC<EndpointDetailProps> = ({path, method, operation, components}) => {
    const [selectedContentType, setSelectedContentType] = useState<string | null>(null)

    const [selectedResponseTypes, setSelectedResponseTypes] = useState<Record<string, string>>({})

    const requestBody = operation.requestBody && !isReferenceObject(operation.requestBody)
        ? operation.requestBody
        : null;

    const contentTypes = useMemo(() =>
            requestBody?.content ? Object.keys(requestBody.content) : [],
        [requestBody]
    );

    useEffect(() => {
        if (contentTypes.length > 0 && !selectedContentType) {
            setSelectedContentType(contentTypes[0])
        }
    }, [contentTypes, selectedContentType])

    useEffect(() => {
        if (operation.responses) {
            Object.entries(operation.responses).forEach(([code, response]) => {
                if (!isReferenceObject(response)) {
                    const typedResponse = response as ResponseObject
                    if (typedResponse.content && Object.keys(typedResponse.content).length > 0) {
                        const responseContentTypes = Object.keys(typedResponse.content)
                        if (responseContentTypes.length > 0 && !selectedResponseTypes[code]) {
                            setSelectedResponseTypes((prev) => ({
                                ...prev,
                                [code]: responseContentTypes[0],
                            }))
                        }
                    }
                }
            })
        }
    }, [operation.responses, selectedResponseTypes])

    const handleResponseTypeChange = (code: string, contentType: string) => {
        setSelectedResponseTypes((prev) => ({
            ...prev,
            [code]: contentType,
        }))
    }

    const getSchemaType = (schema: SchemaObject | ReferenceObject | undefined): string => {
        if (!schema) return "-";
        if (isReferenceObject(schema)) return "reference";
        return schema.type || "-";
    }

    const parameters = operation.parameters
            ?.filter((param): param is ParameterObject => !isReferenceObject(param))
        || [];

    return (
        <div className="h-full overflow-hidden">
            <ScrollArea className="h-full">
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <Badge
                            className={cn("uppercase text-white", methodColors[method.toLowerCase()] || "bg-gray-500")}>{method}</Badge>
                        <code className="text-sm font-mono">{path}</code>
                    </div>

                    {operation.summary && <h3 className="font-semibold mb-2">{operation.summary}</h3>}

                    {operation.description && <p className="text-muted-foreground mb-6">{operation.description}</p>}

                    {parameters.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-sm font-semibold mb-2">Parameters</h4>
                            <div className="rounded-lg border overflow-hidden">
                                <table className="w-full border-collapse">
                                    <thead>
                                    <tr className="bg-stone-100/70 border-b">
                                        <th className="px-4 py-2 text-left font-semibold">Name</th>
                                        <th className="px-4 py-2 text-left font-semibold">In</th>
                                        <th className="px-4 py-2 text-left font-semibold">Type</th>
                                        <th className="px-4 py-2 text-left font-semibold">Required</th>
                                        <th className="px-4 py-2 text-left font-semibold">Description</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {parameters.map((parameter, index) => (
                                        <tr key={index} className="border-b last:border-0">
                                            <td className="px-4 py-2 font-mono">{parameter.name}</td>
                                            <td className="px-4 py-2">{parameter.in}</td>
                                            <td className="px-4 py-2">{getSchemaType(parameter.schema)}</td>
                                            <td className="px-4 py-2">
                                                <Badge variant={parameter.required ? "destructive" : "secondary"}>
                                                    {parameter.required ? "Required" : "Optional"}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-2 text-muted-foreground">{parameter.description || "-"}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {requestBody?.content && (
                        <div className="mb-6">

                            {selectedContentType && requestBody.content[selectedContentType] && (
                                <>
                                    <h4 className="text-sm font-semibold mb-2">Request Body</h4>
                                    <div className="mb-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="outline">{selectedContentType}</Badge>
                                            {requestBody.required &&
                                                <Badge variant="destructive">Required</Badge>}
                                        </div>
                                        <SchemaTable
                                            schema={requestBody.content[selectedContentType].schema as SchemaObject | ReferenceObject}
                                            components={components}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {operation.responses && (
                        <div className="space-y-6">
                            <h4 className="text-sm font-semibold mb-2">Responses</h4>
                            {Object.entries(operation.responses).map(([code, response]) => {
                                if (isReferenceObject(response)) {
                                    return (
                                        <div key={code} className="mb-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge
                                                    variant={
                                                        code.startsWith("2")
                                                            ? "default"
                                                            : code.startsWith("4") || code.startsWith("5")
                                                                ? "destructive"
                                                                : "outline"
                                                    }
                                                >
                                                    {code}
                                                </Badge>
                                                <span
                                                    className="text-sm text-muted-foreground">Reference: {response.$ref}</span>
                                            </div>
                                        </div>
                                    );
                                }

                                const typedResponse = response as ResponseObject;

                                if (!typedResponse.content || Object.keys(typedResponse.content).length === 0) {
                                    return (
                                        <div key={code} className="mb-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge
                                                    variant={
                                                        code.startsWith("2")
                                                            ? "default"
                                                            : code.startsWith("4") || code.startsWith("5")
                                                                ? "destructive"
                                                                : "outline"
                                                    }
                                                >
                                                    {code}
                                                </Badge>
                                                <span
                                                    className="text-sm text-muted-foreground">{typedResponse.description}</span>
                                            </div>
                                        </div>
                                    )
                                }

                                const responseContentTypes = Object.keys(typedResponse.content || {})
                                const selectedResponseType = selectedResponseTypes[code] || responseContentTypes[0]

                                return (
                                    <div key={code} className="mb-6 border rounded-lg p-4 bg-stone-50/70">
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
                                            <span className="text-sm font-medium">{typedResponse.description}</span>
                                        </div>

                                        {typedResponse.content && responseContentTypes.length > 1 && (
                                            <div className="mb-4">
                                                <Tabs
                                                    value={selectedResponseType}
                                                    onValueChange={(value) => handleResponseTypeChange(code, value)}
                                                    className="w-full"
                                                >
                                                    <TabsList className="mb-2 bg-stone-100/70">
                                                        {responseContentTypes.map((type) => (
                                                            <TabsTrigger key={type} value={type} className="text-xs">
                                                                {type}
                                                            </TabsTrigger>
                                                        ))}
                                                    </TabsList>

                                                    {responseContentTypes.map((contentType) => (
                                                        <TabsContent key={contentType} value={contentType}>
                                                            {typedResponse.content && typedResponse.content[contentType] && typedResponse.content[contentType].schema && (
                                                                <SchemaTable
                                                                    schema={typedResponse.content[contentType].schema as SchemaObject | ReferenceObject}
                                                                    components={components}
                                                                />
                                                            )}
                                                        </TabsContent>
                                                    ))}
                                                </Tabs>
                                            </div>
                                        )}

                                        {typedResponse.content && responseContentTypes.length === 1 && selectedResponseType && (
                                            <div className="mt-2">
                                                <Badge variant="outline" className="mb-2">
                                                    {selectedResponseType}
                                                </Badge>
                                                {typedResponse.content[selectedResponseType] && typedResponse.content[selectedResponseType].schema && (
                                                    <SchemaTable
                                                        schema={typedResponse.content[selectedResponseType].schema as SchemaObject | ReferenceObject}
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