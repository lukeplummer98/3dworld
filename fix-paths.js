// Fix path references for CollisionManager.js 
// This is a small script to update import paths automatically
const fs = require('fs');
const path = require('path');

// Base directory
const baseDir = '.';

// Files to check for incorrect imports
const targetFiles = [
  './js/VirtualWorldGame.js',
  './external.html',
  './index.html'
];

console.log('Checking for incorrect import paths...');

// Check each file
targetFiles.forEach(filePath => {
  try {
    const fullPath = path.join(baseDir, filePath);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${fullPath}`);
      return;
    }
    
    // Read file content
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;
    
    // Replace incorrect paths
    const replacements = [
      {
        from: 'js/systems/CollisionManager.js',
        to: 'js/physics/CollisionManager.js'
      },
      {
        from: './systems/CollisionManager.js',
        to: './physics/CollisionManager.js'
      },
      {
        from: '"./systems/CollisionManager"',
        to: '"./physics/CollisionManager"'
      },
      {
        from: 'from "./systems/CollisionManager"',
        to: 'from "./physics/CollisionManager"'
      },
      {
        from: "from './systems/CollisionManager'",
        to: "from './physics/CollisionManager'"
      }
    ];
    
    let changes = 0;
    
    // Apply each replacement
    replacements.forEach(({ from, to }) => {
      if (content.includes(from)) {
        content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
        changes++;
      }
    });
    
    // If changes were made, write file
    if (changes > 0) {
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Updated ${filePath}: ${changes} path references fixed`);
    } else {
      console.log(`✓ No incorrect paths found in ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
});

console.log('\nDone. Path references have been fixed.');
