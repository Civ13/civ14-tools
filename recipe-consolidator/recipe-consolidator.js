const fs = require("fs");
const path = require("path");

const rsiEditorRoot = path.resolve(__dirname, "..", "rsi-editor");
const clothingDir = path.join(rsiEditorRoot, "output", "obj", "clothing");
const mobDir = path.join(rsiEditorRoot, "output", "mob");
const outputDir = path.join(__dirname, "consolidated_clothing");

const mobSubfolders = [
	"suit.rsi",
	"ties.rsi",
	"uniform.rsi",
	"mask.rsi",
	"head.rsi",
	"hands.rsi",
	"feet.rsi",
	"eyes.rsi",
	"belt.rsi",
	"back.rsi",
];

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
		// Calculate the relative path from clothingDir to the current parent directory
		const relativePath = path.relative(clothingDir, parentDir);

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
			// Create the output directory path, including the relative path
			const imageOutputDir = path.join(
				outputDir,
				relativePath,
				imageNameWithoutExtension
			);
			if (!fs.existsSync(imageOutputDir)) {
				fs.mkdirSync(imageOutputDir, { recursive: true });
			}

			const newImagePath = path.join(imageOutputDir, imageFileName);
			fs.copyFileSync(imagePath, newImagePath);
			console.log(`Copied ${imagePath} to ${newImagePath}`);

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
			console.log(`Copied meta.json to ${newMetaFilePath}`);
		}
	} catch (error) {
		console.error(`Error processing ${metaFilePath}:`, error);
	}
}

function findAndCopyMobFiles() {
	const mobSubfolderToEquipped = {
		"suit.rsi": "equipped-OUTERCLOTHING.png",
		"ties.rsi": "equipped-NECK.png",
		"uniform.rsi": "equipped-INNERCLOTHING.png",
		"mask.rsi": "equipped-MASK.png",
		"head.rsi": "equipped-HELMET.png",
		"hands.rsi": "equipped-HAND.png",
		"feet.rsi": "equipped-FEET.png",
		"eyes.rsi": "equipped-EYES.png",
		"belt.rsi": "equipped-BELT.png",
		"back.rsi": "equipped-BACKPACK.png",
	};

	for (const subfolder of mobSubfolders) {
		const mobSubfolderPath = path.join(mobDir, subfolder);
		if (!fs.existsSync(mobSubfolderPath)) {
			console.warn(`Mob subfolder not found: ${mobSubfolderPath}`);
			continue;
		}

		const mobItems = fs.readdirSync(mobSubfolderPath);
		for (const mobItem of mobItems) {
			if (!mobItem.endsWith(".png")) continue;

			const mobItemPath = path.join(mobSubfolderPath, mobItem);
			const mobItemName = path.basename(mobItem, ".png");

			// Search for matching folders in consolidated_clothing
			const consolidatedItems = fs.readdirSync(outputDir);
			for (const consolidatedFolderName of consolidatedItems) {
				const consolidatedFolderPath = path.join(
					outputDir,
					consolidatedFolderName
				);
				const consolidatedFolderStat = fs.statSync(
					consolidatedFolderPath
				);
				if (!consolidatedFolderStat.isDirectory()) continue;

				// Iterate through subfolders inside the consolidated folder
				const consolidatedSubfolders = fs.readdirSync(
					consolidatedFolderPath
				);
				for (const consolidatedSubfolderName of consolidatedSubfolders) {
					const consolidatedSubfolderPath = path.join(
						consolidatedFolderPath,
						consolidatedSubfolderName
					);
					const consolidatedSubfolderStat = fs.statSync(
						consolidatedSubfolderPath
					);
					if (!consolidatedSubfolderStat.isDirectory()) continue;

					// Iterate through PNG files inside the consolidated subfolder
					const consolidatedFolderItems = fs.readdirSync(
						consolidatedSubfolderPath
					);
					for (const consolidatedFile of consolidatedFolderItems) {
						if (!consolidatedFile.endsWith(".png")) continue;

						const consolidatedFileName = path.basename(
							consolidatedFile,
							".png"
						);

						// Compare against the base name of the PNG file
						if (
							mobItemName.replace("-", "_") ===
							consolidatedSubfolderName
						) {
							// Get the new file name from the mapping
							const newMobItemName =
								mobSubfolderToEquipped[subfolder];
							const newMobItemPath = path.join(
								consolidatedSubfolderPath,
								newMobItemName
							);
							fs.copyFileSync(mobItemPath, newMobItemPath);
							console.log(
								`Copied worn ${mobItemPath} to ${newMobItemPath}`
							);

							// Update meta.json
							const mobMetaPath = path.join(
								mobSubfolderPath,
								"meta.json"
							);
							if (fs.existsSync(mobMetaPath)) {
								try {
									const mobMetaData = JSON.parse(
										fs.readFileSync(mobMetaPath, "utf-8")
									);
									const newConsolidatedMetaPath = path.join(
										consolidatedSubfolderPath,
										"meta.json"
									);
									if (
										fs.existsSync(newConsolidatedMetaPath)
									) {
										const newConsolidatedMetaData = {
											version: mobMetaData.version,
											license: mobMetaData.license,
											copyright: mobMetaData.copyright,
											size: mobMetaData.size,
										};
										const mobItemNameWithoutPng =
											mobItemName;
										if (
											mobMetaData.images &&
											mobMetaData.images.includes(
												mobItemNameWithoutPng
											)
										) {
											newConsolidatedMetaData.images = [
												newMobItemName,
											];
										} else if (mobMetaData.states) {
											const state =
												mobMetaData.states.find(
													(s) =>
														s.name ===
														mobItemNameWithoutPng
												);
											if (state) {
												newConsolidatedMetaData.states =
													[state];
											}
										}
										fs.writeFileSync(
											newConsolidatedMetaPath,
											JSON.stringify(
												newConsolidatedMetaData,
												null,
												2
											)
										);
										console.log(
											`Updated meta.json at ${newConsolidatedMetaPath}`
										);
									}
								} catch (error) {
									console.error(
										`Error updating meta.json at ${newConsolidatedMetaPath}:`,
										error
									);
								}
							}
						}
					}
				}
			}
		}
	}
}

processClothingDirectory(clothingDir);
findAndCopyMobFiles();
console.log("Clothing and Mob consolidation complete.");
