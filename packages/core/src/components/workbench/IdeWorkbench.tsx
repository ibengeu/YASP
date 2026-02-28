import { useState } from 'react';
import {
  FileCode,
  Search,
  ChevronsLeft,
  ChevronsRight,
  Bug,
  Eye,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  GitBranch,
  Users,
  X,
  Plus,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Folder,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { CodeEditor } from '@/features/editor/components/CodeEditor';

export function IdeWorkbench() {
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background text-foreground">
      <div className="flex-1 flex overflow-hidden">

        {/* Left Sidebar */}
        <aside
          className={cn(
            'border-r flex flex-col bg-muted/30 shrink-0 transition-all duration-200 overflow-hidden',
            leftCollapsed ? 'w-10' : 'w-64'
          )}
        >
          {leftCollapsed ? (
            <div className="flex flex-col items-center py-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setLeftCollapsed(false)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="files" className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b px-2 h-10 shrink-0">
                <TabsList variant="line" className="h-full">
                  <TabsTrigger value="files" className="text-xs">Files</TabsTrigger>
                  <TabsTrigger value="history" className="text-xs">History</TabsTrigger>
                </TabsList>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setLeftCollapsed(true)}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
              </div>

              <TabsContent value="files" className="flex-1 flex flex-col m-0 overflow-hidden">
                <div className="p-3 border-b shrink-0">
                  <div className="relative flex items-center">
                    <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Search spec..." className="h-8 pl-8 text-xs bg-background" />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <div className="py-2 px-1">
                    <div className="group flex items-center gap-1.5 px-2 py-1.5 text-sm hover:bg-accent rounded cursor-pointer transition-colors">
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      <FolderOpen className="h-4 w-4 text-primary" />
                      <span className="truncate">core-api</span>
                    </div>
                    <div className="pl-6">
                      <div className="flex items-center gap-2 px-2 py-1.5 text-sm bg-accent/50 rounded cursor-pointer">
                        <FileCode className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate font-medium">v2-spec.yaml</span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground rounded cursor-pointer transition-colors">
                        <FileCode className="h-4 w-4 text-muted-foreground/50" />
                        <span className="truncate">models.json</span>
                      </div>
                    </div>
                    <div className="group flex items-center gap-1.5 px-2 py-1.5 mt-1 text-sm text-muted-foreground hover:bg-accent hover:text-foreground rounded cursor-pointer transition-colors">
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      <Folder className="h-4 w-4 text-muted-foreground/50" />
                      <span className="truncate">webhooks</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="history" className="flex-1 flex flex-col m-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-6">
                    <TimelineItem time="Just now" user="Jane S." action="added ChargeRequest schema" isNew />
                    <TimelineItem time="2 hours ago" user="AL" action="updated server URL configuration" />
                    <TimelineItem time="Yesterday" user="System" action="Initial commit of v2-spec.yaml" isLast />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </aside>

        {/* Center Editor */}
        <section className="flex-1 flex flex-col min-w-0 border-r">
          {/* Editor Tabs */}
          <div className="flex items-center border-b bg-muted/20 overflow-x-auto shrink-0 h-10 no-scrollbar">
            <div className="flex items-center gap-2 px-4 h-full bg-background border-r border-t-2 border-t-primary cursor-pointer min-w-max">
              <FileCode className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">v2-spec.yaml</span>
              <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors ml-2" />
            </div>
            <div className="flex items-center gap-2 px-4 h-full border-r border-t-2 border-t-transparent text-muted-foreground hover:bg-muted/50 cursor-pointer min-w-max transition-colors">
              <span className="text-sm">models.json</span>
            </div>
            <Button variant="ghost" size="icon" className="h-full w-10 border-r rounded-none">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Code area */}
          <div className="flex-1 relative overflow-hidden">
            <CodeEditor language="yaml" />
            {/* Collaborative cursor placeholder */}
            <div className="absolute top-[340px] left-[180px] pointer-events-none z-10 flex flex-col items-center">
              <div className="w-0.5 h-5 bg-amber-500 rounded-full animate-pulse" />
              <div className="bg-amber-500 text-white text-[10px] font-medium px-1.5 py-0.5 rounded rounded-tl-none whitespace-nowrap shadow-sm mt-0.5 ml-8">
                Jane S.
              </div>
            </div>
          </div>
        </section>

        {/* Right Sidebar */}
        <aside
          className={cn(
            'border-l flex flex-col bg-muted/30 shrink-0 transition-all duration-200 overflow-hidden',
            rightCollapsed ? 'w-10' : 'w-80'
          )}
        >
          {rightCollapsed ? (
            <div className="flex flex-col items-center py-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setRightCollapsed(false)}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="issues" className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b px-2 h-10 shrink-0 bg-background">
                <TabsList variant="line" className="h-full">
                  <TabsTrigger value="preview" className="text-xs gap-1.5">
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="issues" className="text-xs gap-1.5">
                    <Bug className="h-3.5 w-3.5" />
                    Issues
                    <Badge variant="destructive" className="h-4 px-1 py-0 text-[10px]">2</Badge>
                  </TabsTrigger>
                </TabsList>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setRightCollapsed(true)}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>

              <TabsContent value="preview" className="flex-1 m-0">
                <div className="p-4 text-center text-muted-foreground text-sm">
                  Documentation preview will render here.
                </div>
              </TabsContent>

              <TabsContent value="issues" className="flex-1 flex flex-col m-0 overflow-hidden">
                <div className="p-3 border-b bg-background shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-tight">Validation Pipeline</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      Syntax OK
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 mb-1 overflow-hidden">
                    <div className="bg-destructive h-1.5 rounded-full w-[66%]" />
                  </div>
                  <p className="text-[10px] text-muted-foreground">2 semantic issues found</p>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <IssueItem type="error" title="Missing Operation ID" line={12} description="Every operation must have a unique operationId for SDK generation consistency." />
                  <IssueItem type="warning" title="Unresolved Reference" line={19} description="The schema reference '#/components/schemas/ChargeRequest' does not exist." />
                </div>
              </TabsContent>
            </Tabs>
          )}
        </aside>
      </div>

      {/* Status Bar */}
      <footer className="h-8 border-t bg-background flex items-center justify-between px-3 text-[11px] text-muted-foreground shrink-0">
        <div className="flex items-center gap-4">
          <button type="button" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
            <GitBranch className="h-3.5 w-3.5" />
            main
          </button>
          <div className="flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors hidden sm:flex">
            <XCircle className="h-3.5 w-3.5 text-destructive" />
            1 Error
          </div>
          <div className="flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors hidden sm:flex">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            1 Warning
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono hidden sm:inline">Ln 12, Col 7</span>
          <span className="font-mono hidden sm:inline">Spaces: 2</span>
          <span>UTF-8</span>
          <span className="font-medium text-foreground">YAML</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Users className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">Collaboration Active (2 users)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </footer>
    </div>
  );
}

function TimelineItem({ time, user, action, isNew = false, isLast = false }: {
  time: string;
  user: string;
  action: React.ReactNode;
  isNew?: boolean;
  isLast?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={cn('w-2 h-2 rounded-full ring-4 ring-muted/30 z-10 mt-1.5', isNew ? 'bg-primary' : 'bg-muted-foreground/30')} />
        {!isLast && <div className="w-px h-full bg-border mt-1 pb-2" />}
      </div>
      <div className="pb-5">
        <p className="text-xs font-semibold text-foreground tracking-tight">{time}</p>
        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{user} {action}</p>
      </div>
    </div>
  );
}

function IssueItem({ type, title, line, description }: {
  type: 'error' | 'warning';
  title: string;
  line: number;
  description: string;
}) {
  return (
    <div className="p-3 border-b hover:bg-accent cursor-pointer transition-colors">
      <div className="flex items-start gap-2">
        {type === 'error'
          ? <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          : <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{title}</span>
            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Ln {line}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}
