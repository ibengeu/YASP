import {
    isRouteErrorResponse,
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
} from "react-router";
import type { LinksFunction } from "react-router";


// Import CSS directly - React Router v7 handles bundling
import "./index.css";
import { Route } from "../.react-router/types/app/+types/root.ts";

export const links: LinksFunction = () => [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
    },
    {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap",
    },
];

import { useEffect, useState } from 'react';
import { useThemeStore } from '@/stores/theme-store';

export function Layout({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);
    const darkMode = useThemeStore((state) => state.darkMode);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <html lang="en" className={mounted && darkMode ? 'dark' : ''} suppressHydrationWarning>
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <Meta />
                <Links />
                <title>YASP - OpenAPI Specification Platform</title>
            </head>
            <body>
                <div id="root">
                    {children}
                </div>
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    );
}

import { AppProvider } from "@/providers/app-provider";
import { CommandDeck } from "@/components/navigation/CommandDeck";

export default function App() {
    return (
        <AppProvider>
            <CommandDeck />
            <main className="pt-16">
                <Outlet />
            </main>
        </AppProvider>
    );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
    let message = "Oops!";
    let details = "An unexpected error occurred.";
    let stack: string | undefined;

    if (isRouteErrorResponse(error)) {
        message = error.status === 404 ? "404" : "Error";
        details =
            error.status === 404
                ? "The requested page could not be found."
                : error.statusText || details;
    } else if (import.meta.env.DEV && error && error instanceof Error) {
        details = error.message;
        stack = error.stack;
    }

    return (
        <main className="pt-16 p-4 container mx-auto">
            <h1>{message}</h1>
            <p>{details}</p>
            {stack && (
                <pre className="w-full p-4 overflow-x-auto">
                    <code>{stack}</code>
                </pre>
            )}
        </main>
    );
}

// export default function Root() {
//   return (
//     <AuthProvider>
//       <CarbonProvider>
//         <Outlet />
//         <Toaster />
//       </CarbonProvider>
//     </AuthProvider>
//   );
// }
