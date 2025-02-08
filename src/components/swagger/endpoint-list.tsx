// src/components/swagger/endpoint-list.tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { PathItemObject } from "@/types/swagger"
import Endpoint from "./endpoint"

interface EndpointListProps {
    paths: Record<string, PathItemObject>
    selectedPath: string | null
    onPathSelect: (path: string) => void
}

export default function EndpointList({ paths, selectedPath, onPathSelect }: EndpointListProps) {
    return (
        <Accordion type="single" collapsible className="w-full">
            {Object.entries(paths).map(([path, pathItem]) => (
                <AccordionItem
                    key={path}
                    value={path}
                    className={selectedPath === path ? "bg-muted" : ""}
                >
                    <AccordionTrigger
                        className="text-sm font-mono px-4 hover:no-underline hover:bg-muted"
                        onClick={() => onPathSelect(path)}
                    >
                        {path}
                    </AccordionTrigger>
                    <AccordionContent className="pb-0">
                        <div className="space-y-1 px-2">
                            {Object.entries(pathItem).map(([method, operation]) => (
                                <Endpoint
                                    key={`${path}-${method}`}
                                    method={method}
                                    path={path}
                                    operation={operation}
                                />
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    )
}