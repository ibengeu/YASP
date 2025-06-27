"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Menu, X } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/core/components/ui/button.tsx";
export const TopBar = ({ title, isMobileMenuOpen, toggleMobileMenu }) => {
    const navigate = useNavigate();
    return (_jsx("header", { className: "sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", children: _jsxs("div", { className: "px-4 flex h-14 items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2 mr-4", children: [_jsx(Button, { variant: "ghost", size: "icon", className: "md:hidden", onClick: toggleMobileMenu, "aria-label": isMobileMenuOpen ? "Close menu" : "Open menu", children: isMobileMenuOpen ? _jsx(X, { className: "h-5 w-5" }) : _jsx(Menu, { className: "h-5 w-5" }) }), _jsxs("div", { className: "flex items-center gap-2", onClick: () => navigate("/"), role: "button", tabIndex: 0, children: [_jsx("div", { className: "h-6 w-6 rounded-full bg-primary" }), _jsx("span", { className: "font-bold", children: title })] })] }), _jsx("div", { className: "flex items-center gap-2", children: _jsx(Button, { variant: "outline", size: "sm", onClick: () => navigate("/app"), children: "Back to Directory" }) })] }) }));
};
