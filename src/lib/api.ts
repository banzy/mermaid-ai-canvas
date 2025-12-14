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

const getSystemPrompt = (context?: string) => {
  let prompt = 'You are a helpful assistant that specializes in creating and explaining Mermaid diagrams. When asked to create or modify diagrams, provide only the Mermaid code unless asked for explanations.';
  
  if (context) {
    prompt += `\n\nHere is the current Mermaid diagram code you are working with:\n\`\`\`mermaid\n${context}\n\`\`\`\n\nIf the user asks to modify the diagram, use this code as the baseline. Return the full updated Mermaid code.\n\nCRITICAL RULES FOR MODIFICATIONS:\n- Modify the existing diagram IN PLACE. Do NOT create a new or different flow; keep the overall structure and style as close as possible to the original.\n- Only add, remove, or adjust the nodes/edges/styles that are strictly necessary to follow the instruction.\n- Keep the same diagram type (e.g. flowchart TD stays flowchart TD).\n- Keep the existing style blocks unless they must change to remain consistent.\n- When removing a node: Remove ALL edges connected to that node. Do NOT automatically reroute edges to other nodes unless the user explicitly asks you to.\n- Keep node IDs, styling, and layout direction consistent with the original.\n- Make MINIMAL changes - only modify what is explicitly requested.`;
  }
  
  return prompt;
};

// Local LLM helper (LM Studio uses OpenAI-compatible API)
const callLocalLLM = async (
  prompt: string,
  history?: Message[],
  context?: string
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
      content: getSystemPrompt(context),
    },
    ...(history || []).map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    { role: 'user', content: prompt },
  ];

  const requestBody: any = {
    messages,
    temperature: 0.2,
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
  history?: Message[],
  context?: string
): Promise<string> => {
  const settings = await getSecureSettings();
  const apiKey = settings.openaiApiKey;

  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const messages = [
    {
      role: 'system',
      content: getSystemPrompt(context),
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
      temperature: 0.2,
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
  history?: Message[],
  context?: string
): Promise<string> => {
  const settings = await getSecureSettings();
  const apiKey = settings.groqApiKey;

  if (!apiKey) {
    throw new Error('Groq API key not configured');
  }

  const messages = [
    {
      role: 'system',
      content: getSystemPrompt(context),
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
        temperature: 0.2,
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
          // Fallback to the other provider if preferred one is not available
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

    // Use Local LLM (non-streaming for simplicity)
    const result = await callLocalLLM(prompt, history, context);
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

  // Smart Reorganize diagram (Hybrid Safe Mode)
  async reorganize(mermaid: string): Promise<string> {
    const settings = await getSecureSettings();

    // 1. EXTRACT NODES (PRESERVE CONTENT)
    // Regex matches: ID, ShapeStart, Content, ShapeEnd
    const nodePattern = /([A-Za-z_][A-Za-z0-9_]*)\s*(\[.*?\]|\(.*?\)|\{.*?\}|\(\(.*?\)\)|>.*?\]|\[\[.*?\]\])/g;
    const nodeMap = new Map<string, string>();
    let match;
    
    // Copy regex source for iteration
    const nodeRegex = new RegExp(nodePattern);
    const lines = mermaid.split('\n');
    let direction = 'TD';

    for (const line of lines) {
      if (line.match(/^(?:graph|flowchart)\s+(TB|TD|BT|LR|RL)/i)) {
        direction = line.match(/^(?:graph|flowchart)\s+(TB|TD|BT|LR|RL)/i)![1];
      }
      while ((match = nodeRegex.exec(line)) !== null) {
        if (!nodeMap.has(match[1])) {
          nodeMap.set(match[1], match[0]); // Store full definition "A[Label]"
        }
      }
    }

    // 2. PREPARE SIMPLIFIED INPUT FOR LLM
    // Send only the connections and minimal node info
    const prompt = `You are a Logic Engine. I will provide a list of Nodes and the current Connections.
Your task is to "Heal" the flow by connecting logical predecessors to successors where gaps exist (e.g. if a node was removed).

Nodes (Reference Only):
${Array.from(nodeMap.keys()).join(', ')}

Current Mermaid Code (Analyze Connections):
${mermaid}

Instructions:
1. Identify the logical flow.
2. If there are broken chains (Node A -> [Missing] -> Node C), connect A -> C directly.
3. RENUMBER IDs sequentially (A, B, C...) for the output connections.
4. Output ONLY the new connections using the NEW IDs.
   - Format: A --> B
   - Do NOT include node labels/content in the output, ONLY IDs.

Output Format:
A --> B
B --> C
...`;

    let result: string;
    // Use lower temp for logic
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

    // 3. REASSEMBLE DIAGRAM
    // Map old IDs to new sequential IDs based on appearance in the LLM output
    // This is tricky because LLM might output new IDs A, B, C... but we need to map old content to them.
    // BETTER STRATEGY: Ask LLM to output "OldID --> OldID" optimized interactions, then WE renumber.
    
    // Let's Retry the Prompt Strategy to be "Return cleaned Mermaid but strictly use the PROVIDED Node definitions"
    
    const refinedPrompt = `You are a Mermaid Diagram Expert. 
    
TASK: Fix the flow connections in this diagram.
CRITICAL CONSTRAINT: You must use the EXACT Node Definitions provided below. Do NOT change symbols, text, or shapes.

DEFINITIONS (Use these EXACTLY):
${Array.from(nodeMap.values()).join('\n')}

INPUT DIAGRAM (Flow is broken):
${mermaid}

INSTRUCTIONS:
1. "Heal" the broken connections (connect A to C if B is missing).
2. Remove orphan nodes.
3. Use the Definitions above. If you need a node, copy its definition EXACTLY.
4. Return the full valid Mermaid code (flowchart ${direction}).
`;

    if (settings.useExternalApi) {
        const preferredProvider = settings.externalApiProvider || 'openai';
         if (preferredProvider === 'openai' && settings.openaiApiKey) {
            result = await callOpenAI(refinedPrompt);
        } else if (preferredProvider === 'groq' && settings.groqApiKey) {
             result = await callGroq(refinedPrompt);
        } else {
           if (settings.openaiApiKey) result = await callOpenAI(refinedPrompt);
           else if (settings.groqApiKey) result = await callGroq(refinedPrompt);
           else throw new Error('No external API key configured');
        }
    } else {
        result = await callLocalLLM(refinedPrompt);
    }

    const codeMatch = result.match(/```(?:mermaid)?\n([\s\S]*?)\n```/);
    return codeMatch ? codeMatch[1].trim() : result.trim();
  },
};
