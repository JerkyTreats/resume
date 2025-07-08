import puppeteer, { Browser, Page } from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';
import { PDFOptions, PDFGenerationResult, ResumeType } from '../types';
import config from '../config/development';

export class PDFGenerator {
  private browser: Browser | null = null;

  async initialize(): Promise<void> {
    try {
      this.browser = await puppeteer.launch({
        headless: config.puppeteer.headless as boolean,
        args: config.puppeteer.args
      });
    } catch (error) {
      throw new Error(`Failed to initialize Puppeteer: ${error}`);
    }
  }

  async generatePDF(resumeType: ResumeType, options?: PDFOptions): Promise<PDFGenerationResult> {
    if (!this.browser) {
      await this.initialize();
    }

    if (!this.browser) {
      return {
        success: false,
        error: 'Failed to initialize browser'
      };
    }

    let page: Page | null = null;
    try {
      page = await this.browser.newPage();

      // Set viewport for consistent rendering
      await page.setViewport({ width: 1200, height: 800 });

      // Construct the URL for the resume
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      const resumeUrl = `${baseUrl}/resume.html?type=${resumeType}`;

      // Navigate to the resume page
      await page.goto(resumeUrl, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // Wait for Alpine.js to load and render content
      await page.waitForFunction(() => {
        return (window as any).Alpine && document.querySelector('[x-data]') !== null;
      }, { timeout: 10000 });

      // Wait a bit more for dynamic content to load
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Merge default options with provided options
      const pdfOptions = {
        ...config.pdf.defaultOptions,
        ...options
      };

      // Generate PDF
      const pdfBuffer = await page.pdf(pdfOptions);

      // Create output directory if it doesn't exist
      const outputDir = path.join(process.cwd(), 'generated-pdfs');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${resumeType}-${timestamp}.pdf`;
      const filePath = path.join(outputDir, filename);

      // Write PDF to file
      fs.writeFileSync(filePath, pdfBuffer);

      return {
        success: true,
        filePath
      };

    } catch (error) {
      return {
        success: false,
        error: `PDF generation failed: ${error}`
      };
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.browser) {
        await this.initialize();
      }

      if (!this.browser) {
        return false;
      }

      const page = await this.browser.newPage();
      await page.goto('data:text/html,<html><body>Test</body></html>');
      await page.close();

      return true;
    } catch (error) {
      return false;
    }
  }
}
