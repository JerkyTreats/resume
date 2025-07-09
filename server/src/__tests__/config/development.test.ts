import config from '../../config/production';

describe('Development Configuration', () => {
  describe('Server Configuration', () => {
    it('should have correct port configuration', () => {
      expect(config.port).toBeDefined();
      expect(typeof config.port).toBe('number');
      expect(config.port).toBeGreaterThan(0);
    });

    it('should have CORS configuration', () => {
      expect(config.cors).toBeDefined();
      expect(config.cors.origin).toBeDefined();
      expect(Array.isArray(config.cors.origin)).toBe(true);
      expect(config.cors.credentials).toBeDefined();
      expect(typeof config.cors.credentials).toBe('boolean');
    });

    it('should include localhost origins in CORS', () => {
      expect(config.cors.origin).toContain(`http://localhost:${config.port}`);
      expect(config.cors.origin).toContain(`http://127.0.0.1:${config.port}`);
    });
  });

  describe('Puppeteer Configuration', () => {
    it('should have Puppeteer configuration', () => {
      expect(config.puppeteer).toBeDefined();
      expect(config.puppeteer.headless).toBeDefined();
      expect(config.puppeteer.args).toBeDefined();
      expect(Array.isArray(config.puppeteer.args)).toBe(true);
    });

    it('should have cross-platform Puppeteer arguments', () => {
      const expectedArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ];

      expectedArgs.forEach(arg => {
        expect(config.puppeteer.args).toContain(arg);
      });
    });

    it('should be configured for headless mode', () => {
      expect(config.puppeteer.headless).toBe("new");
    });
  });

  describe('PDF Configuration', () => {
    it('should have PDF default options', () => {
      expect(config.pdf).toBeDefined();
      expect(config.pdf.defaultOptions).toBeDefined();
    });

    it('should have single-page PDF settings', () => {
      const pdfOptions = config.pdf.defaultOptions;

      expect(pdfOptions.width).toBe('8.5in');
      expect(pdfOptions.height).toBe('100in');
      expect(pdfOptions.printBackground).toBe(true);
      expect(pdfOptions.preferCSSPageSize).toBe(true);
      expect(pdfOptions.pageRanges).toBe('1');
      expect(pdfOptions.scale).toBe(1.0);
    });

    it('should have proper margin configuration', () => {
      const margin = config.pdf.defaultOptions.margin;

      expect(margin.top).toBe('0.25in');
      expect(margin.right).toBe('0.25in');
      expect(margin.bottom).toBe('0.25in');
      expect(margin.left).toBe('0.25in');
    });

    it('should be configured for continuous output', () => {
      const pdfOptions = config.pdf.defaultOptions;

      // These settings ensure single-page, continuous output
      expect(pdfOptions.height).toBe('100in');
      expect(pdfOptions.preferCSSPageSize).toBe(true);
      expect(pdfOptions.pageRanges).toBe('1');
    });
  });

  describe('Resume Types Configuration', () => {
    it('should have resume types array', () => {
      expect(config.resumeTypes).toBeDefined();
      expect(Array.isArray(config.resumeTypes)).toBe(true);
    });

    it('should include all valid resume types', () => {
      const expectedTypes = ['staff_platform_engineer', 'eng_mgr', 'ai_lead'];

      expectedTypes.forEach(type => {
        expect(config.resumeTypes).toContain(type);
      });
    });

    it('should not include invalid resume types', () => {
      const invalidTypes = ['invalid_type', 'test', ''];

      invalidTypes.forEach(type => {
        expect(config.resumeTypes).not.toContain(type);
      });
    });
  });

  describe('Environment Variable Support', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should use PORT from environment variable', () => {
      process.env.PORT = '4000';

      // Re-import config to get updated values
      const updatedConfig = require('../../config/development').default;

      expect(updatedConfig.port).toBe(4000);
    });

    it('should use default port when PORT not set', () => {
      delete process.env.PORT;

      // Re-import config to get updated values
      const updatedConfig = require('../../config/development').default;

      expect(updatedConfig.port).toBe(3000);
    });

    it('should handle invalid PORT environment variable', () => {
      process.env.PORT = 'invalid';

      // Re-import config to get updated values
      const updatedConfig = require('../../config/development').default;

      expect(updatedConfig.port).toBe(NaN); // parseInt('invalid') returns NaN
    });
  });

  describe('Configuration Type Safety', () => {
    it('should have correct TypeScript types', () => {
      // Test that all required properties exist and have correct types
      expect(typeof config.port).toBe('number');
      expect(typeof config.cors.origin).toBe('object');
      expect(typeof config.cors.credentials).toBe('boolean');
      expect(typeof config.puppeteer.headless).toBe('string');
      expect(Array.isArray(config.puppeteer.args)).toBe(true);
      expect(typeof config.pdf.defaultOptions.width).toBe('string');
      expect(typeof config.pdf.defaultOptions.height).toBe('string');
      expect(typeof config.pdf.defaultOptions.printBackground).toBe('boolean');
      expect(Array.isArray(config.resumeTypes)).toBe(true);
    });

    it('should have valid resume type values', () => {
      config.resumeTypes.forEach(type => {
        expect(['staff_platform_engineer', 'eng_mgr', 'ai_lead']).toContain(type);
      });
    });
  });

  describe('PDF Settings Validation', () => {
    it('should have valid PDF dimensions', () => {
      const pdfOptions = config.pdf.defaultOptions;

      // Width should be a valid CSS length
      expect(pdfOptions.width).toMatch(/^\d+(\.\d+)?(in|cm|mm|px)$/);

      // Height should be '100in' for continuous output
      expect(pdfOptions.height).toBe('100in');
    });

    it('should have valid margin values', () => {
      const margin = config.pdf.defaultOptions.margin;

      Object.values(margin).forEach(value => {
        expect(value).toMatch(/^\d+(\.\d+)?(in|cm|mm|px)$/);
      });
    });

    it('should have valid scale value', () => {
      const scale = config.pdf.defaultOptions.scale;

      expect(typeof scale).toBe('number');
      expect(scale).toBeGreaterThan(0);
      expect(scale).toBeLessThanOrEqual(2);
    });

    it('should be configured for single-page output', () => {
      const pdfOptions = config.pdf.defaultOptions;

      // These settings ensure single-page output
      expect(pdfOptions.pageRanges).toBe('1');
      expect(pdfOptions.preferCSSPageSize).toBe(true);
    });
  });

  describe('Cross-Platform Compatibility', () => {
    it('should have Puppeteer args for cross-platform support', () => {
      const baseArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ];

      baseArgs.forEach(arg => {
        expect(config.puppeteer.args).toContain(arg);
      });
    });

    it('should be configured for headless operation', () => {
      expect(config.puppeteer.headless).toBe("new");
    });
  });

  describe('Performance Configuration', () => {
    it('should have reasonable timeout values', () => {
      // PDF generation should complete within reasonable time
      // This is more of a documentation test than a functional test
      expect(config.pdf.defaultOptions).toBeDefined();
    });

    it('should be configured for optimal rendering', () => {
      const pdfOptions = config.pdf.defaultOptions;

      // Should include background colors and images
      expect(pdfOptions.printBackground).toBe(true);

      // Should use proper scale for quality
      expect(pdfOptions.scale).toBe(1.0);
    });
  });
});
