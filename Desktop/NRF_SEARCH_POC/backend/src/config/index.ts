import dotenv from 'dotenv';

dotenv.config();

export const config = {
  gcp: {
    projectId: process.env.GCP_PROJECT_ID || '',
    region: process.env.REGION || 'us-central1',
    vertexModelName: process.env.VERTEX_MODEL_NAME || 'gemini-1.5-pro',
  },
  bigquery: {
    dataset: process.env.BIGQUERY_DATASET || 'fashion_catalog',
    table: process.env.BIGQUERY_TABLE || 'products',
  },
  vertexSearch: {
    index: process.env.VERTEX_SEARCH_INDEX || '',
  },
  server: {
    port: parseInt(process.env.PORT || '8080', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
  claude: {
    apiKey: process.env.CLAUDE_API_KEY || '',
    model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-5-20250929',
    maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '4096', 10),
  },
};

export function validateConfig(): void {
  const requiredVars = ['GCP_PROJECT_ID'];
  const missing = requiredVars.filter((v) => !process.env[v]);

  if (missing.length > 0) {
    console.warn(`Warning: Missing environment variables: ${missing.join(', ')}`);
    console.warn('The application may not function correctly without these variables.');
  }
}
