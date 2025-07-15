import { DataManager, ResumeData, TemplateContext } from './data-manager';
import { TemplateManager } from './template-manager';
import { AssetProcessor } from './asset-processor';
import { CSSManager } from './css-manager';
import { RenderedTemplate } from './unified-template-engine';

export class ResumeRenderer {
  private static instance: ResumeRenderer;
  private dataManager: DataManager;
  private templateManager: TemplateManager;
  private assetProcessor: AssetProcessor;
  private cssManager: CSSManager;

  static getInstance(): ResumeRenderer {
    if (!ResumeRenderer.instance) {
      ResumeRenderer.instance = new ResumeRenderer();
    }
    return ResumeRenderer.instance;
  }

  constructor() {
    this.dataManager = DataManager.getInstance();
    this.templateManager = TemplateManager.getInstance();
    this.assetProcessor = AssetProcessor.getInstance();
    this.cssManager = CSSManager.getInstance();
  }

  /**
   * Render pure content without HTML wrapper (for component system)
   */
  async renderContent(
    resumeType: string,
    templateFlavor: string = 'default',
    context: Partial<TemplateContext> = {}
  ): Promise<RenderedTemplate> {
    const startTime = Date.now();
    const fullContext: TemplateContext = {
      forPDF: false,
      template: templateFlavor,
      includeFonts: true,
      includeIcons: true,
      ...context
    };

    try {
      // 1. Load all data
      const data = await this.dataManager.loadResumeData(resumeType, fullContext);

      // 2. Process assets for PDF if needed
      if (fullContext.forPDF) {
        await this.assetProcessor.processAssetsForPDF(data);
      }

      // 3. Render template (pure content without HTML wrapper)
      const htmlContent = await this.renderTemplate(templateFlavor, data);

      // 4. Get CSS
      const css = await this.cssManager.getCompleteCSS(fullContext);

      return {
        html: '', // Will be set by composition layer
        htmlContent,
        css,
        data,
        metadata: {
          template: templateFlavor,
          resumeType,
          renderTime: Date.now() - startTime,
          context: fullContext
        }
      };
    } catch (error) {
      throw new Error(`Failed to render resume content: ${error}`);
    }
  }

  /**
   * Render template using Handlebars
   */
  private async renderTemplate(templateName: string, data: ResumeData): Promise<string> {
    const compiledTemplate = await this.templateManager.getCompiledTemplate(templateName);
    return compiledTemplate(data);
  }

  /**
   * Get available resume types
   */
  async getAvailableResumeTypes(): Promise<string[]> {
    return await this.dataManager.getAvailableResumeTypes();
  }

  /**
   * Get available templates
   */
  async getAvailableTemplates(): Promise<string[]> {
    return await this.templateManager.getAvailableTemplates();
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.templateManager.clearCache();
    this.assetProcessor.clearCache();
    this.cssManager.clearCache();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    templateCacheStats: any;
    assetProcessorCacheStats: any;
    cssCacheStats: any
  } {
    return {
      templateCacheStats: this.templateManager.getCacheStats(),
      assetProcessorCacheStats: this.assetProcessor.getCacheStats(),
      cssCacheStats: this.cssManager.getCacheStats()
    };
  }
}
