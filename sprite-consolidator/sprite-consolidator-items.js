const fs = require("node:fs");
const path = require("path");
const { processConsolidatedItems } = require("./filechecker.js");

const rsiEditorRoot = path.resolve(__dirname, "..", "rsi-editor");
const itemsDir = path.join(rsiEditorRoot, "output", "obj", "items.rsi");
const weaponsDir = path.join(rsiEditorRoot, "output", "obj", "weapons.rsi");
const gunsDir = path.join(rsiEditorRoot, "output", "obj", "guns");
const mobDir = path.join(rsiEditorRoot, "output", "mob");
const outputDir = path.join(__dirname, "consolidated_items");

const mobSubfolders = ["belts.rsi", "back.rsi"];

const inhandSubfolders = [
	"lefthand_guns.rsi",
	"lefthand_weapons.rsi",
	"righthand_guns.rsi",
	"righthand_weapons.rsi",
];

const inhandFolderToType = {
	"lefthand_guns.rsi": "inhand-left.png",
	"lefthand_weapons.rsi": "inhand-left.png",
	"righthand_guns.rsi": "inhand-right.png",
	"righthand_weapons.rsi": "inhand-right.png",
};

const inhandFolderToConsolidated = {
	"lefthand_guns.rsi": "guns",
	"lefthand_weapons.rsi": "weapons",
	"righthand_guns.rsi": "guns",
	"righthand_weapons.rsi": "weapons",
};

if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir, { recursive: true });
}

function processItemDirectory(dir) {
	const items = fs.readdirSync(dir);
	for (const item of items) {
		const itemPath = path.join(dir, item);
		const itemStat = fs.statSync(itemPath);
		if (itemStat.isDirectory()) {
			processItemDirectory(itemPath);
		} else if (item === "meta.json") {
			processMetaFile(itemPath, dir);
		}
	}
}

function processMetaFile(metaFilePath, relDir) {
	try {
		const metaData = JSON.parse(fs.readFileSync(metaFilePath, "utf-8"));
		const parentDir = path.dirname(metaFilePath);
		const relativePath = path.relative(relDir, parentDir);

		const imageArray = metaData.images || metaData.states;

		if (!imageArray || !Array.isArray(imageArray)) {
			console.warn(
				`No valid 'images' or 'states' array found in ${metaFilePath}. Skipping.`
			);
			return;
		}

		const isStatesArray =
			metaData.states &&
			Array.isArray(metaData.states) &&
			typeof metaData.states[0] === "object";

		for (const item of imageArray) {
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
			let parsedClass = "item";
			if (relDir.includes("weapons.rsi")) {
				parsedClass = "weapons";
			} else if (relDir.includes("guns")) {
				parsedClass = "guns";
			}
			const imageOutputDir = path.join(
				outputDir,
				parsedClass,
				relativePath,
				imageNameWithoutExtension
			);

			if (!fs.existsSync(imageOutputDir)) {
				fs.mkdirSync(imageOutputDir, { recursive: true });
			}
			const newImagePath2 = path.join(imageOutputDir, imageFileName);
			const newImagePath = path.join(imageOutputDir, "icon.png");
			fs.copyFileSync(imagePath, newImagePath);
			fs.copyFileSync(imagePath, newImagePath2);
			console.log(`Copied ${imagePath} to ${newImagePath}`);

			const newMetaFilePath = path.join(imageOutputDir, "meta.json");
			const newMetaData = {
				version: metaData.version,
				license: "AGPL-3.0",
				copyright: "Exported from https://github.com/civ13/civ13",
				size: metaData.size,
			};

			if (isStatesArray) {
				newMetaData.states = [item];
			} else {
				newMetaData.images = [item];
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
		"belts.rsi": "equipped-BELT.png",
		"back.rsi": "equipped-BACKPACK.png",
	};

	// Function to handle mob files and items
	function processMobFiles(mobFolderPath, renameFunction) {
		if (!fs.existsSync(mobFolderPath)) {
			console.warn(`Mob folder not found: ${mobFolderPath}`);
			return;
		}
		const mobItems = fs.readdirSync(mobFolderPath);
		for (const mobItem of mobItems) {
			const mobItemPath = path.join(mobFolderPath, mobItem);
			const mobItemStat = fs.statSync(mobItemPath);
			if (mobItemStat.isDirectory()) {
				processMobFiles(mobItemPath, renameFunction);
			} else if (mobItem.endsWith(".png")) {
				const mobItemName = path.basename(mobItem, ".png");

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

						if (
							mobItemName.replace("-", "_") ===
							consolidatedSubfolderName
						) {
							const newMobItemName = renameFunction(
								consolidatedSubfolderName
							);
							if (newMobItemName) {
								const newMobItemPath = path.join(
									consolidatedSubfolderPath,
									newMobItemName
								);
								fs.copyFileSync(mobItemPath, newMobItemPath);
								console.log(
									`Copied worn ${mobItemPath} to ${newMobItemPath}`
								);

								const mobMetaPath = path.join(
									mobFolderPath,
									"meta.json"
								);
								if (fs.existsSync(mobMetaPath)) {
									try {
										const mobMetaData = JSON.parse(
											fs.readFileSync(
												mobMetaPath,
												"utf-8"
											)
										);
										const newConsolidatedMetaPath =
											path.join(
												consolidatedSubfolderPath,
												"meta.json"
											);
										if (
											fs.existsSync(
												newConsolidatedMetaPath
											)
										) {
											const newConsolidatedMetaData = {
												version: mobMetaData.version,
												license: mobMetaData.license,
												copyright:
													mobMetaData.copyright,
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
												newConsolidatedMetaData.images =
													[newMobItemName];
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

	for (const subfolder of mobSubfolders) {
		processMobFiles(path.join(mobDir, subfolder), (folderName) => {
			return mobSubfolderToEquipped[subfolder];
		});
	}
}

function processInhandSprites() {
	for (const inhandSubfolder of inhandSubfolders) {
		const inhandFolderPath = path.join(mobDir, "items", inhandSubfolder);
		if (!fs.existsSync(inhandFolderPath)) {
			console.warn(`Inhand folder not found: ${inhandFolderPath}`);
			continue;
		}
		const files = fs.readdirSync(inhandFolderPath);
		for (const file of files) {
			if (!file.endsWith(".png")) continue;

			const filePath = path.join(inhandFolderPath, file);
			const fileName = path.basename(file, ".png");
			const targetConsolidatedFolder =
				inhandFolderToConsolidated[inhandSubfolder];
			const targetInhandName = inhandFolderToType[inhandSubfolder];

			if (!targetConsolidatedFolder || !targetInhandName) {
				console.warn(
					`Could not determine target folder or inhand name for ${inhandSubfolder}`
				);
				continue;
			}

			const targetConsolidatedPath = path.join(
				outputDir,
				targetConsolidatedFolder,
				fileName
			);
			if (!fs.existsSync(targetConsolidatedPath)) {
				console.warn(
					`Could not find target consolidated folder for ${fileName}`
				);
				continue;
			}
			const targetInhandPath = path.join(
				targetConsolidatedPath,
				targetInhandName
			);

			fs.copyFileSync(filePath, targetInhandPath);
			console.log(
				`Copied inhand sprite ${filePath} to ${targetInhandPath}`
			);
			const mobMetaPath = path.join(inhandFolderPath, "meta.json");
			if (fs.existsSync(mobMetaPath)) {
				try {
					const mobMetaData = JSON.parse(
						fs.readFileSync(mobMetaPath, "utf-8")
					);
					const newConsolidatedMetaPath = path.join(
						targetConsolidatedPath,
						"meta.json"
					);
					if (fs.existsSync(newConsolidatedMetaPath)) {
						const newConsolidatedMetaData = {
							version: mobMetaData.version,
							license: mobMetaData.license,
							copyright: mobMetaData.copyright,
							size: mobMetaData.size,
						};
						const mobItemNameWithoutPng = fileName;
						if (
							mobMetaData.images &&
							mobMetaData.images.includes(mobItemNameWithoutPng)
						) {
							newConsolidatedMetaData.images = [targetInhandName];
						} else if (mobMetaData.states) {
							const state = mobMetaData.states.find(
								(s) => s.name === mobItemNameWithoutPng
							);
							if (state) {
								newConsolidatedMetaData.states = [state];
							}
						}
						fs.writeFileSync(
							newConsolidatedMetaPath,
							JSON.stringify(newConsolidatedMetaData, null, 2)
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

processItemDirectory(itemsDir);
processItemDirectory(weaponsDir);
processItemDirectory(gunsDir);
findAndCopyMobFiles();
processInhandSprites();
processConsolidatedItems();
console.log("Clothing and Mob consolidation complete.");
