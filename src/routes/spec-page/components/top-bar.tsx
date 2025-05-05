"use client"

import type React from "react"
import {Button} from "@/components/ui/button"
import {Menu, X} from "lucide-react"
import {useNavigate} from "react-router";

interface TopBarProps {
    title: string
    isMobileMenuOpen: boolean
    toggleMobileMenu: () => void
}

export const TopBar: React.FC<TopBarProps> = ({title, isMobileMenuOpen, toggleMobileMenu}) => {
    const navigate = useNavigate()

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
                    <Button variant="outline" size="sm" onClick={() => navigate("/app")}>
                        Back to Directory
                    </Button>
                </div>
            </div>
        </header>
    )
}
