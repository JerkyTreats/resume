import * as path from 'path';
import * as fs from 'fs';
import { RenderedTemplate } from './unified-template-engine';

export interface TemplateContext {
  forPDF: boolean;
  template: string;
  includeFonts: boolean;
  includeIcons: boolean;
  includeNavigation?: boolean;
}

export class ContentWrapper {
  private static instance: ContentWrapper;

  static getInstance(): ContentWrapper {
    if (!ContentWrapper.instance) {
      ContentWrapper.instance = new ContentWrapper();
    }
    return ContentWrapper.instance;
  }

  /**
   * Wrap content for browser rendering with navigation
   */
  async wrapForBrowser(content: RenderedTemplate): Promise<string> {
    const navComponent = await this.loadNavigationComponent();

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles/shared.css">
  <link rel="stylesheet" href="resumes/styles/default.css">
</head>
<body class="bg-gray-50 font-sans text-gray-900">
  ${navComponent}
  ${content.htmlContent}
</body>
</html>`;
  }

  /**
   * Wrap content for PDF rendering (no navigation, embedded CSS)
   */
  async wrapForPDF(content: RenderedTemplate): Promise<string> {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume</title>
  <style>
    ${content.css}
  </style>
</head>
<body>
  ${content.htmlContent}
</body>
</html>`;
  }

  /**
   * Load navigation component for browser rendering
   */
  private async loadNavigationComponent(): Promise<string> {
    const navPath = path.join(process.cwd(), 'components', 'navigation', 'nav.html');

    console.log(`Loading navigation from: ${navPath}`);

    if (!fs.existsSync(navPath)) {
      // Return empty string if navigation component doesn't exist yet
      // This allows the system to work before navigation is implemented
      console.warn(`Navigation component not found at: ${navPath}`);
      return '';
    }

    const navContent = await fs.promises.readFile(navPath, 'utf-8');
    console.log(`Navigation content loaded, length: ${navContent.length}`);
    return navContent;
  }
}
