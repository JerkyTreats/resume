import * as path from 'path';
import * as fs from 'fs';
import { RenderedTemplate } from './unified-template-engine';
import { TemplateConfigManager } from './template-config-manager';

export interface HTMLSection {
  content: string;
}

export interface HTMLComposition {
  head?: HTMLSection[];
  style?: HTMLSection[];
  body?: HTMLSection[];
  title?: string;
  meta?: {
    charset?: string;
    viewport?: string;
  };
}

export class HTMLGenerator {
  private static instance: HTMLGenerator;
  private templateConfigManager: TemplateConfigManager;

  static getInstance(): HTMLGenerator {
    if (!HTMLGenerator.instance) {
      HTMLGenerator.instance = new HTMLGenerator();
    }
    return HTMLGenerator.instance;
  }

  constructor() {
    this.templateConfigManager = TemplateConfigManager.getInstance();
  }

  /**
   * Generate HTML document from composition objects
   * Injects sections in the order they appear in the arrays
   */
  async generateHTML(composition: HTMLComposition): Promise<string> {
    const headSections = composition.head || [];
    const styleSections = composition.style || [];
    const bodySections = composition.body || [];

    const headContent = headSections.map(section => section.content).join('\n  ');
    const styleContent = styleSections.map(section => section.content).join('\n  ');
    const bodyContent = bodySections.map(section => section.content).join('\n  ');

    const title = composition.title || 'Resume';
    const charset = composition.meta?.charset || 'UTF-8';
    const viewport = composition.meta?.viewport || 'width=device-width, initial-scale=1.0';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="${charset}">
  <meta name="viewport" content="${viewport}">
  <title>${title}</title>
  ${headContent}
  ${styleContent ? `<style>\n    ${styleContent}\n  </style>` : ''}
</head>
<body>
  ${bodyContent}
</body>
</html>`;
  }

  /**
   * Load navigation component for browser rendering
   */
  async loadNavigationComponent(): Promise<string> {
    const navPath = path.join(process.cwd(), 'components', 'navigation', 'nav.html');

    console.log(`Loading navigation from: ${navPath}`);

    if (!fs.existsSync(navPath)) {
      // Return empty string if navigation component doesn't exist yet
      // This allows the system to work before navigation is implemented
      console.warn(`Navigation component not found at: ${navPath}`);
      return '';
    }

    const navContent = await fs.promises.readFile(navPath, 'utf-8');
    console.log(`Navigation content loaded, length: ${navContent.length}`);
    return navContent;
  }

  /**
   * Get CSS paths for a template
   */
  async getTemplateCSSPaths(templateName: string): Promise<{ shared: string; template: string }> {
    return await this.templateConfigManager.getTemplateCSSPaths(templateName);
  }
}
