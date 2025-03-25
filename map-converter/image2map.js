/**
 * Converts an image to a text-based representation using a limited color palette and saves the output as JSON.
 *
 * @param {string} imagePath - The path to the image file.
 * @param {string} outputJsonPath - The path to save the output JSON file.
 * @param {number} [maxWidth=1000] - The maximum width of the output text representation.
 * @param {number} [maxHeight=1000] - The maximum height of the output text representation.
 * @returns {Promise<void>} - A promise that resolves when the JSON file is saved.
 * @throws {Error} - If there's an error loading, processing the image, or saving the JSON file.
 */
const fs = require("fs").promises;
const { createCanvas, loadImage } = require("canvas"); // Import from canvas library
const globalEntityMap = {
	a: "DeepWater",
	b: "ShallowWater",
	c: "Snow",
	d: "Sand",
	e: "Dirt",
	f: "RockWall",
	g: "Grass",
	h: "DryDirt",
};
async function imageToMapAndSaveJson(
	imagePath,
	outputJsonPath,
	maxWidth = 1000,
	maxHeight = 1000
) {
	try {
		const img = await loadImage(imagePath); // Use loadImage from canvas

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

		const canvas = createCanvas(width, height); // Use createCanvas from canvas
		const ctx = canvas.getContext("2d");

		ctx.drawImage(img, 0, 0, width, height);

		const imageData = ctx.getImageData(0, 0, width, height);
		const pixels = imageData.data;

		const uniqueColors = new Set();
		for (let i = 0; i < pixels.length; i += 4) {
			const r = pixels[i];
			const g = pixels[i + 1];
			const b = pixels[i + 2];
			const hexColor = rgbToHex(r, g, b);
			uniqueColors.add(hexColor);
		}

		const colorMap = createColorMap(Array.from(uniqueColors));
		let text = [];
		for (let y = 0; y < height; y++) {
			text[y] = "";
			for (let x = 0; x < width; x++) {
				const index = (y * width + x) * 4;
				const r = pixels[index];
				const g = pixels[index + 1];
				const b = pixels[index + 2];
				const hexColor = rgbToHex(r, g, b);
				text[y] += colorMap[hexColor];
			}
		}

		const jsonData = {
			text: text,
			colorMap: colorMap,
			entityMap: globalEntityMap,
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
function createColorMap(colors) {
	if (colors.length > 32) {
		throw new Error("Too many unique colors. Maximum is 32.");
	}

	const characters = "abcdefghijklmnopqrstuvwxyz012345";
	const colorMap = {};
	for (let i = 0; i < colors.length; i++) {
		colorMap[colors[i]] = characters[i];
	}
	return colorMap;
}

// Example usage (Node.js):
(async () => {
	try {
		await imageToMapAndSaveJson("test.png", "output.json", 1000, 1000); // Replace with your image path and desired output path
	} catch (error) {
		console.error(error);
	}
})();
