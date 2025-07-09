import { Router, Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { PDFGenerator } from '../services/pdf-generator';
import { validateResumeType } from '../middleware/validation';
import { GeneratePDFRequest, GeneratePDFResponse, ResumeTypesResponse, PerformanceMetrics } from '../types';
import config from '../config/production';

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
 *                 generationTime:
 *                   type: number
 *                   description: Generation time in milliseconds
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
 *                 generationTime:
 *                   type: number
 */
router.post('/generate-pdf', validateResumeType, async (req: Request, res: Response) => {
  try {
    const { resumeType, options }: GeneratePDFRequest = req.body;

    console.log(`Starting PDF generation for resume type: ${resumeType}`);

    const result = await pdfGenerator.generatePDF(resumeType, options, req.correlationId);

    if (!result.success) {
      console.error(`PDF generation failed: ${result.error}`);
      return res.status(500).json({
        success: false,
        error: result.error,
        generationTime: result.generationTime
      });
    }

    console.log(`PDF generated successfully: ${result.filePath}, time: ${result.generationTime}ms`);

    // Create download URL for the generated PDF
    const pdfUrl = `/api/download-pdf?file=${encodeURIComponent(result.filePath!)}`;

    const response: GeneratePDFResponse = {
      success: true,
      pdfUrl,
      ...(result.generationTime && { generationTime: result.generationTime })
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
 * /api/performance-metrics:
 *   get:
 *     summary: Get PDF generation performance metrics
 *     tags: [PDF]
 *     responses:
 *       200:
 *         description: Performance metrics for PDF generation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: number
 *                 description: Generation time in milliseconds for each resume type
 */
router.get('/performance-metrics', (req: Request, res: Response) => {
  const metrics = pdfGenerator.getPerformanceMetrics();
  const response: PerformanceMetrics = Object.fromEntries(metrics);

  return res.json(response);
});

/**
 * @swagger
 * /api/clear-performance-metrics:
 *   post:
 *     summary: Clear performance metrics
 *     tags: [PDF]
 *     responses:
 *       200:
 *         description: Performance metrics cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 */
router.post('/clear-performance-metrics', (req: Request, res: Response) => {
  pdfGenerator.clearPerformanceMetrics();

  return res.json({ success: true });
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
    const filename = req.query.file as string;

    if (!filename) {
      return res.status(400).json({ error: 'File name is required' });
    }

    // Security check: ensure filename is safe
    const decodedFilename = decodeURIComponent(filename);
    if (decodedFilename.includes('..') || decodedFilename.includes('/') || decodedFilename.includes('\\')) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Construct full path within generated-pdfs directory
    const generatedPdfsDir = 'generated-pdfs';
    const fullPath = path.join(generatedPdfsDir, decodedFilename);

    console.log(`Download request for file: ${decodedFilename}, full path: ${fullPath}`);

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      console.error(`File not found: ${fullPath}`);
      return res.status(404).json({ error: 'File not found' });
    }

    console.log(`Serving file: ${fullPath}`);
    return res.download(fullPath, (err) => {
      if (err) {
        console.error(`Download error: ${err}`);
        res.status(500).json({ error: 'Failed to download file' });
      }
    });

  } catch (error) {
    console.error('Download endpoint error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/pdf-config:
 *   get:
 *     summary: Get PDF generation configuration options
 *     tags: [PDF]
 *     responses:
 *       200:
 *         description: PDF configuration options
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 options:
 *                   type: object
 *                   properties:
 *                     width:
 *                       type: string
 *                       example: "8.5in"
 *                     height:
 *                       type: string
 *                       example: "100in"
 *                     printBackground:
 *                       type: boolean
 *                       example: true
 *                     margin:
 *                       type: object
 *                       properties:
 *                         top: { type: string, example: "0.25in" }
 *                         right: { type: string, example: "0.25in" }
 *                         bottom: { type: string, example: "0.25in" }
 *                         left: { type: string, example: "0.25in" }
 *                     preferCSSPageSize:
 *                       type: boolean
 *                       example: true
 *                     pageRanges:
 *                       type: string
 *                       example: "1"
 *                     scale:
 *                       type: number
 *                       example: 1.0
 */
router.get('/pdf-config', (req: Request, res: Response) => {
  const response = {
    options: config.pdf.defaultOptions
  };

  return res.json(response);
});

export default router;
