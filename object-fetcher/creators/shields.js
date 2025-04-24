const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");
const { newRecipe, newGraph } = require("../recipe_yamlifier.js");

const recipeList = JSON.parse(
	fs.readFileSync(
		"./../../recipe-converter/recipes/recipes_full.json",
		"utf8"
	)
);

class ShieldIndexer {
	constructor(filePath) {
		this.filePath = filePath;
		this.index = null;
		this.load();
	}

	load() {
		try {
			const data = fs.readFileSync(this.filePath, "utf8");
			const jsonData = JSON.parse(data);
			this.index = this.parseShields(jsonData);
		} catch (err) {
			console.error(`Error loading or parsing ${this.filePath}:`, err);
			this.index = null;
		}
	}

	parseShields(jsonData) {
		if (!jsonData || !jsonData.Types || !Array.isArray(jsonData.Types)) {
			console.error("Invalid JSON data format.");
			return {};
		}

		const Shields = {};

		jsonData.Types.forEach((weapon) => {
			if (weapon.Path.startsWith("/obj/item/weapon/shield")) {
				const pathParts = weapon.Path.split("/");
				const weaponName = pathParts[pathParts.length - 1];
				Shields[weaponName] = weapon;
			}
		});

		return Shields;
	}

	saveToYaml(filepath) {
		if (this.index === null || Object.keys(this.index).length === 0) {
			console.error("No shields found or index loading failed.");
			return;
		}
		let yamlStr = "";
		let yamlRecp = "";
		for (const weaponName in this.index) {
			const weapon = this.index[weaponName];
			if (!weapon.Variables || !weapon.Variables.name) {
				continue;
			}
			let parsedName = weapon.Variables.name.replace(/[\s-]/g, "_");
			let recipe = newRecipe(
				weapon.Variables.name,
				"civ13_shield_" + parsedName,
				weapon.Variables.desc,
				"weapons",
				"Civ14/Weapons/" + weapon.Variables.icon_state + ".rsi",
				"icon",
				"Item"
			);
			let recipeData = findRecipe(weapon.Path, recipeList);
			let graph = newGraph(
				"civ13_shield_" + parsedName,
				recipeData[2],
				recipeData[0],
				recipeData[1]
			);
			yamlStr += yaml.dump(
				convertToSS14(
					weapon.Variables.name,
					"civ13_shield_" + parsedName,
					weapon.Variables.desc,
					"Civ14/Weapons/" + weapon.Variables.icon_state + ".rsi",
					weapon.Variables
				)
			);
			yamlRecp += yaml.dump(recipe) + "\n" + yaml.dump(graph);
		}
		fs.writeFileSync(
			"./../output/yml/entities_shields.yml",
			yamlStr,
			"utf8"
		);
		fs.writeFileSync(
			"./../output/yml/recipes_shields.yml",
			yamlRecp,
			"utf8"
		);
		console.log(`YAML data successfully written to ${filepath}`);
	}
}
function findRecipe(weaponPath, recipeList) {
	let result = [5, 5, "Steel"];
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
	} else if (material == "bronze") {
		return "Bronze";
	}
}
function convertToSS14(
	_name = "",
	_id = "",
	_desc = "",
	_sprite = "",
	_vars = ""
) {
	let _parsedhealth = 60;
	if (_vars.health) {
		_parsedhealth = _vars.health * 2.5;
	}
	let _parsedblock = 0.85;
	if (_vars.base_block_chance) {
		_parsedblock = (100 - _vars.base_block_chance) / 100;
	}
	return [
		{
			type: "entity",
			name: _name,
			parent: "WoodenBuckler",
			id: _id,
			description: "A shield. Blocks melee damage.",
			components: [
				{
					type: "Sprite",
					sprite: _sprite,
				},
				{
					type: "Blocking",
					passiveBlockModifier: {
						coefficients: {
							Blunt: _parsedblock.toFixed(3),
							Slash: _parsedblock.toFixed(3),
							Piercing: _parsedblock.toFixed(3),
						},
					},
					activeBlockModifier: {
						coefficients: {
							Blunt: (_parsedblock * 0.88).toFixed(3),
							Slash: (_parsedblock * 0.88).toFixed(3),
							Piercing: (_parsedblock * 0.88).toFixed(3),
						},
						flatReductions: {
							Blunt: 1,
							Slash: 1,
							Piercing: 1,
						},
					},
				},
				{
					type: "Item",
					sprite: _sprite,
				},
				{
					type: "Destructible",
					thresholds: [
						{
							trigger: {
								damage: _parsedhealth,
							},
							behaviors: [
								{
									acts: ["Destruction"],
								},
							],
						},
					],
				},
				{
					type: "Construction",
					graph: _id,
					node: "end",
				},
			],
		},
	];
}

// Example usage:
const indexer = new ShieldIndexer(
	path.join(__dirname, "./../output/civ13_item.json")
);

// Wait for the index to load before accessing data.  No timeout needed since it's synchronous.
indexer.saveToYaml(path.join(__dirname, "shields.yml"));

module.exports = ShieldIndexer;
