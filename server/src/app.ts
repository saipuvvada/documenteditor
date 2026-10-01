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

// Health check handler
const healthHandler = async (req: express.Request, res: express.Response) => {
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
};

// Routes (Support both /api/path and /path prefixes)
app.use('/api/users', usersRouter);
app.use('/users', usersRouter);

app.use('/api/documents', documentsRouter);
app.use('/documents', documentsRouter);

app.use('/api/upload', uploadRouter);
app.use('/upload', uploadRouter);

app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

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
