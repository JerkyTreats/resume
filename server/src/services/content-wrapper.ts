import { HTMLGenerator } from './html-generator';
import { RenderedTemplate } from './unified-template-engine';

export interface TemplateContext {
  forPDF: boolean;
  template: string;
  includeFonts: boolean;
  includeIcons: boolean;
  includeNavigation?: boolean;
}

export class ContentWrapper {
  private static instance: ContentWrapper;
  private htmlGenerator: HTMLGenerator;

  static getInstance(): ContentWrapper {
    if (!ContentWrapper.instance) {
      ContentWrapper.instance = new ContentWrapper();
    }
    return ContentWrapper.instance;
  }

  constructor() {
    this.htmlGenerator = HTMLGenerator.getInstance();
  }

  /**
   * Get navigation component for browser rendering
   */
  async getNavigationComponent(): Promise<string> {
    return await this.htmlGenerator.loadNavigationComponent();
  }

  /**
   * Get CSS paths for a template
   */
  async getTemplateCSSPaths(templateName: string): Promise<{ shared: string; template: string }> {
    return await this.htmlGenerator.getTemplateCSSPaths(templateName);
  }
}
