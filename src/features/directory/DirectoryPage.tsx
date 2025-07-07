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
import {Plus, Search, ArrowLeft} from "lucide-react";

import {Button} from "@/core/components/ui/button.tsx"
import {IndexedDBService} from "@/core/services/indexdbservice.ts";
import {OpenApiDocument} from "@/common/openapi-spec.ts"
import {useNavigate} from "react-router";

// New modern components
import {SpecCard} from "./components/SpecCard";
import {SettingsPanel} from "./components/SettingsPanel";
import {AdvancedControls} from "./components/AdvancedControls";
import {ImportSpec} from "./components/ImportSpec";

interface Spec {
    id: string | number;
    title: string;
    version: string;
    description?: string;
    createdAt: string | number | Date;
    spec?: OpenApiDocument;
    workspaceType?: 'Personal' | 'Team' | 'Partner' | 'Public';
    syncStatus?: 'synced' | 'syncing' | 'offline';
    tags?: string[];
    isDiscoverable?: boolean;
}

export function DirectoryPage() {
    const navigate = useNavigate()
    const [specs, setSpecs] = useState<Spec[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [sortBy, setSortBy] = useState("recent")
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedSpecId, setSelectedSpecId] = useState<string | number | null>(null)
    const dbService = React.useMemo(() => new IndexedDBService(), []);

    const loadSpecs = useCallback(async () => {
        setIsLoading(true)
        try {
            const allSpecs = await dbService.getAllSpecs()
            // Add default values for new properties
            const specsWithDefaults = allSpecs.map(spec => ({
                ...spec,
                workspaceType: spec.workspaceType || 'Personal',
                syncStatus: spec.syncStatus || 'synced',
                tags: spec.tags || [],
                isDiscoverable: spec.isDiscoverable || false
            })) as Spec[]
            setSpecs(specsWithDefaults)
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
                (spec.description?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                (spec.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())),
        )
        .sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.title.localeCompare(b.title)
                case 'recent':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                case 'version':
                    return b.version.localeCompare(a.version)
                default:
                    return 0
            }
        })

    // Check if spec was added recently (within last 7 days)
    const isRecentlyAdded = (date: string | number | Date) => {
        const now = new Date()
        const createdDate = new Date(date)
        const diffInDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
        return diffInDays <= 7
    }

    const handleSettingsClick = (specId: string | number) => {
        setSelectedSpecId(specId)
    }

    const handleSettingsChange = async (specId: string | number, newSettings: any) => {
        try {
            // Update in database
            await dbService.updateSpec(specId, newSettings)
            
            // Update local state
            setSpecs(prevSpecs => 
                prevSpecs.map(spec => 
                    spec.id === specId 
                        ? { ...spec, ...newSettings }
                        : spec
                )
            )
        } catch (error) {
            console.error('Error updating spec settings:', error)
        }
    }

    const selectedSpec = specs.find(spec => spec.id === selectedSpecId)

    const handleSpecLoadedFromModal = async (loadedSpec: OpenApiDocument) => {
        await handleSpecLoaded(loadedSpec)
        setIsModalOpen(false)
    }

    return (
        <div className="min-h-screen ">
            {/* Header */}
            <div className="bg-card shadow-sm border-b border-border">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate("/")}
                                className="p-2 hover:bg-muted"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                            <div>
                                <h1 className="text-xl font-bold text-foreground mb-2">
                                    API Specifications
                                </h1>
                                <p className="text-muted-foreground">
                                    Manage your API collections, environments, and collaborative workspaces
                                </p>
                            </div>
                        </div>
                        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                            <DialogTrigger asChild>
                                <Button 
                                    onClick={() => setIsModalOpen(true)}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
                                >
                                    <Plus className="w-5 h-5 mr-2" />
                                    Add New Spec
                                </Button>
                            </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
                        <DialogHeader className="flex-shrink-0">
                            <DialogTitle>Add New OpenAPI Specification</DialogTitle>
                            <DialogDescription>
                                Choose how you want to add your OpenAPI 3.x JSON specification.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto">
                            <ImportSpec onSpecLoaded={handleSpecLoadedFromModal} />
                        </div>
                    </DialogContent>
                </Dialog>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-6">
                {/* Controls */}
                <AdvancedControls
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                />

          

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <>
                        {filteredAndSortedSpecs.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pr-6">
                                {filteredAndSortedSpecs.map((spec) => (
                                    <SpecCard
                                        key={spec.id}
                                        id={spec.id}
                                        title={spec.title}
                                        version={spec.version}
                                        description={spec.description}
                                        createdAt={spec.createdAt}
                                        workspaceType={spec.workspaceType}
                                        syncStatus={spec.syncStatus}
                                        tags={spec.tags}
                                        isDiscoverable={spec.isDiscoverable}
                                        isRecentlyAdded={isRecentlyAdded(spec.createdAt)}
                                        onClick={() => navigate(`/spec/${spec.id}`)}
                                        onSettingsClick={handleSettingsClick}
                                        onDeleteClick={(specId) => handleRemoveSpec(new MouseEvent('click') as any, specId)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                {searchTerm ? (
                                    <div className="space-y-4">
                                        <div className="text-muted-foreground mb-4">
                                            <Search className="w-16 h-16 mx-auto mb-4" />
                                        </div>
                                        <h3 className="text-lg font-medium text-foreground mb-2">
                                            No specifications found
                                        </h3>
                                        <p className="text-muted-foreground mb-6">
                                            Try adjusting your search terms or add a new specification.
                                        </p>
                                        <Button onClick={() => setSearchTerm("")} variant="outline">
                                            Clear Search
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="text-muted-foreground mb-4">
                                            <Search className="w-16 h-16 mx-auto mb-4" />
                                        </div>
                                        <h3 className="text-lg font-medium text-foreground mb-2">
                                            No API specifications found
                                        </h3>
                                        <p className="text-muted-foreground mb-6">
                                            Upload your first OpenAPI specification to get started with the API Collection tool
                                        </p>
                                        <Button onClick={() => setIsModalOpen(true)}>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add New Spec
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            
            {/* Settings Panel */}
            {selectedSpec && (
                <SettingsPanel
                    isOpen={!!selectedSpecId}
                    onClose={() => setSelectedSpecId(null)}
                    specId={selectedSpecId!}
                    currentSettings={{
                        title: selectedSpec.title,
                        workspaceType: selectedSpec.workspaceType || 'Personal',
                        tags: selectedSpec.tags || [],
                        isDiscoverable: selectedSpec.isDiscoverable || false
                    }}
                    onSettingsChange={handleSettingsChange}
                />
            )}
            </div>
        </div>
    )
}