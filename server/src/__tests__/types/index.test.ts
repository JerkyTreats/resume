import {
  ResumeType,
  PDFOptions,
  GeneratePDFRequest,
  GeneratePDFResponse,
  ResumeTypesResponse,
  HealthResponse,
  ValidationError,
  ErrorResponse,
  PDFGenerationResult
} from '../../types';

describe('Type Definitions', () => {
  describe('ResumeType', () => {
    it('should accept valid resume types', () => {
      const validTypes: ResumeType[] = [
        'staff_platform_engineer',
        'eng_mgr',
        'ai_lead'
      ];

      validTypes.forEach(type => {
        expect(typeof type).toBe('string');
        expect(['staff_platform_engineer', 'eng_mgr', 'ai_lead']).toContain(type);
      });
    });

    it('should not accept invalid resume types', () => {
      // TypeScript should catch these at compile time
      // This test documents the expected behavior
      const invalidTypes = [
        'invalid_type',
        'staff_engineer',
        'manager',
        ''
      ];

      invalidTypes.forEach(type => {
        expect(['staff_platform_engineer', 'eng_mgr', 'ai_lead']).not.toContain(type);
      });
    });
  });

  describe('PDFOptions', () => {
    it('should accept valid PDF options', () => {
      const validOptions: PDFOptions = {
        width: '8.5in',
        height: '100in',
        printBackground: true,
        margin: {
          top: '0.25in',
          right: '0.25in',
          bottom: '0.25in',
          left: '0.25in'
        },
        preferCSSPageSize: false,
        pageRanges: '1',
        scale: 1.0
      };

      expect(validOptions.width).toBe('8.5in');
      // expect(validOptions.height).toBe('100in');
      expect(validOptions.printBackground).toBe(true);
      expect(validOptions.scale).toBe(1.0);
    });

    it('should allow partial options', () => {
      const partialOptions: PDFOptions = {
        width: '11in',
        height: '8.5in'
      };

      expect(partialOptions.width).toBe('11in');
      expect(partialOptions.height).toBe('8.5in');
      expect(partialOptions.printBackground).toBeUndefined();
    });

    it('should allow margin options', () => {
      const optionsWithMargin: PDFOptions = {
        margin: {
          top: '0.5in',
          bottom: '0.5in'
        }
      };

      expect(optionsWithMargin.margin?.top).toBe('0.5in');
      expect(optionsWithMargin.margin?.bottom).toBe('0.5in');
    });
  });

  describe('GeneratePDFRequest', () => {
    it('should require resumeType', () => {
      const request: GeneratePDFRequest = {
        resumeType: 'staff_platform_engineer'
      };

      expect(request.resumeType).toBe('staff_platform_engineer');
      expect(request.options).toBeUndefined();
    });

    it('should allow optional options', () => {
      const request: GeneratePDFRequest = {
        resumeType: 'eng_mgr',
        options: {
          width: '8.5in',
          height: '100in'
        }
      };

      expect(request.resumeType).toBe('eng_mgr');
      expect(request.options?.width).toBe('8.5in');
    });
  });

  describe('GeneratePDFResponse', () => {
    it('should handle successful response', () => {
      const successResponse: GeneratePDFResponse = {
        success: true,
        pdfUrl: '/download-pdf?file=test.pdf'
      };

      expect(successResponse.success).toBe(true);
      expect(successResponse.pdfUrl).toBe('/download-pdf?file=test.pdf');
      expect(successResponse.error).toBeUndefined();
    });

    it('should handle error response', () => {
      const errorResponse: GeneratePDFResponse = {
        success: false,
        error: 'PDF generation failed'
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBe('PDF generation failed');
      expect(errorResponse.pdfUrl).toBeUndefined();
    });
  });

  describe('ResumeTypesResponse', () => {
    it('should contain types array', () => {
      const response: ResumeTypesResponse = {
        types: ['staff_platform_engineer', 'eng_mgr', 'ai_lead']
      };

      expect(Array.isArray(response.types)).toBe(true);
      expect(response.types).toHaveLength(3);
    });
  });

  describe('HealthResponse', () => {
    it('should contain status and timestamp', () => {
      const response: HealthResponse = {
        status: 'healthy',
        timestamp: '2023-01-01T00:00:00.000Z'
      };

      expect(response.status).toBe('healthy');
      expect(response.timestamp).toBe('2023-01-01T00:00:00.000Z');
    });
  });

  describe('ValidationError', () => {
    it('should contain field and message', () => {
      const error: ValidationError = {
        field: 'resumeType',
        message: 'resumeType is required'
      };

      expect(error.field).toBe('resumeType');
      expect(error.message).toBe('resumeType is required');
    });
  });

  describe('ErrorResponse', () => {
    it('should contain error message', () => {
      const error: ErrorResponse = {
        error: 'Validation failed'
      };

      expect(error.error).toBe('Validation failed');
      expect(error.details).toBeUndefined();
    });

    it('should allow optional details', () => {
      const error: ErrorResponse = {
        error: 'Validation failed',
        details: [
          {
            field: 'resumeType',
            message: 'resumeType is required'
          }
        ]
      };

      expect(error.error).toBe('Validation failed');
      expect(error.details).toHaveLength(1);
      expect(error.details?.[0].field).toBe('resumeType');
    });
  });

  describe('PDFGenerationResult', () => {
    it('should handle successful generation', () => {
      const success: PDFGenerationResult = {
        success: true,
        filePath: 'generated-pdfs/test.pdf'
      };

      expect(success.success).toBe(true);
      expect(success.filePath).toBe('generated-pdfs/test.pdf');
      expect(success.error).toBeUndefined();
    });

    it('should handle failed generation', () => {
      const failure: PDFGenerationResult = {
        success: false,
        error: 'Browser initialization failed'
      };

      expect(failure.success).toBe(false);
      expect(failure.error).toBe('Browser initialization failed');
      expect(failure.filePath).toBeUndefined();
    });
  });

  describe('Type compatibility', () => {
    it('should allow ResumeType in GeneratePDFRequest', () => {
      const resumeType: ResumeType = 'staff_platform_engineer';
      const request: GeneratePDFRequest = {
        resumeType
      };

      expect(request.resumeType).toBe(resumeType);
    });

    it('should allow PDFOptions in GeneratePDFRequest', () => {
      const options: PDFOptions = {
        width: '8.5in',
        height: '100in'
      };
      const request: GeneratePDFRequest = {
        resumeType: 'staff_platform_engineer',
        options
      };

      expect(request.options).toBe(options);
    });

    it('should allow ValidationError in ErrorResponse', () => {
      const validationError: ValidationError = {
        field: 'test',
        message: 'Test error'
      };
      const error: ErrorResponse = {
        error: 'Validation failed',
        details: [validationError]
      };

      expect(error.details?.[0]).toBe(validationError);
    });
  });
});
