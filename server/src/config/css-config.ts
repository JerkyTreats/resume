import * as path from 'path';

export interface CSSConfig {
  paths: CSSPaths;
  templates: CSSTemplates;
  features: CSSFeatures;
  caching: CSSCaching;
}

export interface CSSPaths {
  baseCSS: string;
  templatesDir: string;
  assetsDir: string;
  fontsDir: string;
  iconsDir: string;
}

export interface CSSTemplates {
  default: string;
  available: string[];
}

export interface CSSFeatures {
  enableFonts: boolean;
  enableIcons: boolean;
  enablePDFOptimization: boolean;
  enableCaching: boolean;
  enableMinification: boolean;
}

export interface CSSCaching {
  enabled: boolean;
  maxSize: number;
  ttl: number; // Time to live in milliseconds
}

export class CSSConfigManager {
  private static instance: CSSConfigManager;
  private config: CSSConfig;

  static getInstance(): CSSConfigManager {
    if (!CSSConfigManager.instance) {
      CSSConfigManager.instance = new CSSConfigManager();
    }
    return CSSConfigManager.instance;
  }

  constructor() {
    this.config = this.loadConfig();
  }

  getConfig(): CSSConfig {
    return this.config;
  }

  getPaths(): CSSPaths {
    return this.config.paths;
  }

  getTemplates(): CSSTemplates {
    return this.config.templates;
  }

  getFeatures(): CSSFeatures {
    return this.config.features;
  }

  getCaching(): CSSCaching {
    return this.config.caching;
  }

  private loadConfig(): CSSConfig {
    const baseDir = process.cwd();

    return {
      paths: {
        baseCSS: path.join(baseDir, 'styles', 'shared.css'),
        templatesDir: path.join(baseDir, 'resumes', 'styles'),
        assetsDir: path.join(baseDir, 'assets'),
        fontsDir: path.join(baseDir, 'assets', 'fonts'),
        iconsDir: path.join(baseDir, 'assets', 'emoji')
      },
      templates: {
        default: 'default',
        available: ['default'] // Will be populated dynamically
      },
      features: {
        enableFonts: process.env.CSS_ENABLE_FONTS !== 'false',
        enableIcons: process.env.CSS_ENABLE_ICONS !== 'false',
        enablePDFOptimization: process.env.CSS_ENABLE_PDF_OPTIMIZATION !== 'false',
        enableCaching: process.env.CSS_ENABLE_CACHING !== 'false',
        enableMinification: process.env.CSS_ENABLE_MINIFICATION === 'true'
      },
      caching: {
        enabled: process.env.CSS_ENABLE_CACHING !== 'false',
        maxSize: parseInt(process.env.CSS_CACHE_MAX_SIZE || '100'),
        ttl: parseInt(process.env.CSS_CACHE_TTL || '300000') // 5 minutes default
      }
    };
  }

  // Method to update available templates dynamically
  updateAvailableTemplates(templates: string[]): void {
    this.config.templates.available = templates;
  }

  // Method to check if a template exists
  isTemplateAvailable(templateName: string): boolean {
    return this.config.templates.available.includes(templateName);
  }

  // Method to get full path for a template CSS file
  getTemplateCSSPath(templateName: string): string {
    return path.join(this.config.paths.templatesDir, `${templateName}.css`);
  }

  // Method to get full path for an asset
  getAssetPath(assetName: string): string {
    return path.join(this.config.paths.assetsDir, assetName);
  }

  // Method to get full path for an icon
  getIconPath(iconName: string): string {
    return path.join(this.config.paths.iconsDir, iconName);
  }
}
