# API Configuration Updates

## Summary
Added support for external API providers (OpenAI and Groq) with a toggle to switch between internal and external APIs.

## Changes Made

### 1. Schema Updates (`src/lib/schemas.ts`)
- Added `openaiApiKey?: string` - Store OpenAI API key
- Added `groqApiKey?: string` - Store Groq API key  
- Added `useExternalApi?: boolean` - Toggle between internal/external API

### 2. Store Updates (`src/stores/useAppStore.ts`)
- Updated `initialSettings` to include default values for new fields
- All new settings are persisted to localStorage

### 3. Settings Page (`src/pages/Settings.tsx`)
- Added "External API Keys" section with:
  - OpenAI API Key input (password field)
  - Groq API Key input (password field)
  - Save buttons for each key
  - Helpful descriptions (e.g., "Will use GPT-4o-mini (cheapest model)")

### 4. Header Component (`src/components/layout/Header.tsx`)
- Added API mode toggle button in the top bar
- Shows "Internal" with Server icon when using internal API
- Shows "External" with Cloud icon when using external API
- Provides visual feedback via toast notifications

### 5. API Client (`src/lib/api.ts`)
- Complete rewrite to support both internal and external APIs
- **OpenAI Integration:**
  - Uses GPT-4o-mini model (cheapest option as requested)
  - Endpoint: `https://api.openai.com/v1/chat/completions`
- **Groq Integration:**
  - Uses Llama 3.3 70B model
  - Endpoint: `https://api.groq.com/openai/v1/chat/completions`
- Automatically routes requests based on `useExternalApi` setting
- Maintains backward compatibility with internal API

## Usage

### For Users:
1. Go to Settings page
2. Enter your OpenAI API key (starts with `sk-...`) and/or Groq API key (starts with `gsk_...`)
3. Click Save for each key
4. In the top bar, click the "Internal/External" toggle to switch API modes
5. When External mode is active, the app will use your configured API keys

### API Behavior:
- **Internal Mode**: Uses your backend server (existing behavior)
- **External Mode**: 
  - Prioritizes OpenAI if key is configured
  - Falls back to Groq if only Groq key is configured
  - Shows error if no keys are configured

## Models Used:
- **OpenAI**: `gpt-4o-mini` (as requested - cheapest model)
- **Groq**: `llama-3.3-70b-versatile` (fast and cost-effective)
