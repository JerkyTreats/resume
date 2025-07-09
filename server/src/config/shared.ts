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
}

// Shared PDF configuration with environment variable support
export const getPDFConfig = (): PDFOptions => ({
  width: process.env.PDF_WIDTH || '8.5in',
  height: process.env.PDF_HEIGHT || '100in', // Very large height for pageless effect
  printBackground: process.env.PDF_PRINT_BACKGROUND !== 'false',
  margin: {
    top: process.env.PDF_MARGIN_TOP || '0.25in',
    right: process.env.PDF_MARGIN_RIGHT || '0.25in',
    bottom: process.env.PDF_MARGIN_BOTTOM || '0.25in',
    left: process.env.PDF_MARGIN_LEFT || '0.25in'
  },
  preferCSSPageSize: process.env.PDF_PREFER_CSS_PAGE_SIZE !== 'false', // Let CSS control page size
  pageRanges: process.env.PDF_PAGE_RANGES || '1',
  scale: parseFloat(process.env.PDF_SCALE || '1.0')
});

// Shared Puppeteer configuration
export const getPuppeteerConfig = () => ({
  headless: "new" as const,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

// Shared resume types
export const RESUME_TYPES: ResumeType[] = ['staff_platform_engineer', 'eng_mgr', 'ai_lead'];
