/**
 * Script to generate PWA icons from source image
 * This script requires sharp to be installed: npm install --save-dev sharp
 * 
 * Usage: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('Error: sharp package is not installed.');
  console.error('Please install it by running: npm install --save-dev sharp');
  console.error('');
  console.error('Alternatively, you can manually create icon files:');
  console.error('  - icon-192x192.png (192x192 pixels)');
  console.error('  - icon-512x512.png (512x512 pixels)');
  console.error('  - icon-96x96.png (96x96 pixels)');
  console.error('');
  console.error('And update manifest.json to reference these files.');
  process.exit(1);
}

const sourceIcon = path.join(__dirname, '../src/public/favicon.png');
const outputDir = path.join(__dirname, '../src/public');
const sizes = [
  { size: 192, name: 'icon-192x192.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 96, name: 'icon-96x96.png' },
];

async function generateIcons() {
  try {
    // Check if source exists
    if (!fs.existsSync(sourceIcon)) {
      console.error(`Source icon not found: ${sourceIcon}`);
      process.exit(1);
    }

    console.log('Generating PWA icons...');
    
    // Generate icons for each size
    for (const { size, name } of sizes) {
      const outputPath = path.join(outputDir, name);
      await sharp(sourceIcon)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      console.log(`✓ Generated ${name} (${size}x${size})`);
    }

    console.log('');
    console.log('Icons generated successfully!');
    console.log('Please update manifest.json to use the new icon files:');
    console.log('  - /icon-192x192.png for 192x192');
    console.log('  - /icon-512x512.png for 512x512');
    console.log('  - /icon-96x96.png for 96x96 (shortcuts)');
    
  } catch (error) {
    console.error('Error generating icons:', error.message);
    process.exit(1);
  }
}

generateIcons();

