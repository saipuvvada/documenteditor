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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

export default app;
