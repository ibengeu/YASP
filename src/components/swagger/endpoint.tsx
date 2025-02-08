/* eslint-disable @typescript-eslint/ban-ts-comment */
import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from "@/components/ui/collapsible"
import {OperationObject, RequestBodyObject, ResponseObject, SchemaObject} from "@/types/swagger"
import {ChevronRight} from "lucide-react"
import {useState} from "react"

interface EndpointProps {
    method: string
    path: string
    operation: OperationObject
}

const methodColors: Record<string, string> = {
    get: "bg-blue-500",
    post: "bg-green-500",
    put: "bg-orange-500",
    delete: "bg-red-500",
    patch: "bg-yellow-500",
}

function renderSchema(schema: SchemaObject, level = 0){
    const indent = "  ".repeat(level)

    if (schema.type === 'object' && schema.properties) {
        return (
            <div className="font-mono text-sm whitespace-pre">
                {indent}{'{'}<br/>
                {Object.entries(schema.properties).map(([key, prop]) => (
                    <div key={key}>
                        {indent} "{key}": {(prop as SchemaObject).type}
                        {schema.required?.includes(key) && ' // required'}
                        <br/>
                        {(prop as SchemaObject).description &&
                            <span className="text-muted-foreground">
                                {indent} // {(prop as SchemaObject).description}<br/>
                            </span>
                        }
                    </div>
                ))}
                {indent}{'}'}
            </div>
        )
    }

    if (schema.type === 'array' && schema.items) {
        return (
            <div className="font-mono text-sm whitespace-pre">
                {indent}[<br/>
                {indent} {renderSchema(schema.items as SchemaObject, level + 1)}
                {indent}]
            </div>
        )
    }

    return <span className="font-mono text-sm">{schema.type}</span>
}

function renderRequestBody(requestBody: RequestBodyObject) {
    if (!requestBody.content) return null;

    return (
        <div className="mb-4">
            <h4 className="mb-2 font-semibold">Request Body</h4>
            {Object.entries(requestBody.content).map(([contentType, content]) => (
                <div key={contentType} className="rounded border p-3 mb-2">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{contentType}</Badge>
                        {requestBody.required && (
                            <Badge variant="destructive">Required</Badge>
                        )}
                    </div>
                    {requestBody.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                            {requestBody.description}
                        </p>
                    )}
                    {content.schema && (
                        <div className="bg-muted p-2 rounded">
                            {// @ts-ignore
                                renderSchema(content.schema)}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

function renderResponse(response: ResponseObject, statusCode: string) {
    if (!response.content) return null;

    return (
        <div key={statusCode} className="mb-2">
            <div className="flex items-center gap-2 mb-2">
                <Badge variant={statusCode.startsWith('2') ? 'default' : 'secondary'}>
                    {statusCode}
                </Badge>
                <span className="text-sm">{response.description}</span>
            </div>
            {Object.entries(response.content).map(([contentType, content]) => (
                <div key={contentType} className="rounded border p-3 mb-2">
                    <Badge variant="outline" className="mb-2">{contentType}</Badge>
                    {content.schema && (
                        <div className="bg-muted p-2 rounded">
                            {// @ts-expect-error
                                renderSchema(content.schema)}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

export default function Endpoint({method, path, operation}: EndpointProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <Card>
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CardHeader className="p-4">
                    <div className="flex items-center gap-4">
                        <Badge className={`${methodColors[method]} text-white uppercase`}>
                            {method}
                        </Badge>
                        <span className="font-mono text-sm">{path}</span>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <ChevronRight
                                    className={`h-4 w-4 transition-transform ${
                                        isOpen ? "rotate-90" : ""
                                    }`}
                                />
                            </Button>
                        </CollapsibleTrigger>
                    </div>
                    <CardTitle className="text-sm">{operation.summary}</CardTitle>
                    {operation.description && (
                        <CardDescription>{operation.description}</CardDescription>
                    )}
                </CardHeader>
                <CollapsibleContent>
                    <CardContent className="p-4 pt-0">
                        {operation.parameters && operation.parameters.length > 0 && (
                            <div className="mb-4">
                                <h4 className="mb-2 font-semibold">Parameters</h4>
                                <div className="space-y-3">
                                    {operation.parameters.map((param) => (
                                        <div
                                            key={param.name}
                                            className="rounded border p-3"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-semibold">{param.name}</span>
                                                <Badge variant="outline">{param.in}</Badge>
                                                {param.required && (
                                                    <Badge variant="destructive">Required</Badge>
                                                )}
                                            </div>
                                            {param.description && (
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    {param.description}
                                                </p>
                                            )}
                                            {param.schema && (
                                                <div className="mt-2 bg-muted p-2 rounded">
                                                    {renderSchema(param.schema)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {operation.requestBody && renderRequestBody(operation.requestBody)}

                        {operation.responses && (
                            <div>
                                <h4 className="mb-2 font-semibold">Responses</h4>
                                <div className="space-y-2">
                                    {Object.entries(operation.responses).map(([code, response]) =>
                                        renderResponse(response as ResponseObject, code)
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    )
}