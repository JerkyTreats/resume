import { Router, Request, Response } from 'express';
import { PDFGenerator } from '../services/pdf-generator';
import { HealthResponse } from '../types';

const router = Router();
const pdfGenerator = new PDFGenerator();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Server health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 services:
 *                   type: object
 *                   properties:
 *                     pdfGenerator:
 *                       type: boolean
 *       500:
 *         description: Server is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "unhealthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 error:
 *                   type: string
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const timestamp = new Date().toISOString();

    // Check PDF generator health
    const pdfGeneratorHealthy = await pdfGenerator.healthCheck();

    const response: HealthResponse & { services?: { pdfGenerator: boolean } } = {
      status: pdfGeneratorHealthy ? 'healthy' : 'unhealthy',
      timestamp,
      services: {
        pdfGenerator: pdfGeneratorHealthy
      }
    };

    const statusCode = pdfGeneratorHealthy ? 200 : 500;
    res.status(statusCode).json(response);

  } catch (error) {
    console.error('Health check error:', error);
    const response: HealthResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString()
    };
    res.status(500).json(response);
  }
});

export default router;
