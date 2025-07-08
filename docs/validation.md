# Resume Validation

This document describes the validation setup for the dynamic resume system.

## Overview

The resume system uses JSON Schema validation to ensure all resume.json files conform to the expected structure. Validation is available in multiple forms:

1. **VSCode Integration** - Real-time validation and IntelliSense
2. **Local Validation** - Command-line validation script
3. **CI/CD Validation** - GitHub Actions workflow

## VSCode Integration

### Setup

The `.vscode/settings.json` file configures VSCode to use the resume schema for validation:

```json
{
  "json.schemas": [
    {
      "fileMatch": ["data/*/resume.json"],
      "url": "./data/shared/schemas/resume-schema.json"
    }
  ]
}
```

### Features

- **Real-time validation** - Errors are highlighted as you type
- **IntelliSense** - Auto-completion and suggestions
- **Hover information** - Schema details on hover
- **Format on save** - Automatic JSON formatting

## Local Validation

### Installation

```bash
npm install
```

### Usage

```bash
# Validate all resume files
npm run validate

# Watch for changes and validate automatically
npm run validate:watch
```

### Manual Validation

```bash
# Validate a specific file
node scripts/validate-resume.js
```

## CI/CD Validation

### GitHub Actions

The `.github/workflows/validate-resume-schema.yml` workflow runs on:

- Push to main branch
- Pull requests to main branch
- Changes to `data/**/*.json` files
- Changes to schema files

### What it validates

1. **Resume JSON files** - All `data/*/resume.json` files against the schema
2. **Shared JSON files** - `header.json` and `styling.json` for valid JSON syntax
3. **Schema compliance** - Ensures all required fields and patterns are correct

## Schema Structure

The resume schema enforces:

### Required Structure
- `sidebar` object with `photo`, `summary`, and `skills`
- `main` object with `experience`

### File Path Patterns
- Photo: `^shared/assets/.+\.(jpeg|jpg|png)$`
- Summary: `^summary/.+\.md$`
- Skills: `^skills/.+\.md$`
- Experience: `^experience/.+\.md$`

### Validation Rules
- All required fields must be present
- String fields must have minimum length of 1
- File paths must match specified patterns
- Arrays must contain valid objects

## Error Handling

### Common Errors

1. **Missing required fields** - Add the missing field
2. **Invalid file paths** - Ensure paths match the pattern
3. **Invalid JSON syntax** - Check for syntax errors
4. **Schema violations** - Review the schema requirements

### Debugging

```bash
# Get detailed validation errors
npm run validate

# Check specific file
node scripts/validate-resume.js
```

## Adding New Resume Types

1. Create the directory structure: `data/new_type/`
2. Add content files: `skills/`, `experience/`, `summary/`
3. Create `resume.json` following the schema
4. Run validation: `npm run validate`

## Troubleshooting

### VSCode not showing validation

1. Ensure the `.vscode/settings.json` file exists
2. Reload VSCode window
3. Check that the schema file exists at the specified path

### Validation script errors

1. Ensure Node.js version >= 16
2. Run `npm install` to install dependencies
3. Check file permissions on the script

### CI/CD failures

1. Check the GitHub Actions logs
2. Run local validation to reproduce the issue
3. Ensure all JSON files are valid
4. Verify schema compliance
