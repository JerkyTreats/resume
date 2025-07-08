#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

// Initialize Ajv
const ajv = new Ajv({
  allErrors: true,
  verbose: true
});

// Load the schema
const schemaPath = path.join(__dirname, '../data/shared/schemas/resume-schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

// Compile the validator
const validate = ajv.compile(schema);

// Function to validate a resume.json file
function validateResumeFile(filePath) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const valid = validate(data);

    if (valid) {
      console.log(`✅ ${filePath} is valid`);
      return true;
    } else {
      console.log(`❌ ${filePath} is invalid:`);
      console.log(JSON.stringify(validate.errors, null, 2));
      return false;
    }
  } catch (error) {
    console.log(`❌ Error reading ${filePath}: ${error.message}`);
    return false;
  }
}

// Function to validate shared JSON files
function validateSharedFile(filePath) {
  try {
    JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`✅ ${filePath} is valid JSON`);
    return true;
  } catch (error) {
    console.log(`❌ ${filePath} is invalid JSON: ${error.message}`);
    return false;
  }
}

// Main validation function
function main() {
  console.log('🔍 Validating resume schema...\n');

  let allValid = true;

  // Validate all resume.json files
  const dataDir = path.join(__dirname, '../data');
  const resumeTypes = fs.readdirSync(dataDir).filter(dir => {
    return fs.statSync(path.join(dataDir, dir)).isDirectory() && dir !== 'shared';
  });

  for (const resumeType of resumeTypes) {
    const resumePath = path.join(dataDir, resumeType, 'resume.json');
    if (fs.existsSync(resumePath)) {
      if (!validateResumeFile(resumePath)) {
        allValid = false;
      }
    }
  }

  console.log('\n🔍 Validating shared JSON files...\n');

  // Validate shared files
  const sharedDir = path.join(dataDir, 'shared');
  const sharedFiles = ['header.json', 'styling.json'];

  for (const file of sharedFiles) {
    const filePath = path.join(sharedDir, file);
    if (fs.existsSync(filePath)) {
      if (!validateSharedFile(filePath)) {
        allValid = false;
      }
    }
  }

  console.log('\n' + (allValid ? '✅ All files are valid!' : '❌ Some files are invalid!'));

  process.exit(allValid ? 0 : 1);
}

// Run validation
main();
