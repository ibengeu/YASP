"use client"

import type React from "react"
import {useEffect, useState, useTransition} from "react"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Textarea} from "@/components/ui/textarea"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {Badge} from "@/components/ui/badge"
import {
    ArrowRight,
    Check,
    ChevronDown,
    Copy,
    FileJson,
    HelpCircle,
    Info,
    Loader2,
    Plus,
    Send,
    Trash2,
    X,
} from "lucide-react"
import {cn} from "@/lib/utils"
import type {
    ComponentsObject,
    OperationObject,
    ParameterObject,
    ReferenceObject,
    RequestBodyObject,
    SchemaObject,
    SecuritySchemeObject,
} from "@/common/swagger.types.ts"
import {ScrollArea} from "@/components/ui/scroll-area"
import {toast} from "sonner"
import {useForm} from "react-hook-form"
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip"
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "@/components/ui/accordion"
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"
import {Switch} from "@/components/ui/switch"
import {Label} from "@/components/ui/label"
import {
    executeApiRequest,
    ExecuteRequestForm,
    Header,
    ResponseData
} from "@/routes/spec-page/actions/execute-api-request.tsx"

interface TryItOutProps {
    path: string
    method: string
    operation: OperationObject
    components: ComponentsObject
}

// Type guard to check if an object is a ReferenceObject
function isReferenceObject(obj: unknown): obj is ReferenceObject {
    return obj !== null && typeof obj === 'object' && '$ref' in (obj as Record<string, unknown>)
}

// Type guard to check if an object is a SchemaObject
function isSchemaObject(obj: unknown): obj is SchemaObject {
    return obj !== null && typeof obj === 'object' && !('$ref' in (obj as Record<string, unknown>))
}

export const TryItOut: React.FC<TryItOutProps> = ({path, method, operation, components}) => {
    const [parameters, setParameters] = useState<Record<string, string>>({})
    const [requestBody, setRequestBody] = useState<string>("")
    const [headers, setHeaders] = useState<Header[]>([])
    const [response, setResponse] = useState<ResponseData | null>(null)
    const [isPending, startTransition] = useTransition()
    const [, setContentType] = useState<string>("application/json")
    const [activeTab, setActiveTab] = useState<string>("params")
    const [newHeaderName, setNewHeaderName] = useState<string>("")
    const [newHeaderValue, setNewHeaderValue] = useState<string>("")
    const [baseUrl, setBaseUrl] = useState<string>("https://api.example.com")
    const [curlCommand, setCurlCommand] = useState<string>("")
    const [showHelp, setShowHelp] = useState<boolean>(false)
    const [autoFormat, setAutoFormat] = useState<boolean>(true)

    const {register, handleSubmit} = useForm<{ requestData: string }>()

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

    const generateSampleFromSchema = (
        schema: SchemaObject | ReferenceObject | undefined,
        components: ComponentsObject,
        depth: number = 0
    ): unknown => {
        if (!schema || depth > 10) return null

        if (isReferenceObject(schema)) {
            const refPath = schema.$ref.split("/")
            const schemaName = refPath[refPath.length - 1]
            if (components?.schemas?.[schemaName]) {
                return generateSampleFromSchema(components.schemas[schemaName], components, depth + 1)
            }
            return {}
        }

        const typedSchema = schema as SchemaObject

        // Handle nullable
        if (typedSchema.nullable) {
            return null
        }

        // Handle const
        if (typedSchema.const !== undefined) {
            return typedSchema.const
        }

        // Handle enum
        if (typedSchema.enum && typedSchema.enum.length > 0) {
            return typedSchema.enum[0]
        }

        // Handle default
        if (typedSchema.default !== undefined) {
            return typedSchema.default
        }

        // Handle example
        if (typedSchema.example !== undefined) {
            return typedSchema.example
        }

        // Handle allOf
        if (typedSchema.allOf && typedSchema.allOf.length > 0) {
            const merged: Record<string, unknown> = {}
            typedSchema.allOf.forEach((subSchema) => {
                const subSample = generateSampleFromSchema(subSchema, components, depth + 1)
                if (subSample && typeof subSample === 'object') {
                    Object.assign(merged, subSample)
                }
            })
            return merged
        }

        if (typedSchema.oneOf && typedSchema.oneOf.length > 0) {
            return generateSampleFromSchema(typedSchema.oneOf[0], components, depth + 1)
        }

        // Handle anyOf (pick first valid schema)
        if (typedSchema.anyOf && typedSchema.anyOf.length > 0) {
            return generateSampleFromSchema(typedSchema.anyOf[0], components, depth + 1)
        }

        // Handle not (return null as we can't generate a valid sample)
        if (typedSchema.not) {
            return null
        }

        // Handle type-specific generation
        switch (typedSchema.type) {
            case "object": {
                const obj: Record<string, unknown> = {}
                if (typedSchema.properties) {
                    Object.entries(typedSchema.properties).forEach(([propName, propSchema]) => {
                        if (typedSchema.required?.includes(propName)) {
                            obj[propName] = generateSampleFromSchema(propSchema, components, depth + 1)
                        }
                    })
                }
                return obj
            }
            case "array": {
                if (typedSchema.items) {
                    const itemSample = generateSampleFromSchema(typedSchema.items, components, depth + 1)
                    const minItems = typedSchema.minItems ?? 1
                    return Array(Math.max(1, minItems)).fill(itemSample)
                }
                return []
            }
            case "string": {
                if (typedSchema.format === "date-time") return new Date().toISOString()
                if (typedSchema.format === "date") return new Date().toISOString().split("T")[0]
                if (typedSchema.format === "email") return "user@example.com"
                if (typedSchema.format === "uri") return "https://example.com"
                if (typedSchema.pattern) return "string_matching_pattern"
                if (typedSchema.minLength || typedSchema.maxLength) return "sample".padEnd(typedSchema.minLength ?? 6, "x")
                return "sample string"
            }
            case "number":
            case "integer": {
                if (typedSchema.minimum !== undefined) return typedSchema.minimum
                if (typedSchema.maximum !== undefined) return typedSchema.maximum
                if (typedSchema.type === "integer") return 123
                return 123.45
            }
            case "boolean":
                return true
            case "null":
                return null
            default:
                return null
        }
    }

    // Add security headers based on security schemes
    const addSecurityHeaders = () => {
        if (!operation.security || !components.securitySchemes) return

        operation.security.forEach((securityRequirement) => {
            Object.keys(securityRequirement).forEach((securityName) => {
                const securityScheme = components.securitySchemes?.[securityName] as SecuritySchemeObject | undefined

                if (securityScheme && securityScheme.type === "apiKey" && securityScheme.in === "header") {
                    const headerExists = headers.some((h) => h.name === securityScheme.name)
                    if (!headerExists && securityScheme.name) {
                        setHeaders((prev) => [
                            ...prev,
                            {
                                name: securityScheme.name || "",
                                value: "",
                            },
                        ])
                    }
                } else if (securityScheme && (securityScheme.type === "oauth2" || securityScheme.type === "http")) {
                    const headerExists = headers.some((h) => h.name === "Authorization")
                    if (!headerExists) {
                        setHeaders((prev) => [
                            ...prev,
                            {
                                name: "Authorization",
                                value: securityScheme.type === "http" && securityScheme.scheme === "bearer" ? "Bearer " : "",
                            },
                        ])
                    }
                }
            })
        })
    }

    useEffect(() => {
        if (["post", "put", "patch"].includes(method.toLowerCase()) && operation.requestBody) {
            const requestBodyObj = operation.requestBody as RequestBodyObject
            const contentTypes = Object.keys(requestBodyObj.content || {})

            if (contentTypes.length > 0) {
                const firstContentType = contentTypes[0]
                setContentType(firstContentType)

                const schema = requestBodyObj.content?.[firstContentType]?.schema
                if (schema) {
                    try {
                        if (requestBodyObj.content?.[firstContentType]?.example) {
                            setRequestBody(JSON.stringify(requestBodyObj.content[firstContentType].example, null, 2))
                        } else {
                            const sample = generateSampleFromSchema(schema, components)
                            setRequestBody(JSON.stringify(sample, null, 2))
                        }
                    } catch (e) {
                        console.error("Error generating sample request body:", e)
                        setRequestBody("{}")
                    }
                }
            }
        }

        if (["post", "put", "patch"].includes(method.toLowerCase())) {
            setHeaders([{name: "Content-Type", value: "application/json"}])
        }

        addSecurityHeaders()
    }, [method, operation, components])

    const handleParameterChange = (name: string, value: string) => {
        setParameters((prev) => ({...prev, [name]: value}))
    }

    const handleRequestBodyChange = (value: string) => {
        setRequestBody(value)

        if (autoFormat) {
            try {
                JSON.parse(value)
            } catch (e) {
                console.error(e)

                return
            }

            const timeoutId = setTimeout(() => {
                try {
                    const formatted = JSON.stringify(JSON.parse(value), null, 2)
                    setRequestBody(formatted)
                } catch (e) {
                    console.error(e)

                }
            }, 1000)

            return () => clearTimeout(timeoutId)
        }
    }

    const formatJson = () => {
        try {
            const formatted = JSON.stringify(JSON.parse(requestBody), null, 2)
            setRequestBody(formatted)
            toast.success(
                "Your JSON has been formatted successfully.",
                {
                    description: "JSON Formatted",
                }
            )
        } catch (e) {
            console.error(e)
            toast.error(
                "Could not format JSON. Please check your syntax.",
                {
                    description: "JSON Formatted",
                }
            )
        }
    }

    const addHeader = () => {
        if (newHeaderName.trim() === "") return

        const existing = headers.findIndex((h) => h.name.toLowerCase() === newHeaderName.toLowerCase())

        if (existing >= 0) {
            const updatedHeaders = [...headers]
            updatedHeaders[existing] = {name: newHeaderName, value: newHeaderValue}
            setHeaders(updatedHeaders)
        } else {
            setHeaders([...headers, {name: newHeaderName, value: newHeaderValue}])
        }

        setNewHeaderName("")
        setNewHeaderValue("")
    }

    const removeHeader = (index: number) => {
        setHeaders(headers.filter((_, i) => i !== index))
    }

    const generateCurlCommand = (url: string): string => {
        let curl = `curl -X ${method.toUpperCase()} "${url}"`

        headers.forEach((header) => {
            if (header.name && header.value) {
                curl += ` \\\n  -H "${header.name}: ${header.value}"`
            }
        })

        if (["post", "put", "patch"].includes(method.toLowerCase()) && requestBody) {
            try {
                const formattedBody = JSON.stringify(JSON.parse(requestBody), null, 2)
                curl += ` \\\n  -d '${formattedBody}'`
            } catch (e) {
                console.error(e)

                curl += ` \\\n  -d '${requestBody}'`
            }
        }

        return curl
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard
            .writeText(text)
            .then(() =>
                toast.success("Content copied to clipboard")
            )
            .catch((err) => {
                toast.error("Failed to copy, Please try again")
                console.error("Failed to copy: ", err)
            })
    }

    const handleExecute = async (data: { requestData: string }) => {
        startTransition(async () => {
            setResponse(null)

            const formData = new FormData()
            formData.append("requestData", data.requestData)

            try {
                const responseData = await executeApiRequest(formData)
                setResponse(responseData)

                const fullUrl = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`
                const curlCmd = generateCurlCommand(fullUrl)
                setCurlCommand(curlCmd)

                if (responseData.status >= 400) {
                    toast.error(`Request failed - Received status code ${responseData.status}`)
                } else {
                    toast.success(`Request successful - Received status code ${responseData.status}`)
                }
            } catch (error) {
                console.error("Error executing request:", error)
                const errorMessage = error instanceof Error ? error.message : "An error occurred"
                toast.error(errorMessage)
                setResponse({
                    status: 500,
                    body: JSON.stringify({error: errorMessage}, null, 2),
                    headers: {"content-type": "application/json"},
                })
            }
        })
    }

    const onSubmit = handleSubmit(() => {
        const requestData: ExecuteRequestForm = {
            method,
            path,
            baseUrl,
            parameters: {
                ...parameters,
                pathParams: (operation.parameters?.filter((p) => !isReferenceObject(p) && p.in === "path") || []) as ParameterObject[],
                queryParams: (operation.parameters?.filter((p) => !isReferenceObject(p) && p.in === "query") || []) as ParameterObject[],
            },
            requestBody,
            headers,
        }
        handleExecute({requestData: JSON.stringify(requestData)})
    })

    const renderParameterInputs = () => {
        if (!operation.parameters || operation.parameters.length === 0) {
            if (["post", "put", "patch"].includes(method.toLowerCase()) && operation.requestBody) {
                return null
            }
            return <div className="text-center py-4 text-muted-foreground">No parameters required</div>
        }

        const groupedParams: Record<string, ParameterObject[]> = {}
        operation.parameters.forEach((param) => {
            if (isReferenceObject(param)) return // Skip unresolved references
            const parameter = param as ParameterObject
            const paramIn = parameter.in || "other"
            if (!groupedParams[paramIn]) {
                groupedParams[paramIn] = []
            }
            groupedParams[paramIn].push(parameter)
        })

        return (
            <div className="space-y-6">
                {Object.entries(groupedParams).map(([paramType, params]) => (
                    <div key={paramType} className="space-y-4">
                        <h3 className="text-sm font-semibold capitalize flex items-center">
                            <Badge variant="outline" className="mr-2 capitalize">
                                {paramType} Parameters
                            </Badge>
                            <span className="text-xs text-muted-foreground">({params.length})</span>
                        </h3>

                        <div className="space-y-4 pl-1">
                            {params.map((parameter, index) => (
                                <div key={index}
                                     className="space-y-2 bg-white/50 p-3 rounded-md border border-gray-100 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <label htmlFor={`param-${parameter.name}`} className="text-sm font-medium">
                                            {parameter.name}
                                        </label>
                                        {parameter.required && (
                                            <Badge variant="destructive" className="text-xs">
                                                required
                                            </Badge>
                                        )}

                                        {parameter.description && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Info className="h-4 w-4 text-muted-foreground cursor-help"/>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-xs">
                                                        <p>{parameter.description}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </div>

                                    <div className="flex gap-2 items-center">
                                        <Input
                                            id={`param-${parameter.name}`}
                                            value={parameters[parameter.name] || ""}
                                            onChange={(e) => handleParameterChange(parameter.name, e.target.value)}
                                            placeholder={parameter.example?.toString() || `Enter ${parameter.name}`}
                                            className="flex-1"
                                        />

                                        {parameter.schema && isSchemaObject(parameter.schema) && parameter.schema.enum && (
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" size="icon" className="h-10 w-10">
                                                        <ChevronDown className="h-4 w-4"/>
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-56 p-0">
                                                    <div className="max-h-60 overflow-auto">
                                                        {parameter.schema.enum.map((value: string, i: number) => (
                                                            <Button
                                                                key={i}
                                                                variant="ghost"
                                                                className="w-full justify-start text-left font-normal"
                                                                onClick={() => handleParameterChange(parameter.name, value)}
                                                            >
                                                                {value}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    const renderRequestBodyInput = () => {
        if (!operation.requestBody || isReferenceObject(operation.requestBody)) {
            return null
        }

        const requestBodyObj = operation.requestBody as RequestBodyObject

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium">Request Body</h3>
                        {requestBodyObj.required && (
                            < Badge variant="destructive" className="text-xs">
                                required
                            </Badge>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={formatJson}>
                                        <FileJson className="h-4 w-4"/>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Format JSON</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <div className="flex items-center space-x-2">
                            <Switch id="auto-format" checked={autoFormat} onCheckedChange={setAutoFormat}/>
                            <Label htmlFor="auto-format" className="text-xs">
                                Auto-format
                            </Label>
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <Textarea
                        value={requestBody}
                        onChange={(e) => handleRequestBodyChange(e.target.value)}
                        placeholder="Enter request body"
                        className="font-mono text-sm min-h-[200px] border-black/10 bg-white"
                    />
                </div>
            </div>
        )
    }

    const renderHeadersInput = () => {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Headers</h3>
                </div>

                <div className="space-y-3">
                    {headers.map((header, index) => (
                        <div key={index}
                             className="flex items-center gap-2 bg-white/50 p-2 rounded-md border border-gray-100">
                            <Input
                                value={header.name}
                                onChange={(e) => {
                                    const newHeaders = [...headers]
                                    newHeaders[index].name = e.target.value
                                    setHeaders(newHeaders)
                                }}
                                placeholder="Header name"
                                className="flex-1 bg-white"
                            />
                            <Input
                                value={header.value}
                                onChange={(e) => {
                                    const newHeaders = [...headers]
                                    newHeaders[index].value = e.target.value
                                    setHeaders(newHeaders)
                                }}
                                placeholder="Value"
                                className="flex-1 bg-white"
                            />
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeHeader(index)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4"/>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Remove header</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-2 mt-4">
                    <Input
                        value={newHeaderName}
                        onChange={(e) => setNewHeaderName(e.target.value)}
                        placeholder="Header name"
                        className="flex-1 bg-white"
                    />
                    <Input
                        value={newHeaderValue}
                        onChange={(e) => setNewHeaderValue(e.target.value)}
                        placeholder="Value"
                        className="flex-1 bg-white"
                    />
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={addHeader}
                                    className="bg-[#dbbba5] hover:bg-[#c9a994]"
                                    disabled={!newHeaderName.trim()}
                                >
                                    <Plus className="h-4 w-4 text-black"/>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Add header</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                <Accordion type="single" collapsible className="mt-4">
                    <AccordionItem value="common-headers" className="border-none">
                        <AccordionTrigger
                            className="py-2 px-3 rounded-md bg-[#dbbba5]/40 hover:bg-[#dbbba5]/60 text-sm font-medium">
                            Common Headers
                        </AccordionTrigger>
                        <AccordionContent className="pt-2">
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs justify-start h-8"
                                    onClick={() => {
                                        setNewHeaderName("Authorization")
                                        setNewHeaderValue("Bearer ")
                                    }}
                                >
                                    Authorization
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs justify-start h-8"
                                    onClick={() => {
                                        setNewHeaderName("Content-Type")
                                        setNewHeaderValue("application/json")
                                    }}
                                >
                                    Content-Type
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs justify-start h-8"
                                    onClick={() => {
                                        setNewHeaderName("Accept")
                                        setNewHeaderValue("application/json")
                                    }}
                                >
                                    Accept
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs justify-start h-8"
                                    onClick={() => {
                                        setNewHeaderName("x-api-key")
                                        setNewHeaderValue("")
                                    }}
                                >
                                    x-api-key
                                </Button>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        )
    }

    const hasParameters = operation.parameters && operation.parameters.length > 0
    const showRequestBody = ["post", "put", "patch"].includes(method.toLowerCase()) && operation.requestBody

    return (
        <Card className="h-full overflow-hidden flex flex-col bg-gradient-to-br from-[#DBBBA5]/30 to-[#DBBBA5]/10">
            <CardHeader className="bg-[#DBBBA5]/50 shrink-0 pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Badge
                            className={cn("uppercase text-white", methodColors[method.toLowerCase()] || "bg-gray-500")}>
                            {method}
                        </Badge>
                        Try It Out
                    </CardTitle>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8"
                                        onClick={() => setShowHelp(!showHelp)}>
                                    <HelpCircle className="h-4 w-4"/>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Help & Tips</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                {showHelp && (
                    <div className="mt-2 p-3 bg-white/80 rounded-md text-sm border border-[#DBBBA5]/50">
                        <div className="flex items-start justify-between">
                            <h4 className="font-medium">Quick Guide</h4>
                            <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -mr-1"
                                    onClick={() => setShowHelp(false)}>
                                <X className="h-4 w-4"/>
                            </Button>
                        </div>
                        <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                            <li className="flex items-center gap-1">
                                <Check className="h-3 w-3 text-green-500"/> Fill in required parameters in the
                                Parameters tab
                            </li>
                            <li className="flex items-center gap-1">
                                <Check className="h-3 w-3 text-green-500"/> Add any necessary headers in the Headers tab
                            </li>
                            <li className="flex items-center gap-1">
                                <Check className="h-3 w-3 text-green-500"/> For POST/PUT requests, provide a request
                                body
                            </li>
                            <li className="flex items-center gap-1">
                                <Check className="h-3 w-3 text-green-500"/> Click "Execute Request" to send your API
                                call
                            </li>
                            <li className="flex items-center gap-1">
                                <Check className="h-3 w-3 text-green-500"/> View the response below or copy the curl
                                command
                            </li>
                        </ul>
                    </div>
                )}
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                    <div className="p-4 space-y-6">
                        <Tabs defaultValue="params" value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-4 bg-[#dbbba5]/40">
                                <TabsTrigger value="params" className="data-[state=active]:bg-[#dbbba5]/80">
                                    Parameters
                                    {hasParameters && (
                                        <Badge variant="outline" className="ml-2 bg-white">
                                            {operation.parameters?.length}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="headers" className="data-[state=active]:bg-[#dbbba5]/80">
                                    Headers
                                    {headers.length > 0 && (
                                        <Badge variant="outline" className="ml-2 bg-white">
                                            {headers.length}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                                {showRequestBody && (
                                    <TabsTrigger value="body" className="data-[state=active]:bg-[#dbbba5]/80">
                                        Body
                                    </TabsTrigger>
                                )}
                                <TabsTrigger value="curl" className="data-[state=active]:bg-[#dbbba5]/80">
                                    cURL
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="params" className="space-y-4 mt-4 px-1">
                                {hasParameters ? (
                                    renderParameterInputs()
                                ) : (
                                    <div
                                        className="text-center py-6 text-muted-foreground bg-white/50 rounded-md border border-dashed">
                                        No parameters required for this endpoint
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="headers" className="space-y-4 mt-4 px-1">
                                {renderHeadersInput()}
                            </TabsContent>

                            {showRequestBody && (
                                <TabsContent value="body" className="space-y-4 mt-4 px-1">
                                    <div className="mt-4 mb-2 px-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-medium">Base URL</h3>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Info className="h-4 w-4 text-muted-foreground cursor-help"/>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>The base URL will be combined with the endpoint path</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Input
                                                value={baseUrl}
                                                onChange={(e) => setBaseUrl(e.target.value)}
                                                placeholder="Enter base URL (e.g., https://api.example.com)"
                                                className="bg-white flex-1"
                                            />
                                            <Badge variant="outline" className="whitespace-nowrap">
                                                {path}
                                            </Badge>
                                        </div>
                                    </div>
                                    {renderRequestBodyInput()}
                                </TabsContent>
                            )}

                            <TabsContent value="curl" className="space-y-4 mt-4 px-1">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium">cURL Command</h3>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-xs"
                                            onClick={() => {
                                                const fullUrl = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`
                                                const cmd = generateCurlCommand(fullUrl)
                                                setCurlCommand(cmd)
                                                copyToClipboard(cmd)
                                            }}
                                        >
                                            <Copy className="h-3 w-3 mr-1"/> Copy
                                        </Button>
                                    </div>
                                    <div className="relative">
                                        <pre
                                            className="bg-muted p-4 rounded-md overflow-x-auto text-xs font-mono whitespace-pre-wrap break-words max-h-[200px]">
                                            {curlCommand ||
                                                `curl -X ${method.toUpperCase()} "${baseUrl}${path.startsWith("/") ? path : `/${path}`}"`}
                                        </pre>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        <p>This cURL command represents your current request configuration.</p>
                                        <p className="mt-1">Execute the request to update the command with all
                                            parameters and headers.</p>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        <form onSubmit={onSubmit} className="mt-6">
                            <Button type="submit" disabled={isPending}
                                    className="w-full bg-black hover:bg-black/90 text-white">
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                        Executing Request...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4"/>
                                        Execute Request
                                    </>
                                )}
                            </Button>
                            <input type="hidden" {...register("requestData")} />
                        </form>

                        {response && (
                            <div className="space-y-4 mt-6 bg-white p-4 rounded-md border shadow-sm">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-medium">Response</h3>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant={response.status >= 200 && response.status < 300 ? "default" : "destructive"}
                                            className="text-xs"
                                        >
                                            Status: {response.status}
                                        </Badge>
                                        {response.time &&
                                            <span className="text-xs text-muted-foreground">{response.time}ms</span>}
                                    </div>
                                </div>

                                <Tabs defaultValue="body">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="body">Response Body</TabsTrigger>
                                        <TabsTrigger value="headers">Response Headers</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="body" className="mt-2">
                                        <div className="relative">
                                            <pre
                                                className="bg-muted p-4 rounded-md overflow-x-auto text-xs font-mono whitespace-pre-wrap break-words max-h-[300px]">
                                                {response.body}
                                            </pre>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="absolute top-2 right-2 bg-white"
                                                onClick={() => copyToClipboard(response.body)}
                                            >
                                                <Copy className="h-3 w-3 mr-1"/> Copy
                                            </Button>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="headers" className="mt-2">
                                        <div className="bg-muted p-4 rounded-md overflow-x-auto max-h-[300px]">
                                            <table className="w-full text-xs">
                                                <thead>
                                                <tr className="border-b">
                                                    <th className="text-left font-medium py-2 px-2">Name</th>
                                                    <th className="text-left font-medium py-2 px-2">Value</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {Object.entries(response.headers).map(([name, value]) => (
                                                    <tr key={name} className="border-b last:border-0">
                                                        <td className="py-2 px-2 font-mono">{name}</td>
                                                        <td className="py-2 px-2 font-mono">{value}</td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        )}

                        {!response && (
                            <div className="mt-6 p-6 border border-dashed rounded-md bg-white/50 text-center">
                                <div className="flex flex-col items-center justify-center text-muted-foreground">
                                    <ArrowRight className="h-8 w-8 mb-2 text-[#dbbba5]"/>
                                    <p>Execute a request to see the response here</p>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}