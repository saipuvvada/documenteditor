import express from 'express';
import cors from 'cors';
import usersRouter from './routes/users.js';
import documentsRouter from './routes/documents.js';
import uploadRouter from './routes/upload.js';

import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.js';

export const app = express();

app.use(cors());
app.use(express.json());

// Swagger UI Documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/users', usersRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/upload', uploadRouter);

// Root info endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'DocuCraft API Server',
    status: 'running',
    swaggerDocs: 'http://localhost:5001/docs',
    frontendUrl: 'http://localhost:3000',
    endpoints: {
      health: 'GET /api/health',
      swagger: 'GET /docs',
      users: 'GET /api/users',
      documents: 'GET /api/documents',
      upload: 'POST /api/upload',
    },
  });
});

// Health check with DB connection diagnostic
app.get('/api/health', async (req, res) => {
  try {
    const dbUrlConfigured = Boolean(process.env.DATABASE_URL);
    res.json({
      status: 'ok',
      dbUrlConfigured,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// Global 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  const isDbError = err?.message?.includes('Prisma') || err?.message?.includes('database') || err?.code?.startsWith('P');
  const userMessage = isDbError
    ? `Database connection failed. Please ensure DATABASE_URL environment variable is configured in Vercel settings. (${err.message})`
    : err.message || 'Internal server error';

  res.status(500).json({ error: userMessage });
});

export default app;
