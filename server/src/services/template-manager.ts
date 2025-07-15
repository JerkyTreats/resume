import Handlebars from 'handlebars';
import { marked } from 'marked';
import * as path from 'path';
import * as fs from 'fs';
import { TemplateConfigManager } from './template-config-manager';
import { AssetProcessor } from './asset-processor';

export interface TemplateContext {
  forPDF: boolean;
  template: string;
  includeFonts: boolean;
  includeIcons: boolean;
}

export class TemplateManager {
  private static instance: TemplateManager;
  private compiledTemplates: Map<string, HandlebarsTemplateDelegate> = new Map();
  private componentTemplates: Map<string, string> = new Map();
  private templateConfigManager: TemplateConfigManager;
  private assetProcessor: AssetProcessor;
  private helpersRegistered: boolean = false;

  static getInstance(): TemplateManager {
    if (!TemplateManager.instance) {
      TemplateManager.instance = new TemplateManager();
    }
    return TemplateManager.instance;
  }

  constructor() {
    this.templateConfigManager = TemplateConfigManager.getInstance();
    this.assetProcessor = AssetProcessor.getInstance();
    this.configureMarked();
    this.registerHelpers();
  }

  /**
   * Get compiled template for a template name
   */
  async getCompiledTemplate(templateName: string): Promise<HandlebarsTemplateDelegate> {
    if (this.compiledTemplates.has(templateName)) {
      return this.compiledTemplates.get(templateName)!;
    }

    // First try component-based template (directory with layout.html)
    const componentTemplatePath = path.join(process.cwd(), 'resumes', templateName, 'layout.html');

    if (fs.existsSync(componentTemplatePath)) {
      // Pre-load all components for this template
      await this.preloadComponents(templateName);

      const template = await fs.promises.readFile(componentTemplatePath, 'utf-8');
      const compiledTemplate = Handlebars.compile(template);

      this.compiledTemplates.set(templateName, compiledTemplate);
      return compiledTemplate;
    }

    // Fallback to legacy monolithic template
    const legacyTemplatePath = path.join(process.cwd(), 'resumes', `${templateName}.html`);

    if (!fs.existsSync(legacyTemplatePath)) {
      throw new Error(`Template not found: ${templateName} (checked ${componentTemplatePath} and ${legacyTemplatePath})`);
    }

    const template = await fs.promises.readFile(legacyTemplatePath, 'utf-8');
    const compiledTemplate = Handlebars.compile(template);

    this.compiledTemplates.set(templateName, compiledTemplate);
    return compiledTemplate;
  }

  /**
   * Compile template content into Handlebars template
   */
  compileTemplate(templateContent: string): HandlebarsTemplateDelegate {
    return Handlebars.compile(templateContent);
  }

  /**
   * Load component template for a specific template
   */
  async loadComponentTemplate(componentName: string, templateName: string = 'default'): Promise<string> {
    // Load template-specific component
    const templateSpecificPath = path.join(process.cwd(), 'resumes', templateName, `${componentName}.html`);
    if (!fs.existsSync(templateSpecificPath)) {
      throw new Error(`Component not found: ${componentName} for template: ${templateName} at path: ${templateSpecificPath}`);
    }

    return await fs.promises.readFile(templateSpecificPath, 'utf-8');
  }

  /**
   * Get component template from cache
   */
  getComponentTemplate(componentKey: string): string | undefined {
    return this.componentTemplates.get(componentKey);
  }

  /**
   * Preload all components for a template
   */
  async preloadComponents(templateName: string): Promise<void> {
    const componentsDir = path.join(process.cwd(), 'resumes', templateName);

    if (!fs.existsSync(componentsDir)) {
      return;
    }

    const files = await fs.promises.readdir(componentsDir);
    const componentFiles = files.filter(file => file.endsWith('.html') && file !== 'layout.html');

    for (const componentFile of componentFiles) {
      const componentName = path.basename(componentFile, '.html');
      const componentKey = `${templateName}:${componentName}`;

      if (!this.componentTemplates.has(componentKey)) {
        const componentPath = path.join(componentsDir, componentFile);
        const componentContent = await fs.promises.readFile(componentPath, 'utf-8');
        this.componentTemplates.set(componentKey, componentContent);
      }
    }
  }

  /**
   * Get available templates
   */
  async getAvailableTemplates(): Promise<string[]> {
    return await this.templateConfigManager.getAvailableTemplates();
  }

  /**
   * Configure marked.js for markdown processing
   */
  private configureMarked(): void {
    marked.setOptions({
      breaks: true,
      gfm: true
    });
  }

  /**
   * Register Handlebars helpers
   */
  private registerHelpers(): void {
    if (this.helpersRegistered) {
      return;
    }

    // Markdown rendering helper
    Handlebars.registerHelper('markdown', function(content: string) {
      if (!content) return '';
      return new Handlebars.SafeString(marked.parse(content) as string);
    });

    // Icon helper - synchronous version with preloaded icons
    Handlebars.registerHelper('icon', (iconType: string) => {
      return new Handlebars.SafeString(this.assetProcessor.getIconHTMLSync(iconType));
    });

    // Other existing helpers...
    Handlebars.registerHelper('ifHas', function(this: any, property: string, options: any) {
      const value = this[property];
      const hasContent = value &&
        (Array.isArray(value) ? value.length > 0 :
         typeof value === 'string' ? value.trim() !== '' :
         value !== null && value !== undefined);

      return hasContent ? options.fn(this) : options.inverse(this);
    });

    Handlebars.registerHelper('formatDate', function(date: string) {
      if (!date) return '';
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short'
      });
    });

    Handlebars.registerHelper('length', function(array: any[]) {
      return Array.isArray(array) ? array.length : 0;
    });

    Handlebars.registerHelper('safe', function(content: string) {
      return new Handlebars.SafeString(content || '');
    });

    Handlebars.registerHelper('ifFirst', function(this: any, index: number, options: any) {
      return index === 0 ? options.fn(this) : options.inverse(this);
    });

    Handlebars.registerHelper('startsWith', function(str: string, prefix: string) {
      return str && str.startsWith(prefix);
    });

    // Component injection helper (synchronous)
    Handlebars.registerHelper('component', function(this: any, componentName: string, options: any) {
      const templateName = this.template || 'default';
      const componentKey = `${templateName}:${componentName}`;

      try {
        const templateManager = TemplateManager.getInstance();
        const componentTemplate = templateManager.getComponentTemplate(componentKey);

        if (!componentTemplate) {
          throw new Error(`Component template not found: ${componentKey}`);
        }

        const compiledComponent = Handlebars.compile(componentTemplate);
        return new Handlebars.SafeString(compiledComponent(this));
      } catch (error: any) {
        throw new Error(`Failed to render component '${componentName}' for template '${templateName}': ${error.message}`);
      }
    });

    this.helpersRegistered = true;
  }



  /**
   * Clear template cache
   */
  clearCache(): void {
    this.compiledTemplates.clear();
    this.componentTemplates.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { templateCacheSize: number; componentCacheSize: number } {
    return {
      templateCacheSize: this.compiledTemplates.size,
      componentCacheSize: this.componentTemplates.size
    };
  }
}
