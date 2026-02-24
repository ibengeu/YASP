/**
 * SpecDocsPage — OpenAPI spec viewer composed from DocumentationLayout slots.
 * Route: /catalog/:id
 *
 * Loads the spec by ID from IDB, then composes the page using:
 *   - <DocumentationLayout topNav={…} sidebar={…} rightPanel={…}>
 *       <DocsMainContent … />   ← main content slot
 *     </DocumentationLayout>
 *
 * Each slot is an independent component — easy to swap or extend.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Terminal, ChevronLeft, Menu, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import yaml from 'yaml';
import { idbStorage } from '@/core/storage/idb-storage';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
    DocumentationLayout,
    DocTopNav,
} from '@/components/documentation/DocumentationLayout';
import { DocsSidebar } from '@/components/catalog/docs-view/DocsSidebar';
import { DocsMainContent } from '@/components/catalog/docs-view/DocsMainContent';
import { DocsRightPanel } from '@/components/catalog/docs-view/DocsRightPanel';
import { DocsFooter } from '@/components/catalog/docs-view/DocsFooter';
import { parseEndpoints, groupByTag, extractDataModels, substituteServerVariables } from '@/components/catalog/docs-view/utils';
import type { ParsedOpenAPISpec, ParsedEndpoint, EndpointGroup, SchemaEntry } from '@/components/catalog/docs-view/types';

// ── Sub-components ───────────────────────────────────────────────────────────

interface SpecTopNavProps {
    title: string;
    version: string;
    mobileSidebar: React.ReactNode;
    onBack: () => void;
}

function SpecTopNav({ title, version, mobileSidebar, onBack }: SpecTopNavProps) {
    const { theme, setTheme } = useTheme();

    return (
        <DocTopNav>
            <div className="flex items-center gap-3 min-w-0">
                {/* Mobile sidebar toggle */}
                <div className="lg:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 cursor-pointer" aria-label="Open navigation">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-72">
                            {mobileSidebar}
                        </SheetContent>
                    </Sheet>
                </div>

                <button
                    onClick={onBack}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                    aria-label="Back to Catalog"
                >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Catalog</span>
                </button>

                <Separator orientation="vertical" className="h-4 shrink-0" />

                <span className="text-sm font-semibold text-foreground truncate">
                    {title}
                </span>
                <span className="text-xs text-muted-foreground hidden sm:inline shrink-0">
                    v{version}
                </span>
            </div>

            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer relative shrink-0"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle theme"
            >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
        </DocTopNav>
    );
}

interface SpecSidebarProps {
    groups: EndpointGroup[];
    dataModels: SchemaEntry[];
    selectedEndpoint: ParsedEndpoint | null;
    selectedModel?: SchemaEntry | null;
    filterQuery: string;
    onSelect: (ep: ParsedEndpoint) => void;
    onSelectModel?: (entry: SchemaEntry) => void;
    onFilterChange: (q: string) => void;
    className?: string;
}

function SpecSidebar({ groups, dataModels, selectedEndpoint, selectedModel, filterQuery, onSelect, onSelectModel, onFilterChange, className }: SpecSidebarProps) {
    return (
        <DocsSidebar
            groups={groups}
            selectedEndpoint={selectedEndpoint}
            onSelectEndpoint={onSelect}
            dataModels={dataModels}
            filterQuery={filterQuery}
            setFilterQuery={onFilterChange}
            selectedModel={selectedModel}
            onSelectModel={onSelectModel}
            className={className}
        />
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SpecDocsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [parsedSpec, setParsedSpec] = useState<ParsedOpenAPISpec | null>(null);
    const [groups, setGroups] = useState<EndpointGroup[]>([]);
    const [dataModels, setDataModels] = useState<SchemaEntry[]>([]);
    const [selectedEndpoint, setSelectedEndpoint] = useState<ParsedEndpoint | null>(null);
    const [selectedModel, setSelectedModel] = useState<SchemaEntry | null>(null);
    const [filterQuery, setFilterQuery] = useState('');
    const [showMobileConsole, setShowMobileConsole] = useState(false);

    useEffect(() => {
        if (!id) { navigate('/catalog', { replace: true }); return; }

        const load = async () => {
            setIsLoading(true);
            try {
                const doc = await idbStorage.getSpec(id);
                if (!doc) { setLoadError('API not found'); return; }

                const parsed: ParsedOpenAPISpec = typeof doc.content === 'string'
                    ? yaml.parse(doc.content) as ParsedOpenAPISpec
                    : doc.content as unknown as ParsedOpenAPISpec;

                setParsedSpec(parsed);
                const eps = parseEndpoints(parsed);
                setGroups(groupByTag(eps));
                setDataModels(extractDataModels(parsed));
                if (eps.length > 0) setSelectedEndpoint(eps[0]);
            } catch {
                setLoadError('Failed to load API specification');
            } finally {
                setIsLoading(false);
            }
        };

        load();
    }, [id, navigate]);

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent mb-2" />
                    <p className="text-sm text-muted-foreground">Loading documentation…</p>
                </div>
            </div>
        );
    }

    if (loadError || !parsedSpec) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-background p-6">
                <Terminal className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground font-medium mb-4">
                    {loadError ?? 'Failed to load documentation'}
                </p>
                <Button onClick={() => navigate('/catalog')} variant="outline" size="sm">
                    Back to Catalog
                </Button>
            </div>
        );
    }

    // Mitigation for OWASP A07:2025 – Injection: server variables substituted from spec defaults only,
    // never from user input
    const rawServer = parsedSpec.servers?.[0];
    const baseUrl = rawServer
        ? substituteServerVariables(rawServer.url, rawServer.variables ?? {})
        : 'https://api.example.com';

    const handleSelectModel = (entry: SchemaEntry) => {
        setSelectedModel(entry);
        setSelectedEndpoint(null);
    };
    const handleSelectEndpoint = (ep: ParsedEndpoint) => {
        setSelectedEndpoint(ep);
        setSelectedModel(null);
    };

    const filteredGroups = groups
        .map((g) => ({
            ...g,
            endpoints: g.endpoints.filter(
                (e) =>
                    e.path.toLowerCase().includes(filterQuery.toLowerCase()) ||
                    e.summary?.toLowerCase().includes(filterQuery.toLowerCase())
            ),
        }))
        .filter((g) => g.endpoints.length > 0);

    const sidebar = (
        <SpecSidebar
            groups={filteredGroups}
            dataModels={dataModels}
            selectedEndpoint={selectedEndpoint}
            selectedModel={selectedModel}
            filterQuery={filterQuery}
            onSelect={handleSelectEndpoint}
            onSelectModel={handleSelectModel}
            onFilterChange={setFilterQuery}
        />
    );

    const mobileSidebar = (
        <SpecSidebar
            groups={filteredGroups}
            dataModels={dataModels}
            selectedEndpoint={selectedEndpoint}
            selectedModel={selectedModel}
            filterQuery={filterQuery}
            onSelect={(ep) => { handleSelectEndpoint(ep); setShowMobileConsole(false); }}
            onSelectModel={(entry) => { handleSelectModel(entry); setShowMobileConsole(false); }}
            onFilterChange={setFilterQuery}
            className="w-full h-full border-none bg-transparent"
        />
    );

    return (
        <DocumentationLayout
            topNav={
                <SpecTopNav
                    title={parsedSpec.info.title}
                    version={parsedSpec.info.version}
                    mobileSidebar={mobileSidebar}
                    onBack={() => navigate('/catalog')}
                />
            }
            sidebar={sidebar}
            rightPanel={
                <DocsRightPanel
                    endpoint={selectedEndpoint}
                    baseUrl={baseUrl}
                    spec={parsedSpec}
                    className={cn(showMobileConsole ? 'flex' : 'hidden lg:flex')}
                />
            }
        >
            {/* Main content — fills the scroll area */}
            <DocsMainContent
                endpoint={selectedEndpoint}
                baseUrl={baseUrl}
                spec={parsedSpec}
                selectedModel={selectedModel}
                onBackFromModel={() => setSelectedModel(null)}
                className={cn(showMobileConsole ? 'hidden lg:block' : 'block')}
            />

            <DocsFooter />

            {/* Mobile toggle for the right panel */}
            <button
                onClick={() => setShowMobileConsole((v) => !v)}
                className="lg:hidden fixed bottom-6 right-6 z-50 bg-foreground text-background rounded-full p-4 shadow-lg flex items-center justify-center hover:opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95 cursor-pointer"
                aria-label="Toggle console"
            >
                <Terminal className="h-6 w-6" />
            </button>
        </DocumentationLayout>
    );
}
