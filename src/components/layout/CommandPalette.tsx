import { useEffect } from 'react';
import { Command } from 'cmdk';
import { useAppStore } from '@/stores/useAppStore';
import { EMPTY_PROJECT } from '@/lib/examples';
import {
  Plus,
  Save,
  Sparkles,
  Trash2,
  FolderOpen,
  Layers,
  GitBranch,
  Boxes,
} from 'lucide-react';
import { toast } from 'sonner';

export const CommandPalette = () => {
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    setProject,
    saveProject,
    toggleAIPanel,
    projects,
    loadProject,
    currentProjectId,
    setCurrentProjectId,
    clearChat,
    setSelectedView,
  } = useAppStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  const handleAction = (action: () => void) => {
    action();
    setCommandPaletteOpen(false);
  };

  const handleNew = () => {
    setProject({ ...EMPTY_PROJECT, id: crypto.randomUUID() });
    setCurrentProjectId(null);
    toast.success('New project created');
  };

  const handleSave = () => {
    saveProject();
    toast.success('Project saved');
  };

  if (!isCommandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in"
        onClick={() => setCommandPaletteOpen(false)}
      />

      {/* Command Panel */}
      <div className="absolute left-1/2 top-1/4 w-full max-w-lg -translate-x-1/2 animate-scale-in">
        <Command className="glass-intense rounded-xl shadow-2xl overflow-hidden border border-border">
          <Command.Input
            placeholder="Type a command or search..."
            className="w-full bg-transparent border-b border-border px-4 py-4 text-foreground placeholder:text-muted-foreground outline-none"
          />
          <Command.List className="p-2 max-h-80 overflow-y-auto scrollbar-thin">
            <Command.Empty className="px-4 py-8 text-center text-muted-foreground text-sm">
              No results found.
            </Command.Empty>

            <Command.Group heading="File" className="mb-2">
              <Command.Item
                onSelect={() => handleAction(handleNew)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-muted-foreground data-[selected=true]:bg-secondary data-[selected=true]:text-foreground"
              >
                <Plus className="h-4 w-4" />
                <span>New Project</span>
                <span className="ml-auto text-xs opacity-50">⌘N</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleAction(handleSave)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-muted-foreground data-[selected=true]:bg-secondary data-[selected=true]:text-foreground"
              >
                <Save className="h-4 w-4" />
                <span>Save Project</span>
                <span className="ml-auto text-xs opacity-50">⌘S</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="View" className="mb-2">
              <Command.Item
                onSelect={() => handleAction(() => setSelectedView('operational'))}
                className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-muted-foreground data-[selected=true]:bg-secondary data-[selected=true]:text-foreground"
              >
                <Boxes className="h-4 w-4" />
                <span>Operational View</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleAction(() => setSelectedView('functional'))}
                className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-muted-foreground data-[selected=true]:bg-secondary data-[selected=true]:text-foreground"
              >
                <Layers className="h-4 w-4" />
                <span>Functional View</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleAction(() => setSelectedView('flow'))}
                className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-muted-foreground data-[selected=true]:bg-secondary data-[selected=true]:text-foreground"
              >
                <GitBranch className="h-4 w-4" />
                <span>Flow View</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="AI" className="mb-2">
              <Command.Item
                onSelect={() => handleAction(toggleAIPanel)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-muted-foreground data-[selected=true]:bg-secondary data-[selected=true]:text-foreground"
              >
                <Sparkles className="h-4 w-4" />
                <span>Toggle AI Panel</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleAction(clearChat)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-muted-foreground data-[selected=true]:bg-secondary data-[selected=true]:text-foreground"
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear Chat History</span>
              </Command.Item>
            </Command.Group>

            {projects.length > 0 && (
              <Command.Group heading="Projects">
                {projects.map((project) => (
                  <Command.Item
                    key={project.id}
                    onSelect={() => handleAction(() => {
                      loadProject(project.id);
                      toast.success(`Opened "${project.name}"`);
                    })}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-muted-foreground data-[selected=true]:bg-secondary data-[selected=true]:text-foreground"
                  >
                    <FolderOpen className="h-4 w-4" />
                    <span>{project.name}</span>
                    {project.id === currentProjectId && (
                      <span className="ml-auto text-xs text-primary">Current</span>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
};
