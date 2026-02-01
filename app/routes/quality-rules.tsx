/**
 * Policy Management - Configure governance rules
 * Transformed with modern PolicyTable component and PageHeader
 */

import { useState, useMemo } from 'react';
import { Plus, CheckCircle, AlertCircle, AlertTriangle, Search, Filter } from 'lucide-react';
import { PageHeader } from '@/components/navigation/PageHeader';
import { PolicyTable, type ComplianceRule } from '@/components/policies/PolicyTable';
import { CreatePolicyDrawer } from '@/components/policies/CreatePolicyDrawer';

export default function QualityRulesPage() {
  const [rules, setRules] = useState<ComplianceRule[]>([
    {
      id: '1',
      name: 'API Must Have Description',
      category: 'Documentation',
      severity: 'error',
      enabled: true,
      description: 'All APIs must include a description field in the info object',
    },
    {
      id: '2',
      name: 'Operations Must Have Summary',
      category: 'Documentation',
      severity: 'warning',
      enabled: true,
      description: 'Each operation should have a summary for better documentation',
    },
    {
      id: '3',
      name: 'Security Scheme Required',
      category: 'Security',
      severity: 'error',
      enabled: true,
      description: 'API must define at least one security scheme',
    },
    {
      id: '4',
      name: 'Response Schemas Defined',
      category: 'Schema',
      severity: 'warning',
      enabled: true,
      description: 'All responses should have defined schemas',
    },
    {
      id: '5',
      name: 'Version Format Compliance',
      category: 'Versioning',
      severity: 'info',
      enabled: false,
      description: 'API version should follow semantic versioning (e.g., 1.0.0)',
    },
    {
      id: '6',
      name: 'Rate Limiting Headers',
      category: 'Best Practices',
      severity: 'info',
      enabled: false,
      description: 'Endpoints should document rate limiting headers',
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);

  // Filtered policies using useMemo for performance
  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      const matchesSearch =
        searchQuery === '' ||
        rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = categoryFilter === 'all' || rule.category === categoryFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'enabled' && rule.enabled) ||
        (statusFilter === 'disabled' && !rule.enabled);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [rules, searchQuery, categoryFilter, statusFilter]);

  const toggleRule = (id: string) => {
    setRules((prev) => prev.map((rule) => (rule.id === id ? { ...rule, enabled: !rule.enabled } : rule)));
  };

  // Calculate statistics
  const totalPolicies = rules.length;
  const enabledCount = rules.filter((r) => r.enabled).length;
  const avgCoverage = Math.round((enabledCount / totalPolicies) * 100);
  const errorCount = rules.filter((r) => r.enabled && r.severity === 'error').length;
  const criticalCount = errorCount; // Critical policies are error-level

  return (
    <div className="bg-[#FAFBFC] dark:bg-[#0E1420] min-h-screen">
      <PageHeader
        title="Policy Management"
        description="Configure and monitor API governance policies"
        actions={
          <button
            className="px-3 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:opacity-90 transition-opacity flex items-center gap-2"
            onClick={() => setShowCreateDrawer(true)}
          >
            <Plus className="w-4 h-4" />
            Create Policy
          </button>
        }
      />

      <div className="px-4 md:px-6 lg:px-8 pb-8 space-y-6 mt-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Total Policies</span>
              <div className="p-1.5 bg-muted rounded border border-border">
                <CheckCircle className="w-3.5 h-3.5 text-foreground" />
              </div>
            </div>
            <div className="text-2xl font-medium text-card-foreground tracking-tight">
              {totalPolicies}
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Enabled</span>
              <div className="p-1.5 bg-green-500/10 rounded border border-green-500/20">
                <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="text-2xl font-medium text-card-foreground tracking-tight">
              {enabledCount}
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Avg Coverage</span>
              <div className="p-1.5 bg-blue-500/10 rounded border border-blue-500/20">
                <AlertCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="text-2xl font-medium text-card-foreground tracking-tight">
              {avgCoverage}%
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Critical</span>
              <div className="p-1.5 bg-red-500/10 rounded border border-red-500/20">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="text-2xl font-medium text-card-foreground tracking-tight">
              {criticalCount}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search */}
          <div className="flex-1 w-full relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search policies by name or description..."
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-md text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-card border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary appearance-none min-w-[160px]"
            >
              <option value="all">All Categories</option>
              <option value="Documentation">Documentation</option>
              <option value="Security">Security</option>
              <option value="Schema">Schema</option>
              <option value="Versioning">Versioning</option>
              <option value="Best Practices">Best Practices</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-card border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary min-w-[140px]"
          >
            <option value="all">All Status</option>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>

        {/* Policy Table */}
        <PolicyTable policies={filteredRules} onToggle={toggleRule} />

        {/* Results Count */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredRules.length} of {rules.length} policies
        </div>
      </div>

      {/* Create Policy Drawer */}
      <CreatePolicyDrawer
        isOpen={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        onSuccess={(newPolicy) => {
          setShowCreateDrawer(false);
          // Add new policy to the list
          setRules((prev) => [
            ...prev,
            {
              id: newPolicy.id,
              name: newPolicy.name,
              category: newPolicy.category,
              severity: newPolicy.severity,
              enabled: newPolicy.enabled,
              description: newPolicy.description,
            },
          ]);
        }}
      />
    </div>
  );
}
