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
			this.index = json.Types;
			for (var ob in this.index) {
				this.index[ob].index = ob;
			}
		} catch (err) {
			console.error(`Error loading or parsing ${this.filePath}:`, err);
			this.index = null; // Indicate failure
		}
	}

	getObject(objectNr) {
		if (this.index === null) {
			return null; // Index loading failed
		}
		return this.index[objectNr];
	}
}

function count_by_type(indexes) {
	let count = [0, 0, 0, 0, 0];
	for (var ob in indexes) {
		let object = indexes[ob];

		if (object.Path.startsWith("/obj/structure/")) {
			count[0]++;
		}
		if (object.Path.startsWith("/obj/machinery/")) {
			count[1]++;
		}
		if (object.Path.startsWith("/obj/item/")) {
			count[2]++;
		}
		if (object.Path.startsWith("/mob/living/simple_animal/")) {
			count[3]++;
		}
		if (object.Path.startsWith("/turf/")) {
			count[4]++;
		}
	}
	console.log("  Structures:", count[0]);
	console.log("  Machinery:", count[1]);
	console.log("  Items:", count[2]);
	console.log("  Animals:", count[3]);
	console.log("  Turf:", count[4]);
}

// Example usage:
const indexer = new Civ13Indexer("./civ13.json");

// Wait for the index to load (asynchronously) before accessing data.
setTimeout(() => {
	if (indexer.index) {
		console.log("Total Atoms:", indexer.index.length);
		console.log("Building references...");

		// Filter the index directly to remove unwanted objects
		indexer.index = indexer.index.filter((object) => {
			if (object && object.Path) {
				return (
					object.Path.startsWith("/obj/structure/") ||
					object.Path.startsWith("/obj/machinery/") ||
					object.Path.startsWith("/obj/item/") ||
					object.Path.startsWith("/mob/living/simple_animal/") ||
					object.Path.startsWith("/turf/")
				);
			}
			return true; // Keep objects without a Path property
		});

		for (var ob in indexer.index) {
			var object = indexer.getObject(ob);
			if (object) {
				//remove all vars called "Procs" and "InitProc"
				for (const key in object) {
					if (
						key.toLowerCase() === "procs" ||
						key.toLowerCase() === "initproc"
					) {
						delete object[key];
					}
				}
			}
		}

		console.log("Cleanup complete.");
		console.log("Total Atoms:", indexer.index.length);
		count_by_type(indexer.index);
		// Save the cleaned index to a new JSON file
		const cleanedData = JSON.stringify({ Types: indexer.index }, null, 2); // Format with 2-space indentation
		fs.writeFile("./civ13_output.json", cleanedData, (err) => {
			if (err) {
				console.error("Error saving data:", err);
			} else {
				console.log("Parsed data saved to civ13_output.json");
			}
		});
	} else {
		console.error("Failed to load index.");
	}
}, 100); // Adjust timeout if loading takes longer.

module.exports = Civ13Indexer; //For use in other modules
