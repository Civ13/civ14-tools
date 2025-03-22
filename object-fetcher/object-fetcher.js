const fs = require("node:fs");

class Civ13Indexer {
	constructor(filePath) {
		this.filePath = filePath;
		this.index = [];
		this.load();
	}

	load() {
		try {
			const data = fs.readFileSync(this.filePath, "utf8");
			const json = JSON.parse(data);
			this.index = json.Types.map((obj, index) => ({ ...obj, index })); // Add index to each object
		} catch (err) {
			console.error(`Error loading or parsing ${this.filePath}:`, err);
			this.index = null; // Indicate failure
		}
	}

	getObject(objectNr) {
		if (this.index === null) {
			return null; // Index loading failed
		}
		return this.index.find((obj) => obj.index === objectNr) || null; // Find object by index
	}

	filterObjectsByPath(paths) {
		return this.index.filter((object) => {
			if (object && object.Path) {
				return paths.some((path) => object.Path.startsWith(path));
			}
			return false;
		});
	}

	cleanObject(object) {
		if (!object) return;
		for (const key in object) {
			if (
				key.toLowerCase() === "procs" ||
				key.toLowerCase() === "initproc"
			) {
				delete object[key];
			}
		}
	}

	cleanObjects() {
		this.index.forEach((object) => this.cleanObject(object));
	}
}

function countByType(indexes) {
	const pathCounts = {
		"/obj/structure/": 0,
		"/obj/item/": 0,
		"/mob/living/simple_animal/": 0,
		"/turf/": 0,
	};

	for (const object of indexes) {
		if (object && object.Path) {
			for (const path in pathCounts) {
				if (object.Path.startsWith(path)) {
					pathCounts[path]++;
					break; // Move to the next object once a match is found
				}
			}
		}
	}

	console.log("Object Counts by Type:");
	console.log("  Structures:", pathCounts["/obj/structure/"]);
	console.log("  Items:", pathCounts["/obj/item/"]);
	console.log("  Animals:", pathCounts["/mob/living/simple_animal/"]);
	console.log("  Turf:", pathCounts["/turf/"]);
}

function ensureDirectoryExists(dirPath) {
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive: true });
		console.log(`Created directory: ${dirPath}`);
	}
}

function saveCleanedData(data, filePath) {
	ensureDirectoryExists("./output");
	const cleanedData = JSON.stringify({ Types: data }, null, 2);
	fs.writeFile(filePath, cleanedData, (err) => {
		if (err) {
			console.error("Error saving data:", err);
		} else {
			console.log(`Parsed data saved to ${filePath}`);
		}
	});
}

// Main execution
const indexer = new Civ13Indexer("./civ13.json");

setTimeout(() => {
	if (indexer.index) {
		console.log("Total Atoms:", indexer.index.length);
		console.log("Building references...");
		indexer.cleanObjects();

		const structurePaths = ["/obj/structure/"];
		const itemPaths = ["/obj/item/"];
		const mobPaths = ["/mob/living/simple_animal/"];
		const turfPaths = ["/turf/"];

		const structureObjects = indexer.filterObjectsByPath(structurePaths);
		const itemObjects = indexer.filterObjectsByPath(itemPaths);
		const mobObjects = indexer.filterObjectsByPath(mobPaths);
		const turfObjects = indexer.filterObjectsByPath(turfPaths);

		console.log("Cleanup complete.");
		console.log("Total Atoms:", indexer.index.length);

		console.log("Structure objects:");
		countByType(structureObjects);
		saveCleanedData(structureObjects, "./output/civ13_structure.json");

		console.log("Item objects:");
		countByType(itemObjects);
		saveCleanedData(itemObjects, "./output/civ13_item.json");

		console.log("Mob objects:");
		countByType(mobObjects);
		saveCleanedData(mobObjects, "./output/civ13_mob.json");

		console.log("Turf objects:");
		countByType(turfObjects);
		saveCleanedData(turfObjects, "./output/civ13_turf.json");
	} else {
		console.error("Failed to load index.");
	}
}, 100);

module.exports = Civ13Indexer;
