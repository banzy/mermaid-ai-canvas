import { z } from 'zod';
import { 
  modelsResponseSchema, 
  explainResponseSchema, 
  refineResponseSchema,
  Message 
} from './schemas';

const getApiUrl = () => {
  const stored = localStorage.getItem('mermaid-ai-studio-storage');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.state?.settings?.apiUrl) {
        return parsed.state.settings.apiUrl;
      }
    } catch {}
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:8000';
};

export const api = {
  // Get available models
  async getModels(): Promise<string[]> {
    const response = await fetch(`${getApiUrl()}/api/models`);
    if (!response.ok) throw new Error('Failed to fetch models');
    const data = await response.json();
    const validated = modelsResponseSchema.parse(data);
    return validated.models;
  },

  // Generate with streaming
  async *generate(prompt: string, history?: Message[]): AsyncGenerator<string> {
    const response = await fetch(`${getApiUrl()}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, history }),
    });

    if (!response.ok) throw new Error('Failed to generate');
    if (!response.body) throw new Error('No response body');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) yield parsed.content;
          } catch {
            yield data;
          }
        }
      }
    }
  },

  // Explain diagram
  async explain(mermaid: string): Promise<string> {
    const response = await fetch(`${getApiUrl()}/api/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mermaid }),
    });
    if (!response.ok) throw new Error('Failed to explain diagram');
    const data = await response.json();
    const validated = explainResponseSchema.parse(data);
    return validated.explanation;
  },

  // Refine diagram
  async refine(mermaid: string, instruction: string): Promise<string> {
    const response = await fetch(`${getApiUrl()}/api/refine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mermaid, instruction }),
    });
    if (!response.ok) throw new Error('Failed to refine diagram');
    const data = await response.json();
    const validated = refineResponseSchema.parse(data);
    return validated.mermaid;
  },
};
