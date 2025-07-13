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
    const templateName = context.template || 'default';

    // Debug logging for CSS assembly
    if (process.env.NODE_ENV === 'development') {
      console.log('CSS Assembly Context:', {
        forPDF: context.forPDF,
        template: templateName,
        includeFonts: context.includeFonts,
        includeIcons: context.includeIcons,
        features: {
          enablePDFOptimization: features.enablePDFOptimization,
          enableFonts: features.enableFonts,
          enableIcons: features.enableIcons
        }
      });
    }

    const [baseCSS, templateCSS, fontCSS, iconCSS, pdfFontCSS] = await Promise.all([
      this.loadBaseCSS(),
      this.loadTemplateCSS(templateName),
      context.includeFonts !== false && features.enableFonts && !context.forPDF ? this.loadFontCSS() : '',
      context.includeIcons !== false && features.enableIcons ? this.loadIconCSS() : '',
      context.forPDF && features.enableFonts ? this.loadPDFFontCSS(templateName) : ''
    ]);

    // For PDF, use PDF font CSS; for browser, use regular font CSS
    const finalFontCSS = context.forPDF ? pdfFontCSS : fontCSS;
    const completeCSS = this.combineCSS([baseCSS, templateCSS, finalFontCSS, iconCSS]);

    return {
      baseCSS,
      templateCSS,
      fontCSS: finalFontCSS,
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



  private async loadFontCSS(): Promise<string> {
    // Browser-only font definitions
    const fontConfigPath = path.join(process.cwd(), 'styles', 'fonts.css');
    return await this.readCSSFile(fontConfigPath);
  }

  private async loadPDFFontCSS(templateName: string = 'default'): Promise<string> {
    // PDF-only base64 font embedding - bulletproof, no fallbacks
    const fontConfigPath = path.join(process.cwd(), 'resumes', templateName, 'fonts.json');

    try {
      if (!fs.existsSync(fontConfigPath)) {
        throw new Error(`Font configuration not found for template '${templateName}': ${fontConfigPath}`);
      }

      const fontConfig = JSON.parse(await fs.promises.readFile(fontConfigPath, 'utf-8'));
      const fontsDir = path.join(process.cwd(), 'assets', 'fonts');
      let fontCSS = '';

      for (const font of fontConfig.fonts) {
        for (const fontFile of font.files) {
          const fontPath = path.join(fontsDir, fontFile.file);

          if (!fs.existsSync(fontPath)) {
            throw new Error(`Font file not found: ${fontPath}`);
          }

          const fontBuffer = await fs.promises.readFile(fontPath);
          const base64 = fontBuffer.toString('base64');
          const mimeType = fontFile.format === 'woff2' ? 'font/woff2' : 'font/truetype';

          fontCSS += `
@font-face {
  font-family: '${font.name}';
  src: url('data:${mimeType};base64,${base64}') format('${fontFile.format}');
  font-weight: ${fontFile.weight};
  font-style: ${fontFile.style};
  font-display: swap;
}`;
        }
      }

      return fontCSS;
    } catch (error) {
      throw new Error(`Failed to load fonts for template '${templateName}': ${error}`);
    }
  }

  private async loadIconCSS(): Promise<string> {
    const iconCSSPath = path.join(process.cwd(), 'styles', 'icons.css');
    return await this.readCSSFile(iconCSSPath);
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
    const filteredParts = cssParts.filter(css => css.trim().length > 0);

    // Debug logging for CSS assembly
    if (process.env.NODE_ENV === 'development') {
      console.log('CSS Assembly Parts:');
      console.log('- Base CSS length:', cssParts[0]?.length || 0);
      console.log('- Template CSS length:', cssParts[1]?.length || 0);
      console.log('- Font CSS length:', cssParts[2]?.length || 0);
      console.log('- Icon CSS length:', cssParts[3]?.length || 0);
      console.log('- Total combined length:', filteredParts.join('\n\n').length);
    }

    return filteredParts.join('\n\n');
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
