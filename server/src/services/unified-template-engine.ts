import Handlebars from 'handlebars';
import { marked } from 'marked';
import * as path from 'path';
import * as fs from 'fs';
import { CSSManager } from './css-manager';
import { AssetManager } from './asset-manager';
import { CSSConfigManager } from '../config/css-config';

export interface TemplateContext {
  forPDF: boolean;
  template: string;
  includeFonts: boolean;
  includeIcons: boolean;
}

export interface RenderedTemplate {
  html: string;
  css: string;
  data: any;
  metadata: {
    template: string;
    resumeType: string;
    renderTime: number;
    context: TemplateContext;
  };
}

export interface ResumeData {
  header: any;
  styling: any;
  sidebar: any;
  main: any;
}

export class UnifiedTemplateEngine {
  private static instance: UnifiedTemplateEngine;
  private compiledTemplates: Map<string, HandlebarsTemplateDelegate> = new Map();
  private cssManager: CSSManager;
  private assetManager: AssetManager;
  private configManager: CSSConfigManager;

  static getInstance(): UnifiedTemplateEngine {
    if (!UnifiedTemplateEngine.instance) {
      UnifiedTemplateEngine.instance = new UnifiedTemplateEngine();
    }
    return UnifiedTemplateEngine.instance;
  }

  constructor() {
    this.cssManager = CSSManager.getInstance();
    this.assetManager = AssetManager.getInstance();
    this.configManager = CSSConfigManager.getInstance();
    this.configureMarked();
    this.registerHelpers();
  }

  /**
   * Main method to render a complete resume
   */
  async renderResume(
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
      const data = await this.loadResumeData(resumeType, fullContext);

      // 2. Process assets for PDF if needed
      if (fullContext.forPDF) {
        await this.processAssetsForPDF(data);
      }

      // 3. Render template
      const html = await this.renderTemplate(templateFlavor, data);

      // 4. Get CSS
      const css = await this.cssManager.getCompleteCSS(fullContext);

      return {
        html,
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
      throw new Error(`Failed to render resume: ${error}`);
    }
  }

  /**
   * Load all resume data
   */
  private async loadResumeData(resumeType: string, context: TemplateContext): Promise<ResumeData> {
    const [header, styling, resumeData, markdownContent] = await Promise.all([
      this.loadHeader(),
      this.loadStyling(),
      this.loadResumeJsonData(resumeType),
      this.loadAllMarkdown(resumeType)
    ]);

    // Process markdown content
    const processedData = await this.processMarkdownContent(resumeData, markdownContent, context);

    return {
      header,
      styling,
      ...processedData
    };
  }

  /**
   * Load header data
   */
  private async loadHeader(): Promise<any> {
    const headerPath = path.join(process.cwd(), 'data', 'shared', 'header.json');
    const headerContent = await fs.promises.readFile(headerPath, 'utf-8');
    return JSON.parse(headerContent);
  }

  /**
   * Load styling data
   */
  private async loadStyling(): Promise<any> {
    const stylingPath = path.join(process.cwd(), 'data', 'shared', 'styling.json');
    const stylingContent = await fs.promises.readFile(stylingPath, 'utf-8');
    return JSON.parse(stylingContent);
  }

  /**
   * Load resume JSON data
   */
  private async loadResumeJsonData(resumeType: string): Promise<any> {
    const resumePath = path.join(process.cwd(), 'data', resumeType, 'resume.json');
    const resumeContent = await fs.promises.readFile(resumePath, 'utf-8');
    return JSON.parse(resumeContent);
  }

  /**
   * Load all markdown files
   */
  private async loadAllMarkdown(resumeType: string): Promise<Map<string, string>> {
    const markdownFiles = new Map<string, string>();
    const resumeDir = path.join(process.cwd(), 'data', resumeType);

    // Load summary markdown
    const summaryPath = path.join(resumeDir, 'summary', 'summary.md');
    if (fs.existsSync(summaryPath)) {
      const summaryContent = await fs.promises.readFile(summaryPath, 'utf-8');
      markdownFiles.set('summary', summaryContent);
    }

    // Load skills markdown files
    const skillsDir = path.join(resumeDir, 'skills');
    if (fs.existsSync(skillsDir)) {
      const skillFiles = await fs.promises.readdir(skillsDir);
      for (const file of skillFiles) {
        if (file.endsWith('.md')) {
          const skillName = path.basename(file, '.md');
          const skillPath = path.join(skillsDir, file);
          const skillContent = await fs.promises.readFile(skillPath, 'utf-8');
          markdownFiles.set(`skill_${skillName}`, skillContent);
        }
      }
    }

    // Load experience markdown files
    const experienceDir = path.join(resumeDir, 'experience');
    if (fs.existsSync(experienceDir)) {
      const experienceFiles = await fs.promises.readdir(experienceDir);
      for (const file of experienceFiles) {
        if (file.endsWith('.md')) {
          const experienceName = path.basename(file, '.md');
          const experiencePath = path.join(experienceDir, file);
          const experienceContent = await fs.promises.readFile(experiencePath, 'utf-8');
          markdownFiles.set(`experience_${experienceName}`, experienceContent);
        }
      }
    }

    return markdownFiles;
  }

  /**
   * Process markdown content
   */
  private async processMarkdownContent(
    resumeData: any,
    markdownContent: Map<string, string>,
    context: TemplateContext
  ): Promise<any> {
    const processedData = { ...resumeData };

    // Process sidebar photo for PDF
    if (context.forPDF && processedData.sidebar?.photo &&
        typeof processedData.sidebar.photo === 'string' &&
        !processedData.sidebar.photo.startsWith('data:')) {
      const photoFilename = path.basename(processedData.sidebar.photo);
      const photoPath = path.join(process.cwd(), 'data', 'shared', 'assets', photoFilename);
      const dataUri = await this.assetManager.embedImageAsBase64(photoPath);
      if (dataUri) {
        processedData.sidebar.photo = dataUri;
      }
    }

    // Process summary content
    if (processedData.sidebar?.summary?.markdownPath) {
      const summaryKey = 'summary';
      if (markdownContent.has(summaryKey)) {
        processedData.sidebar.summary.content = markdownContent.get(summaryKey);
      }
    }

    // Process skills content
    if (processedData.sidebar?.skills?.categories) {
      for (const category of processedData.sidebar.skills.categories) {
        const skillName = path.basename(category.markdownPath, '.md');
        const skillKey = `skill_${skillName}`;
        if (markdownContent.has(skillKey)) {
          category.content = markdownContent.get(skillKey);
        }
      }
    }

    // Process experience content
    if (processedData.main?.experience?.jobs) {
      for (const job of processedData.main.experience.jobs) {
        const experienceName = path.basename(job.markdownPath, '.md');
        const experienceKey = `experience_${experienceName}`;
        if (markdownContent.has(experienceKey)) {
          job.content = markdownContent.get(experienceKey);
        }
      }
    }

    return processedData;
  }

  /**
   * Process assets for PDF generation
   */
  private async processAssetsForPDF(data: any): Promise<void> {
    // Preload common assets for better performance
    await this.assetManager.preloadCommonAssets();
  }

  /**
   * Render template using Handlebars
   */
  private async renderTemplate(templateName: string, data: ResumeData): Promise<string> {
    const compiledTemplate = await this.getCompiledTemplate(templateName);
    return compiledTemplate(data);
  }

  /**
   * Get compiled template
   */
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

  /**
   * Configure marked.js
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
    // Markdown rendering helper
    Handlebars.registerHelper('markdown', function(content: string) {
      if (!content) return '';
      return new Handlebars.SafeString(marked.parse(content) as string);
    });

    // Icon helper - synchronous version with preloaded icons
    Handlebars.registerHelper('icon', (iconType: string) => {
      return new Handlebars.SafeString(this.getIconHTMLSync(iconType));
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
  }

  /**
   * Get available resume types
   */
  async getAvailableResumeTypes(): Promise<string[]> {
    const dataDir = path.join(process.cwd(), 'data');
    const entries = await fs.promises.readdir(dataDir, { withFileTypes: true });

    return entries
      .filter(entry => entry.isDirectory() && entry.name !== 'shared')
      .map(entry => entry.name);
  }

  /**
   * Get available templates
   */
  async getAvailableTemplates(): Promise<string[]> {
    const resumesDir = path.join(process.cwd(), 'resumes');

    if (!fs.existsSync(resumesDir)) {
      return ['default'];
    }

    const files = await fs.promises.readdir(resumesDir);
    return files
      .filter(file => file.endsWith('.html'))
      .map(file => path.basename(file, '.html'));
  }

  /**
   * Clear template cache
   */
  clearCache(): void {
    this.compiledTemplates.clear();
  }

  /**
   * Get icon HTML synchronously (for Handlebars helpers)
   */
  private getIconHTMLSync(iconType: string): string {
    const iconMap: { [key: string]: string } = {
      'email': '1f4e7',
      'location': '1f4cd',
      'link': '1f517',
      'github': '1f4bb',
      'website': '1f310',
      'phone': '1f4de'
    };

    const iconCode = iconMap[iconType];
    if (!iconCode) {
      return '•';
    }

    try {
      const svgPath = path.join(process.cwd(), 'assets', 'emoji', `${iconCode}.svg`);
      if (fs.existsSync(svgPath)) {
        const svgContent = fs.readFileSync(svgPath, 'utf-8');
        const base64 = Buffer.from(svgContent).toString('base64');
        const dataUri = `data:image/svg+xml;base64,${base64}`;
        return `<img src="${dataUri}" alt="${iconType}" style="width: 1em; height: 1em; vertical-align: middle; display: inline-block;">`;
      }
    } catch (error) {
      console.warn(`Failed to load SVG icon for ${iconType}:`, error);
    }

    // Fallback to Unicode emoji
    const unicodeMap: { [key: string]: string } = {
      'email': '✉',
      'location': '📍',
      'link': '🔗',
      'github': '💻',
      'website': '🌐',
      'phone': '📞'
    };

    return unicodeMap[iconType] || '•';
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { templateCacheSize: number; cssCacheStats: any; assetCacheStats: any } {
    return {
      templateCacheSize: this.compiledTemplates.size,
      cssCacheStats: this.cssManager.getCacheStats(),
      assetCacheStats: this.assetManager.getCacheStats()
    };
  }
}
