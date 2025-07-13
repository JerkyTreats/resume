# 📄 Resume Componentization Feature Brief: Unified Content Pipeline

## 🎯 **Objective**

To refactor the current monolithic HTML resume generation system into a **component-based architecture** with a **unified content pipeline** that generates pure content, then applies context-specific wrappers for browser and PDF optimization.

## 🧱 **Current State Analysis**

### **Current Architecture**

The resume system currently uses a **monolithic template approach**:

```
resumes/
├── default.html          # Single monolithic template (95 lines)
└── styles/
    └── default.css       # Template-specific styles (234 lines)
```

**Current HTML Structure:**
- **Single Template**: `resumes/default.html` contains all sections
- **Handlebars Rendering**: Server-side template processing via `UnifiedTemplateEngine`
- **Data Sections**: Experience, Skills, Summary, Header (from `data/` directory)
- **Dual Output**: Browser-optimized (via `/resume` route) and PDF-optimized (via Puppeteer)
- **Inline CSS**: CSS is inlined for PDF generation via `CSSManager`

### **Current PDF Generation Strategy**

The current system uses a sophisticated context-aware rendering approach:

1. **UnifiedTemplateEngine** renders resume with context `{ forPDF: true }`
2. **CSSManager** provides complete CSS with PDF optimizations
3. **PDFGenerator.createCompleteHTML()** wraps content in complete HTML document
4. **Puppeteer** generates PDF from the complete HTML

**Key Components:**
- **Context-Aware Rendering**: Different processing for browser vs PDF
- **CSS Assembly**: PDF-specific optimizations (embedded fonts, icons)
- **Complete HTML Wrapper**: Self-contained HTML for PDF generation

### **Current Problems**

| Issue | Impact |
|-------|--------|
| **Monolithic Template** | Single large HTML file (95 lines) difficult to maintain |
| **Mixed Concerns** | Header, Experience, Skills, Summary all in one template |
| **Limited Reusability** | Cannot reuse individual sections across templates |
| **Testing Complexity** | Hard to test individual components in isolation |
| **Template Duplication** | Similar sections repeated across different templates |
| **Maintenance Overhead** | Changes to one section require editing entire template |

## 🎯 **Proposed Solution: Unified Content Pipeline**

### **Component-Based Architecture**

Transform the monolithic template into **modular components** with a **unified content pipeline**:

```
resumes/
├── default/
│   ├── header.html       # Header component (lines 47-67 from default.html)
│   ├── experience.html   # Experience component (lines 69-85 from default.html)
│   ├── skills.html       # Skills component (lines 25-45 from default.html)
│   ├── summary.html      # Summary component (lines 20-24 from default.html)
│   └── layout.html       # Content layout (no HTML wrapper)
├── components/
│   └── shared/
│       ├── header.html   # Shared header component
│       ├── nav.html      # Shared navigation component
│       └── layout.html   # Shared layout component
├── default.html          # Keep for backward compatibility
└── styles/
    └── default.css       # Template-specific styles (already exists)
```

### **Component Extraction Mapping**

| Component | Source Lines | Target File | Content Type |
|-----------|-------------|-------------|--------------|
| **Header** | 47-67 | `resumes/default/header.html` | Contact info, name, title |
| **Experience** | 69-85 | `resumes/default/experience.html` | Job history, descriptions |
| **Skills** | 25-45 | `resumes/default/skills.html` | Technical skills, categories |
| **Summary** | 20-24 | `resumes/default/summary.html` | Professional summary |
| **Layout** | 15-18, 47-85 | `resumes/default/layout.html` | Component assembly |

### **Unified Content Pipeline**

The system will generate **pure content**, then apply **context-specific wrappers**:

```typescript
interface RenderedContent {
  htmlContent: string;    // Pure resume content (no HTML wrapper)
  cssContent: string;     // Complete CSS (context-aware)
  metadata: {
    template: string;
    resumeType: string;
    context: TemplateContext;
  };
}

interface TemplateContext {
  forPDF: boolean;           // PDF vs browser optimization
  template: string;          // Template name (default, modern, etc.)
  includeFonts: boolean;     // Embed fonts for PDF
  includeIcons: boolean;     // Embed icons for PDF
  includeNavigation: boolean; // Include nav for browser only
}
```

### **Component Responsibilities**

| Component | Purpose | Data Source | Reusability |
|-----------|---------|-------------|-------------|
| **Header** | Contact info, name, title | `data/shared/header.json` | High (shared across templates) |
| **Experience** | Job history, descriptions | `data/{type}/experience/` | Medium (template-specific styling) |
| **Skills** | Technical skills, categories | `data/{type}/skills/` | Medium (template-specific layout) |
| **Summary** | Professional summary | `data/{type}/summary/` | Medium (template-specific content) |
| **Navigation** | Dashboard links | Static content | High (shared across templates) |
| **Layout** | Content structure (no HTML wrapper) | Template configuration | High (shared across templates) |

### **Context-Aware Wrapper System**

Create wrapper templates for different output types:

```typescript
class ContentWrapper {
  async wrapForBrowser(content: RenderedContent): Promise<string> {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="styles/shared.css">
  <link rel="stylesheet" href="resumes/styles/default.css">
</head>
<body class="bg-gray-50 font-sans text-gray-900">
  ${content.htmlContent}
</body>
</html>`;
  }

  async wrapForPDF(content: RenderedContent): Promise<string> {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume</title>
  <style>
    ${content.cssContent}
  </style>
</head>
<body>
  ${content.htmlContent}
</body>
</html>`;
  }
}
```

### **Server-Side Renderer Architecture**

```mermaid
sequenceDiagram
    participant Server as Server (Node.js)
    participant Data as Data Loading
    participant Components as Component Renderer
    participant Content as Content Assembly
    participant Wrapper as Context Wrapper
    participant Output as Output Generation

    Server->>Data: Load resume data (JSON + markdown)
    Data->>Components: Pass data to individual components
    Components->>Components: Render each component separately
    Components->>Content: Pass rendered components
    Content->>Content: Assemble pure content (no HTML wrapper)
    Content->>Wrapper: Pass content with context
    Wrapper->>Wrapper: Apply context-specific wrapper
    Wrapper->>Output: Generate browser or PDF optimized output
```

## ⚙️ **Technical Implementation**

### **Component Renderer Service**

```typescript
interface ComponentRenderer {
  renderComponent(
    componentName: string,
    templateName: string,
    data: ResumeData,
    context: TemplateContext
  ): Promise<string>;

  renderContent(
    resumeType: string,
    templateName: string,
    context: TemplateContext
  ): Promise<RenderedContent>;
}

class ResumeComponentRenderer {
  private componentCache: Map<string, HandlebarsTemplateDelegate> = new Map();

  async renderContent(
    resumeType: string,
    templateName: string,
    context: TemplateContext
  ): Promise<RenderedContent> {
    // 1. Load all data
    const data = await this.loadResumeData(resumeType, context);

    // 2. Render individual components
    const components = await this.renderComponents(templateName, data, context);

    // 3. Assemble into pure content (no HTML wrapper)
    const htmlContent = await this.assembleContent(templateName, components, data, context);

    // 4. Get context-aware CSS
    const cssContent = await this.cssManager.getCompleteCSS(context);

    return {
      htmlContent,
      cssContent,
      metadata: {
        template: templateName,
        resumeType,
        context
      }
    };
  }

  private async renderComponents(
    templateName: string,
    data: ResumeData,
    context: TemplateContext
  ): Promise<Map<string, string>> {
    const components = new Map<string, string>();

    // Render each component
    components.set('header', await this.renderComponent('header', templateName, data, context));
    components.set('experience', await this.renderComponent('experience', templateName, data, context));
    components.set('skills', await this.renderComponent('skills', templateName, data, context));
    components.set('summary', await this.renderComponent('summary', templateName, data, context));
    components.set('nav', await this.renderComponent('nav', templateName, data, context));

    return components;
  }
}
```

### **Component Template Examples**

#### **Header Component** (`resumes/default/header.html`)
```handlebars
<div class="pt-6 px-10">
  <h1 class="text-4xl font-semibold mb-2" style="color: {{styling.colors.textPrimary}}">{{header.name}}</h1>
  <p class="text-2xl font-normal mb-3" style="color: {{styling.colors.textAccent}}">{{header.title}}</p>

  <div class="text-sm mt-2" style="color: {{styling.colors.textSecondary}}">
    <div class="flex gap-12">
      <div class="space-y-2">
        <div class="flex items-center">{{{icon "email"}}} <span class="ml-1">{{header.email}}</span></div>
        <div class="flex items-center">{{{icon "location"}}} <span class="ml-1">{{header.location}}</span></div>
      </div>
    </div>
  </div>
</div>
```

#### **Experience Component** (`resumes/default/experience.html`)
```handlebars
<div class="flex-1 px-10 pt-8">
  <h2 class="text-2xl font-bold" style="color: {{styling.colors.textPrimary}}">{{main.experience.title}}</h2>
  <hr class="page-break-line">

  {{#each main.experience.jobs}}
  <div class="{{#if @first}}mt-4{{else}}mt-6{{/if}}">
    <div class="flex justify-between">
      <div>
        <h3 class="font-semibold text-md">{{title}}</h3>
        <p class="text-base font-medium" style="color: {{../styling.colors.textAccent}}">{{company}}</p>
      </div>
      <p class="text-sm">{{startDate}} – {{endDate}}</p>
    </div>
    <div class="text-sm mt-1 markdown-content">{{{markdown content}}}</div>
  </div>
  {{/each}}
</div>
```

#### **Skills Component** (`resumes/default/skills.html`)
```handlebars
<div class="flex-1 px-6">
  {{#if sidebar.skills}}
  <h2 class="text-2xl font-bold">{{sidebar.skills.title}}</h2>
  <hr class="page-break-line">
  <div class="grid grid-cols-1 gap-y-0 text-sm mt-2">
    {{#each sidebar.skills.categories}}
    <div>
      <div class="markdown-content">{{{markdown content}}}</div>
    </div>
    {{/each}}
  </div>
  {{/if}}
</div>
```

#### **Summary Component** (`resumes/default/summary.html`)
```handlebars
<div class="pt-14 px-6">
  <div class="flex justify-center mb-8">
    <img src="{{#if (startsWith sidebar.photo 'data:')}}{{sidebar.photo}}{{else}}{{sidebar.photo}}{{/if}}" alt="Profile photo" class="w-32 rounded-full border-4 border-white">
  </div>
</div>

<div class="flex-1 px-6">
  <h2 class="text-2xl font-bold">{{sidebar.summary.title}}</h2>
  <hr class="page-break-line">
  <div class="text-sm mt-2 markdown-content">{{{markdown sidebar.summary.content}}}</div>
</div>
```

#### **Layout Component** (`resumes/default/layout.html`)
```handlebars
<!-- Pure content layout (no HTML wrapper) -->
<div class="resume-content flex mx-auto bg-white shadow-lg relative max-w-5xl">
  <!-- Dark top trim -->
  <div class="absolute top-0 left-0 w-full h-4 z-10" style="background-color: {{styling.colors.accent}}"></div>

  <!-- Sidebar -->
  <div class="text-white relative flex flex-col w-1/3" style="background-color: {{styling.colors.primary}}">
    {{{component "summary"}}}
    {{{component "skills"}}}
  </div>

  <!-- Main Content -->
  <div class="flex flex-col w-2/3">
    {{{component "header"}}}
    {{{component "experience"}}}
  </div>
</div>
```

### **Technical Implementation Details**

#### **Component Helper Implementation**
```typescript
// Add to UnifiedTemplateEngine.registerHelpers()
Handlebars.registerHelper('component', async function(componentName: string, options: any) {
  const templateName = this.template || 'default';
  const componentTemplate = await this.loadComponentTemplate(componentName, templateName);
  const compiledComponent = Handlebars.compile(componentTemplate);
  return new Handlebars.SafeString(compiledComponent(this));
});
```

#### **Component Loading with Template Overrides**
```typescript
private async loadComponentTemplate(componentName: string, templateName: string = 'default'): Promise<string> {
  // Try template-specific component first
  const templateSpecificPath = path.join(process.cwd(), 'resumes', templateName, `${componentName}.html`);
  if (fs.existsSync(templateSpecificPath)) {
    return await fs.promises.readFile(templateSpecificPath, 'utf-8');
  }

  // Fall back to shared component
  const sharedPath = path.join(process.cwd(), 'resumes', 'components', 'shared', `${componentName}.html`);
  if (fs.existsSync(sharedPath)) {
    return await fs.promises.readFile(sharedPath, 'utf-8');
  }

  throw new Error(`Component not found: ${componentName} for template: ${templateName}`);
}
```

#### **Enhanced RenderedTemplate Interface**
```typescript
export interface RenderedTemplate {
  html: string;           // Complete HTML document (existing)
  htmlContent: string;    // Pure content without HTML wrapper (new)
  css: string;           // Complete CSS (existing)
  data: any;             // Resume data (existing)
  metadata: {
    template: string;
    resumeType: string;
    renderTime: number;
    context: TemplateContext;
  };
}
```

#### **ContentWrapper Service**
```typescript
export class ContentWrapper {
  async wrapForBrowser(content: RenderedTemplate): Promise<string> {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="styles/shared.css">
  <link rel="stylesheet" href="resumes/styles/default.css">
</head>
<body class="bg-gray-50 font-sans text-gray-900">
  ${content.htmlContent}
</body>
</html>`;
  }

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
}
```

#### **Backward Compatibility Method**
```typescript
// Keep existing renderResume() method but add new renderContent() method
async renderContent(resumeType: string, templateName: string, context: TemplateContext): Promise<RenderedTemplate> {
  // New method for component-based rendering
  const content = await this.renderPureContent(resumeType, templateName, context);
  return {
    ...content,
    html: await this.contentWrapper.wrapForBrowser(content)
  };
}

async renderResume(resumeType: string, templateName: string, context: TemplateContext): Promise<RenderedTemplate> {
  // Existing method for backward compatibility
  const content = await this.renderContent(resumeType, templateName, context);
  return this.wrapContent(content, context);
}
```

### **Integration Points**

#### **Browser Route** (`/resume-ssr`)
```typescript
// Current route in server/src/routes/render.ts
router.get('/resume-ssr', async (req: Request, res: Response): Promise<void> => {
  const { resumeType, template = 'default' } = req.query;

  // Render the resume (will use new component system when available)
  const renderedResume = await resumeRenderer.renderResume(resumeType, template as string);

  // Send as HTML page
  res.setHeader('Content-Type', 'text/html');
  res.send(renderedResume.html);
});
```

#### **API Route** (`/api/render-resume`)
```typescript
// Current route in server/src/routes/render.ts
router.get('/render-resume', async (req: Request, res: Response): Promise<void> => {
  const { resumeType, template = 'default' } = req.query;

  // Render the resume (will use new component system when available)
  const renderedResume = await resumeRenderer.renderResume(resumeType, template as string);

  res.json({
    success: true,
    html: renderedResume.html,
    css: renderedResume.css,
    metadata: renderedResume.metadata
  });
});
```

#### **PDF Route** (`/api/generate-pdf`)
```typescript
// Current route in server/src/routes/pdf.ts
router.post('/generate-pdf', validateResumeType, async (req: Request, res: Response) => {
  const { resumeType, options }: GeneratePDFRequest = req.body;

  // Use existing PDFGenerator (will use new component system when available)
  const result = await pdfGenerator.generatePDF(resumeType, options, req.correlationId);

  if (result.success) {
    const filename = path.basename(result.filePath!);
    const pdfUrl = `/api/download-pdf?file=${encodeURIComponent(filename)}`;

    return res.json({
      success: true,
      pdfUrl,
      generationTime: result.generationTime
    });
  }

  return res.status(500).json({
    success: false,
    error: result.error,
    generationTime: result.generationTime
  });
});
```

### **Backward Compatibility Strategy**

The implementation maintains backward compatibility by:

1. **Preserving Existing Routes**: All current routes (`/api/render-resume`, `/resume-ssr`, `/api/generate-pdf`) continue to work
2. **Maintaining Template Discovery**: `getAvailableTemplates()` continues to find `resumes/default.html`
3. **Gradual Migration**: New component system is additive, not replacing existing functionality
4. **Template Fallback**: If component-based template doesn't exist, fall back to monolithic template
5. **Data Structure Compatibility**: All existing data structures and Handlebars helpers remain unchanged

## 📋 **Implementation Requirements**

### **Core Features**

1. **Component-Based Architecture**
   - Separate HTML files for each resume section
   - Reusable components across different templates
   - Isolated testing and maintenance
   - Clear separation of concerns

2. **Unified Content Pipeline**
   - Generate pure content (no HTML wrapper)
   - Context-aware CSS assembly
   - Single source of truth for content generation
   - Flexible wrapper system for different outputs

3. **Context-Aware Wrapper System**
   - Browser-optimized wrapper with external resources
   - PDF-optimized wrapper with embedded assets
   - Maintain identical visual output
   - Easy to add new output types

4. **Template Flexibility**
   - Support multiple template variants
   - Shared components across templates
   - Template-specific component overrides
   - Easy template creation and modification

## 🧪 **Implementation Plan**

### **Phase 1: Unified Content Pipeline**

| Step | Task | Description | Status |
|------|------|-------------|--------|
| 1 | Enhance RenderedTemplate Interface | Extend existing `RenderedTemplate` to include `htmlContent` (pure content) and `html` (complete document) | TODO |
| 2 | Extract ContentWrapper System | Extract `PDFGenerator.createCompleteHTML()` logic into dedicated `ContentWrapper` service | TODO |
| 3 | Add Component Injection Helper | Implement Handlebars helper for `{{{component "name"}}}` syntax with template override support | TODO |
| 4 | Update UnifiedTemplateEngine | Add `renderContent()` method for pure content generation while maintaining `renderResume()` for backward compatibility | TODO |
| 5 | Test Backward Compatibility | Verify existing `/api/render-resume` and `/resume-ssr` routes continue working | TODO |

### **Phase 2: Component Extraction**

| Step | Task | Description | Status |
|------|------|-------------|--------|
| 6 | Extract Header Component | Parse lines 47-67 from `resumes/default.html` into `resumes/default/header.html` | TODO |
| 7 | Extract Experience Component | Parse lines 69-85 from `resumes/default.html` into `resumes/default/experience.html` | TODO |
| 8 | Extract Skills Component | Parse lines 25-45 from `resumes/default.html` into `resumes/default/skills.html` | TODO |
| 9 | Extract Summary Component | Parse lines 20-24 from `resumes/default.html` into `resumes/default/summary.html` | TODO |
| 10 | Create Layout Template | Build `resumes/default/layout.html` with component injection syntax | TODO |
| 11 | Update Template Discovery | Modify `getAvailableTemplates()` to support component-based templates | TODO |
| 12 | Test Component Isolation | Verify each component renders correctly in isolation | TODO |

### **Phase 3: Layout Assembly**

| Step | Task | Description | Status |
|------|------|-------------|--------|
| 13 | Implement Component Loading | Add `loadComponentTemplate()` method with template-specific override support | TODO |
| 14 | Add Template Override System | Implement fallback logic: template-specific → shared component → error | TODO |
| 15 | Update CSS Assembly | Ensure `CSSManager` supports component-based template contexts | TODO |
| 16 | Test Layout Assembly | Verify components assemble correctly in layout template | TODO |
| 17 | Maintain Backward Compatibility | Ensure existing templates continue to work during transition | TODO |

### **Phase 4: Template Variants**

| Step | Task | Description | Status |
|------|------|-------------|--------|
| 18 | Create Modern Template | Build `resumes/modern/` template variant with different styling and layout | TODO |
| 19 | Create Classic Template | Build `resumes/classic/` template variant with traditional resume styling | TODO |
| 20 | Create Compact Template | Build `resumes/compact/` template variant for space-constrained scenarios | TODO |
| 21 | Implement Template Overrides | Add system for template-specific component overrides | TODO |
| 22 | Test Template Switching | Verify users can switch between different template variants | TODO |
| 23 | Add Shared Component System | Implement shared components that work across all template variants | TODO |

### **Phase 5: Optimization**

| Step | Task | Description | Status |
|------|------|-------------|--------|
| 24 | Implement Component Caching | Add caching system for compiled Handlebars templates | TODO |
| 25 | Optimize Rendering Performance | Profile and optimize component rendering speed | TODO |
| 26 | Add Component Testing Framework | Create testing utilities for individual component validation | TODO |
| 27 | Improve Developer Experience | Add documentation, examples, and development tools | TODO |
| 28 | Performance Monitoring | Add metrics and monitoring for component rendering performance | TODO |
| 29 | Final Integration Testing | Comprehensive testing of all components and templates | TODO |
