import React from 'react';
import { CarbonCard, CarbonCardHeader, CarbonCardTitle, CarbonCardDescription, CarbonCardContent } from './CarbonCard';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  CheckCircle, 
  Monitor, 
  Smartphone, 
  Tablet,
  Layout,
  Navigation,
  Palette,
  Grid,
  Eye,
  Accessibility
} from 'lucide-react';

/**
 * Carbon Header Design Guidelines Documentation
 * 
 * This component documents the header redesign decisions and implementation
 * guidelines for maintaining consistency across the application.
 */

export function HeaderDesignGuide() {
  const designPrinciples = [
    {
      icon: Layout,
      title: 'Consistent Structure',
      description: 'Fixed 64px height following Carbon header patterns with proper z-index layering',
      status: 'implemented'
    },
    {
      icon: Navigation,
      title: 'Clear Information Hierarchy',
      description: 'Brand → Navigation → Context (Workspace) → Actions → User - left to right flow',
      status: 'implemented'
    },
    {
      icon: Palette,
      title: 'Carbon Visual Language',
      description: 'Follows Carbon color tokens, typography scale, and spacing system (8px grid)',
      status: 'implemented'
    },
    {
      icon: Grid,
      title: 'Responsive Behavior',
      description: 'Mobile-first approach with progressive enhancement and collapsible navigation',
      status: 'implemented'
    },
    {
      icon: Eye,
      title: 'Reduced Visual Clutter',
      description: 'Simplified elements, consistent spacing, and clear visual separation',
      status: 'implemented'
    },
    {
      icon: Accessibility,
      title: 'Accessibility First',
      description: 'Proper ARIA labels, keyboard navigation, and focus management',
      status: 'implemented'
    }
  ];

  const beforeAfterComparison = [
    {
      category: 'Layout',
      before: 'Absolute positioned, inconsistent spacing, floating appearance',
      after: 'Sticky header, consistent 64px height, proper document flow integration'
    },
    {
      category: 'Branding',
      before: 'No clear brand identity or logo placement',
      after: 'Clear brand mark and application name in primary position'
    },
    {
      category: 'Navigation',
      before: 'Limited navigation, only in dropdown menu',
      after: 'Primary navigation visible, secondary in user menu, mobile-optimized'
    },
    {
      category: 'Responsiveness',
      before: 'May break on smaller screens, no mobile consideration',
      after: 'Mobile-first design with hamburger menu and adaptive layout'
    },
    {
      category: 'Consistency',
      before: 'Only appears on some pages, different behaviors',
      after: 'Consistent across all authenticated pages with uniform behavior'
    }
  ];

  const implementationGuidelines = [
    {
      title: 'Header Height',
      guideline: 'Always maintain 64px (4rem) height for consistency',
      code: 'className="h-16"'
    },
    {
      title: 'Sticky Positioning',
      guideline: 'Use sticky positioning with proper z-index',
      code: 'className="sticky top-0 z-50"'
    },
    {
      title: 'Background Treatment',
      guideline: 'Use backdrop blur for modern glass effect',
      code: 'className="bg-background/95 backdrop-blur"'
    },
    {
      title: 'Border Treatment',
      guideline: 'Always include bottom border for visual separation',
      code: 'className="border-b border-border"'
    },
    {
      title: 'Content Spacing',
      guideline: 'Use 24px (1.5rem) horizontal padding on container',
      code: 'className="px-6"'
    },
    {
      title: 'Button Sizing',
      guideline: 'Use consistent button heights (40px for md, 32px for sm)',
      code: 'size="md" // 40px height'
    }
  ];

  const responsiveBreakpoints = [
    {
      device: 'Mobile',
      icon: Smartphone,
      breakpoint: '< 768px',
      behavior: 'Hamburger menu, minimal navigation, workspace switcher in menu'
    },
    {
      device: 'Tablet',
      icon: Tablet,
      breakpoint: '768px - 1024px',
      behavior: 'Condensed navigation, some text labels hidden, workspace switcher visible'
    },
    {
      device: 'Desktop',
      icon: Monitor,
      breakpoint: '> 1024px',
      behavior: 'Full navigation visible, all labels shown, workspace switcher centered'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-2">Header Design System Guide</h1>
        <p className="text-muted-foreground">
          Comprehensive documentation of the redesigned header component following Carbon Design System principles.
        </p>
      </div>

      {/* Design Principles */}
      <CarbonCard>
        <CarbonCardHeader>
          <CarbonCardTitle>Design Principles Applied</CarbonCardTitle>
          <CarbonCardDescription>
            Core principles that guided the header redesign and implementation
          </CarbonCardDescription>
        </CarbonCardHeader>
        
        <CarbonCardContent>
          <div className="grid gap-4">
            {designPrinciples.map((principle, index) => (
              <div key={index} className="flex items-start gap-4 p-4 border border-border bg-background">
                <div className="flex-shrink-0">
                  <principle.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{principle.title}</h4>
                    {principle.status === 'implemented' && (
                      <Badge variant="success" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Implemented
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{principle.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CarbonCardContent>
      </CarbonCard>

      {/* Before/After Comparison */}
      <CarbonCard>
        <CarbonCardHeader>
          <CarbonCardTitle>Before vs After Comparison</CarbonCardTitle>
          <CarbonCardDescription>
            Key improvements made in the header redesign
          </CarbonCardDescription>
        </CarbonCardHeader>
        
        <CarbonCardContent>
          <div className="space-y-4">
            {beforeAfterComparison.map((item, index) => (
              <div key={index} className="border border-border p-4">
                <h4 className="font-semibold mb-3">{item.category}</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-xs">Before</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.before}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="success" className="text-xs">After</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.after}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CarbonCardContent>
      </CarbonCard>

      {/* Implementation Guidelines */}
      <CarbonCard>
        <CarbonCardHeader>
          <CarbonCardTitle>Implementation Guidelines</CarbonCardTitle>
          <CarbonCardDescription>
            Specific rules and code patterns for maintaining header consistency
          </CarbonCardDescription>
        </CarbonCardHeader>
        
        <CarbonCardContent>
          <div className="space-y-4">
            {implementationGuidelines.map((guideline, index) => (
              <div key={index} className="border border-border p-4">
                <h4 className="font-semibold mb-2">{guideline.title}</h4>
                <p className="text-sm text-muted-foreground mb-3">{guideline.guideline}</p>
                <div className="bg-secondary p-3 rounded border font-mono text-sm">
                  {guideline.code}
                </div>
              </div>
            ))}
          </div>
        </CarbonCardContent>
      </CarbonCard>

      {/* Responsive Behavior */}
      <CarbonCard>
        <CarbonCardHeader>
          <CarbonCardTitle>Responsive Behavior</CarbonCardTitle>
          <CarbonCardDescription>
            How the header adapts across different viewport sizes
          </CarbonCardDescription>
        </CarbonCardHeader>
        
        <CarbonCardContent>
          <div className="grid gap-4">
            {responsiveBreakpoints.map((breakpoint, index) => (
              <div key={index} className="flex items-start gap-4 p-4 border border-border bg-background">
                <div className="flex-shrink-0">
                  <breakpoint.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{breakpoint.device}</h4>
                    <Badge variant="outline" className="text-xs">{breakpoint.breakpoint}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{breakpoint.behavior}</p>
                </div>
              </div>
            ))}
          </div>
        </CarbonCardContent>
      </CarbonCard>

      {/* Usage Examples */}
      <CarbonCard>
        <CarbonCardHeader>
          <CarbonCardTitle>Usage in Components</CarbonCardTitle>
          <CarbonCardDescription>
            How to properly integrate the header system in your pages
          </CarbonCardDescription>
        </CarbonCardHeader>
        
        <CarbonCardContent>
          <div className="space-y-4">
            <div className="border border-border p-4">
              <h4 className="font-semibold mb-2">Basic Page Layout</h4>
              <div className="bg-secondary p-4 rounded border font-mono text-sm">
                {`<AppLayout
  currentUser={currentUser}
  currentView={currentView}
  onNavigate={handleNavigate}
  onLogout={handleLogout}
  onCreateWorkspace={handleCreate}
>
  <PageContainer>
    <Section>
      {/* Your page content */}
    </Section>
  </PageContainer>
</AppLayout>`}
              </div>
            </div>
            
            <div className="border border-border p-4">
              <h4 className="font-semibold mb-2">With Breadcrumb Navigation</h4>
              <div className="bg-secondary p-4 rounded border font-mono text-sm">
                {`{/* Breadcrumb */}
<div className="border-b border-border bg-background">
  <PageContainer>
    <div className="py-4">
      <WorkspaceBreadcrumb
        currentPage="catalog"
        onNavigate={handleBreadcrumbNav}
      />
    </div>
  </PageContainer>
</div>

{/* Page Content */}
<PageContainer>
  <Section>
    {/* Your content */}
  </Section>
</PageContainer>`}
              </div>
            </div>
          </div>
        </CarbonCardContent>
      </CarbonCard>
    </div>
  );
}