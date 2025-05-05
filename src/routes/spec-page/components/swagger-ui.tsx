"use client"

import {useEffect, useState} from "react"
import type {OpenApiDocument, OperationObject, PathItemObject} from "@/common/swagger.types.ts"
import {EndpointEntry, EndpointList} from "./endpoint-list"
import {EndpointDetail} from "./endpoint-detail"
import {TryItOut} from "./try-it-out"
import {ResizableHandle, ResizablePanel, ResizablePanelGroup} from "@/components/ui/resizable"
import useMediaQuery from "@/hooks/useMediaQuery.ts";

interface SwaggerUIProps {
    spec: OpenApiDocument
}

export function SwaggerUI({spec}: SwaggerUIProps) {
    const [selectedTag, setSelectedTag] = useState<string | null>(null)
    const [selectedEndpoint, setSelectedEndpoint] = useState<{
        path: string
        method: string
        operation: OperationObject
    } | null>(null)


    useEffect(() => {

        const entries1 = Object.entries(spec.paths).reduce<Record<string, EndpointEntry[]>>((acc, [path, pathItem]) => {
            if (!pathItem) return acc

            const validMethods = ["get", "post", "put", "delete", "patch", "options", "head", "trace"] as const

            validMethods.forEach((method) => {
                const operation = (pathItem as PathItemObject)[method]
                if (!operation) return

                const tags = operation.tags || ["untagged"]

                tags.forEach((tag: string) => {
                    if (!acc[tag]) {
                        acc[tag] = []
                    }
                    acc[tag].push({
                        path,
                        method,
                        operation,
                    })
                })
            })

            return acc
        }, {})

        const firstTag = Object.getOwnPropertyNames(entries1)[0]
        const endpoints = Object.values(entries1)[0][0]

        setSelectedTag(firstTag)
        setSelectedEndpoint(endpoints)
    }, []);
    const isDesktop = useMediaQuery("(min-width: 1024px)")
    const isTablet = useMediaQuery("(min-width: 768px)")

    if (!spec || !spec.paths) {
        return (
            <div className="container mx-auto py-6">
                <div className="p-6 text-center text-muted-foreground border rounded-lg">
                    Invalid or empty API specification
                </div>
            </div>
        )
    }


    const defaultLayout = isDesktop ? [15, 45, 40] : isTablet ? [30, 70] : [100]

    return (
        <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg border">
            {/* Left Column - Endpoint List */}
            <ResizablePanel
                defaultSize={defaultLayout[0]}
                minSize={18}
                maxSize={20}
                className="bg-background overflow-hidden"
            >
                <EndpointList
                    spec={spec}
                    selectedTag={selectedTag}
                    setSelectedTag={setSelectedTag}
                    selectedEndpoint={selectedEndpoint}
                    setSelectedEndpoint={setSelectedEndpoint}
                />
            </ResizablePanel>

            <ResizableHandle withHandle/>

            {/* Middle Column - Endpoint Details */}
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

                    {/* Right Column - Try It Out */}
                    <ResizablePanel defaultSize={defaultLayout[2]} minSize={25} maxSize={30}
                                    className="overflow-hidden">
                        {selectedEndpoint ? (
                            <TryItOut
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
