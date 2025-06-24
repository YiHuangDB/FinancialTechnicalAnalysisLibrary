const fs = require('fs');
const path = require('path');

const INPUT_FILE = 'packed_project.json';
// By default, unpacks into a directory relative to where unpack.js is run.
// Or, you can specify a target directory. For this example, let's assume
// it unpacks to a new directory to avoid overwriting existing files unintentionally.
const TARGET_BASE_DIR = 'unpacked_financial_indicators'; 

function unpackFiles() {
  console.log(`Starting unpacking process from file: ${INPUT_FILE}`);

  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`Error: Packed file "${INPUT_FILE}" does not exist.`);
    process.exit(1);
  }

  let packedData;
  try {
    const fileContent = fs.readFileSync(INPUT_FILE, 'utf-8');
    packedData = JSON.parse(fileContent);
  } catch (e) {
    console.error(`Error reading or parsing packed file: ${e.message}`);
    process.exit(1);
  }

  if (!Array.isArray(packedData)) {
    console.error('Error: Packed data is not in the expected format (array).');
    process.exit(1);
  }

  if (packedData.length === 0) {
    console.log("Packed file is empty. No files to unpack.");
    return;
  }

  // Create the base target directory if it doesn't exist
  if (!fs.existsSync(TARGET_BASE_DIR)) {
    try {
      fs.mkdirSync(TARGET_BASE_DIR, { recursive: true });
    } catch (e) {
      console.error(`Error creating target base directory "${TARGET_BASE_DIR}": ${e.message}`);
      process.exit(1);
    }
  }


  let filesUnpacked = 0;
  packedData.forEach(fileEntry => {
    if (typeof fileEntry.path !== 'string' || typeof fileEntry.content !== 'string') {
      console.warn('Skipping invalid entry in packed data:', fileEntry);
      return;
    }

    const targetFilePath = path.join(TARGET_BASE_DIR, fileEntry.path);
    const targetDir = path.dirname(targetFilePath);

    try {
      // Ensure directory structure exists
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      // Write the file
      fs.writeFileSync(targetFilePath, fileEntry.content, 'utf-8');
      filesUnpacked++;
    } catch (e) {
      console.error(`Error unpacking file "${fileEntry.path}" to "${targetFilePath}": ${e.message}`);
      // Decide if you want to stop on error or continue
    }
  });

  console.log(`Successfully unpacked ${filesUnpacked} files into directory: ${TARGET_BASE_DIR}`);
}

unpackFiles();
