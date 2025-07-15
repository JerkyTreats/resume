import puppeteer, { Browser, Page } from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';
import { PDFDocument } from 'pdf-lib';
import { PDFOptions, PDFGenerationResult, ResumeType } from '../types';
import { ResumeComposer } from './resume-composer';
import { PDFConfigManager } from '../config/pdf-config';

export class PDFGenerator {
  private browser: Browser | null = null;
  private performanceMetrics: Map<string, number> = new Map();
  private resumeComposer: ResumeComposer;
  private pdfConfigManager: PDFConfigManager;

  constructor() {
    this.resumeComposer = ResumeComposer.getInstance();
    this.pdfConfigManager = PDFConfigManager.getInstance();
  }

  async initialize(): Promise<void> {
    try {
      // Use centralized configuration
      const puppeteerConfig = this.pdfConfigManager.getPuppeteerConfig();
      const launchOptions: any = {
        headless: puppeteerConfig.headless,
        args: puppeteerConfig.args
      };

      // Add executablePath if set in config
      if (puppeteerConfig.executablePath) {
        launchOptions.executablePath = puppeteerConfig.executablePath;
      }

      this.browser = await puppeteer.launch(launchOptions);
    } catch (error) {
      throw new Error(`Failed to initialize Puppeteer: ${error}`);
    }
  }

  async generatePDF(resumeType: ResumeType, options?: PDFOptions, correlationId?: string): Promise<PDFGenerationResult> {
    const startTime = Date.now();

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

      // No need to block resources since we're using inline CSS and embedded fonts
      // All resources are embedded in the HTML

      // Use centralized rendering configuration
      const renderingConfig = this.pdfConfigManager.getRenderingConfig();
      await page.setViewport(renderingConfig.viewport);
      await page.setUserAgent(renderingConfig.userAgent);

      // Use resume composer for PDF generation
      const completeHTML = await this.resumeComposer.composeForPDF(resumeType, 'default', {
        includeFonts: true,
        includeIcons: true
      });

      // Set content directly instead of navigating to URL
      await page.setContent(completeHTML, {
        waitUntil: 'networkidle0',
        timeout: renderingConfig.waitTimeout
      });

      // Enhanced font loading wait
      await page.waitForFunction(() => {
        return document.fonts && document.fonts.ready;
      }, { timeout: renderingConfig.waitTimeout });

      // Wait for resume content to be fully rendered
      await page.waitForSelector(renderingConfig.waitForSelector, { timeout: renderingConfig.waitTimeout });

            // Measure actual content dimensions
      const contentDimensions = await page.evaluate(() => {
        const resumeContent = document.querySelector('.resume-content');
        if (!resumeContent) {
          throw new Error('Resume content element not found');
        }

        const rect = resumeContent.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(resumeContent);

        // Get the actual content dimensions including padding and borders
        const width = rect.width +
          parseFloat(computedStyle.paddingLeft) +
          parseFloat(computedStyle.paddingRight) +
          parseFloat(computedStyle.borderLeftWidth) +
          parseFloat(computedStyle.borderRightWidth);

        const height = rect.height +
          parseFloat(computedStyle.paddingTop) +
          parseFloat(computedStyle.paddingBottom) +
          parseFloat(computedStyle.borderTopWidth) +
          parseFloat(computedStyle.borderBottomWidth);

        // Validate dimensions
        if (width <= 0 || height <= 0) {
          throw new Error(`Invalid content dimensions: ${width}x${height}px`);
        }

        return { width: Math.ceil(width), height: Math.ceil(height) };
      });

      console.log(`Measured content dimensions: ${contentDimensions.width}x${contentDimensions.height}px`);

      // Merge default options with provided options using centralized config
      const pdfOptions = this.pdfConfigManager.mergeOptions(options);

      // Override PDF dimensions with measured content dimensions
      pdfOptions.width = `${contentDimensions.width}px`;
      pdfOptions.height = `${contentDimensions.height}px`;

      // Generate PDF with enhanced settings
      const pdfBuffer = await page.pdf(pdfOptions);

      // Optimize PDF file size
      const optimizedBuffer = await this.optimizePDF(Buffer.from(pdfBuffer));

      // Create output directory if it doesn't exist
      const outputDir = path.join(process.cwd(), 'generated-pdfs');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${resumeType}-${timestamp}.pdf`;
      const filePath = path.join(outputDir, filename);

      // Write optimized PDF to file
      fs.writeFileSync(filePath, optimizedBuffer);

      // Record performance metrics
      const generationTime = Date.now() - startTime;
      this.performanceMetrics.set(resumeType, generationTime);

      return {
        success: true,
        filePath,
        generationTime
      };

    } catch (error) {
      const generationTime = Date.now() - startTime;
      return {
        success: false,
        error: `PDF generation failed: ${error}`,
        generationTime
      };
    } finally {
      if (page) {
        await page.close();
      }
    }
  }





  private async optimizePDF(buffer: Buffer): Promise<Buffer> {
    try {
      const originalSize = buffer.length;

      // Load the PDF document
      const pdfDoc = await PDFDocument.load(buffer);

      // Get optimization options
      const optimizationOptions = this.getOptimizationOptions();

      // Optimize the PDF with compression settings
      const optimizedBytes = await pdfDoc.save(optimizationOptions);
      const optimizedBuffer = Buffer.from(optimizedBytes);
      const optimizedSize = optimizedBuffer.length;

      // Calculate compression ratio
      const compressionRatio = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);

      console.log(`PDF optimization: ${originalSize} bytes → ${optimizedSize} bytes (${compressionRatio}% reduction)`);

      return optimizedBuffer;
    } catch (error) {
      console.warn(`PDF optimization failed, returning original buffer: ${error}`);
      // Fallback to original buffer if optimization fails
      return buffer;
    }
  }

  private getOptimizationOptions() {
    // Use centralized optimization configuration
    return this.pdfConfigManager.getOptimizationOptions();
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

  getPerformanceMetrics(): Map<string, number> {
    return new Map(this.performanceMetrics);
  }

  clearPerformanceMetrics(): void {
    this.performanceMetrics.clear();
  }
}
