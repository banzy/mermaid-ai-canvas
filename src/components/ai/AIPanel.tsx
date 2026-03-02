import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Send,
  Sparkles,
  Copy,
  Trash2,
  Loader2,
  Bot,
  User,
  Layers,
  GitBranch,
  Boxes,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { SelectedView } from '@/lib/schemas';

export const AIPanel = () => {
  const {
    chat,
    project,
    isAIPanelOpen,
    selectedView,
    setSelectedView,
    addMessage,
    updateLastMessage,
    setIsStreaming,
    clearChat,
  } = useAppStore();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages]);

  const handleSend = async () => {
    if (!input.trim() || chat.isStreaming) return;

    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: input.trim(),
      timestamp: Date.now(),
    };

    addMessage(userMessage);
    setInput('');
    setIsStreaming(true);

    const assistantMessage = {
      id: crypto.randomUUID(),
      role: 'assistant' as const,
      content: '',
      timestamp: Date.now(),
    };
    addMessage(assistantMessage);

    try {
      const context = JSON.stringify(project, null, 2);
      let fullContent = '';
      for await (const chunk of api.generate(input.trim(), chat.messages, context)) {
        fullContent += chunk;
        updateLastMessage(fullContent);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to generate response: ${errorMessage}`);
      updateLastMessage(
        `Sorry, I encountered an error: ${errorMessage}\n\nPlease check your API connection and settings.`
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
  };

  const viewTabs: { id: SelectedView; label: string; icon: React.ReactNode }[] = [
    { id: 'operational', label: 'Operational', icon: <Boxes className="h-3.5 w-3.5" /> },
    { id: 'functional', label: 'Functional', icon: <Layers className="h-3.5 w-3.5" /> },
    { id: 'flow', label: 'Flow', icon: <GitBranch className="h-3.5 w-3.5" /> },
  ];

  if (!isAIPanelOpen) return null;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, hsl(222 47% 8%), hsl(222 47% 6%))' }}
    >
      {/* Header */}
      <div className="shrink-0 border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-ai-accent">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm text-white">AI Assistant</span>
            {chat.isStreaming && (
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <Loader2 className="h-3 w-3 animate-spin" />
                Thinking...
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-zinc-500 hover:text-white"
            onClick={clearChat}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* View Switcher */}
      <div className="shrink-0 border-b border-white/10 px-4 py-2">
        <div className="flex gap-1">
          {viewTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedView(tab.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                selectedView === tab.id
                  ? 'bg-primary/15 text-primary'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {chat.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="rounded-full bg-primary/10 p-4 mb-3">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-medium text-white mb-1">
              Architecture Assistant
            </h3>
            <p className="text-sm text-zinc-500 max-w-sm">
              Describe a software idea and I'll generate operational blocks,
              functional blocks, and flow views. You can also ask me to
              modify the current architecture.
            </p>
          </div>
        ) : (
          chat.messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3 animate-fade-in',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-ai-accent">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[85%] rounded-xl px-4 py-2.5',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'glass'
                )}
              >
                <div className="text-sm whitespace-pre-wrap">
                  {message.content}
                </div>
                {message.role === 'assistant' && message.content && (
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-6 text-[10px]"
                      onClick={() => handleCopy(message.content)}
                    >
                      <Copy className="mr-1 h-3 w-3" />
                      Copy
                    </Button>
                  </div>
                )}
              </div>
              {message.role === 'user' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-white/10 p-3">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe an app idea or ask to modify blocks..."
            className="min-h-[44px] max-h-32 resize-none bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-primary"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || chat.isStreaming}
            className="shrink-0 bg-gradient-to-r from-primary to-ai-accent hover:opacity-90"
          >
            {chat.isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
