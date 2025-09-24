"use client"

import React from "react"
import {Menu, Moon, Sun, X, ArrowLeft, Edit3, Eye} from "lucide-react"
import {useNavigate} from "react-router";
import {Button} from "@/core/components/ui/button.tsx";
import {Badge} from "@/core/components/ui/badge.tsx";
import {useTheme} from "next-themes";

import {OpenApiDocument} from "@/common/openapi-spec.ts";

interface TopBarProps {
    title: string
    isMobileMenuOpen: boolean
    toggleMobileMenu: () => void
    currentSpec: OpenApiDocument | null;
    isEditorMode?: boolean;
    onToggleEditorMode?: () => void;
    hasUnsavedChanges?: boolean;
    onSave?: () => void;
    isSaving?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
    title, 
    isMobileMenuOpen, 
    toggleMobileMenu, 
    currentSpec,
    isEditorMode = false,
    onToggleEditorMode,
    hasUnsavedChanges = false,
    onSave,
    isSaving = false
}) => {
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
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate("/catalog")}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Back to Catalog</span>
                    </Button>
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary"/>
                        <span className="font-bold">{title}</span>
                    </div>
                </div>


                <div className="flex items-center gap-2">
                    {/* Editor/Documentation Toggle */}
                    {currentSpec && onToggleEditorMode && (
                        <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                                <Button
                                    variant={!isEditorMode ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => !isEditorMode || onToggleEditorMode()}
                                >
                                    <Eye className="w-4 h-4 mr-1" />
                                    <span className="hidden sm:inline">Documentation</span>
                                </Button>
                                <Button
                                    variant={isEditorMode ? "default" : "outline"}
                                    size="sm"
                                    onClick={onToggleEditorMode}
                                >
                                    <Edit3 className="w-4 h-4 mr-1" />
                                    <span className="hidden sm:inline">Editor</span>
                                </Button>
                            </div>
                            {isEditorMode && (
                                <div className="flex items-center space-x-2">
                                    <Badge variant="outline" className="uppercase text-xs hidden sm:inline-flex">
                                        JSON
                                    </Badge>
                                    {hasUnsavedChanges && (
                                        <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                                            Unsaved changes
                                        </Badge>
                                    )}
                                    {onSave && (
                                        <Button
                                            onClick={onSave}
                                            disabled={isSaving || !hasUnsavedChanges}
                                            size="sm"
                                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                                        >
                                            {isSaving ? (
                                                <>
                                                    <div className="w-4 h-4 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                    <span className="hidden sm:inline">Saving</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="hidden sm:inline">Save</span>
                                                    <span className="sm:hidden">Save</span>
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    
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
