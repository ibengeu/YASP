"use client";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { EndpointList } from "./endpoint-list";
import { EndpointDetail } from "./endpoint-detail";
import useMediaQuery from "@/core/hooks/useMediaQuery.ts";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/core/components/ui/resizable.tsx";
import TryItOut from "@/features/spec-page/components/try-it-out.tsx";
export function SwaggerUI({ spec, onEndpointSelected }) {
    const [selectedTag, setSelectedTag] = useState(null);
    const [selectedEndpoint, setSelectedEndpoint] = useState(null);
    useEffect(() => {
        if (!spec.paths || selectedTag || selectedEndpoint)
            return;
        const pathsByTag = Object.entries(spec.paths).reduce((acc, [path, pathItem]) => {
            if (!pathItem)
                return acc;
            const validMethods = ["get", "post", "put", "delete", "patch", "options", "head", "trace"];
            validMethods.forEach((method) => {
                const operation = pathItem[method];
                if (!operation)
                    return;
                const tags = operation.tags?.length ? operation.tags : ["untagged"];
                tags.forEach((tag) => {
                    if (!acc[tag])
                        acc[tag] = [];
                    acc[tag].push({ path, method, operation });
                });
            });
            return acc;
        }, {});
        const firstTag = Object.keys(pathsByTag)[0];
        if (firstTag) {
            setSelectedTag(firstTag);
            const firstEndpoint = pathsByTag[firstTag][0];
            if (firstEndpoint) {
                setSelectedEndpoint(firstEndpoint);
                onEndpointSelected?.(firstEndpoint);
            }
        }
    }, [spec.paths, selectedTag, selectedEndpoint, onEndpointSelected]);
    const isDesktop = useMediaQuery("(min-width: 1024px)");
    const isTablet = useMediaQuery("(min-width: 768px)");
    const defaultLayout = isDesktop ? [15, 45, 40] : isTablet ? [30, 70] : [100];
    return (_jsxs(ResizablePanelGroup, { direction: "horizontal", className: "h-full rounded-lg", children: [_jsx(ResizablePanel, { defaultSize: defaultLayout[0], minSize: 18, maxSize: 20, className: "bg-background overflow-hidden", children: _jsx(EndpointList, { spec: spec, selectedTag: selectedTag, setSelectedTag: setSelectedTag, selectedEndpoint: selectedEndpoint, setSelectedEndpoint: (endpoint) => {
                        setSelectedEndpoint(endpoint);
                        onEndpointSelected?.(endpoint);
                    } }) }), _jsx(ResizableHandle, { withHandle: true }), _jsx(ResizablePanel, { defaultSize: defaultLayout[1], minSize: isDesktop ? 30 : 70, className: "overflow-hidden", children: selectedEndpoint ? (_jsx(EndpointDetail, { path: selectedEndpoint.path, method: selectedEndpoint.method, operation: selectedEndpoint.operation, components: spec.components || {} })) : (_jsx("div", { className: "flex items-center justify-center h-full text-muted-foreground", children: "Select an endpoint to view its details" })) }), isDesktop && (_jsxs(_Fragment, { children: [_jsx(ResizableHandle, { withHandle: true }), _jsx(ResizablePanel, { defaultSize: defaultLayout[2], minSize: 25, className: "overflow-hidden", children: selectedEndpoint ? (_jsx(TryItOut, { path: selectedEndpoint.path, method: selectedEndpoint.method, operation: selectedEndpoint.operation, components: spec.components || {} }, `${selectedEndpoint.path}-${selectedEndpoint.method}`)) : (_jsx("div", { className: "flex items-center justify-center h-full text-muted-foreground", children: "Select an endpoint to try it out" })) })] }))] }));
}
