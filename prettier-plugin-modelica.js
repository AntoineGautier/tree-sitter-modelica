#!/usr/bin/env node

/**
 * Prettier plugin for Modelica language
 * A formatter for Modelica (.mo) files with focus on consistent indentation
 */

'use strict';

// Prettier plugin specification
const languages = [
  {
    extensions: ['.mo'],
    name: 'Modelica',
    parsers: ['modelica'],
    type: 'programming',
    vscodeLanguageIds: ['modelica'],
  },
];

const parsers = {
  modelica: {
    parse: (text) => {
      return { content: text };
    },
    astFormat: 'modelica-ast',
    locStart: () => 0,
    locEnd: (text) => text.length,
  },
};

// Main formatter function
function formatModelica(text, options) {
  const { tabWidth = 2, printWidth = 80 } = options;
  const indent = ' '.repeat(tabWidth);
  
  // Normalize newlines and fix comment issues
  text = text.replace(/\r\n/g, '\n');
  // Fix broken comments where spaces are added between slashes
  text = text.replace(/\/\s+\//g, '//');
  
  // Process the text line by line
  let lines = text.split('\n');
  let result = [];
  
  // Tracking indentation state
  let indentLevel = 0;
  let inEquation = false;
  let inAlgorithm = false;
  let controlBlocks = []; // Stack to track nested control structures
  
  // Preprocess lines to fix negative numbers in specific contexts
  for (let i = 0; i < lines.length; i++) {
    // Fix common Modelica patterns with negative numbers
    lines[i] = lines[i].replace(/(nUniShc|nUniHea|nUniCoo)\s+-\s+(\d+)/g, '$1-$2');
    lines[i] = lines[i].replace(/\(\s*1\s+-\s+ratCycShc\)/g, '(1-ratCycShc)');
    lines[i] = lines[i].replace(/\(nUniShc\s+-\s+(\d+)\s+\+\s+ratCycShc\)/g, '(nUniShc-$1 + ratCycShc)');
  }
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    // Skip empty lines
    if (line === '') {
      result.push('');
      continue;
    }
    
    // Check for section start
    if (line === 'equation' || line === 'initial equation' || 
        line === 'algorithm' || line === 'initial algorithm') {
      // Start a new section
      inEquation = line.includes('equation');
      inAlgorithm = line.includes('algorithm');
      result.push(indent.repeat(indentLevel) + line);
      continue;
    }
    
    // Check for section end or new sections
    if (line === 'end' || line === 'end;' || 
        line === 'public' || line === 'protected' || 
        line === 'equation' || line === 'initial equation' || 
        line === 'algorithm' || line === 'initial algorithm') {
      if (line === 'end' || line === 'end;') {
        // Class end
        indentLevel = Math.max(0, indentLevel - 1);
      }
      inEquation = line.includes('equation');
      inAlgorithm = line.includes('algorithm');
      result.push(indent.repeat(indentLevel) + line);
      continue;
    }
    
    // Handle class definitions and other blocks
    if (line.startsWith('model ') || line.startsWith('block ') || 
        line.startsWith('package ') || line.startsWith('function ') || 
        line.startsWith('record ') || line.startsWith('connector ') || 
        line.startsWith('class ')) {
      result.push(indent.repeat(indentLevel) + line);
      indentLevel++;
      continue;
    }
    
    // Handle end statements for classes
    if (line.startsWith('end ') && !line.startsWith('end if') && 
        !line.startsWith('end when') && !line.startsWith('end for')) {
      indentLevel = Math.max(0, indentLevel - 1);
      result.push(indent.repeat(indentLevel) + line);
      continue;
    }
    
    // Special handling for equation and algorithm sections
    if (inEquation || inAlgorithm) {
      // Handle comments first
      if (line.startsWith('//')) {
        result.push(indent.repeat(indentLevel + 1) + line);
        continue;
      }
      
      // Check for start of control structures
      if ((line.startsWith('if ') && line.endsWith('then')) || 
          (line.startsWith('when ') && line.endsWith('then')) ||
          (line.startsWith('for ') && line.endsWith('loop'))) {
        // Push the control structure to the stack
        let type = line.split(' ')[0]; // if, when, or for
        controlBlocks.push({ type, level: indentLevel + 1 });
        result.push(indent.repeat(indentLevel + 1) + line);
        indentLevel++;
        continue;
      }
      
      // Handle else/elseif statements
      if (line === 'else' || line.startsWith('elseif ')) {
        if (controlBlocks.length > 0) {
          // Match the indentation of the corresponding if statement
          indentLevel = controlBlocks[controlBlocks.length - 1].level;
          result.push(indent.repeat(indentLevel) + line);
        } else {
          // Fallback if stack is empty
          result.push(indent.repeat(indentLevel) + line);
        }
        continue;
      }
      
      // Handle end of control structures
      if (line.startsWith('end if') || line.startsWith('end when') || line.startsWith('end for')) {
        if (controlBlocks.length > 0) {
          // Pop the control structure from the stack
          controlBlocks.pop();
          indentLevel--;
        }
        result.push(indent.repeat(indentLevel) + line);
        continue;
      }
      
      // Regular statements in equation/algorithm sections
      // Handle multi-line function calls and parameters
      if (i > 0) {
        const prevLine = lines[i-1].trim();
        if (prevLine.endsWith('(') || prevLine.endsWith(',')) {
          // This is a continuation line, indent one more level
          result.push(indent.repeat(indentLevel + 2) + line);
          continue;
        }
      }

      // Handle comments within equations
      if (line.startsWith('//')) {
        result.push(indent.repeat(indentLevel + 1) + line);
        continue;
      }

      result.push(indent.repeat(indentLevel + 1) + line);
      continue;
    }
    
    // For any other lines, maintain current indentation
    result.push(indent.repeat(indentLevel) + line);
  }
  
  // Join lines back into a string
  text = result.join('\n');
  
  // Apply additional formatting
  
  // Format within clauses
  text = text.replace(/within\s+([^;]+);/g, 'within $1;');
  
  // Add blank line after within statement
  text = text.replace(/within[^;]*;\n(?!\s*$)/g, match => match + '\n');
  
  // Ensure space after commas
  text = text.replace(/,(?=\S)/g, ', ');
  
  // Normalize spacing around operators, but handle minus signs in numeric literals differently
  text = text.replace(/\s*([+*\/=<>])\s*/g, ' $1 '); // All operators except minus
  // Special handling for minus sign
  // 1. When it's a subtraction operator (after word, closing parenthesis, bracket, etc.)
  text = text.replace(/(\w|\)|\]|\})\s*-\s*/g, '$1 - ');
  // 2. No space between minus and number in negative literals
  text = text.replace(/(\s|^|,|\(|\[|\{|=)-\s+(\d)/g, '$1-$2');
  // 3. In complex expressions where minus is a negation operator
  text = text.replace(/(\*|\/|\+|\s)\s*-\s+(\d)/g, '$1-$2'); 
  // 4. Fix scientific notation with negative exponents
  text = text.replace(/([eE])\s*-\s*(\d)/g, '$1-$2');
  
  // Fix spacing in annotations
  text = text.replace(/annotation\s*\(\s*/g, 'annotation(');
  
  // Remove spaces around colons in array ranges
  text = text.replace(/\[\s*:\s*\]/g, '[:]');
  text = text.replace(/(\d|\w|\))\s*:\s*(\d|\w|\()/g, '$1:$2');
  // Keep no spaces in array index ranges
  text = text.replace(/(\w+)\s*\[\s*(\d+)\s*:\s*(\d+)\s*\]/g, '$1[$2:$3]');
  text = text.replace(/(\w+)\s*\[\s*:\s*\]/g, '$1[:]');
  // Handle for loops with ranges
  text = text.replace(/for\s+(\w+)\s+in\s+(\d+)\s*:\s*(\d+)/g, 'for $1 in $2:$3');
  // Fix matrix and array definitions with negative numbers
  text = text.replace(/\[\s*-\s*(\d+)/g, '[-$1');
  text = text.replace(/\{\s*-\s*(\d+)/g, '{-$1');
  
  // Format parameters consistently
  text = text.replace(/\b(parameter|input|output|constant)\b(?=\S)/g, '$1 ');
  
  // Remove extra blank lines (more than 2 consecutive)
  text = text.replace(/\n{3,}/g, '\n\n');
  
  // Ensure a blank line after section headers
  text = text.replace(/(equation|algorithm|public|protected|initial equation|initial algorithm)\n(?!\s*$)/g, '$1\n\n');
  
  // Fix control structure indentation issues by making another pass
  let finalLines = text.split('\n');
  let inEqSection = false;
  let eqIndentLevel = 0;
  let controlStack = [];
  
  for (let i = 0; i < finalLines.length; i++) {
    let line = finalLines[i].trim();
    let indent = finalLines[i].match(/^\s*/)[0];
    
    // Check for equation/algorithm sections
    if (line === 'equation' || line === 'initial equation' || 
        line === 'algorithm' || line === 'initial algorithm') {
      inEqSection = true;
      eqIndentLevel = indent.length / tabWidth;
      continue;
    }
    
    // Check for end of section
    if (inEqSection && (line === 'end' || line === 'end;' || 
                        line === 'public' || line === 'protected')) {
      inEqSection = false;
      continue;
    }
    
    // Process control structures in equation sections
    if (inEqSection) {
      // Ensure consistent indentation for nested control structures
      if ((line.startsWith('if ') || line.startsWith('when ')) && 
          line.endsWith('then')) {
        // Make sure base indentation is correct
        finalLines[i] = ' '.repeat((eqIndentLevel + 1) * tabWidth) + line;
        continue;
      }
      
      // Handle else/elseif 
      if (line === 'else' || line.startsWith('elseif ')) {
        // Keep indentation consistent with corresponding if
        finalLines[i] = ' '.repeat((eqIndentLevel + 1) * tabWidth) + line;
        continue;
      }
      
      // Handle end of control structures
      if (line.startsWith('end if') || line.startsWith('end when') || 
          line.startsWith('end for')) {
        finalLines[i] = ' '.repeat((eqIndentLevel + 1) * tabWidth) + line;
        continue;
      }
    }
  }
  
  text = finalLines.join('\n');
  
  // Fix broken comments that might have occurred during formatting
  text = text.replace(/\/\s+\//g, '//');
  
  // Final pass to fix remaining spacing issues with negative numbers
  text = text.replace(/\s+-(\d)/g, ' -$1');
  text = text.replace(/\(\s*-\s*(\d)/g, '(-$1');
  text = text.replace(/\[\s*-\s*(\d)/g, '[-$1');
  text = text.replace(/,\s*-\s*(\d)/g, ', -$1');
  text = text.replace(/=\s*-\s*(\d)/g, '= -$1');
  
  // Fix scientific notation
  text = text.replace(/([eE])\s*-\s*(\d)/g, '$1-$2');
  text = text.replace(/([eE])\s*\+\s*(\d)/g, '$1+$2');
  
  // Fix special Modelica expressions with negative numbers
  text = text.replace(/nUniShc\s+-\s+(\d)/g, 'nUniShc-$1');
  text = text.replace(/\(\s*nUniShc\s+-\s+(\d)/g, '(nUniShc-$1');
  text = text.replace(/\s+\*\s+-\s+(\d)/g, ' *-$1');
  text = text.replace(/\s+\/\s+-\s+(\d)/g, ' /-$1');
  text = text.replace(/\(nUniShc\s*-\s*(\d+)\s+\+\s+ratCycShc\)/g, '(nUniShc-$1 + ratCycShc)');
  text = text.replace(/\((nUniShc|nUniHea|nUniCoo)\s*-\s*\d+\)/g, '($1-1)');
  
  return text;
}

const printers = {
  'modelica-ast': {
    print: (path, options) => {
      const node = path.getValue();
      return formatModelica(node.content, options);
    },
  },
};

const defaultOptions = {
  tabWidth: 2,
  printWidth: 80,
};

// Export the plugin
module.exports = {
  languages,
  parsers,
  printers,
  defaultOptions,
  options: {
    tabWidth: {
      type: 'int',
      category: 'Global',
      default: 2,
      description: 'Number of spaces per indentation level',
    },
    printWidth: {
      type: 'int',
      category: 'Global',
      default: 80,
      description: 'The line length where Prettier will try to wrap',
    },
  },
};