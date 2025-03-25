const fs = require("fs").promises;
const base64 = require("js-base64").Base64;
const yaml = require("js-yaml");

/**
 * Packs an unsigned 32-bit integer into a byte array (little-endian).
 * @param {number} num - The number to pack.
 * @returns {Uint8Array} - The byte array representation of the number.
 */
function packUint32LE(num) {
	const arr = new Uint8Array(4);
	arr[0] = num & 0xff;
	arr[1] = (num >> 8) & 0xff;
	arr[2] = (num >> 16) & 0xff;
	arr[3] = (num >> 24) & 0xff;
	return arr;
}

/**
 * Encodes tiles into a base64 string for YAML.
 * @param {number[][]} tileMap - A 2D array representing the tile map.
 * @returns {string} - The base64 encoded string of the tile data.
 */
function encodeTiles(tileMap) {
	const tileBytes = [];
	for (let y = 0; y < tileMap.length; y++) {
		for (let x = 0; x < tileMap[y].length; x++) {
			const tileId = tileMap[y][x];
			const flags = 0;
			const variant = 0;
			const tileIdBytes = packUint32LE(tileId);
			tileBytes.push(...tileIdBytes, flags, variant);
		}
	}
	const uint8Array = new Uint8Array(tileBytes);
	const base64String = base64.fromUint8Array(uint8Array);
	return base64String;
}

async function processImageAndCreateYaml(outputYamlPath) {
	try {
		// Load JSON data
		const jsonData = await fs.readFile("output.json", "utf8");
		const data = JSON.parse(jsonData);
		const tileMapData = data.tileMap;

		const chunkSize = 16;
		const chunks = {};
		let chunkX = 0;
		let chunkY = 0;
		const maxDimension = 1000; // Adjust if your images are larger
		const chunkData = [];

		// Initialize chunkData with 0s
		for (let y = 0; y < maxDimension; y++) {
			chunkData[y] = new Array(maxDimension).fill(0);
		}

		// Populate chunkData from tileMapData
		for (const coordStr in tileMapData) {
			const [x, y] = coordStr.slice(1, -1).split(",").map(Number);
			const tile = tileMapData[coordStr]?.tile; // Handle potential missing tile
			const tileId = tileMap[tile] || 0; // Default to 0 if tile not found
			if (x >= 0 && x < maxDimension && y >= 0 && y < maxDimension) {
				chunkData[y][x] = tileId;
			}
		}

		for (let y = 0; y < maxDimension; y += chunkSize) {
			for (let x = 0; x < maxDimension; x += chunkSize) {
				const chunkTileMap = [];
				for (let cy = 0; cy < chunkSize; cy++) {
					const row = [];
					for (let cx = 0; cx < chunkSize; cx++) {
						const ty = y + cy;
						const tx = x + cx;
						// Corrected bounds checking:
						row.push(
							ty < maxDimension && tx < maxDimension
								? chunkData[ty][tx]
								: 0
						);
					}
					chunkTileMap.push(row);
				}
				const encodedChunk = encodeTiles(chunkTileMap);
				chunks[`${chunkX},${chunkY}`] = {
					ind: [`${chunkX},${chunkY}`],
					tiles: encodedChunk,
				};
				chunkX++;
				if (chunkX >= maxDimension / chunkSize) {
					chunkX = 0;
					chunkY++;
				}
			}
		}

		const yamlData = {
			type: "MapGrid",
			chunks: chunks,
			tileMap: {
				0: "DeepWater",
				1: "ShallowWater",
				2: "Snow",
				3: "Sand",
				4: "Dirt",
				5: "RockWall",
				6: "Grass",
				7: "DryDirt",
			},
		};

		const yamlString = yaml.dump(yamlData);
		await fs.writeFile(outputYamlPath, yamlString);
		console.log(`Successfully saved YAML data to ${outputYamlPath}`);
	} catch (error) {
		console.error("Error:", error);
	}
}

//This will now run the entire process.
(async () => {
	try {
		await processImageAndCreateYaml("output.yml");
	} catch (error) {
		console.error(error);
	}
})();
