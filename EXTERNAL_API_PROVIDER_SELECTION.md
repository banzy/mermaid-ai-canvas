# External API Provider Selection

## Overview

Users can now select their preferred external API provider (OpenAI or Groq) in the Settings page. The toggle appears in the "External API Keys" section header.

## Features

### Provider Selection
- **Toggle Location**: Top-right of the "External API Keys" section header
- **Options**: OpenAI or Groq
- **Default**: OpenAI
- **Persistence**: Selection is saved in localStorage

### How It Works

1. User configures API keys for one or both providers
2. User selects preferred provider via radio buttons
3. When using external API:
   - The selected provider is used first
   - If the selected provider's key is not configured, falls back to the other provider
   - If neither provider is available, an error is thrown

## Changes Made

### 1. Schema Updates (`src/lib/schemas.ts`)
- Added `externalApiProvider: z.enum(['openai', 'groq']).optional()` to Settings schema

### 2. Store Updates (`src/stores/useAppStore.ts`)
- Added default value: `externalApiProvider: 'openai'`

### 3. Settings Page (`src/pages/Settings.tsx`)
- Added RadioGroup import from shadcn/ui
- Added state for `externalApiProvider`
- Added radio button toggle in the section header
- Toggle allows instant switching with automatic persistence

### 4. API Module (`src/lib/api.ts`)
- Updated `generate()`, `explain()`, and `refine()` methods
- All methods now respect the `externalApiProvider` setting
- Fallback logic ensures graceful degradation if preferred provider isn't available

## UI Layout

```
┌─ External API Keys ─────────── Preferred Provider: ◉ OpenAI ○ Groq ─┐
│ Configure API keys for external AI providers                          │
└────────────────────────────────────────────────────────────────────────┘
```

## Fallback Behavior

| Scenario | Behavior |
|----------|----------|
| Preferred provider configured | Use preferred |
| Preferred provider not configured | Try other provider |
| Neither provider configured | Error: "No external API key configured" |
| External API disabled | Use local LLM |

## API Consistency

The provider preference is applied consistently across all API calls:
- Text generation (AI panel)
- Diagram explanation
- Diagram refinement
- Model listing for external providers

## User Experience

- Instant feedback: Selection changes are saved immediately
- Clear indication: Radio buttons show current selection
- Flexibility: Users can still use either key with fallback
- No action required: Setting defaults to OpenAI for backward compatibility
