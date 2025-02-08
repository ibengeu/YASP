// src/components/swagger/swagger-ui.tsx
import ApiInfo from "./api-info"
import {Card} from "@/components/ui/card"
import {OpenApiDocument} from "@/types/swagger"
import {cn} from "@/lib/utils"
import {useState} from "react"
import EndpointSection from "./endpoint-section"

interface SwaggerUIProps {
    spec: OpenApiDocument
}

export function SwaggerUI({spec}: SwaggerUIProps) {
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    const pathsByTag = Object.entries(spec.paths).reduce((acc, [path, pathItem]) => {
        Object.entries(pathItem).forEach(([method, operation]) => {
            const tags = operation.tags || ['untagged'];
            tags.forEach((tag: string) => {
                if (!acc[tag]) acc[tag] = [];
                acc[tag].push({path, method, operation});
            });
        });
        return acc;
    }, {} as Record<string, Array<{ path: string; method: string; operation: any }>>);


    return (
        <div className="container mx-auto py-6">
            <Card className="grid grid-cols-[250px_1fr] min-h-[600px] overflow-hidden">
                {/* Left Panel - Tags */}
                <div className="border-r">
                    <div className="p-4 border-b">
                        <ApiInfo info={spec.info}/>
                    </div>
                    <div className="overflow-y-auto h-[calc(100vh-13rem)]">
                        <nav className="space-y-1 p-2">
                            {Object.keys(pathsByTag).map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setSelectedTag(tag)}
                                    className={cn(
                                        "w-full text-left px-4 py-2 rounded-md text-sm transition-colors",
                                        selectedTag === tag
                                            ? "bg-primary text-primary-foreground"
                                            : "hover:bg-muted"
                                    )}
                                >
                                    {tag}
                                    <span className="ml-2 text-xs text-muted-foreground">
                    ({pathsByTag[tag].length})
                  </span>
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Right Panel - pass components */}
                <div className="overflow-y-auto h-[calc(100vh-13rem)]">
                    {selectedTag ? (
                        <EndpointSection
                            tag={selectedTag}
                            endpoints={pathsByTag[selectedTag]}
                            components={spec.components}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            Select a tag to view its endpoints
                        </div>
                    )}
                </div>
            </Card>
        </div>
    )
}