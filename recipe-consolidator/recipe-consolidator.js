const fs = require("fs");
const path = require("path");

const rsiEditorRoot = path.resolve(__dirname, "..", "rsi-editor");
const clothingDir = path.join(rsiEditorRoot, "output", "obj", "clothing");
const outputDir = path.join(__dirname, "consolidated_clothing");

if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir, { recursive: true });
}

function processClothingDirectory(dir) {
	const items = fs.readdirSync(dir);
	for (const item of items) {
		const itemPath = path.join(dir, item);
		const itemStat = fs.statSync(itemPath);
		if (itemStat.isDirectory()) {
			processClothingDirectory(itemPath);
		} else if (item === "meta.json") {
			processMetaFile(itemPath);
		}
	}
}

function processMetaFile(metaFilePath) {
	try {
		const metaData = JSON.parse(fs.readFileSync(metaFilePath, "utf-8"));
		const parentDir = path.dirname(metaFilePath);

		// Check for either 'images' or 'states' array
		const imageArray = metaData.images || metaData.states;

		if (!imageArray || !Array.isArray(imageArray)) {
			console.warn(
				`No valid 'images' or 'states' array found in ${metaFilePath}. Skipping.`
			);
			return;
		}

		// Determine if we're dealing with an array of strings or objects
		const isStatesArray =
			metaData.states &&
			Array.isArray(metaData.states) &&
			typeof metaData.states[0] === "object";

		for (const item of imageArray) {
			// Extract the image file name based on the array type
			const imageFileName = isStatesArray ? item.name + ".png" : item;

			const imagePath = path.join(parentDir, imageFileName);

			const imageStat = fs.statSync(imagePath);
			if (!imageStat.isFile() || !imageFileName.endsWith(".png")) {
				console.warn(
					`Invalid image file or not a png: ${imagePath}. Skipping.`
				);
				continue;
			}

			const imageNameWithoutExtension = path.basename(
				imageFileName,
				".png"
			);
			const imageOutputDir = path.join(
				outputDir,
				imageNameWithoutExtension
			);
			if (!fs.existsSync(imageOutputDir)) {
				fs.mkdirSync(imageOutputDir, { recursive: true });
			}

			const newImagePath = path.join(imageOutputDir, imageFileName);
			fs.copyFileSync(imagePath, newImagePath);
			//console.log(`Copied ${imagePath} to ${newImagePath}`);

			const newMetaFilePath = path.join(imageOutputDir, "meta.json");

			// Create a new metaData object with only the relevant entry
			const newMetaData = {
				version: metaData.version,
				license: metaData.license,
				copyright: metaData.copyright,
				size: metaData.size,
			};

			if (isStatesArray) {
				newMetaData.states = [item]; // Keep only the current state
			} else {
				newMetaData.images = [item]; // Keep only the current image
			}

			fs.writeFileSync(
				newMetaFilePath,
				JSON.stringify(newMetaData, null, 2)
			);
			//console.log(`Copied meta.json to ${newMetaFilePath}`);
		}
	} catch (error) {
		console.error(`Error processing ${metaFilePath}:`, error);
	}
}

processClothingDirectory(clothingDir);
console.log("Clothing consolidation complete.");
