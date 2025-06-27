"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { cn } from "@/core/lib/utils.ts";
import { ChevronDown, ChevronRight, FileJson } from "lucide-react";
import { Badge } from "@/core/components/ui/badge.tsx";
export const SchemaTable = ({ schema, components }) => {
    const [expandedSchemas, setExpandedSchemas] = useState(new Set());
    if (!schema)
        return null;
    const resolveSchema = (currentSchema) => {
        if ("$ref" in currentSchema) {
            const refKey = currentSchema.$ref.split("/").pop();
            const resolved = components?.schemas?.[refKey];
            if (resolved) {
                return resolveSchema(resolved); // Recursively resolve if it's another reference
            }
            return undefined; // Return undefined if reference cannot be resolved
        }
        return currentSchema;
    };
    // Modify event type to accept both MouseEvent and KeyboardEvent
    const handleToggleSchema = (path, event // Changed
    ) => {
        event.stopPropagation();
        setExpandedSchemas((prev) => {
            const next = new Set(prev);
            if (next.has(path)) {
                next.delete(path);
            }
            else {
                next.add(path);
            }
            return next;
        });
    };
    const renderSchema = (currentSchema, name = "", required = [], path = "", depth = 0) => {
        const resolvedSchema = resolveSchema(currentSchema);
        const fullPath = path ? `${path}.${name}` : name;
        const isArray = resolvedSchema.type === "array";
        const arrayItemSchema = isArray && resolvedSchema.items
            ? resolveSchema(resolvedSchema.items)
            : null;
        const hasNestedProperties = resolvedSchema.properties || (isArray && arrayItemSchema?.properties);
        const isExpanded = expandedSchemas.has(fullPath);
        return (_jsxs("div", { className: "border-b border-border/50 last:border-0", children: [_jsxs("div", { className: cn("flex items-center gap-3 py-3 px-4 transition-colors", hasNestedProperties && "cursor-pointer hover:bg-muted/50", isExpanded && hasNestedProperties && "bg-muted/20"), onClick: (e) => hasNestedProperties && handleToggleSchema(fullPath, e), role: hasNestedProperties ? "button" : undefined, "aria-expanded": hasNestedProperties ? isExpanded : undefined, tabIndex: hasNestedProperties ? 0 : undefined, onKeyDown: (e) => hasNestedProperties && e.key === "Enter" && handleToggleSchema(fullPath, e), children: [_jsxs("div", { className: "flex items-center gap-2", style: { paddingLeft: `${depth * 16}px` }, children: [hasNestedProperties && (_jsx("div", { className: "flex items-center", children: isExpanded ? (_jsx(ChevronDown, { className: "h-4 w-4 text-primary shrink-0", "aria-hidden": "true" })) : (_jsx(ChevronRight, { className: "h-4 w-4 text-primary shrink-0", "aria-hidden": "true" })) })), hasNestedProperties &&
                                    _jsx(FileJson, { className: "h-4 w-4 text-primary shrink-0", "aria-hidden": "true" })] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "font-mono text-sm font-medium text-foreground truncate", children: [name || _jsx("span", { className: "text-muted-foreground/60", children: "unnamed" }), isArray && _jsx("span", { className: "text-primary", children: "[]" })] }), hasNestedProperties && (_jsx(Badge, { variant: "outline", className: "text-xs bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700", children: isArray ? "array object" : "object" }))] }), _jsxs("div", { className: "text-sm text-muted-foreground", children: [_jsx("span", { className: cn(hasNestedProperties && "text-primary"), children: isArray
                                                ? `array of ${arrayItemSchema?.type || "object"}`
                                                : resolvedSchema.type || "object" }), resolvedSchema.format && (_jsxs("span", { className: "ml-1", children: ["(", resolvedSchema.format, ")"] }))] })] }), _jsx("div", { className: "flex-shrink-0", children: _jsx(Badge, { variant: required?.includes(name) ? "destructive" : "secondary", className: cn("text-xs font-medium", required?.includes(name)
                                    ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800"
                                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700"), children: required?.includes(name) ? "Required" : "Optional" }) })] }), resolvedSchema.description && (_jsx("div", { className: "px-4 pb-3 pt-1 text-sm text-muted-foreground", style: { paddingLeft: `${depth * 16 + 32}px` }, children: resolvedSchema.description })), isExpanded && hasNestedProperties && (_jsxs("div", { className: "bg-muted/10", children: [resolvedSchema.properties &&
                            Object.entries(resolvedSchema.properties).map(([propName, prop]) => renderSchema(prop, propName, resolvedSchema.required || [], fullPath, depth + 1)), isArray &&
                            arrayItemSchema?.properties &&
                            Object.entries(arrayItemSchema.properties).map(([propName, prop]) => renderSchema(prop, propName, arrayItemSchema.required || [], `${fullPath}[]`, // Indicate array item path
                            depth + 1))] }))] }, fullPath));
    };
    const resolvedRootSchema = resolveSchema(schema);
    // If the root schema itself is an array, or an object with properties.
    // If it's a simple type without properties (e.g. string, number directly as root), render its details.
    if (resolvedRootSchema.properties || resolvedRootSchema.type === "array") {
        return (_jsx("div", { className: "rounded-lg border border-border shadow-sm bg-background", children: resolvedRootSchema.properties ? (Object.entries(resolvedRootSchema.properties).map(([name, prop]) => renderSchema(prop, name, resolvedRootSchema.required || [], "", // Root path starts empty
            0))) : resolvedRootSchema.items ? ( // Handle root array
            renderSchema(resolvedRootSchema.items, "", // Name can be empty or indicative like "items"
            resolvedRootSchema.required || [], // Root arrays usually don't have "required" in this context
            "", // Root path for array items
            0)) : (
            // Fallback for array without items or other complex root not directly showing properties
            renderSchema(resolvedRootSchema, resolvedRootSchema.type || "schema", [], "", 0)) }));
    }
    else {
        // Render a single schema without properties (e.g., a root schema that is just a string or number)
        return (_jsx("div", { className: "rounded-lg border border-border shadow-sm bg-background", children: renderSchema(resolvedRootSchema, resolvedRootSchema.type || "schema", [], "", 0) }));
    }
};
