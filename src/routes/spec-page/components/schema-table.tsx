import React, {useState} from "react";
import {ReferenceObject, SchemaObject, SchemaTableProps} from "@/common/swagger.types.ts";
import {cn} from "@/lib/utils.ts";
import {ChevronRight, FileJson} from "lucide-react";
import {Badge} from "@/components/ui/badge.tsx";

export const SchemaTable = ({schema, components}: SchemaTableProps) => {
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
        const arrayItemSchema = isArray ? resolveSchema(resolvedSchema.items as SchemaObject | ReferenceObject) : null;
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
                                        renderSchema(prop as SchemaObject | ReferenceObject, propName, resolvedSchema.required, fullPath)
                                    )}
                                {isArray && arrayItemSchema?.properties &&
                                    Object.entries(arrayItemSchema.properties).map(([propName, prop]) =>
                                        renderSchema(prop as SchemaObject | ReferenceObject, propName, arrayItemSchema.required, `${fullPath}[]`)
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
                        renderSchema(prop as SchemaObject | ReferenceObject, name, resolvedRootSchema.required)
                    ) :
                    renderSchema(resolvedRootSchema)}
                </tbody>
            </table>
        </div>
    );
};