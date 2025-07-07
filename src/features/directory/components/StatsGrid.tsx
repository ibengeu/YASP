import React from 'react';
import { FileJson, Users, Eye, Activity } from 'lucide-react';

interface Spec {
  id: string | number;
  title: string;
  version: string;
  description?: string;
  createdAt: string | number | Date;
  workspaceType?: 'Personal' | 'Team' | 'Partner' | 'Public';
  tags?: string[];
  isDiscoverable?: boolean;
}

interface StatsGridProps {
  specs: Spec[];
}

export function StatsGrid({ specs }: StatsGridProps) {
  const totalSpecs = specs.length;
  const teamSpecs = specs.filter(s => s.workspaceType === 'Team').length;
  const publicSpecs = specs.filter(s => s.isDiscoverable).length;
  const recentSpecs = specs.filter(s => {
    const now = new Date();
    const createdDate = new Date(s.createdAt);
    const diffInDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays <= 7;
  }).length;

  const StatCard = ({ 
    icon: Icon, 
    value, 
    label, 
    colorClass 
  }: { 
    icon: React.ComponentType<any>; 
    value: number; 
    label: string; 
    colorClass: string;
  }) => (
    <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-2">
        <div className={`text-2xl font-bold ${colorClass}`}>
          {value}
        </div>
        <Icon className={`w-5 h-5 ${colorClass}`} />
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard
        icon={FileJson}
        value={totalSpecs}
        label="Total Specs"
        colorClass="text-chart-1"
      />
      <StatCard
        icon={Users}
        value={teamSpecs}
        label="Team Workspaces"
        colorClass="text-chart-2"
      />
      <StatCard
        icon={Eye}
        value={publicSpecs}
        label="Public Specs"
        colorClass="text-chart-3"
      />
      <StatCard
        icon={Activity}
        value={recentSpecs}
        label="Recently Added"
        colorClass="text-chart-4"
      />
    </div>
  );
}