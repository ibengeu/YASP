// src/components/swagger/endpoint-section.tsx
import {Card} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {cn} from "@/lib/utils.ts"

interface EndpointSectionProps {
    tag: string
    endpoints: Array<{
        path: string
        method: string
        operation: any
    }>
}

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
        operation: any;
    }>;
    components: any;
}

function SchemaTable({schema, components, parentPath = ''}: { schema: any; components: any; parentPath?: string }) {
    if (!schema) return null;

    function getSchemaProperties(schema: any): any {
        if (schema.$ref) {
            const refKey = schema.$ref.split('/').pop();
            return components.schemas[refKey]?.properties;
        }
        return schema.properties;
    }

    function renderPropertyRow(name: string, prop: any, required: string[] = [], path = '') {
        const fullPath = path ? `${path}.${name}` : name;
        const isNested = prop.type === 'object' && prop.properties;
        const isArray = prop.type === 'array' && prop.items;

        return (
            <>
                <tr key={fullPath} className="border-b">
                    <td className="px-4 py-2 font-mono">
                        {path && '↳ '}{name}
                        {isArray && '[]'}
                    </td>
                    <td className="px-4 py-2">
                        {isNested ? 'object' : isArray ? `array of ${prop.items.type || 'object'}` : prop.type}
                        {prop.format ? ` (${prop.format})` : ''}
                    </td>
                    <td className="px-4 py-2">
                        <Badge variant={required?.includes(name) ? "destructive" : "secondary"}>
                            {required?.includes(name) ? "Required" : "Optional"}
                        </Badge>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{prop.description || '-'}</td>
                </tr>
                {isNested && Object.entries(prop.properties).map(([subName, subProp]: [string, any]) =>
                    renderPropertyRow(subName, subProp, prop.required, fullPath)
                )}
                {isArray && prop.items.type === 'object' && prop.items.properties &&
                    Object.entries(prop.items.properties).map(([subName, subProp]: [string, any]) =>
                        renderPropertyRow(subName, subProp, prop.items.required, fullPath)
                    )}
            </>
        );
    }

    const properties = getSchemaProperties(schema);
    if (!properties) return null;

    return (
        <table className="w-full border-collapse">
            <thead>
            <tr className="bg-muted">
                <th className="px-4 py-2 text-left">Property</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Required</th>
                <th className="px-4 py-2 text-left">Description</th>
            </tr>
            </thead>
            <tbody>
            {Object.entries(properties).map(([name, prop]: [string, any]) =>
                renderPropertyRow(name, prop, schema.required)
            )}
            </tbody>
        </table>
    );
}
export default function EndpointSection({tag, endpoints, components}: EndpointSectionProps) {
    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">{tag}</h2>
            <div className="space-y-6">
                {endpoints.map(({path, method, operation}) => (
                    <Card key={`${path}-${method}`} className="p-4">
                        {/* Method and Path */}
                        <div className="flex items-center gap-4 mb-4">
                            <Badge className={cn("uppercase", methodColors[method])}>{method}</Badge>
                            <code className="text-sm font-mono">{path}</code>
                        </div>

                        {/* Only show summary/description if present */}
                        {operation.summary && <h3 className="font-semibold mb-2">{operation.summary}</h3>}
                        {operation.description && <p className="text-muted-foreground mb-4">{operation.description}</p>}

                        {/* Show one response schema per content type */}
                        {operation.requestBody?.content && (
                            Object.entries(operation.requestBody.content)[0] && (
                                <div className="mb-6">
                                    <h4 className="text-sm font-semibold mb-2">Request Body</h4>
                                    <SchemaTable
                                        schema={Object.entries(operation.requestBody.content)[0][1].schema}
                                        components={components}
                                    />
                                </div>
                            )
                        )}

                        {/* Only show one response schema */}
                        {operation.responses && Object.entries(operation.responses).map(([code, response]: [string, any]) => (
                            response.content && Object.entries(response.content)[0] && (
                                <div key={code} className="mb-6">
                                    <h4 className="text-sm font-semibold mb-2">Response {code}</h4>
                                    <SchemaTable
                                        schema={Object.entries(response.content)[0][1].schema}
                                        components={components}
                                    />
                                </div>
                            )
                        ))}
                    </Card>
                ))}
            </div>
        </div>
    );
}