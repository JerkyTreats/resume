import { ResumeType } from '../types';
import { getPDFConfig, getPuppeteerConfig, RESUME_TYPES, Config, getLoggingConfig } from './shared';

const port = parseInt(process.env.PORT || '3000');

const config: Config = {
  port,
  cors: {
    origin: [
      `http://localhost:${port}`,
      `http://127.0.0.1:${port}`
    ],
    credentials: true
  },
  puppeteer: getPuppeteerConfig(),
  pdf: {
    defaultOptions: getPDFConfig()
  },
  resumeTypes: RESUME_TYPES,
  logging: getLoggingConfig('development')
};

export default config;
