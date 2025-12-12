import express from 'express';
import cors from 'cors';
import { config, validateConfig } from './config';
import searchRoutes from './routes/search.routes';
import toolkitRoutes from './routes/toolkit.routes';

const app = express();

// Validate configuration
validateConfig();

// Middleware
app.use(cors({
  origin: config.server.frontendUrl,
  credentials: true,
}));

// Increase body size limit for base64 image uploads (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.server.nodeEnv,
  });
});

// Routes
app.use('/', searchRoutes);
app.use('/toolkit', toolkitRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: config.server.nodeEnv === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handlers to prevent crashes
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
  console.error('Promise:', promise);
  // Don't exit the process - keep the server running
});

process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught Exception:', error);
  // Log but don't exit - this allows the server to continue running
  // In production, you might want to restart the process, but for demos we keep it alive
});

// Start server
const PORT = config.server.port;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   Agentic Search Demo API - Fashion Search on Google Cloud    ║
║                                                                ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║   Server running on: http://localhost:${PORT}                   ║
║   Environment: ${config.server.nodeEnv.padEnd(51)}║
║   GCP Project: ${(config.gcp.projectId || 'Not configured').padEnd(51)}║
║   Region: ${config.gcp.region.padEnd(57)}║
║   Model: ${config.gcp.vertexModelName.padEnd(58)}║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `);
});

export default app;
