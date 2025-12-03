import { useAppStore } from '@/stores/useAppStore';
import { Circle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const StatusBar = () => {
  const { editor, chat, settings } = useAppStore();

  const lineCount = editor?.code?.split('\n').length || 0;
  const charCount = editor?.code?.length || 0;
  const errors = editor?.errors || [];

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

        {/* Errors */}
        {errors.length > 0 && (
          <div className="flex items-center gap-1.5 text-destructive">
            <AlertCircle className="h-3 w-3" />
            <span>{errors.length} error{errors.length > 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Syncing indicator */}
        {editor?.isDirty && (
          <div className="flex items-center gap-1.5 text-warning">
            <Circle className="h-2 w-2 fill-current animate-pulse" />
            <span>Unsaved changes</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Cursor position */}
        {editor?.cursorPosition && (
          <span>
            Ln {editor.cursorPosition.line}, Col {editor.cursorPosition.column}
          </span>
        )}

        {/* Stats */}
        <span>{lineCount} lines</span>
        <span>{charCount} chars</span>

        {/* Model */}
        {chat?.currentModel && (
          <span className="text-primary">{chat.currentModel}</span>
        )}
      </div>
    </footer>
  );
};
