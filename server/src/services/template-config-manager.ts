import * as path from 'path';
import * as fs from 'fs';

export interface TemplateManifest {
  template: string;
  version: string;
  css: {
    shared: string;
    template: string;
  };
  fonts: Array<{
    name: string;
    files: Array<{
      weight: number;
      style: string;
      file: string;
      format: string;
    }>;
  }>;
  metadata: {
    description: string;
    author: string;
    created: string;
  };
}

export class TemplateConfigManager {
  private static instance: TemplateConfigManager;
  private manifestCache: Map<string, TemplateManifest> = new Map();

  static getInstance(): TemplateConfigManager {
    if (!TemplateConfigManager.instance) {
      TemplateConfigManager.instance = new TemplateConfigManager();
    }
    return TemplateConfigManager.instance;
  }

  /**
   * Load template manifest for a specific template
   */
  async getTemplateManifest(templateName: string): Promise<TemplateManifest> {
    // Check cache first
    if (this.manifestCache.has(templateName)) {
      return this.manifestCache.get(templateName)!;
    }

    const manifestPath = path.join(process.cwd(), 'resumes', templateName, 'manifest.json');

    console.log(`Loading template manifest from: ${manifestPath}`);

    if (!fs.existsSync(manifestPath)) {
      throw new Error(`Template manifest not found: ${manifestPath}`);
    }

    try {
      const manifestContent = await fs.promises.readFile(manifestPath, 'utf-8');
      const manifest: TemplateManifest = JSON.parse(manifestContent);

      // Validate manifest structure
      this.validateManifest(manifest, templateName);

      // Cache the manifest
      this.manifestCache.set(templateName, manifest);

      console.log(`Template manifest loaded for: ${templateName}`);
      return manifest;
    } catch (error) {
      throw new Error(`Failed to load template manifest for '${templateName}': ${error}`);
    }
  }

  /**
   * Get CSS paths for a template
   */
  async getTemplateCSSPaths(templateName: string): Promise<{ shared: string; template: string }> {
    const manifest = await this.getTemplateManifest(templateName);
    return manifest.css;
  }

  /**
   * Get font configuration for a template
   */
  async getTemplateFonts(templateName: string): Promise<TemplateManifest['fonts']> {
    const manifest = await this.getTemplateManifest(templateName);
    return manifest.fonts;
  }

  /**
   * Get available templates
   */
  async getAvailableTemplates(): Promise<string[]> {
    const resumesDir = path.join(process.cwd(), 'resumes');

    if (!fs.existsSync(resumesDir)) {
      return ['default'];
    }

    const entries = await fs.promises.readdir(resumesDir, { withFileTypes: true });
    const templates: string[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        // Check if directory has a layout.html file (component-based template)
        const layoutPath = path.join(resumesDir, entry.name, 'layout.html');
        if (fs.existsSync(layoutPath)) {
          templates.push(entry.name);
        }
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        // Legacy monolithic template
        templates.push(path.basename(entry.name, '.html'));
      }
    }

    return templates.length > 0 ? templates : ['default'];
  }

  /**
   * Validate manifest structure
   */
  private validateManifest(manifest: any, templateName: string): void {
    if (!manifest.template || manifest.template !== templateName) {
      throw new Error(`Template name mismatch in manifest: expected '${templateName}', got '${manifest.template}'`);
    }

    if (!manifest.css || !manifest.css.shared || !manifest.css.template) {
      throw new Error(`Invalid CSS configuration in manifest for template '${templateName}'`);
    }

    if (!manifest.fonts || !Array.isArray(manifest.fonts)) {
      throw new Error(`Invalid fonts configuration in manifest for template '${templateName}'`);
    }

    // Validate each font configuration
    for (const font of manifest.fonts) {
      if (!font.name || !font.files || !Array.isArray(font.files)) {
        throw new Error(`Invalid font configuration in manifest for template '${templateName}'`);
      }

      for (const fontFile of font.files) {
        if (!fontFile.weight || !fontFile.style || !fontFile.file || !fontFile.format) {
          throw new Error(`Invalid font file configuration in manifest for template '${templateName}'`);
        }
      }
    }
  }

  /**
   * Clear manifest cache
   */
  clearCache(): void {
    this.manifestCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { cacheSize: number; cachedTemplates: string[] } {
    return {
      cacheSize: this.manifestCache.size,
      cachedTemplates: Array.from(this.manifestCache.keys())
    };
  }
}
