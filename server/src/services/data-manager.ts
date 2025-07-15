import * as path from 'path';
import * as fs from 'fs';
import { marked } from 'marked';
import { AssetManager } from './asset-manager';
import { AssetProcessor } from './asset-processor';

export interface TemplateContext {
  forPDF: boolean;
  template: string;
  includeFonts: boolean;
  includeIcons: boolean;
}

export interface ResumeData {
  header: any;
  styling: any;
  sidebar: any;
  main: any;
}

export interface HeaderData {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface StylingData {
  colors: {
    primary: string;
    accent: string;
    text: string;
    background: string;
  };
  fonts: {
    primary: string;
    secondary: string;
  };
  spacing: {
    section: string;
    item: string;
  };
}

export interface ResumeJsonData {
  sidebar: {
    photo?: string;
    summary: {
      title: string;
      markdownPath: string;
      content?: string;
    };
    skills: {
      title: string;
      categories: Array<{
        name: string;
        markdownPath: string;
        content?: string;
      }>;
    };
  };
  main: {
    experience: {
      title: string;
      jobs: Array<{
        company: string;
        title: string;
        location: string;
        startDate: string;
        endDate?: string;
        markdownPath: string;
        content?: string;
      }>;
    };
  };
}

export class DataManager {
  private static instance: DataManager;
  private assetManager: AssetManager;
  private assetProcessor: AssetProcessor;

  static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
    }
    return DataManager.instance;
  }

  constructor() {
    this.assetManager = AssetManager.getInstance();
    this.assetProcessor = AssetProcessor.getInstance();
    this.configureMarked();
  }

  /**
   * Load all resume data for a specific resume type and context
   */
  async loadResumeData(resumeType: string, context: TemplateContext): Promise<ResumeData> {
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
   * Load shared header data
   */
  async loadHeader(): Promise<HeaderData> {
    const headerPath = path.join(process.cwd(), 'data', 'shared', 'header.json');

    if (!fs.existsSync(headerPath)) {
      throw new Error(`Header file not found: ${headerPath}`);
    }

    const headerContent = await fs.promises.readFile(headerPath, 'utf-8');
    return JSON.parse(headerContent);
  }

  /**
   * Load shared styling data
   */
  async loadStyling(): Promise<StylingData> {
    const stylingPath = path.join(process.cwd(), 'data', 'shared', 'styling.json');

    if (!fs.existsSync(stylingPath)) {
      throw new Error(`Styling file not found: ${stylingPath}`);
    }

    const stylingContent = await fs.promises.readFile(stylingPath, 'utf-8');
    return JSON.parse(stylingContent);
  }

  /**
   * Load resume-specific JSON data
   */
  async loadResumeJsonData(resumeType: string): Promise<ResumeJsonData> {
    const resumePath = path.join(process.cwd(), 'data', resumeType, 'resume.json');

    if (!fs.existsSync(resumePath)) {
      throw new Error(`Resume data file not found: ${resumePath}`);
    }

    const resumeContent = await fs.promises.readFile(resumePath, 'utf-8');
    return JSON.parse(resumeContent);
  }

  /**
   * Load all markdown files for a resume type
   */
  async loadAllMarkdown(resumeType: string): Promise<Map<string, string>> {
    const markdownFiles = new Map<string, string>();
    const resumeDir = path.join(process.cwd(), 'data', resumeType);

    if (!fs.existsSync(resumeDir)) {
      throw new Error(`Resume directory not found: ${resumeDir}`);
    }

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
   * Process markdown content for different contexts
   */
  async processMarkdownContent(
    resumeData: any,
    markdownContent: Map<string, string>,
    context: TemplateContext
  ): Promise<any> {
    const processedData = { ...resumeData };

    // Process sidebar photo for PDF
    if (context.forPDF && processedData.sidebar?.photo &&
        typeof processedData.sidebar.photo === 'string' &&
        !processedData.sidebar.photo.startsWith('data:')) {

      // Handle different path types
      let photoPath: string;

      if (processedData.sidebar.photo.startsWith('http://') ||
          processedData.sidebar.photo.startsWith('https://')) {
        // External URL - leave as-is for PDF (Puppeteer can handle external URLs)
        return processedData;
      } else if (path.isAbsolute(processedData.sidebar.photo)) {
        // Absolute path - use as-is
        photoPath = processedData.sidebar.photo;
      } else {
        // Relative path - resolve from project root
        photoPath = path.join(process.cwd(), processedData.sidebar.photo);
      }

      const dataUri = await this.assetProcessor.embedImageAsBase64(photoPath);
      if (dataUri) {
        processedData.sidebar.photo = dataUri;
      } else {
        console.warn(`Failed to convert photo to base64: ${photoPath}`);
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
   * Get available resume types
   */
  async getAvailableResumeTypes(): Promise<string[]> {
    const dataDir = path.join(process.cwd(), 'data');

    if (!fs.existsSync(dataDir)) {
      return [];
    }

    const entries = await fs.promises.readdir(dataDir, { withFileTypes: true });

    return entries
      .filter(entry => entry.isDirectory() && entry.name !== 'shared')
      .map(entry => entry.name);
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
   * Clear any cached data (for testing/debugging)
   */
  clearCache(): void {
    // DataManager doesn't currently cache anything, but this method
    // can be used for future caching implementations
  }

  /**
   * Get cache statistics (for testing/debugging)
   */
  getCacheStats(): { cacheSize: number } {
    // DataManager doesn't currently cache anything, but this method
    // can be used for future caching implementations
    return { cacheSize: 0 };
  }
}
