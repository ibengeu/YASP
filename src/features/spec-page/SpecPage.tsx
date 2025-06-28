"use client"

import React, {useState} from "react";
import {Button} from "@/core/components/ui/button";
import {SwaggerUI} from "./components/swagger-ui";
import {OperationObject} from "../../common/openapi-spec.ts";
import {Loader2} from "lucide-react";
import {useNavigate, useParams} from "react-router";
import {Sheet, SheetContent} from "@/core/components/ui/sheet";
import useMediaQuery from "@/core/hooks/useMediaQuery.ts";
import {TopBar} from "./components/top-bar.tsx";
import TryItOut from "./components/try-it-out.tsx";
import {useSpec} from "./hooks/useSpec.ts";

export const SpecPage: React.FC = () => {
    const {id} = useParams<{ id: string }>();
    const navigate = useNavigate();
    const {spec, isLoading, error} = useSpec(id);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [selectedEndpoint, setSelectedEndpoint] = useState<{
        path: string;
        method: string;
        operation: OperationObject;
    } | null>(null);

    const isTablet = useMediaQuery("(min-width: 768px)");

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    if (error) {
        return (
            <div className="flex flex-col min-h-screen">
                <TopBar title="API Documentation" isMobileMenuOpen={isMobileMenuOpen}
                        toggleMobileMenu={toggleMobileMenu}/>
                <div className="container mx-auto py-6 text-center flex-1">
                    <p className="text-destructive mb-4">{error}</p>

                    <Button onClick={() => navigate("/")} variant="outline">
                        Back to Directory
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen ">
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