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

export const links: LinksFunction = () => [];

export function Layout({ children }: { children: React.ReactNode }) {
    // Note: The dark class is applied by default and managed by theme store on the client
    // suppressHydrationWarning allows className to change after hydration
    return (
        <html lang="en" className="dark" suppressHydrationWarning>
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
import { MessageSquarePlus, X } from "lucide-react";
import { useState, useEffect } from "react";

function FeedbackFloater() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Track user visits in localStorage
        const visitKey = 'yasp_visit_count';
        const dismissKey = 'yasp_feedback_dismissed_at';
        const nextShowKey = 'yasp_feedback_next_show_at';

        const visitCount = parseInt(localStorage.getItem(visitKey) || '0', 10);
        const newVisitCount = visitCount + 1;
        localStorage.setItem(visitKey, String(newVisitCount));

        // Check if user has visited at least twice
        if (newVisitCount < 2) {
            setShow(false);
            return;
        }

        // Check if dismissed - show intermittently (every 3 hours)
        const dismissedAt = localStorage.getItem(dismissKey);
        if (dismissedAt) {
            const nextShowAt = parseInt(localStorage.getItem(nextShowKey) || '0', 10);
            const now = Date.now();

            if (now < nextShowAt) {
                setShow(false);
                return;
            }
        }

        setShow(true);
    }, []);

    const handleDismiss = () => {
        const dismissKey = 'yasp_feedback_dismissed_at';
        const nextShowKey = 'yasp_feedback_next_show_at';

        const now = Date.now();
        localStorage.setItem(dismissKey, new Date().toISOString());
        // Show again in 3 hours
        localStorage.setItem(nextShowKey, String(now + 3 * 60 * 60 * 1000));

        setShow(false);
    };

    if (!show) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-xl transition-all duration-200 group hover:border-primary/60 hover:bg-primary/5 hover:shadow-primary/10">
            <a
                href="https://docs.google.com/forms/d/1oQLMAtY3bzcdYDX1lq2vYHimvCAkvOycHxOzKhZGDOs/viewform"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Give feedback"
                className="flex items-center gap-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded cursor-pointer"
            >
                <MessageSquarePlus className="size-4 text-primary" />
                <span>Feedback</span>
            </a>
            <button
                type="button"
                onClick={handleDismiss}
                aria-label="Dismiss feedback"
                className="ml-1 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            >
                <X className="size-3.5" />
            </button>
        </div>
    );
}

export default function App() {
    return (
        <AppProvider>
            <div className="h-screen flex flex-col overflow-hidden relative">
                {/* Ambient Background Pattern */}
                <div className="ambient-glow">
                    <div className="glow-top" />
                    <div className="glow-bottom" />
                </div>

                <div className="relative z-10 flex flex-col h-full">
                    <Outlet />
                </div>

                {/* Floating feedback link — shown after 2 visits, dismissible with intermittent re-display */}
                <FeedbackFloater />
            </div>
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
