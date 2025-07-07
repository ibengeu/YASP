"use client"

import React, {useState, useEffect, useMemo} from "react";
import {Button} from "@/core/components/ui/button";
import {ResizablePanel, ResizablePanelGroup} from "@/core/components/ui/resizable.tsx";
import {SwaggerUI} from "./components/swagger-ui";
import {OperationObject} from "../../common/openapi-spec.ts";
import {Loader2} from "lucide-react";
import {useNavigate, useParams} from "react-router";
import {Sheet, SheetContent} from "@/core/components/ui/sheet";
import useMediaQuery from "@/core/hooks/useMediaQuery.ts";
import {TopBar} from "./components/top-bar.tsx";
import TryItOut from "./components/try-it-out.tsx";
import {useSpec} from "./hooks/useSpec.ts";
import {Editor, loader} from "@monaco-editor/react";
import {Card} from "@/core/components/ui/card.tsx";
import {Textarea} from "@/core/components/ui/textarea.tsx";
import {IndexedDBService} from "@/core/services/indexdbservice.ts";
import {OpenApiDocument} from "@/common/openapi-spec.ts";

// Configure Monaco loader to use CDN with fallback
try {
    loader.config({
        paths: {
            vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.50.0/min/vs'
        }
    });
} catch (error) {
    console.warn('Failed to configure Monaco loader:', error);
}

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
    const [monacoError, setMonacoError] = useState(false);
    const dbService = useMemo(() => new IndexedDBService(), []);

    const isTablet = useMediaQuery("(min-width: 768px)");

    useEffect(() => {
        // If screen size changes, clear selected endpoint to prevent stale state
        setSelectedEndpoint(null);
    }, [isTablet]);

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
        setIsEditorMode(!isEditorMode);
        setSelectedEndpoint(null); // Clear selected endpoint when switching modes
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

    const handleEditorDidMount = (_editor: unknown, monaco: unknown) => {
        try {
            // Configure JSON schema for OpenAPI
            const monacoInstance = monaco as any;
            if (monacoInstance?.languages?.json?.jsonDefaults?.setDiagnosticsOptions) {
                monacoInstance.languages.json.jsonDefaults.setDiagnosticsOptions({
                    validate: true,
                    allowComments: false,
                    schemas: [{
                        uri: 'http://swagger.io/v3/schema.json',
                        fileMatch: ['*'],
                        schema: {
                            type: 'object',
                            properties: {
                                openapi: { type: 'string' },
                                info: { type: 'object' },
                                paths: { type: 'object' }
                            },
                            required: ['openapi', 'info', 'paths']
                        }
                    }]
                });
            }
        } catch (error) {
            console.warn('Failed to configure Monaco JSON schema:', error);
        }
    };

    // Add error boundary for Monaco
    useEffect(() => {
        const handleMonacoError = (error?: any) => {
            console.warn('Monaco initialization failed, falling back to textarea:', error);
            setMonacoError(true);
        };

        // Listen for Monaco initialization errors
        loader.init().catch(handleMonacoError);

        // Set a timeout to fallback if Monaco takes too long to load
        const timeout = setTimeout(() => {
            if (!monacoError) {
                console.warn('Monaco taking too long to load, switching to fallback editor');
                handleMonacoError('Timeout');
            }
        }, 10000); // 10 second timeout

        return () => {
            clearTimeout(timeout);
        };
    }, [monacoError]);

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
                            <div className="h-full p-4 overflow-hidden">
                                <Card className="h-full overflow-hidden">
                                    {editorContent ? (
                                        monacoError ? (
                                            <div className="h-full p-4">
                                                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                                    <p className="text-sm text-yellow-800">
                                                        Monaco Editor failed to load. Using fallback text editor.
                                                    </p>
                                                </div>
                                                <Textarea
                                                    value={editorContent}
                                                    onChange={(e) => handleEditorChange(e.target.value)}
                                                    className="h-full font-mono text-sm resize-none"
                                                    placeholder="OpenAPI JSON content..."
                                                />
                                            </div>
                                        ) : (
                                            <Editor
                                                height="100%"
                                                language="json"
                                                value={editorContent}
                                                onChange={handleEditorChange}
                                                onMount={handleEditorDidMount}
                                                theme="vs-light"
                                                loading={
                                                    <div className="flex items-center justify-center h-full">
                                                        <div className="text-center">
                                                            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                                                            <p className="text-muted-foreground">Loading Monaco Editor...</p>
                                                        </div>
                                                    </div>
                                                }
                                                options={{
                                                    minimap: { enabled: false },
                                                    fontSize: 14,
                                                    lineNumbers: 'on',
                                                    folding: true,
                                                    wordWrap: 'on',
                                                    automaticLayout: true,
                                                    scrollBeyondLastLine: false,
                                                    tabSize: 2,
                                                    insertSpaces: true,
                                                    renderWhitespace: 'selection'
                                                }}
                                                beforeMount={(monaco) => {
                                                    // This runs before Monaco mounts, good place to catch early errors
                                                    try {
                                                        return monaco;
                                                    } catch (error) {
                                                        console.warn('Monaco beforeMount error:', error);
                                                        setMonacoError(true);
                                                        return monaco;
                                                    }
                                                }}
                                            />
                                        )
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
                                <ResizablePanel defaultSize={isTablet && selectedEndpoint ? 70 : 100}>
                                    <SwaggerUI
                                        spec={spec}
                                        onEndpointSelected={setSelectedEndpoint}
                                    />
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