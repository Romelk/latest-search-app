/**
 * Fashion Agent Backend Server
 * Express + WebSocket server for autonomous fashion styling agent
 */

import express, { Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import http from 'http';
import { config, validateConfig } from './config';
import { getSessionStore } from './session/SessionStore';
import { v4 as uuidv4 } from 'uuid';
import { FashionAgent } from './agent/FashionAgent';
import { initializeTools } from './agent/initializeTools';

// Validate configuration
validateConfig();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize WebSocket server
// Note: Not specifying 'path' allows connections to any path on this server
// We'll validate the session ID from the URL in the connection handler
const wss = new WebSocketServer({
  server
});

// Initialize session store
const sessionStore = getSessionStore(config.sessionTTL);

// Initialize tools (shared across all agent instances)
const toolRegistry = initializeTools();

// Middleware
app.use(cors({
  origin: config.corsOrigins,
  credentials: true
}));
app.use(express.json());

// ============================================================================
// HTTP Routes
// ============================================================================

/**
 * Root endpoint
 */
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'Fashion Agent Backend',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      createSession: 'POST /agent/session',
      websocket: 'WS /agent/ws/{session_id}',
      health: 'GET /health',
      stats: 'GET /stats'
    },
    architecture: {
      runtime: 'Node.js + TypeScript',
      framework: 'Express + WebSocket',
      ai: 'Claude (Anthropic SDK)',
      pythonBackend: config.pythonBackendUrl
    }
  });
});

/**
 * Health check
 */
app.get('/health', (req: Request, res: Response) => {
  const stats = sessionStore.getStats();
  res.json({
    status: 'healthy',
    service: 'Fashion Agent Backend',
    timestamp: new Date().toISOString(),
    sessions: stats,
    pythonBackend: config.pythonBackendUrl
  });
});

/**
 * Session statistics
 */
app.get('/stats', (req: Request, res: Response) => {
  const stats = sessionStore.getStats();
  res.json({
    ...stats,
    timestamp: new Date().toISOString()
  });
});

/**
 * Create new conversation session
 */
app.post('/agent/session', (req: Request, res: Response) => {
  const sessionId = uuidv4();
  sessionStore.createSession(sessionId);

  res.json({
    sessionId,
    message: 'Session created successfully',
    websocketUrl: `/agent/ws/${sessionId}`
  });
});

/**
 * Get session history (for debugging)
 */
app.get('/agent/session/:sessionId/history', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const session = sessionStore.getSession(sessionId);

  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  res.json({
    sessionId,
    history: session.conversationHistory,
    context: session.userContext,
    createdAt: session.createdAt,
    lastActivity: session.lastActivity
  });
});

// ============================================================================
// WebSocket Connection Handling
// ============================================================================

interface WebSocketMessage {
  type: 'message' | 'ping';
  message?: string;
  sessionId?: string;
}

wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
  console.log('🔌 WebSocket connection attempt:', req.url);

  // Extract session ID from URL path
  const urlPath = req.url || '';
  // Match UUID format (with hyphens) or fallback format (fallback-timestamp)
  const sessionIdMatch = urlPath.match(/\/agent\/ws\/([a-zA-Z0-9-]+)/);

  if (!sessionIdMatch) {
    ws.send(JSON.stringify({
      type: 'error',
      error: 'Session ID required in WebSocket URL'
    }));
    ws.close(1008, 'Session ID required');
    return;
  }

  const sessionId = sessionIdMatch[1];
  console.log(`🔌 WebSocket connected: ${sessionId}`);

  // Get or create session
  const session = sessionStore.getOrCreateSession(sessionId);

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    sessionId,
    message: 'Connected to Fashion Agent',
    timestamp: new Date().toISOString()
  }));

  // Handle incoming messages
  ws.on('message', async (data: Buffer) => {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());

      if (message.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
        return;
      }

      if (message.type === 'message' && message.message) {
        console.log(`📨 Message from ${sessionId}: ${message.message.substring(0, 50)}...`);

        // Create agent instance for this session
        const agent = new FashionAgent(sessionId, toolRegistry);

        try {
          // Process message through agent loop
          for await (const chunk of agent.processMessage(message.message)) {
            // Stream chunks to client
            ws.send(JSON.stringify(chunk));
          }
        } catch (error: any) {
          console.error('Agent processing error:', error);
          ws.send(JSON.stringify({
            type: 'error',
            error: error.message || 'Agent processing failed'
          }));
        }
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Failed to process message'
      }));
    }
  });

  // Handle disconnection
  ws.on('close', () => {
    console.log(`🔌 WebSocket disconnected: ${sessionId}`);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error(`WebSocket error for ${sessionId}:`, error);
  });
});

// ============================================================================
// Error Handling
// ============================================================================

app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : 'Something went wrong'
  });
});

// ============================================================================
// Start Server
// ============================================================================

server.listen(config.port, () => {
  console.log('\n' + '='.repeat(70));
  console.log('🤖  Fashion Agent Backend (TypeScript)');
  console.log('='.repeat(70));
  console.log(`\n✅  Server running on: http://localhost:${config.port}`);
  console.log(`✅  WebSocket endpoint: ws://localhost:${config.port}/agent/ws/{session_id}`);
  console.log(`✅  Python backend: ${config.pythonBackendUrl}`);
  console.log(`\nEndpoints:`);
  console.log(`  - http://localhost:${config.port}/`);
  console.log(`  - http://localhost:${config.port}/health`);
  console.log(`  - http://localhost:${config.port}/stats`);
  console.log(`  - POST http://localhost:${config.port}/agent/session`);
  console.log('\n' + '='.repeat(70) + '\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
