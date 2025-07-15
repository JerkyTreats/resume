import { ResumeComposer } from './resume-composer';
import { TemplateContext } from './data-manager';

export interface RenderedTemplate {
  html: string;           // Complete HTML document (existing)
  htmlContent: string;    // Pure content without HTML wrapper (new)
  css: string;
  data: any;
  metadata: {
    template: string;
    resumeType: string;
    renderTime: number;
    context: TemplateContext;
  };
}

export class UnifiedTemplateEngine {
  private static instance: UnifiedTemplateEngine;
  private resumeComposer: ResumeComposer;

  static getInstance(): UnifiedTemplateEngine {
    if (!UnifiedTemplateEngine.instance) {
      UnifiedTemplateEngine.instance = new UnifiedTemplateEngine();
    }
    return UnifiedTemplateEngine.instance;
  }

  constructor() {
    this.resumeComposer = ResumeComposer.getInstance();
  }

  /**
   * Render pure content without HTML wrapper (for component system)
   */
  async renderContent(
    resumeType: string,
    templateFlavor: string = 'default',
    context: Partial<TemplateContext> = {}
  ): Promise<RenderedTemplate> {
    return await this.resumeComposer.composeForAPI(resumeType, templateFlavor, context);
  }

  /**
   * Main method to render a complete resume
   */
  async renderResume(
    resumeType: string,
    templateFlavor: string = 'default',
    context: Partial<TemplateContext> = {}
  ): Promise<RenderedTemplate> {
    return await this.resumeComposer.composeForAPI(resumeType, templateFlavor, context);
  }

  /**
   * Get available resume types
   */
  async getAvailableResumeTypes(): Promise<string[]> {
    return await this.resumeComposer.getAvailableResumeTypes();
  }

  /**
   * Get available templates
   */
  async getAvailableTemplates(): Promise<string[]> {
    return await this.resumeComposer.getAvailableTemplates();
  }

  /**
   * Clear template cache
   */
  clearCache(): void {
    this.resumeComposer.clearCache();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { templateCacheStats: any; assetProcessorCacheStats: any; cssCacheStats: any } {
    return this.resumeComposer.getCacheStats();
  }
}
