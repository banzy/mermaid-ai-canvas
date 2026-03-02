import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Header } from '@/components/layout/Header';
import { StatusBar } from '@/components/layout/StatusBar';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { ArchitectureCanvas } from '@/components/editor/ArchitectureCanvas';
import { NarrativePanel } from '@/components/editor/NarrativePanel';
import { AIPanel } from '@/components/ai/AIPanel';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const isMobile = useIsMobile();

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 overflow-hidden p-2">
        {isMobile ? (
          /* Mobile: stacked canvas + panel */
          <div className="flex h-full flex-col gap-2">
            <div className="flex-1 min-h-0">
              <ArchitectureCanvas />
            </div>
            <div className="h-64 shrink-0">
              <NarrativePanel />
            </div>
          </div>
        ) : (
          /* Desktop: 3-panel resizable workspace */
          <ResizablePanelGroup direction="horizontal" className="h-full rounded-2xl">
            {/* Left: AI Panel */}
            <ResizablePanel defaultSize={22} minSize={16} maxSize={35}>
              <div className="h-full pr-1">
                <AIPanel />
              </div>
            </ResizablePanel>

            <ResizableHandle className="w-1.5 bg-transparent hover:bg-primary/30 transition-colors" />

            {/* Center: Architecture Canvas */}
            <ResizablePanel defaultSize={52} minSize={35}>
              <div className="h-full px-1">
                <ArchitectureCanvas />
              </div>
            </ResizablePanel>

            <ResizableHandle className="w-1.5 bg-transparent hover:bg-primary/30 transition-colors" />

            {/* Right: Narrative / Inspector */}
            <ResizablePanel defaultSize={26} minSize={18} maxSize={40}>
              <div className="h-full pl-1">
                <NarrativePanel />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </main>

      <StatusBar />
      <CommandPalette />
    </div>
  );
};

export default Index;
