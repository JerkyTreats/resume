import { ResumeType } from '../types';

export interface DevelopmentConfig {
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
  swagger?: any;
}

const port = parseInt(process.env.PORT || '3000');

const config: DevelopmentConfig = {
  port,
  cors: {
    origin: [
      `http://localhost:${port}`,
      `http://127.0.0.1:${port}`
    ],
    credentials: true
  },
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
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
