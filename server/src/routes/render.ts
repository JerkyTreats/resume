import { Router, Request, Response } from 'express';
import { ResumeComposer } from '../services/resume-composer';

const router = Router();
const resumeComposer = ResumeComposer.getInstance();

// GET /api/render-resume
// Renders a resume using server-side Handlebars templating
router.get('/render-resume', async (req: Request, res: Response): Promise<void> => {
  try {
    const { resumeType, template = 'default' } = req.query;

    if (!resumeType || typeof resumeType !== 'string') {
      res.status(400).json({
        success: false,
        error: 'resumeType parameter is required'
      });
      return;
    }

    // Validate resume type exists
    const availableTypes = await resumeComposer.getAvailableResumeTypes();
    if (!availableTypes.includes(resumeType)) {
      res.status(400).json({
        success: false,
        error: `Invalid resume type. Available types: ${availableTypes.join(', ')}`
      });
      return;
    }

    // Validate template exists
    const availableTemplates = await resumeComposer.getAvailableTemplates();
    if (!availableTemplates.includes(template as string)) {
      res.status(400).json({
        success: false,
        error: `Invalid template. Available templates: ${availableTemplates.join(', ')}`
      });
      return;
    }

    // Render the resume
    const renderedResume = await resumeComposer.composeForAPI(resumeType, template as string);

    res.json({
      success: true,
      html: renderedResume.html,
      css: renderedResume.css,
      metadata: renderedResume.metadata
    });

  } catch (error) {
    console.error('Resume rendering error:', error);
    res.status(500).json({
      success: false,
      error: `Failed to render resume: ${error}`
    });
  }
});

// GET /resume-ssr
// Serves rendered resume as HTML page (for dashboard links)
router.get('/resume-ssr', async (req: Request, res: Response): Promise<void> => {
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

    // Compose resume for browser viewing
    const browserHTML = await resumeComposer.composeForBrowser(resumeType, template as string);

    // Send as HTML page
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

// GET /api/available-resume-types
// Returns list of available resume types
router.get('/available-resume-types', async (req: Request, res: Response) => {
  try {
    const types = await resumeComposer.getAvailableResumeTypes();
    res.json({
      success: true,
      types
    });
  } catch (error) {
    console.error('Error getting resume types:', error);
    res.status(500).json({
      success: false,
      error: `Failed to get resume types: ${error}`
    });
  }
});

// GET /api/available-templates
// Returns list of available templates
router.get('/available-templates', async (req: Request, res: Response) => {
  try {
    const templates = await resumeComposer.getAvailableTemplates();
    res.json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Error getting templates:', error);
    res.status(500).json({
      success: false,
      error: `Failed to get templates: ${error}`
    });
  }
});

// POST /api/clear-template-cache
// Clears the template cache
router.post('/clear-template-cache', async (req: Request, res: Response) => {
  try {
    resumeComposer.clearCache();
    res.json({
      success: true,
      message: 'Template cache cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing template cache:', error);
    res.status(500).json({
      success: false,
      error: `Failed to clear template cache: ${error}`
    });
  }
});

export default router;
