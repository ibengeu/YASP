/**
 * Dashboard - API Governance Overview
 * Transformed with modern KPI cards and metrics
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { MoreVertical, Calendar, Download, Settings } from 'lucide-react';
import { PageHeader } from '@/components/navigation/PageHeader';
import { KPICard } from '@/components/dashboard/KPICard';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { GenerateSpecDialog } from '@/features/ai-catalyst/components/GenerateSpecDialog';
import { ImportSpecDialog } from '@/features/library/components/ImportSpecDialog';
import { idbStorage } from '@/core/storage/idb-storage';
import type { OpenApiDocument } from '@/core/storage/storage-schema';
import { SpecTable } from '@/components/dashboard/SpecTable';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type TimeRange = '7' | '30' | '90';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [specs, setSpecs] = useState<OpenApiDocument[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('30');
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  useEffect(() => {
    loadSpecs();
  }, []);

  const loadSpecs = async () => {
    setIsLoading(true);
    try {
      const allSpecs = await idbStorage.getAllSpecs();
      setSpecs(allSpecs);
    } catch (error) {
      console.error('Failed to load specs:', error);
      // Mitigation for OWASP A09:2025 – Security Logging and Monitoring Failures:
      // Log errors without exposing sensitive implementation details to users
      toast.error('Failed to load specifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await idbStorage.deleteSpec(id);
      toast.success('Specification deleted');
      loadSpecs();
    } catch (error) {
      console.error('Failed to delete spec:', error);
      toast.error('Failed to delete specification');
    }
  };

  // Calculate primary KPIs
  const totalSpecs = specs.length;
  const avgScore = specs.length > 0
    ? Math.round(specs.reduce((sum, spec) => sum + (spec.metadata.score || 0), 0) / specs.length)
    : 0;
  const passRate = avgScore;
  const policyCoverage = specs.length > 0 ? Math.round((specs.filter(s => (s.metadata.score || 0) >= 70).length / specs.length) * 100) : 0;
  const breakingChangesPrevented = specs.filter(s => s.metadata.tags?.includes('validated')).length;
  const authCoverage = specs.length > 0 ? Math.round((specs.filter(s => s.content.includes('securitySchemes')).length / specs.length) * 100) : 0;

  // Secondary KPIs
  const deprecatedUsage = specs.length > 0 ? Math.round((specs.filter(s => s.content.includes('deprecated: true')).length / specs.length) * 100) : 0;
  const reuseRatio = 68; // Placeholder - would calculate from shared components

  // Mock chart data (would come from historical metrics)
  const qualityTrendData = [
    { month: 'Jan', quality: 85, compliance: 78 },
    { month: 'Feb', quality: 87, compliance: 82 },
    { month: 'Mar', quality: 89, compliance: 85 },
    { month: 'Apr', quality: 91, compliance: 88 },
    { month: 'May', quality: 92, compliance: 87 },
  ];

  const remediationData = [
    { week: 'W1', avgDays: 4.2 },
    { week: 'W2', avgDays: 3.8 },
    { week: 'W3', avgDays: 3.5 },
    { week: 'W4', avgDays: 3.2 },
  ];

  return (
    <div className="bg-[#FAFBFC] dark:bg-[#0E1420] min-h-screen">
      <PageHeader
        title="API Governance Dashboard"
        description="Leading indicators of API quality and compliance"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Time Range Selector */}
            <div className="flex items-center gap-1 bg-card border border-border rounded p-1">
              {(['7', '30', '90'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {range}d
                </button>
              ))}
            </div>

            {/* Options Menu */}
            <div className="relative">
              <button
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded text-sm font-medium hover:bg-muted transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
                <span className="hidden sm:inline">Options</span>
              </button>

              {showOptionsMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowOptionsMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-20 py-1">
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors text-left"
                      onClick={() => {
                        setShowOptionsMenu(false);
                        toast.info('Custom date range coming soon');
                      }}
                    >
                      <Calendar className="w-4 h-4" />
                      Custom Date Range
                    </button>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors text-left"
                      onClick={() => {
                        setShowOptionsMenu(false);
                        toast.info('Export report coming soon');
                      }}
                    >
                      <Download className="w-4 h-4" />
                      Export Report
                    </button>
                    <div className="my-1 border-t border-border" />
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors text-left"
                      onClick={() => {
                        setShowOptionsMenu(false);
                        toast.info('Alert settings coming soon');
                      }}
                    >
                      <Settings className="w-4 h-4" />
                      Alert Settings
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        }
      />

      <div className="px-4 md:px-6 lg:px-8 pb-8">
        {/* Primary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 mt-6">
          <KPICard
            label="Spec / Lint Pass Rate"
            value={passRate}
            unit="%"
            trend="up"
            delta={3}
            sparkline={[85, 87, 86, 89, 92]}
            tooltip="Percentage of specs passing all quality checks"
          />
          <KPICard
            label="Policy Coverage"
            value={policyCoverage}
            unit="%"
            trend="up"
            delta={5}
            sparkline={[78, 82, 85, 88, 87]}
            tooltip="APIs meeting governance policy requirements"
          />
          <KPICard
            label="Breaking Changes Prevented"
            value={breakingChangesPrevented}
            trend="up"
            delta={2}
            sparkline={[10, 12, 13, 14, 15]}
            tooltip="Number of breaking changes caught before deployment"
          />
          <KPICard
            label="Auth Coverage"
            value={authCoverage}
            unit="%"
            trend="up"
            delta={1}
            sparkline={[90, 91, 92, 93, 94]}
            tooltip="APIs with proper authentication configured"
          />
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <KPICard
            label="Mean Time to Remediate"
            value={3.2}
            unit=" days"
            trend="down"
            delta={-15}
            invertColors
            sparkline={[4.2, 3.8, 3.5, 3.2]}
            tooltip="Average time to fix quality issues"
          />
          <KPICard
            label="Deprecated API Usage"
            value={deprecatedUsage}
            unit="%"
            trend="down"
            delta={-3}
            invertColors
            sparkline={[8, 7, 6, 5]}
            tooltip="Percentage of APIs using deprecated features"
          />
          <KPICard
            label="API Reuse Ratio"
            value={reuseRatio}
            unit="%"
            trend="up"
            delta={4}
            sparkline={[60, 63, 65, 67, 68]}
            tooltip="Component reuse across API specifications"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <ChartCard title="Quality Metrics Trend">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={qualityTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                  }}
                />
                <Line type="monotone" dataKey="quality" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="compliance" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Remediation Performance">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={remediationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="week" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                  }}
                />
                <Area type="monotone" dataKey="avgDays" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Specifications Table */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-base font-semibold text-card-foreground">
              API Specifications ({totalSpecs})
            </h3>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-border border-r-primary"></div>
              </div>
            ) : specs.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-muted-foreground mb-4">
                  No specifications yet
                </div>
                <button
                  onClick={() => setShowGenerateDialog(true)}
                  className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:opacity-90 transition-opacity"
                >
                  Create Your First Spec
                </button>
              </div>
            ) : (
              <SpecTable specs={specs} onDelete={handleDelete} />
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <GenerateSpecDialog
        open={showGenerateDialog}
        onClose={() => setShowGenerateDialog(false)}
        onGenerated={async (yamlSpec) => {
          const yaml = await import('yaml');
          const parsed = yaml.parse(yamlSpec);

          const newSpec = await idbStorage.createSpec({
            type: 'openapi',
            content: yamlSpec,
            title: parsed.info?.title || 'Generated API',
            version: parsed.info?.version || '1.0.0',
            description: parsed.info?.description,
            metadata: {
              score: 0,
              tags: ['ai-generated'],
              workspaceType: 'personal',
              syncStatus: 'offline',
              isDiscoverable: false,
            },
          });

          toast.success('Specification generated successfully');
          navigate(`/editor/${newSpec.id}`);
        }}
      />

      <ImportSpecDialog open={showImportDialog} onOpenChange={setShowImportDialog} />
    </div>
  );
}
