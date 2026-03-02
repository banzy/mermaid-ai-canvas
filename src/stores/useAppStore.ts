import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { z } from 'zod';
import {
  type MindProject,
  type Message,
  type Settings,
  type ChatState,
  type SelectedView,
  type BlockNode,
  type Relation,
  type Project,
  settingsSchema,
} from '@/lib/schemas';
import { MINDTOBLOCKS_SELF } from '@/lib/examples';
import {
  getSecureData,
  setSecureData,
  removeSecureData,
} from '@/lib/secureStorage';

interface AppState {
  // ─── Project (source of truth) ──────────────────────────────────────────────
  project: MindProject;
  selectedView: SelectedView;
  selectedNodeId: string | null;
  isDirty: boolean;

  setProject: (project: MindProject) => void;
  setSelectedView: (view: SelectedView) => void;
  setSelectedNodeId: (id: string | null) => void;
  setIsDirty: (dirty: boolean) => void;

  // Block mutations
  renameNode: (id: string, newLabel: string) => void;
  updateNodeDescription: (id: string, description: string) => void;
  addNode: (node: BlockNode) => void;
  deleteNode: (id: string) => void;
  addRelation: (relation: Relation) => void;
  deleteRelation: (id: string) => void;

  // ─── Chat ───────────────────────────────────────────────────────────────────
  chat: ChatState;
  addMessage: (message: Message) => void;
  updateLastMessage: (content: string) => void;
  setIsStreaming: (streaming: boolean) => void;
  setCurrentModel: (model: string | null) => void;
  setAvailableModels: (models: string[]) => void;
  clearChat: () => void;

  // ─── Settings ───────────────────────────────────────────────────────────────
  settings: Settings;
  updateSettings: (settings: Partial<Settings>) => void;
  setSecureApiKey: (key: 'openaiApiKey' | 'groqApiKey', value: string) => Promise<void>;
  getSecureApiKey: (key: 'openaiApiKey' | 'groqApiKey') => Promise<string | null>;
  setSecureApiUrl: (value: string) => Promise<void>;
  getSecureApiUrl: () => Promise<string | null>;

  // ─── Saved Projects ─────────────────────────────────────────────────────────
  projects: Project[];
  currentProjectId: string | null;
  saveProject: (name?: string) => void;
  loadProject: (id: string) => void;
  deleteProject: (id: string) => void;
  setCurrentProjectId: (id: string | null) => void;

  // ─── UI ─────────────────────────────────────────────────────────────────────
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

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // ─── Project ────────────────────────────────────────────────────────────
        project: MINDTOBLOCKS_SELF,
        selectedView: 'operational' as SelectedView,
        selectedNodeId: null,
        isDirty: false,

        setProject: (project) => set({ project, isDirty: true }),
        setSelectedView: (view) => set({ selectedView: view }),
        setSelectedNodeId: (id) => set({ selectedNodeId: id }),
        setIsDirty: (dirty) => set({ isDirty: dirty }),

        // Block mutations
        renameNode: (id, newLabel) => {
          const { project } = get();
          const updateBlocks = (blocks: BlockNode[]) =>
            blocks.map(b => b.id === id ? { ...b, label: newLabel } : b);
          set({
            project: {
              ...project,
              operationalBlocks: updateBlocks(project.operationalBlocks),
              functionalBlocks: updateBlocks(project.functionalBlocks),
            },
            isDirty: true,
          });
        },

        updateNodeDescription: (id, description) => {
          const { project } = get();
          const updateBlocks = (blocks: BlockNode[]) =>
            blocks.map(b => b.id === id ? { ...b, description } : b);
          set({
            project: {
              ...project,
              operationalBlocks: updateBlocks(project.operationalBlocks),
              functionalBlocks: updateBlocks(project.functionalBlocks),
            },
            isDirty: true,
          });
        },

        addNode: (node) => {
          const { project } = get();
          const target = node.kind === 'operational' ? 'operationalBlocks' : 'functionalBlocks';
          set({
            project: {
              ...project,
              [target]: [...project[target], node],
            },
            isDirty: true,
          });
        },

        deleteNode: (id) => {
          const { project, selectedNodeId } = get();
          set({
            project: {
              ...project,
              operationalBlocks: project.operationalBlocks.filter(b => b.id !== id),
              functionalBlocks: project.functionalBlocks.filter(b => b.id !== id),
              relations: project.relations.filter(r => r.from !== id && r.to !== id),
            },
            selectedNodeId: selectedNodeId === id ? null : selectedNodeId,
            isDirty: true,
          });
        },

        addRelation: (relation) => {
          const { project } = get();
          set({
            project: {
              ...project,
              relations: [...project.relations, relation],
            },
            isDirty: true,
          });
        },

        deleteRelation: (id) => {
          const { project } = get();
          set({
            project: {
              ...project,
              relations: project.relations.filter(r => r.id !== id),
            },
            isDirty: true,
          });
        },

        // ─── Chat ───────────────────────────────────────────────────────────────
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

        // ─── Settings ───────────────────────────────────────────────────────────
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
              await setSecureData(keyName, value);
            } else {
              removeSecureData(keyName);
            }
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

        // ─── Saved Projects ─────────────────────────────────────────────────────
        projects: [],
        currentProjectId: null,
        saveProject: (name) => {
          const { project, projects, currentProjectId } = get();
          const now = Date.now();

          if (currentProjectId) {
            set({
              projects: projects.map(p =>
                p.id === currentProjectId
                  ? { ...p, project, updatedAt: now, name: name || p.name }
                  : p
              ),
              isDirty: false,
            });
          } else {
            const newProject: Project = {
              id: crypto.randomUUID(),
              name: name || `Project ${projects.length + 1}`,
              project,
              createdAt: now,
              updatedAt: now,
            };
            set({
              projects: [...projects, newProject],
              currentProjectId: newProject.id,
              isDirty: false,
            });
          }
        },
        loadProject: (id) => {
          const saved = get().projects.find(p => p.id === id);
          if (saved) {
            set({
              project: saved.project,
              currentProjectId: id,
              isDirty: false,
            });
          }
        },
        deleteProject: (id) => {
          set((state) => ({
            projects: state.projects.filter(p => p.id !== id),
            currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
          }));
        },
        setCurrentProjectId: (id) => set({ currentProjectId: id }),

        // ─── UI ─────────────────────────────────────────────────────────────────
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
        name: 'mindtoblocks-storage',
        partialize: (state) => ({
          project: state.project,
          selectedView: state.selectedView,
          chat: { messages: state.chat.messages },
          settings: state.settings,
          projects: state.projects,
          currentProjectId: state.currentProjectId,
        }),
      }
    ),
    { name: 'MindtoBlocks' }
  )
);
