#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Read tree-sitter.json
const treeSitterJsonPath = path.join(__dirname, '..', 'tree-sitter.json');
const treeSitterJson = JSON.parse(fs.readFileSync(treeSitterJsonPath, 'utf8'));

// Ensure metadata object exists
if (!treeSitterJson.metadata) {
  treeSitterJson.metadata = {};
}

// Track changes
const changes = [];

// Sync version
if (treeSitterJson.metadata.version !== packageJson.version) {
  changes.push(`version: ${treeSitterJson.metadata.version || '(none)'} → ${packageJson.version}`);
  treeSitterJson.metadata.version = packageJson.version;
}

// Sync license
if (treeSitterJson.metadata.license !== packageJson.license) {
  changes.push(`license: ${treeSitterJson.metadata.license || '(none)'} → ${packageJson.license}`);
  treeSitterJson.metadata.license = packageJson.license;
}

// Sync description
if (treeSitterJson.metadata.description !== packageJson.description) {
  changes.push(`description: ${treeSitterJson.metadata.description || '(none)'} → ${packageJson.description}`);
  treeSitterJson.metadata.description = packageJson.description;
}

// Write back to tree-sitter.json if there are changes
if (changes.length > 0) {
  fs.writeFileSync(treeSitterJsonPath, JSON.stringify(treeSitterJson, null, 2) + '\n');
  console.log('✓ Updated tree-sitter.json metadata:');
  changes.forEach(change => console.log(`  - ${change}`));
} else {
  console.log('✓ tree-sitter.json metadata is already in sync with package.json');
}

process.exit(0);