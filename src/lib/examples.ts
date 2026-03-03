import type { MindProject } from './schemas';

/**
 * Running Coach App — used as the default/demo project.
 * A smart iOS running companion with real-time coaching, GPS tracking, and voice feedback.
 */
export const MINDTOBLOCKS_SELF: MindProject = {
  id: 'running-coach-app',
  name: 'Running Coach',
  description:
    'A smart iOS running companion that uses GPS tracking, real-time pace analysis, and AI coaching to guide runners with voice feedback, mixing seamlessly with their music.',

  // ── Operational Blocks (System Behavior View) ────────────────────────────────

  operationalBlocks: [
    {
      id: 'app-lifecycle',
      label: 'App Lifecycle & Permissions',
      description: 'Onboarding, requesting Location/Motion/Microphone permissions, background modes setup.',
      kind: 'operational',
      type: 'orchestration',
      children: [],
    },
    {
      id: 'run-session-control',
      label: 'Run Session Control',
      description: 'Start/pause/resume/stop, session state machine, timers, segmenting the run.',
      kind: 'operational',
      type: 'orchestration',
      children: ['fn-session-state-machine', 'fn-session-manager'],
    },
    {
      id: 'sensor-acquisition',
      label: 'Sensor Acquisition',
      description: 'GPS sampling, altitude/elevation reading, motion data, heart-rate via HealthKit.',
      kind: 'operational',
      type: 'subsystem',
      children: ['fn-location-service', 'fn-motion-service', 'fn-health-service'],
    },
    {
      id: 'metric-computation',
      label: 'Metric Computation',
      description: 'Distance accumulation, pace calculation, elevation gain/loss, smoothing/filtering GPS jitter, split/lap calculations.',
      kind: 'operational',
      type: 'transformation',
      children: ['fn-metrics-engine', 'fn-smoothing-filter', 'fn-split-engine'],
    },
    {
      id: 'coach-decision-engine',
      label: 'Coach Decision Engine',
      description: 'Decides what to say based on triggers: time/distance milestones, pace deviation, fatigue signals, user preferences.',
      kind: 'operational',
      type: 'transformation',
      children: ['fn-coach-manager', 'fn-trigger-engine', 'fn-message-planner', 'fn-user-profile-model'],
    },
    {
      id: 'speech-audio-mixing',
      label: 'Speech Output & Audio Mixing',
      description: 'Configures AVAudioSession to mix with music, generates TTS, ducks music when speaking, manages audio queue.',
      kind: 'operational',
      type: 'interaction',
      children: ['fn-audio-session-controller', 'fn-speech-manager', 'fn-speech-queue'],
    },
    {
      id: 'voice-commands',
      label: 'Voice Commands',
      description: 'Listens for start/pause/resume/stop, validates intent, executes run-control actions safely.',
      kind: 'operational',
      type: 'interaction',
      children: ['fn-voice-command-manager', 'fn-intent-parser'],
    },
    {
      id: 'realtime-sync',
      label: 'Realtime Sync',
      description: 'Optional future: streams telemetry to server and consumes opponent updates for friend racing.',
      kind: 'operational',
      type: 'subsystem',
      children: ['fn-connectivity-monitor'],
    },
    {
      id: 'local-persistence',
      label: 'Local Persistence',
      description: 'Saves run summary + route samples + coach events, handles offline mode and crash recovery.',
      kind: 'operational',
      type: 'storage',
      children: ['fn-run-storage-manager', 'fn-run-model', 'fn-runpoint-model', 'fn-coach-event-model', 'fn-settings-model'],
    },
    {
      id: 'post-run-summary',
      label: 'Post-Run Summary & Insights',
      description: 'Generates stats + charts + spoken recap, highlights milestones, compares to past runs.',
      kind: 'operational',
      type: 'transformation',
      children: [],
    },
    {
      id: 'history-analytics',
      label: 'History & Analytics',
      description: 'List/detail views, weekly/monthly aggregates, best times, streaks.',
      kind: 'operational',
      type: 'interaction',
      children: [],
    },
    {
      id: 'settings-personalization',
      label: 'Settings & Personalization',
      description: 'Toggles for coach, voice commands, voice selection, units, notification cadence, privacy controls.',
      kind: 'operational',
      type: 'interaction',
      children: [],
    },
    {
      id: 'reliability-edge-cases',
      label: 'Reliability & Edge Cases',
      description: 'Background/foreground transitions, GPS loss, low battery mode, network loss, permission revocation.',
      kind: 'operational',
      type: 'orchestration',
      children: ['fn-background-task-coordinator', 'fn-logger'],
    },
  ],

  // ── Functional / Structural Blocks (Architecture View) ───────────────────────

  functionalBlocks: [
    // UI Layer
    { id: 'fn-home-view', label: 'HomeView', kind: 'functional', type: 'renderer', description: 'Main screen with Start Run, History, and Settings options.' },
    { id: 'fn-run-view', label: 'RunView', kind: 'functional', type: 'renderer', description: 'Active run screen showing real-time metrics, map, and controls.' },
    { id: 'fn-summary-view', label: 'SummaryView', kind: 'functional', type: 'renderer', description: 'Post-run summary with stats, charts, and sharing options.' },
    { id: 'fn-history-view', label: 'HistoryListView', kind: 'functional', type: 'renderer', description: 'List of past runs with filtering and search.' },
    { id: 'fn-run-detail-view', label: 'RunDetailView', kind: 'functional', type: 'renderer', description: 'Detailed view of a single past run with map and splits.' },
    { id: 'fn-settings-view', label: 'SettingsView', kind: 'functional', type: 'renderer', description: 'Preferences for coaching, voice, units, and privacy.' },

    // State & Session Layer
    { id: 'fn-session-state-machine', label: 'RunSessionStateMachine', kind: 'functional', type: 'model', description: 'State machine: Idle → Preparing → Running → Paused → Finishing → Summary.' },
    { id: 'fn-session-manager', label: 'RunSessionManager', kind: 'functional', type: 'model', description: 'Single source of truth for the active run session.' },

    // Sensor Layer
    { id: 'fn-location-service', label: 'LocationService', kind: 'functional', type: 'input', description: 'CoreLocation wrapper for GPS sampling and altitude.' },
    { id: 'fn-motion-service', label: 'MotionService', kind: 'functional', type: 'input', description: 'CoreMotion wrapper for cadence and step data (optional).' },
    { id: 'fn-health-service', label: 'HealthService', kind: 'functional', type: 'input', description: 'HealthKit wrapper for heart-rate monitoring (optional).' },

    // Computation Layer
    { id: 'fn-metrics-engine', label: 'MetricsEngine', kind: 'functional', type: 'parser', description: 'Calculates distance, pace, and elevation from raw sensor data.' },
    { id: 'fn-smoothing-filter', label: 'SmoothingFilter', kind: 'functional', type: 'parser', description: 'Filters GPS jitter for accurate route tracking.' },
    { id: 'fn-split-engine', label: 'SplitEngine', kind: 'functional', type: 'parser', description: 'Manages lap/split calculations and per-km breakdowns.' },

    // Coach Layer
    { id: 'fn-coach-manager', label: 'CoachManager', kind: 'functional', type: 'classifier', description: 'Orchestrates coaching logic and coordinates triggers with speech.' },
    { id: 'fn-trigger-engine', label: 'TriggerEngine', kind: 'functional', type: 'classifier', description: 'Evaluates rules/events: distance milestones, pace deviation, fatigue.' },
    { id: 'fn-message-planner', label: 'MessagePlanner', kind: 'functional', type: 'generator', description: 'Selects and formats coaching messages from templates (AI later).' },
    { id: 'fn-user-profile-model', label: 'UserProfileModel', kind: 'functional', type: 'model', description: 'Stores user tone, intensity, and coaching preferences.' },

    // Audio Layer
    { id: 'fn-audio-session-controller', label: 'AudioSessionController', kind: 'functional', type: 'editor', description: 'Configures AVAudioSession with mixWithOthers and duckOthers.' },
    { id: 'fn-speech-manager', label: 'SpeechManager', kind: 'functional', type: 'generator', description: 'AVSpeechSynthesizer wrapper for text-to-speech output.' },
    { id: 'fn-speech-queue', label: 'SpeechQueue', kind: 'functional', type: 'generator', description: 'Prevents overlaps, prioritizes urgent cues.' },

    // Voice Command Layer
    { id: 'fn-voice-command-manager', label: 'VoiceCommandManager', kind: 'functional', type: 'input', description: 'SFSpeechRecognizer wrapper for hands-free control.' },
    { id: 'fn-intent-parser', label: 'IntentParser', kind: 'functional', type: 'classifier', description: 'Maps recognized phrases to run-control actions.' },

    // Storage Layer
    { id: 'fn-run-storage-manager', label: 'RunStorageManager', kind: 'functional', type: 'persistence', description: 'CoreData/SQLite wrapper for run persistence.' },
    { id: 'fn-run-model', label: 'Run Model', kind: 'functional', type: 'persistence', description: 'Data model for a single run session.' },
    { id: 'fn-runpoint-model', label: 'RunPoint Model', kind: 'functional', type: 'persistence', description: 'Data model for GPS route sample points.' },
    { id: 'fn-coach-event-model', label: 'CoachEvent Model', kind: 'functional', type: 'persistence', description: 'Data model for coaching events and triggers.' },
    { id: 'fn-settings-model', label: 'SettingsModel', kind: 'functional', type: 'persistence', description: 'Data model for user preferences and settings.' },

    // System Utilities
    { id: 'fn-background-task-coordinator', label: 'BackgroundTaskCoordinator', kind: 'functional', type: 'model', description: 'Manages background updates and resilience during app transitions.' },
    { id: 'fn-connectivity-monitor', label: 'ConnectivityMonitor', kind: 'functional', type: 'model', description: 'Monitors network reachability for optional sync features.' },
    { id: 'fn-logger', label: 'Logger', kind: 'functional', type: 'model', description: 'Debug logging and analytics hooks.' },
  ],

  // ── Relations (Operational System Behavior) ──────────────────────────────────

  relations: [
    // Linear chain: Lifecycle → Session → Sensors → Metrics → Coach → Speech
    { id: 'r-op-1', from: 'app-lifecycle', to: 'run-session-control', type: 'triggers' },
    { id: 'r-op-2', from: 'run-session-control', to: 'sensor-acquisition', type: 'triggers' },
    { id: 'r-op-3', from: 'sensor-acquisition', to: 'metric-computation', type: 'feeds' },
    { id: 'r-op-4', from: 'metric-computation', to: 'coach-decision-engine', type: 'feeds' },
    { id: 'r-op-5', from: 'coach-decision-engine', to: 'speech-audio-mixing', type: 'feeds' },

    // Parallel connections
    { id: 'r-par-1', from: 'voice-commands', to: 'run-session-control', type: 'triggers' },
    { id: 'r-par-2', from: 'metric-computation', to: 'local-persistence', type: 'persists_to' },
    { id: 'r-par-3', from: 'run-session-control', to: 'post-run-summary', type: 'feeds' },
    { id: 'r-par-4', from: 'local-persistence', to: 'history-analytics', type: 'feeds' },
    { id: 'r-par-5', from: 'settings-personalization', to: 'coach-decision-engine', type: 'feeds' },
    { id: 'r-par-6', from: 'reliability-edge-cases', to: 'run-session-control', type: 'updates' },
    { id: 'r-par-7', from: 'run-session-control', to: 'reliability-edge-cases', type: 'feeds' },
    { id: 'r-par-8', from: 'post-run-summary', to: 'local-persistence', type: 'persists_to' },
    { id: 'r-par-9', from: 'realtime-sync', to: 'run-session-control', type: 'feeds' },
  ],

  // ── Flows (Flow Chart — User Journey View) ───────────────────────────────────

  flows: [
    {
      id: 'flow-app-launch',
      label: 'App Launch & Onboarding',
      steps: [
        'Start App',
        'Show Onboarding / Request Permissions',
        'If permissions denied → show limited mode + guidance',
        'Navigate to Home Screen',
        'Choose: Start Run / History / Settings',
      ],
    },
    {
      id: 'flow-start-run',
      label: 'Start Run',
      steps: [
        'User taps Start Run',
        'Initialize audio session (mix with music)',
        'Initialize GPS + sensors',
        'Start timers',
        'Enter Running State',
      ],
    },
    {
      id: 'flow-running-loop',
      label: 'Running Loop',
      steps: [
        'Read GPS / altitude / motion data',
        'Compute metrics (distance / pace / elevation)',
        'Update UI with live stats',
        'Check triggers (time, distance, pace drift, fatigue)',
        'If trigger → generate coach message → enqueue speech',
        'If voice command detected → execute action',
        'Repeat every N seconds',
      ],
    },
    {
      id: 'flow-pause-resume',
      label: 'Pause & Resume',
      steps: [
        'User pauses run',
        'Reduce sensor frequency',
        'Pause timers (mark paused segments)',
        'Coach says "Paused"',
        'User resumes run',
        'Restore high-accuracy sensors',
        'Resume timers / segments',
        'Coach says "Back on track"',
      ],
    },
    {
      id: 'flow-stop-summary',
      label: 'Stop Run & Summary',
      steps: [
        'User stops run',
        'Finalize all metrics',
        'Persist run + route + events',
        'Generate summary + spoken recap',
        'Show Run Summary Screen',
        'Save / Share / Done',
      ],
    },
    {
      id: 'flow-history',
      label: 'History Browse',
      steps: [
        'Open History from Home',
        'List past runs',
        'Select a run → open details',
        'View map, splits, coach events',
        'Navigate back or end',
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
 * Arranged in a top-down flow with parallel branches on the sides.
 */
export const DEFAULT_OPERATIONAL_POSITIONS: Record<string, { x: number; y: number }> = {
  // Main linear chain (center column)
  'app-lifecycle':          { x: 500,  y: 0   },
  'run-session-control':    { x: 500,  y: 180 },
  'sensor-acquisition':     { x: 500,  y: 360 },
  'metric-computation':     { x: 500,  y: 540 },
  'coach-decision-engine':  { x: 500,  y: 720 },
  'speech-audio-mixing':    { x: 500,  y: 900 },

  // Left branch (inputs & control)
  'voice-commands':         { x: 100,  y: 180 },
  'settings-personalization': { x: 100, y: 720 },
  'reliability-edge-cases': { x: 100,  y: 360 },

  // Right branch (outputs & storage)
  'local-persistence':      { x: 900,  y: 540 },
  'post-run-summary':       { x: 900,  y: 180 },
  'history-analytics':      { x: 900,  y: 720 },
  'realtime-sync':          { x: 900,  y: 360 },
};
