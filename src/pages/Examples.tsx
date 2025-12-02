import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { examples, categories, Example } from '@/lib/examples';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
});

const ExampleCard = ({ example, onUse }: { example: Example; onUse: () => void }) => {
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState(false);

  useEffect(() => {
    const renderPreview = async () => {
      try {
        const id = `preview-${example.id}-${Date.now()}`;
        const { svg } = await mermaid.render(id, example.code);
        setSvgContent(svg);
      } catch {
        setError(true);
      }
    };
    renderPreview();
  }, [example.code, example.id]);

  const category = categories.find(c => c.id === example.category);

  return (
    <div className="group glass rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-glow">
      {/* Preview */}
      <div className="h-48 bg-background/50 p-4 overflow-hidden flex items-center justify-center">
        {error ? (
          <div className="text-muted-foreground text-sm">Preview unavailable</div>
        ) : svgContent ? (
          <div 
            className="w-full h-full flex items-center justify-center [&_svg]:max-w-full [&_svg]:max-h-full [&_svg]:w-auto [&_svg]:h-auto scale-75"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <div className="animate-pulse h-20 w-20 rounded-full bg-muted" />
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {example.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{example.description}</p>
          </div>
          {category && (
            <span className="shrink-0 text-lg" title={category.name}>
              {category.icon}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={onUse}>
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Use Template
          </Button>
          <Button 
            size="sm" 
            variant="secondary"
            onClick={() => {
              navigator.clipboard.writeText(example.code);
              toast.success('Code copied to clipboard');
            }}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const Examples = () => {
  const navigate = useNavigate();
  const { setCode, setCurrentProjectId } = useAppStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredExamples = examples.filter(example => {
    const matchesSearch = 
      example.name.toLowerCase().includes(search.toLowerCase()) ||
      example.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || example.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseExample = useCallback((example: Example) => {
    setCode(example.code);
    setCurrentProjectId(null);
    toast.success(`Loaded "${example.name}"`);
    navigate('/');
  }, [setCode, setCurrentProjectId, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Example Gallery</h1>
              <p className="text-sm text-muted-foreground">
                {examples.length} beautiful diagram templates
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates..."
                className="pl-10"
              />
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={selectedCategory === null ? 'default' : 'secondary'}
                onClick={() => setSelectedCategory(null)}
              >
                All
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  size="sm"
                  variant={selectedCategory === cat.id ? 'default' : 'secondary'}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <span className="mr-1.5">{cat.icon}</span>
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Gallery */}
      <main className="container mx-auto px-4 py-8">
        {filteredExamples.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No templates found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredExamples.map((example) => (
              <ExampleCard
                key={example.id}
                example={example}
                onUse={() => handleUseExample(example)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Examples;
