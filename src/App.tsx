import { FileJson, Code, Database, Search, Zap, Share2, Shield } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/core/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card"

export default function LandingPage() {

    return (
        <div className="flex flex-col min-h-screen  ">
            <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10 px-12">
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
                            <Link to="/directory"
                                  className="text-sm font-medium hover:text-primary transition-colors">
                                Get Started
                            </Link>
                        </nav>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                 {/*Hero Section*/}
                <section className="py-16 md:py-28 ">
                    <div className="px-4 md:px-20 w-full">
                        <div className="grid gap-8 lg:grid-cols-[1fr_500px] lg:gap-12 xl:grid-cols-[1fr_550px]">
                            <div className="flex flex-col justify-center space-y-4">
                                <div className="space-y-2">
                                    <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-bold tracking-tighter text-foreground">
                                        Manage Your API Collections with Ease
                                    </h1>
                                    <p className="max-w-[600px] text-lg md:text-xl text-muted-foreground">
                                        A powerful tool for developers to upload, organize, and explore OpenAPI
                                        specifications in one centralized location.
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Button size="lg" asChild>
                                        <Link to="/directory">Get Started</Link>
                                    </Button>
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
                                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Key
                                    Features</h2>
                                <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                    Everything you need to manage and explore your API specifications
                                </p>
                            </div>
                        </div>
                        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
                            <Card className=" transition-all hover:border-primary/50 hover:shadow-md">
                                <CardHeader>
                                    <FileJson className="h-10 w-10 text-primary mb-2"/>
                                    <CardTitle>OpenAPI Support</CardTitle>
                                    <CardDescription>
                                        Upload and parse OpenAPI 3.x specifications with automatic validation
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                            <Card className=" transition-all hover:border-primary/50 hover:shadow-md">
                                <CardHeader>
                                    <Database className="h-10 w-10 text-primary mb-2"/>
                                    <CardTitle>Local Storage</CardTitle>
                                    <CardDescription>
                                        Save your API specifications locally using IndexedDB for quick access
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                            <Card className=" transition-all hover:border-primary/50 hover:shadow-md">
                                <CardHeader>
                                    <Search className="h-10 w-10 text-primary mb-2"/>
                                    <CardTitle>Powerful Search</CardTitle>
                                    <CardDescription>
                                        Quickly find the APIs you need with our powerful search functionality
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                            <Card className=" transition-all hover:border-primary/50 hover:shadow-md">
                                <CardHeader>
                                    <Code className="h-10 w-10 text-primary mb-2"/>
                                    <CardTitle>Interactive UI</CardTitle>
                                    <CardDescription>
                                        Explore endpoints, request bodies, and responses with our interactive UI
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                            <Card className=" transition-all hover:border-primary/50 hover:shadow-md">
                                <CardHeader>
                                    <Zap className="h-10 w-10 text-primary mb-2"/>
                                    <CardTitle>Fast Performance</CardTitle>
                                    <CardDescription>
                                        Optimized for speed and efficiency, even with large API specifications
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                            <Card className=" transition-all hover:border-primary/50 hover:shadow-md">
                                <CardHeader>
                                    <Share2 className="h-10 w-10 text-primary mb-2"/>
                                    <CardTitle>Export & Share</CardTitle>
                                    <CardDescription>Download and share your API specifications with your
                                        team</CardDescription>
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
                                        Why Developers Love Our Tool
                                    </h2>
                                    <p className="max-w-[600px] text-muted-foreground md:text-xl">
                                        Streamline your API development workflow and improve collaboration with your
                                        team
                                    </p>
                                </div>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3">
                                        <div className="flex-shrink-0 mt-1">
                                            <Shield className="h-5 w-5 text-primary"/>
                                        </div>
                                        <div>
                                            <h3 className="font-medium">Centralized API Documentation</h3>
                                            <p className="text-muted-foreground">
                                                Keep all your API specifications in one place for easy access and
                                                management
                                            </p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="flex-shrink-0 mt-1">
                                            <Shield className="h-5 w-5 text-primary"/>
                                        </div>
                                        <div>
                                            <h3 className="font-medium">Improved Developer Experience</h3>
                                            <p className="text-muted-foreground">
                                                Interactive UI makes it easy to understand and work with complex APIs
                                            </p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="flex-shrink-0 mt-1">
                                            <Shield className="h-5 w-5 text-primary"/>
                                        </div>
                                        <div>
                                            <h3 className="font-medium">Time-Saving Features</h3>
                                            <p className="text-muted-foreground">
                                                Quickly find and understand API endpoints without digging through
                                                documentation
                                            </p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="flex-shrink-0 mt-1">
                                            <Shield className="h-5 w-5 text-primary"/>
                                        </div>
                                        <div>
                                            <h3 className="font-medium">Better Collaboration</h3>
                                            <p className="text-muted-foreground">
                                                Share API specifications with your team to ensure everyone is on the
                                                same page
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
                                    Ready to Streamline Your API Workflow?
                                </h2>
                                <p className="max-w-[600px] mx-auto text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                    Get started with our API Collection tool today and experience the difference
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                <Button size="lg" asChild>
                                    <Link to="/directory">Launch App</Link>
                                </Button>
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