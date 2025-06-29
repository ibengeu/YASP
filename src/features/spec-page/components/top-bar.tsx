"use client"

import React from "react"
import {Menu, Moon, Sun, X} from "lucide-react"
import {useNavigate} from "react-router";
import {Button} from "@/core/components/ui/button.tsx";
import {useTheme} from "next-themes";

import {OpenApiDocument} from "@/common/openapi-spec.ts";

interface TopBarProps {
    title: string
    isMobileMenuOpen: boolean
    toggleMobileMenu: () => void
    currentSpec: OpenApiDocument | null;
}

export const TopBar: React.FC<TopBarProps> = ({title, isMobileMenuOpen, toggleMobileMenu, currentSpec}) => {
    const navigate = useNavigate()

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
