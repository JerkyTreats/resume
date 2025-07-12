import Handlebars from 'handlebars';
import { marked } from 'marked';
import * as path from 'path';
import * as fs from 'fs';
import { AssetManager } from './asset-manager';

export interface ServerRenderedResume {
  html: string;                    // Fully rendered HTML
  css: string;                     // Inline CSS for PDF
  data: any;                       // Original data for debugging
  metadata: RenderMetadata;        // Render timing and info
}

export interface RenderMetadata {
  template: string;
  resumeType: string;
  renderTime: number;
}

export interface ResumeData {
  header: any;
  styling: any;
  sidebar: any;
  main: any;
}

export class HandlebarsTemplateEngine {
  private compiledTemplates: Map<string, HandlebarsTemplateDelegate> = new Map();
  private assetManager: AssetManager;

  constructor() {
    this.assetManager = AssetManager.getInstance();
    this.configureMarked();
    this.registerHelpers();
  }

  private configureMarked() {
    // Configure marked.js for proper markdown rendering
    marked.setOptions({
      breaks: true,  // Convert \n to <br>
      gfm: true      // GitHub Flavored Markdown
    });
  }

    private registerHelpers() {
    // Markdown rendering helper
    Handlebars.registerHelper('markdown', function(content: string) {
      if (!content) return '';
      return new Handlebars.SafeString(marked.parse(content) as string);
    });

    // Conditional rendering helper for checking if property exists and has content
    Handlebars.registerHelper('ifHas', function(this: any, property: string, options: any) {
      const value = this[property];
      const hasContent = value &&
        (Array.isArray(value) ? value.length > 0 :
         typeof value === 'string' ? value.trim() !== '' :
         value !== null && value !== undefined);

      return hasContent ? options.fn(this) : options.inverse(this);
    });

    // Date formatting helper
    Handlebars.registerHelper('formatDate', function(date: string) {
      if (!date) return '';
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short'
      });
    });

    // Array length helper
    Handlebars.registerHelper('length', function(array: any[]) {
      return Array.isArray(array) ? array.length : 0;
    });

    // Safe string helper for HTML content
    Handlebars.registerHelper('safe', function(content: string) {
      return new Handlebars.SafeString(content || '');
    });

    // Conditional helper for first item in loop
    Handlebars.registerHelper('ifFirst', function(this: any, index: number, options: any) {
      return index === 0 ? options.fn(this) : options.inverse(this);
    });

    // String startsWith helper
    Handlebars.registerHelper('startsWith', function(str: string, prefix: string) {
      return str && str.startsWith(prefix);
    });

            // Icon helper using asset manager
    Handlebars.registerHelper('icon', async function(this: any, iconType: string) {
      const iconHTML = await this.assetManager.getIconHTML(iconType);
      return new Handlebars.SafeString(iconHTML);
    });
  }

  async renderTemplate(templateName: string, data: ResumeData): Promise<string> {
    const compiledTemplate = await this.getCompiledTemplate(templateName);
    return compiledTemplate(data);
  }

  private async getCompiledTemplate(templateName: string): Promise<HandlebarsTemplateDelegate> {
    if (this.compiledTemplates.has(templateName)) {
      return this.compiledTemplates.get(templateName)!;
    }

    const templatePath = path.join(process.cwd(), 'resumes', `${templateName}.html`);

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }

    const template = await fs.promises.readFile(templatePath, 'utf-8');
    const compiledTemplate = Handlebars.compile(template);

    this.compiledTemplates.set(templateName, compiledTemplate);
    return compiledTemplate;
  }

  // CSS handling is now centralized in CSSManager
  // This method is kept for backward compatibility but delegates to CSSManager
  async getTemplateCSS(templateName: string): Promise<string> {
    const { CSSManager } = await import('./css-manager');
    const cssManager = CSSManager.getInstance();
    return await cssManager.getCompleteCSS({
      forPDF: false,
      template: templateName,
      includeFonts: true,
      includeIcons: true
    });
  }

  clearCache(): void {
    this.compiledTemplates.clear();
  }
}
