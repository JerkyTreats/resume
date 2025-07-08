import { Router, Request, Response } from 'express';
import { PDFGenerator } from '../services/pdf-generator';
import { validateResumeType } from '../middleware/validation';
import { GeneratePDFRequest, GeneratePDFResponse, ResumeTypesResponse } from '../types';
import config from '../config/development';

const router = Router();
const pdfGenerator = new PDFGenerator();

/**
 * @swagger
 * /api/generate-pdf:
 *   post:
 *     summary: Generate PDF for specified resume type
 *     tags: [PDF]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resumeType:
 *                 type: string
 *                 enum: [staff_platform_engineer, eng_mgr, ai_lead]
 *                 description: The type of resume to generate
 *               options:
 *                 type: object
 *                 properties:
 *                   width:
 *                     type: string
 *                     default: "8.5in"
 *                   height:
 *                     type: string
 *                     default: "auto"
 *                   printBackground:
 *                     type: boolean
 *                     default: true
 *                   margin:
 *                     type: object
 *                     properties:
 *                       top: { type: string, default: "0.25in" }
 *                       right: { type: string, default: "0.25in" }
 *                       bottom: { type: string, default: "0.25in" }
 *                       left: { type: string, default: "0.25in" }
 *                   preferCSSPageSize:
 *                     type: boolean
 *                     default: false
 *                   pageRanges:
 *                     type: string
 *                     default: "1"
 *                   scale:
 *                     type: number
 *                     default: 1.0
 *     responses:
 *       200:
 *         description: PDF generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 pdfUrl:
 *                   type: string
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                       message:
 *                         type: string
 *       500:
 *         description: PDF generation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post('/generate-pdf', validateResumeType, async (req: Request, res: Response) => {
  try {
    const { resumeType, options }: GeneratePDFRequest = req.body;

    const result = await pdfGenerator.generatePDF(resumeType, options);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    // Create download URL for the generated PDF
    const pdfUrl = `/download-pdf?file=${encodeURIComponent(result.filePath!)}`;

    const response: GeneratePDFResponse = {
      success: true,
      pdfUrl
    };

    return res.json(response);

  } catch (error) {
    console.error('PDF generation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during PDF generation'
    });
  }
});

/**
 * @swagger
 * /api/resume-types:
 *   get:
 *     summary: List available resume types
 *     tags: [PDF]
 *     responses:
 *       200:
 *         description: List of available resume types
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 types:
 *                   type: array
 *                   items:
 *                     type: string
 *                     enum: [staff_platform_engineer, eng_mgr, ai_lead]
 */
router.get('/resume-types', (req: Request, res: Response) => {
  const response: ResumeTypesResponse = {
    types: config.resumeTypes
  };
  return res.json(response);
});

/**
 * @swagger
 * /api/download-pdf:
 *   get:
 *     summary: Download generated PDF file
 *     tags: [PDF]
 *     parameters:
 *       - in: query
 *         name: file
 *         required: true
 *         schema:
 *           type: string
 *         description: Path to the PDF file to download
 *     responses:
 *       200:
 *         description: PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: File not found
 *       500:
 *         description: Server error
 */
router.get('/download-pdf', (req: Request, res: Response) => {
  try {
    const filePath = req.query.file as string;

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    // Security check: ensure file is within generated-pdfs directory
    const decodedPath = decodeURIComponent(filePath);
    const generatedPdfsDir = 'generated-pdfs';

    if (!decodedPath.startsWith(generatedPdfsDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    return res.download(decodedPath, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ error: 'Failed to download file' });
      }
    });

  } catch (error) {
    console.error('Download route error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
