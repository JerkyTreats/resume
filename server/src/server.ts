import express from 'express';
import cors from 'cors';
import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';

import pdfRoutes from './routes/pdf';
import healthRoutes from './routes/health';
import renderRoutes from './routes/render';
import cssRoutes from './routes/css';
import pdfConfigRoutes from './routes/pdf-config';
import assetRoutes from './routes/assets';
import config from './config/production';
import logger from './services/logger';
import { loggingMiddleware, errorLoggingMiddleware } from './middleware/logging';

// Load environment variables
dotenv.config();

const app = express();
const PORT = config.port;

// Middleware
app.use(cors(config.cors));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(loggingMiddleware);

// Serve static files
app.use(express.static(path.join(process.cwd())));

// Swagger/OpenAPI setup
const specs = swaggerJsdoc(config.swagger || {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Resume PDF Generation API',
      version: '1.0.0',
      description: 'API for generating PDF resumes with navigation exclusion'
    }
  },
  apis: ['./src/routes/*.ts']
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// API Routes
app.use('/api', pdfRoutes);
app.use('/api', healthRoutes);
app.use('/api', renderRoutes);
app.use('/api/css', cssRoutes);
app.use('/api/pdf-config', pdfConfigRoutes);
app.use('/api/assets', assetRoutes);

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'dashboard', 'index.html'));
});



// Resume route (server-side rendered with navigation)
app.get('/resume', async (req, res) => {
  try {
    const { resumeType, template = 'default' } = req.query;

    if (!resumeType || typeof resumeType !== 'string') {
      res.status(400).send(`
        <html>
          <body>
            <h1>Error</h1>
            <p>resumeType parameter is required</p>
            <a href="/dashboard">Back to Dashboard</a>
          </body>
        </html>
      `);
      return;
    }

    // Import the necessary services
    const { ResumeComposer } = await import('./services/resume-composer');
    const resumeComposer = ResumeComposer.getInstance();

    // Validate resume type exists
    const availableTypes = await resumeComposer.getAvailableResumeTypes();
    if (!availableTypes.includes(resumeType)) {
      res.status(400).send(`
        <html>
          <body>
            <h1>Error</h1>
            <p>Invalid resume type. Available types: ${availableTypes.join(', ')}</p>
            <a href="/dashboard">Back to Dashboard</a>
          </body>
        </html>
      `);
      return;
    }

    // Validate template exists
    const availableTemplates = await resumeComposer.getAvailableTemplates();
    if (!availableTemplates.includes(template as string)) {
      res.status(400).send(`
        <html>
          <body>
            <h1>Error</h1>
            <p>Invalid template. Available templates: ${availableTemplates.join(', ')}</p>
            <a href="/dashboard">Back to Dashboard</a>
          </body>
        </html>
      `);
      return;
    }

    // Compose resume for browser viewing (with navigation)
    const browserHTML = await resumeComposer.composeForBrowser(resumeType, template as string);

    // Send as HTML page with navigation
    res.setHeader('Content-Type', 'text/html');
    res.send(browserHTML);

  } catch (error) {
    console.error('Resume rendering error:', error);
    res.status(500).send(`
      <html>
        <body>
          <h1>Error</h1>
          <p>Failed to render resume: ${error}</p>
          <a href="/dashboard">Back to Dashboard</a>
        </body>
      </html>
    `);
  }
});

// Error handling middleware
app.use(errorLoggingMiddleware);
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.logServerShutdown('SIGTERM');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.logServerShutdown('SIGINT');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.logServerStart(PORT);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
  console.log(`🏠 Dashboard available at http://localhost:${PORT}/dashboard`);
  console.log(`📄 Resume available at http://localhost:${PORT}/resume`);
});

export default app;
