/* eslint-disable */
"use client"

import type React from "react"
import {useCallback, useState} from "react"
import {AlertCircle, Check, FileJson, Upload} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Textarea} from "@/components/ui/textarea"
import {Alert, AlertDescription} from "@/components/ui/alert.tsx"
import {cn} from "@/lib/utils"
import {OpenApiDocument} from "@/common/openapi-spec.ts"

interface SwaggerInputProps {
    onSpecLoaded: (spec: OpenApiDocument) => void
}

export function SwaggerInput({onSpecLoaded}: SwaggerInputProps) {
    const [error, setError] = useState<string | null>(null)
    const [pastedContent, setPastedContent] = useState<string>("")
    const [isDragging, setIsDragging] = useState<boolean>(false)
    const [fileName, setFileName] = useState<string | null>(null)
    const [isValid, setIsValid] = useState<boolean>(false)

    const validateAndLoadSpec = useCallback(
        (content: unknown) => {
            setError(null)
            setIsValid(false)

            try {
                if (typeof content !== "object" || content === null) {
                    setError("Specification must be a JSON object")
                    return false
                }

                const spec = content as Partial<OpenApiDocument>

                if (!spec.openapi) {
                    setError("Missing 'openapi' field")
                    return false
                }

                if (!spec.openapi.startsWith("3.")) {
                    setError(`Unsupported OpenAPI version: ${spec.openapi}. Only version 3.x is supported.`)
                    return false
                }

                if (!spec.info) {
                    setError("Missing 'info' section")
                    return false
                }

                if (!spec.info.title) {
                    setError("Missing 'title' in 'info' section")
                    return false
                }

                if (!spec.info.version) {
                    setError("Missing 'version' in 'info' section")
                    return false
                }

                if (!spec.paths || Object.keys(spec.paths).length === 0) {
                    setError("Missing or empty 'paths' section")
                    return false
                }

                setIsValid(true)
                onSpecLoaded(spec as OpenApiDocument)
                return true
            } catch (err) {
                setError("Invalid specification format")
                return false
            }
        },
        [onSpecLoaded]
    )

    const handleFileUpload = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0]
            if (!file) return

            if (!file.type.includes("json") && !file.name.endsWith(".json")) {
                setError("Please upload a JSON file")
                return
            }

            setFileName(file.name)
            const reader = new FileReader()
            reader.onload = (e) => {
                try {
                    const content = JSON.parse(e.target?.result as string)
                    validateAndLoadSpec(content)
                } catch (err) {
                    setError("Invalid JSON file format")
                }
            }
            reader.onerror = () => setError("Error reading file")
            reader.readAsText(file)
        },
        [validateAndLoadSpec]
    )

    const handlePasteChange = useCallback(
        (event: React.ChangeEvent<HTMLTextAreaElement>) => {
            const content = event.target.value
            setPastedContent(content)

            if (!content.trim()) {
                setError(null)
                setIsValid(false)
                return
            }

            try {
                const parsedContent = JSON.parse(content)
                validateAndLoadSpec(parsedContent)
            } catch (err) {
                setError("Invalid JSON format. Please check your input.")
            }
        },
        [validateAndLoadSpec]
    )

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback(() => setIsDragging(false), [])

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            setIsDragging(false)

            const file = e.dataTransfer.files?.[0]
            if (!file) return

            if (!file.type.includes("json") && !file.name.endsWith(".json")) {
                setError("Please upload a JSON file")
                return
            }

            setFileName(file.name)
            const reader = new FileReader()
            reader.onload = (e) => {
                try {
                    const content = JSON.parse(e.target?.result as string)
                    validateAndLoadSpec(content)
                } catch (err) {
                    setError("Invalid JSON file format")
                }
            }
            reader.onerror = () => setError("Error reading file")
            reader.readAsText(file)
        },
        [validateAndLoadSpec]
    )

    return (
        <div className="space-y-8 max-w-3xl mx-auto">
            <div className="space-y-2">
                <h2 className="text-2xl font-semibold">Load OpenAPI Specification</h2>
                <p className="text-muted-foreground">Upload a JSON file or paste your OpenAPI 3.x specification
                    below</p>
            </div>

            <div
                className={cn(
                    "flex flex-col justify-center items-center border-2 border-dashed rounded-lg p-8 transition-colors",
                    isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20",
                    fileName && isValid ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900" : ""
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="text-center space-y-4">
                    {fileName && isValid ? (
                        <div className="flex flex-col items-center gap-2">
                            <div
                                className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <Check className="h-6 w-6 text-green-600 dark:text-green-400" aria-hidden="true"/>
                            </div>
                            <div className="flex items-center gap-2">
                                <FileJson className="h-5 w-5 text-muted-foreground"/>
                                <span className="font-medium">{fileName}</span>
                            </div>
                            <p className="text-sm text-green-600 dark:text-green-400">Specification loaded
                                successfully!</p>
                        </div>
                    ) : (
                        <>
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                                <Upload className="h-6 w-6 text-muted-foreground" aria-hidden="true"/>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Drag and drop your OpenAPI JSON file here,
                                    or</p>
                                <Button variant="secondary" className="relative">
                                    Select OpenAPI file
                                    <input
                                        type="file"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        accept="application/json,.json"
                                        onChange={handleFileUpload}
                                        aria-label="Upload OpenAPI specification file"
                                    />
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-sm font-medium block">Or paste your OpenAPI specification:</label>
                <Textarea
                    placeholder="Paste your OpenAPI/Swagger JSON here..."
                    className={cn(
                        "font-mono min-h-[200px] resize-y",
                        isValid && pastedContent ? "border-green-300 focus-visible:ring-green-300" : ""
                    )}
                    value={pastedContent}
                    onChange={handlePasteChange}
                    aria-label="OpenAPI specification input"
                />
                {isValid && pastedContent && (
                    <p className="text-sm flex items-center gap-1.5 text-green-600">
                        <Check className="h-4 w-4"/>
                        Valid OpenAPI 3.x specification
                    </p>
                )}
            </div>

            {error && (
                <Alert variant="destructive" className="animate-in fade-in-0 zoom-in-95 duration-300">
                    <AlertCircle className="h-4 w-4"/>
                    <AlertDescription className="ml-2">{error}</AlertDescription>
                </Alert>
            )}
        </div>
    )
}