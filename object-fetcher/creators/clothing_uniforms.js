const fs = require("node:fs");
const path = require("node:path");
const yaml = require("../js-yaml.min.js");
const { newRecipe, newGraph } = require("../recipe_yamlifier.js");

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
			if (clothing.Path.startsWith("/obj/item/clothing/under/")) {
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
			let parsedName = clothing.Variables.name.replace(/[\s-]/g, "_");
			let recipe = newRecipe(
				clothing.Variables.name,
				"civ13_uniform_" + parsedName,
				clothing.Variables.desc,
				"clothing",
				"Civ14/Clothing/exported/" +
					clothing.Variables.icon_state +
					".rsi",
				"icon",
				"Item"
			);
			let recipeData = findRecipe(clothing.Path, recipeList);
			let graph = newGraph(
				"civ13_uniform_" + parsedName,
				recipeData[2],
				recipeData[0],
				recipeData[1]
			);
			let armor = {
				blunt: 0,
				slash: 0,
				piercing: 0,
				arrow: 0,
				heat: 0,
				radiation: 0,
			};
			if (clothing.Variables.armor) {
				armor.blunt = clothing.Variables.armor.melee;
				armor.slash = clothing.Variables.armor.melee;
				armor.piercing = clothing.Variables.armor.gun;
				armor.arrow = clothing.Variables.armor.arrow;
				armor.heat = clothing.Variables.armor.energy;
				armor.radiation = clothing.Variables.armor.rad;
			} else if (clothing.parent) {
				for (const parentClothing in this.index) {
					if (
						parentClothing.Path === clothing.parent &&
						parentClothing.Variables.armor
					) {
						armor.blunt = parentClothing.Variables.armor.melee;
						armor.slash = parentClothing.Variables.armor.melee;
						armor.piercing = parentClothing.Variables.armor.gun;
						armor.arrow = parentClothing.Variables.armor.arrow;
						armor.heat = parentClothing.Variables.armor.energy;
						armor.radiation = parentClothing.Variables.armor.rad;
						break;
					}
				}
			}
			yamlStr += yaml.dump(
				convertToSS14(
					clothing.Variables.name,
					"civ13_uniform_" + parsedName,
					clothing.Variables.desc,
					"Civ14/Clothing/exported/uniforms/" +
						clothing.Variables.icon_state +
						".rsi",
					Math.round(clothing.Variables.force_divisor * 55),
					armor
				)
			);
			yamlRecp += yaml.dump(recipe) + "\n" + yaml.dump(graph);
		}
		fs.writeFileSync(
			"./../output/yml/entities_clothing_uniform.yml",
			yamlStr,
			"utf8"
		);
		fs.writeFileSync(
			"./../output/yml/recipes_clothing_uniform.yml",
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
				parseInt(recipe.time) / 1000,
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
		blunt: 0,
		slash: 0,
		piercing: 0,
		arrow: 0,
		heat: 0,
		radiation: 0,
	}
) {
	return [
		{
			type: "entity",
			name: _name,
			parent: "ClothingUniformBase",
			id: _id,
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
						coefficients: {
							Blunt: _armor.blunt,
							Slash: _armor.slash,
							Piercing: _armor.piercing,
							Arrow: _armor.arrow,
							Heat: _armor.heat,
							Radiation: _armor.radiation,
						},
					},
				},
			],
		},
	];
}

// Example usage:
const indexer = new ClothingIndexer(
	path.join(__dirname, "./../output/civ13_item.json")
);

// Wait for the index to load before accessing data.  No timeout needed since it's synchronous.
indexer.saveToYaml();

module.exports = ClothingIndexer;
