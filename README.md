# Dynamic Multi-Resume System

A modern, dynamic resume system that supports multiple resume variants optimized for different job types. Built with HTML, CSS, and JavaScript with comprehensive validation and CI/CD integration.

## Features

### 🎯 Multi-Resume Support
- **Multiple resume types** for different job roles (Engineering Manager, AI Lead, Staff Platform Engineer)
- **Resume-specific content** with tailored skills and experience descriptions
- **Shared assets** (header, styling, images) referenced by all resume types
- **Dashboard interface** for easy resume selection and navigation

### 📋 Content Management
- **Markdown-based content** for easy editing and version control
- **Structured data** with JSON schema validation
- **Modular organization** with separate directories for each resume type
- **Shared components** to avoid duplication

### 🔧 Development Tools
- **Real-time validation** in VSCode with IntelliSense
- **Local validation scripts** for development
- **CI/CD integration** with GitHub Actions
- **Schema enforcement** ensuring data integrity

## Quick Start

### View Resumes
1. Visit the root URL `/` - automatically redirects to dashboard
2. Select a resume type from the dashboard
3. View the clean, print-friendly resume
4. Print or save as PDF for job applications

### Development Setup
```bash
# Install dependencies
npm install

# Validate all resume files
npm run validate

# Watch for changes and validate automatically
npm run validate:watch
```

## Project Structure

```
resume/
├── index.html                     # Root redirect to dashboard
├── dashboard/                     # Resume dashboard
│   ├── index.html                # Dashboard interface
│   ├── styles.css                # Dashboard styling
│   └── script.js                 # Dashboard functionality
├── resume.html                   # Main resume template
├── data/                         # Multi-resume data directory
│   ├── staff_platform_engineer/  # Staff Platform Engineer resume
│   │   ├── skills/              # Resume-specific skills
│   │   ├── experience/          # Resume-specific experience
│   │   ├── summary/             # Resume-specific summary
│   │   └── resume.json         # Resume configuration
│   ├── eng_mgr/                 # Engineering Manager resume
│   │   ├── skills/
│   │   ├── experience/
│   │   ├── summary/
│   │   └── resume.json
│   ├── ai_lead/                 # AI Lead resume
│   │   ├── skills/
│   │   ├── experience/
│   │   ├── summary/
│   │   └── resume.json
│   └── shared/                  # Shared assets
│       ├── assets/              # Images and media
│       │   └── justin_green.jpeg
│       ├── header.json          # Shared header data
│       ├── styling.json         # Shared styling data
│       └── schemas/             # JSON schemas
│           └── resume-schema.json
├── scripts/                     # Validation scripts
│   └── validate-resume.js
├── docs/                        # Documentation
│   └── validation.md
├── .vscode/                     # VSCode configuration
│   └── settings.json
├── .github/                     # CI/CD workflows
│   └── workflows/
│       └── validate-resume-schema.yml
└── package.json                 # Dependencies and scripts
```

## Resume Types

### Staff Platform Engineer
- **Focus**: Platform engineering, infrastructure, SRE
- **Skills**: Cloud infrastructure, SRE, secrets management, edge compute
- **Experience**: Full career progression with platform focus

### Engineering Manager
- **Focus**: Leadership, team management, strategic decisions
- **Skills**: Engineering management, leadership, technical strategy
- **Experience**: Management and leadership roles

### AI Lead
- **Focus**: AI/ML infrastructure, model deployment, scalable ML systems
- **Skills**: AI/ML infrastructure, cloud platforms, edge computing
- **Experience**: Technical roles with AI/ML emphasis

## User Experience

### Dashboard Interface
- **Entry Point**: Visit `/` to access the resume dashboard
- **Resume Discovery**: Automatically detects and displays all available resume types
- **Clean Navigation**: Simple card-based interface for resume selection
- **Error Handling**: Graceful error states with retry functionality

### Individual Resume Pages
- **Clean Design**: Print-optimized without navigation clutter
- **URL Parameters**: Access specific resumes via `resume.html?type=X`
- **PDF Ready**: Optimized for PDF generation and printing
- **Responsive**: Works on all devices and screen sizes

## Content Management

### Adding New Resume Types
1. Create directory: `data/new_type/`
2. Add content files: `skills/`, `experience/`, `summary/`
3. Create `resume.json` following the schema
4. Update dashboard script to include new type
5. Run validation: `npm run validate`

### Editing Content
- **Skills**: Edit markdown files in `data/{type}/skills/`
- **Experience**: Edit markdown files in `data/{type}/experience/`
- **Summary**: Edit markdown files in `data/{type}/summary/`
- **Configuration**: Edit `resume.json` files (validated against schema)

### Shared Assets
- **Header**: Edit `data/shared/header.json` for contact info
- **Styling**: Edit `data/shared/styling.json` for colors and layout
- **Images**: Add to `data/shared/assets/` and reference in resume.json

## Technical Implementation

### Dashboard Features
- **Dynamic Discovery**: Scans `data/` directory for resume types
- **Metadata Extraction**: Reads resume configuration and header data
- **Error Handling**: Graceful fallbacks for missing or invalid data
- **Responsive Design**: Modern card-based interface

### Resume Template Features
- **Alpine.js** for reactive UI
- **Tailwind CSS** for styling
- **Marked.js** for markdown rendering
- **Responsive design** for all devices
- **Print optimization** for PDF generation
- **URL Parameter Support**: `?type=X` for specific resume loading

### Validation System
- **VSCode Integration**: Real-time validation and IntelliSense with error highlighting and auto-completion
- **Local Validation**: `npm run validate` for all files, `npm run validate:watch` for development
- **CI/CD Validation**: GitHub Actions workflow validates on every push/PR, ensuring schema compliance and data integrity

### Schema Validation
- JSON Schema Draft-07 compliance
- Required field validation
- File path pattern matching
- Type checking and constraints

### File Path Patterns
- Photo: `^shared/assets/.+\.(jpeg|jpg|png)$`
- Summary: `^summary/.+\.md$`
- Skills: `^skills/.+\.md$`
- Experience: `^experience/.+\.md$`

## Development

### Prerequisites
- Node.js >= 16.0.0
- Modern web browser
- VSCode (recommended)

### Setup
```bash
# Clone repository
git clone <repository-url>
cd resume

# Install dependencies
npm install

# Validate setup
npm run validate
```

### Workflow
1. Edit content in markdown files
2. Update resume.json configuration
3. Run validation: `npm run validate`
4. Test dashboard: visit `/` or `/dashboard/`
5. Test individual resumes: `resume.html?type=X`
6. Commit changes (CI will validate)

## Documentation

- [Validation Guide](docs/validation.md) - Comprehensive validation documentation
- [Schema Reference](data/shared/schemas/resume-schema.json) - JSON schema definition
- [GitHub Actions](.github/workflows/validate-resume-schema.yml) - CI/CD configuration

## License

This project is open source and available under the MIT License.
