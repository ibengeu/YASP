import type React from "react";
interface TopBarProps {
    title: string;
    isMobileMenuOpen: boolean;
    toggleMobileMenu: () => void;
}
export declare const TopBar: React.FC<TopBarProps>;
export {};
