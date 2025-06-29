"use client"

import React, {useRef} from "react"
import {Menu, Moon, Sun, X} from "lucide-react"
import {useNavigate} from "react-router";
import {Button} from "@/core/components/ui/button.tsx";
import {useTheme} from "next-themes";
import {useSpecContext} from "@/core/context/spec-context.tsx";

import {OpenApiDocument} from "@/common/openapi-spec.ts";

interface TopBarProps {
    title: string
    isMobileMenuOpen: boolean
    toggleMobileMenu: () => void
    currentSpec: OpenApiDocument | null;
}

export const TopBar: React.FC<TopBarProps> = ({title, isMobileMenuOpen, toggleMobileMenu, currentSpec}) => {
    const navigate = useNavigate()
    const { saveSpec } = useSpecContext();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const content = e.target?.result as string;
                    const spec = JSON.parse(content); // Assuming JSON for now
                    await saveSpec(spec);
                    alert("Specification imported successfully!");
                } catch (error) {
                    console.error("Error importing spec:", error);
                    alert("Failed to import specification. Please ensure it's a valid JSON OpenAPI spec.");
                }
            };
            reader.readAsText(file);
        }
    };

    const handleExportClick = () => {
        // This will need to get the current spec from context or props
        // For now, let's assume we have a spec to export
        if (!currentSpec) {
            alert("No specification loaded to export.");
            return;
        }

        const specJson = JSON.stringify(currentSpec, null, 2);
        const blob = new Blob([specJson], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "openapi-spec.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="px-4 flex h-14 items-center justify-between">
                <div className="flex items-center gap-2 mr-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={toggleMobileMenu}
                        aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                    >
                        {isMobileMenuOpen ? <X className="h-5 w-5"/> : <Menu className="h-5 w-5"/>}
                    </Button>
                    <div className="flex items-center gap-2" onClick={() => navigate("/")} role="button" tabIndex={0}>
                        <div className="h-6 w-6 rounded-full bg-primary"/>
                        <span className="font-bold">{title}</span>
                    </div>
                </div>


                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleImportClick}>
                        Import
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".json,.yaml,.yml"
                        style={{ display: "none" }}
                    />
                    <Button variant="outline" size="sm" onClick={handleExportClick}>
                        Export
                    </Button>
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
};

const ThemeToggle: React.FC = () => {
    const { theme, setTheme } = useTheme();

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
        >
            {theme === "dark" ? (
                <Sun className="h-5 w-5" />
            ) : (
                <Moon className="h-5 w-5" />
            )}
        </Button>
    );
};
