const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Get the directory path from command line arguments
const relativeDirPath = process.argv[2] || ".";

// Function to recursively find all files with a specific extension
async function findFiles(dir, pattern) {
  let results = [];

  // Read directory contents
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });

  // Process each entry
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Recursively search directories
      const subResults = await findFiles(fullPath, pattern);
      results = results.concat(subResults);
    } else if (entry.isFile() && entry.name.endsWith(pattern)) {
      // Add matching files to results
      results.push(fullPath);
    }
  }

  return results;
}

// Replaces "await" in preval for next builds because it will otherwise throw an error
// "await" needs to be there for "next dev" to work correctly with preval
async function processFiles() {
  try {
    // Resolve the relative directory path to absolute path
    const dirPath = path.resolve(process.cwd(), relativeDirPath);

    console.log(`Searching for *.preval.ts files in: ${dirPath}`);

    // Find all *.preval.ts files in the specified directory and subdirectories
    const files = await findFiles(dirPath, ".preval.ts");

    if (files.length === 0) {
      console.log("No *.preval.ts files found.");
      return;
    }

    console.log(`Found ${files.length} *.preval.ts files.`);

    // Store original contents of all files
    const fileContents = [];

    console.log("Reading all files...");
    for (const file of files) {
      const content = await fs.promises.readFile(file, "utf8");
      fileContents.push({ path: file, content });
    }

    console.log("Applying replacements...");
    let totalReplacements = 0;

    for (const file of fileContents) {
      const modifiedContent = file.content.replace(
        /preval\(await /g,
        "preval(",
      );
      const replacementCount = (file.content.match(/preval\(await /g) || [])
        .length;

      if (replacementCount > 0) {
        await fs.promises.writeFile(file.path, modifiedContent, "utf8");
        totalReplacements += replacementCount;
        console.log(
          `  - ${path.relative(process.cwd(), file.path)}: ${replacementCount} replacements`,
        );
      }
    }

    console.log(`Total replacements across all files: ${totalReplacements}`);

    if (totalReplacements === 0) {
      console.log("No replacements needed. Skipping build process.");
      return;
    }

    console.log("Running next build...");
    try {
      execSync("next build", { stdio: "inherit" });
      console.log("Build completed successfully.");
    } catch (buildError) {
      console.error("Build failed:", buildError.message);
      // Even if build fails, we should revert the changes
    }

    console.log("Reverting changes...");
    for (const file of fileContents) {
      await fs.promises.writeFile(file.path, file.content, "utf8");
    }
    console.log("All files restored to original state.");
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

processFiles();
