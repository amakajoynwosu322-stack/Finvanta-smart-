import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

const rootDir = process.cwd();
const zip = new JSZip();

// Ignore patterns
const ignoreList = [
  'node_modules',
  '.git',
  'dist',
  '.DS_Store',
  'finvanta-project.zip',
  'public/finvanta-project.zip'
];

function shouldIgnore(relPath) {
  return ignoreList.some((pattern) => {
    return relPath === pattern || relPath.startsWith(pattern + path.sep);
  });
}

function addDirectoryToZip(dirPath, zipFolder) {
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const relPath = path.relative(rootDir, fullPath);

    if (shouldIgnore(relPath)) continue;

    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      const subFolder = zipFolder.folder(item);
      addDirectoryToZip(fullPath, subFolder);
    } else {
      const content = fs.readFileSync(fullPath);
      zipFolder.file(item, content);
    }
  }
}

async function createProjectZip() {
  console.log('Generating complete FINVANTA project zip archive...');
  addDirectoryToZip(rootDir, zip);

  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  // Ensure public folder exists
  const publicDir = path.join(rootDir, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Save in public/ for direct web download and in root
  const publicZipPath = path.join(publicDir, 'finvanta-project.zip');
  const rootZipPath = path.join(rootDir, 'finvanta-project.zip');

  fs.writeFileSync(publicZipPath, buffer);
  fs.writeFileSync(rootZipPath, buffer);

  console.log(`Successfully generated finvanta-project.zip (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
}

createProjectZip().catch((err) => {
  console.error('Failed to create zip:', err);
  process.exit(1);
});
