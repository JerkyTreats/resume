import * as path from 'path';
import * as fs from 'fs';
import { UnifiedTemplateEngine, RenderedTemplate } from './unified-template-engine';

// Utility function to embed image as base64 data URI
async function embedImageAsBase64(imagePath: string): Promise<string | null> {
  if (!fs.existsSync(imagePath)) return null;
  const ext = path.extname(imagePath).toLowerCase();
  let mimeType = 'image/jpeg';
  if (ext === '.png') mimeType = 'image/png';
  if (ext === '.webp') mimeType = 'image/webp';
  if (ext === '.gif') mimeType = 'image/gif';
  const imgBuffer = await fs.promises.readFile(imagePath);
  const base64 = imgBuffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

export class ResumeRenderer {
  private templateEngine: UnifiedTemplateEngine;

  constructor() {
    this.templateEngine = UnifiedTemplateEngine.getInstance();
  }

  async renderResume(resumeType: string, templateFlavor: string = 'default', forPDF: boolean = false): Promise<RenderedTemplate> {
    return await this.templateEngine.renderResume(resumeType, templateFlavor, {
      forPDF,
      includeFonts: true,
      includeIcons: true
    });
  }

  // All data loading and processing is now handled by UnifiedTemplateEngine

  async getAvailableResumeTypes(): Promise<string[]> {
    return await this.templateEngine.getAvailableResumeTypes();
  }

  async getAvailableTemplates(): Promise<string[]> {
    return await this.templateEngine.getAvailableTemplates();
  }
}
