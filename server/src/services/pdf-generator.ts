import puppeteer, { Browser, Page } from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';
import { PDFOptions, PDFGenerationResult, ResumeType } from '../types';
import config from '../config/production';

export class PDFGenerator {
  private browser: Browser | null = null;
  private performanceMetrics: Map<string, number> = new Map();

  async initialize(): Promise<void> {
    try {
      // Enhanced cross-platform support with additional args for Docker compatibility
      const launchOptions: any = {
        headless: config.puppeteer.headless,
        args: [
          ...config.puppeteer.args,
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--disable-extensions',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-field-trial-config',
          '--disable-ipc-flooding-protection'
        ]
      };

      // Add executablePath if environment variable is set
      if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
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

      // Enhanced viewport for better rendering
      await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 2 });

      // Emoji fallback - only remove emojis if they're not rendering properly
      await page.evaluateOnNewDocument(() => {
        // Function to remove emojis from text
        function removeEmojis(text: string): string {
          // Remove emoji characters (Unicode ranges for emojis)
          return text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
        }

        // Function to check if emojis are rendering properly
        function checkEmojiRendering() {
          // Create a test element with emojis
          const testElement = document.createElement('div');
          testElement.style.position = 'absolute';
          testElement.style.left = '-9999px';
          testElement.style.top = '-9999px';
          testElement.textContent = '📧📍🔗💻🌐📞';
          document.body.appendChild(testElement);

          // Check if the emojis render as expected characters
          const renderedText = testElement.textContent;
          const hasBrokenEmojis = renderedText.includes('?') || renderedText.includes('') || renderedText.length !== 6;

          // Clean up test element
          document.body.removeChild(testElement);

          return !hasBrokenEmojis;
        }

        // Function to process all text nodes and remove emojis if needed
        function processEmojisAsFallback() {
          // First check if emojis are rendering properly
          const emojisRenderProperly = checkEmojiRendering();

          if (!emojisRenderProperly) {
            console.log('Emojis not rendering properly, removing them as fallback');

            const walker = document.createTreeWalker(
              document.body,
              NodeFilter.SHOW_TEXT,
              null
            );

            const textNodes: Text[] = [];
            let node;
            while (node = walker.nextNode()) {
              textNodes.push(node as Text);
            }

            textNodes.forEach(textNode => {
              if (textNode.textContent) {
                const cleanedText = removeEmojis(textNode.textContent);
                if (cleanedText !== textNode.textContent) {
                  textNode.textContent = cleanedText;
                }
              }
            });
          } else {
            console.log('Emojis rendering properly, keeping them');
          }
        }

        // Run emoji processing after page loads
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', processEmojisAsFallback);
        } else {
          processEmojisAsFallback();
        }

        // Also run after Alpine.js content loads
        setTimeout(processEmojisAsFallback, 2000);
      });

      // Construct the URL for the resume
      const port = process.env.PORT || config.port || 3000;
      const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
      const resumeUrl = `${baseUrl}/resume.html?type=${resumeType}`;

      // Navigate to the resume page with enhanced waiting
      await page.goto(resumeUrl, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // Enhanced content waiting for Alpine.js dynamic content
      await this.waitForAlpineContent(page);

      // Wait for all images and fonts to load
      await this.waitForResources(page);

      // Ensure all dynamic content is rendered
      await this.waitForDynamicContent(page);

      // Merge default options with provided options
      const pdfOptions = {
        ...config.pdf.defaultOptions,
        ...options
      };

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

  private async waitForAlpineContent(page: Page): Promise<void> {
    try {
      // Wait for Alpine.js to be available
      await page.waitForFunction(() => {
        return (window as any).Alpine !== undefined;
      }, { timeout: 10000 });

      // Wait for Alpine.js to be initialized
      await page.waitForFunction(() => {
        return (window as any).Alpine && (window as any).Alpine.started;
      }, { timeout: 10000 });

      // Wait for Alpine.js data to be loaded
      await page.waitForFunction(() => {
        const alpineElements = document.querySelectorAll('[x-data]');
        return alpineElements.length > 0;
      }, { timeout: 10000 });

      // Wait for specific Alpine.js content to be rendered
      await page.waitForFunction(() => {
        // Check if resume content is loaded (not loading or error state)
        const loadingElements = document.querySelectorAll('[x-show="loading"]');
        const errorElements = document.querySelectorAll('[x-show="error"]');
        const contentElements = document.querySelectorAll('[x-show="!loading && !error"]');

        return loadingElements.length === 0 &&
               errorElements.length === 0 &&
               contentElements.length > 0;
      }, { timeout: 15000 });

      // Additional wait for dynamic content to settle
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
    }
  }

  private async waitForResources(page: Page): Promise<void> {
    try {
      // Wait for all images to load
      await page.waitForFunction(() => {
        const images = document.querySelectorAll('img');
        return Array.from(images).every(img => img.complete);
      }, { timeout: 10000 });

      // Wait for fonts to load
      await page.waitForFunction(() => {
        return document.fonts && document.fonts.ready;
      }, { timeout: 5000 });

    } catch (error) {
    }
  }

  private async waitForDynamicContent(page: Page): Promise<void> {
    try {
      // Wait for markdown content to be rendered
      await page.waitForFunction(() => {
        const markdownElements = document.querySelectorAll('.markdown-content');
        return Array.from(markdownElements).every(el =>
          el.innerHTML && el.innerHTML !== 'Loading...' && el.innerHTML.trim().length > 0
        );
      }, { timeout: 10000 });

      // Wait for any remaining dynamic content
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
    }
  }

  private async optimizePDF(buffer: Buffer): Promise<Buffer> {
    // For now, return the original buffer
    // In a production environment, you might want to use a PDF optimization library
    // like pdf-lib or similar to compress the PDF without quality loss
    return buffer;
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
