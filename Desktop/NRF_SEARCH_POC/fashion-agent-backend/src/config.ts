/**
 * Configuration for Fashion Agent Backend
 */

import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server configuration
  port: parseInt(process.env.PORT || '8001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Claude API
  claudeApiKey: process.env.CLAUDE_API_KEY || '',
  claudeModel: 'claude-sonnet-4-5-20250929', // Claude Sonnet 4.5 (current)
  maxTokens: 4000,

  // Python backend
  pythonBackendUrl: process.env.PYTHON_BACKEND_URL || 'http://localhost:8000',

  // Session management
  sessionTTL: 24 * 60 * 60 * 1000, // 24 hours in milliseconds

  // CORS
  corsOrigins: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5175',
    'http://localhost:5177', // Agent frontend port
    'http://127.0.0.1:5177'
  ]
};

// Validate required config
export function validateConfig() {
  if (!config.claudeApiKey) {
    throw new Error('CLAUDE_API_KEY environment variable is required');
  }
  console.log('✅ Configuration validated');
}

export default config;
