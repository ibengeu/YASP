"use client"

import type React from "react"
import {useCallback, useEffect, useState} from "react"
import {Button} from "@/components/ui/button"
import {IndexedDBService} from "@/services/indexdbservice"
import {SwaggerUI} from "@/routes/spec-page/components/swagger-ui"
import type {OpenApiDocument, OperationObject} from "@/common/openapi-spec.ts"
import {Loader2} from "lucide-react"
import {useNavigate, useParams} from "react-router"
import {Sheet, SheetContent} from "@/components/ui/sheet"
import useMediaQuery from "@/hooks/useMediaQuery.ts"
import {TopBar} from "@/routes/spec-page/components/top-bar.tsx"
import TryItOut from "@/routes/spec-page/components/try-it-out.tsx"

export const SpecPage: React.FC = () => {
    const {id} = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [spec, setSpec] = useState<OpenApiDocument | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [selectedEndpoint, setSelectedEndpoint] = useState<{
        path: string
        method: string
        operation: OperationObject
    } | null>(null)

    const dbService = new IndexedDBService()
    const isTablet = useMediaQuery("(min-width: 768px)")

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen)

    const validateSpec = (spec: unknown): spec is OpenApiDocument => {
        if (typeof spec !== "object" || spec === null) return false
        const s = spec as Partial<OpenApiDocument>
        return !!(
            s.openapi?.startsWith("3.") &&
            s.info?.title &&
            s.info?.version &&
            s.paths && Object.keys(s.paths).length > 0
        )
    }

    const loadSpec = useCallback(async () => {
        if (!id) {
            setError("No specification ID provided")
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        try {
            const loadedSpec = await dbService.getSpecById(Number(id))
            if (!loadedSpec || !loadedSpec.spec) {
                throw new Error("Specification not found")
            }
            if (!validateSpec(loadedSpec.spec)) {
                throw new Error("Invalid OpenAPI specification format")
            }
            setSpec(loadedSpec.spec)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load specification")
            console.error("Error loading spec:", err)
        } finally {
            setIsLoading(false)
        }
    }, [id])

    useEffect(() => {
        loadSpec()
    }, [loadSpec])

    if (error) {
        return (
            <div className="flex flex-col min-h-screen">
                <TopBar title="API Documentation" isMobileMenuOpen={isMobileMenuOpen}
                        toggleMobileMenu={toggleMobileMenu}/>
                <div className="container mx-auto py-6 text-center flex-1">
                    <p className="text-red-500 mb-4">{error}</p>
                    <Button onClick={loadSpec} variant="outline" className="mr-2">
                        Retry
                    </Button>
                    <Button onClick={() => navigate("/")} variant="outline">
                        Back to Directory
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-stone-50/30">
            <TopBar title="API Documentation" isMobileMenuOpen={isMobileMenuOpen} toggleMobileMenu={toggleMobileMenu}/>

            <main className="flex-1 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading specification"/>
                    </div>
                ) : spec ? (
                    <>
                        <SwaggerUI
                            spec={spec}
                            onEndpointSelected={setSelectedEndpoint} // Pass callback to sync selection
                        />

                        {!isTablet && selectedEndpoint && (
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