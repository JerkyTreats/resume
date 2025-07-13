import { Router, Request, Response } from 'express';
import { CSSManager } from '../services/css-manager';

const router = Router();
const cssManager = CSSManager.getInstance();

/**
 * @swagger
 * /api/css/stats:
 *   get:
 *     summary: Get CSS cache statistics
 *     tags: [CSS]
 *     responses:
 *       200:
 *         description: CSS cache statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cssCacheSize:
 *                   type: number
 *                   description: Number of cached CSS assemblies
 *                 assemblyCacheSize:
 *                   type: number
 *                   description: Number of cached CSS assemblies with breakdown
 */
router.get('/stats', (req: Request, res: Response) => {
  const stats = cssManager.getCacheStats();
  return res.json(stats);
});

/**
 * @swagger
 * /api/css/clear:
 *   post:
 *     summary: Clear CSS cache
 *     tags: [CSS]
 *     responses:
 *       200:
 *         description: CSS cache cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.post('/clear', (req: Request, res: Response) => {
  cssManager.clearCache();
  return res.json({
    success: true,
    message: 'CSS cache cleared successfully'
  });
});

/**
 * @swagger
 * /api/css/preview:
 *   post:
 *     summary: Preview CSS for specific context
 *     tags: [CSS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               forPDF:
 *                 type: boolean
 *                 default: false
 *               template:
 *                 type: string
 *                 default: "default"
 *               includeFonts:
 *                 type: boolean
 *                 default: true
 *               includeIcons:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: CSS preview for the specified context
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 css:
 *                   type: string
 *                   description: Complete CSS for the context
 *                 assembly:
 *                   type: object
 *                   properties:
 *                     baseCSS:
 *                       type: string
 *                     templateCSS:
 *                       type: string
 *                     fontCSS:
 *                       type: string
 *                     iconCSS:
 *                       type: string
 */
router.post('/preview', async (req: Request, res: Response) => {
  try {
    const { forPDF = false, template = 'default', includeFonts = true, includeIcons = true } = req.body;

    const css = await cssManager.getCompleteCSS({
      forPDF,
      template,
      includeFonts,
      includeIcons
    });

    const assembly = await cssManager.getCSSAssembly({
      forPDF,
      template,
      includeFonts,
      includeIcons
    });

    return res.json({
      css,
      assembly
    });
  } catch (error) {
    console.error('CSS preview error:', error);
    return res.status(500).json({
      error: 'Failed to generate CSS preview'
    });
  }
});

export default router;
