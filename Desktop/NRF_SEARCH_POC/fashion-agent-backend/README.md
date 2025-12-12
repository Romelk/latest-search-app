# Fashion Agent Backend (TypeScript)

Autonomous fashion styling agent powered by Claude with tool use capabilities.

## Architecture

- **TypeScript/Node.js** - Agent backend with Express + WebSocket
- **Claude API** - Direct Anthropic SDK for tool use (no LangChain/LangGraph)
- **Python Backend Integration** - Calls existing Python backend via HTTP for image/video generation
- **In-Memory Sessions** - Map-based session storage (can upgrade to Redis later)

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python backend running on port 8000 (Fashion Agent classic version)
- Claude API key

### Installation

```bash
# Install dependencies
npm install

# Copy .env and configure
cp .env.example .env
# Edit .env and add your CLAUDE_API_KEY

# Run in development mode
npm run dev

# Build for production
npm run build

# Run production server
npm start
```

## Port Allocation

- **Agent Backend**: `http://localhost:8001`
- **Python Backend**: `http://localhost:8000` (existing)
- **Frontend**: `http://localhost:5173` (existing, will add agent mode)

## Project Structure

```
agent_backend/
├── src/
│   ├── server.ts            # Express + WebSocket server
│   ├── agent/
│   │   └── FashionAgent.ts  # Core agent with Claude tool use loop
│   ├── tools/
│   │   ├── ToolRegistry.ts  # Tool registration system
│   │   ├── trendsTools.ts   # Fashion trends tools (HTTP → Python)
│   │   └── imageTools.ts    # Image generation (HTTP → Python)
│   ├── session/
│   │   └── SessionStore.ts  # Session management
│   ├── types/
│   │   └── agent.ts         # TypeScript type definitions
│   └── config.ts            # Configuration
├── package.json
├── tsconfig.json
└── .env
```

## API Endpoints

### WebSocket

- `WS /agent/ws/{session_id}` - Chat with agent via WebSocket

### HTTP

- `POST /agent/session` - Create new conversation session
- `GET /health` - Health check

## Agent Loop

1. User sends message via WebSocket
2. Agent adds message to conversation history
3. Agent calls Claude with tools + full conversation history
4. If Claude wants to use tools:
   - Execute tools (HTTP calls to Python backend)
   - Add tool results to history
   - Loop back to step 3
5. Stream final Claude response to user

## Development

```bash
# Run with auto-reload
npm run dev

# TypeScript type checking
npx tsc --noEmit

# Build
npm run build
```

## Environment Variables

```bash
PORT=8001                           # Agent backend port
PYTHON_BACKEND_URL=http://localhost:8000  # Python backend URL
CLAUDE_API_KEY=sk-ant-...          # Your Claude API key
NODE_ENV=development               # development | production
```

## Next Steps

- [ ] Complete FashionAgent.ts implementation
- [ ] Add trendsTools.ts and imageTools.ts
- [ ] Create frontend chat UI
- [ ] Add Redis for production session storage
- [ ] Implement preference learning
