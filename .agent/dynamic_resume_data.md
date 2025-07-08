# Dynamic Resume Data Structure

## Problem Statement

Currently, the resume system uses a single `resume.json` file with hardcoded paths to `experience/` and `skills/` directories. This limits the ability to create multiple resume variants optimized for different job types.

## Required Change

Transform the current single-resume structure into a multi-resume system that supports:

1. **Multiple resume types** (e.g., Engineering Manager, AI Agent Infrastructure Lead)
2. **Resume-specific content** with tailored skills and experience descriptions
3. **Shared assets** (header, styling, images) referenced by all resume types
4. **Schema validation** to ensure JSON compatibility with the existing `resume.html` template

> **Note:** There is no migration or backwards compatibility. The new structure fully replaces the old.

## Directory Structure (Single Source of Truth)

```tree
resume/
├── data/
│   ├── eng_mgr/
│   │   ├── skills/
│   │   ├── experience/
│   │   ├── summary/
│   │   └── resume.json
│   ├── ai_lead/
│   │   ├── skills/
│   │   ├── experience/
│   │   ├── summary/
│   │   └── resume.json
│   └── shared/
│       ├── assets/
│       │   └── justin_green.jpeg
│       ├── header.json      # Shared header data (referenced, not duplicated)
│       ├── styling.json     # Shared styling data (referenced, not duplicated)
│       └── schemas/
│           └── resume-schema.json
└── resume.html
```

## Shared Assets: Header & Styling

- `header.json` and `styling.json` are **single, shared files** in `data/shared/`.
- Each `resume.json` references these shared files; they are **not duplicated** in each resume type.
- All image assets are stored in `data/shared/assets/` and referenced by path.

## JSON Schema (Key Excerpt)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["sidebar", "main"],
  "properties": {
    "sidebar": {
      "type": "object",
      "required": ["photo", "summary", "skills"],
      "properties": {
        "photo": { "type": "string", "pattern": "^shared/assets/.+\\.(jpeg|jpg|png)$" },
        "summary": {
          "type": "object",
          "required": ["title", "markdownPath"],
          "properties": {
            "title": { "type": "string", "minLength": 1 },
            "markdownPath": { "type": "string", "pattern": "^summary/.+\\.md$" }
          }
        },
        "skills": {
          "type": "object",
          "required": ["title", "categories"],
          "properties": {
            "title": { "type": "string", "minLength": 1 },
            "categories": {
              "type": "array",
              "items": {
                "type": "object",
                "required": ["name", "markdownPath"],
                "properties": {
                  "name": { "type": "string", "minLength": 1 },
                  "markdownPath": { "type": "string", "pattern": "^skills/.+\\.md$" }
                }
              }
            }
          }
        }
      }
    },
    "main": {
      "type": "object",
      "required": ["experience"],
      "properties": {
        "experience": {
          "type": "object",
          "required": ["title", "jobs"],
          "properties": {
            "title": { "type": "string", "minLength": 1 },
            "jobs": {
              "type": "array",
              "items": {
                "type": "object",
                "required": ["title", "company", "startDate", "endDate", "markdownPath"],
                "properties": {
                  "title": { "type": "string", "minLength": 1 },
                  "company": { "type": "string", "minLength": 1 },
                  "startDate": { "type": "string", "minLength": 1 },
                  "endDate": { "type": "string", "minLength": 1 },
                  "markdownPath": { "type": "string", "pattern": "^experience/.+\\.md$" }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

## Validation & Workflow

- **VSCode**: JSON schema in `data/shared/schemas/resume-schema.json` provides real-time validation and IntelliSense for all `resume.json` files.
- **CI**: GitHub Actions lints all `resume.json` files against the schema on PRs.
- **No runtime validation**: `resume.html` assumes valid data.

---

See `.agent/resume_dashboard.md` for dashboard requirements.

## Phase-by-Phase Implementation Plan

| Phase | Task | Description | Status |
|-------|------|-------------|--------|
| 1 | Schema Design | Create JSON schema for resume structure with validation rules | ✅ COMPLETE |
| 2 | Directory Restructure | Create new directory structure with `data/` folder and resume type subdirectories | ✅ COMPLETE |
| 3 | Shared Assets Setup | Move and organize shared assets (header, styling, images) to `data/shared/` | ✅ COMPLETE |
| 4 | Resume Type Creation | Create initial resume types (eng_mgr, ai_lead) with basic structure | ✅ COMPLETE |
| 5 | Content Migration | Migrate existing content from current structure to new multi-resume format | ✅ COMPLETE |
| 6 | Template Updates | Update `resume.html` to work with new directory structure and JSON schema | TODO |
| 7 | Validation Setup | Implement VSCode schema validation and CI linting | TODO |
| 8 | Testing & Refinement | Test all resume types and refine content for each variant | TODO |
| 9 | Documentation | Update README and create usage documentation | TODO |
| 10 | Dashboard Integration | Integrate with resume dashboard requirements | TODO |
