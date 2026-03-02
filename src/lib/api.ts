import {
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
  const stored = localStorage.getItem('mindtoblocks-storage');
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
  if (secureApiUrl) return secureApiUrl;

  const settings = getSettings();
  if (settings.apiUrl && settings.apiUrl !== '***ENCRYPTED***') {
    return settings.apiUrl;
  }

  return import.meta.env.VITE_API_URL || 'http://localhost:1234';
};

const getSystemPrompt = (context?: string) => {
  let prompt = `You are MindtoBlocks — an architecture assistant that creates and modifies structured operational and functional block diagrams from software descriptions.

When the user describes a software idea, analyze it and respond with a JSON object following this structure:
{
  "operationalBlocks": [{ "id": "...", "label": "...", "description": "...", "kind": "operational", "type": "capability|subsystem|orchestration|storage|interaction|transformation" }],
  "functionalBlocks": [{ "id": "...", "label": "...", "description": "...", "kind": "functional", "type": "input|parser|classifier|model|renderer|editor|generator|persistence" }],
  "relations": [{ "id": "...", "from": "...", "to": "...", "type": "triggers|feeds|depends_on|updates|contains|transforms_into|explains|persists_to" }],
  "flows": [{ "id": "...", "label": "...", "steps": ["Step 1", "Step 2"] }]
}

When asked to modify the architecture, update the relevant blocks/relations and return the full updated JSON.
When asked to explain, respond in natural language.`;

  if (context) {
    prompt += `\n\nHere is the current architecture model you are working with:\n\`\`\`json\n${context}\n\`\`\`\n\nWhen modifying, use this as the baseline and make minimal changes. Return the full updated JSON model.`;
  }

  return prompt;
};

// Local LLM helper (OpenAI-compatible API)
const callLocalLLM = async (
  prompt: string,
  history?: Message[],
  context?: string
): Promise<string> => {
  let model = '';
  try {
    const baseUrl = await getApiUrl();
    const modelsResponse = await fetch(`${baseUrl}/v1/models`);
    if (modelsResponse.ok) {
      const modelsData = await modelsResponse.json();
      if (modelsData.data && Array.isArray(modelsData.data) && modelsData.data.length > 0) {
        model = modelsData.data[0].id;
      } else if (modelsData.models && Array.isArray(modelsData.models) && modelsData.models.length > 0) {
        model = modelsData.models[0];
      }
    }
  } catch (error) {
    console.warn('Failed to fetch models:', error);
  }

  const messages = [
    { role: 'system', content: getSystemPrompt(context) },
    ...(history || []).map((msg) => ({ role: msg.role, content: msg.content })),
    { role: 'user', content: prompt },
  ];

  const requestBody: any = { messages, temperature: 0.2, stream: false };
  if (model) requestBody.model = model;

  const baseUrl = await getApiUrl();
  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
  history?: Message[],
  context?: string
): Promise<string> => {
  const settings = await getSecureSettings();
  const apiKey = settings.openaiApiKey;
  if (!apiKey) throw new Error('OpenAI API key not configured');

  const messages = [
    { role: 'system', content: getSystemPrompt(context) },
    ...(history || []).map((msg) => ({ role: msg.role, content: msg.content })),
    { role: 'user', content: prompt },
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages, temperature: 0.2 }),
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
  history?: Message[],
  context?: string
): Promise<string> => {
  const settings = await getSecureSettings();
  const apiKey = settings.groqApiKey;
  if (!apiKey) throw new Error('Groq API key not configured');

  const messages = [
    { role: 'system', content: getSystemPrompt(context) },
    ...(history || []).map((msg) => ({ role: msg.role, content: msg.content })),
    { role: 'user', content: prompt },
  ];

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, temperature: 0.2 }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
};

export const api = {
  async getModels(): Promise<string[]> {
    const settings = await getSecureSettings();

    if (settings.useExternalApi) {
      const models = [];
      if (settings.openaiApiKey) models.push('OpenAI GPT-4o-mini');
      if (settings.groqApiKey) models.push('Groq Llama 3.3 70B');
      return models;
    }

    const baseUrl = await getApiUrl();
    const response = await fetch(`${baseUrl}/v1/models`);
    if (!response.ok) throw new Error('Failed to fetch models');
    const data = await response.json();

    if (data.data && Array.isArray(data.data)) {
      return data.data.map((model: { id: string }) => model.id);
    }
    if (data.models && Array.isArray(data.models)) {
      return data.models;
    }
    return [];
  },

  async *generate(prompt: string, history?: Message[], context?: string): AsyncGenerator<string> {
    const settings = await getSecureSettings();

    if (settings.useExternalApi) {
      let result: string;
      const preferredProvider = settings.externalApiProvider || 'openai';

      try {
        if (preferredProvider === 'openai' && settings.openaiApiKey) {
          result = await callOpenAI(prompt, history, context);
        } else if (preferredProvider === 'groq' && settings.groqApiKey) {
          result = await callGroq(prompt, history, context);
        } else {
          if (settings.openaiApiKey) {
            result = await callOpenAI(prompt, history, context);
          } else if (settings.groqApiKey) {
            result = await callGroq(prompt, history, context);
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

    const result = await callLocalLLM(prompt, history, context);
    yield result;
  },

  // Explain architecture
  async explain(projectJson: string): Promise<string> {
    const settings = await getSecureSettings();
    const prompt = `Explain this software architecture in detail, covering the main capabilities, how they connect, and key flows:\n\n${projectJson}`;

    if (settings.useExternalApi) {
      const preferredProvider = settings.externalApiProvider || 'openai';
      if (preferredProvider === 'openai' && settings.openaiApiKey) {
        return await callOpenAI(prompt);
      } else if (preferredProvider === 'groq' && settings.groqApiKey) {
        return await callGroq(prompt);
      } else {
        if (settings.openaiApiKey) return await callOpenAI(prompt);
        else if (settings.groqApiKey) return await callGroq(prompt);
        else throw new Error('No external API key configured');
      }
    }

    return await callLocalLLM(prompt);
  },

  // Refine architecture
  async refine(projectJson: string, instruction: string): Promise<string> {
    const settings = await getSecureSettings();
    const prompt = `You are editing an existing software architecture model.\n\nCurrent model:\n${projectJson}\n\nEdit instruction:\n${instruction}\n\nRules:\n- Modify the model IN PLACE.\n- Only add, remove, or adjust the blocks/relations that are strictly necessary.\n- Keep existing IDs and structure consistent.\n- Make MINIMAL changes.\n\nReturn ONLY the full, updated JSON model (no explanation, no markdown fences).`;

    let result: string;

    if (settings.useExternalApi) {
      const preferredProvider = settings.externalApiProvider || 'openai';
      if (preferredProvider === 'openai' && settings.openaiApiKey) {
        result = await callOpenAI(prompt);
      } else if (preferredProvider === 'groq' && settings.groqApiKey) {
        result = await callGroq(prompt);
      } else {
        if (settings.openaiApiKey) result = await callOpenAI(prompt);
        else if (settings.groqApiKey) result = await callGroq(prompt);
        else throw new Error('No external API key configured');
      }
    } else {
      result = await callLocalLLM(prompt);
    }

    // Extract JSON from response
    const jsonMatch = result.match(/```(?:json)?\n([\s\S]*?)\n```/);
    return jsonMatch ? jsonMatch[1].trim() : result.trim();
  },
};
