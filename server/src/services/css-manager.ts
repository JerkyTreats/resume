import * as path from 'path';
import * as fs from 'fs';
import { CSSConfigManager } from '../config/css-config';

export interface CSSContext {
  forPDF: boolean;
  template?: string;
  includeFonts?: boolean;
  includeIcons?: boolean;
}

export interface CSSAssembly {
  baseCSS: string;
  templateCSS: string;
  pdfCSS: string;
  fontCSS: string;
  iconCSS: string;
  completeCSS: string;
}

export class CSSManager {
  private static instance: CSSManager;
  private cssCache: Map<string, string> = new Map();
  private assemblyCache: Map<string, CSSAssembly> = new Map();
  private configManager: CSSConfigManager;

  static getInstance(): CSSManager {
    if (!CSSManager.instance) {
      CSSManager.instance = new CSSManager();
    }
    return CSSManager.instance;
  }

  constructor() {
    this.configManager = CSSConfigManager.getInstance();
  }

  async getCompleteCSS(context: CSSContext = { forPDF: false }): Promise<string> {
    const cacheKey = this.generateCacheKey(context);

    if (this.cssCache.has(cacheKey)) {
      return this.cssCache.get(cacheKey)!;
    }

    const assembly = await this.assembleCSS(context);
    this.cssCache.set(cacheKey, assembly.completeCSS);
    this.assemblyCache.set(cacheKey, assembly);

    return assembly.completeCSS;
  }

  async getCSSAssembly(context: CSSContext = { forPDF: false }): Promise<CSSAssembly> {
    const cacheKey = this.generateCacheKey(context);

    if (this.assemblyCache.has(cacheKey)) {
      return this.assemblyCache.get(cacheKey)!;
    }

    const assembly = await this.assembleCSS(context);
    this.assemblyCache.set(cacheKey, assembly);
    this.cssCache.set(cacheKey, assembly.completeCSS);

    return assembly;
  }

  private generateCacheKey(context: CSSContext): string {
    return `${context.forPDF}-${context.template || 'default'}-${context.includeFonts || false}-${context.includeIcons || false}`;
  }

  private async assembleCSS(context: CSSContext): Promise<CSSAssembly> {
    const features = this.configManager.getFeatures();

    const [baseCSS, templateCSS, pdfCSS, fontCSS, iconCSS] = await Promise.all([
      this.loadBaseCSS(),
      this.loadTemplateCSS(context.template || 'default'),
      context.forPDF && features.enablePDFOptimization ? this.loadPDFCSS() : '',
      context.includeFonts !== false && features.enableFonts ? this.loadFontCSS() : '',
      context.includeIcons !== false && features.enableIcons ? this.loadIconCSS() : ''
    ]);

    const completeCSS = this.combineCSS([baseCSS, templateCSS, pdfCSS, fontCSS, iconCSS]);

    return {
      baseCSS,
      templateCSS,
      pdfCSS,
      fontCSS,
      iconCSS,
      completeCSS
    };
  }

  private async loadBaseCSS(): Promise<string> {
    const baseCSSPath = this.configManager.getPaths().baseCSS;
    return await this.readCSSFile(baseCSSPath);
  }

  private async loadTemplateCSS(templateName: string): Promise<string> {
    const templateCSSPath = this.configManager.getTemplateCSSPath(templateName);
    return await this.readCSSFile(templateCSSPath);
  }

  private async loadPDFCSS(): Promise<string> {
    return `
      /* PDF-specific styles */
      @media print {
        body {
          margin: 0 !important;
          padding: 0 !important;
        }
        .resume-content {
          box-shadow: none !important;
          margin: 0 !important;
          padding: 0 !important;
          min-height: auto !important;
          height: auto !important;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
        }

        /* Force proper layout in PDF */
        .flex {
          display: flex !important;
        }
        .flex-col {
          flex-direction: column !important;
        }
        .w-1/3 {
          width: 33.333333% !important;
        }
        .w-2/3 {
          width: 66.666667% !important;
        }
        .flex-1 {
          flex: 1 1 0% !important;
        }
      }
    `;
  }

  private async loadFontCSS(): Promise<string> {
    // For PDF generation, we need to embed fonts as base64
    const fontCSS = await this.loadLocalFontCSS();

    return `
      /* Font configuration */
      ${fontCSS}

      /* Font family definitions */
      :root {
        --font-heading: 'Montserrat', sans-serif;
        --font-body: 'Lato', sans-serif;
      }

      /* Base font settings */
      body {
        font-family: var(--font-body);
      }

      /* Heading styles */
      h1, h2, h3, h4, h5, h6 {
        font-family: var(--font-heading);
      }

      /* Ensure fonts are loaded for PDF generation */
      body {
        font-family: 'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      h1, h2, h3, h4, h5, h6 {
        font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
    `;
  }

  private async loadLocalFontCSS(): Promise<string> {
    try {
      const fontsDir = path.join(process.cwd(), 'server', 'src', 'assets', 'fonts');
      const fontFiles = [
        { name: 'Montserrat', file: 'montserrat-regular.ttf', weight: 400 },
        { name: 'Montserrat', file: 'montserrat-bold.ttf', weight: 600 },
        { name: 'Lato', file: 'lato-regular.ttf', weight: 400 },
        { name: 'Lato', file: 'lato-bold.ttf', weight: 700 }
      ];

      let fontCSS = '';

      for (const font of fontFiles) {
        const fontPath = path.join(fontsDir, font.file);
        if (fs.existsSync(fontPath)) {
          const fontBuffer = await fs.promises.readFile(fontPath);
          const base64 = fontBuffer.toString('base64');
          fontCSS += `
@font-face {
  font-family: '${font.name}';
  src: url('data:font/truetype;base64,${base64}') format('truetype');
  font-weight: ${font.weight};
  font-style: normal;
  font-display: swap;
}`;
        }
      }

      return fontCSS;
    } catch (error) {
      console.error('Failed to load local fonts:', error);
      // Fallback to Google Fonts
      return `
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Lato:wght@300;400;700&display=swap');
      `;
    }
  }

  private async loadIconCSS(): Promise<string> {
    return `
      /* SVG icon styling for PDF */
      img[src^="data:image/svg+xml"] {
        width: 1em !important;
        height: 1em !important;
        vertical-align: middle !important;
        display: inline-block !important;
      }

      /* Enhanced emoji support */
      .emoji,
      [data-emoji="true"] {
        font-family: 'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Android Emoji', 'EmojiSymbols', 'EmojiOne Mozilla', 'Twemoji Mozilla', sans-serif;
        font-feature-settings: "emoji";
        font-variant-emoji: emoji;
      }

      /* Ensure emojis in contact info are properly styled */
      .resume-content .text-sm .emoji,
      .resume-content .text-sm [data-emoji="true"] {
        font-family: 'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Android Emoji', 'EmojiSymbols', 'EmojiOne Mozilla', 'Twemoji Mozilla', sans-serif;
        font-feature-settings: "emoji";
        font-variant-emoji: emoji;
      }
    `;
  }

  private async readCSSFile(filePath: string): Promise<string> {
    try {
      if (!fs.existsSync(filePath)) {
        console.warn(`CSS file not found: ${filePath}`);
        return '';
      }
      return await fs.promises.readFile(filePath, 'utf-8');
    } catch (error) {
      console.error(`Failed to read CSS file ${filePath}:`, error);
      return '';
    }
  }

  private combineCSS(cssParts: string[]): string {
    return cssParts
      .filter(css => css.trim().length > 0)
      .join('\n\n');
  }

  clearCache(): void {
    this.cssCache.clear();
    this.assemblyCache.clear();
  }

  getCacheStats(): { cssCacheSize: number; assemblyCacheSize: number } {
    return {
      cssCacheSize: this.cssCache.size,
      assemblyCacheSize: this.assemblyCache.size
    };
  }
}
