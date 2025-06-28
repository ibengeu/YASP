"use client"

import React from "react"
import {Badge} from "@/core/components/ui/badge"
import {cn} from "@/core/lib/utils"
import type {OpenApiDocument, OperationObject, PathItemObject} from "../../../common/openapi-spec.ts";
import {ScrollArea} from "@/core/components/ui/scroll-area"
import {ChevronRight, Search} from 'lucide-react'
import {Input} from "@/core/components/ui/input"

interface EndpointListProps {
    spec: OpenApiDocument
    selectedTag: string | null
    setSelectedTag: (tag: string) => void
    selectedEndpoint: { path: string; method: string } | null
    setSelectedEndpoint: (endpoint: { path: string; method: string; operation: OperationObject }) => void
}

export interface EndpointEntry {
    path: string
    method: string
    operation: OperationObject
}

export const EndpointList: React.FC<EndpointListProps> = ({
                                                              spec,
                                                              selectedTag,
                                                              setSelectedTag,
                                                              selectedEndpoint,
                                                              setSelectedEndpoint,
                                                          }) => {
    const [searchQuery, setSearchQuery] = React.useState("")

    if (!spec || !spec.paths) {
        return <div className="p-4 text-center text-muted-foreground">Invalid or empty API specification</div>
    }


    const pathsByTag = Object.entries(spec.paths).reduce<Record<string, EndpointEntry[]>>((acc, [path, pathItem]) => {
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

    const filteredTags = Object.keys(pathsByTag).filter(
        (tag) =>
            searchQuery === "" ||
            tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
            pathsByTag[tag].some(
                (endpoint) =>
                    endpoint.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    endpoint.operation.summary?.toLowerCase().includes(searchQuery.toLowerCase()),
            ),
    )

    return (
        <div className="h-full flex flex-col">
            <div className="p-3 border-b">
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"/>
                    <Input
                        placeholder="Search endpoints..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                    <div className="p-2">
                        {filteredTags.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground">No endpoints found</div>
                        ) : (
                            filteredTags.map((tag) => (
                                <div key={tag} className="mb-4">
                                    <button
                                        onClick={() => setSelectedTag(tag)}
                                        className={cn(
                                            "w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-between",
                                            selectedTag === tag ? "bg-accent text-accent-foreground" : "hover:bg-muted/50",
                                        )}
                                    >
                                        <span>{tag}</span>
                                        <span
                                            className="text-xs text-muted-foreground">({pathsByTag[tag].length})</span>
                                    </button>

                                    {selectedTag === tag && (
                                        <div className="mt-2 ml-2 space-y-1">
                                            {pathsByTag[tag]
                                                .filter(
                                                    (endpoint) =>
                                                        searchQuery === "" ||
                                                        endpoint.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                        endpoint.operation.summary?.toLowerCase().includes(searchQuery.toLowerCase()),
                                                )
                                                .map((endpoint) => (
                                                    <button
                                                        key={`${endpoint.path}-${endpoint.method}`}
                                                        onClick={() => setSelectedEndpoint(endpoint)}
                                                        className={cn(
                                                            "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2",
                                                            selectedEndpoint?.path === endpoint.path && selectedEndpoint?.method === endpoint.method
                                                                ? "bg-muted/80 font-medium"
                                                                : "hover:bg-muted/50",
                                                        )}
                                                    >
                                                        <Badge
                                                            className={cn("uppercase text-white text-xs", methodColors[endpoint.method])}>
                                                            {endpoint.method}
                                                        </Badge>
                                                        <span className="truncate">{endpoint.path}</span>
                                                        <ChevronRight
                                                            className="ml-auto h-4 w-4 text-muted-foreground"/>
                                                    </button>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
}
