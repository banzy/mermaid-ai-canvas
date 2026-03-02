import type { MindProject } from './schemas';

/**
 * The MindtoBlocks app describing itself — used as the default/demo project.
 */
export const MINDTOBLOCKS_SELF: MindProject = {
  id: 'mindtoblocks-self',
  name: 'MindtoBlocks',
  description:
    'An application that converts software ideas into high-level operational blocks, functional blocks, and flowchart views, and lets users edit the blocks and regenerate textual explanations.',

  operationalBlocks: [
    {
      id: 'idea-capture',
      label: 'Idea Capture',
      description: 'Accepts the user\'s raw product or software idea via text or voice.',
      kind: 'operational',
      type: 'interaction',
      children: ['fn-text-input', 'fn-prompt-history', 'fn-generate-command'],
    },
    {
      id: 'semantic-parsing',
      label: 'Semantic Parsing',
      description: 'Interprets the idea and identifies capabilities, actors, and responsibilities.',
      kind: 'operational',
      type: 'transformation',
      children: [
        'fn-capability-extractor', 'fn-actor-extractor', 'fn-block-classifier',
        'fn-relationship-extractor', 'fn-flow-extractor', 'fn-ambiguity-detector',
      ],
    },
    {
      id: 'architecture-modeling',
      label: 'Architecture Modeling',
      description: 'Creates and maintains the structured semantic graph used by the entire app.',
      kind: 'operational',
      type: 'subsystem',
      children: [
        'fn-node-registry', 'fn-edge-registry', 'fn-hierarchy-manager',
        'fn-view-model-builder', 'fn-version-state',
      ],
    },
    {
      id: 'view-generation',
      label: 'View Generation',
      description: 'Transforms the model into readable operational, functional, and flow projections.',
      kind: 'operational',
      type: 'transformation',
      children: [
        'fn-canvas-renderer', 'fn-layout-engine', 'fn-group-renderer',
        'fn-flow-renderer', 'fn-focus-mode',
      ],
    },
    {
      id: 'visual-editing',
      label: 'Visual Editing',
      description: 'Allows the user to refine the architecture directly on the visual canvas.',
      kind: 'operational',
      type: 'interaction',
      children: ['fn-block-interaction-layer'],
    },
    {
      id: 'reverse-explanation',
      label: 'Reverse Explanation',
      description: 'Turns the current model back into readable narrative and architecture summaries.',
      kind: 'operational',
      type: 'transformation',
      children: [
        'fn-summary-generator', 'fn-block-explainer',
        'fn-flow-narrator', 'fn-change-narrator',
      ],
    },
    {
      id: 'project-persistence',
      label: 'Project Persistence',
      description: 'Stores the current project, version history, and supports import/export.',
      kind: 'operational',
      type: 'storage',
      children: ['fn-project-store', 'fn-snapshot-store', 'fn-import-export-handler'],
    },
  ],

  functionalBlocks: [
    { id: 'fn-text-input', label: 'Text Input', kind: 'functional', type: 'input', description: 'Accepts raw app description from the user.' },
    { id: 'fn-prompt-history', label: 'Prompt History', kind: 'functional', type: 'input', description: 'Stores previous prompts and refinements.' },
    { id: 'fn-generate-command', label: 'Generate Command', kind: 'functional', type: 'input', description: 'Starts the generation process.' },
    { id: 'fn-capability-extractor', label: 'Capability Extractor', kind: 'functional', type: 'parser', description: 'Finds the main capabilities in the app description.' },
    { id: 'fn-actor-extractor', label: 'Actor Extractor', kind: 'functional', type: 'parser', description: 'Finds the main actors and roles.' },
    { id: 'fn-block-classifier', label: 'Block Classifier', kind: 'functional', type: 'classifier', description: 'Assigns extracted concepts to block types.' },
    { id: 'fn-relationship-extractor', label: 'Relationship Extractor', kind: 'functional', type: 'parser', description: 'Finds dependencies and interactions.' },
    { id: 'fn-flow-extractor', label: 'Flow Extractor', kind: 'functional', type: 'parser', description: 'Builds core flows from described behavior.' },
    { id: 'fn-ambiguity-detector', label: 'Ambiguity Detector', kind: 'functional', type: 'classifier', description: 'Flags vague or conflicting concepts.' },
    { id: 'fn-node-registry', label: 'Node Registry', kind: 'functional', type: 'model', description: 'Stores all nodes/blocks.' },
    { id: 'fn-edge-registry', label: 'Edge Registry', kind: 'functional', type: 'model', description: 'Stores all relationships.' },
    { id: 'fn-hierarchy-manager', label: 'Hierarchy Manager', kind: 'functional', type: 'model', description: 'Maintains parent-child and grouping structures.' },
    { id: 'fn-view-model-builder', label: 'View Model Builder', kind: 'functional', type: 'model', description: 'Creates per-view graph projections.' },
    { id: 'fn-version-state', label: 'Version State', kind: 'functional', type: 'model', description: 'Tracks edits and versions over time.' },
    { id: 'fn-canvas-renderer', label: 'Canvas Renderer', kind: 'functional', type: 'renderer', description: 'Renders blocks and edges on screen.' },
    { id: 'fn-layout-engine', label: 'Layout Engine', kind: 'functional', type: 'renderer', description: 'Places elements for readability.' },
    { id: 'fn-group-renderer', label: 'Group Renderer', kind: 'functional', type: 'renderer', description: 'Displays grouped structures.' },
    { id: 'fn-flow-renderer', label: 'Flow Renderer', kind: 'functional', type: 'renderer', description: 'Displays ordered flows and branches.' },
    { id: 'fn-focus-mode', label: 'Focus Mode', kind: 'functional', type: 'renderer', description: 'Shows one selected subdomain or flow.' },
    { id: 'fn-block-interaction-layer', label: 'Block Interaction Layer', kind: 'functional', type: 'editor', description: 'Handles selection, dragging, renaming, and connection edits.' },
    { id: 'fn-summary-generator', label: 'Summary Generator', kind: 'functional', type: 'generator', description: 'Generates a concise architecture summary.' },
    { id: 'fn-block-explainer', label: 'Block Explainer', kind: 'functional', type: 'generator', description: 'Explains a selected block.' },
    { id: 'fn-flow-narrator', label: 'Flow Narrator', kind: 'functional', type: 'generator', description: 'Explains a selected flow.' },
    { id: 'fn-change-narrator', label: 'Change Narrator', kind: 'functional', type: 'generator', description: 'Explains changes between versions.' },
    { id: 'fn-project-store', label: 'Project Store', kind: 'functional', type: 'persistence', description: 'Stores and restores project data.' },
    { id: 'fn-snapshot-store', label: 'Snapshot Store', kind: 'functional', type: 'persistence', description: 'Stores version snapshots.' },
    { id: 'fn-import-export-handler', label: 'Import/Export Handler', kind: 'functional', type: 'persistence', description: 'Imports and exports project JSON.' },
  ],

  relations: [
    // Operational relations
    { id: 'r-op-1', from: 'idea-capture', to: 'semantic-parsing', type: 'feeds' },
    { id: 'r-op-2', from: 'semantic-parsing', to: 'architecture-modeling', type: 'transforms_into' },
    { id: 'r-op-3', from: 'architecture-modeling', to: 'view-generation', type: 'feeds' },
    { id: 'r-op-4', from: 'view-generation', to: 'visual-editing', type: 'feeds' },
    { id: 'r-op-5', from: 'visual-editing', to: 'architecture-modeling', type: 'updates' },
    { id: 'r-op-6', from: 'architecture-modeling', to: 'reverse-explanation', type: 'feeds' },
    { id: 'r-op-7', from: 'architecture-modeling', to: 'project-persistence', type: 'persists_to' },
  ],

  flows: [
    {
      id: 'flow-text-to-blocks',
      label: 'Text to Blocks',
      steps: [
        'User enters app description',
        'User triggers generation',
        'System extracts capabilities and relationships',
        'System builds structured model',
        'System generates operational and functional views',
        'System generates summary text',
        'User reviews the result',
      ],
    },
    {
      id: 'flow-blocks-to-text',
      label: 'Blocks to Text',
      steps: [
        'User edits block or relation',
        'System updates graph model',
        'System refreshes affected layout',
        'System regenerates explanation',
        'System stores version delta',
      ],
    },
    {
      id: 'flow-iterative-refinement',
      label: 'Iterative Refinement',
      steps: [
        'User requests a refinement',
        'System translates request into model operations',
        'System updates graph',
        'System refreshes view and summary',
        'System saves new version',
      ],
    },
  ],
};

/**
 * Category-color mapping for operational block types.
 */
export const BLOCK_TYPE_COLORS: Record<string, string> = {
  interaction: 'hsl(187 85% 53%)',      // cyan
  transformation: 'hsl(262 83% 58%)',   // purple
  subsystem: 'hsl(142 76% 36%)',        // green
  storage: 'hsl(38 92% 50%)',           // amber
  capability: 'hsl(210 90% 55%)',       // blue
  orchestration: 'hsl(340 80% 55%)',    // pink
};

/**
 * Operational block positions for the default layout.
 * Keys map to block IDs.
 */
export const DEFAULT_OPERATIONAL_POSITIONS: Record<string, { x: number; y: number }> = {
  'idea-capture':          { x: 0,    y: 160 },
  'semantic-parsing':      { x: 320,  y: 160 },
  'architecture-modeling': { x: 640,  y: 160 },
  'view-generation':       { x: 960,  y: 160 },
  'visual-editing':        { x: 1280, y: 60  },
  'reverse-explanation':   { x: 1280, y: 260 },
  'project-persistence':   { x: 960,  y: 380 },
};
