# Resume Dashboard

## Overview

With multiple resumes to be rendered, we need to create a lightweight Resume Dashboard that serves as the entry point for accessing different resume types.

## Expected Directory Tree

```
resume/
├── dashboard/
│   ├── index.html
│   ├── styles.css
│   └── script.js
└── data/
    ├── eng_mgr/
    │   └── resume.json
    ├── ai_lead/
    │   └── resume.json
    └── shared/
        ├── assets/
        │   └── justin_green.jpeg
        └── templates/
            └── resume.html
```

## Dashboard Requirements

### 1. Dashboard Structure
- **Location**: `dashboard/` directory at root level
- **Components**:
  - `index.html`: Main dashboard page
  - `styles.css`: Dashboard styling
  - `script.js`: Dashboard functionality

### 2. Dashboard Functionality
- **Resume Discovery**: Automatically scan `data/` directory for resume types
- **Dynamic Listing**: Generate hyperlinks for each discovered resume
- **Requirements**:
  - Scan for directories containing `resume.json` files
  - Extract resume metadata (name, title) for display
  - Generate clean URLs for each resume type

### 3. Navigation & Routing
- **Dashboard**: Entry point with resume selection
- **Resume Pages**: Direct links to rendered `resume.html` for each type
- **Requirements**:
  - No navigation elements on individual resume pages
  - Clean URLs (e.g., `/eng_mgr`, `/ai_lead`)
  - Print-friendly resume pages

### 4. Implementation Considerations
- **Static Generation**: Pre-generate all resume HTML files
- **File Organization**: Each resume type gets its own rendered HTML file
- **URL Structure**:
  - Dashboard: `/dashboard/` or `/`
  - Resume pages: `/eng_mgr.html`, `/ai_lead.html`
- **Print Optimization**: Ensure resume pages are optimized for PDF generation

### 5. Validation Requirements
- **JSON Schema**: Validate all `resume.json` files against expected schema
- **Path Validation**: Ensure all markdown paths exist and are accessible
- **Asset Validation**: Verify all referenced assets exist in shared directory
- **Error Handling**: Graceful handling of missing files or invalid JSON

## User Experience

The dashboard should provide a clean, simple interface that:
1. Lists all available resume types with their titles
2. Provides direct links to view each resume
3. Maintains the print-friendly nature of individual resume pages
4. Handles errors gracefully if resume data is missing or invalid
