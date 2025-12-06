import { z } from 'zod';
import {
  modelsResponseSchema,
  explainResponseSchema,
  refineResponseSchema,
  Message,
} from './schemas';
import { getSecureData } from './secureStorage';

interface Settings {
  apiUrl?: string;
  useExternalApi?: boolean;
  openaiApiKey?: string;
  groqApiKey?: string;
  externalApiProvider?: 'openai' | 'groq';
}

const getSettings = (): Settings => {
  const stored = localStorage.getItem('mermaid-ai-studio-storage');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return parsed.state?.settings || {};
    } catch { }
  }
  return {};
};

const getSecureSettings = async (): Promise<Settings> => {
  const settings = getSettings();

  // Retrieve encrypted API keys
  const openaiApiKey = await getSecureData('openaiApiKey');
  const groqApiKey = await getSecureData('groqApiKey');

  return {
    ...settings,
    openaiApiKey: openaiApiKey || undefined,
    groqApiKey: groqApiKey || undefined,
  };
};

const getApiUrl = async () => {
  const secureApiUrl = await getSecureData('apiUrl');
  if (secureApiUrl) {
    return secureApiUrl;
  }

  const settings = getSettings();
  if (settings.apiUrl && settings.apiUrl !== '***ENCRYPTED***') {
    return settings.apiUrl;
  }

  // Default to LM Studio's default port
  return import.meta.env.VITE_API_URL || 'http://localhost:1234';
};

// Local LLM helper (LM Studio uses OpenAI-compatible API)
const callLocalLLM = async (
  prompt: string,
  history?: Message[]
): Promise<string> => {
  // First, get available models to use one
  let model = '';
  try {
    const baseUrl = await getApiUrl();
    const modelsResponse = await fetch(`${baseUrl}/v1/models`);
    if (modelsResponse.ok) {
      const modelsData = await modelsResponse.json();
      if (
        modelsData.data &&
        Array.isArray(modelsData.data) &&
        modelsData.data.length > 0
      ) {
        model = modelsData.data[0].id;
      } else if (
        modelsData.models &&
        Array.isArray(modelsData.models) &&
        modelsData.models.length > 0
      ) {
        model = modelsData.models[0];
      }
    }
  } catch (error) {
    console.warn(
      'Failed to fetch models, proceeding without model parameter:',
      error
    );
  }

  const messages = [
    {
      role: 'system',
      content:
        'You are a helpful assistant that specializes in creating and explaining Mermaid diagrams. When asked to create or modify diagrams, provide only the Mermaid code unless asked for explanations.',
    },
    ...(history || []).map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    { role: 'user', content: prompt },
  ];

  const requestBody: any = {
    messages,
    temperature: 0.7,
    stream: false,
  };

  // Include model if we found one (LM Studio requires it)
  if (model) {
    requestBody.model = model;
  }

  const baseUrl = await getApiUrl();
  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Local LLM API error: HTTP ${response.status}`;
    try {
      const errorData = JSON.parse(errorText);
      errorMessage += ` - ${errorData.error?.message || errorText}`;
    } catch {
      errorMessage += ` - ${errorText.substring(0, 200)}`;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  if (!data.choices || !data.choices[0]?.message?.content) {
    throw new Error('Invalid response format from local LLM');
  }
  return data.choices[0].message.content;
};

// External API helpers
const callOpenAI = async (
  prompt: string,
  history?: Message[]
): Promise<string> => {
  const settings = await getSecureSettings();
  const apiKey = settings.openaiApiKey;

  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const messages = [
    {
      role: 'system',
      content:
        'You are a helpful assistant that specializes in creating and explaining Mermaid diagrams. When asked to create or modify diagrams, provide only the Mermaid code unless asked for explanations.',
    },
    ...(history || []).map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    { role: 'user', content: prompt },
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
};

const callGroq = async (
  prompt: string,
  history?: Message[]
): Promise<string> => {
  const settings = await getSecureSettings();
  const apiKey = settings.groqApiKey;

  if (!apiKey) {
    throw new Error('Groq API key not configured');
  }

  const messages = [
    {
      role: 'system',
      content:
        'You are a helpful assistant that specializes in creating and explaining Mermaid diagrams. When asked to create or modify diagrams, provide only the Mermaid code unless asked for explanations.',
    },
    ...(history || []).map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    { role: 'user', content: prompt },
  ];

  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
      }),
    }
  );

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
    const settings = await getSecureSettings();

    if (settings.useExternalApi) {
      const models = [];
      if (settings.openaiApiKey) models.push('OpenAI GPT-4o-mini');
      if (settings.groqApiKey) models.push('Groq Llama 3.3 70B');
      return models;
    }

    // Use LM Studio's OpenAI-compatible /v1/models endpoint
    const baseUrl = await getApiUrl();
    const response = await fetch(`${baseUrl}/v1/models`);
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
    const settings = await getSecureSettings();

    if (settings.useExternalApi) {
      let result: string;
      const preferredProvider = settings.externalApiProvider || 'openai';

      try {
        if (preferredProvider === 'openai' && settings.openaiApiKey) {
          result = await callOpenAI(prompt, history);
        } else if (preferredProvider === 'groq' && settings.groqApiKey) {
          result = await callGroq(prompt, history);
        } else {
          // Fallback to the other provider if preferred one is not available
          if (settings.openaiApiKey) {
            result = await callOpenAI(prompt, history);
          } else if (settings.groqApiKey) {
            result = await callGroq(prompt, history);
          } else {
            throw new Error('No external API key configured');
          }
        }
      } catch (error) {
        throw error;
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
    const settings = await getSecureSettings();
    const prompt = `Explain this Mermaid diagram in detail:\n\n${mermaid}`;

    if (settings.useExternalApi) {
      const preferredProvider = settings.externalApiProvider || 'openai';

      if (preferredProvider === 'openai' && settings.openaiApiKey) {
        return await callOpenAI(prompt);
      } else if (preferredProvider === 'groq' && settings.groqApiKey) {
        return await callGroq(prompt);
      } else {
        // Fallback to the other provider if preferred one is not available
        if (settings.openaiApiKey) {
          return await callOpenAI(prompt);
        } else if (settings.groqApiKey) {
          return await callGroq(prompt);
        } else {
          throw new Error('No external API key configured');
        }
      }
    }

    // Use Local LLM
    return await callLocalLLM(prompt);
  },

  // Refine diagram
  async refine(mermaid: string, instruction: string): Promise<string> {
    const settings = await getSecureSettings();
    const prompt = `You are editing an existing Mermaid diagram.\n\nCurrent Mermaid diagram:\n${mermaid}\n\nEdit instruction:\n${instruction}\n\nRules:\n- Modify the existing diagram IN PLACE.\n- Do NOT create a new or different flow; keep the overall structure and style as close as possible to the original.\n- Only add, remove, or adjust the nodes/edges/styles that are strictly necessary to follow the instruction.\n- Keep the same diagram type (e.g. flowchart TD stays flowchart TD).\n- Keep the existing style blocks unless they must change to remain consistent.\n\nReturn ONLY the full, updated Mermaid code (no explanation, no backticks).`;

    let result: string;

    if (settings.useExternalApi) {
      const preferredProvider = settings.externalApiProvider || 'openai';

      if (preferredProvider === 'openai' && settings.openaiApiKey) {
        result = await callOpenAI(prompt);
      } else if (preferredProvider === 'groq' && settings.groqApiKey) {
        result = await callGroq(prompt);
      } else {
        // Fallback to the other provider if preferred one is not available
        if (settings.openaiApiKey) {
          result = await callOpenAI(prompt);
        } else if (settings.groqApiKey) {
          result = await callGroq(prompt);
        } else {
          throw new Error('No external API key configured');
        }
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
