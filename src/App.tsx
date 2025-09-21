import {FileJson, Code, Database, Search, Zap, Share2, Shield} from "lucide-react"
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
                                        Test Any OpenAPI Spec<br/>
                                        <span className="text-primary">in 10 Seconds</span>
                                    </h1>
                                    <p className="text-title3 text-muted-foreground max-w-lg leading-relaxed">
                                        While others spend hours configuring tools, you're already testing APIs.
                                        No accounts, no setup, no hassle.
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Link to="/specs" className="btn-apple inline-flex items-center justify-center">
                                        Try with Sample API
                                    </Link>
                                    <Link to="/specs" className="btn-apple-secondary inline-flex items-center justify-center">
                                        Upload Your Spec
                                    </Link>
                                </div>
                            </div>
                            <div className="card-apple">
                                <div className="mb-4">
                                    <h3 className="text-title2 font-semibold mb-2">Instant API Testing</h3>
                                    <p className="text-subheadline text-muted-foreground">
                                        Drop your OpenAPI spec and watch it come alive.
                                    </p>
                                </div>
                                <ImportSpec onSpecLoaded={handleSpecLoaded}/>
                                <div className="mt-3 text-caption1 text-muted-foreground">
                                    Your data never leaves your browser • Works 100% offline
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section - Apple clean design */}
                <section id="features" className="py-20 bg-secondary">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-largetitle font-semibold tracking-tight mb-4">Zero Setup Required</h2>
                            <p className="text-title3 text-muted-foreground max-w-2xl mx-auto">
                                No configuration, no accounts, no installation. Just upload your spec and start testing.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <div className="card-apple text-center">
                                <FileJson className="h-12 w-12 text-primary mb-4 mx-auto"/>
                                <h3 className="text-headline mb-3">Instant Upload</h3>
                                <p className="text-subheadline text-muted-foreground">
                                    Drag, drop, done. Your API spec is live in seconds, not hours.
                                </p>
                            </div>
                            <div className="card-apple text-center">
                                <Database className="h-12 w-12 text-primary mb-4 mx-auto"/>
                                <h3 className="text-headline mb-3">Complete Privacy</h3>
                                <p className="text-subheadline text-muted-foreground">
                                    Your APIs never leave your browser. No cloud storage, no tracking, no vendor lock-in.
                                </p>
                            </div>
                            <div className="card-apple text-center">
                                <Search className="h-12 w-12 text-primary mb-4 mx-auto"/>
                                <h3 className="text-headline mb-3">Smart Search</h3>
                                <p className="text-subheadline text-muted-foreground">
                                    Find endpoints, parameters, or responses instantly. No more scrolling through docs.
                                </p>
                            </div>
                            <div className="card-apple text-center">
                                <Code className="h-12 w-12 text-primary mb-4 mx-auto"/>
                                <h3 className="text-headline mb-3">Live Testing</h3>
                                <p className="text-subheadline text-muted-foreground">
                                    Click to test real endpoints. No external tools or collection imports needed.
                                </p>
                            </div>
                            <div className="card-apple text-center">
                                <Zap className="h-12 w-12 text-primary mb-4 mx-auto"/>
                                <h3 className="text-headline mb-3">High Performance</h3>
                                <p className="text-subheadline text-muted-foreground">
                                    Load large specifications instantly. Optimized for speed and efficiency.
                                </p>
                            </div>
                            <div className="card-apple text-center">
                                <Share2 className="h-12 w-12 text-primary mb-4 mx-auto"/>
                                <h3 className="text-headline mb-3">Easy Sharing</h3>
                                <p className="text-subheadline text-muted-foreground">
                                    Generate shareable links in one click. Export to multiple formats.
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
                                        Why Developers Choose YASP
                                    </h2>
                                    <p className="text-title3 text-muted-foreground max-w-lg">
                                        Focus on building features instead of configuring tools. Get productive immediately.
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 mt-1">
                                            <Shield className="h-6 w-6 text-primary"/>
                                        </div>
                                        <div>
                                            <h3 className="text-headline mb-2">Time Savings</h3>
                                            <p className="text-subheadline text-muted-foreground">
                                                Skip the setup time. Start testing APIs immediately without complex configuration.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 mt-1">
                                            <Shield className="h-6 w-6 text-primary"/>
                                        </div>
                                        <div>
                                            <h3 className="text-headline mb-2">Simplified Workflow</h3>
                                            <p className="text-subheadline text-muted-foreground">
                                                Everything in one place. No context switching between multiple tools.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 mt-1">
                                            <Shield className="h-6 w-6 text-primary"/>
                                        </div>
                                        <div>
                                            <h3 className="text-headline mb-2">No Subscriptions</h3>
                                            <p className="text-subheadline text-muted-foreground">
                                                Free to use. No monthly fees or enterprise licensing costs.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 mt-1">
                                            <Shield className="h-6 w-6 text-primary"/>
                                        </div>
                                        <div>
                                            <h3 className="text-headline mb-2">Data Security</h3>
                                            <p className="text-subheadline text-muted-foreground">
                                                Your sensitive API data stays private. No third-party servers, complete local control.
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
                                    Ready to Get Started?
                                </h2>
                                <p className="text-title3 text-muted-foreground max-w-xl mx-auto">
                                    Upload your OpenAPI specification and start testing in seconds.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link to="/specs" className="btn-apple">
                                    Start Testing Now
                                </Link>
                            </div>
                            <div className="text-caption1 text-muted-foreground">
                                100% private • Zero setup required
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
                            <span className="text-subheadline font-semibold">YASP API Collection</span>
                        </div>
                        <p className="text-footnote text-muted-foreground">
                            © {new Date().getFullYear()} API Collection. All rights reserved.
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