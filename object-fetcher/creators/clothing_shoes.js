const fs = require("node:fs");
const path = require("node:path");
const yaml = require("../js-yaml.min.js");
const { newRecipe, newGraph } = require("../recipe_yamlifier.js");
let usedIds = {}; // Keep track of used IDs

const recipeList = JSON.parse(
	fs.readFileSync(
		"./../../recipe-converter/recipes/recipes_full.json",
		"utf8"
	)
);

class ClothingIndexer {
	constructor(filePath) {
		this.filePath = filePath;
		this.index = null;
		this.load();
	}

	load() {
		try {
			const data = fs.readFileSync(this.filePath, "utf8");
			const jsonData = JSON.parse(data);
			this.index = this.parseClothings(jsonData);
		} catch (err) {
			console.error(`Error loading or parsing ${this.filePath}:`, err);
			this.index = null;
		}
	}

	parseClothings(jsonData) {
		if (!jsonData || !jsonData.Types || !Array.isArray(jsonData.Types)) {
			console.error("Invalid JSON data format.");
			return {};
		}

		const Clothings = {};

		jsonData.Types.forEach((clothing) => {
			if (clothing.Path.startsWith("/obj/item/clothing/shoes/")) {
				const pathParts = clothing.Path.split("/");
				const clothingName = pathParts[pathParts.length - 1];
				Clothings[clothingName] = clothing;
			}
		});

		return Clothings;
	}

	saveToYaml() {
		if (this.index === null || Object.keys(this.index).length === 0) {
			console.error("No clothing found or index loading failed.");
			return;
		}
		let yamlStr = "";
		let yamlRecp = "";
		for (const clothingName in this.index) {
			const clothing = this.index[clothingName];
			if (!clothing.Variables || !clothing.Variables.name) {
				continue;
			}
			let iconState = clothing.Variables.icon_state;
			if (!clothing.Variables.icon_state) {
				console.log(
					"No icon state found for",
					clothing.Variables.name,
					", checking parent " + clothing.Parent
				);

				for (const parentClothing in this.index) {
					const parent = this.index[parentClothing];
					if (parent.index === clothing.Parent) {
						iconState = parent.Variables.icon_state;
						console.log(
							"Using parent icon state for ",
							clothing.Variables.name +
								" - " +
								parent.Variables.icon_state
						);
						break;
					}
				}
			}
			let parsedName = clothing.Variables.name.replace(/[\s-]/g, "_");
			parsedName = parsedName.replace(/[\s']/g, "");
			let uniqueId = "civ13_shoes_" + parsedName;
			let count = 1;
			while (usedIds[uniqueId]) {
				uniqueId = `${uniqueId}_${count}`;
				count++;
			}
			usedIds[uniqueId] = true; // Mark the ID as used

			let recipe = newRecipe(
				clothing.Variables.name,
				uniqueId,
				clothing.Variables.desc,
				"clothing",
				"Civ14/Clothing/exported/shoes/" + iconState + ".rsi",
				"icon",
				"Item"
			);

			let recipeData = findRecipe(clothing.Path, recipeList);
			let graph = newGraph(
				uniqueId,
				recipeData[2],
				recipeData[0],
				recipeData[1]
			);
			let armor = {
				Blunt: 0,
				Slash: 0,
				Piercing: 0,
				Arrow: 0,
				Heat: 0,
				Radiation: 0,
			};
			if (clothing.Variables.armor) {
				armor.Blunt = 1 - clothing.Variables.armor.melee / 100;
				armor.Slash = 1 - clothing.Variables.armor.melee / 100;
				armor.Piercing = 1 - clothing.Variables.armor.gun / 100;
				armor.Arrow = 1 - clothing.Variables.armor.arrow / 100;
				armor.Heat = 1 - clothing.Variables.armor.energy / 100;
				armor.Radiation = 1 - clothing.Variables.armor.rad / 100;
			} else if (clothing.Parent) {
				for (const parentClothing in this.index) {
					const parent = this.index[parentClothing];
					if (
						parent.index === clothing.Parent &&
						parent.Variables &&
						parent.Variables.armor
					) {
						armor.Blunt = 1 - parent.Variables.armor.melee / 100;
						armor.Slash = 1 - parent.Variables.armor.melee / 100;
						armor.Piercing = 1 - parent.Variables.armor.gun / 100;
						armor.Arrow = 1 - parent.Variables.armor.arrow / 100;
						armor.Heat = 1 - parent.Variables.armor.energy / 100;
						armor.Radiation = 1 - parent.Variables.armor.rad / 100;
						break;
					}
				}
			}

			yamlStr += yaml.dump(
				convertToSS14(
					clothing.Variables.name,
					"civ13_shoes_" + parsedName,
					clothing.Variables.desc,
					"Civ14/Clothing/exported/shoes/" + iconState + ".rsi",
					Math.round(clothing.Variables.force_divisor * 55),
					armor,
					recipeData,
					uniqueId
				)
			);
			yamlRecp += yaml.dump(recipe) + "\n" + yaml.dump(graph);
		}
		fs.writeFileSync(
			"./../output/yml/entities_clothing_shoes.yml",
			yamlStr,
			"utf8"
		);
		fs.writeFileSync(
			"./../output/yml/recipes_clothing_shoes.yml",
			yamlRecp,
			"utf8"
		);
		console.log(`YAML data successfully written.`);
	}
}
function findRecipe(weaponPath, recipeList) {
	let result = [5, 5, "Cloth"];
	for (const recipe of recipeList) {
		if (recipe.template_name === weaponPath) {
			result = [
				parseInt(recipe.res_amount),
				Math.round(parseInt(recipe.time) / 1000),
				parseMaterial(recipe.material),
			];
		}
	}
	return result;
}
function parseMaterial(material) {
	if (material == "bone") {
		return "Bone";
	} else if (material == "iron") {
		return "Iron";
	} else if (material == "gold") {
		return "Gold";
	} else if (material == "steel") {
		return "Steel";
	} else if (material == "silver") {
		return "Silver";
	} else if (material == "copper") {
		return "Copper";
	} else if (material == "wood" || material == "woodsoft") {
		return "WoodPlank";
	} else if (material == "stone") {
		return "Stone";
	} else if (material == "cloth") {
		return "Cloth";
	} else if (material == "leather") {
		return "Leather";
	} else if (material.search("pelt") != -1) {
		return "Leather";
	}
}
function convertToSS14(
	_name = "",
	_id = "",
	_desc = "",
	_sprite = "",
	_dmg = "",
	_armor = {
		Blunt: 1,
		Slash: 1,
		Piercing: 1,
		Arrow: 1,
		Heat: 1,
		Radiation: 1,
	},
	recipeData = [5, 5, "Cloth"],
	uniqueId
) {
	let new_armor = {};
	if (_armor.Blunt != 1) {
		new_armor.Blunt = _armor.Blunt;
	}
	if (_armor.Slash != 1) {
		new_armor.Slash = _armor.Slash;
	}
	if (_armor.Piercing != 1) {
		new_armor.Piercing = _armor.Piercing;
	}
	if (_armor.Arrow != 1) {
		new_armor.Arrow = _armor.Arrow;
	}
	if (_armor.Heat != 1) {
		new_armor.Heat = _armor.Heat;
	}
	if (_armor.Radiation != 1) {
		new_armor.Radiation = _armor.Radiation;
	}

	return [
		{
			type: "entity",
			name: _name,
			parent: "ClothingShoesBase",
			id: uniqueId,
			description: _desc,
			components: [
				{
					type: "Sprite",
					sprite: _sprite,
				},
				{
					type: "Clothing",
					sprite: _sprite,
				},
				{
					type: "Armor",
					modifiers: {
						coefficients: new_armor,
					},
				},
				{
					type: "Construction",
					graph: uniqueId,
					node: "end",
					cost: recipeData[0],
					material: recipeData[2],
					time: recipeData[1],
				},
			],
		},
	];
}

// Example usage:
const indexer = new ClothingIndexer(
	path.join(__dirname, "./../output/civ13_item_merged.json")
);

// Wait for the index to load before accessing data.  No timeout needed since it's synchronous.
indexer.saveToYaml();

module.exports = ClothingIndexer;
