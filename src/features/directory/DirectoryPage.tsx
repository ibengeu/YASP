"use client"

import React, {useCallback, useEffect, useState} from "react"
import {ArrowLeft, Package, Plus, Search} from "lucide-react";

import {Button} from "@/core/components/ui/button.tsx"
import {IndexedDBService} from "@/core/services/indexdbservice.ts";
import {OpenApiDocument} from "@/common/openapi-spec.ts"
import {useNavigate} from "react-router";

// New modern components
import {SpecCard} from "./components/SpecCard";
// import {SettingsPanel} from "./components/SettingsPanel"; // Hidden for now
import {ActiveFilters, AdvancedControls, FilterOptions} from "./components/AdvancedControls";
import {AddApiDialog} from "./components/AddApiDialog";
import {ApiCatalogView} from "./components/ApiCatalogView";

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
    lifecycle: 'stable' | 'beta' | 'alpha' | 'deprecated';
    category: string;
    endpoints: number;
    lastUpdated: string;
}

type DirectoryView = 'catalog' | 'list';

export function DirectoryPage() {
    const navigate = useNavigate()
    const [specs, setSpecs] = useState<Spec[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [sortBy, setSortBy] = useState("recent")
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [currentView, setCurrentView] = useState<DirectoryView>('catalog')
    const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
        workspaceTypes: [],
        syncStatuses: [],
        tags: []
    })
    // const [selectedSpecId, setSelectedSpecId] = useState<string | number | null>(null) // Hidden for now
    const dbService = React.useMemo(() => new IndexedDBService(), []);

    const filterOptions: FilterOptions = {
        workspaceTypes: ['Personal', 'Team', 'Partner', 'Public'],
        syncStatuses: ['synced', 'syncing', 'offline'],
        tags: [...new Set(specs.flatMap(spec => spec.tags || []))]
    };

    const loadSpecs = useCallback(async () => {
        setIsLoading(true)
        try {
            const allSpecs = await dbService.getAllSpecs()
            // Add default values for new properties
            const specsWithDefaults = allSpecs.map(spec => {
                // Calculate endpoint count from spec if available
                let endpoints = 0;
                if (spec.spec?.paths) {
                    endpoints = Object.values(spec.spec.paths).reduce((count, pathItem) => {
                        return count + Object.keys(pathItem || {}).filter(key =>
                            ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].includes(key)
                        ).length;
                    }, 0);
                }

                return {
                    ...spec,
                    workspaceType: spec.workspaceType || 'Personal',
                    syncStatus: spec.syncStatus || 'synced',
                    tags: spec.tags || [],
                    isDiscoverable: spec.isDiscoverable || false,
                    lifecycle: 'stable' as const,
                    category: 'API',
                    endpoints: endpoints || 0,
                    lastUpdated: new Date(spec.createdAt || new Date()).toISOString()
                }
            }) as Spec[]
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

    // Settings functionality hidden for now
    // const handleSettingsClick = (specId: string | number) => {
    //     setSelectedSpecId(specId)
    // }

    // const handleSettingsChange = async (specId: string | number, newSettings: any) => {
    //     try {
    //         // Update in database
    //         await dbService.updateSpec(specId, newSettings)
    //         
    //         // Update local state
    //         setSpecs(prevSpecs => 
    //             prevSpecs.map(spec => 
    //                 spec.id === specId 
    //                     ? { ...spec, ...newSettings }
    //                     : spec
    //             )
    //         )
    //     } catch (error) {
    //         console.error('Error updating spec settings:', error)
    //     }
    // }

    // const selectedSpec = specs.find(spec => spec.id === selectedSpecId)


    const handleViewDocumentation = (apiId: string | number) => {
        navigate(`/spec/${apiId}`)
    }

    const handleAddApi = () => {
        console.log('DirectoryPage: Opening Add API dialog');
        setIsModalOpen(true)
    }


    // Transform specs for the catalog view
    const catalogItems = specs.map(spec => ({
        ...spec,
        tags: spec.tags || [],
        isDemo: false // Mark as demo if needed
    }))

    return (
        <>
            {/* Show catalog view */}
            {currentView === 'catalog' ? (
                <ApiCatalogView
                    onViewDocumentation={handleViewDocumentation}
                    onAddApi={handleAddApi}
                    items={catalogItems}
                    loading={isLoading}
                />
            ) : (
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
                                        <ArrowLeft className="w-4 h-4"/>
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
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentView('catalog')}
                                        className="gap-2"
                                    >
                                        <Package className="w-4 h-4"/>
                                        Catalog View
                                    </Button>
                                </div>
                                <Button
                                    onClick={() => setIsModalOpen(true)}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
                                >
                                    <Plus className="w-5 h-5 mr-2"/>
                                    Add New Spec
                                </Button>
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
                            filterOptions={filterOptions}
                            activeFilters={activeFilters}
                            onFiltersChange={setActiveFilters}
                            resultCount={filteredAndSortedSpecs.length}
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
                                                onDeleteClick={(specId) => handleRemoveSpec(new MouseEvent('click') as any, specId)}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        {searchTerm ? (
                                            <div className="space-y-4">
                                                <div className="text-muted-foreground mb-4">
                                                    <Search className="w-16 h-16 mx-auto mb-4"/>
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
                                                    <Search className="w-16 h-16 mx-auto mb-4"/>
                                                </div>
                                                <h3 className="text-lg font-medium text-foreground mb-2">
                                                    No API specifications found
                                                </h3>
                                                <p className="text-muted-foreground mb-6">
                                                    Upload your first OpenAPI specification to get started with the API
                                                    Collection tool
                                                </p>
                                                <Button onClick={() => setIsModalOpen(true)}>
                                                    <Plus className="w-4 h-4 mr-2"/>
                                                    Add New Spec
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}

                        {/* Settings Panel - Hidden for now */}
                    </div>
                </div>
            )}

            {/* Add API Dialog - Always available regardless of view */}
            <AddApiDialog
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
            />
        </>
    )
}