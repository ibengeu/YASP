"use client"

import React, { useState } from "react"
import type { ReferenceObject, SchemaObject, SchemaTableProps } from "@/common/openapi-spec.ts"
import { cn } from "@/lib/utils.ts"
import { ChevronDown, ChevronRight, FileJson } from "lucide-react"
import { Badge } from "@/components/ui/badge.tsx"

export const SchemaTable = ({ schema, components }: SchemaTableProps) => {
    const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set())

    if (!schema) return null

    const resolveSchema = (schema: SchemaObject | ReferenceObject): SchemaObject => {
        if ("$ref" in schema && schema.$ref?.startsWith("#/components/schemas/")) {
            const refKey = schema.$ref.split("/").pop()
            return components.schemas?.[refKey as string] || (schema as SchemaObject)
        }
        return schema as SchemaObject
    }

    const handleToggleSchema = (path: string, event: React.MouseEvent<HTMLDivElement>): void => {
        event.stopPropagation()
        setExpandedSchemas((prev) => {
            const next = new Set(prev)
            if (next.has(path)) {
                next.delete(path)
            } else {
                next.add(path)
            }
            return next
        })
    }

    const renderSchema = (schema: SchemaObject | ReferenceObject, name = "", required: string[] = [], path = "", depth = 0) => {
        const resolvedSchema = resolveSchema(schema)
        const fullPath = path ? `${path}.${name}` : name
        const isArray = resolvedSchema.type === "array"
        const arrayItemSchema = isArray ? resolveSchema(resolvedSchema.items as SchemaObject | ReferenceObject) : null
        const hasNestedProperties = resolvedSchema.properties || (isArray && arrayItemSchema?.properties)
        const isExpanded = expandedSchemas.has(fullPath)

        return (
            <div key={fullPath} className="border-b border-border/50 last:border-0">
                <div
                    className={cn(
                        "flex items-center gap-3 py-3 px-4 transition-colors",
                        hasNestedProperties && "cursor-pointer hover:bg-muted/50",
                        isExpanded && hasNestedProperties && "bg-muted/20"
                    )}
                    onClick={(e) => hasNestedProperties && handleToggleSchema(fullPath, e)}
                    role={hasNestedProperties ? "button" : undefined}
                    aria-expanded={hasNestedProperties ? isExpanded : undefined}
                    tabIndex={hasNestedProperties ? 0 : undefined}
                    onKeyDown={(e) => hasNestedProperties && e.key === "Enter" && handleToggleSchema(fullPath, e as any)}
                >
                    {/* Indentation and Icons */}
                    <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 16}px` }}>
                        {hasNestedProperties && (
                            <div className="flex items-center">
                                {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                                ) : (
                                    <ChevronRight className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                                )}
                            </div>
                        )}
                        {hasNestedProperties && <FileJson className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />}
                    </div>

                    {/* Property Name and Type */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-medium text-foreground truncate">
                                {name || <span className="text-muted-foreground/60">unnamed</span>}
                                {isArray && <span className="text-primary">[]</span>}
                            </span>
                            {hasNestedProperties && (
                                <Badge
                                    variant="outline"
                                    className="text-xs bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                                >
                                    {isArray ? "array object" : "object"}
                                </Badge>
                            )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            <span className={cn(hasNestedProperties && "text-primary")}>
                                {isArray ? `array of ${arrayItemSchema?.type || "object"}` : resolvedSchema.type || "object"}
                            </span>
                            {resolvedSchema.format && (
                                <span className="ml-1">({resolvedSchema.format})</span>
                            )}
                        </div>
                    </div>

                    {/* Required Badge */}
                    <div className="flex-shrink-0">
                        <Badge
                            variant={required?.includes(name) ? "destructive" : "secondary"}
                            className={cn(
                                "text-xs font-medium",
                                required?.includes(name)
                                    ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800"
                                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                            )}
                        >
                            {required?.includes(name) ? "Required" : "Optional"}
                        </Badge>
                    </div>
                </div>

                {/* Description */}
                {resolvedSchema.description && (
                    <div className="px-4 pb-3 pt-1 text-sm text-muted-foreground" style={{ paddingLeft: `${depth * 16 + 32}px` }}>
                        {resolvedSchema.description}
                    </div>
                )}

                {/* Nested Properties */}
                {isExpanded && hasNestedProperties && (
                    <div className="bg-muted/10">
                        {resolvedSchema.properties &&
                            Object.entries(resolvedSchema.properties).map(([propName, prop]) =>
                                renderSchema(prop as SchemaObject | ReferenceObject, propName, resolvedSchema.required, fullPath, depth + 1)
                            )}
                        {isArray &&
                            arrayItemSchema?.properties &&
                            Object.entries(arrayItemSchema.properties).map(([propName, prop]) =>
                                renderSchema(
                                    prop as SchemaObject | ReferenceObject,
                                    propName,
                                    arrayItemSchema.required,
                                    `${fullPath}[]`,
                                    depth + 1
                                )
                            )}
                    </div>
                )}
            </div>
        )
    }

    const resolvedRootSchema = resolveSchema(schema)

    return (
        <div className="rounded-lg border border-border shadow-sm bg-background">
            {resolvedRootSchema.properties ? (
                Object.entries(resolvedRootSchema.properties).map(([name, prop]) =>
                    renderSchema(prop as SchemaObject | ReferenceObject, name, resolvedRootSchema.required, "", 0)
                )
            ) : (
                renderSchema(resolvedRootSchema, "", [], "", 0)
            )}
        </div>
    )
}