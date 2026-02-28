import { useState } from 'react';
import {
  FileCode,
  Search,
  ChevronsLeft,
  ChevronsRight,
  Bug,
  Eye,
  GitBranch,
  Users,
  Plus,
  ChevronDown,
  ChevronRight,
  FolderOpen,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { CodeEditor } from '@/features/editor/components/CodeEditor';
import { useEditorStore } from '@/features/editor/store/editor.store';

export function IdeWorkbench() {
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const content = useEditorStore((s) => s.content);

  const language: 'yaml' | 'json' = content.trimStart().startsWith('{') ? 'json' : 'yaml';

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
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setLeftCollapsed(false)}>
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
                  {content ? (
                    <div className="py-2 px-1">
                      <div className="group flex items-center gap-1.5 px-2 py-1.5 text-sm hover:bg-accent rounded cursor-pointer transition-colors">
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        <FolderOpen className="h-4 w-4 text-primary" />
                        <span className="truncate">workspace</span>
                      </div>
                      <div className="pl-6">
                        <div className="flex items-center gap-2 px-2 py-1.5 text-sm bg-accent/50 rounded cursor-pointer">
                          <FileCode className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate font-medium">spec.{language === 'json' ? 'json' : 'yaml'}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      No spec loaded. Import one from Collections.
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="history" className="flex-1 flex flex-col m-0 overflow-hidden">
                <div className="flex-1 flex items-center justify-center p-4">
                  <p className="text-xs text-muted-foreground text-center">
                    Edit history will appear here.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </aside>

        {/* Center Editor */}
        <section className="flex-1 flex flex-col min-w-0 border-r">
          {/* Editor Tabs */}
          <div className="flex items-center border-b bg-muted/20 overflow-x-auto shrink-0 h-10 no-scrollbar">
            {content ? (
              <div className="flex items-center gap-2 px-4 h-full bg-background border-r border-t-2 border-t-primary cursor-pointer min-w-max">
                <FileCode className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">spec.{language === 'json' ? 'json' : 'yaml'}</span>
              </div>
            ) : (
              <div className="px-4 h-full flex items-center text-xs text-muted-foreground">
                No file open
              </div>
            )}
            <Button variant="ghost" size="icon" className="h-full w-10 border-r rounded-none ml-auto">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Code area */}
          <div className="flex-1 relative overflow-hidden">
            {content ? (
              <CodeEditor language={language} />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                <p>Open a spec from Collections to start editing.</p>
              </div>
            )}
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
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setRightCollapsed(false)}>
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
                <div className="h-full flex items-center justify-center p-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Documentation preview coming soon.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="issues" className="flex-1 flex flex-col m-0 overflow-hidden">
                <div className="flex-1 flex items-center justify-center p-4">
                  <p className="text-xs text-muted-foreground text-center">
                    {content ? 'No issues detected.' : 'Load a spec to run validation.'}
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </aside>
      </div>

      {/* Status Bar */}
      <footer className="h-8 border-t bg-background flex items-center justify-between px-3 text-[11px] text-muted-foreground shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <GitBranch className="h-3.5 w-3.5" />
            <span>main</span>
          </div>
          {content && (
            <span className="hidden sm:inline uppercase font-medium">
              {language}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Users className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">Collaboration coming soon</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </footer>
    </div>
  );
}
