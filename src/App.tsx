import {FileJson, Code, Database, Search, Zap, Share2, Shield} from "lucide-react"
import {Link, useNavigate} from "react-router-dom"
import {Button} from "@/core/components/ui/button"
import {Card, CardDescription, CardHeader, CardTitle} from "@/core/components/ui/card"
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
            <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10 px-12 z-50">
                <div className=" mx-auto flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <FileJson className="h-6 w-6 text-primary"/>
                        <span className="text-xl font-semibold tracking-tight">YASP</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <nav className="hidden md:flex items-center gap-6">
                            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
                                Features
                            </a>
                            <a href="#benefits" className="text-sm font-medium hover:text-primary transition-colors">
                                Benefits
                            </a>
                            <Link to="/specs"
                                  className="text-sm font-medium hover:text-primary transition-colors">
                                Get Started
                            </Link>
                        </nav>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {/*Hero Section*/}
                <section className="py-16 md:py-28 relative overflow-hidden bg-cover bg-center bg-no-repeat" style={{backgroundImage: 'url("/src/assets/3d-abstract-blue-geometrical-background-connection-structure-science-background-futuristic-technology.jpg")'}}>
                    <div className="absolute inset-0 bg-background/80 "></div>
                    <div className="relative z-10">
                    <div className="px-4 md:px-20 w-full">
                        <div className="grid gap-8 lg:grid-cols-[1fr_500px] lg:gap-12 xl:grid-cols-[1fr_550px]">
                            <div className="flex flex-col justify-center space-y-4">
                                <div className="space-y-2">
                                    <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-bold tracking-tighter text-foreground">
                                        Test Any OpenAPI Spec in 10 Seconds
                                    </h1>
                                    <p className="max-w-[600px] text-lg md:text-xl text-muted-foreground">
                                        While others spend hours configuring tools, you're already testing APIs. 
                                        No accounts, no setup, no hassle. Just drop your spec and go.
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Button size="lg" asChild className="bg-primary hover:bg-primary/90">
                                        <Link to="/specs">Try with Sample API →</Link>
                                    </Button>
                                    <Button size="lg" variant="outline" asChild>
                                        <Link to="/specs">Upload Your Spec</Link>
                                    </Button>
                                </div>
                            </div>
                            <div className="border rounded-lg p-4 bg-card shadow-lg">
                                <div className="mb-4">
                                    <h3 className="text-lg font-semibold">Instant API Testing</h3>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Drop your OpenAPI spec and watch it come alive in seconds.
                                    </p>
                                </div>
                                <ImportSpec onSpecLoaded={handleSpecLoaded}/>
                                <div className="mt-3 text-xs text-muted-foreground">
                                    Your data never leaves your browser • Works 100% offline
                                </div>
                            </div>
                        </div>
                    </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-20 bg-background bg-secondary">
                    <div className="px-4 md:px-20">
                        <div className="flex flex-col items-center justify-center space-y-4 text-center">
                            <div className="space-y-2">
                                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Zero Setup Required</h2>
                                <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                    No configuration, no accounts, no installation. Just upload your spec and start testing.
                                </p>
                            </div>
                        </div>
                        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
                            <Card className=" transition-all hover:border-primary/50 hover:shadow-md">
                                <CardHeader>
                                    <FileJson className="h-10 w-10 text-primary mb-2"/>
                                    <CardTitle>Instant Upload</CardTitle>
                                    <CardDescription>
                                        Drag, drop, done. Your API spec is live in seconds, not hours.
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                            <Card className=" transition-all hover:border-primary/50 hover:shadow-md">
                                <CardHeader>
                                    <Database className="h-10 w-10 text-primary mb-2"/>
                                    <CardTitle>Complete Privacy</CardTitle>
                                    <CardDescription>
                                        Your APIs never leave your browser. No cloud storage, no tracking, no vendor lock-in.
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                            <Card className=" transition-all hover:border-primary/50 hover:shadow-md">
                                <CardHeader>
                                    <Search className="h-10 w-10 text-primary mb-2"/>
                                    <CardTitle>Smart Search</CardTitle>
                                    <CardDescription>
                                        Find endpoints, parameters, or responses instantly. No more scrolling through docs.
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                            <Card className=" transition-all hover:border-primary/50 hover:shadow-md">
                                <CardHeader>
                                    <Code className="h-10 w-10 text-primary mb-2"/>
                                    <CardTitle>Live Testing</CardTitle>
                                    <CardDescription>
                                        Click to test real endpoints. No external tools or collection imports needed.
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                            <Card className=" transition-all hover:border-primary/50 hover:shadow-md">
                                <CardHeader>
                                    <Zap className="h-10 w-10 text-primary mb-2"/>
                                    <CardTitle>High Performance</CardTitle>
                                    <CardDescription>
                                        Load large specifications instantly. Optimized for speed and efficiency.
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                            <Card className=" transition-all hover:border-primary/50 hover:shadow-md">
                                <CardHeader>
                                    <Share2 className="h-10 w-10 text-primary mb-2"/>
                                    <CardTitle>Easy Sharing</CardTitle>
                                    <CardDescription>
                                        Generate shareable links in one click. Export to multiple formats.
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* Benefits Section */}
                <section id="benefits" className="py-20 bg-background">
                    <div className="container px-4 md:px-20">
                        <div className="grid gap-6 lg:grid-cols-[500px_1fr] lg:gap-12 xl:grid-cols-[550px_1fr]">
                            <div className="relative flex items-center justify-center order-last lg:order-first">
                                <div
                                    className="relative w-full rounded-lg overflow-hidden shadow-xl aspect-video">
                                    <img
                                        src="/img_1.png"
                                        alt="Developer using API Collection Tool"
                                        className="object-cover h-full w-full"
                                    />
                                    <div
                                        className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent"></div>
                                </div>
                            </div>
                            <div className="flex flex-col justify-center space-y-4">
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                                        Why Developers Choose YASP
                                    </h2>
                                    <p className="max-w-[600px] text-muted-foreground md:text-xl">
                                        Focus on building features instead of configuring tools. Get productive immediately.
                                    </p>
                                </div>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3">
                                        <div className="flex-shrink-0 mt-1">
                                            <Shield className="h-5 w-5 text-primary"/>
                                        </div>
                                        <div>
                                            <h3 className="font-medium">Time Savings</h3>
                                            <p className="text-muted-foreground">
                                                Skip the setup time. Start testing APIs immediately without complex configuration.
                                            </p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="flex-shrink-0 mt-1">
                                            <Shield className="h-5 w-5 text-primary"/>
                                        </div>
                                        <div>
                                            <h3 className="font-medium">Simplified Workflow</h3>
                                            <p className="text-muted-foreground">
                                                Everything in one place. No context switching between multiple tools.
                                            </p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="flex-shrink-0 mt-1">
                                            <Shield className="h-5 w-5 text-primary"/>
                                        </div>
                                        <div>
                                            <h3 className="font-medium">No Subscriptions</h3>
                                            <p className="text-muted-foreground">
                                                Free to use. No monthly fees or enterprise licensing costs.
                                            </p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="flex-shrink-0 mt-1">
                                            <Shield className="h-5 w-5 text-primary"/>
                                        </div>
                                        <div>
                                            <h3 className="font-medium">Data Security</h3>
                                            <p className="text-muted-foreground">
                                                Your sensitive API data stays private. No third-party servers, complete local control.
                                            </p>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section id="get-started" className="py-20 bg-background">
                    <div className="px-4 md:px-20">
                        <div className="flex flex-col items-center justify-center space-y-4 text-center">
                            <div className="space-y-2">
                                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                                    Ready to Get Started?
                                </h2>
                                <p className="max-w-[600px] mx-auto text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                    Upload your OpenAPI specification and start testing in seconds.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                <Button size="lg" asChild className="bg-primary hover:bg-primary/90">
                                    <Link to="/specs">Start Testing Now →</Link>
                                </Button>
                            </div>
                            <div className="text-sm text-muted-foreground mt-4">
                                100% private • Zero setup required
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-secondary py-6 md:py-8">
                <div
                    className="container flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-4 md:px-20">
                    <div className="flex items-center gap-2">
                        <FileJson className="h-5 w-5 text-primary"/>
                        <span className="text-sm font-semibold">YASP API Collection</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} API Collection. All rights reserved.
                    </p>
                    <div className="flex gap-4">
                        <Link to="#"
                              className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Privacy Policy
                        </Link>
                        <Link to="#"
                              className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}