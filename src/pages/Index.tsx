import { useEffect } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Header } from '@/components/layout/Header';
import { StatusBar } from '@/components/layout/StatusBar';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { MonacoEditor } from '@/components/editor/MonacoEditor';
import { MermaidPreview } from '@/components/editor/MermaidPreview';
import { AIPanel } from '@/components/ai/AIPanel';
import { useAppStore } from '@/stores/useAppStore';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const { setCode, settings, editor, saveProject, setIsDirty } = useAppStore();
  const isMobile = useIsMobile();

  // Load diagram from URL if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const diagram = params.get('diagram');
    if (diagram) {
      try {
        const decoded = decodeURIComponent(atob(diagram));
        setCode(decoded);
      } catch (e) {
        console.error('Failed to decode diagram from URL');
      }
    }
  }, [setCode]);

  // Auto-save
  useEffect(() => {
    if (!settings.autoSave || !editor.isDirty) return;

    const timeout = setTimeout(() => {
      saveProject();
      setIsDirty(false);
    }, settings.autoSaveInterval);

    return () => clearTimeout(timeout);
  }, [editor.code, editor.isDirty, settings.autoSave, settings.autoSaveInterval, saveProject, setIsDirty]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveProject();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [saveProject]);

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />
      
      <main className="flex-1 overflow-hidden">
        {isMobile ? (
          // Mobile: Stack vertically
          <div className="flex h-full flex-col">
            <div className="flex-1 p-2">
              <MonacoEditor />
            </div>
            <div className="h-1/2 p-2 pt-0">
              <MermaidPreview />
            </div>
          </div>
        ) : (
          // Desktop: Split pane
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-hidden">
              <ResizablePanelGroup direction="horizontal" className="h-full">
                <ResizablePanel defaultSize={45} minSize={25}>
                  <div className="h-full p-3 pr-1.5">
                    <MonacoEditor />
                  </div>
                </ResizablePanel>
                
                <ResizableHandle className="w-1.5 bg-transparent hover:bg-primary/30 transition-colors" />
                
                <ResizablePanel defaultSize={55} minSize={30}>
                  <div className="h-full p-3 pl-1.5">
                    <MermaidPreview />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
            
            <AIPanel />
          </div>
        )}
      </main>

      <StatusBar />
      <CommandPalette />
    </div>
  );
};

export default Index;
