/**
 * Library Dashboard - Linear-Inspired Design
 * Main landing page showing all API specifications
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Search, Plus, Sparkles, Filter, BarChart3, FileCode2, Clock, Star } from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { GenerateSpecDialog } from '@/features/ai-catalyst/components/GenerateSpecDialog';
import { SpecCardSkeleton, StatsCardSkeleton } from '@/components/ui/skeleton';

export default function LibraryDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [specs, setSpecs] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    avgScore: 0,
    recentlyUpdated: 0,
  });

  // Mock data for demonstration - simulate loading
  useEffect(() => {
    const loadSpecs = async () => {
      setIsLoading(true);

      // Simulate API delay for loading state
      await new Promise(resolve => setTimeout(resolve, 800));

      const mockSpecs = [
        {
          id: '1',
          title: 'Payment Gateway API',
          description: 'Secure payment processing endpoints for e-commerce',
          version: '2.1.0',
          workspaceType: 'team',
          score: 94,
          updatedAt: new Date('2024-01-20'),
          tags: ['payments', 'stripe', 'production'],
        },
        {
          id: '2',
          title: 'User Management API',
          description: 'Authentication and user profile management',
          version: '1.5.2',
          workspaceType: 'personal',
          score: 87,
          updatedAt: new Date('2024-01-18'),
          tags: ['auth', 'users'],
        },
        {
          id: '3',
          title: 'Analytics Platform API',
          description: 'Real-time analytics and reporting endpoints',
          version: '3.0.0-beta',
          workspaceType: 'partner',
          score: 72,
          updatedAt: new Date('2024-01-15'),
          tags: ['analytics', 'reporting', 'beta'],
        },
      ];

      setSpecs(mockSpecs);
      setStats({
        total: mockSpecs.length,
        avgScore: Math.round(mockSpecs.reduce((acc, s) => acc + s.score, 0) / mockSpecs.length),
        recentlyUpdated: mockSpecs.filter(s => {
          const daysSince = (Date.now() - s.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
          return daysSince < 7;
        }).length,
      });

      setIsLoading(false);
    };

    loadSpecs();
  }, []);

  // Command palette keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const filteredSpecs = specs.filter(spec => {
    const matchesSearch = spec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         spec.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || spec.workspaceType === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <AppLayout padding={false}>
      {/* Hero Section with Gradient */}
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-background via-background to-muted/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.05),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(168,85,247,0.04),transparent_50%)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-16">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                API Specifications
              </h1>
              <p className="text-base text-muted-foreground">
                Design, validate, and manage your OpenAPI specifications
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowGenerateDialog(true)}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-medium text-card-foreground shadow-xs transition-all hover:bg-accent hover:shadow-sm"
              >
                <Sparkles className="h-4 w-4" />
                Generate with AI
              </button>
              <button className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md">
                <Plus className="h-4 w-4" />
                New Spec
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="mt-10 grid grid-cols-3 gap-4">
            {isLoading ? (
              <>
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
              </>
            ) : (
              <>
                <StatCard
                  icon={<FileCode2 className="h-5 w-5" />}
                  label="Total Specs"
                  value={stats.total}
                  delay="0ms"
                />
                <StatCard
                  icon={<BarChart3 className="h-5 w-5" />}
                  label="Avg Quality Score"
                  value={`${stats.avgScore}%`}
                  delay="50ms"
                />
                <StatCard
                  icon={<Clock className="h-5 w-5" />}
                  label="Updated This Week"
                  value={stats.recentlyUpdated}
                  delay="100ms"
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <aside className="w-56 flex-shrink-0">
            <div className="sticky top-8 space-y-6">
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Workspace
                </h3>
                <nav className="space-y-1">
                  <FilterButton
                    active={selectedFilter === 'all'}
                    onClick={() => setSelectedFilter('all')}
                    count={specs.length}
                  >
                    All Specs
                  </FilterButton>
                  <FilterButton
                    active={selectedFilter === 'personal'}
                    onClick={() => setSelectedFilter('personal')}
                    count={specs.filter(s => s.workspaceType === 'personal').length}
                  >
                    Personal
                  </FilterButton>
                  <FilterButton
                    active={selectedFilter === 'team'}
                    onClick={() => setSelectedFilter('team')}
                    count={specs.filter(s => s.workspaceType === 'team').length}
                  >
                    Team
                  </FilterButton>
                  <FilterButton
                    active={selectedFilter === 'partner'}
                    onClick={() => setSelectedFilter('partner')}
                    count={specs.filter(s => s.workspaceType === 'partner').length}
                  >
                    Partner
                  </FilterButton>
                  <FilterButton
                    active={selectedFilter === 'public'}
                    onClick={() => setSelectedFilter('public')}
                    count={specs.filter(s => s.workspaceType === 'public').length}
                  >
                    Public
                  </FilterButton>
                </nav>
              </div>
            </div>
          </aside>

          {/* Specs Grid */}
          <main className="flex-1">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="group relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-foreground" />
                <input
                  type="text"
                  placeholder="Search specifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-card pl-10 pr-20 text-sm text-card-foreground shadow-xs outline-none ring-0 transition-all placeholder:text-muted-foreground focus:border-ring focus:shadow-sm"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground opacity-60">
                  ⌘K
                </kbd>
              </div>
            </div>

            {/* Specs Grid or Empty State */}
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                <SpecCardSkeleton />
                <SpecCardSkeleton />
                <SpecCardSkeleton />
                <SpecCardSkeleton />
              </div>
            ) : filteredSpecs.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredSpecs.map((spec, index) => (
                  <SpecCard key={spec.id} spec={spec} index={index} />
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </main>
        </div>
      </div>

      {/* AI Spec Generation Dialog */}
      <GenerateSpecDialog
        open={showGenerateDialog}
        onClose={() => setShowGenerateDialog(false)}
        onGenerated={(yamlSpec) => {
          // TODO: Parse and save the generated spec
          console.log('Generated spec:', yamlSpec);
          setShowGenerateDialog(false);

          // Show success toast
          toast.success('Specification generated successfully', {
            description: 'Your AI-generated OpenAPI spec is ready. Save it to your library to continue.',
            duration: 5000,
          });

          // In a real implementation, this would:
          // 1. Parse the YAML to get title, version, etc.
          // 2. Create a new spec object
          // 3. Save to IndexedDB
          // 4. Add to specs state
        }}
        groqApiKey={import.meta.env.VITE_GROQ_API_KEY || ''}
        geminiApiKey={import.meta.env.VITE_GEMINI_API_KEY || ''}
      />
    </AppLayout>
  );
}

// ==================== Sub-Components ====================

function StatCard({ icon, label, value, delay }: any) {
  return (
    <div
      className="rounded-lg border border-border bg-card p-4 shadow-card transition-all hover:shadow-sm"
      style={{ animationDelay: delay }}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
          {icon}
        </div>
        <div>
          <div className="text-2xl font-semibold tracking-tight text-card-foreground">
            {value}
          </div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </div>
    </div>
  );
}

function FilterButton({ active, onClick, count, children }: any) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-all ${
        active
          ? 'bg-accent text-accent-foreground shadow-xs'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <span>{children}</span>
      <span className={`text-xs ${active ? 'text-accent-foreground/70' : 'text-muted-foreground/50'}`}>
        {count}
      </span>
    </button>
  );
}

function SpecCard({ spec, index }: any) {
  const scoreColor = spec.score >= 80 ? 'text-success' : spec.score >= 50 ? 'text-warning' : 'text-destructive';
  const scoreRing = spec.score >= 80 ? 'stroke-success' : spec.score >= 50 ? 'stroke-warning' : 'stroke-destructive';

  return (
    <Link
      to={`/spec/${spec.id}`}
      className="group block rounded-lg border border-border bg-card p-5 shadow-card transition-all hover:border-ring hover:shadow-md"
      style={{
        animation: 'fadeInUp 0.4s ease-out forwards',
        animationDelay: `${index * 50}ms`,
        opacity: 0,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-card-foreground group-hover:text-primary transition-colors">
                {spec.title}
              </h3>
              <WorkspaceBadge type={spec.workspaceType} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {spec.description}
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {spec.tags.map((tag: string) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-sm bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>v{spec.version}</span>
            <span>•</span>
            <span>{formatRelativeTime(spec.updatedAt)}</span>
          </div>
        </div>

        {/* Governance Score Ring */}
        <div className="relative flex h-14 w-14 items-center justify-center">
          <svg className="h-full w-full -rotate-90 transform">
            <circle
              cx="28"
              cy="28"
              r="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-muted/20"
            />
            <circle
              cx="28"
              cy="28"
              r="24"
              fill="none"
              strokeWidth="2"
              strokeDasharray={`${2 * Math.PI * 24}`}
              strokeDashoffset={`${2 * Math.PI * 24 * (1 - spec.score / 100)}`}
              strokeLinecap="round"
              className={`${scoreRing} transition-all duration-500`}
            />
          </svg>
          <span className={`absolute text-sm font-bold ${scoreColor}`}>
            {spec.score}
          </span>
        </div>
      </div>
    </Link>
  );
}

function WorkspaceBadge({ type }: { type: string }) {
  const colors = {
    personal: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    team: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    partner: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    public: 'bg-green-500/10 text-green-600 dark:text-green-400',
  };

  return (
    <span className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-xs font-medium ${colors[type as keyof typeof colors]}`}>
      {type}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <FileCode2 className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-6 text-lg font-semibold text-card-foreground">
        No specifications yet
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Get started by creating your first API specification or importing an existing OpenAPI file.
      </p>
      <div className="mt-6 flex gap-3">
        <button className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-medium text-card-foreground shadow-xs transition-all hover:bg-accent hover:shadow-sm">
          <Plus className="h-4 w-4" />
          Create Spec
        </button>
        <button className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md">
          <Sparkles className="h-4 w-4" />
          Generate with AI
        </button>
      </div>
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Add keyframe animation to CSS (client-side only)
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(styleSheet);
}
