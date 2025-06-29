"use client"

import React, {useCallback, useEffect, useState} from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/core/components/ui/dialog";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/core/components/ui/tabs.tsx";
import {Textarea} from "@/core/components/ui/textarea.tsx";
import {Alert, AlertDescription} from "@/core/components/ui/alert.tsx";
import {AlertCircle, Upload} from "lucide-react";

import {Card, CardDescription, CardHeader, CardTitle} from "@/core/components/ui/card.tsx"
import {Button} from "@/core/components/ui/button.tsx"
import {Download, FileJson, Plus, Search, SortAsc, Tag, Trash2} from "lucide-react"
import {Input} from "@/core/components/ui/input.tsx"
import {cn} from "@/core/lib/utils.ts"
import {IndexedDBService} from "@/core/services/indexdbservice.ts";

import {Badge} from "@/core/components/ui/badge.tsx";
import {OpenApiDocument} from "@/common/openapi-spec.ts"
import {useNavigate} from "react-router";

interface Spec {
    id: string | number;
    title: string;
    version: string;
    description?: string;
    createdAt: string | number | Date;
    spec?: OpenApiDocument;
}

export function DirectoryPage() {
    const navigate = useNavigate()
    const [specs, setSpecs] = useState<Spec[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [pasteContent, setPasteContent] = useState("")
    const [urlInput, setUrlInput] = useState("")
    const [fileError, setFileError] = useState<string | null>(null)
    const [pasteError, setPasteError] = useState<string | null>(null)
    const [urlError, setUrlError] = useState<string | null>(null)
    const dbService = React.useMemo(() => new IndexedDBService(), []);

    const loadSpecs = useCallback(async () => {
        setIsLoading(true)
        try {
            const allSpecs = await dbService.getAllSpecs()
            setSpecs(allSpecs as unknown as Spec[])
        } catch (error) {
            console.error("Error loading specs:", error)
        } finally {
            setIsLoading(false)
        }
    }, [dbService])

    useEffect(() => {
        loadSpecs()
    }, [loadSpecs])

    const handleSpecLoaded = async (loadedSpec: OpenApiDocument) => {
        try {
            const id = await dbService.saveSpec(loadedSpec)
            navigate(`/spec/${id}`)
        } catch (error) {
            console.error("Error saving spec:", error)
        }
    }

    const handleRemoveSpec = async (event: React.MouseEvent, specId: string | number) => {
        event.stopPropagation()
        if (window.confirm("Are you sure you want to remove this specification?")) {
            await dbService.deleteSpec(specId)
            await loadSpecs()
        }
    }

    const filteredAndSortedSpecs = specs
        .filter(
            (spec) =>
                spec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (spec.description?.toLowerCase() || "").includes(searchTerm.toLowerCase()),
        )
        .sort((a, b) => a.title.localeCompare(b.title))

    const groupedSpecs: Record<string, Spec[]> = filteredAndSortedSpecs.reduce(
        (acc, spec) => {
            const firstLetter = spec.title[0].toUpperCase()
            if (!acc[firstLetter]) acc[firstLetter] = []
            acc[firstLetter].push(spec)
            return acc
        },
        {} as Record<string, Spec[]>,
    )

    const getTimeAgo = (date: string | number | Date) => {
        const now = new Date()
        const createdDate = new Date(date)
        const diffInDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))

        if (diffInDays === 0) return "Today"
        if (diffInDays === 1) return "Yesterday"
        if (diffInDays < 7) return `${diffInDays} days ago`
        if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
        return `${Math.floor(diffInDays / 30)} months ago`
    }

    // Check if spec was added recently (within last 7 days)
    const isRecentlyAdded = (date: string | number | Date) => {
        const now = new Date()
        const createdDate = new Date(date)
        const diffInDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
        return diffInDays <= 7
    }

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = async (e) => {
            try {
                const content = e.target?.result as string
                const spec = JSON.parse(content)
                // Basic validation
                if (spec.openapi && spec.info && spec.paths) {
                    await handleSpecLoaded(spec)
                    setIsModalOpen(false)
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
                await handleSpecLoaded(spec)
                setIsModalOpen(false)
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
                await handleSpecLoaded(spec)
                setIsModalOpen(false)
            } else {
                setUrlError("Invalid OpenAPI 3.x JSON from URL.")
            }
        } catch {
            setUrlError("Failed to fetch or parse from URL.")
        }
    }

    return (
        <div className="container mx-auto py-6 px-4 md:px-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight mb-1">API Specifications</h1>
                    <p className="text-muted-foreground">Manage and explore your OpenAPI collections</p>
                </div>
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 self-start" onClick={() => setIsModalOpen(true)} size="default">
                            <Plus className="h-4 w-4"/>
                            Add New Spec
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Add New OpenAPI Specification</DialogTitle>
                            <DialogDescription>
                                Choose how you want to add your OpenAPI 3.x JSON specification.
                            </DialogDescription>
                        </DialogHeader>
                        <Tabs defaultValue="file" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="file">File Upload</TabsTrigger>
                                <TabsTrigger value="paste">Paste JSON</TabsTrigger>
                                <TabsTrigger value="url">From URL</TabsTrigger>
                            </TabsList>
                            <TabsContent value="file" className="py-4 space-y-4">
                                <p className="text-sm text-muted-foreground">Upload an OpenAPI 3.x JSON file from your
                                    computer.</p>
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
                                <p className="text-sm text-muted-foreground">Paste your OpenAPI 3.x JSON content
                                    directly.</p>
                                <Textarea
                                    placeholder="Paste OpenAPI JSON here..."
                                    rows={10}
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
                                <p className="text-sm text-muted-foreground">Enter a URL to fetch an OpenAPI 3.x JSON
                                    specification.</p>
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
                    </DialogContent>
                </Dialog>
            </div>

            <div className="relative mb-8">
                <div
                    className="flex items-center border rounded-md bg-background pl-3 focus-within:ring-1 focus-within:ring-ring">
                    <Search className="h-4 w-4 text-muted-foreground"/>
                    <Input
                        placeholder="Search by title or description..."
                        className="border-0 focus-visible:ring-0 pl-2"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="mt-2 flex items-center text-xs text-muted-foreground">
                    <SortAsc className="h-3 w-3 mr-1"/>
                    <span>Sorted alphabetically by title</span>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <>
                    {Object.keys(groupedSpecs).length > 0 ? (
                        <div className="space-y-10">
                            {Object.entries(groupedSpecs).map(([letter, letterSpecs]) => (
                                <div key={letter} className="relative">
                                    <div
                                        className="sticky top-16 z-10 bg-background/95 backdrop-blur-sm border-b py-2 mb-4 flex items-center">
                                        <div
                                            className="flex items-center justify-center bg-primary/10 rounded-full w-8 h-8 mr-2">
                                            <span className="font-semibold text-primary">{letter}</span>
                                        </div>
                                        <h2 className="text-lg font-medium">
                                            {letterSpecs.length} Specification{letterSpecs.length !== 1 ? "s" : ""}
                                        </h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {letterSpecs.map((spec) => (
                                            <Card
                                                key={spec.id}
                                                className="hover:shadow-md transition-all duration-200 cursor-pointer group border-2 hover:border-primary/20"
                                                onClick={() => navigate(`/spec/${spec.id}`)}
                                            >
                                                <CardHeader>
                                                    <div className="flex justify-between items-start gap-2">
                                                        <div className="flex items-start gap-3">
                                                            <div className="mt-1 bg-primary/10 rounded-md p-1.5">
                                                                <FileJson className="h-4 w-4 text-primary"/>
                                                            </div>
                                                            <div className="flex-1">
                                                                <CardTitle
                                                                    className="flex flex-wrap items-center gap-2">
                                                                    <span className="truncate">{spec.title}</span>
                                                                    {isRecentlyAdded(spec.createdAt) && (
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="text-xs bg-primary/10 text-primary border-primary/20"
                                                                        >
                                                                            New
                                                                        </Badge>
                                                                    )}
                                                                </CardTitle>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        <Tag
                                                                            className="h-3 w-3 mr-1"/>v{spec.version}
                                                                    </Badge>
                                                                    <span
                                                                        className="text-xs text-muted-foreground">{getTimeAgo(spec.createdAt)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div
                                                            className={cn(
                                                                "flex items-center gap-1 shrink-0 transition-opacity duration-200",
                                                                "opacity-0 group-hover:opacity-100",
                                                            )}
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                                onClick={(e) => handleRemoveSpec(e, spec.id)}
                                                                aria-label="Remove specification"
                                                            >
                                                                <Trash2 className="h-4 w-4"/>
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    // TODO: Implement download functionality
                                                                    // downloadSpec(spec, `${spec.title}-${spec.version}.json`)
                                                                }}
                                                                aria-label="Download specification"
                                                            >
                                                                <Download className="h-4 w-4"/>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    {spec.description && (
                                                        <CardDescription
                                                            className="mt-3 line-clamp-2">{spec.description}</CardDescription>
                                                    )}
                                                </CardHeader>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-muted border rounded-lg py-12 px-4 text-center">
                            {searchTerm ? (
                                <div className="space-y-2">
                                    <Search className="h-10 w-10 text-muted-foreground mx-auto"/>
                                    <h3 className="text-lg font-medium">No matching specifications found</h3>
                                    <p className="text-muted-foreground">
                                        Try adjusting your search query or
                                        <br/>
                                        <Button variant="link" className="p-0 h-auto"
                                                onClick={() => setSearchTerm("")}>
                                            clear your search
                                        </Button>
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <FileJson className="h-12 w-12 text-muted-foreground mx-auto"/>
                                    <h3 className="text-lg font-medium">No API specifications found</h3>
                                    <p className="text-muted-foreground max-w-md mx-auto">
                                        Upload your first OpenAPI specification to get started with the API Collection
                                        tool
                                    </p>
                                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                                        <DialogTrigger asChild>
                                            <Button className="gap-2" onClick={() => setIsModalOpen(true)}
                                                    size="default">
                                                <Plus className="h-4 w-4"/>
                                                Add New Spec
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[600px]">
                                            <DialogHeader>
                                                <DialogTitle>Add New OpenAPI Specification</DialogTitle>
                                                <DialogDescription>
                                                    Choose how you want to add your OpenAPI 3.x JSON specification.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <Tabs defaultValue="file" className="w-full">
                                                <TabsList className="grid w-full grid-cols-3">
                                                    <TabsTrigger value="file">File Upload</TabsTrigger>
                                                    <TabsTrigger value="paste">Paste JSON</TabsTrigger>
                                                    <TabsTrigger value="url">From URL</TabsTrigger>
                                                </TabsList>
                                                <TabsContent value="file" className="py-4 space-y-4">
                                                    <p className="text-sm text-muted-foreground">Upload an OpenAPI 3.x
                                                        JSON file from your computer.</p>
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
                                                            <AlertDescription
                                                                className="ml-2">{fileError}</AlertDescription>
                                                        </Alert>
                                                    )}
                                                </TabsContent>
                                                <TabsContent value="paste" className="py-4 space-y-4">
                                                    <p className="text-sm text-muted-foreground">Paste your OpenAPI 3.x
                                                        JSON content directly.</p>
                                                    <Textarea
                                                        placeholder="Paste OpenAPI JSON here..."
                                                        rows={10}
                                                        value={pasteContent}
                                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPasteContent(e.target.value)}
                                                    />
                                                    <Button onClick={handlePasteSubmit} className="w-full">Load
                                                        Specification</Button>
                                                    {pasteError && (
                                                        <Alert variant="destructive">
                                                            <AlertCircle className="h-4 w-4"/>
                                                            <AlertDescription
                                                                className="ml-2">{pasteError}</AlertDescription>
                                                        </Alert>
                                                    )}
                                                </TabsContent>
                                                <TabsContent value="url" className="py-4 space-y-4">
                                                    <p className="text-sm text-muted-foreground">Enter a URL to fetch an
                                                        OpenAPI 3.x JSON specification.</p>
                                                    <Input
                                                        placeholder="e.g., https://petstore.swagger.io/v2/swagger.json"
                                                        value={urlInput}
                                                        onChange={(e) => setUrlInput(e.target.value)}
                                                    />
                                                    <Button onClick={handleUrlSubmit} className="w-full">Load from
                                                        URL</Button>
                                                    {urlError && (
                                                        <Alert variant="destructive">
                                                            <AlertCircle className="h-4 w-4"/>
                                                            <AlertDescription
                                                                className="ml-2">{urlError}</AlertDescription>
                                                        </Alert>
                                                    )}
                                                </TabsContent>
                                            </Tabs>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Floating Button for Mobile */}
            {Object.keys(groupedSpecs).length > 5 && (
                <div className="fixed right-4 bottom-4 md:hidden">
                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-12 w-12 rounded-full shadow-md" size="icon">
                                <Plus className="h-5 w-5"/>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>Add New OpenAPI Specification</DialogTitle>
                                <DialogDescription>
                                    Choose how you want to add your OpenAPI 3.x JSON specification.
                                </DialogDescription>
                            </DialogHeader>
                            <Tabs defaultValue="file" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="file">File Upload</TabsTrigger>
                                    <TabsTrigger value="paste">Paste JSON</TabsTrigger>
                                    <TabsTrigger value="url">From URL</TabsTrigger>
                                </TabsList>
                                <TabsContent value="file" className="py-4 space-y-4">
                                    <p className="text-sm text-muted-foreground">Upload an OpenAPI 3.x JSON file from
                                        your computer.</p>
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
                                    <p className="text-sm text-muted-foreground">Paste your OpenAPI 3.x JSON content
                                        directly.</p>
                                    <Textarea
                                        placeholder="Paste OpenAPI JSON here..."
                                        rows={10}
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
                                    <p className="text-sm text-muted-foreground">Enter a URL to fetch an OpenAPI 3.x
                                        JSON specification.</p>
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
                        </DialogContent>
                    </Dialog>
                </div>
            )}
        </div>
    )
}
