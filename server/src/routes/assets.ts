import { Router, Request, Response } from 'express';
import { AssetManager } from '../services/asset-manager';

const router = Router();
const assetManager = AssetManager.getInstance();

/**
 * @swagger
 * /api/assets/stats:
 *   get:
 *     summary: Get asset cache statistics
 *     tags: [Assets]
 *     responses:
 *       200:
 *         description: Asset cache statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cacheSize:
 *                   type: number
 *                   description: Number of cached assets
 *                 totalSize:
 *                   type: number
 *                   description: Total size of cached assets in bytes
 */
router.get('/stats', (req: Request, res: Response) => {
  const stats = assetManager.getCacheStats();
  return res.json(stats);
});

/**
 * @swagger
 * /api/assets/clear:
 *   post:
 *     summary: Clear asset cache
 *     tags: [Assets]
 *     responses:
 *       200:
 *         description: Asset cache cleared successfully
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
  assetManager.clearCache();
  return res.json({
    success: true,
    message: 'Asset cache cleared successfully'
  });
});

/**
 * @swagger
 * /api/assets/embed-image:
 *   post:
 *     summary: Embed image as base64 data URI
 *     tags: [Assets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imagePath:
 *                 type: string
 *                 description: Path to the image file
 *     responses:
 *       200:
 *         description: Image embedded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dataUri:
 *                   type: string
 *                   description: Base64 data URI of the image
 *                 mimeType:
 *                   type: string
 *                   description: MIME type of the image
 *                 size:
 *                   type: number
 *                   description: Size of the image in bytes
 *       404:
 *         description: Image file not found
 *       500:
 *         description: Failed to embed image
 */
router.post('/embed-image', async (req: Request, res: Response) => {
  try {
    const { imagePath } = req.body;

    if (!imagePath) {
      return res.status(400).json({ error: 'Image path is required' });
    }

    const dataUri = await assetManager.embedImageAsBase64(imagePath);

    if (!dataUri) {
      return res.status(404).json({ error: 'Image file not found or failed to embed' });
    }

    const cachedAsset = assetManager.getCachedAsset(imagePath);
    return res.json({
      dataUri,
      mimeType: cachedAsset?.mimeType || 'image/jpeg',
      size: cachedAsset?.size || 0
    });
  } catch (error) {
    console.error('Image embedding error:', error);
    return res.status(500).json({
      error: 'Failed to embed image'
    });
  }
});

/**
 * @swagger
 * /api/assets/embed-svg:
 *   post:
 *     summary: Embed SVG as base64 data URI
 *     tags: [Assets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               svgPath:
 *                 type: string
 *                 description: Path to the SVG file
 *     responses:
 *       200:
 *         description: SVG embedded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dataUri:
 *                   type: string
 *                   description: Base64 data URI of the SVG
 *                 mimeType:
 *                   type: string
 *                   description: MIME type (image/svg+xml)
 *                 size:
 *                   type: number
 *                   description: Size of the SVG in bytes
 *       404:
 *         description: SVG file not found
 *       500:
 *         description: Failed to embed SVG
 */
router.post('/embed-svg', async (req: Request, res: Response) => {
  try {
    const { svgPath } = req.body;

    if (!svgPath) {
      return res.status(400).json({ error: 'SVG path is required' });
    }

    const dataUri = await assetManager.embedSVGAsBase64(svgPath);

    if (!dataUri) {
      return res.status(404).json({ error: 'SVG file not found or failed to embed' });
    }

    const cachedAsset = assetManager.getCachedAsset(svgPath);
    return res.json({
      dataUri,
      mimeType: 'image/svg+xml',
      size: cachedAsset?.size || 0
    });
  } catch (error) {
    console.error('SVG embedding error:', error);
    return res.status(500).json({
      error: 'Failed to embed SVG'
    });
  }
});

/**
 * @swagger
 * /api/assets/icon:
 *   post:
 *     summary: Get icon as HTML
 *     tags: [Assets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               iconType:
 *                 type: string
 *                 enum: [email, location, link, github, website, phone]
 *                 description: Type of icon to generate
 *               size:
 *                 type: string
 *                 default: "1em"
 *                 description: Size of the icon
 *     responses:
 *       200:
 *         description: Icon HTML generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 html:
 *                   type: string
 *                   description: HTML img element for the icon
 *                 iconType:
 *                   type: string
 *                   description: Type of icon requested
 *                 size:
 *                   type: string
 *                   description: Size of the icon
 */
router.post('/icon', async (req: Request, res: Response) => {
  try {
    const { iconType, size = '1em' } = req.body;

    if (!iconType) {
      return res.status(400).json({ error: 'Icon type is required' });
    }

    const html = await assetManager.getIconHTML(iconType, size);

    return res.json({
      html,
      iconType,
      size
    });
  } catch (error) {
    console.error('Icon generation error:', error);
    return res.status(500).json({
      error: 'Failed to generate icon'
    });
  }
});

/**
 * @swagger
 * /api/assets/fonts:
 *   get:
 *     summary: Get font information
 *     tags: [Assets]
 *     responses:
 *       200:
 *         description: Font information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fonts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       family:
 *                         type: string
 *                       weights:
 *                         type: array
 *                         items:
 *                           type: string
 *                       importUrl:
 *                         type: string
 *                 combinedImportUrl:
 *                   type: string
 *                   description: Combined Google Fonts import URL
 */
router.get('/fonts', (req: Request, res: Response) => {
  const fonts = assetManager.getFontInfo();
  const combinedImportUrl = assetManager.getCombinedFontImportUrl();

  return res.json({
    fonts,
    combinedImportUrl
  });
});

/**
 * @swagger
 * /api/assets/preload:
 *   post:
 *     summary: Preload common assets
 *     tags: [Assets]
 *     responses:
 *       200:
 *         description: Common assets preloaded successfully
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
router.post('/preload', async (req: Request, res: Response) => {
  try {
    await assetManager.preloadCommonAssets();
    return res.json({
      success: true,
      message: 'Common assets preloaded successfully'
    });
  } catch (error) {
    console.error('Asset preloading error:', error);
    return res.status(500).json({
      error: 'Failed to preload assets'
    });
  }
});

export default router;
