import { z } from 'zod';

// Message schema
export const messageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  timestamp: z.number(),
});

export type Message = z.infer<typeof messageSchema>;

// API Schemas
export const generateRequestSchema = z.object({
  prompt: z.string().min(1),
  history: z.array(messageSchema).optional(),
});

export const modelsResponseSchema = z.object({
  models: z.array(z.string()),
});

export const explainRequestSchema = z.object({
  mermaid: z.string().min(1),
});

export const explainResponseSchema = z.object({
  explanation: z.string(),
});

export const refineRequestSchema = z.object({
  mermaid: z.string().min(1),
  instruction: z.string().min(1),
});

export const refineResponseSchema = z.object({
  mermaid: z.string(),
});

// Editor State Schema
export const editorStateSchema = z.object({
  code: z.string(),
  selectedNodeId: z.string().nullable(),
  cursorPosition: z.object({
    line: z.number(),
    column: z.number(),
  }).nullable(),
  errors: z.array(z.object({
    line: z.number(),
    message: z.string(),
  })),
  isDirty: z.boolean(),
});

export type EditorState = z.infer<typeof editorStateSchema>;

// Chat State Schema
export const chatStateSchema = z.object({
  messages: z.array(messageSchema),
  isStreaming: z.boolean(),
  currentModel: z.string().nullable(),
  availableModels: z.array(z.string()),
});

export type ChatState = z.infer<typeof chatStateSchema>;

// Settings Schema
export const settingsSchema = z.object({
  apiUrl: z.string().url().or(z.literal('')),
  defaultModel: z.string(),
  autoSave: z.boolean(),
  autoSaveInterval: z.number().min(1000).max(60000),
});

export type Settings = z.infer<typeof settingsSchema>;

// Project Schema
export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Project = z.infer<typeof projectSchema>;

// Initial Mermaid Code
export const INITIAL_MERMAID = `flowchart TD
    A[🚀 Start] --> B{Decision Point}
    B -->|Yes| C[Process A]
    B -->|No| D[Process B]
    C --> E[Result 1]
    D --> E
    E --> F[🎯 End]
    
    style A fill:#0ea5e9,stroke:#0284c7,color:#fff
    style F fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style B fill:#1e293b,stroke:#334155,color:#fff`;
