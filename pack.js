const fs = require('fs');
const path = require('path');

const BASE_DIR = 'financial-indicators';
const OUTPUT_FILE = 'packed_project.json';

function getAllFiles(dirPath, arrayOfFiles = [], baseDir = dirPath) {
  try {
    const files = fs.readdirSync(dirPath);

    files.forEach(function(file) {
      const fullPath = path.join(dirPath, file);
      if (fs.statSync(fullPath).isDirectory()) {
        getAllFiles(fullPath, arrayOfFiles, baseDir);
      } else {
        const relativePath = path.relative(baseDir, fullPath);
        arrayOfFiles.push({ path: relativePath, content: fs.readFileSync(fullPath, 'utf-8') });
      }
    });
  } catch (e) {
    console.error(`Error reading directory ${dirPath}: ${e.message}`);
    // If a directory is missing (e.g. no 'tests' if no tests were written for a sub-component)
    // we can choose to ignore or halt. For packing, maybe best to log and continue.
  }
  return arrayOfFiles;
}

function packFiles() {
  console.log(`Starting packing process for directory: ${BASE_DIR}`);
  if (!fs.existsSync(BASE_DIR)) {
    console.error(`Error: Base directory "${BASE_DIR}" does not exist.`);
    process.exit(1);
  }

  const allFilesData = getAllFiles(BASE_DIR);
  
  if (allFilesData.length === 0) {
    console.log("No files found to pack in the specified directory.");
    // Create an empty JSON if you want to signify an empty pack
    // fs.writeFileSync(OUTPUT_FILE, JSON.stringify([], null, 2)); 
    return;
  }

  try {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allFilesData, null, 2));
    console.log(`Successfully packed ${allFilesData.length} files into ${OUTPUT_FILE}`);
  } catch (e) {
    console.error(`Error writing packed file: ${e.message}`);
    process.exit(1);
  }
}

packFiles();
