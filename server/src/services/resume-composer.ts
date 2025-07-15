import { ResumeRenderer } from './resume-renderer';
import { ContentWrapper } from './content-wrapper';
import { HTMLGenerator } from './html-generator';
import { RenderedTemplate } from './unified-template-engine';
import { TemplateContext } from './data-manager';
import { AssetManager } from './asset-manager';

export class ResumeComposer {
  private static instance: ResumeComposer;
  private resumeRenderer: ResumeRenderer;
  private contentWrapper: ContentWrapper;
  private htmlGenerator: HTMLGenerator;
  private assetManager: AssetManager;

  static getInstance(): ResumeComposer {
    if (!ResumeComposer.instance) {
      ResumeComposer.instance = new ResumeComposer();
    }
    return ResumeComposer.instance;
  }

  constructor() {
    this.resumeRenderer = ResumeRenderer.getInstance();
    this.contentWrapper = ContentWrapper.getInstance();
    this.htmlGenerator = HTMLGenerator.getInstance();
    this.assetManager = AssetManager.getInstance();
  }

  /**
   * Compose resume for browser viewing (with navigation)
   */
  async composeForBrowser(
    resumeType: string,
    template: string = 'default',
    context: Partial<TemplateContext> = {}
  ): Promise<string> {
    // 1. Render content
    const content = await this.resumeRenderer.renderContent(resumeType, template, context);

    // 2. Get navigation and CSS paths
    const [navComponent, cssPaths] = await Promise.all([
      this.contentWrapper.getNavigationComponent(),
      this.contentWrapper.getTemplateCSSPaths(template)
    ]);

    // 3. Compose HTML
    const composition = {
      title: 'Resume',
      meta: {
        charset: 'UTF-8',
        viewport: 'width=device-width, initial-scale=1.0'
      },
      head: [
        {
          content: `<link rel="preconnect" href="https://fonts.googleapis.com">`
        },
        {
          content: `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`
        },
        {
          content: `<link href="${this.assetManager.getCombinedFontImportUrl()}" rel="stylesheet">`
        },
        {
          content: `<link rel="stylesheet" href="${cssPaths.shared}">`
        },
        {
          content: `<link rel="stylesheet" href="${cssPaths.template}">`
        }
      ],
      body: [
        {
          content: navComponent
        },
        {
          content: content.htmlContent
        }
      ]
    };

    return await this.htmlGenerator.generateHTML(composition);
  }

  /**
   * Compose resume for PDF generation (embedded CSS, no navigation)
   */
  async composeForPDF(
    resumeType: string,
    template: string = 'default',
    context: Partial<TemplateContext> = {}
  ): Promise<string> {
    // 1. Render content with PDF context
    const content = await this.resumeRenderer.renderContent(resumeType, template, {
      ...context,
      forPDF: true
    });

    // 2. Compose HTML with embedded CSS
    const composition = {
      title: 'Resume',
      meta: {
        charset: 'UTF-8',
        viewport: 'width=device-width, initial-scale=1.0'
      },
      style: [
        {
          content: content.css
        }
      ],
      body: [
        {
          content: content.htmlContent
        }
      ]
    };

    return await this.htmlGenerator.generateHTML(composition);
  }

  /**
   * Compose resume for API response (content only)
   */
  async composeForAPI(
    resumeType: string,
    template: string = 'default',
    context: Partial<TemplateContext> = {}
  ): Promise<RenderedTemplate> {
    // Just render content without HTML wrapper
    return await this.resumeRenderer.renderContent(resumeType, template, context);
  }

  /**
   * Get available resume types
   */
  async getAvailableResumeTypes(): Promise<string[]> {
    return await this.resumeRenderer.getAvailableResumeTypes();
  }

  /**
   * Get available templates
   */
  async getAvailableTemplates(): Promise<string[]> {
    return await this.resumeRenderer.getAvailableTemplates();
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.resumeRenderer.clearCache();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): any {
    return this.resumeRenderer.getCacheStats();
  }
}
