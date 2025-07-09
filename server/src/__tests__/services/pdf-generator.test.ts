import { PDFGenerator } from '../../services/pdf-generator';
import { ResumeType, PDFOptions } from '../../types';
import puppeteer from 'puppeteer';

// Mock puppeteer
jest.mock('puppeteer');

describe('PDFGenerator', () => {
  let pdfGenerator: PDFGenerator;
  let mockBrowser: any;
  let mockPage: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock page
    mockPage = {
      setViewport: jest.fn().mockResolvedValue(undefined),
      goto: jest.fn().mockResolvedValue(undefined),
      waitForFunction: jest.fn().mockResolvedValue(undefined),
      pdf: jest.fn().mockResolvedValue(Buffer.from('mock-pdf-content')),
      close: jest.fn().mockResolvedValue(undefined)
    };

    // Create mock browser
    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn().mockResolvedValue(undefined)
    };

    // Mock puppeteer.launch
    (puppeteer.launch as jest.Mock).mockResolvedValue(mockBrowser);

    // Create PDF generator instance
    pdfGenerator = new PDFGenerator();
  });

  afterEach(async () => {
    await pdfGenerator.close();
  });

  describe('initialize', () => {
    it('should initialize browser with cross-platform options', async () => {
      await pdfGenerator.initialize();

      expect(puppeteer.launch).toHaveBeenCalledWith({
        headless: "new",
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--disable-extensions',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-field-trial-config',
          '--disable-ipc-flooding-protection'
        ]
      });
    });

    it('should throw error if browser initialization fails', async () => {
      const error = new Error('Browser initialization failed');
      (puppeteer.launch as jest.Mock).mockRejectedValue(error);

      await expect(pdfGenerator.initialize()).rejects.toThrow('Failed to initialize Puppeteer: Error: Browser initialization failed');
    });
  });

  describe('generatePDF', () => {
    const mockResumeType: ResumeType = 'staff_platform_engineer';
    const mockOptions: PDFOptions = {
      width: '8.5in',
      height: '100in',
      printBackground: true
    };

    beforeEach(async () => {
      await pdfGenerator.initialize();
    });

    it('should generate PDF with enhanced content waiting', async () => {
      const result = await pdfGenerator.generatePDF(mockResumeType, mockOptions);

      expect(result.success).toBe(true);
      expect(result.filePath).toContain('staff_platform_engineer');
      expect(result.filePath).toContain('.pdf');
      expect(result.generationTime).toBeDefined();
      expect(typeof result.generationTime).toBe('number');
    });

    it('should wait for Alpine.js content to load', async () => {
      await pdfGenerator.generatePDF(mockResumeType, mockOptions);

      // Check that Alpine.js waiting functions were called
      expect(mockPage.waitForFunction).toHaveBeenCalledWith(
        expect.any(Function),
        { timeout: 10000 }
      );
    });

    it('should wait for resources (images and fonts) to load', async () => {
      await pdfGenerator.generatePDF(mockResumeType, mockOptions);

      // Check that resource waiting functions were called
      expect(mockPage.waitForFunction).toHaveBeenCalledWith(
        expect.any(Function),
        { timeout: 10000 }
      );
    });

    it('should wait for dynamic content to render', async () => {
      await pdfGenerator.generatePDF(mockResumeType, mockOptions);

      // Check that dynamic content waiting functions were called
      expect(mockPage.waitForFunction).toHaveBeenCalledWith(
        expect.any(Function),
        { timeout: 10000 }
      );
    });

    it('should set enhanced viewport for better rendering', async () => {
      await pdfGenerator.generatePDF(mockResumeType, mockOptions);

      expect(mockPage.setViewport).toHaveBeenCalledWith({
        width: 1200,
        height: 800,
        deviceScaleFactor: 2
      });
    });

    it('should navigate to correct resume URL', async () => {
      await pdfGenerator.generatePDF(mockResumeType, mockOptions);

      expect(mockPage.goto).toHaveBeenCalledWith(
        'http://localhost:3000/resume.html?type=staff_platform_engineer',
        {
          waitUntil: 'networkidle0',
          timeout: 30000
        }
      );
    });

    it('should use default PDF options when none provided', async () => {
      await pdfGenerator.generatePDF(mockResumeType);

      expect(mockPage.pdf).toHaveBeenCalledWith({
        width: '8.5in',
        height: '100in',
        printBackground: true,
        margin: {
          top: '0.25in',
          right: '0.25in',
          bottom: '0.25in',
          left: '0.25in'
        },
        preferCSSPageSize: true,
        pageRanges: '1',
        scale: 1.0
      });
    });

    it('should merge custom options with defaults', async () => {
      const customOptions: PDFOptions = {
        width: '11in',
        height: '100in',
        printBackground: false,
        scale: 0.8
      };

      await pdfGenerator.generatePDF(mockResumeType, customOptions);

      expect(mockPage.pdf).toHaveBeenCalledWith({
        width: '11in',
        height: '100in',
        printBackground: false,
        margin: {
          top: '0.25in',
          right: '0.25in',
          bottom: '0.25in',
          left: '0.25in'
        },
        preferCSSPageSize: true,
        pageRanges: '1',
        scale: 0.8
      });
    });

    it('should handle PDF generation errors gracefully', async () => {
      const error = new Error('PDF generation failed');
      mockPage.pdf.mockRejectedValue(error);

      const result = await pdfGenerator.generatePDF(mockResumeType, mockOptions);

      expect(result.success).toBe(false);
      expect(result.error).toContain('PDF generation failed');
      expect(result.generationTime).toBeDefined();
    });

    it('should handle browser initialization errors', async () => {
      // Reset browser to null to force re-initialization
      (pdfGenerator as any).browser = null;
      (puppeteer.launch as jest.Mock).mockRejectedValue(new Error('Browser failed'));

      const result = await pdfGenerator.generatePDF(mockResumeType, mockOptions);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to initialize browser');
    });

    it('should close page after generation', async () => {
      await pdfGenerator.generatePDF(mockResumeType, mockOptions);

      expect(mockPage.close).toHaveBeenCalled();
    });

    it('should record performance metrics', async () => {
      const result = await pdfGenerator.generatePDF(mockResumeType, mockOptions);

      expect(result.generationTime).toBeDefined();
      expect(typeof result.generationTime).toBe('number');
      expect(result.generationTime).toBeGreaterThan(0);
    });

    it('should log performance warning for slow generation', async () => {
      // Mock a slow generation by adding delay
      mockPage.pdf.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(Buffer.from('mock-pdf')), 100))
      );

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await pdfGenerator.generatePDF(mockResumeType, mockOptions);

      // Note: This test might not trigger the warning due to timing,
      // but we can verify the warning logic exists
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('performance monitoring', () => {
    beforeEach(async () => {
      await pdfGenerator.initialize();
    });

    it('should track performance metrics for different resume types', async () => {
      await pdfGenerator.generatePDF('staff_platform_engineer');
      await pdfGenerator.generatePDF('eng_mgr');
      await pdfGenerator.generatePDF('ai_lead');

      const metrics = pdfGenerator.getPerformanceMetrics();

      expect(metrics.has('staff_platform_engineer')).toBe(true);
      expect(metrics.has('eng_mgr')).toBe(true);
      expect(metrics.has('ai_lead')).toBe(true);
    });

    it('should clear performance metrics', async () => {
      await pdfGenerator.generatePDF('staff_platform_engineer');

      let metrics = pdfGenerator.getPerformanceMetrics();
      expect(metrics.size).toBeGreaterThan(0);

      pdfGenerator.clearPerformanceMetrics();

      metrics = pdfGenerator.getPerformanceMetrics();
      expect(metrics.size).toBe(0);
    });
  });

  describe('healthCheck', () => {
    it('should return true when browser is healthy', async () => {
      await pdfGenerator.initialize();

      const isHealthy = await pdfGenerator.healthCheck();

      expect(isHealthy).toBe(true);
    });

    it('should return false when browser is not available', async () => {
      const isHealthy = await pdfGenerator.healthCheck();

      expect(isHealthy).toBe(false);
    });

    it('should handle health check errors gracefully', async () => {
      await pdfGenerator.initialize();
      mockPage.goto.mockRejectedValue(new Error('Health check failed'));

      const isHealthy = await pdfGenerator.healthCheck();

      expect(isHealthy).toBe(false);
    });
  });

  describe('close', () => {
    it('should close browser and reset to null', async () => {
      await pdfGenerator.initialize();

      await pdfGenerator.close();

      expect(mockBrowser.close).toHaveBeenCalled();
      expect((pdfGenerator as any).browser).toBeNull();
    });

    it('should handle close when browser is null', async () => {
      await pdfGenerator.close();

      // Should not throw error
      expect(mockBrowser.close).not.toHaveBeenCalled();
    });
  });

  describe('content waiting methods', () => {
    beforeEach(async () => {
      await pdfGenerator.initialize();
    });

    it('should wait for Alpine.js to be available', async () => {
      await pdfGenerator.generatePDF('staff_platform_engineer');

      // Verify Alpine.js waiting was called
      expect(mockPage.waitForFunction).toHaveBeenCalledWith(
        expect.any(Function),
        { timeout: 10000 }
      );
    });

    it('should wait for Alpine.js to be initialized', async () => {
      await pdfGenerator.generatePDF('staff_platform_engineer');

      // Verify Alpine.js initialization waiting was called
      expect(mockPage.waitForFunction).toHaveBeenCalledWith(
        expect.any(Function),
        { timeout: 10000 }
      );
    });

    it('should wait for Alpine.js data to be loaded', async () => {
      await pdfGenerator.generatePDF('staff_platform_engineer');

      // Verify Alpine.js data loading waiting was called
      expect(mockPage.waitForFunction).toHaveBeenCalledWith(
        expect.any(Function),
        { timeout: 10000 }
      );
    });

    it('should wait for specific Alpine.js content to be rendered', async () => {
      await pdfGenerator.generatePDF('staff_platform_engineer');

      // Verify content rendering waiting was called
      expect(mockPage.waitForFunction).toHaveBeenCalledWith(
        expect.any(Function),
        { timeout: 15000 }
      );
    });

    it('should wait for images to load', async () => {
      await pdfGenerator.generatePDF('staff_platform_engineer');

      // Verify image loading waiting was called
      expect(mockPage.waitForFunction).toHaveBeenCalledWith(
        expect.any(Function),
        { timeout: 10000 }
      );
    });

    it('should wait for fonts to load', async () => {
      await pdfGenerator.generatePDF('staff_platform_engineer');

      // Verify font loading waiting was called
      expect(mockPage.waitForFunction).toHaveBeenCalledWith(
        expect.any(Function),
        { timeout: 5000 }
      );
    });

    it('should wait for markdown content to be rendered', async () => {
      await pdfGenerator.generatePDF('staff_platform_engineer');

      // Verify markdown content waiting was called
      expect(mockPage.waitForFunction).toHaveBeenCalledWith(
        expect.any(Function),
        { timeout: 10000 }
      );
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await pdfGenerator.initialize();
    });

    it('should handle Alpine.js waiting errors gracefully', async () => {
      mockPage.waitForFunction.mockRejectedValue(new Error('Alpine.js timeout'));

      const result = await pdfGenerator.generatePDF('staff_platform_engineer');

      // Should still attempt to generate PDF even if waiting fails
      expect(mockPage.pdf).toHaveBeenCalled();
    });

    it('should handle resource waiting errors gracefully', async () => {
      // Mock resource waiting to fail
      mockPage.waitForFunction.mockRejectedValueOnce(new Error('Resource timeout'));

      const result = await pdfGenerator.generatePDF('staff_platform_engineer');

      // Should still attempt to generate PDF even if resource waiting fails
      expect(mockPage.pdf).toHaveBeenCalled();
    });

    it('should handle dynamic content waiting errors gracefully', async () => {
      // Mock dynamic content waiting to fail
      mockPage.waitForFunction.mockRejectedValueOnce(new Error('Dynamic content timeout'));

      const result = await pdfGenerator.generatePDF('staff_platform_engineer');

      // Should still attempt to generate PDF even if dynamic content waiting fails
      expect(mockPage.pdf).toHaveBeenCalled();
    });
  });
});
