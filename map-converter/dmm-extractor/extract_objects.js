const fs = require("fs");
const path = require("path");

/**
 * Recursively reads all files in a directory and its subdirectories.
 *
 * @param {string} dir - The directory to start reading from.
 * @param {string[]} [fileList=[]] - An array to accumulate the file paths.
 * @returns {string[]} - An array of file paths.
 */
function getAllFiles(dir, fileList = []) {
	const files = fs.readdirSync(dir);
	for (const file of files) {
		const filePath = path.join(dir, file);
		const fileStat = fs.statSync(filePath);
		if (fileStat.isDirectory()) {
			getAllFiles(filePath, fileList); // Recursive call for subdirectories
		} else {
			fileList.push(filePath);
		}
	}
	return fileList;
}

/**
 * Extracts object definitions from a DMM file.
 *
 * @param {string} filePath - The path to the DMM file.
 * @returns {string[]} - An array of unique object definitions.
 */
function extractObjectDefinitions(filePath) {
	try {
		const data = fs.readFileSync(filePath, "utf8");
		const lines = data.split("\n");
		const objectDefinitions = [];
		let inObjectSection = true;

		for (const line of lines) {
			const trimmedLine = line.trim();

			// Stop processing when we reach the map data section
			if (trimmedLine.startsWith("(1,1,1) =")) {
				inObjectSection = false;
				break;
			}

			// Skip empty lines and comments
			if (trimmedLine === "" || trimmedLine.startsWith("//")) {
				continue;
			}

			if (inObjectSection) {
				// Extract the object definition part
				const equalsIndex = trimmedLine.indexOf("=");
				if (equalsIndex !== -1) {
					const definitionPart = trimmedLine
						.substring(equalsIndex + 1)
						.trim();

					// Remove the parenthesis and split by comma
					const objects = definitionPart
						.substring(1, definitionPart.length - 1)
						.split(",");

					for (const obj of objects) {
						let trimmedObj = obj.trim();
						if (trimmedObj !== "") {
							// Extract only the base object path
							const braceIndex = trimmedObj.indexOf("{");
							if (braceIndex !== -1) {
								trimmedObj = trimmedObj.substring(
									0,
									braceIndex
								);
							}
							objectDefinitions.push(trimmedObj.trim());
						}
					}
				}
			}
		}

		// Remove duplicates
		const uniqueObjectDefinitions = [...new Set(objectDefinitions)];

		return uniqueObjectDefinitions;
	} catch (err) {
		console.error(`Error reading file ${filePath}:`, err);
		return [];
	}
}

const inputDir = "input"; // Directory to search for DMM files
const allObjectDefinitions = [];

// Check if the input directory exists
if (!fs.existsSync(inputDir)) {
	console.error(`Error: Input directory "${inputDir}" not found.`);
} else {
	const allFiles = getAllFiles(inputDir);

	// Filter for .dmm files
	const dmmFiles = allFiles.filter((file) => file.endsWith(".dmm"));

	if (dmmFiles.length === 0) {
		console.log("No .dmm files found in the input directory.");
	} else {
		console.log(`Found ${dmmFiles.length} .dmm files.`);
		for (const dmmFile of dmmFiles) {
			console.log(`Processing: ${dmmFile}`);
			const objectList = extractObjectDefinitions(dmmFile);
			allObjectDefinitions.push(...objectList); // Add to the main list
		}

		// Remove duplicates from the combined list
		const uniqueAllObjectDefinitions = [...new Set(allObjectDefinitions)];

		if (uniqueAllObjectDefinitions.length > 0) {
			console.log("\nList of unique object definitions from all files:");
			uniqueAllObjectDefinitions.forEach((obj, index) => {
				console.log(`${index + 1}. ${obj}`);
			});

			// Save to JSON
			const jsonData = JSON.stringify(
				uniqueAllObjectDefinitions,
				null,
				2
			);
			fs.writeFile("objects.json", jsonData, (err) => {
				if (err) {
					console.error("Error writing JSON file:", err);
				} else {
					console.log(
						"Successfully saved object definitions to objects.json"
					);
				}
			});
		} else {
			console.log("No object definitions found in any files.");
		}
	}
}
