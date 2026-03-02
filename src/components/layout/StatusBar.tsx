import { useAppStore } from '@/stores/useAppStore';
import { Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const StatusBar = () => {
  const { project, selectedView, isDirty, settings, chat } = useAppStore();

  const blocks =
    selectedView === 'operational'
      ? project.operationalBlocks
      : project.functionalBlocks;

  const nodeCount = blocks.length;
  const edgeCount = project.relations.length;
  const flowCount = project.flows.length;

  return (
    <footer className="flex h-7 items-center justify-between border-t border-border bg-card px-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-4">
        {/* Connection Status */}
        <div className="flex items-center gap-1.5">
          <Circle
            className={cn(
              "h-2 w-2",
              settings?.apiUrl ? "fill-success text-success" : "fill-warning text-warning"
            )}
          />
          <span>{settings?.apiUrl ? 'Connected' : 'Local'}</span>
        </div>

        {/* Unsaved indicator */}
        {isDirty && (
          <div className="flex items-center gap-1.5 text-warning">
            <Circle className="h-2 w-2 fill-current animate-pulse" />
            <span>Unsaved changes</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* View */}
        <span className="capitalize text-primary">{selectedView}</span>

        {/* Stats */}
        <span>{nodeCount} blocks</span>
        <span>{edgeCount} relations</span>
        <span>{flowCount} flows</span>

        {/* Model */}
        {chat?.currentModel && (
          <span className="text-primary">{chat.currentModel}</span>
        )}
      </div>
    </footer>
  );
};
