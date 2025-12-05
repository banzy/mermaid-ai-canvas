import { z } from 'zod';
import { 
  modelsResponseSchema, 
  explainResponseSchema, 
  refineResponseSchema,
  Message 
} from './schemas';

interface Settings {
  apiUrl?: string;
  useExternalApi?: boolean;
  openaiApiKey?: string;
  groqApiKey?: string;
}

const getSettings = (): Settings => {
  const stored = localStorage.getItem('mermaid-ai-studio-storage');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return parsed.state?.settings || {};
    } catch {}
  }
  return {};
};

const getApiUrl = () => {
  const settings = getSettings();
  if (settings.apiUrl) {
    return settings.apiUrl;
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:8000';
};

// External API helpers
const callOpenAI = async (prompt: string, history?: Message[]): Promise<string> => {
  const settings = getSettings();
  const apiKey = settings.openaiApiKey;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const messages = [
    ...(history || []).map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    { role: 'user', content: prompt }
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
};

const callGroq = async (prompt: string, history?: Message[]): Promise<string> => {
  const settings = getSettings();
  const apiKey = settings.groqApiKey;
  
  if (!apiKey) {
    throw new Error('Groq API key not configured');
  }

  const messages = [
    ...(history || []).map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    { role: 'user', content: prompt }
  ];

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
};

export const api = {
  // Get available models
  async getModels(): Promise<string[]> {
    const settings = getSettings();
    
    if (settings.useExternalApi) {
      const models = [];
      if (settings.openaiApiKey) models.push('OpenAI GPT-4o-mini');
      if (settings.groqApiKey) models.push('Groq Llama 3.3 70B');
      return models;
    }

    const response = await fetch(`${getApiUrl()}/api/models`);
    if (!response.ok) throw new Error('Failed to fetch models');
    const data = await response.json();
    const validated = modelsResponseSchema.parse(data);
    return validated.models;
  },

  // Generate with streaming
  async *generate(prompt: string, history?: Message[]): AsyncGenerator<string> {
    const settings = getSettings();

    if (settings.useExternalApi) {
      // Use external API (non-streaming for simplicity)
      let result: string;
      
      if (settings.openaiApiKey) {
        result = await callOpenAI(prompt, history);
      } else if (settings.groqApiKey) {
        result = await callGroq(prompt, history);
      } else {
        throw new Error('No external API key configured');
      }
      
      yield result;
      return;
    }

    // Use internal API with streaming
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
    const settings = getSettings();

    if (settings.useExternalApi) {
      const prompt = `Explain this Mermaid diagram in detail:\n\n${mermaid}`;
      
      if (settings.openaiApiKey) {
        return await callOpenAI(prompt);
      } else if (settings.groqApiKey) {
        return await callGroq(prompt);
      } else {
        throw new Error('No external API key configured');
      }
    }

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
    const settings = getSettings();

    if (settings.useExternalApi) {
      const prompt = `Refine this Mermaid diagram according to the instruction.\n\nCurrent diagram:\n${mermaid}\n\nInstruction: ${instruction}\n\nProvide only the updated Mermaid code, nothing else.`;
      
      let result: string;
      if (settings.openaiApiKey) {
        result = await callOpenAI(prompt);
      } else if (settings.groqApiKey) {
        result = await callGroq(prompt);
      } else {
        throw new Error('No external API key configured');
      }

      // Extract mermaid code from response
      const codeMatch = result.match(/```(?:mermaid)?\n([\s\S]*?)\n```/);
      return codeMatch ? codeMatch[1].trim() : result.trim();
    }

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
