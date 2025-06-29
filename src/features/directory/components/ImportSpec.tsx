"use client"

import React, { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/components/ui/tabs.tsx"
import { Textarea } from "@/core/components/ui/textarea.tsx"
import { Alert, AlertDescription } from "@/core/components/ui/alert.tsx"
import { AlertCircle, Upload } from "lucide-react"
import { Button } from "@/core/components/ui/button.tsx"
import { Input } from "@/core/components/ui/input.tsx"
import { OpenApiDocument } from "@/common/openapi-spec.ts"

interface ImportSpecProps {
    onSpecLoaded: (spec: OpenApiDocument) => void;
}

export function ImportSpec({ onSpecLoaded }: ImportSpecProps) {
    const [pasteContent, setPasteContent] = useState("")
    const [urlInput, setUrlInput] = useState("")
    const [fileError, setFileError] = useState<string | null>(null)
    const [pasteError, setPasteError] = useState<string | null>(null)
    const [urlError, setUrlError] = useState<string | null>(null)

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = async (e) => {
            try {
                const content = e.target?.result as string
                const spec = JSON.parse(content)
                if (spec.openapi && spec.info && spec.paths) {
                    onSpecLoaded(spec)
                } else {
                    setFileError("Invalid OpenAPI 3.x JSON file.")
                }
            } catch {
                setFileError("Failed to parse JSON file.")
            }
        }
        reader.readAsText(file)
    }

    const handlePasteSubmit = async () => {
        try {
            const spec = JSON.parse(pasteContent)
            if (spec.openapi && spec.info && spec.paths) {
                onSpecLoaded(spec)
            } else {
                setPasteError("Invalid OpenAPI 3.x JSON content.")
            }
        } catch {
            setPasteError("Failed to parse JSON content.")
        }
    }

    const handleUrlSubmit = async () => {
        try {
            const response = await fetch(urlInput)
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            const spec = await response.json()
            if (spec.openapi && spec.info && spec.paths) {
                onSpecLoaded(spec)
            } else {
                setUrlError("Invalid OpenAPI 3.x JSON from URL.")
            }
        } catch (e) {
            console.error(e)
            setUrlError("Failed to fetch or parse from URL.")
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
                    <Button variant="secondary" className="relative">
                        Select OpenAPI File
                        <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            accept="application/json,.json"
                            onChange={handleFileUpload}
                            aria-label="Upload OpenAPI specification file"
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
                <Textarea
                    placeholder="Paste OpenAPI JSON here..."
                    rows={6}
                    value={pasteContent}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPasteContent(e.target.value)}
                />
                <Button onClick={handlePasteSubmit} className="w-full">Load Specification</Button>
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
                <Button onClick={handleUrlSubmit} className="w-full">Load from URL</Button>
                {urlError && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4"/>
                        <AlertDescription className="ml-2">{urlError}</AlertDescription>
                    </Alert>
                )}
            </TabsContent>
        </Tabs>
    )
}
