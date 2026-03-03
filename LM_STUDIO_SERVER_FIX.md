# LM Studio Mock Server - Fix Guide

## Issue
The mock LM Studio server is returning an error for `GET /api/models`:
```json
{"error":"Unexpected endpoint or method. (GET /api/models)"}
```

## Required Endpoints

Your mock LM Studio server needs to support the following endpoints:

### 1. GET /api/models
**Purpose:** List available models  
**Method:** GET  
**Response Format:**
```json
{
  "models": ["model-name-1", "model-name-2"]
}
```

**Example Implementation (Python/FastAPI):**
```python
@app.get("/api/models")
async def get_models():
    return {
        "models": ["llama-3.3-70b-versatile"]  # Replace with your actual model name
    }
```

**Example Implementation (Node.js/Express):**
```javascript
app.get('/api/models', (req, res) => {
  res.json({
    models: ['llama-3.3-70b-versatile']  // Replace with your actual model name
  });
});
```

### 2. POST /api/generate
**Purpose:** Generate text with streaming  
**Method:** POST  
**Request Body:**
```json
{
  "prompt": "string",
  "history": [
    {"role": "user", "content": "string"},
    {"role": "assistant", "content": "string"}
  ]
}
```

**Response:** Server-Sent Events (SSE) stream
```
data: {"content": "chunk1"}
data: {"content": "chunk2"}
data: [DONE]
```

### 3. POST /api/explain
**Purpose:** Explain an architecture model  
**Method:** POST  
**Request Body:**
```json
{
  "projectJson": "{ \"operationalBlocks\": [...], \"functionalBlocks\": [...], \"relations\": [...], \"flows\": [...] }"
}
```

**Response:**
```json
{
  "explanation": "This is an architecture model showing..."
}
```

### 4. POST /api/refine
**Purpose:** Refine an architecture model based on instructions  
**Method:** POST  
**Request Body:**
```json
{
  "projectJson": "{ ... }",
  "instruction": "Add more blocks"
}
```

**Response:**
```json
{
  "projectJson": "{ ... updated JSON ... }"
}
```

## CORS Configuration

Make sure your server allows CORS requests from `http://localhost:8080`:

**Python/FastAPI:**
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Node.js/Express:**
```javascript
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true
}));
```

## Quick Fix

If you just want to get the connection test working, add this minimal endpoint:

```python
@app.get("/api/models")
async def get_models():
    return {"models": ["default-model"]}
```

Or in Express:
```javascript
app.get('/api/models', (req, res) => {
  res.json({ models: ['default-model'] });
});
```

## Testing

After adding the endpoint:
1. Restart your mock server
2. Go to Settings in the app
3. Click "Test" next to the Backend API URL
4. You should see: "Connection successful! Found 1 model(s): default-model"

## Server Location

Based on the error logs, your server appears to be running at:
- Default: `http://localhost:8000`
- Check your server startup logs for the actual port

## Alternative: Use Real LM Studio

Instead of a mock server, you can use the actual LM Studio:
1. Open LM Studio
2. Go to the "Local Server" tab
3. Start the server (usually runs on `http://localhost:1234`)
4. In the app Settings, set API URL to `http://localhost:1234`
5. LM Studio already supports the `/v1/models` endpoint (you may need to adjust the frontend to use `/v1/models` instead of `/api/models`)
