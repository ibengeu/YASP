import {Card} from "@/components/ui/card"
import {OpenApiDocument, OperationObject} from "@/types/swagger"
import {cn} from "@/lib/utils"
import {useState} from "react"
import EndpointSection from "./endpoint-section"

interface SwaggerUIProps {
    spec: OpenApiDocument
}

export function SwaggerUI({spec}: SwaggerUIProps) {
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    if (!spec || !spec.paths) {
        return (
            <div className="container mx-auto py-6">
                <Card className="p-6">
                    <div className="text-center text-muted-foreground">
                        Invalid or empty API specification
                    </div>
                </Card>
            </div>
        );
    }

    interface EndpointEntry {
        path: string;
        method: string;
        operation: OperationObject;
    }

    const pathsByTag = Object.entries(spec.paths).reduce<Record<string, EndpointEntry[]>>((acc, [path, pathItem]) => {
        if (!pathItem) return acc;

        // Type the methods correctly
        (Object.entries(pathItem) as [string, OperationObject][]).forEach(([method, operation]) => {
            if (!operation) return;

            const tags = operation.tags || ['untagged'];
            tags.forEach((tag: string) => {
                if (!acc[tag]) {
                    acc[tag] = [];
                }
                acc[tag].push({
                    path,
                    method,
                    operation
                });
            });
        });
        return acc;
    }, {});

    if (Object.keys(pathsByTag).length === 0) {
        return (
            <div className="container mx-auto py-6">
                <Card className="p-6">
                    <div className="text-center text-muted-foreground">
                        No endpoints found in the specification
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6">
            <Card className="grid grid-cols-[250px_1fr] min-h-[600px] overflow-hidden">
                {/* Left Panel - Tags */}
                <div className="border-r">

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
                                    aria-selected={selectedTag === tag}
                                    role="tab"
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

                {/* Right Panel */}
                <div className="overflow-y-auto h-[calc(100vh-13rem)]">
                    {selectedTag ? (
                        <EndpointSection
                            tag={selectedTag}
                            endpoints={pathsByTag[selectedTag]}
                            components={spec.components || {}}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            Select a tag to view its endpoints
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}