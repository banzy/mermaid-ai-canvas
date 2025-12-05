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
  // Default to LM Studio's default port
  return import.meta.env.VITE_API_URL || 'http://localhost:1234';
};

// Local LLM helper (LM Studio uses OpenAI-compatible API)
const callLocalLLM = async (prompt: string, history?: Message[]): Promise<string> => {
  const messages = [
    { role: 'system', content: 'You are a helpful assistant that specializes in creating and explaining Mermaid diagrams. When asked to create or modify diagrams, provide only the Mermaid code unless asked for explanations.' },
    ...(history || []).map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    { role: 'user', content: prompt }
  ];

  const response = await fetch(`${getApiUrl()}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      temperature: 0.7,
      stream: false,
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Local LLM API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
};

// External API helpers
const callOpenAI = async (prompt: string, history?: Message[]): Promise<string> => {
  const settings = getSettings();
  const apiKey = settings.openaiApiKey;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const messages = [
    { role: 'system', content: 'You are a helpful assistant that specializes in creating and explaining Mermaid diagrams. When asked to create or modify diagrams, provide only the Mermaid code unless asked for explanations.' },
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
    { role: 'system', content: 'You are a helpful assistant that specializes in creating and explaining Mermaid diagrams. When asked to create or modify diagrams, provide only the Mermaid code unless asked for explanations.' },
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
  // Get available models from LM Studio
  async getModels(): Promise<string[]> {
    const settings = getSettings();
    
    if (settings.useExternalApi) {
      const models = [];
      if (settings.openaiApiKey) models.push('OpenAI GPT-4o-mini');
      if (settings.groqApiKey) models.push('Groq Llama 3.3 70B');
      return models;
    }

    // Use LM Studio's OpenAI-compatible /v1/models endpoint
    const response = await fetch(`${getApiUrl()}/v1/models`);
    if (!response.ok) throw new Error('Failed to fetch models');
    const data = await response.json();
    
    // LM Studio returns { data: [{ id: "model-name", ... }] }
    if (data.data && Array.isArray(data.data)) {
      return data.data.map((model: { id: string }) => model.id);
    }
    
    // Fallback for other formats
    if (data.models && Array.isArray(data.models)) {
      return data.models;
    }
    
    return [];
  },

  // Generate with streaming using LM Studio
  async *generate(prompt: string, history?: Message[]): AsyncGenerator<string> {
    const settings = getSettings();

    if (settings.useExternalApi) {
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

    // Use Local LLM (non-streaming for simplicity)
    const result = await callLocalLLM(prompt, history);
    yield result;
  },

  // Explain diagram
  async explain(mermaid: string): Promise<string> {
    const settings = getSettings();
    const prompt = `Explain this Mermaid diagram in detail:\n\n${mermaid}`;

    if (settings.useExternalApi) {
      if (settings.openaiApiKey) {
        return await callOpenAI(prompt);
      } else if (settings.groqApiKey) {
        return await callGroq(prompt);
      } else {
        throw new Error('No external API key configured');
      }
    }

    // Use Local LLM
    return await callLocalLLM(prompt);
  },

  // Refine diagram
  async refine(mermaid: string, instruction: string): Promise<string> {
    const settings = getSettings();
    const prompt = `Refine this Mermaid diagram according to the instruction.\n\nCurrent diagram:\n${mermaid}\n\nInstruction: ${instruction}\n\nProvide only the updated Mermaid code, nothing else.`;

    let result: string;

    if (settings.useExternalApi) {
      if (settings.openaiApiKey) {
        result = await callOpenAI(prompt);
      } else if (settings.groqApiKey) {
        result = await callGroq(prompt);
      } else {
        throw new Error('No external API key configured');
      }
    } else {
      // Use Local LLM
      result = await callLocalLLM(prompt);
    }

    // Extract mermaid code from response
    const codeMatch = result.match(/```(?:mermaid)?\n([\s\S]*?)\n```/);
    return codeMatch ? codeMatch[1].trim() : result.trim();
  },
};
