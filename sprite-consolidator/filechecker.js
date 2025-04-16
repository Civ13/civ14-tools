const fs = require("node:fs");
const path = require("path");
const sharp = require("sharp"); // Import sharp

const consolidatedClothingDir = path.resolve("consolidated_clothing");
const consolidatedItemsDir = path.resolve("consolidated_items");

// --- NEW FUNCTION ---
/**
 * Recursively scans a directory and creates a default meta.json
 * if one doesn't exist in any subdirectory.
 * @param {string} dir The directory to scan.
 */
function createMissingMetaFiles(dir) {
	const items = fs.readdirSync(dir, { withFileTypes: true }); // Use withFileTypes for efficiency

	for (const item of items) {
		if (item.isDirectory()) {
			const subDirPath = path.join(dir, item.name);
			const metaFilePath = path.join(subDirPath, "meta.json");

			// Check if meta.json exists in this subdirectory
			if (!fs.existsSync(metaFilePath)) {
				// Define default meta content
				const defaultMetaData = {
					version: 1, // Or a suitable default version
					license: "AGPL-3.0", // Consistent license
					copyright: "Exported from https://github.com/civ13/civ13", // Consistent copyright
					size: {
						// Default size, can be adjusted by updateMetaJson later
						x: 32,
						y: 32,
					},
					states: [], // Start with empty states, updateMetaJson will populate
				};

				try {
					fs.writeFileSync(
						metaFilePath,
						JSON.stringify(defaultMetaData, null, 2)
					);
					console.log(`Created missing meta.json at ${metaFilePath}`);
				} catch (error) {
					console.error(
						`Error creating meta.json at ${metaFilePath}:`,
						error
					);
				}
			}

			// Recurse into the subdirectory
			createMissingMetaFiles(subDirPath);
		}
	}
}
// --- END NEW FUNCTION ---

module.exports.processConsolidatedClothing = async function () {
	// async function
	console.log("Checking for missing meta.json files in clothing...");
	createMissingMetaFiles(consolidatedClothingDir); // <--- Call the new function first
	console.log("Updating existing meta.json files in clothing...");
	const metaFiles = findMetaFiles(consolidatedClothingDir);
	for (const metaFilePath of metaFiles) {
		// Use for...of for async/await
		try {
			await updateMetaJson(metaFilePath); // await the promise
		} catch (error) {
			console.error(`Error processing ${metaFilePath}:`, error);
		}
	}
};

module.exports.processConsolidatedItems = async function () {
	// async function
	console.log("Checking for missing meta.json files in items...");
	createMissingMetaFiles(consolidatedItemsDir); // <--- Call the new function first
	console.log("Updating existing meta.json files in items...");
	const metaFiles = findMetaFiles(consolidatedItemsDir);
	for (const metaFilePath of metaFiles) {
		// Use for...of for async/await
		try {
			console.log(`Processing ${metaFilePath}`);
			await updateMetaJson(metaFilePath); // await the promise
		} catch (error) {
			console.error(`Error processing ${metaFilePath}:`, error);
		}
	}
};

function findMetaFiles(dir) {
	let metaFiles = [];
	// Optimization: Check if dir exists before reading
	if (!fs.existsSync(dir)) {
		console.warn(`Directory not found: ${dir}. Skipping findMetaFiles.`);
		return [];
	}
	const items = fs.readdirSync(dir, { withFileTypes: true }); // Use withFileTypes
	items.forEach((item) => {
		const itemPath = path.join(dir, item.name);
		if (item.isDirectory()) {
			// Check if it's actually a directory before recursing
			metaFiles = metaFiles.concat(findMetaFiles(itemPath));
		} else if (item.isFile() && item.name === "meta.json") {
			// Check if it's a file and the name matches
			metaFiles.push(itemPath);
		}
	});
	return metaFiles;
}

async function updateMetaJson(metaFilePath) {
	try {
		const metaData = JSON.parse(fs.readFileSync(metaFilePath, "utf-8"));
		const parentDir = path.dirname(metaFilePath);
		const pngFiles = fs
			.readdirSync(parentDir)
			.filter((file) => file.endsWith(".png"));

		// Ensure states array exists
		if (!metaData.states || !Array.isArray(metaData.states)) {
			metaData.states = [];
		}

		const existingStates = metaData.states;
		const newStates = [];
		const stateNames = new Set(existingStates.map((s) => s.name)); // Keep track of existing names

		for (const pngFile of pngFiles) {
			const pngFileName = path.basename(pngFile, ".png");
			const imgPath = path.join(parentDir, pngFile);
			const imgSize = await getImageSize(imgPath); // Get size first

			// Determine expected directions based on size
			let expectedDirections = 1; // Default
			if (imgSize.width === 64 && imgSize.height === 64) {
				expectedDirections = 4;
			} else if (imgSize.width === 32 && imgSize.height === 32) {
				expectedDirections = 1;
			}
			// Add more size checks if needed

			const existingStateIndex = existingStates.findIndex(
				(state) => state.name === pngFileName
			);

			if (existingStateIndex === -1) {
				// State is new
				if (!stateNames.has(pngFileName)) {
					// Avoid duplicates if multiple runs happen
					const newState = {
						name: pngFileName,
						directions: expectedDirections,
					};
					newStates.push(newState);
					stateNames.add(pngFileName); // Add to tracker
				}
			} else {
				// State exists, update directions if necessary
				const existingState = existingStates[existingStateIndex];
				if (existingState.directions !== expectedDirections) {
					console.log(
						`Updating directions for ${pngFileName} in ${metaFilePath} from ${existingState.directions} to ${expectedDirections}`
					);
					existingState.directions = expectedDirections;
				}
				// Ensure size in meta matches first state (usually icon.png or the first alphabetically)
				// This assumes the first PNG found dictates the RSI size, which might need refinement
				if (!metaData.size || !metaData.size.width) {
					metaData.size = {
						x: imgSize.width,
						y: imgSize.height,
					};
				}
			}
		}

		// Combine existing and new states
		metaData.states = existingStates.concat(newStates);

		// Remove the old 'images' array if it exists, as 'states' is preferred
		if (metaData.images) {
			delete metaData.images;
		}

		fs.writeFileSync(metaFilePath, JSON.stringify(metaData, null, 2));
		// console.log(`Updated meta.json at ${metaFilePath}`); // Less verbose logging now
	} catch (error) {
		// More specific error logging
		if (error instanceof SyntaxError) {
			console.error(
				`Error parsing JSON in ${metaFilePath}:`,
				error.message
			);
		} else {
			console.error(`Error processing ${metaFilePath}:`, error);
		}
	}
}

async function getImageSize(imagePath) {
	try {
		const metadata = await sharp(imagePath).metadata();
		return { width: metadata.width, height: metadata.height };
	} catch (error) {
		console.error(`Error reading image ${imagePath}:`, error);
		// Return a default or throw? Returning default might hide issues.
		// Let's return 0,0 and let the calling function decide default directions.
		return { width: 0, height: 0 };
	}
}
