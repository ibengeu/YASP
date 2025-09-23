import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Palette, 
  Layout, 
  Type, 
  Zap,
  ChevronRight,
  ArrowRight,
  Settings
} from 'lucide-react';
import { motion } from 'motion/react';

/**
 * Carbon Design System Migration Complete
 * 
 * This component demonstrates the completed migration to Carbon Design System
 * using Shadcn components with Carbon-aligned styling and behaviors.
 */

interface MigrationStatus {
  category: string;
  items: {
    name: string;
    status: 'complete' | 'in-progress' | 'pending';
    description: string;
  }[];
}

const migrationData: MigrationStatus[] = [
  {
    category: 'Foundation Layer',
    items: [
      {
        name: 'Color Tokens',
        status: 'complete',
        description: 'Carbon color palette with theme support (White, Gray 10, Gray 90, Gray 100)'
      },
      {
        name: 'Typography Scale',
        status: 'complete',
        description: 'IBM Plex Sans with Carbon type scale and hierarchy'
      },
      {
        name: 'Spacing System',
        status: 'complete',
        description: '8px base grid with CSS custom properties (--spacing-01 to --spacing-10)'
      },
      {
        name: 'Elevation & Shadows',
        status: 'complete',
        description: 'Minimal shadow system with clean borders'
      }
    ]
  },
  {
    category: 'Core Components',
    items: [
      {
        name: 'Button System',
        status: 'complete',
        description: 'Primary, Secondary, Tertiary variants with proper Carbon styling'
      },
      {
        name: 'Input Fields',
        status: 'complete',
        description: 'Clean underline pattern with Carbon focus states'
      },
      {
        name: 'Cards & Surfaces',
        status: 'complete',
        description: 'Sharp-edged cards with structured spacing'
      },
      {
        name: 'Badges & Tags',
        status: 'complete',
        description: 'Sharp badges with Carbon color variants'
      }
    ]
  },
  {
    category: 'Application Features',
    items: [
      {
        name: 'Header Navigation',
        status: 'complete',
        description: 'Clean three-zone layout with proper grouping'
      },
      {
        name: 'API Catalog',
        status: 'complete',
        description: 'Grid and list views with Carbon spacing'
      },
      {
        name: 'Workspace Dashboard',
        status: 'complete',
        description: 'Stats cards and activity feeds with Carbon patterns'
      },
      {
        name: 'Form Components',
        status: 'complete',
        description: 'All forms use Carbon input and button patterns'
      }
    ]
  }
];

export function CarbonMigrationComplete() {
  const [activeTab, setActiveTab] = useState('overview');
  const [demoValue, setDemoValue] = useState('');

  const completedItems = migrationData.flatMap(cat => cat.items).filter(item => item.status === 'complete').length;
  const totalItems = migrationData.flatMap(cat => cat.items).length;
  const progressPercentage = (completedItems / totalItems) * 100;

  return (
    <div className="max-w-6xl mx-auto space-y-[var(--spacing-06)]">
      {/* Migration Complete Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-[var(--spacing-04)]"
      >
        <div className="flex items-center justify-center gap-[var(--spacing-03)]">
          <div className="h-12 w-12 bg-success/10 rounded-sm flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-success" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Carbon Migration Complete</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Successfully migrated the API Platform to IBM's Carbon Design System using Shadcn components
          with Carbon-aligned styling, spacing, and interaction patterns.
        </p>
      </motion.div>

      {/* Progress Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-[var(--spacing-03)]">
              <Zap className="h-5 w-5 text-primary" />
              Migration Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-[var(--spacing-04)]">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {completedItems} of {totalItems} items completed
              </span>
              <Badge variant="success" className="text-xs">
                {progressPercentage.toFixed(0)}% Complete
              </Badge>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </CardContent>
        </Card>
      </motion.div>

      {/* Detailed Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="demo">Live Demo</TabsTrigger>
            <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-[var(--spacing-05)]">
            <div className="grid gap-[var(--spacing-05)]">
              {migrationData.map((category, index) => (
                <motion.div
                  key={category.category}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="card-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-[var(--spacing-03)]">
                        <div className="h-2 w-2 bg-primary rounded-full"></div>
                        {category.category}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-[var(--spacing-03)]">
                        {category.items.map((item) => (
                          <div key={item.name} className="flex items-start gap-[var(--spacing-03)] p-[var(--spacing-03)] rounded-sm hover:bg-muted/30 transition-colors">
                            <div className="flex-shrink-0 mt-1">
                              {item.status === 'complete' && <CheckCircle2 className="h-4 w-4 text-success" />}
                              {item.status === 'in-progress' && <AlertCircle className="h-4 w-4 text-warning" />}
                              {item.status === 'pending' && <div className="h-4 w-4 border-2 border-muted rounded-full" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-[var(--spacing-02)]">
                                <h4 className="font-medium text-sm">{item.name}</h4>
                                <Badge 
                                  variant={item.status === 'complete' ? 'success' : item.status === 'in-progress' ? 'warning' : 'secondary'}
                                  className="text-xs"
                                >
                                  {item.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="components" className="space-y-[var(--spacing-05)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--spacing-05)]">
              {/* Button Variants */}
              <Card className="card-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">Button System</CardTitle>
                </CardHeader>
                <CardContent className="space-y-[var(--spacing-03)]">
                  <div className="space-y-[var(--spacing-02)]">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Carbon Button Variants</p>
                    <div className="flex flex-wrap gap-[var(--spacing-02)]">
                      <Button variant="primary" size="sm">Primary</Button>
                      <Button variant="secondary" size="sm">Secondary</Button>
                      <Button variant="tertiary" size="sm">Tertiary</Button>
                      <Button variant="ghost" size="sm">Ghost</Button>
                    </div>
                  </div>
                  <div className="space-y-[var(--spacing-02)]">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Danger Variants</p>
                    <div className="flex flex-wrap gap-[var(--spacing-02)]">
                      <Button variant="destructive" size="sm">Danger</Button>
                      <Button variant="destructive-secondary" size="sm">Danger Secondary</Button>
                      <Button variant="destructive-tertiary" size="sm">Danger Tertiary</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Badge Variants */}
              <Card className="card-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">Badge System</CardTitle>
                </CardHeader>
                <CardContent className="space-y-[var(--spacing-03)]">
                  <div className="space-y-[var(--spacing-02)]">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Filled Badges</p>
                    <div className="flex flex-wrap gap-[var(--spacing-02)]">
                      <Badge variant="default">Default</Badge>
                      <Badge variant="secondary">Secondary</Badge>
                      <Badge variant="success">Success</Badge>
                      <Badge variant="warning">Warning</Badge>
                      <Badge variant="destructive">Error</Badge>
                    </div>
                  </div>
                  <div className="space-y-[var(--spacing-02)]">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Outline Badges</p>
                    <div className="flex flex-wrap gap-[var(--spacing-02)]">
                      <Badge variant="outline">Outline</Badge>
                      <Badge variant="outline-primary">Primary</Badge>
                      <Badge variant="outline-destructive">Destructive</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="demo" className="space-y-[var(--spacing-05)]">
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle>Interactive Demo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-[var(--spacing-04)]">
                <div className="space-y-[var(--spacing-03)]">
                  <label className="text-sm font-medium">Carbon Input Field</label>
                  <Input
                    placeholder="Type something here..."
                    value={demoValue}
                    onChange={(e) => setDemoValue(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Clean underline design with Carbon focus states
                  </p>
                </div>

                <div className="flex items-center gap-[var(--spacing-03)]">
                  <Button variant="primary">Primary Action</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="tertiary">Tertiary</Button>
                </div>

                {demoValue && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      You typed: <strong>{demoValue}</strong>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guidelines" className="space-y-[var(--spacing-05)]">
            <div className="space-y-[var(--spacing-05)]">
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  All components now follow IBM Carbon Design System principles with Shadcn + Tailwind implementation.
                  Check the <code>Guidelines.md</code> file for detailed implementation rules.
                </AlertDescription>
              </Alert>

              <Card className="card-shadow">
                <CardHeader>
                  <CardTitle>Key Migration Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-[var(--spacing-04)]">
                    <div className="flex items-start gap-[var(--spacing-03)]">
                      <Palette className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Design Tokens</h4>
                        <p className="text-sm text-muted-foreground">
                          Complete Carbon color palette, typography scale, and spacing system implemented via CSS custom properties
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-[var(--spacing-03)]">
                      <Layout className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Component System</h4>
                        <p className="text-sm text-muted-foreground">
                          All Shadcn components customized to match Carbon's visual language and interaction patterns
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-[var(--spacing-03)]">
                      <Type className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Typography</h4>
                        <p className="text-sm text-muted-foreground">
                          IBM Plex Sans with Carbon type scale ensuring consistent hierarchy across all components
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Next Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="card-shadow border-success/20 bg-success/5">
          <CardContent className="pt-[var(--spacing-05)]">
            <div className="flex items-start gap-[var(--spacing-04)]">
              <div className="h-8 w-8 bg-success/10 rounded-sm flex items-center justify-center flex-shrink-0">
                <ArrowRight className="h-4 w-4 text-success" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-[var(--spacing-02)]">Migration Complete!</h3>
                <p className="text-sm text-muted-foreground mb-[var(--spacing-04)]">
                  Your API Platform now fully implements IBM's Carbon Design System with consistent styling,
                  spacing, and interaction patterns across all components.
                </p>
                <div className="flex items-center gap-[var(--spacing-03)]">
                  <Button variant="secondary" size="sm">
                    View Guidelines
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                  <Button variant="tertiary" size="sm">
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}