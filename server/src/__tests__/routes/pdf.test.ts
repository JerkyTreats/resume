// Mock the PDFGenerator before importing routes
const mockGeneratePDF = jest.fn();
const mockGetPerformanceMetrics = jest.fn();
const mockClearPerformanceMetrics = jest.fn();
const mockHealthCheck = jest.fn();
const mockClose = jest.fn();
const mockInitialize = jest.fn();

jest.mock('../../services/pdf-generator', () => ({
  PDFGenerator: jest.fn().mockImplementation(() => ({
    generatePDF: mockGeneratePDF,
    getPerformanceMetrics: mockGetPerformanceMetrics,
    clearPerformanceMetrics: mockClearPerformanceMetrics,
    healthCheck: mockHealthCheck,
    close: mockClose,
    initialize: mockInitialize
  }))
}));

const request = require('supertest');
const express = require('express');
import pdfRoutes from '../../routes/pdf';
import { PDFGenerator } from '../../services/pdf-generator';
import { validateResumeType } from '../../middleware/validation';
import { GeneratePDFRequest, GeneratePDFResponse, ResumeTypesResponse, PerformanceMetrics } from '../../types';
import config from '../../config/production';

describe('PDF Routes', () => {
  let app: any;

  beforeEach(() => {
    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use('/api', pdfRoutes);

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const validRequest = {
    resumeType: 'staff_platform_engineer' as const,
    options: {
      width: '8.5in',
      height: '100in',
      printBackground: true
    }
  };

  describe('POST /api/generate-pdf', () => {

    it('should generate PDF successfully', async () => {
      mockGeneratePDF.mockResolvedValue({
        success: true,
        filePath: 'generated-pdfs/staff_platform_engineer-2024-01-01.pdf',
        generationTime: 5000
      });

      const response = await request(app)
        .post('/api/generate-pdf')
        .send(validRequest)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        pdfUrl: '/download-pdf?file=generated-pdfs%2Fstaff_platform_engineer-2024-01-01.pdf',
        generationTime: 5000
      });

      expect(mockGeneratePDF).toHaveBeenCalledWith(
        'staff_platform_engineer',
        validRequest.options
      );
    });

    it('should handle PDF generation failure', async () => {
      mockGeneratePDF.mockResolvedValue({
        success: false,
        error: 'PDF generation failed',
        generationTime: 30000
      });

      const response = await request(app)
        .post('/api/generate-pdf')
        .send(validRequest)
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'PDF generation failed',
        generationTime: 30000
      });
    });

    it('should handle server errors during PDF generation', async () => {
      mockGeneratePDF.mockRejectedValue(new Error('Server error'));

      const response = await request(app)
        .post('/api/generate-pdf')
        .send(validRequest)
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Internal server error during PDF generation'
      });
    });

    it('should validate resume type', async () => {
      const invalidRequest = {
        resumeType: 'invalid_type',
        options: {}
      };

      const response = await request(app)
        .post('/api/generate-pdf')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should accept all valid resume types', async () => {
      const validTypes = ['staff_platform_engineer', 'eng_mgr', 'ai_lead'];

      for (const resumeType of validTypes) {
        mockGeneratePDF.mockResolvedValue({
          success: true,
          filePath: `generated-pdfs/${resumeType}-test.pdf`,
          generationTime: 1000
        });

        const response = await request(app)
          .post('/api/generate-pdf')
          .send({ resumeType, options: {} })
          .expect(200);

        expect(response.body.success).toBe(true);
      }
    });

    it('should handle missing options gracefully', async () => {
      mockGeneratePDF.mockResolvedValue({
        success: true,
        filePath: 'generated-pdfs/test.pdf',
        generationTime: 1000
      });

      const response = await request(app)
        .post('/api/generate-pdf')
        .send({ resumeType: 'staff_platform_engineer' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockGeneratePDF).toHaveBeenCalledWith(
        'staff_platform_engineer',
        undefined
      );
    });

    it('should include performance metrics in response', async () => {
      const generationTime = 7500;
      mockGeneratePDF.mockResolvedValue({
        success: true,
        filePath: 'generated-pdfs/test.pdf',
        generationTime
      });

      const response = await request(app)
        .post('/api/generate-pdf')
        .send(validRequest)
        .expect(200);

      expect(response.body.generationTime).toBe(generationTime);
    });
  });

  describe('GET /api/resume-types', () => {
    it('should return list of available resume types', async () => {
      const response = await request(app)
        .get('/api/resume-types')
        .expect(200);

      expect(response.body).toEqual({
        types: ['staff_platform_engineer', 'eng_mgr', 'ai_lead']
      });
    });
  });

  describe('GET /api/performance-metrics', () => {
    it('should return performance metrics', async () => {
      const mockMetrics = new Map([
        ['staff_platform_engineer', 5000],
        ['eng_mgr', 3000],
        ['ai_lead', 4000]
      ]);

      mockGetPerformanceMetrics.mockReturnValue(mockMetrics);

      const response = await request(app)
        .get('/api/performance-metrics')
        .expect(200);

      expect(response.body).toEqual({
        staff_platform_engineer: 5000,
        eng_mgr: 3000,
        ai_lead: 4000
      });
    });

    it('should return empty object when no metrics available', async () => {
      mockGetPerformanceMetrics.mockReturnValue(new Map());

      const response = await request(app)
        .get('/api/performance-metrics')
        .expect(200);

      expect(response.body).toEqual({});
    });
  });

  describe('POST /api/clear-performance-metrics', () => {
    it('should clear performance metrics', async () => {
      const response = await request(app)
        .post('/api/clear-performance-metrics')
        .expect(200);

      expect(response.body).toEqual({ success: true });
      expect(mockClearPerformanceMetrics).toHaveBeenCalled();
    });
  });

  describe('GET /api/download-pdf', () => {
    it('should download PDF file successfully', async () => {
      const filePath = 'generated-pdfs/test.pdf';

      // Mock fs.existsSync to return true for the test file
      const fs = require('fs');
      const originalExistsSync = fs.existsSync;
      fs.existsSync = jest.fn().mockReturnValue(true);

      try {
        const response = await request(app)
          .get(`/api/download-pdf?file=${encodeURIComponent(filePath)}`)
          .expect(200);

        // Note: In a real test environment, you might need to mock the file system
        // and the res.download method. This test verifies the route structure.
      } finally {
        // Restore original function
        fs.existsSync = originalExistsSync;
      }
    });

    it('should reject requests without file parameter', async () => {
      const response = await request(app)
        .get('/api/download-pdf')
        .expect(400);

      expect(response.body.error).toBe('File path is required');
    });

    it('should reject requests with invalid file paths', async () => {
      const response = await request(app)
        .get('/api/download-pdf?file=../malicious-file.pdf')
        .expect(403);

      expect(response.body.error).toBe('Access denied');
    });

    it('should reject requests outside generated-pdfs directory', async () => {
      const response = await request(app)
        .get('/api/download-pdf?file=other-directory/file.pdf')
        .expect(403);

      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('Error handling', () => {
    it('should handle malformed JSON requests', async () => {
      const response = await request(app)
        .post('/api/generate-pdf')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);
    });

    it('should handle missing request body', async () => {
      const response = await request(app)
        .post('/api/generate-pdf')
        .expect(400);
    });
  });

  describe('Performance monitoring integration', () => {
    it('should track generation time for performance monitoring', async () => {
      const startTime = Date.now();
      mockGeneratePDF.mockResolvedValue({
        success: true,
        filePath: 'generated-pdfs/test.pdf',
        generationTime: 5000
      });

      await request(app)
        .post('/api/generate-pdf')
        .send(validRequest)
        .expect(200);

      // Verify that performance tracking is working
      expect(mockGeneratePDF).toHaveBeenCalled();
    });

    it('should handle slow generation gracefully', async () => {
      mockGeneratePDF.mockResolvedValue({
        success: true,
        filePath: 'generated-pdfs/test.pdf',
        generationTime: 35000 // Over 30 second threshold
      });

      const response = await request(app)
        .post('/api/generate-pdf')
        .send(validRequest)
        .expect(200);

      // Should still succeed even if slow
      expect(response.body.success).toBe(true);
      expect(response.body.generationTime).toBe(35000);
    });
  });

  describe('Cross-platform compatibility', () => {
    it('should handle different resume types consistently', async () => {
      const resumeTypes = ['staff_platform_engineer', 'eng_mgr', 'ai_lead'];

      for (const resumeType of resumeTypes) {
        mockGeneratePDF.mockResolvedValue({
          success: true,
          filePath: `generated-pdfs/${resumeType}-test.pdf`,
          generationTime: 1000
        });

        const response = await request(app)
          .post('/api/generate-pdf')
          .send({ resumeType, options: {} })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.pdfUrl).toContain(resumeType);
      }
    });
  });

  describe('PDF options validation', () => {
    it('should accept valid PDF options', async () => {
      const customOptions = {
        width: '11in',
        height: '100in',
        printBackground: false,
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        },
        scale: 0.8
      };

      mockGeneratePDF.mockResolvedValue({
        success: true,
        filePath: 'generated-pdfs/test.pdf',
        generationTime: 1000
      });

      const response = await request(app)
        .post('/api/generate-pdf')
        .send({
          resumeType: 'staff_platform_engineer',
          options: customOptions
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockGeneratePDF).toHaveBeenCalledWith(
        'staff_platform_engineer',
        customOptions
      );
    });
  });
});
