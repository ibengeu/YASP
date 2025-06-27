"use client"

import React, {useState} from "react"
import type {ComponentsObject, ReferenceObject, SchemaObject} from "../../../common/openapi-spec.ts";
import {cn} from "@/core/lib/utils.ts"
import {ChevronDown, ChevronRight, FileJson} from "lucide-react"
import {Badge} from "@/core/components/ui/badge.tsx"


export type SchemaTableProps = {
    schema: SchemaObject | ReferenceObject;
    components?: ComponentsObject;
};

export const SchemaTable = ({schema, components}: SchemaTableProps) => {
    const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set())

    if (!schema) return null

    const resolveSchema = (currentSchema: SchemaObject | ReferenceObject): SchemaObject | undefined => {
        if ("$ref" in currentSchema) {
            const refKey = currentSchema.$ref.split("/").pop();
            const resolved = components?.schemas?.[refKey as string];
            if (resolved) {
                // If resolved is a ReferenceObject, recursively resolve it.
                // If resolved is a SchemaObject, return it.
                return resolveSchema(resolved);
            }
            return undefined; // Reference not found
        }
        // If it's not a $ref, it's already a SchemaObject
        return currentSchema as SchemaObject;
    };

    // Modify event type to accept both MouseEvent and KeyboardEvent
    const handleToggleSchema = (
        path: string,
        event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement> // Changed
    ): void => {
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

    const renderSchema = (
        currentSchema: SchemaObject | ReferenceObject,
        name = "",
        required: string[] = [],
        path = "",
        depth = 0
    ) => {
        const resolvedSchema = resolveSchema(currentSchema);
        if (!resolvedSchema) {
            return null; // Cannot render if schema cannot be resolved
        }
        const fullPath = path ? `${path}.${name}` : name;
        const isArray = resolvedSchema.type === "array";
        const arrayItemSchema = isArray && resolvedSchema.items
            ? resolveSchema(resolvedSchema.items as SchemaObject | ReferenceObject)
            : undefined;
        const hasNestedProperties = resolvedSchema.properties || (isArray && arrayItemSchema && arrayItemSchema.properties);
        const isExpanded = expandedSchemas.has(fullPath);

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
                    onKeyDown={(e) => hasNestedProperties && e.key === "Enter" && handleToggleSchema(fullPath, e)}
                >
                    {/* Indentation and Icons */}
                    <div className="flex items-center gap-2" style={{paddingLeft: `${depth * 16}px`}}>
                        {hasNestedProperties && (
                            <div className="flex items-center">
                                {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-primary shrink-0" aria-hidden="true"/>
                                ) : (
                                    <ChevronRight className="h-4 w-4 text-primary shrink-0" aria-hidden="true"/>
                                )}
                            </div>
                        )}
                        {hasNestedProperties &&
                            <FileJson className="h-4 w-4 text-primary shrink-0" aria-hidden="true"/>}
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
                                {isArray
                                    ? `array of ${arrayItemSchema?.type || "object"}`
                                    : resolvedSchema.type || "object"
                                }
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
                    <div className="px-4 pb-3 pt-1 text-sm text-muted-foreground"
                         style={{paddingLeft: `${depth * 16 + 32}px`}}>
                        {resolvedSchema.description}
                    </div>
                )}

                {/* Nested Properties */}
                {isExpanded && hasNestedProperties && (
                    <div className="bg-muted/10">
                        {resolvedSchema.properties &&
                            Object.entries(resolvedSchema.properties).map(([propName, prop]) =>
                                renderSchema(
                                    prop as SchemaObject | ReferenceObject,
                                    propName,
                                    resolvedSchema.required || [],
                                    fullPath,
                                    depth + 1
                                )
                            )}
                        {isArray &&
                            arrayItemSchema?.properties &&
                            Object.entries(arrayItemSchema.properties).map(([propName, prop]) =>
                                renderSchema(
                                    prop as SchemaObject | ReferenceObject,
                                    propName,
                                    arrayItemSchema.required || [],
                                    `${fullPath}[]`, // Indicate array item path
                                    depth + 1
                                )
                            )}
                    </div>
                )}
            </div>
        )
    }

    const resolvedRootSchema = resolveSchema(schema);

    if (!resolvedRootSchema) {
        return null; // Handle case where root schema cannot be resolved
    }

    // If the root schema itself is an array, or an object with properties.
    // If it's a simple type without properties (e.g. string, number directly as root), render its details.
    if (resolvedRootSchema.properties || resolvedRootSchema.type === "array") {
        return (
            <div className="rounded-lg border border-border shadow-sm bg-background">
                {resolvedRootSchema.properties ? (
                    Object.entries(resolvedRootSchema.properties).map(([name, prop]) =>
                        renderSchema(
                            prop as SchemaObject | ReferenceObject,
                            name,
                            resolvedRootSchema.required || [],
                            "", // Root path starts empty
                            0
                        )
                    )
                ) : resolvedRootSchema.items ? ( // Handle root array
                    renderSchema(
                        resolvedRootSchema.items as SchemaObject | ReferenceObject,
                        "", // Name can be empty or indicative like "items"
                        resolvedRootSchema.required || [], // Root arrays usually don't have "required" in this context
                        "", // Root path for array items
                        0
                    )
                ) : (
                    // Fallback for array without items or other complex root not directly showing properties
                    resolvedRootSchema.type ? renderSchema(resolvedRootSchema, resolvedRootSchema.type, [], "", 0) : null
                )}
            </div>
        )
    } else if (resolvedRootSchema.type) {
        // Render a single schema without properties (e.g., a root schema that is just a string or number)
        return (
            <div className="rounded-lg border border-border shadow-sm bg-background">
                {renderSchema(resolvedRootSchema, resolvedRootSchema.type, [], "", 0)}
            </div>
        )
    } else {
        return null; // Or some other fallback for unrenderable schema
    }
}