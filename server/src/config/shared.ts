import { ResumeType } from '../types';

export interface PDFOptions {
  width: string;
  height: string;
  printBackground: boolean;
  margin: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
  preferCSSPageSize: boolean;
  pageRanges?: string;
  scale: number;
  displayHeaderFooter: boolean;
  omitBackground: boolean;
  timeout: number;
  waitForSelector: string;
  waitForFunction: string;
}

export interface LoggingConfig {
  level: string;
  transports: string[];
  format: string;
  file: {
    filename: string;
    maxSize: number;
    maxFiles: number;
  };
  console: {
    colorize: boolean;
    prettyPrint: boolean;
  };
}

export interface Config {
  port: number;
  cors: {
    origin: string[];
    credentials: boolean;
  };
  puppeteer: {
    headless: boolean | "new";
    args: string[];
  };
  pdf: {
    defaultOptions: PDFOptions;
  };
  resumeTypes: ResumeType[];
  swagger?: any;
  logging: LoggingConfig;
}

// PDF configuration is now centralized in PDFConfigManager
// This function is kept for backward compatibility but delegates to the centralized manager
export const getPDFConfig = (): PDFOptions => {
  const { PDFConfigManager } = require('./pdf-config');
  const pdfConfigManager = PDFConfigManager.getInstance();
  return pdfConfigManager.getOptions();
};

// Shared Puppeteer configuration
export const getPuppeteerConfig = () => ({
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
  ]
});

// Shared resume types
export const RESUME_TYPES: ResumeType[] = ['staff_platform_engineer', 'eng_mgr', 'ai_lead'];

// Shared logging configuration
export const getLoggingConfig = (environment: string): LoggingConfig => {
  const baseConfig = {
    format: 'json',
    file: {
      filename: environment === 'production' ? 'logs/application.log' : 'logs/development.log',
      maxSize: environment === 'production' ? 52428800 : 10485760, // 50MB : 10MB
      maxFiles: environment === 'production' ? 10 : 5
    },
    console: {
      colorize: environment === 'development',
      prettyPrint: environment === 'development'
    }
  };

  switch (environment) {
    case 'production':
      return {
        ...baseConfig,
        level: 'info',
        transports: ['file', 'console']
      };
    case 'test':
      return {
        ...baseConfig,
        level: 'error',
        transports: ['console']
      };
    default:
      return {
        ...baseConfig,
        level: 'debug',
        transports: ['console', 'file']
      };
  }
};
