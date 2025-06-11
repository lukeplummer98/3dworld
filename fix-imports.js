// Update imports in all JavaScript files
const fs = require('fs');
const path = require('path');

// Recursively get all JavaScript files
function getJsFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            getJsFiles(filePath, fileList);
        } else if (file.endsWith('.js')) {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

// Get all JavaScript files
console.log('Finding all JavaScript files...');
const jsFiles = getJsFiles('./js');
console.log(`Found ${jsFiles.length} JavaScript files.`);

// Process each file
jsFiles.forEach(filePath => {
    // Read the file
    console.log(`Processing ${filePath}...`);
    let content = fs.readFileSync(filePath, 'utf8');

// Fix import for CollisionManager
console.log('Updating import for CollisionManager...');

    // Path corrections to apply
    const pathCorrections = [
        {
            incorrect: './systems/CollisionManager.js',
            correct: './physics/CollisionManager.js'
        },
        {
            incorrect: './systems/CollisionManager',
            correct: './physics/CollisionManager'
        },
        {
            incorrect: '/systems/CollisionManager.js',
            correct: '/physics/CollisionManager.js'
        },
        {
            incorrect: 'systems/CollisionManager.js',
            correct: 'physics/CollisionManager.js'
        }
    ];
    
    let changed = false;
    
    // Apply each correction
    pathCorrections.forEach(correction => {
        if (content.includes(correction.incorrect)) {
            console.log(`Found incorrect path in ${filePath}: ${correction.incorrect}`);
            content = content.replace(new RegExp(correction.incorrect.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), correction.correct);
            changed = true;
        }
    });
    
    // If we made changes, write the file
    if (changed) {
        console.log(`Updating file: ${filePath}`);
        fs.writeFileSync(filePath, content);
        console.log(`✓ File updated: ${filePath}`);
    }
});

console.log('All files processed. Import paths have been fixed!');
