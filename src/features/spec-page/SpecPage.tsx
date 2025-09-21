"use client"

import React, {useState, useEffect, useMemo} from "react";
import {Button} from "@/core/components/ui/button";
import {ResizablePanel, ResizablePanelGroup, ResizableHandle} from "@/core/components/ui/resizable.tsx";
import {OperationObject} from "../../common/openapi-spec.ts";
import {Loader2} from "lucide-react";
import {useNavigate, useParams} from "react-router";
import {Sheet, SheetContent} from "@/core/components/ui/sheet";
import useMediaQuery from "@/core/hooks/useMediaQuery.ts";
import {TopBar} from "./components/top-bar.tsx";
import TryItOut from "./components/try-it-out.tsx";
import {useSpec} from "./hooks/useSpec.ts";
import {CodeEditor} from "@/core/components/ui/code-editor";
import {Card} from "@/core/components/ui/card.tsx";
import {IndexedDBService} from "@/core/services/indexdbservice.ts";
import {OpenApiDocument} from "@/common/openapi-spec.ts";
import {EndpointsList} from "./components/endpoints-list";
import {EndpointDetail} from "./components/endpoint-detail";


export const SpecPage: React.FC = () => {
    const {id} = useParams<{ id: string }>();
    const navigate = useNavigate();
    const {spec, isLoading, error, retry} = useSpec(id);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [selectedEndpoint, setSelectedEndpoint] = useState<{
        path: string;
        method: string;
        operation: OperationObject;
    } | null>(null);
    const [isEditorMode, setIsEditorMode] = useState(false);
    const [editorContent, setEditorContent] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const dbService = useMemo(() => new IndexedDBService(), []);

    const isTablet = useMediaQuery("(min-width: 768px)");

    // Extract endpoints from spec
    const endpoints = useMemo(() => {
        if (!spec?.paths) return [];

        const extractedEndpoints: any[] = [];
        Object.entries(spec.paths).forEach(([path, pathItem]) => {
            if (!pathItem) return;
            Object.entries(pathItem).forEach(([method, operation]) => {
                if (operation && typeof operation === 'object' && 'responses' in operation) {
                    const tags = operation.tags || ['default'];
                    tags.forEach((tag: string) => {
                        extractedEndpoints.push({
                            path,
                            method,
                            operation,
                            tag
                        });
                    });
                }
            });
        });
        return extractedEndpoints;
    }, [spec]);

    useEffect(() => {
        // If screen size changes, re-select first endpoint if available
        if (endpoints.length > 0 && !isEditorMode) {
            setSelectedEndpoint(endpoints[0]);
        } else {
            setSelectedEndpoint(null);
        }
    }, [isTablet, endpoints, isEditorMode]);


    useEffect(() => {
        // Initialize editor content when spec loads
        if (spec) {
            const specJson = JSON.stringify(spec, null, 2);
            setEditorContent(specJson);
            setHasUnsavedChanges(false);
        }
    }, [spec]);

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    const toggleEditorMode = () => {
        const newEditorMode = !isEditorMode;
        setIsEditorMode(newEditorMode);

        // When switching back from editor mode, auto-select first endpoint
        if (!newEditorMode && endpoints.length > 0) {
            setSelectedEndpoint(endpoints[0]);
        } else {
            setSelectedEndpoint(null);
        }
    };

    const handleEditorChange = (value: string | undefined) => {
        if (value !== undefined) {
            setEditorContent(value);
            setHasUnsavedChanges(true);
        }
    };

    const handleSaveSpec = async () => {
        if (!id) return;
        
        setIsSaving(true);
        try {
            const parsedSpec = JSON.parse(editorContent) as OpenApiDocument;
            
            // Basic validation
            if (!parsedSpec.openapi || !parsedSpec.info || !parsedSpec.paths) {
                throw new Error("Invalid OpenAPI specification format");
            }
            
            await dbService.updateSpecContent(Number(id), parsedSpec);
            setHasUnsavedChanges(false);
            await retry(); // Refresh the spec data
        } catch (error) {
            console.error("Error saving spec:", error);
            alert("Failed to save specification. Please check the JSON format.");
        } finally {
            setIsSaving(false);
        }
    };


    if (error) {
        return (
            <div className="flex flex-col h-screen">
                <TopBar 
                    title="API Documentation" 
                    isMobileMenuOpen={isMobileMenuOpen}
                    toggleMobileMenu={toggleMobileMenu} 
                    currentSpec={spec}
                />
                <div className="container mx-auto py-6 text-center flex-1">
                    <p className="text-destructive mb-4">{error}</p>

                    <Button onClick={() => navigate("/specs")} variant="outline">
                        Back to Specs
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen ">
            <TopBar 
                title="API Documentation" 
                isMobileMenuOpen={isMobileMenuOpen} 
                toggleMobileMenu={toggleMobileMenu} 
                currentSpec={spec}
                isEditorMode={isEditorMode}
                onToggleEditorMode={toggleEditorMode}
                hasUnsavedChanges={hasUnsavedChanges}
                onSave={handleSaveSpec}
                isSaving={isSaving}
            />

            <main className="flex-1 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading specification"/>
                    </div>
                ) : spec ? (
                    <>
                        {isEditorMode ? (
                            <div className="h-full p-4">
                                <Card className="h-full flex flex-col">
                                    {editorContent ? (
                                        <CodeEditor
                                            value={editorContent}
                                            onChange={handleEditorChange}
                                            language="json"
                                            height="100%"
                                            className="flex-1 min-h-0"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <div className="text-center">
                                                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                                                <p className="text-muted-foreground">Loading editor content...</p>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            </div>
                        ) : (
                            <ResizablePanelGroup direction="horizontal" className="flex-1">
                                {/* Endpoints List */}
                                <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
                                    <EndpointsList
                                        endpoints={endpoints}
                                        selectedEndpoint={selectedEndpoint}
                                        onEndpointSelect={setSelectedEndpoint}
                                    />
                                </ResizablePanel>

                                <ResizableHandle />

                                {/* Documentation */}
                                <ResizablePanel defaultSize={40} minSize={30}>
                                    {selectedEndpoint ? (
                                        <EndpointDetail
                                            path={selectedEndpoint.path}
                                            method={selectedEndpoint.method}
                                            operation={selectedEndpoint.operation}
                                            components={spec.components || {}}
                                        />
                                    ) : (
                                        <div className="h-full flex items-center justify-center">
                                            <div className="text-center text-muted-foreground">
                                                <p>Select an endpoint to view documentation</p>
                                            </div>
                                        </div>
                                    )}
                                </ResizablePanel>

                                <ResizableHandle />

                                {/* Try It Out */}
                                <ResizablePanel defaultSize={35} minSize={30}>
                                    {selectedEndpoint ? (
                                        <TryItOut
                                            path={selectedEndpoint.path}
                                            method={selectedEndpoint.method}
                                            operation={selectedEndpoint.operation}
                                            components={spec.components || {}}
                                        />
                                    ) : (
                                        <div className="h-full flex items-center justify-center">
                                            <div className="text-center text-muted-foreground">
                                                <p>Select an endpoint to try it out</p>
                                            </div>
                                        </div>
                                    )}
                                </ResizablePanel>
                            </ResizablePanelGroup>
                        )}

                        {!isTablet && selectedEndpoint && !isEditorMode && (
                            <Sheet open={!!selectedEndpoint} onOpenChange={() => setSelectedEndpoint(null)}>
                                <SheetContent side="bottom" className="h-[80vh] p-0">
                                    <TryItOut
                                        path={selectedEndpoint.path}
                                        method={selectedEndpoint.method}
                                        operation={selectedEndpoint.operation}
                                        components={spec.components || {}}
                                    />
                                </SheetContent>
                            </Sheet>
                        )}
                    </>
                ) : null}
            </main>
        </div>
    )
}