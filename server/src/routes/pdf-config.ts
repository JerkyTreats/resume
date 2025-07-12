import { Router, Request, Response } from 'express';
import { PDFConfigManager } from '../config/pdf-config';

const router = Router();
const pdfConfigManager = PDFConfigManager.getInstance();

/**
 * @swagger
 * /api/pdf-config/full:
 *   get:
 *     summary: Get complete PDF configuration
 *     tags: [PDF Configuration]
 *     responses:
 *       200:
 *         description: Complete PDF configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 options:
 *                   type: object
 *                   properties:
 *                     width: { type: string, example: "8.5in" }
 *                     height: { type: string, example: "100in" }
 *                     printBackground: { type: boolean, example: true }
 *                     scale: { type: number, example: 1.0 }
 *                     margin: { type: object }
 *                     preferCSSPageSize: { type: boolean, example: false }
 *                     pageRanges: { type: string, example: "1" }
 *                     displayHeaderFooter: { type: boolean, example: false }
 *                     omitBackground: { type: boolean, example: false }
 *                 puppeteer:
 *                   type: object
 *                   properties:
 *                     headless: { type: string, example: "new" }
 *                     args: { type: array, items: { type: string } }
 *                     timeout: { type: number, example: 30000 }
 *                 optimization:
 *                   type: object
 *                   properties:
 *                     enabled: { type: boolean, example: true }
 *                     level: { type: string, enum: ["minimal", "balanced", "aggressive"] }
 *                     compression: { type: boolean, example: true }
 *                     objectStreams: { type: boolean, example: true }
 *                     updateFieldAppearances: { type: boolean, example: false }
 *                 rendering:
 *                   type: object
 *                   properties:
 *                     viewport: { type: object }
 *                     userAgent: { type: string }
 *                     waitForSelector: { type: string, example: ".resume-content" }
 *                     waitForFunction: { type: string, example: "document.fonts.ready" }
 *                     waitTimeout: { type: number, example: 10000 }
 */
router.get('/full', (req: Request, res: Response) => {
  const config = pdfConfigManager.getConfig();
  return res.json(config);
});

/**
 * @swagger
 * /api/pdf-config/options:
 *   get:
 *     summary: Get PDF options only
 *     tags: [PDF Configuration]
 *     responses:
 *       200:
 *         description: PDF options configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 width: { type: string, example: "8.5in" }
 *                 height: { type: string, example: "100in" }
 *                 printBackground: { type: boolean, example: true }
 *                 scale: { type: number, example: 1.0 }
 *                 margin: { type: object }
 *                 preferCSSPageSize: { type: boolean, example: false }
 *                 pageRanges: { type: string, example: "1" }
 *                 displayHeaderFooter: { type: boolean, example: false }
 *                 omitBackground: { type: boolean, example: false }
 */
router.get('/options', (req: Request, res: Response) => {
  const options = pdfConfigManager.getOptions();
  return res.json(options);
});

/**
 * @swagger
 * /api/pdf-config/puppeteer:
 *   get:
 *     summary: Get Puppeteer configuration
 *     tags: [PDF Configuration]
 *     responses:
 *       200:
 *         description: Puppeteer configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 headless: { type: string, example: "new" }
 *                 args: { type: array, items: { type: string } }
 *                 timeout: { type: number, example: 30000 }
 */
router.get('/puppeteer', (req: Request, res: Response) => {
  const puppeteerConfig = pdfConfigManager.getPuppeteerConfig();
  return res.json(puppeteerConfig);
});

/**
 * @swagger
 * /api/pdf-config/optimization:
 *   get:
 *     summary: Get optimization configuration
 *     tags: [PDF Configuration]
 *     responses:
 *       200:
 *         description: Optimization configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 enabled: { type: boolean, example: true }
 *                 level: { type: string, enum: ["minimal", "balanced", "aggressive"] }
 *                 compression: { type: boolean, example: true }
 *                 objectStreams: { type: boolean, example: true }
 *                 updateFieldAppearances: { type: boolean, example: false }
 */
router.get('/optimization', (req: Request, res: Response) => {
  const optimizationConfig = pdfConfigManager.getOptimizationConfig();
  return res.json(optimizationConfig);
});

/**
 * @swagger
 * /api/pdf-config/rendering:
 *   get:
 *     summary: Get rendering configuration
 *     tags: [PDF Configuration]
 *     responses:
 *       200:
 *         description: Rendering configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 viewport: { type: object }
 *                 userAgent: { type: string }
 *                 waitForSelector: { type: string, example: ".resume-content" }
 *                 waitForFunction: { type: string, example: "document.fonts.ready" }
 *                 waitTimeout: { type: number, example: 10000 }
 */
router.get('/rendering', (req: Request, res: Response) => {
  const renderingConfig = pdfConfigManager.getRenderingConfig();
  return res.json(renderingConfig);
});

/**
 * @swagger
 * /api/pdf-config/validate:
 *   post:
 *     summary: Validate PDF configuration
 *     tags: [PDF Configuration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               options:
 *                 type: object
 *                 properties:
 *                   width: { type: string }
 *                   height: { type: string }
 *                   scale: { type: number }
 *                   margin: { type: object }
 *     responses:
 *       200:
 *         description: Configuration validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isValid: { type: boolean }
 *                 errors: { type: array, items: { type: string } }
 */
router.post('/validate', (req: Request, res: Response) => {
  try {
    const { options } = req.body;

    if (options) {
      // Create a temporary config manager with custom options for validation
      const tempConfig = pdfConfigManager.mergeOptions(options);
      const validation = pdfConfigManager.validateConfig();
      return res.json(validation);
    } else {
      const validation = pdfConfigManager.validateConfig();
      return res.json(validation);
    }
  } catch (error) {
    console.error('Configuration validation error:', error);
    return res.status(500).json({
      isValid: false,
      errors: ['Failed to validate configuration']
    });
  }
});

/**
 * @swagger
 * /api/pdf-config/merge:
 *   post:
 *     summary: Merge custom options with default configuration
 *     tags: [PDF Configuration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               options:
 *                 type: object
 *                 properties:
 *                   width: { type: string }
 *                   height: { type: string }
 *                   scale: { type: number }
 *                   margin: { type: object }
 *     responses:
 *       200:
 *         description: Merged PDF options
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 options: { type: object }
 */
router.post('/merge', (req: Request, res: Response) => {
  try {
    const { options } = req.body;
    const mergedOptions = pdfConfigManager.mergeOptions(options);
    return res.json({ options: mergedOptions });
  } catch (error) {
    console.error('Configuration merge error:', error);
    return res.status(500).json({
      error: 'Failed to merge configuration options'
    });
  }
});

export default router;
