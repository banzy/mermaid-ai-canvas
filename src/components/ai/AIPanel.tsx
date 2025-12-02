import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Replace, 
  Trash2,
  Loader2,
  Bot,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export const AIPanel = () => {
  const { 
    chat, 
    editor,
    isAIPanelOpen, 
    isPanelMinimized,
    aiPanelHeight,
    setAIPanelHeight,
    setIsPanelMinimized,
    addMessage, 
    updateLastMessage, 
    setIsStreaming,
    setCode,
    clearChat,
  } = useAppStore();
  
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

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
      let fullContent = '';
      for await (const chunk of api.generate(input.trim(), chat.messages)) {
        fullContent += chunk;
        updateLastMessage(fullContent);
      }
    } catch (error) {
      toast.error('Failed to generate response');
      updateLastMessage('Sorry, I encountered an error. Please check your API connection.');
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

  const extractMermaidCode = (content: string): string | null => {
    const match = content.match(/```(?:mermaid)?\n?([\s\S]*?)```/);
    return match ? match[1].trim() : null;
  };

  const handleReplace = (content: string) => {
    const code = extractMermaidCode(content);
    if (code) {
      setCode(code);
      toast.success('Diagram replaced');
    } else {
      toast.error('No Mermaid code found in response');
    }
  };

  const handleCopy = (content: string) => {
    const code = extractMermaidCode(content) || content;
    navigator.clipboard.writeText(code);
    toast.success('Copied to clipboard');
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = aiPanelHeight;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = startY - e.clientY;
      setAIPanelHeight(startHeight + delta);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (!isAIPanelOpen) return null;

  return (
    <div 
      className="flex flex-col border-t border-border bg-card animate-slide-up"
      style={{ height: isPanelMinimized ? 48 : aiPanelHeight }}
    >
      {/* Resize handle */}
      {!isPanelMinimized && (
        <div
          ref={resizeRef}
          className="h-1 cursor-ns-resize bg-border hover:bg-primary/50 transition-colors"
          onMouseDown={handleResizeStart}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-ai-accent">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm">AI Assistant</span>
          {chat.isStreaming && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Thinking...
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={clearChat}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsPanelMinimized(!isPanelMinimized)}
          >
            {isPanelMinimized ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {!isPanelMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {chat.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="rounded-full bg-primary/10 p-4 mb-3">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-medium text-foreground mb-1">AI-Powered Diagram Assistant</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Ask me to create, modify, or explain Mermaid diagrams. I can help with flowcharts, sequences, and more.
                </p>
              </div>
            ) : (
              chat.messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3 animate-fade-in",
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
                      "max-w-[80%] rounded-xl px-4 py-2.5",
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'glass'
                    )}
                  >
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    {message.role === 'assistant' && extractMermaidCode(message.content) && (
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 text-xs"
                          onClick={() => handleReplace(message.content)}
                        >
                          <Replace className="mr-1 h-3 w-3" />
                          Replace
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 text-xs"
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
          <div className="border-t border-border p-3">
            <div className="flex gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask AI to create or modify a diagram..."
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
        </>
      )}
    </div>
  );
};
