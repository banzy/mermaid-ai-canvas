import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/useAppStore';
import { MINDTOBLOCKS_SELF, BLOCK_TYPE_COLORS } from '@/lib/examples';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink, Boxes } from 'lucide-react';
import { toast } from 'sonner';

const Examples = () => {
  const navigate = useNavigate();
  const { setProject, setCurrentProjectId } = useAppStore();

  const handleUse = () => {
    setProject(MINDTOBLOCKS_SELF);
    setCurrentProjectId(null);
    toast.success('Loaded MindtoBlocks demo project');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Example Projects</h1>
              <p className="text-sm text-muted-foreground">
                Architecture templates to get you started
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6">
          {/* MindtoBlocks Self-Describing Project */}
          <div className="glass rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-glow">
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-ai-accent">
                    <Boxes className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">
                      {MINDTOBLOCKS_SELF.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {MINDTOBLOCKS_SELF.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Blocks preview */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
                {MINDTOBLOCKS_SELF.operationalBlocks.map((block) => {
                  const color = BLOCK_TYPE_COLORS[block.type] || 'hsl(215 20% 55%)';
                  return (
                    <div
                      key={block.id}
                      className="rounded-lg border border-white/10 px-3 py-2 bg-white/[0.03]"
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: color }}
                        />
                        <span className="text-xs font-medium text-zinc-200 truncate">
                          {block.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 uppercase">
                        {block.type}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                <span>{MINDTOBLOCKS_SELF.operationalBlocks.length} operational blocks</span>
                <span>·</span>
                <span>{MINDTOBLOCKS_SELF.functionalBlocks.length} functional blocks</span>
                <span>·</span>
                <span>{MINDTOBLOCKS_SELF.relations.length} relations</span>
                <span>·</span>
                <span>{MINDTOBLOCKS_SELF.flows.length} flows</span>
              </div>

              <Button onClick={handleUse}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Use This Template
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Examples;
