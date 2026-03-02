import { z } from 'zod';

// ─── Block & Relation Types ────────────────────────────────────────────────────

export const blockKindSchema = z.enum(['operational', 'functional', 'flow']);
export type BlockKind = z.infer<typeof blockKindSchema>;

export const blockTypeSchema = z.enum([
  // Operational
  'capability', 'subsystem', 'orchestration', 'storage', 'interaction', 'transformation',
  // Functional
  'input', 'parser', 'classifier', 'model', 'renderer', 'editor', 'generator', 'persistence',
  // Flow
  'start', 'action', 'decision', 'state', 'output', 'external_actor',
]);
export type BlockType = z.infer<typeof blockTypeSchema>;

export const relationTypeSchema = z.enum([
  'triggers', 'feeds', 'depends_on', 'updates', 'contains',
  'transforms_into', 'explains', 'persists_to',
]);
export type RelationType = z.infer<typeof relationTypeSchema>;

// ─── Core Entities ─────────────────────────────────────────────────────────────

export const blockNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  kind: blockKindSchema,
  type: blockTypeSchema,
  children: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type BlockNode = z.infer<typeof blockNodeSchema>;

export const relationSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  type: relationTypeSchema,
  label: z.string().optional(),
});
export type Relation = z.infer<typeof relationSchema>;

export const flowStepSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['start', 'action', 'decision', 'end']).default('action'),
});

export const flowDefinitionSchema = z.object({
  id: z.string(),
  label: z.string(),
  steps: z.array(z.string()),
});
export type FlowDefinition = z.infer<typeof flowDefinitionSchema>;

// ─── MindProject ───────────────────────────────────────────────────────────────

export const selectedViewSchema = z.enum(['operational', 'functional', 'flow']);
export type SelectedView = z.infer<typeof selectedViewSchema>;

export const mindProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  operationalBlocks: z.array(blockNodeSchema),
  functionalBlocks: z.array(blockNodeSchema),
  flowBlocks: z.array(blockNodeSchema).optional(),
  relations: z.array(relationSchema),
  flows: z.array(flowDefinitionSchema),
});
export type MindProject = z.infer<typeof mindProjectSchema>;

// ─── Chat / Messages (kept from original) ──────────────────────────────────────

export const messageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  timestamp: z.number(),
});
export type Message = z.infer<typeof messageSchema>;

export const chatStateSchema = z.object({
  messages: z.array(messageSchema),
  isStreaming: z.boolean(),
  currentModel: z.string().nullable(),
  availableModels: z.array(z.string()),
});
export type ChatState = z.infer<typeof chatStateSchema>;

// ─── Settings (kept from original) ─────────────────────────────────────────────

export const settingsSchema = z.object({
  apiUrl: z.string().url().or(z.literal('')).or(z.literal('***ENCRYPTED***')),
  defaultModel: z.string(),
  autoSave: z.boolean(),
  autoSaveInterval: z.number().min(1000).max(60000),
  openaiApiKey: z.string().optional(),
  groqApiKey: z.string().optional(),
  useExternalApi: z.boolean().optional(),
  externalApiProvider: z.enum(['openai', 'groq']).optional(),
});
export type Settings = z.infer<typeof settingsSchema>;

// ─── Project persistence ───────────────────────────────────────────────────────

export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  project: mindProjectSchema,
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type Project = z.infer<typeof projectSchema>;

// ─── API Schemas ───────────────────────────────────────────────────────────────

export const generateRequestSchema = z.object({
  prompt: z.string().min(1),
  history: z.array(messageSchema).optional(),
});

export const modelsResponseSchema = z.object({
  models: z.array(z.string()),
});
