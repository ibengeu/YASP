import { useEffect } from "react";
import { HashRouter } from "react-router";
import { AppProvider } from "@yasp/core/providers/app-provider";
import { AppRoutes } from "@yasp/core/AppRoutes";
import { invoke } from "@tauri-apps/api/core";
import { useUpdateCheck } from "./hooks/useUpdateCheck";
import { UpdateDialog } from "./components/UpdateDialog";

// OWASP A09:2025 – SSRF: URL validation is enforced in the Rust `fetch_spec` command.
// This function is passed as a prop so @yasp/core stays platform-agnostic.
async function tauriFetchUrl(url: string): Promise<string> {
    return invoke<string>("fetch_spec", { url });
}

export default function App() {
    const updateState = useUpdateCheck();

    useEffect(() => {
        invoke("close_splashscreen").catch(() => {
            // Splashscreen may not exist in dev — safe to ignore
        });
    }, []);

    return (
        // HashRouter: required for Tauri — the packaged app has no server to handle /workbench URLs.
        <HashRouter>
            <AppProvider>
                <div className="h-screen flex flex-col overflow-hidden relative">
                    {/* Ambient background */}
                    <div className="ambient-glow">
                        <div className="glow-top" />
                        <div className="glow-bottom" />
                    </div>

                    <div className="relative z-10 flex flex-col h-full">
                        <AppRoutes fetchUrl={tauriFetchUrl} />
                    </div>
                </div>
                <UpdateDialog state={updateState} />
            </AppProvider>
        </HashRouter>
    );
}
