/**
 * Converts an image to a tile-based map representation and saves the output as JSON.
 *
 * @param {string} imagePath - The path to the image file.
 * @param {string} outputJsonPath - The path to save the output JSON file.
 * @param {number} [maxWidth=1000] - The maximum width of the output map.
 * @param {number} [maxHeight=1000] - The maximum height of the output map.
 * @returns {Promise<void>} - A promise that resolves when the JSON file is saved.
 * @throws {Error} - If there's an error loading, processing the image, or saving the JSON file.
 */
const fs = require("fs").promises;
const { createCanvas, loadImage } = require("canvas");
const keys = require("./keys.json");

// colorMap should also use numeric keys
let colorMap = {};

for (var key in keys) {
	if (keys.hasOwnProperty(key)) {
		const hexColor = keys[key].color;
		colorMap[hexColor] = parseInt(key);
	}
}

async function imageToMapAndSaveJson(
	imagePath,
	outputJsonPath,
	maxWidth = 1000,
	maxHeight = 1000
) {
	try {
		const img = await loadImage(imagePath);

		// Calculate scaled dimensions
		let width = img.width;
		let height = img.height;
		if (width > maxWidth) {
			height *= maxWidth / width;
			width = maxWidth;
		}
		if (height > maxHeight) {
			width *= maxHeight / height;
			height = maxHeight;
		}
		width = Math.floor(width);
		height = Math.floor(height);

		const canvas = createCanvas(width, height);
		const ctx = canvas.getContext("2d");
		ctx.drawImage(img, 0, 0, width, height);
		const imageData = ctx.getImageData(0, 0, width, height);
		const pixels = imageData.data;

		const uniqueColors = new Set();
		for (let i = 0; i < pixels.length; i += 4) {
			const r = pixels[i];
			const g = pixels[i + 1];
			const b = pixels[i + 2];
			uniqueColors.add(rgbToHex(r, g, b));
		}

		const tileMap = {}; // Changed to an object

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const index = (y * width + x) * 4;
				const r = pixels[index];
				const g = pixels[index + 1];
				const b = pixels[index + 2];
				const hexColor = rgbToHex(r, g, b);
				const tileId = colorMap[hexColor]; // Get numeric tile ID
				tileMap[`${x},${y}`] = tileId;
			}
		}

		const jsonData = {
			tileMap: tileMap, // Changed to tileMap
			entityMap: keys,
		};

		await fs.writeFile(outputJsonPath, JSON.stringify(jsonData, null, 2));
		console.log(`Successfully saved JSON data to ${outputJsonPath}`);
	} catch (err) {
		throw new Error(`Error processing image or saving JSON: ${err}`);
	}
}

/**
 * Converts RGB color values to a hexadecimal color string.
 *
 * @param {number} r - The red value (0-255).
 * @param {number} g - The green value (0-255).
 * @param {number} b - The blue value (0-255).
 * @returns {string} - The hexadecimal color string (e.g., "#RRGGBB").
 */
function rgbToHex(r, g, b) {
	const toHex = (c) => c.toString(16).padStart(2, "0");
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Creates a mapping between hexadecimal colors and characters.
 *
 * @param {string[]} colors - An array of hexadecimal color strings.
 * @returns {{ [key: string]: string }} - A map where keys are hex colors and values are characters.
 * @throws {Error} - If there are more than 32 unique colors.
 */

(async () => {
	try {
		await imageToMapAndSaveJson("test.png", "output.json", 1000, 1000);
	} catch (error) {
		console.error(error);
	}
})();
