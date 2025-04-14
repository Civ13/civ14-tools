const fs = require("node:fs");
const path = require("path");
const sharp = require("sharp"); // Import sharp

const consolidatedClothingDir = path.resolve("consolidated_clothing");
const consolidatedItemsDir = path.resolve("consolidated_items");
module.exports.processConsolidatedClothing = async function () {
	// async function
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
	const items = fs.readdirSync(dir);
	items.forEach((item) => {
		const itemPath = path.join(dir, item);
		const itemStat = fs.statSync(itemPath);
		if (itemStat.isDirectory()) {
			metaFiles = metaFiles.concat(findMetaFiles(itemPath));
		} else if (item === "meta.json") {
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

		const existingStates = metaData.states || [];
		const newStates = [];

		for (const pngFile of pngFiles) {
			const pngFileName = path.basename(pngFile, ".png");
			const existingState = existingStates.find(
				(state) => state.name === pngFileName
			);

			if (!existingState) {
				const state = { name: pngFileName };
				const imgPath = path.join(parentDir, pngFile);
				const imgSize = await getImageSize(imgPath);
				state.directions =
					imgSize.width === 64 && imgSize.height === 64 ? 4 : 1;
				newStates.push(state);
			} else {
				const imgPath = path.join(parentDir, pngFile);
				const imgSize = await getImageSize(imgPath);
				let expectedDirections;
				if (imgSize.width === 64 && imgSize.height === 64) {
					expectedDirections = 4;
				} else if (imgSize.width === 32 && imgSize.height === 32) {
					expectedDirections = 1;
				} else {
					expectedDirections = existingState.directions;
				}
				if (existingState.directions !== expectedDirections) {
					existingState.directions = expectedDirections;
				}
			}
		}

		metaData.states = existingStates.concat(newStates);
		fs.writeFileSync(metaFilePath, JSON.stringify(metaData, null, 2));
		console.log(`Updated meta.json at ${metaFilePath}`);
	} catch (error) {
		console.error(`Error processing ${metaFilePath}:`, error);
	}
}

async function getImageSize(imagePath) {
	try {
		const metadata = await sharp(imagePath).metadata();
		return { width: metadata.width, height: metadata.height };
	} catch (error) {
		console.error(`Error reading image ${imagePath}:`, error);
		return { width: 0, height: 0 };
	}
}
