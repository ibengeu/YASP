import React from 'react';
import { Button } from '../ui/button';
import { CarbonCard, CarbonCardHeader, CarbonCardTitle, CarbonCardDescription, CarbonCardContent, CarbonCardFooter } from './CarbonCard';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Settings, 
  Download, 
  Eye, 
  MoreVertical,
  ArrowRight,
  BarChart3 
} from 'lucide-react';
import { MigrationProgress } from './MigrationProgress';
import { HeaderDesignGuide } from './HeaderDesignGuide';
import { NavigationGuide } from '../layout/NavigationGuide';

/**
 * Demo component showcasing Carbon Design System migration
 * 
 * This component demonstrates:
 * - Carbon color palette
 * - Carbon typography scale
 * - Sharp, minimal design aesthetic
 * - 8px grid system spacing
 * - Structured component layout
 */

export function CarbonMigrationDemo() {
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'demo' | 'progress' | 'header-guide' | 'navigation-guide'>('demo');

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-regular text-foreground mb-2">
              Carbon Design System Migration
            </h1>
            <p className="text-muted-foreground">
              Demonstrating IBM's Carbon design language integration
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="dark-mode">Dark mode</Label>
              <Switch
                id="dark-mode"
                checked={isDarkMode}
                onCheckedChange={setIsDarkMode}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant={activeTab === 'demo' ? 'primary' : 'secondary'} 
                size="md"
                onClick={() => setActiveTab('demo')}
              >
                <Eye className="h-4 w-4" />
                Demo
              </Button>
              <Button 
                variant={activeTab === 'progress' ? 'primary' : 'secondary'} 
                size="md"
                onClick={() => setActiveTab('progress')}
              >
                <BarChart3 className="h-4 w-4" />
                Progress
              </Button>
              <Button 
                variant={activeTab === 'header-guide' ? 'primary' : 'secondary'} 
                size="md"
                onClick={() => setActiveTab('header-guide')}
              >
                <Settings className="h-4 w-4" />
                Header Guide
              </Button>
              <Button 
                variant={activeTab === 'navigation-guide' ? 'primary' : 'secondary'} 
                size="md"
                onClick={() => setActiveTab('navigation-guide')}
              >
                <ArrowRight className="h-4 w-4" />
                Navigation Audit
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'progress' ? (
          <MigrationProgress />
        ) : activeTab === 'header-guide' ? (
          <HeaderDesignGuide />
        ) : activeTab === 'navigation-guide' ? (
          <NavigationGuide />
        ) : (
          <>
            {/* Color Palette Demo */}
            <CarbonCard className="mb-6">
          <CarbonCardHeader>
            <CarbonCardTitle>Carbon Color Palette</CarbonCardTitle>
            <CarbonCardDescription>
              Enterprise-focused color system with accessibility compliance
            </CarbonCardDescription>
          </CarbonCardHeader>
          
          <CarbonCardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-3">
                <div className="h-12 bg-primary border border-border flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-semibold">Primary</span>
                </div>
                <div className="text-sm text-muted-foreground">#0f62fe</div>
              </div>
              
              <div className="space-y-3">
                <div className="h-12 bg-secondary border border-border flex items-center justify-center">
                  <span className="text-secondary-foreground text-sm font-semibold">Secondary</span>
                </div>
                <div className="text-sm text-muted-foreground">#f4f4f4</div>
              </div>
              
              <div className="space-y-3">
                <div className="h-12 bg-destructive border border-border flex items-center justify-center">
                  <span className="text-destructive-foreground text-sm font-semibold">Danger</span>
                </div>
                <div className="text-sm text-muted-foreground">#da1e28</div>
              </div>
              
              <div className="space-y-3">
                <div className="h-12 bg-success border border-border flex items-center justify-center">
                  <span className="text-success-foreground text-sm font-semibold">Success</span>
                </div>
                <div className="text-sm text-muted-foreground">#24a148</div>
              </div>
            </div>
          </CarbonCardContent>
        </CarbonCard>

        {/* Button Variants Demo */}
        <CarbonCard className="mb-6">
          <CarbonCardHeader>
            <CarbonCardTitle>Carbon Button System</CarbonCardTitle>
            <CarbonCardDescription>
              Structured button hierarchy following Carbon principles
            </CarbonCardDescription>
          </CarbonCardHeader>
          
          <CarbonCardContent>
            <div className="grid gap-6">
              {/* Primary Actions */}
              <div>
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                  Primary Actions
                </h4>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary" size="sm">
                    Small Primary
                  </Button>
                  <Button variant="primary" size="md">
                    Medium Primary
                  </Button>
                  <Button variant="primary" size="lg">
                    Large Primary
                  </Button>
                  <Button variant="primary" size="xl">
                    Extra Large Primary
                  </Button>
                </div>
              </div>

              {/* Secondary Actions */}
              <div>
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                  Secondary Actions
                </h4>
                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary" size="md">
                    Secondary
                  </Button>
                  <Button variant="tertiary" size="md">
                    Tertiary
                  </Button>
                  <Button variant="ghost" size="md">
                    Ghost
                  </Button>
                </div>
              </div>

              {/* Danger Actions */}
              <div>
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                  Danger Actions
                </h4>
                <div className="flex flex-wrap gap-3">
                  <Button variant="danger" size="md">
                    Danger Primary
                  </Button>
                  <Button variant="danger-tertiary" size="md">
                    Danger Tertiary
                  </Button>
                  <Button variant="danger-ghost" size="md">
                    Danger Ghost
                  </Button>
                </div>
              </div>
            </div>
          </CarbonCardContent>
        </CarbonCard>

        {/* Typography Demo */}
        <CarbonCard className="mb-6">
          <CarbonCardHeader>
            <CarbonCardTitle>IBM Plex Typography Scale</CarbonCardTitle>
            <CarbonCardDescription>
              Professional typography system using IBM Plex font family
            </CarbonCardDescription>
          </CarbonCardHeader>
          
          <CarbonCardContent className="space-y-4">
            <div>
              <h1>Heading 01 - The quick brown fox (42px)</h1>
            </div>
            <div>
              <h2>Heading 02 - The quick brown fox (32px)</h2>
            </div>
            <div>
              <h3>Heading 03 - The quick brown fox (28px)</h3>
            </div>
            <div>
              <h4>Heading 04 - The quick brown fox (24px)</h4>
            </div>
            <div>
              <h5>Heading 05 - The quick brown fox (20px)</h5>
            </div>
            <div>
              <h6>Heading 06 - The quick brown fox (18px)</h6>
            </div>
            <div>
              <p>Body 01 - The quick brown fox jumps over the lazy dog (16px)</p>
            </div>
            <div>
              <small>Caption 01 - The quick brown fox jumps over the lazy dog (12px)</small>
            </div>
          </CarbonCardContent>
        </CarbonCard>

        {/* Form Elements Demo */}
        <CarbonCard className="mb-6">
          <CarbonCardHeader>
            <CarbonCardTitle>Form Elements</CarbonCardTitle>
            <CarbonCardDescription>
              Carbon-styled form components with consistent interaction patterns
            </CarbonCardDescription>
          </CarbonCardHeader>
          
          <CarbonCardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    placeholder="Enter your full name"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email"
                    placeholder="Enter your email"
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notifications">Enable notifications</Label>
                  <Switch id="notifications" />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="marketing">Marketing emails</Label>
                  <Switch id="marketing" />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="analytics">Analytics tracking</Label>
                  <Switch id="analytics" defaultChecked />
                </div>
              </div>
            </div>
          </CarbonCardContent>
          
          <CarbonCardFooter>
            <div />
            <div className="flex gap-3">
              <Button variant="ghost" size="md">
                Cancel
              </Button>
              <Button variant="primary" size="md">
                Save Changes
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CarbonCardFooter>
        </CarbonCard>

        {/* Card Grid Demo */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CarbonCard variant="clickable">
            <CarbonCardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">API</Badge>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
              <CarbonCardTitle>User Management API</CarbonCardTitle>
              <CarbonCardDescription>
                Comprehensive user authentication and profile management
              </CarbonCardDescription>
            </CarbonCardHeader>
            
            <CarbonCardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>Version: 2.1.0</div>
                <div>Status: Active</div>
                <div>Last updated: 2 hours ago</div>
              </div>
            </CarbonCardContent>
            
            <CarbonCardFooter>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                  View
                </Button>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </CarbonCardFooter>
          </CarbonCard>

          <CarbonCard variant="selectable">
            <CarbonCardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="outline">SDK</Badge>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
              <CarbonCardTitle>Payment Processing</CarbonCardTitle>
              <CarbonCardDescription>
                Secure payment handling with multiple gateway support
              </CarbonCardDescription>
            </CarbonCardHeader>
            
            <CarbonCardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>Version: 1.8.3</div>
                <div>Status: Beta</div>
                <div>Last updated: 1 day ago</div>
              </div>
            </CarbonCardContent>
          </CarbonCard>

          <CarbonCard>
            <CarbonCardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="destructive">Deprecated</Badge>
                <Button variant="ghost" size="icon" disabled>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
              <CarbonCardTitle>Legacy Auth Service</CarbonCardTitle>
              <CarbonCardDescription>
                Old authentication service - migrate to User Management API
              </CarbonCardDescription>
            </CarbonCardHeader>
            
            <CarbonCardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>Version: 0.9.1</div>
                <div>Status: Deprecated</div>
                <div>Sunset: Dec 2024</div>
              </div>
            </CarbonCardContent>
          </CarbonCard>
        </div>
          </>
        )}
      </div>
    </div>
  );
}