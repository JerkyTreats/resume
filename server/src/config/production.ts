import { ResumeType } from '../types';

export interface ProductionConfig {
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
    defaultOptions: {
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
      pageRanges: string;
      scale: number;
    };
  };
  resumeTypes: ResumeType[];
}

const port = parseInt(process.env.PORT || '3000');

const config: ProductionConfig = {
  port,
  cors: {
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [],
    credentials: true
  },
  puppeteer: {
    headless: "new" as const,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--single-process'
    ]
  },
  pdf: {
    defaultOptions: {
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
    }
  },
  resumeTypes: ['staff_platform_engineer', 'eng_mgr', 'ai_lead']
};

export default config;
