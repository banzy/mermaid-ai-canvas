import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  ArrowLeft,
  Server,
  Clock,
  Trash2,
  Download,
  Upload,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const Settings = () => {
  const navigate = useNavigate();
  const { settings, updateSettings, setSecureApiKey, getSecureApiKey, setSecureApiUrl, getSecureApiUrl, projects } = useAppStore();
  const [apiUrl, setApiUrl] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [groqApiKey, setGroqApiKey] = useState('');
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [testingLocalLLM, setTestingLocalLLM] = useState(false);
  const [testingOpenAI, setTestingOpenAI] = useState(false);
  const [testingGroq, setTestingGroq] = useState(false);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [externalApiProvider, setExternalApiProvider] = useState<'openai' | 'groq'>(
    settings.externalApiProvider || 'openai'
  );

  // Load encrypted API keys on mount
  useEffect(() => {
    const loadApiKeys = async () => {
      try {
        const openai = await getSecureApiKey('openaiApiKey');
        const groq = await getSecureApiKey('groqApiKey');
        setOpenaiApiKey(openai || '');
        setGroqApiKey(groq || '');
        const storedApiUrl = await getSecureApiUrl();
        setApiUrl(storedApiUrl || '');
      } catch (error) {
        console.error('Failed to load API keys:', error);
      } finally {
        setLoadingKeys(false);
      }
    };
    loadApiKeys();
  }, [getSecureApiKey, getSecureApiUrl]);

  const handleSaveApiUrl = async () => {
    try {
      await setSecureApiUrl(apiUrl);
      toast.success('API URL saved securely');
    } catch (error) {
      toast.error('Failed to save API URL');
      console.error(error);
    }
  };

  const handleSaveOpenAIKey = async () => {
    try {
      await setSecureApiKey('openaiApiKey', openaiApiKey);
      toast.success('OpenAI API key saved securely');
    } catch (error) {
      toast.error('Failed to save OpenAI API key');
      console.error(error);
    }
  };

  const handleSaveGroqKey = async () => {
    try {
      await setSecureApiKey('groqApiKey', groqApiKey);
      toast.success('Groq API key saved securely');
    } catch (error) {
      toast.error('Failed to save Groq API key');
      console.error(error);
    }
  };

  const handleTestLocalLLM = async () => {
    // Save the current API URL before testing
    try {
      await setSecureApiUrl(apiUrl);
    } catch (error) {
      toast.error('Failed to save API URL before testing');
      console.error(error);
      return;
    }

    setTestingLocalLLM(true);
    try {
      // Default to LM Studio's default port (1234)
      const url =
        apiUrl || import.meta.env.VITE_API_URL || 'http://localhost:1234';
      // Use LM Studio's OpenAI-compatible /v1/models endpoint
      const response = await fetch(`${url}/v1/models`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      // Get response text first to show in toast
      const responseText = await response.text();

      if (!response.ok) {
        toast.error(
          `HTTP ${response.status}: ${response.statusText}\nResponse: ${responseText.substring(0, 200)}`
        );
        return;
      }

      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        toast.warning(
          `Response received but not valid JSON:\n${responseText.substring(0, 200)}`
        );
        return;
      }

      // LM Studio returns { data: [{ id: "model-name", ... }] }
      if (data.data && Array.isArray(data.data)) {
        const modelNames = data.data.map((m: { id: string }) => m.id);
        toast.success(
          `Connection successful! Found ${modelNames.length} model(s): ${modelNames.join(', ')}`
        );
      } else if (data.models && Array.isArray(data.models)) {
        toast.success(
          `Connection successful! Found ${data.models.length} model(s): ${data.models.join(', ')}`
        );
      } else {
        toast.success(
          `Connection successful!\nResponse: ${JSON.stringify(data).substring(0, 200)}`
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Connection failed';
      toast.error(`Local LLM test failed: ${message}`);
    } finally {
      setTestingLocalLLM(false);
    }
  };

  const handleTestOpenAI = async () => {
    const keyToTest = openaiApiKey || settings.openaiApiKey;
    if (!keyToTest) {
      toast.error('Please enter an API key first');
      return;
    }

    // Save the current key before testing
    try {
      await setSecureApiKey('openaiApiKey', keyToTest);
    } catch (error) {
      toast.error('Failed to save OpenAI API key before testing');
      console.error(error);
      return;
    }

    setTestingOpenAI(true);
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${keyToTest}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HTTP ${response.status}: ${error}`);
      }

      const data = await response.json();
      toast.success('OpenAI API key is valid!');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Invalid API key';
      toast.error(`OpenAI test failed: ${message}`);
    } finally {
      setTestingOpenAI(false);
    }
  };

  const handleTestGroq = async () => {
    const keyToTest = groqApiKey || settings.groqApiKey;
    if (!keyToTest) {
      toast.error('Please enter an API key first');
      return;
    }

    // Save the current key before testing
    try {
      await setSecureApiKey('groqApiKey', keyToTest);
    } catch (error) {
      toast.error('Failed to save Groq API key before testing');
      console.error(error);
      return;
    }

    setTestingGroq(true);
    try {
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${keyToTest}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HTTP ${response.status}: ${error}`);
      }

      const data = await response.json();
      toast.success('Groq API key is valid!');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Invalid API key';
      toast.error(`Groq test failed: ${message}`);
    } finally {
      setTestingGroq(false);
    }
  };

  const handleClearStorage = () => {
    localStorage.removeItem('mindtoblocks-storage');
    toast.success('All data cleared. Refresh the page.');
    setConfirmClearOpen(false);
  };

  const handleExportData = () => {
    const data = {
      settings,
      projects,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mindtoblocks-backup.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported');
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.settings) {
          updateSettings(data.settings);
        }
        toast.success('Data imported. Refresh the page to see changes.');
      } catch {
        toast.error('Invalid backup file');
      }
    };
    reader.readAsText(file);
  };

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
              <h1 className="text-xl font-semibold">Settings</h1>
              <p className="text-sm text-muted-foreground">
                Configure your workspace
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-8">
        {/* API Configuration */}
        <section className="glass rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Server className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">API Configuration</h2>
              <p className="text-sm text-muted-foreground">
                Connect to your own backend server
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiUrl">Backend API URL</Label>
            <div className="flex gap-2">
              <Input
                id="apiUrl"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://localhost:8000"
              />
              <Button onClick={handleSaveApiUrl}>Save</Button>
              <Button
                variant="outline"
                onClick={handleTestLocalLLM}
                disabled={testingLocalLLM}
              >
                {testingLocalLLM ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Test'
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty to use the default URL from environment variables.
            </p>
          </div>
        </section>

        {/* External API Keys */}
        <section className="glass rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Server className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">External API Keys</h2>
                <p className="text-sm text-muted-foreground">
                  Configure API keys for external AI providers
                </p>
              </div>
            </div>

            {/* Provider Toggle */}
            <div className="flex items-center gap-3 ml-auto">
              <Label className="text-sm font-normal">Preferred Provider:</Label>
              <RadioGroup value={externalApiProvider} onValueChange={(value) => {
                setExternalApiProvider(value as 'openai' | 'groq');
                updateSettings({ externalApiProvider: value as 'openai' | 'groq' });
              }}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="openai" id="provider-openai" />
                  <Label htmlFor="provider-openai" className="font-normal cursor-pointer">OpenAI</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="groq" id="provider-groq" />
                  <Label htmlFor="provider-groq" className="font-normal cursor-pointer">Groq</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="space-y-4">
            {/* OpenAI API Key */}
            <div className="space-y-2">
              <Label htmlFor="openaiApiKey">OpenAI API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="openaiApiKey"
                  type="password"
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                  placeholder="sk-..."
                  disabled={loadingKeys}
                />
                <Button
                  onClick={handleSaveOpenAIKey}
                  disabled={openaiApiKey.length < 16 || loadingKeys}
                >
                  Save
                </Button>
                <Button
                  variant="outline"
                  onClick={handleTestOpenAI}
                  disabled={testingOpenAI || openaiApiKey.length < 16 || loadingKeys}
                >
                  {testingOpenAI ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Test'
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Will use GPT-4o-mini (cheapest model)
                {openaiApiKey.length > 0 && openaiApiKey.length < 16 && (
                  <span className="text-destructive ml-2">
                    (API key must be at least 16 characters)
                  </span>
                )}
              </p>
            </div>

            {/* Groq API Key */}
            <div className="space-y-2">
              <Label htmlFor="groqApiKey">Groq API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="groqApiKey"
                  type="password"
                  value={groqApiKey}
                  onChange={(e) => setGroqApiKey(e.target.value)}
                  placeholder="gsk_..."
                  disabled={loadingKeys}
                />
                <Button
                  onClick={handleSaveGroqKey}
                  disabled={groqApiKey.length < 16 || loadingKeys}
                >
                  Save
                </Button>
                <Button
                  variant="outline"
                  onClick={handleTestGroq}
                  disabled={testingGroq || groqApiKey.length < 16 || loadingKeys}
                >
                  {testingGroq ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Test'
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Fast and cost-effective inference
                {groqApiKey.length > 0 && groqApiKey.length < 16 && (
                  <span className="text-destructive ml-2">
                    (API key must be at least 16 characters)
                  </span>
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Auto-save Settings */}
        <section className="glass rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Auto-save</h2>
              <p className="text-sm text-muted-foreground">
                Automatically save your work
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="autoSave">Enable Auto-save</Label>
            <Switch
              id="autoSave"
              checked={settings.autoSave}
              onCheckedChange={(checked) =>
                updateSettings({ autoSave: checked })
              }
            />
          </div>

          {settings.autoSave && (
            <div className="space-y-2">
              <Label>
                Auto-save Interval: {settings.autoSaveInterval / 1000}s
              </Label>
              <Slider
                value={[settings.autoSaveInterval]}
                onValueChange={([value]) =>
                  updateSettings({ autoSaveInterval: value })
                }
                min={1000}
                max={30000}
                step={1000}
              />
              <p className="text-xs text-muted-foreground">
                How often to save changes (1-30 seconds)
              </p>
            </div>
          )}
        </section>

        {/* Data Management */}
        <section className="glass rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Data Management</h2>
              <p className="text-sm text-muted-foreground">
                Export and import your data
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={handleExportData}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button variant="secondary" asChild>
              <label className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Import Data
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportData}
                />
              </label>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            {projects.length} projects saved locally
          </p>
        </section>

        {/* Danger Zone */}
        <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h2 className="font-semibold text-destructive">Danger Zone</h2>
              <p className="text-sm text-muted-foreground">
                Irreversible actions
              </p>
            </div>
          </div>

          <Button
            variant="destructive"
            onClick={() => setConfirmClearOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All Data
          </Button>
        </section>
      </main>

      {/* Confirm Clear Dialog */}
      <Dialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <DialogContent className="glass-intense">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Clear All Data?
            </DialogTitle>
            <DialogDescription>
              This will permanently delete all your projects, settings, and chat
              history. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setConfirmClearOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearStorage}>
              Yes, Clear Everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
