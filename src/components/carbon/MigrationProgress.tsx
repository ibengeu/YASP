import React from 'react';
import { CarbonCard, CarbonCardHeader, CarbonCardTitle, CarbonCardDescription, CarbonCardContent } from './CarbonCard';
import { Badge } from '../ui/badge';
import { CheckCircle, Circle, AlertTriangle } from 'lucide-react';

interface MigrationItem {
  name: string;
  status: 'completed' | 'in-progress' | 'pending';
  phase: string;
  description: string;
}

const migrationItems: MigrationItem[] = [
  // Phase 1: Foundation
  {
    name: 'Design Tokens',
    status: 'completed',
    phase: 'Phase 1: Foundation',
    description: 'Updated color palette, typography, and spacing to Carbon standards'
  },
  {
    name: 'IBM Plex Font',
    status: 'completed',
    phase: 'Phase 1: Foundation',
    description: 'Integrated IBM Plex Sans and Mono font families'
  },
  {
    name: 'Carbon Theme Provider',
    status: 'completed',
    phase: 'Phase 1: Foundation',
    description: 'Set up Carbon theme context and dark mode support'
  },
  
  // Phase 2: Core Components
  {
    name: 'Button Component',
    status: 'completed',
    phase: 'Phase 2: Core Components',
    description: 'Updated button variants to match Carbon button system'
  },
  {
    name: 'Input Component',
    status: 'completed',
    phase: 'Phase 2: Core Components',
    description: 'Applied Carbon text input styling and interaction patterns'
  },
  {
    name: 'Badge/Tag Component',
    status: 'completed',
    phase: 'Phase 2: Core Components',
    description: 'Redesigned badges to follow Carbon tag specifications'
  },
  {
    name: 'Card/Tile Component',
    status: 'completed',
    phase: 'Phase 2: Core Components',
    description: 'Created Carbon-style tile components with minimal elevation'
  },
  {
    name: 'Form Components',
    status: 'completed',
    phase: 'Phase 2: Core Components',
    description: 'Completed select, input, and switch components with Carbon patterns'
  },
  {
    name: 'Modal/Dialog',
    status: 'completed',
    phase: 'Phase 2: Core Components',
    description: 'Updated modal components with Carbon styling and structured layout'
  },
  
  // Phase 3: Complex Components
  {
    name: 'Data Table',
    status: 'pending',
    phase: 'Phase 3: Complex Components',
    description: 'Migrate table component to Carbon DataTable patterns'
  },
  {
    name: 'Navigation Components',
    status: 'completed',
    phase: 'Phase 3: Complex Components',
    description: 'Completed header, layout, and breadcrumb components with Carbon patterns'
  },
  {
    name: 'Filter & Search',
    status: 'pending',
    phase: 'Phase 3: Complex Components',
    description: 'Redesign filter sidebar and search functionality'
  },
  
  // Phase 4: Application Features
  {
    name: 'API Explorer',
    status: 'pending',
    phase: 'Phase 4: Application Features',
    description: 'Update API documentation and testing interface'
  },
  {
    name: 'API Catalog',
    status: 'pending',
    phase: 'Phase 4: Application Features',
    description: 'Redesign API catalog with Carbon patterns'
  },
  {
    name: 'Authentication Screens',
    status: 'pending',
    phase: 'Phase 4: Application Features',
    description: 'Update login, signup, and profile management'
  },
  {
    name: 'Workspace Management',
    status: 'pending',
    phase: 'Phase 4: Application Features',
    description: 'Apply Carbon styling to workspace components'
  }
];

export function MigrationProgress() {
  const getStatusIcon = (status: MigrationItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'in-progress':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'pending':
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: MigrationItem['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'in-progress':
        return <Badge variant="warning">In Progress</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const groupedItems = migrationItems.reduce((acc, item) => {
    if (!acc[item.phase]) {
      acc[item.phase] = [];
    }
    acc[item.phase].push(item);
    return acc;
  }, {} as Record<string, MigrationItem[]>);

  const totalItems = migrationItems.length;
  const completedItems = migrationItems.filter(item => item.status === 'completed').length;
  const inProgressItems = migrationItems.filter(item => item.status === 'in-progress').length;
  const progressPercentage = Math.round((completedItems / totalItems) * 100);

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <CarbonCard>
        <CarbonCardHeader>
          <CarbonCardTitle>Carbon Design System Migration Progress</CarbonCardTitle>
          <CarbonCardDescription>
            Tracking the migration from Apple HCI guidelines to IBM Carbon Design System
          </CarbonCardDescription>
        </CarbonCardHeader>
        
        <CarbonCardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-semibold text-primary mb-1">{progressPercentage}%</div>
              <div className="text-sm text-muted-foreground">Overall Progress</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-semibold text-success mb-1">{completedItems}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-semibold text-warning mb-1">{inProgressItems}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-semibold text-muted-foreground mb-1">{totalItems - completedItems - inProgressItems}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Migration Progress</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="w-full bg-secondary border border-border h-2">
              <div 
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </CarbonCardContent>
      </CarbonCard>

      {/* Phase Breakdown */}
      {Object.entries(groupedItems).map(([phase, items]) => (
        <CarbonCard key={phase}>
          <CarbonCardHeader>
            <CarbonCardTitle>{phase}</CarbonCardTitle>
            <CarbonCardDescription>
              {items.filter(item => item.status === 'completed').length} of {items.length} items completed
            </CarbonCardDescription>
          </CarbonCardHeader>
          
          <CarbonCardContent>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border border-border bg-background">
                  <div className="mt-0.5">
                    {getStatusIcon(item.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold">{item.name}</h4>
                      {getStatusBadge(item.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CarbonCardContent>
        </CarbonCard>
      ))}
    </div>
  );
}