"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { Badge } from "@/core/components/ui/badge";
import { cn } from "@/core/lib/utils";
import { ScrollArea } from "@/core/components/ui/scroll-area";
import { ChevronRight, Search } from 'lucide-react';
import { Input } from "@/core/components/ui/input";
export const EndpointList = ({ spec, selectedTag, setSelectedTag, selectedEndpoint, setSelectedEndpoint, }) => {
    const [searchQuery, setSearchQuery] = React.useState("");
    if (!spec || !spec.paths) {
        return _jsx("div", { className: "p-4 text-center text-muted-foreground", children: "Invalid or empty API specification" });
    }
    const pathsByTag = Object.entries(spec.paths).reduce((acc, [path, pathItem]) => {
        if (!pathItem)
            return acc;
        const validMethods = ["get", "post", "put", "delete", "patch", "options", "head", "trace"];
        validMethods.forEach((method) => {
            const operation = pathItem[method];
            if (!operation)
                return;
            const tags = operation.tags || ["untagged"];
            tags.forEach((tag) => {
                if (!acc[tag]) {
                    acc[tag] = [];
                }
                acc[tag].push({
                    path,
                    method,
                    operation,
                });
            });
        });
        return acc;
    }, {});
    const methodColors = {
        get: "bg-blue-500",
        post: "bg-green-500",
        put: "bg-orange-500",
        delete: "bg-red-500",
        patch: "bg-yellow-500",
        options: "bg-purple-500",
        head: "bg-cyan-500",
        trace: "bg-indigo-500",
    };
    const filteredTags = Object.keys(pathsByTag).filter((tag) => searchQuery === "" ||
        tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pathsByTag[tag].some((endpoint) => endpoint.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
            endpoint.operation.summary?.toLowerCase().includes(searchQuery.toLowerCase())));
    return (_jsxs("div", { className: "h-full flex flex-col", children: [_jsx("div", { className: "p-3 border-b", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" }), _jsx(Input, { placeholder: "Search endpoints...", className: "pl-8", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value) })] }) }), _jsx("div", { className: "flex-1 overflow-hidden", children: _jsx(ScrollArea, { className: "h-full", children: _jsx("div", { className: "p-2", children: filteredTags.length === 0 ? (_jsx("div", { className: "p-4 text-center text-muted-foreground", children: "No endpoints found" })) : (filteredTags.map((tag) => (_jsxs("div", { className: "mb-4", children: [_jsxs("button", { onClick: () => setSelectedTag(tag), className: cn("w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-between", selectedTag === tag ? "bg-stone-200/50 text-stone-800" : "hover:bg-stone-100/50"), children: [_jsx("span", { children: tag }), _jsxs("span", { className: "text-xs text-muted-foreground", children: ["(", pathsByTag[tag].length, ")"] })] }), selectedTag === tag && (_jsx("div", { className: "mt-2 ml-2 space-y-1", children: pathsByTag[tag]
                                        .filter((endpoint) => searchQuery === "" ||
                                        endpoint.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        endpoint.operation.summary?.toLowerCase().includes(searchQuery.toLowerCase()))
                                        .map((endpoint) => (_jsxs("button", { onClick: () => setSelectedEndpoint(endpoint), className: cn("w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2", selectedEndpoint?.path === endpoint.path && selectedEndpoint?.method === endpoint.method
                                            ? "bg-muted/80 font-medium"
                                            : "hover:bg-muted/50"), children: [_jsx(Badge, { className: cn("uppercase text-white text-xs", methodColors[endpoint.method]), children: endpoint.method }), _jsx("span", { className: "truncate", children: endpoint.path }), _jsx(ChevronRight, { className: "ml-auto h-4 w-4 text-muted-foreground" })] }, `${endpoint.path}-${endpoint.method}`))) }))] }, tag)))) }) }) })] }));
};
