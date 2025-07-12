import { PDFOptions } from '../types';

export interface PDFConfig {
  options: PDFOptions;
  puppeteer: PuppeteerConfig;
  optimization: OptimizationConfig;
  rendering: RenderingConfig;
}

export interface PuppeteerConfig {
  headless: boolean | "new";
  args: string[];
  executablePath?: string | undefined;
  timeout: number;
}

export interface OptimizationConfig {
  enabled: boolean;
  level: 'minimal' | 'balanced' | 'aggressive';
  compression: boolean;
  objectStreams: boolean;
  updateFieldAppearances: boolean;
}

export interface RenderingConfig {
  viewport: {
    width: number;
    height: number;
    deviceScaleFactor: number;
    isMobile: boolean;
    hasTouch: boolean;
    isLandscape: boolean;
  };
  userAgent: string;
  waitForSelector: string;
  waitForFunction: string;
  waitTimeout: number;
}

export class PDFConfigManager {
  private static instance: PDFConfigManager;
  private config: PDFConfig;

  static getInstance(): PDFConfigManager {
    if (!PDFConfigManager.instance) {
      PDFConfigManager.instance = new PDFConfigManager();
    }
    return PDFConfigManager.instance;
  }

  constructor() {
    this.config = this.loadConfig();
  }

  getConfig(): PDFConfig {
    return this.config;
  }

  getOptions(): PDFOptions {
    return this.config.options;
  }

  getPuppeteerConfig(): PuppeteerConfig {
    return this.config.puppeteer;
  }

  getOptimizationConfig(): OptimizationConfig {
    return this.config.optimization;
  }

  getRenderingConfig(): RenderingConfig {
    return this.config.rendering;
  }

  private loadConfig(): PDFConfig {
    return {
      options: this.loadPDFOptions(),
      puppeteer: this.loadPuppeteerConfig(),
      optimization: this.loadOptimizationConfig(),
      rendering: this.loadRenderingConfig()
    };
  }

  private loadPDFOptions(): PDFOptions {
    return {
      // Page dimensions - optimized for resume layout
      width: process.env.PDF_WIDTH || '20in',
      height: process.env.PDF_HEIGHT || '100in', // DO NOT CHANGE THIS

      // Quality settings
      printBackground: process.env.PDF_PRINT_BACKGROUND !== 'false',
      scale: parseFloat(process.env.PDF_SCALE || '1.0'),

      // Margins - DO NOT CHANGE THIS
      margin: {
        top: process.env.PDF_MARGIN_TOP || '0in',
        right: process.env.PDF_MARGIN_RIGHT || '0in',
        bottom: process.env.PDF_MARGIN_BOTTOM || '0in',
        left: process.env.PDF_MARGIN_LEFT || '0in'
      },

      // Page control settings
      preferCSSPageSize: process.env.PDF_PREFER_CSS_PAGE_SIZE === 'true',
      pageRanges: process.env.PDF_PAGE_RANGES || '1',

      // Additional quality settings
      displayHeaderFooter: false, // No headers/footers for clean resume
      omitBackground: false // Include backgrounds for proper styling
    };
  }

  private loadPuppeteerConfig(): PuppeteerConfig {
    return {
      headless: "new" as const,
      args: [
        // Security and compatibility
        '--no-sandbox',
        '--disable-setuid-sandbox',

        // Font rendering optimizations for PDF generation
        '--enable-font-antialiasing',
        '--font-render-hinting=none',
        '--disable-font-subpixel-positioning',
        '--enable-features=FontSrcLocalMatching',
        '--enable-blink-features=CSSFontMetrics',

        // PDF-specific optimizations
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=VizDisplayCompositor',
        '--disable-field-trial-config',
        '--disable-ipc-flooding-protection',

        // Memory and performance optimizations
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--disable-extensions',
        '--disable-web-security',

        // Additional PDF optimizations
        '--disable-plugins',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--mute-audio',
        '--no-default-browser-check',
        '--no-pings',
        '--disable-background-networking',
        '--disable-component-extensions-with-background-pages'
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      timeout: parseInt(process.env.PUPPETEER_TIMEOUT || '30000')
    };
  }

  private loadOptimizationConfig(): OptimizationConfig {
    const level = (process.env.PDF_OPTIMIZATION_LEVEL || 'balanced') as 'minimal' | 'balanced' | 'aggressive';

    return {
      enabled: process.env.PDF_OPTIMIZATION_ENABLED !== 'false',
      level,
      compression: process.env.PDF_COMPRESSION_ENABLED !== 'false',
      objectStreams: true,
      updateFieldAppearances: false // Skip field updates (not needed for resumes)
    };
  }

  private loadRenderingConfig(): RenderingConfig {
    return {
      viewport: {
        width: parseInt(process.env.PDF_VIEWPORT_WIDTH || '1200'),
        height: parseInt(process.env.PDF_VIEWPORT_HEIGHT || '800'),
        deviceScaleFactor: parseFloat(process.env.PDF_DEVICE_SCALE_FACTOR || '2'),
        isMobile: false,
        hasTouch: false,
        isLandscape: false
      },
      userAgent: process.env.PDF_USER_AGENT || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      waitForSelector: process.env.PDF_WAIT_FOR_SELECTOR || '.resume-content',
      waitForFunction: process.env.PDF_WAIT_FOR_FUNCTION || 'document.fonts.ready',
      waitTimeout: parseInt(process.env.PDF_WAIT_TIMEOUT || '10000')
    };
  }

  // Method to get optimization options for pdf-lib
  getOptimizationOptions() {
    const optimization = this.config.optimization;

    if (!optimization.enabled) {
      return {};
    }

    const baseOptions = {
      useObjectStreams: optimization.objectStreams,
      addDefaultPage: false,
      objectsPerTick: 50,
      updateFieldAppearances: optimization.updateFieldAppearances
    };

    switch (optimization.level) {
      case 'aggressive':
        return {
          ...baseOptions,
          objectsPerTick: 25
        };
      case 'minimal':
        return {
          ...baseOptions,
          objectsPerTick: 100
        };
      case 'balanced':
      default:
        return baseOptions;
    }
  }

  // Method to merge with custom options
  mergeOptions(customOptions?: Partial<PDFOptions>): PDFOptions {
    return {
      ...this.config.options,
      ...customOptions
    };
  }

  // Method to validate configuration
  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const options = this.config.options;

    // Validate scale
    if (options.scale && (options.scale < 0.1 || options.scale > 3.0)) {
      errors.push('PDF scale must be between 0.1 and 3.0');
    }

    // Validate margins
    if (options.margin) {
      const marginValues = [options.margin.top, options.margin.right, options.margin.bottom, options.margin.left];
      for (const margin of marginValues) {
        if (margin && (margin.includes('..') || margin.includes('//'))) {
          errors.push('Invalid margin value detected');
          break;
        }
      }
    }

    // Validate dimensions
    if (!options.width || !options.height) {
      errors.push('PDF width and height must be specified');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
