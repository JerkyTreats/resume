import config from '../../config/development';

describe('Development Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore environment variables
    process.env = originalEnv;
  });

  describe('port configuration', () => {
    it('should use default port when PORT is not set', () => {
      delete process.env.PORT;

      // Re-import config to get fresh instance
      jest.resetModules();
      const freshConfig = require('../../config/development').default;

      expect(freshConfig.port).toBe(3000);
    });

    it('should use PORT environment variable when set', () => {
      process.env.PORT = '8080';

      // Re-import config to get fresh instance
      jest.resetModules();
      const freshConfig = require('../../config/development').default;

      expect(freshConfig.port).toBe(8080);
    });

    it('should handle invalid PORT environment variable', () => {
      process.env.PORT = 'invalid';

      // Re-import config to get fresh instance
      jest.resetModules();
      const freshConfig = require('../../config/development').default;

      expect(freshConfig.port).toBe(NaN);
    });
  });

  describe('CORS configuration', () => {
    it('should have correct CORS settings', () => {
      expect(config.cors).toEqual({
        origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
        credentials: true
      });
    });

    it('should include localhost origins', () => {
      expect(config.cors.origin).toContain('http://localhost:3000');
      expect(config.cors.origin).toContain('http://127.0.0.1:3000');
    });

    it('should have credentials enabled', () => {
      expect(config.cors.credentials).toBe(true);
    });
  });

  describe('Puppeteer configuration', () => {
    it('should have correct Puppeteer settings', () => {
      expect(config.puppeteer).toEqual({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    });

    it('should use headless mode', () => {
      expect(config.puppeteer.headless).toBe(true);
    });

    it('should include required Chrome arguments', () => {
      expect(config.puppeteer.args).toContain('--no-sandbox');
      expect(config.puppeteer.args).toContain('--disable-setuid-sandbox');
    });
  });

  describe('PDF configuration', () => {
    it('should have correct default PDF options', () => {
      expect(config.pdf.defaultOptions).toEqual({
        width: '8.5in',
        height: 'auto',
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
      });
    });

    it('should have standard page dimensions', () => {
      expect(config.pdf.defaultOptions.width).toBe('8.5in');
      expect(config.pdf.defaultOptions.height).toBe('auto');
    });

    it('should have print background enabled', () => {
      expect(config.pdf.defaultOptions.printBackground).toBe(true);
    });

    it('should have standard margins', () => {
      const margin = config.pdf.defaultOptions.margin;
      expect(margin.top).toBe('0.25in');
      expect(margin.right).toBe('0.25in');
      expect(margin.bottom).toBe('0.25in');
      expect(margin.left).toBe('0.25in');
    });

    it('should have correct scale and page settings', () => {
      expect(config.pdf.defaultOptions.scale).toBe(1.0);
      expect(config.pdf.defaultOptions.pageRanges).toBe('1');
      expect(config.pdf.defaultOptions.preferCSSPageSize).toBe(false);
    });
  });

  describe('resume types configuration', () => {
    it('should include all valid resume types', () => {
      expect(config.resumeTypes).toEqual([
        'staff_platform_engineer',
        'eng_mgr',
        'ai_lead'
      ]);
    });

    it('should have exactly 3 resume types', () => {
      expect(config.resumeTypes).toHaveLength(3);
    });

    it('should include staff_platform_engineer type', () => {
      expect(config.resumeTypes).toContain('staff_platform_engineer');
    });

    it('should include eng_mgr type', () => {
      expect(config.resumeTypes).toContain('eng_mgr');
    });

    it('should include ai_lead type', () => {
      expect(config.resumeTypes).toContain('ai_lead');
    });
  });

  describe('swagger configuration', () => {
    it('should have optional swagger configuration', () => {
      // swagger is optional, so it might be undefined
      expect(typeof config.swagger).toBe('undefined');
    });
  });

  describe('type safety', () => {
    it('should have correct TypeScript interface', () => {
      // This test ensures the config object matches the DevelopmentConfig interface
      const configKeys = Object.keys(config);
      expect(configKeys).toContain('port');
      expect(configKeys).toContain('cors');
      expect(configKeys).toContain('puppeteer');
      expect(configKeys).toContain('pdf');
      expect(configKeys).toContain('resumeTypes');
    });

    it('should have port as number', () => {
      expect(typeof config.port).toBe('number');
    });

    it('should have cors as object', () => {
      expect(typeof config.cors).toBe('object');
      expect(config.cors).toHaveProperty('origin');
      expect(config.cors).toHaveProperty('credentials');
    });

    it('should have puppeteer as object', () => {
      expect(typeof config.puppeteer).toBe('object');
      expect(config.puppeteer).toHaveProperty('headless');
      expect(config.puppeteer).toHaveProperty('args');
    });

    it('should have pdf as object', () => {
      expect(typeof config.pdf).toBe('object');
      expect(config.pdf).toHaveProperty('defaultOptions');
    });

    it('should have resumeTypes as array', () => {
      expect(Array.isArray(config.resumeTypes)).toBe(true);
    });
  });
});
