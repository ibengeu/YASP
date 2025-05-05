"use client"

import type React from "react"
import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { IndexedDBService } from "@/services/indexdbservice"
import { SwaggerUI } from "@/routes/spec-page/components/swagger-ui"
import type { OpenApiDocument, OperationObject } from "@/common/swagger.types.ts"
import { Loader2 } from "lucide-react"
import { useNavigate, useParams } from "react-router"
import { TryItOut } from "./components/try-it-out"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import useMediaQuery from "@/hooks/useMediaQuery.ts"
import { TopBar } from "@/routes/spec-page/components/top-bar.tsx"

export const SpecPage: React.FC = () => {
    const { id } = useParams<{ id: string }>()
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

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen)
    }

    const loadSpec = useCallback(async () => {
        if (!id) return

        setIsLoading(true)
        try {
            const loadedSpec = await dbService.getSpecById(Number(id))
            if (!loadedSpec) {
                throw new Error("Specification not found")
            }
            setSpec(loadedSpec.spec)
        } catch (err) {
            setError("Failed to load specification")
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
                <TopBar title="API Documentation" isMobileMenuOpen={isMobileMenuOpen} toggleMobileMenu={toggleMobileMenu} />
                <div className="container mx-auto py-6 text-center flex-1">
                    <p className="text-red-500 mb-4">{error}</p>
                    <Button onClick={() => navigate("/")} variant="outline">
                        Back to Directory
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-stone-50/30">
            <TopBar title="API Documentation" isMobileMenuOpen={isMobileMenuOpen} toggleMobileMenu={toggleMobileMenu} />

            <main className="flex-1 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading specification" />
                    </div>
                ) : spec ? (
                    <>
                        <SwaggerUI spec={spec} />

                        {/* Mobile Try It Out Sheet */}
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
