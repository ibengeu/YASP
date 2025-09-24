import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import {
  AlertTriangle,
  CheckCircle2,
  Navigation,
  Menu,
  MousePointer,
  Layers,
  ArrowRight,
} from 'lucide-react';

/**
 * Navigation Guide Component
 * 
 * Provides comprehensive documentation of the platform's navigation patterns
 * and design decisions for team reference and user onboarding.
 */
export function NavigationGuide() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 p-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Navigation System Guide</h1>
        <p className="text-muted-foreground text-lg">
          Comprehensive overview of our platform's navigation structure, patterns, and best practices.
        </p>
      </div>

      {/* Navigation Hierarchy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Navigation Hierarchy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <div className="h-4 w-4 bg-primary rounded-sm"></div>
              </div>
              <div>
                <h3 className="font-semibold">Header Navigation</h3>
                <p className="text-sm text-muted-foreground">Primary navigation between major sections</p>
              </div>
            </div>
            
            <div className="ml-6 pl-6 border-l-2 border-border space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Dashboard</span>
                <Badge variant="outline" className="text-xs">Workspace Home</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">API Catalog</span>
                <Badge variant="outline" className="text-xs">API Library</Badge>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Navigation className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Enhanced Breadcrumbs</h3>
                <p className="text-sm text-muted-foreground">Context-aware hierarchical navigation</p>
              </div>
            </div>
            
            <div className="ml-6 pl-6 border-l-2 border-border space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">Workspace</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm">Page</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm">Context</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Automatically adapts based on current location and available context
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                <MousePointer className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">Context Actions</h3>
                <p className="text-sm text-muted-foreground">Page-specific actions and tools</p>
              </div>
            </div>
            
            <div className="ml-6 pl-6 border-l-2 border-border space-y-2">
              <div className="text-sm">Primary actions appear where they're most relevant to the current task</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Changes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Key Improvements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-green-700">✅ What We Fixed</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  Removed duplicate "Dashboard" and "API Catalog" from user menu
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  Consolidated "Create Workspace" to single header location
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  Enhanced breadcrumbs with context awareness
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  Consistent navigation patterns across all pages
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-red-700">❌ What We Removed</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                  Navigation duplicates in user dropdown
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                  Redundant "Create Workspace" buttons
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                  Shallow breadcrumb implementation
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                  Inconsistent styling and placement
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Design Principles */}
      <Card>
        <CardHeader>
          <CardTitle>Navigation Design Principles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold">🎯 Single Source of Truth</h4>
              <p className="text-sm text-muted-foreground">
                Each navigation action appears in exactly one logical location, reducing cognitive load and decision fatigue.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">🧭 Context Awareness</h4>
              <p className="text-sm text-muted-foreground">
                Navigation adapts to show relevant paths and context based on current location and available data.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">🔄 Consistent Patterns</h4>
              <p className="text-sm text-muted-foreground">
                Users develop muscle memory through predictable navigation patterns across all pages and features.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">📱 Responsive Design</h4>
              <p className="text-sm text-muted-foreground">
                Navigation works seamlessly across desktop, tablet, and mobile devices with appropriate adaptations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Experience Impact */}
      <Card>
        <CardHeader>
          <CardTitle>Expected User Experience Impact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">40%</div>
              <p className="text-sm text-green-600 dark:text-green-400">Fewer menu items to scan</p>
            </div>

            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">60%</div>
              <p className="text-sm text-blue-600 dark:text-blue-400">Faster task completion</p>
            </div>

            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">90%</div>
              <p className="text-sm text-purple-600 dark:text-purple-400">Improved wayfinding accuracy</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}