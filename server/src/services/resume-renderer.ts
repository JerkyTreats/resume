import * as path from 'path';
import * as fs from 'fs';
import { HandlebarsTemplateEngine, ServerRenderedResume, ResumeData } from './handlebars-template-engine';

export class ResumeRenderer {
  private templateEngine: HandlebarsTemplateEngine;

  constructor() {
    this.templateEngine = new HandlebarsTemplateEngine();
  }

  async renderResume(resumeType: string, templateFlavor: string = 'default'): Promise<ServerRenderedResume> {
    const startTime = Date.now();

    try {
      // 1. Load all data server-side
      const header = await this.loadHeader();
      const styling = await this.loadStyling();
      const resumeData = await this.loadResumeData(resumeType);
      const markdownContent = await this.loadAllMarkdown(resumeType);

      // 2. Process markdown content
      const processedData = await this.processMarkdownContent(resumeData, markdownContent);

      // 3. Combine data for template
      const templateData: ResumeData = {
        header,
        styling,
        ...processedData
      };

      // 4. Render template using Handlebars
      const html = await this.templateEngine.renderTemplate(templateFlavor, templateData);
      const css = await this.templateEngine.getTemplateCSS(templateFlavor);

      return {
        html,
        css,
        data: templateData,
        metadata: {
          template: templateFlavor,
          resumeType,
          renderTime: Date.now() - startTime
        }
      };
    } catch (error) {
      throw new Error(`Failed to render resume: ${error}`);
    }
  }

  private async loadHeader(): Promise<any> {
    const headerPath = path.join(process.cwd(), 'data', 'shared', 'header.json');
    const headerContent = await fs.promises.readFile(headerPath, 'utf-8');
    return JSON.parse(headerContent);
  }

  private async loadStyling(): Promise<any> {
    const stylingPath = path.join(process.cwd(), 'data', 'shared', 'styling.json');
    const stylingContent = await fs.promises.readFile(stylingPath, 'utf-8');
    return JSON.parse(stylingContent);
  }

  private async loadResumeData(resumeType: string): Promise<any> {
    const resumePath = path.join(process.cwd(), 'data', resumeType, 'resume.json');
    const resumeContent = await fs.promises.readFile(resumePath, 'utf-8');
    return JSON.parse(resumeContent);
  }

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

  private async processMarkdownContent(resumeData: any, markdownContent: Map<string, string>): Promise<any> {
    const processedData = { ...resumeData };

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

  async getAvailableResumeTypes(): Promise<string[]> {
    const dataDir = path.join(process.cwd(), 'data');
    const entries = await fs.promises.readdir(dataDir, { withFileTypes: true });

    return entries
      .filter(entry => entry.isDirectory() && entry.name !== 'shared')
      .map(entry => entry.name);
  }

  async getAvailableTemplates(): Promise<string[]> {
    const resumesDir = path.join(process.cwd(), 'resumes');

    if (!fs.existsSync(resumesDir)) {
      return ['default']; // Return default if no templates directory exists yet
    }

    const files = await fs.promises.readdir(resumesDir);
    return files
      .filter(file => file.endsWith('.html'))
      .map(file => path.basename(file, '.html'));
  }
}
