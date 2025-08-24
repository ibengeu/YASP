"use client"

import React, { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/components/ui/tabs.tsx"
import { Textarea } from "@/core/components/ui/textarea.tsx"
import { Alert, AlertDescription } from "@/core/components/ui/alert.tsx"
import { AlertCircle, Upload, CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/core/components/ui/button.tsx"
import { Input } from "@/core/components/ui/input.tsx"
import { OpenApiDocument } from "@/common/openapi-spec.ts"
import { OpenAPISpecSchema, FileImportSchema, URLImportSchema, PasteContentSchema } from "@/core/validation/schemas.ts"
import { toast } from "sonner"

interface ImportSpecProps {
    onSpecLoaded: (spec: OpenApiDocument) => void;
}

interface ValidationError {
    field: string;
    message: string;
}

export function ImportSpec({ onSpecLoaded }: ImportSpecProps) {
    const [pasteContent, setPasteContent] = useState("")
    const [urlInput, setUrlInput] = useState("")
    const [fileError, setFileError] = useState<string | null>(null)
    const [pasteError, setPasteError] = useState<string | null>(null)
    const [urlError, setUrlError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState<{ file: boolean; paste: boolean; url: boolean }>({
        file: false,
        paste: false,
        url: false
    })
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])

    const validateOpenAPISpec = (spec: unknown): OpenApiDocument => {
        const result = OpenAPISpecSchema.safeParse(spec)
        if (!result.success) {
            const errors = result.error.errors.map(err => ({
                field: err.path.join('.') || 'root',
                message: err.message
            }))
            setValidationErrors(errors)
            throw new Error(`Validation failed: ${errors[0]?.message || 'Invalid specification'}`)
        }
        setValidationErrors([])
        return result.data as OpenApiDocument
    }

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setIsLoading(prev => ({ ...prev, file: true }))
        setFileError(null)

        try {
            // Validate file before processing
            const fileValidation = FileImportSchema.safeParse({ file })
            if (!fileValidation.success) {
                throw new Error(fileValidation.error.errors[0]?.message || 'Invalid file')
            }

            const content = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = (e) => resolve(e.target?.result as string)
                reader.onerror = () => reject(new Error('Failed to read file'))
                reader.readAsText(file)
            })

            let parsedSpec: unknown
            try {
                // Try JSON first
                parsedSpec = JSON.parse(content)
            } catch {
                // If JSON fails, try YAML (would need yaml library)
                throw new Error('Failed to parse file. Ensure it\'s valid JSON format.')
            }

            const validatedSpec = validateOpenAPISpec(parsedSpec)
            toast.success('OpenAPI specification imported successfully!')
            onSpecLoaded(validatedSpec)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to import file'
            setFileError(message)
            toast.error(message)
        } finally {
            setIsLoading(prev => ({ ...prev, file: false }))
        }
    }

    const handlePasteSubmit = async () => {
        setIsLoading(prev => ({ ...prev, paste: true }))
        setPasteError(null)

        try {
            // Validate content before processing
            const contentValidation = PasteContentSchema.safeParse({ content: pasteContent })
            if (!contentValidation.success) {
                throw new Error(contentValidation.error.errors[0]?.message || 'Invalid content')
            }

            let parsedSpec: unknown
            try {
                parsedSpec = JSON.parse(pasteContent)
            } catch {
                throw new Error('Failed to parse JSON content. Please check the format.')
            }

            const validatedSpec = validateOpenAPISpec(parsedSpec)
            toast.success('OpenAPI specification loaded successfully!')
            onSpecLoaded(validatedSpec)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to load content'
            setPasteError(message)
            toast.error(message)
        } finally {
            setIsLoading(prev => ({ ...prev, paste: false }))
        }
    }

    const handlePasteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setPasteContent(e.target.value)
        // Clear previous errors when user starts typing
        if (pasteError) {
            setPasteError(null)
        }
    }

    const handlePasteEvent = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        // Auto-load specification when pasting content
        setTimeout(async () => {
            const content = e.clipboardData.getData('text')
            if (content.trim()) {
                try {
                    const spec = JSON.parse(content)
                    if (spec.openapi && spec.info && spec.paths) {
                        onSpecLoaded(spec)
                    }
                } catch {
                    // Don't show error on paste - user can still manually load
                }
            }
        }, 100)
    }

    const handleUrlSubmit = async () => {
        setIsLoading(prev => ({ ...prev, url: true }))
        setUrlError(null)

        try {
            // Validate URL before processing
            const urlValidation = URLImportSchema.safeParse({ url: urlInput })
            if (!urlValidation.success) {
                throw new Error(urlValidation.error.errors[0]?.message || 'Invalid URL')
            }

            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

            const response = await fetch(urlInput, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json, application/x-yaml, text/yaml',
                    'User-Agent': 'YASP-OpenAPI-Importer/1.0'
                },
                mode: 'cors',
                cache: 'no-cache'
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
                throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
            }

            const contentType = response.headers.get('content-type') || ''
            const text = await response.text()

            let parsedSpec: unknown
            try {
                parsedSpec = JSON.parse(text)
            } catch {
                throw new Error('Response is not valid JSON format')
            }

            const validatedSpec = validateOpenAPISpec(parsedSpec)
            toast.success('OpenAPI specification imported from URL successfully!')
            onSpecLoaded(validatedSpec)
        } catch (error) {
            let message = 'Failed to fetch or parse from URL'
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    message = 'Request timeout. Please try again.'
                } else {
                    message = error.message
                }
            }
            setUrlError(message)
            toast.error(message)
        } finally {
            setIsLoading(prev => ({ ...prev, url: false }))
        }
    }

    return (
        <Tabs defaultValue="file" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="file">File Upload</TabsTrigger>
                <TabsTrigger value="paste">Paste JSON</TabsTrigger>
                <TabsTrigger value="url">From URL</TabsTrigger>
            </TabsList>
            <TabsContent value="file" className="py-4 space-y-4">
                <div
                    className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 transition-colors bg-background">
                    <Upload className="h-12 w-12 text-muted-foreground mb-4"/>
                    <Button variant="secondary" className="relative" disabled={isLoading.file}>
                        {isLoading.file ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            'Select OpenAPI File'
                        )}
                        <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            accept="application/json,.json,.yaml,.yml"
                            onChange={handleFileUpload}
                            aria-label="Upload OpenAPI specification file"
                            disabled={isLoading.file}
                        />
                    </Button>
                </div>
                {fileError && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4"/>
                        <AlertDescription className="ml-2">{fileError}</AlertDescription>
                    </Alert>
                )}
            </TabsContent>
            <TabsContent value="paste" className="py-4 space-y-4">
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Paste your OpenAPI 3.x JSON content directly. The specification will load automatically when you paste.</p>
                    <Textarea
                        placeholder="Paste OpenAPI JSON here..."
                        value={pasteContent}
                        onChange={handlePasteChange}
                        onPaste={handlePasteEvent}
                        className="min-h-[200px] max-h-[200px] resize-none overflow-y-auto"
                    />
                </div>
                <Button onClick={handlePasteSubmit} className="w-full" disabled={isLoading.paste || !pasteContent.trim()}>
                    {isLoading.paste ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        'Load Specification'
                    )}
                </Button>
                {pasteError && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4"/>
                        <AlertDescription className="ml-2">{pasteError}</AlertDescription>
                    </Alert>
                )}
            </TabsContent>
            <TabsContent value="url" className="py-4 space-y-4">
                <Input
                    placeholder="e.g., https://petstore.swagger.io/v2/swagger.json"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                />
                <Button onClick={handleUrlSubmit} className="w-full" disabled={isLoading.url || !urlInput.trim()}>
                    {isLoading.url ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Fetching...
                        </>
                    ) : (
                        'Load from URL'
                    )}
                </Button>
                {urlError && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4"/>
                        <AlertDescription className="ml-2">{urlError}</AlertDescription>
                    </Alert>
                )}
                {validationErrors.length > 0 && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="ml-2">
                            <div className="space-y-1">
                                <div className="font-medium">Validation Errors:</div>
                                {validationErrors.slice(0, 5).map((error, index) => (
                                    <div key={index} className="text-sm">
                                        <strong>{error.field}:</strong> {error.message}
                                    </div>
                                ))}
                                {validationErrors.length > 5 && (
                                    <div className="text-sm text-muted-foreground">
                                        ...and {validationErrors.length - 5} more errors
                                    </div>
                                )}
                            </div>
                        </AlertDescription>
                    </Alert>
                )}
            </TabsContent>
        </Tabs>
    )
}
