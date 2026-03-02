import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/useAppStore';
import { MINDTOBLOCKS_SELF } from '@/lib/examples';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Download,
  Save,
  Plus,
  Settings,
  Command,
  Sparkles,
  ChevronDown,
  FolderOpen,
  Cloud,
  Server,
  Boxes,
} from 'lucide-react';
import { toast } from 'sonner';

export const Header = () => {
  const navigate = useNavigate();
  const {
    project,
    projects,
    currentProjectId,
    isDirty,
    saveProject,
    loadProject,
    setProject,
    setCommandPaletteOpen,
    toggleAIPanel,
    isAIPanelOpen,
    setCurrentProjectId,
    settings,
    updateSettings,
  } = useAppStore();

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectsDialogOpen, setProjectsDialogOpen] = useState(false);

  const currentProject = projects.find(p => p.id === currentProjectId);

  const handleNew = () => {
    setProject(MINDTOBLOCKS_SELF);
    setCurrentProjectId(null);
    toast.success('New project created');
  };

  const handleSave = () => {
    if (currentProjectId) {
      saveProject();
      toast.success('Project saved');
    } else {
      setSaveDialogOpen(true);
    }
  };

  const handleSaveAs = () => {
    if (projectName.trim()) {
      saveProject(projectName.trim());
      setSaveDialogOpen(false);
      setProjectName('');
      toast.success('Project saved');
    }
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(project, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name || 'mindtoblocks-project'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Project JSON exported');
  };

  const handleToggleExternalApi = () => {
    const newValue = !settings.useExternalApi;
    updateSettings({ useExternalApi: newValue });
    toast.success(newValue ? 'Using External API' : 'Using Internal API');
  };

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-ai-accent glow-primary">
            <Boxes className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground">MindtoBlocks</h1>
            <p className="text-xs text-muted-foreground">
              {currentProject ? currentProject.name : project.name}
              {isDirty && <span className="text-warning ml-1">•</span>}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Command Palette Hint */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden md:flex gap-2 text-muted-foreground"
          >
            <Command className="h-3.5 w-3.5" />
            <span className="text-xs">⌘K</span>
          </Button>

          {/* AI Toggle */}
          <Button
            variant={isAIPanelOpen ? "default" : "secondary"}
            size="sm"
            onClick={toggleAIPanel}
            className={isAIPanelOpen ? "bg-gradient-to-r from-primary to-ai-accent" : ""}
          >
            <Sparkles className="h-4 w-4 mr-1.5" />
            AI
          </Button>

          {/* API Mode Toggle */}
          <Button
            variant={settings.useExternalApi ? "default" : "secondary"}
            size="sm"
            onClick={handleToggleExternalApi}
            title={settings.useExternalApi ? "Using External API" : "Using Internal API"}
          >
            {settings.useExternalApi ? (
              <Cloud className="h-4 w-4 mr-1.5" />
            ) : (
              <Server className="h-4 w-4 mr-1.5" />
            )}
            {settings.useExternalApi ? "External" : "Internal"}
          </Button>

          {/* New */}
          <Button variant="ghost" size="sm" onClick={handleNew}>
            <Plus className="h-4 w-4 mr-1.5" />
            New
          </Button>

          {/* Open */}
          <Button variant="ghost" size="sm" onClick={() => setProjectsDialogOpen(true)}>
            <FolderOpen className="h-4 w-4 mr-1.5" />
            Open
          </Button>

          {/* Save */}
          <Button variant="ghost" size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-1.5" />
            Save
          </Button>

          {/* Export */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4 mr-1.5" />
                Export
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleExportJSON}>
                <Download className="h-4 w-4 mr-2" />
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Settings */}
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="glass-intense">
          <DialogHeader>
            <DialogTitle>Save Project</DialogTitle>
            <DialogDescription>
              Give your project a name to save it.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Project name"
            onKeyDown={(e) => e.key === 'Enter' && handleSaveAs()}
          />
          <DialogFooter>
            <Button variant="secondary" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAs} disabled={!projectName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Projects Dialog */}
      <Dialog open={projectsDialogOpen} onOpenChange={setProjectsDialogOpen}>
        <DialogContent className="glass-intense">
          <DialogHeader>
            <DialogTitle>Open Project</DialogTitle>
            <DialogDescription>
              Select a project to open.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {projects.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No saved projects yet.
              </p>
            ) : (
              projects.map((proj) => (
                <button
                  key={proj.id}
                  onClick={() => {
                    loadProject(proj.id);
                    setProjectsDialogOpen(false);
                    toast.success(`Opened "${proj.name}"`);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors text-left"
                >
                  <div>
                    <p className="font-medium">{proj.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(proj.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  {proj.id === currentProjectId && (
                    <span className="text-xs text-primary">Current</span>
                  )}
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
