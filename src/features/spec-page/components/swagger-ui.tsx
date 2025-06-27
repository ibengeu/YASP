"use client"

import {useEffect, useState} from "react"
import {EndpointEntry, EndpointList} from "./endpoint-list"
import {EndpointDetail} from "./endpoint-detail"
import {OpenApiDocument, OperationObject, PathItemObject} from "@/common/openapi-spec.ts";
import useMediaQuery from "@/core/hooks/useMediaQuery.ts";
import {ResizableHandle, ResizablePanel, ResizablePanelGroup} from "@/core/components/ui/resizable.tsx";
import TryItOut from "@/features/spec-page/components/try-it-out.tsx";

interface SwaggerUIProps {
    spec: OpenApiDocument
    onEndpointSelected?: (endpoint: { path: string; method: string; operation: OperationObject } | null) => void
}

export function SwaggerUI({spec, onEndpointSelected}: SwaggerUIProps) {
    const [selectedTag, setSelectedTag] = useState<string | null>(null)
    const [selectedEndpoint, setSelectedEndpoint] = useState<{
        path: string
        method: string
        operation: OperationObject
    } | null>(null)

    useEffect(() => {
        if (!spec.paths || selectedTag || selectedEndpoint) return

        const pathsByTag = Object.entries(spec.paths).reduce<Record<string, EndpointEntry[]>>(
            (acc, [path, pathItem]) => {
                if (!pathItem) return acc

                const validMethods = ["get", "post", "put", "delete", "patch", "options", "head", "trace"] as const
                validMethods.forEach((method) => {
                    const operation = (pathItem as PathItemObject)[method]
                    if (!operation) return

                    const tags = operation.tags?.length ? operation.tags : ["untagged"]
                    tags.forEach((tag: string) => {
                        if (!acc[tag]) acc[tag] = []
                        acc[tag].push({path, method, operation})
                    })
                })
                return acc
            },
            {}
        )

        const firstTag = Object.keys(pathsByTag)[0]
        if (firstTag) {
            setSelectedTag(firstTag)
            const firstEndpoint = pathsByTag[firstTag][0]
            if (firstEndpoint) {
                setSelectedEndpoint(firstEndpoint)
                onEndpointSelected?.(firstEndpoint)
            }
        }
    }, [spec.paths, selectedTag, selectedEndpoint, onEndpointSelected])

    const isDesktop = useMediaQuery("(min-width: 1024px)")
    const isTablet = useMediaQuery("(min-width: 768px)")

    const defaultLayout = isDesktop ? [15, 45, 40] : isTablet ? [30, 70] : [100]

    return (
        <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg">
            <ResizablePanel defaultSize={defaultLayout[0]} minSize={18} maxSize={20}
                            className="bg-background overflow-hidden">
                <EndpointList
                    spec={spec}
                    selectedTag={selectedTag}
                    setSelectedTag={setSelectedTag}
                    selectedEndpoint={selectedEndpoint}
                    setSelectedEndpoint={(endpoint) => {
                        setSelectedEndpoint(endpoint)
                        onEndpointSelected?.(endpoint)
                    }}
                />
            </ResizablePanel>

            <ResizableHandle withHandle/>

            <ResizablePanel defaultSize={defaultLayout[1]} minSize={isDesktop ? 30 : 70} className="overflow-hidden">
                {selectedEndpoint ? (
                    <EndpointDetail
                        path={selectedEndpoint.path}
                        method={selectedEndpoint.method}
                        operation={selectedEndpoint.operation}
                        components={spec.components || {}}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        Select an endpoint to view its details
                    </div>
                )}
            </ResizablePanel>

            {isDesktop && (
                <>
                    <ResizableHandle withHandle/>
                    <ResizablePanel defaultSize={defaultLayout[2]} minSize={25} className="overflow-hidden">
                        {selectedEndpoint ? (
                            <TryItOut
                                key={`${selectedEndpoint.path}-${selectedEndpoint.method}`}
                                path={selectedEndpoint.path}
                                method={selectedEndpoint.method}
                                operation={selectedEndpoint.operation}
                                components={spec.components || {}}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                Select an endpoint to try it out
                            </div>
                        )}
                    </ResizablePanel>
                </>
            )}
        </ResizablePanelGroup>
    )
}