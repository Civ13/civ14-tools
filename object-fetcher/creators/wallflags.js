const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");

class ItemIndexer {
	constructor(filePath) {
		this.filePath = filePath;
		this.index = null;
		this.load();
	}

	load() {
		try {
			const data = fs.readFileSync(this.filePath, "utf8");
			const jsonData = JSON.parse(data);
			this.index = this.parseItem(jsonData);
		} catch (err) {
			console.error(`Error loading or parsing ${this.filePath}:`, err);
			this.index = null;
		}
	}

	parseItem(jsonData) {
		if (!jsonData || !jsonData.Types || !Array.isArray(jsonData.Types)) {
			console.error("Invalid JSON data format.");
			return {};
		}

		const Items = {};

		jsonData.Types.forEach((item) => {
			if (item.Path.startsWith("/obj/structure/sign/flag/")) {
				const pathParts = item.Path.split("/");
				const itemName = pathParts[pathParts.length - 1];
				Items[itemName] = item;
			}
		});

		return Items;
	}

	saveToYaml(filepath) {
		if (this.index === null || Object.keys(this.index).length === 0) {
			console.error("No items found or index loading failed.");
			return;
		}
		let yamlStr = "";
		for (const itemName in this.index) {
			const item = this.index[itemName];
			if (!item.Variables) {
				continue;
			}
			let parsedName = item.Path.replace("/obj/structure/sign/flag/", "");
			parsedName = parsedName.replace("/", "_");
			console.log(parsedName);
			yamlStr += yaml.dump(
				convertToSS14("civ13_wallflag_" + parsedName, item.Variables)
			);
		}
		fs.writeFileSync(filepath, yamlStr, "utf8");
		console.log(`YAML data successfully written to ${filepath}`);
	}
}

function convertToSS14(_id = "", _vars = "") {
	let baseEntity = {
		type: "entity",
		id: _id,
		name: _vars.name,
		description: _vars.desc,
		parent: "WallFlagWhite",
		components: [
			{
				type: "Sprite",
				state: _vars.icon_state,
			},
		],
	};

	return [baseEntity];
}

const indexer = new ItemIndexer(path.join(__dirname, "./../civ13.json"));

indexer.saveToYaml("./../output/yml/wallflags.yml");
