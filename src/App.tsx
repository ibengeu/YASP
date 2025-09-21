import {FileJson, Code, Database, Search, Zap, Shield} from "lucide-react"
import {Link, useNavigate} from "react-router-dom"
import {ImportSpec} from "@/features/directory/components/ImportSpec.tsx";
import {OpenApiDocument} from "@/common/openapi-spec.ts";
import {IndexedDBService} from "@/core/services/indexdbservice.ts";
import React from "react";

export default function LandingPage() {
    const navigate = useNavigate()
    const dbService = React.useMemo(() => new IndexedDBService(), []);
    const handleSpecLoaded = async (loadedSpec: OpenApiDocument) => {
        try {
            const id = await dbService.saveSpec(loadedSpec)
            navigate(`/spec/${id}`)
        } catch (error) {
            console.error("Error saving spec:", error)
        }
    }

    return (
        <div className="flex flex-col min-h-screen  ">
            <header className="border-b border-border bg-background/95 backdrop-blur-xl sticky top-0 z-50">
                <div className="mx-auto max-w-7xl flex h-11 items-center justify-between px-6">
                    <div className="flex items-center gap-2">
                        <FileJson className="h-5 w-5 text-primary"/>
                        <span className="text-headline font-semibold">YASP</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-body hover:text-primary transition-colors duration-200">
                            Features
                        </a>
                        <a href="#benefits" className="text-body hover:text-primary transition-colors duration-200">
                            Benefits
                        </a>
                        <Link to="/auth" className="text-body hover:text-primary transition-colors duration-200">
                            Sign In
                        </Link>
                        <Link to="/specs" className="btn-apple text-body">
                            Get Started
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="flex-1">
                {/*Hero Section - Apple inspired clean design*/}
                <section className="py-16 md:py-24 bg-background">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="grid gap-8 lg:grid-cols-[1fr_480px] lg:gap-12 xl:grid-cols-[1fr_520px] items-center">
                            <div className="flex flex-col space-y-6">
                                <div className="space-y-4">
                                    <h1 className="text-largetitle md:text-6xl font-semibold tracking-tight text-foreground leading-tight">
                                        Stop Wrestling With<br/>
                                        <span className="text-primary">Scattered API Docs</span>
                                    </h1>
                                    <p className="text-title3 text-muted-foreground max-w-lg leading-relaxed">
                                        Import, test, and organize all your OpenAPI specs in one place. No setup, no servers,
                                        no vendor lock-in – just pure API productivity in your browser.
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Link to="/specs" className="btn-apple inline-flex items-center justify-center">
                                        Start Organizing Now
                                    </Link>
                                    <Link to="/auth" className="btn-apple-secondary inline-flex items-center justify-center">
                                        Sign In
                                    </Link>
                                </div>
                            </div>
                            <div className="card-apple">
                                <div className="mb-4">
                                    <h3 className="text-title2 font-semibold mb-2">Get Started in Seconds</h3>
                                    <p className="text-subheadline text-muted-foreground">
                                        Drop a file, paste your spec, or import from URL – YASP instantly validates and loads your API for testing.
                                    </p>
                                </div>
                                <ImportSpec onSpecLoaded={handleSpecLoaded}/>
                                <div className="mt-3 text-caption1 text-muted-foreground">
                                    Full OpenAPI 3.x support • Your data stays private • Zero configuration
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section - Apple clean design */}
                <section id="features" className="py-20 bg-secondary">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-largetitle font-semibold tracking-tight mb-4">API Documentation That Actually Works</h2>
                            <p className="text-title3 text-muted-foreground max-w-2xl mx-auto">
                                End the chaos of scattered docs, broken tools, and endless setup. YASP puts everything you need in one powerful, local workspace.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <div className="card-apple text-center">
                                <FileJson className="h-12 w-12 text-primary mb-4 mx-auto"/>
                                <h3 className="text-headline mb-3">Import from Anywhere</h3>
                                <p className="text-subheadline text-muted-foreground">
                                    Drag & drop files, paste raw specs, or pull from any URL. Works with all OpenAPI 3.x formats and validates everything automatically.
                                </p>
                            </div>
                            <div className="card-apple text-center">
                                <Code className="h-12 w-12 text-primary mb-4 mx-auto"/>
                                <h3 className="text-headline mb-3">Test Real APIs Instantly</h3>
                                <p className="text-subheadline text-muted-foreground">
                                    Make actual HTTP requests with full authentication support. No mocking – test against live endpoints and see real responses.
                                </p>
                            </div>
                            <div className="card-apple text-center">
                                <Database className="h-12 w-12 text-primary mb-4 mx-auto"/>
                                <h3 className="text-headline mb-3">Your Data Stays Yours</h3>
                                <p className="text-subheadline text-muted-foreground">
                                    Everything stored locally in your browser. No cloud dependencies, no data sharing, complete privacy and control.
                                </p>
                            </div>
                            <div className="card-apple text-center">
                                <Search className="h-12 w-12 text-primary mb-4 mx-auto"/>
                                <h3 className="text-headline mb-3">Organize Like a Pro</h3>
                                <p className="text-subheadline text-muted-foreground">
                                    Create Personal, Team, Partner, and Public workspaces. Tag, search, and filter specs effortlessly with advanced tools.
                                </p>
                            </div>
                            <div className="card-apple text-center">
                                <Zap className="h-12 w-12 text-primary mb-4 mx-auto"/>
                                <h3 className="text-headline mb-3">Smart Code Editing</h3>
                                <p className="text-subheadline text-muted-foreground">
                                    Professional Monaco editor catches errors as you type with full OpenAPI schema validation and intelligent autocomplete.
                                </p>
                            </div>
                            <div className="card-apple text-center">
                                <Shield className="h-12 w-12 text-primary mb-4 mx-auto"/>
                                <h3 className="text-headline mb-3">Enterprise-Grade Security</h3>
                                <p className="text-subheadline text-muted-foreground">
                                    SSRF protection, input validation, and secure headers. Built with security best practices from day one.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Benefits Section - Apple focused content */}
                <section id="benefits" className="py-20 bg-background">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="grid gap-12 lg:grid-cols-[520px_1fr] lg:gap-16 items-center">
                            <div className="relative flex items-center justify-center order-last lg:order-first">
                                <div className="relative w-full rounded-3xl overflow-hidden shadow-xl aspect-video">
                                    <img
                                        src="/img_1.png"
                                        alt="Developer using API Collection Tool"
                                        className="object-cover h-full w-full"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent"></div>
                                </div>
                            </div>
                            <div className="flex flex-col space-y-6">
                                <div className="space-y-4">
                                    <h2 className="text-largetitle font-semibold tracking-tight">
                                        Finally, OpenAPI Management Without the Headaches
                                    </h2>
                                    <p className="text-title3 text-muted-foreground max-w-lg">
                                        Stop fighting with broken tools and vendor lock-in. YASP turns API chaos into organized productivity.
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 mt-1">
                                            <Shield className="h-6 w-6 text-primary"/>
                                        </div>
                                        <div>
                                            <h3 className="text-headline mb-2">Keep Control</h3>
                                            <p className="text-subheadline text-muted-foreground">
                                                Your data lives in your browser, not our servers. Export anytime, own forever. No vendor lock-in.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 mt-1">
                                            <Shield className="h-6 w-6 text-primary"/>
                                        </div>
                                        <div>
                                            <h3 className="text-headline mb-2">Zero Configuration</h3>
                                            <p className="text-subheadline text-muted-foreground">
                                                No installation, no accounts required to start. Just open and begin working immediately.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 mt-1">
                                            <Shield className="h-6 w-6 text-primary"/>
                                        </div>
                                        <div>
                                            <h3 className="text-headline mb-2">Enterprise Power</h3>
                                            <p className="text-subheadline text-muted-foreground">
                                                Advanced search, multi-workspace organization, and real API testing – all the features you need.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 mt-1">
                                            <Shield className="h-6 w-6 text-primary"/>
                                        </div>
                                        <div>
                                            <h3 className="text-headline mb-2">Built by Developers</h3>
                                            <p className="text-subheadline text-muted-foreground">
                                                Thoughtful UX, keyboard shortcuts, and intuitive workflows designed for how developers actually work.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section - Apple minimal approach */}
                <section id="get-started" className="py-20 bg-secondary">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="text-center space-y-6">
                            <div className="space-y-4">
                                <h2 className="text-largetitle font-semibold tracking-tight">
                                    Ready to End API Documentation Chaos?
                                </h2>
                                <p className="text-title3 text-muted-foreground max-w-xl mx-auto">
                                    Join developers who've already organized thousands of API specs with YASP. Zero setup, maximum productivity.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link to="/specs" className="btn-apple">
                                    Start Organizing Now
                                </Link>
                                <Link to="/auth" className="btn-apple-secondary">
                                    Sign In
                                </Link>
                            </div>
                            <div className="text-caption1 text-muted-foreground">
                                100% free • Your data stays private • Works offline
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-background border-t border-border py-8">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2">
                            <FileJson className="h-5 w-5 text-primary"/>
                            <span className="text-subheadline font-semibold">YASP - OpenAPI Management</span>
                        </div>
                        <p className="text-footnote text-muted-foreground">
                            © {new Date().getFullYear()} YASP. All rights reserved.
                        </p>
                        <div className="flex gap-6">
                            <Link to="#" className="text-footnote text-muted-foreground hover:text-foreground transition-colors duration-200">
                                Privacy Policy
                            </Link>
                            <Link to="#" className="text-footnote text-muted-foreground hover:text-foreground transition-colors duration-200">
                                Terms of Service
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}