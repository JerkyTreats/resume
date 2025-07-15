import * as path from 'path';
import * as fs from 'fs';
import { AssetManager } from './asset-manager';

export interface FontConfig {
  name: string;
  files: Array<{
    weight: number;
    style: string;
    file: string;
    format: string;
  }>;
}

export class AssetProcessor {
  private static instance: AssetProcessor;
  private assetManager: AssetManager;
  private iconCache: Map<string, string> = new Map();

  static getInstance(): AssetProcessor {
    if (!AssetProcessor.instance) {
      AssetProcessor.instance = new AssetProcessor();
    }
    return AssetProcessor.instance;
  }

  constructor() {
    this.assetManager = AssetManager.getInstance();
  }

  /**
   * Process assets for PDF generation
   */
  async processAssetsForPDF(data: any): Promise<void> {
    // Preload common assets for better performance
    await this.assetManager.preloadCommonAssets();

    // Process sidebar photo if present
    if (data.sidebar?.photo && typeof data.sidebar.photo === 'string') {
      await this.processPhotoForPDF(data.sidebar);
    }
  }

  /**
   * Process photo for PDF generation (embed as base64)
   */
  private async processPhotoForPDF(sidebar: any): Promise<void> {
    if (!sidebar.photo || sidebar.photo.startsWith('data:')) {
      return; // Already processed or external URL
    }

    // Handle different path types
    let photoPath: string;

    if (sidebar.photo.startsWith('http://') || sidebar.photo.startsWith('https://')) {
      // External URL - leave as-is for PDF (Puppeteer can handle external URLs)
      return;
    } else if (path.isAbsolute(sidebar.photo)) {
      // Absolute path - use as-is
      photoPath = sidebar.photo;
    } else {
      // Relative path - resolve from project root
      photoPath = path.join(process.cwd(), sidebar.photo);
    }

    const dataUri = await this.embedImageAsBase64(photoPath);
    if (dataUri) {
      sidebar.photo = dataUri;
    } else {
      console.warn(`Failed to convert photo to base64: ${photoPath}`);
    }
  }

  /**
   * Embed image as base64 data URI
   */
  async embedImageAsBase64(imagePath: string): Promise<string | null> {
    if (!fs.existsSync(imagePath)) {
      console.warn(`Image file not found: ${imagePath}`);
      return null;
    }

    try {
      const ext = path.extname(imagePath).toLowerCase();
      let mimeType = 'image/jpeg';

      if (ext === '.png') mimeType = 'image/png';
      else if (ext === '.webp') mimeType = 'image/webp';
      else if (ext === '.gif') mimeType = 'image/gif';
      else if (ext === '.svg') mimeType = 'image/svg+xml';

      const imgBuffer = await fs.promises.readFile(imagePath);
      const base64 = imgBuffer.toString('base64');
      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.error(`Failed to embed image as base64: ${imagePath}`, error);
      return null;
    }
  }

  /**
   * Embed fonts as base64 for PDF generation
   */
  async embedFontsAsBase64(fonts: FontConfig[]): Promise<string> {
    const fontsDir = path.join(process.cwd(), 'assets', 'fonts');
    let fontCSS = '';

    for (const font of fonts) {
      for (const fontFile of font.files) {
        const fontPath = path.join(fontsDir, fontFile.file);

        if (!fs.existsSync(fontPath)) {
          throw new Error(`Font file not found: ${fontPath}`);
        }

        try {
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
        } catch (error) {
          throw new Error(`Failed to embed font file ${fontPath}: ${error}`);
        }
      }
    }

    return fontCSS;
  }

  /**
   * Get icon HTML synchronously (for Handlebars helpers)
   */
  getIconHTMLSync(iconType: string): string {
    const iconMap: { [key: string]: string } = {
      'email': '1f4e7',
      'phone': '1f4de',
      'location': '1f4cd',
      'linkedin': '1f310',
      'github': '1f4bb',
      'website': '1f517'
    };

    const iconCode = iconMap[iconType] || '1f4bb'; // Default to computer icon
    return `<img src="assets/emoji/${iconCode}.svg" alt="${iconType}" class="inline-icon" width="16" height="16">`;
  }

  /**
   * Embed icons as base64 for PDF generation
   */
  async embedIconsAsBase64(): Promise<string> {
    const iconsDir = path.join(process.cwd(), 'assets', 'emoji');
    let iconCSS = '';

    if (!fs.existsSync(iconsDir)) {
      console.warn(`Icons directory not found: ${iconsDir}`);
      return '';
    }

    try {
      const iconFiles = await fs.promises.readdir(iconsDir);
      const svgFiles = iconFiles.filter(file => file.endsWith('.svg'));

      for (const svgFile of svgFiles) {
        const iconPath = path.join(iconsDir, svgFile);
        const iconName = path.basename(svgFile, '.svg');
        const dataUri = await this.embedImageAsBase64(iconPath);

        if (dataUri) {
          iconCSS += `
.inline-icon[src*="${iconName}.svg"] {
  content: url('${dataUri}') !important;
}`;
        }
      }

      return iconCSS;
    } catch (error) {
      console.error('Failed to embed icons as base64:', error);
      return '';
    }
  }

  /**
   * Clear asset cache
   */
  clearCache(): void {
    this.iconCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { iconCacheSize: number } {
    return {
      iconCacheSize: this.iconCache.size
    };
  }
}
