import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { z } from 'zod';
import {
  EditorState,
  ChatState,
  Settings,
  Message,
  Project,
  editorStateSchema,
  chatStateSchema,
  settingsSchema,
  projectSchema,
  INITIAL_MERMAID
} from '@/lib/schemas';
import {
  getSecureData,
  setSecureData,
  removeSecureData,
} from '@/lib/secureStorage';

interface AppState {
  // Editor slice
  editor: EditorState;
  setCode: (code: string) => void;
  setSelectedNodeId: (id: string | null) => void;
  setCursorPosition: (position: { line: number; column: number } | null) => void;
  setErrors: (errors: { line: number; message: string }[]) => void;
  setIsDirty: (dirty: boolean) => void;

  // Chat slice
  chat: ChatState;
  addMessage: (message: Message) => void;
  updateLastMessage: (content: string) => void;
  setIsStreaming: (streaming: boolean) => void;
  setCurrentModel: (model: string | null) => void;
  setAvailableModels: (models: string[]) => void;
  clearChat: () => void;

  // Settings slice
  settings: Settings;
  updateSettings: (settings: Partial<Settings>) => void;
  setSecureApiKey: (key: 'openaiApiKey' | 'groqApiKey', value: string) => Promise<void>;
  getSecureApiKey: (key: 'openaiApiKey' | 'groqApiKey') => Promise<string | null>;
  setSecureApiUrl: (value: string) => Promise<void>;
  getSecureApiUrl: () => Promise<string | null>;

  // Projects slice
  projects: Project[];
  currentProjectId: string | null;
  saveProject: (name?: string) => void;
  loadProject: (id: string) => void;
  deleteProject: (id: string) => void;
  setCurrentProjectId: (id: string | null) => void;

  // UI slice
  isAIPanelOpen: boolean;
  isPanelMinimized: boolean;
  aiPanelHeight: number;
  toggleAIPanel: () => void;
  setAIPanelOpen: (open: boolean) => void;
  setAIPanelHeight: (height: number) => void;
  setIsPanelMinimized: (minimized: boolean) => void;

  // Command palette
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
}

const initialEditorState: EditorState = {
  code: INITIAL_MERMAID,
  selectedNodeId: null,
  cursorPosition: null,
  errors: [],
  isDirty: false,
};

const initialChatState: ChatState = {
  messages: [],
  isStreaming: false,
  currentModel: null,
  availableModels: [],
};

const initialSettings: Settings = {
  apiUrl: '',
  defaultModel: '',
  autoSave: true,
  autoSaveInterval: 3000,
  openaiApiKey: '',
  groqApiKey: '',
  useExternalApi: false,
  externalApiProvider: 'openai',
};

// Validation helpers
const validateState = <T>(schema: z.ZodSchema<T>, data: unknown, fallback: T): T => {
  const result = schema.safeParse(data);
  return result.success ? result.data : fallback;
};

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Editor
        editor: initialEditorState,
        setCode: (code) => {
          const validated = z.string().safeParse(code);
          if (validated.success) {
            set((state) => ({
              editor: { ...state.editor, code: validated.data, isDirty: true }
            }));
          }
        },
        setSelectedNodeId: (id) => set((state) => ({
          editor: { ...state.editor, selectedNodeId: id }
        })),
        setCursorPosition: (position) => set((state) => ({
          editor: { ...state.editor, cursorPosition: position }
        })),
        setErrors: (errors) => set((state) => ({
          editor: { ...state.editor, errors }
        })),
        setIsDirty: (dirty) => set((state) => ({
          editor: { ...state.editor, isDirty: dirty }
        })),

        // Chat
        chat: initialChatState,
        addMessage: (message) => {
          const validated = z.object({
            id: z.string(),
            role: z.enum(['user', 'assistant']),
            content: z.string(),
            timestamp: z.number(),
          }).safeParse(message);

          if (validated.success) {
            set((state) => ({
              chat: { ...state.chat, messages: [...state.chat.messages, validated.data] }
            }));
          }
        },
        updateLastMessage: (content) => set((state) => {
          const messages = [...state.chat.messages];
          if (messages.length > 0) {
            messages[messages.length - 1] = {
              ...messages[messages.length - 1],
              content,
            };
          }
          return { chat: { ...state.chat, messages } };
        }),
        setIsStreaming: (streaming) => set((state) => ({
          chat: { ...state.chat, isStreaming: streaming }
        })),
        setCurrentModel: (model) => set((state) => ({
          chat: { ...state.chat, currentModel: model }
        })),
        setAvailableModels: (models) => set((state) => ({
          chat: { ...state.chat, availableModels: models }
        })),
        clearChat: () => set((state) => ({
          chat: { ...state.chat, messages: [] }
        })),

        // Settings
        settings: initialSettings,
        updateSettings: (newSettings) => {
          const current = get().settings;
          const merged = { ...current, ...newSettings };
          const validated = settingsSchema.safeParse(merged);
          if (validated.success) {
            set({ settings: validated.data });
          }
        },
        setSecureApiKey: async (keyName, value) => {
          try {
            if (value) {
              // Encrypt and store the API key securely
              await setSecureData(keyName, value);
            } else {
              // Remove the key if empty
              removeSecureData(keyName);
            }
            // Store a flag in regular settings to indicate the key exists
            const current = get().settings;
            set({
              settings: {
                ...current,
                [keyName]: value ? '***ENCRYPTED***' : '',
              },
            });
          } catch (error) {
            console.error(`Failed to set secure API key for ${keyName}:`, error);
            throw error;
          }
        },
        getSecureApiKey: async (keyName) => {
          try {
            return await getSecureData(keyName);
          } catch (error) {
            console.error(`Failed to get secure API key for ${keyName}:`, error);
            return null;
          }
        },
        setSecureApiUrl: async (value) => {
          try {
            if (value) {
              await setSecureData('apiUrl', value);
            } else {
              removeSecureData('apiUrl');
            }
            const current = get().settings;
            set({
              settings: {
                ...current,
                apiUrl: value ? '***ENCRYPTED***' : '',
              },
            });
          } catch (error) {
            console.error('Failed to set secure API URL:', error);
            throw error;
          }
        },
        getSecureApiUrl: async () => {
          try {
            return await getSecureData('apiUrl');
          } catch (error) {
            console.error('Failed to get secure API URL:', error);
            return null;
          }
        },

        // Projects
        projects: [],
        currentProjectId: null,
        saveProject: (name) => {
          const { editor, projects, currentProjectId } = get();
          const now = Date.now();

          if (currentProjectId) {
            // Update existing project
            set({
              projects: projects.map(p =>
                p.id === currentProjectId
                  ? { ...p, code: editor.code, updatedAt: now, name: name || p.name }
                  : p
              ),
              editor: { ...editor, isDirty: false }
            });
          } else {
            // Create new project
            const newProject: Project = {
              id: crypto.randomUUID(),
              name: name || `Project ${projects.length + 1}`,
              code: editor.code,
              createdAt: now,
              updatedAt: now,
            };
            set({
              projects: [...projects, newProject],
              currentProjectId: newProject.id,
              editor: { ...editor, isDirty: false }
            });
          }
        },
        loadProject: (id) => {
          const project = get().projects.find(p => p.id === id);
          if (project) {
            set((state) => ({
              editor: { ...state.editor, code: project.code, isDirty: false },
              currentProjectId: id,
            }));
          }
        },
        deleteProject: (id) => {
          set((state) => ({
            projects: state.projects.filter(p => p.id !== id),
            currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
          }));
        },
        setCurrentProjectId: (id) => set({ currentProjectId: id }),

        // UI
        isAIPanelOpen: true,
        isPanelMinimized: false,
        aiPanelHeight: 300,
        toggleAIPanel: () => set((state) => ({ isAIPanelOpen: !state.isAIPanelOpen })),
        setAIPanelOpen: (open) => set({ isAIPanelOpen: open }),
        setAIPanelHeight: (height) => set({ aiPanelHeight: Math.max(150, Math.min(600, height)) }),
        setIsPanelMinimized: (minimized) => set({ isPanelMinimized: minimized }),

        // Command palette
        isCommandPaletteOpen: false,
        setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
      }),
      {
        name: 'mermaid-ai-studio-storage',
        partialize: (state) => ({
          editor: { code: state.editor.code },
          chat: { messages: state.chat.messages },
          settings: state.settings,
          projects: state.projects,
          currentProjectId: state.currentProjectId,
        }),
      }
    ),
    { name: 'MermaidAIStudio' }
  )
);
