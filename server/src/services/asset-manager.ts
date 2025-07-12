import * as path from 'path';
import * as fs from 'fs';
import { CSSConfigManager } from '../config/css-config';

export interface AssetInfo {
  dataUri: string;
  mimeType: string;
  size: number;
  originalPath: string;
}

export interface IconInfo {
  dataUri: string;
  alt: string;
  size: string;
}

export interface FontInfo {
  family: string;
  weights: string[];
  importUrl: string;
}

export class AssetManager {
  private static instance: AssetManager;
  private assetCache: Map<string, AssetInfo> = new Map();
  private configManager: CSSConfigManager;

  static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  constructor() {
    this.configManager = CSSConfigManager.getInstance();
  }

  /**
   * Embed image as base64 data URI
   */
  async embedImageAsBase64(imagePath: string): Promise<string | null> {
    const cacheKey = `image-${imagePath}`;

    if (this.assetCache.has(cacheKey)) {
      return this.assetCache.get(cacheKey)!.dataUri;
    }

    try {
      if (!fs.existsSync(imagePath)) {
        console.warn(`Image file not found: ${imagePath}`);
        return null;
      }

      const ext = path.extname(imagePath).toLowerCase();
      const mimeType = this.getMimeType(ext);

      const imgBuffer = await fs.promises.readFile(imagePath);
      const base64 = imgBuffer.toString('base64');
      const dataUri = `data:${mimeType};base64,${base64}`;

      const assetInfo: AssetInfo = {
        dataUri,
        mimeType,
        size: imgBuffer.length,
        originalPath: imagePath
      };

      this.assetCache.set(cacheKey, assetInfo);
      return dataUri;
    } catch (error) {
      console.error(`Failed to embed image ${imagePath}:`, error);
      return null;
    }
  }

  /**
   * Embed SVG as base64 data URI
   */
  async embedSVGAsBase64(svgPath: string): Promise<string | null> {
    const cacheKey = `svg-${svgPath}`;

    if (this.assetCache.has(cacheKey)) {
      return this.assetCache.get(cacheKey)!.dataUri;
    }

    try {
      if (!fs.existsSync(svgPath)) {
        console.warn(`SVG file not found: ${svgPath}`);
        return null;
      }

      const svgContent = await fs.promises.readFile(svgPath, 'utf-8');
      const base64 = Buffer.from(svgContent).toString('base64');
      const dataUri = `data:image/svg+xml;base64,${base64}`;

      const assetInfo: AssetInfo = {
        dataUri,
        mimeType: 'image/svg+xml',
        size: svgContent.length,
        originalPath: svgPath
      };

      this.assetCache.set(cacheKey, assetInfo);
      return dataUri;
    } catch (error) {
      console.error(`Failed to embed SVG ${svgPath}:`, error);
      return null;
    }
  }

  /**
   * Get icon as HTML img element
   */
  async getIconHTML(iconType: string, size: string = '1em'): Promise<string> {
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
      return this.getFallbackIcon(iconType);
    }

    try {
      const svgPath = this.configManager.getIconPath(`${iconCode}.svg`);
      const dataUri = await this.embedSVGAsBase64(svgPath);

      if (dataUri) {
        return `<img src="${dataUri}" alt="${iconType}" style="width: ${size}; height: ${size}; vertical-align: middle; display: inline-block;">`;
      }
    } catch (error) {
      console.warn(`Failed to load SVG icon for ${iconType}:`, error);
    }

    return this.getFallbackIcon(iconType);
  }

  /**
   * Get fallback Unicode emoji for icons
   */
  private getFallbackIcon(iconType: string): string {
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
   * Get font information
   */
  getFontInfo(): FontInfo[] {
    return [
      {
        family: 'Montserrat',
        weights: ['400', '600', '700'],
        importUrl: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap'
      },
      {
        family: 'Lato',
        weights: ['300', '400', '700'],
        importUrl: 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap'
      }
    ];
  }

  /**
   * Get combined font import URL
   */
  getCombinedFontImportUrl(): string {
    return 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Lato:wght@300;400;700&display=swap';
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeType(ext: string): string {
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml'
    };

    return mimeTypes[ext] || 'image/jpeg';
  }

  /**
   * Clear asset cache
   */
  clearCache(): void {
    this.assetCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { cacheSize: number; totalSize: number } {
    let totalSize = 0;
    for (const asset of this.assetCache.values()) {
      totalSize += asset.size;
    }

    return {
      cacheSize: this.assetCache.size,
      totalSize
    };
  }

  /**
   * Get cached asset info
   */
  getCachedAsset(assetPath: string): AssetInfo | null {
    const cacheKey = `asset-${assetPath}`;
    return this.assetCache.get(cacheKey) || null;
  }

  /**
   * Preload common assets
   */
  async preloadCommonAssets(): Promise<void> {
    const iconTypes = ['email', 'location', 'link', 'github', 'website', 'phone'];

    for (const iconType of iconTypes) {
      await this.getIconHTML(iconType);
    }
  }
}
