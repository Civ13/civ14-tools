const fs = require("node:fs");
const path = require("node:path");
const yaml = require("./../js-yaml.min.js");
const { newRecipe, newGraph } = require("./../recipe_yamlifier.js");

const recipeList = JSON.parse(
	fs.readFileSync(
		"./../../recipe-converter/recipes/recipes_full.json",
		"utf8"
	)
);

class BladedWeaponIndexer {
	constructor(filePath) {
		this.filePath = filePath;
		this.index = null;
		this.load();
	}

	load() {
		try {
			const data = fs.readFileSync(this.filePath, "utf8");
			const jsonData = JSON.parse(data);
			this.index = this.parseBladedWeapons(jsonData);
		} catch (err) {
			console.error(`Error loading or parsing ${this.filePath}:`, err);
			this.index = null;
		}
	}

	parseBladedWeapons(jsonData) {
		if (!jsonData || !jsonData.Types || !Array.isArray(jsonData.Types)) {
			console.error("Invalid JSON data format.");
			return {};
		}

		const bladedWeapons = {};

		jsonData.Types.forEach((weapon) => {
			if (weapon.Path.startsWith("/obj/item/weapon/material/sword/")) {
				const pathParts = weapon.Path.split("/");
				const weaponName = pathParts[pathParts.length - 1];
				bladedWeapons[weaponName] = weapon;
			}
		});

		return bladedWeapons;
	}

	saveToYaml(filepath) {
		if (this.index === null || Object.keys(this.index).length === 0) {
			console.error("No bladed weapons found or index loading failed.");
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
				"civ13_sword_" + parsedName,
				weapon.Variables.desc,
				"weapons",
				"Civ14/exported/weapons/" +
					weapon.Variables.icon_state +
					".rsi",
				"icon",
				"Item"
			);
			let recipeData = findRecipe(weapon.Path, recipeList);
			let graph = newGraph(
				"civ13_sword_" + parsedName,
				recipeData[2],
				recipeData[0],
				recipeData[1]
			);
			yamlStr += yaml.dump(
				convertToSS14(
					weapon.Variables.name,
					"civ13_sword_" + parsedName,
					weapon.Variables.desc,
					"Civ14/exported/weapons/" +
						weapon.Variables.icon_state +
						".rsi",
					Math.round(weapon.Variables.force_divisor * 55)
				)
			);
			yamlRecp += yaml.dump(recipe) + "\n" + yaml.dump(graph);
		}
		fs.writeFileSync(
			"./../output/yml/entities_bladed.yml",
			yamlStr,
			"utf8"
		);
		fs.writeFileSync(
			"./../output/yml/recipes_bladed.yml",
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
	}
}
function convertToSS14(
	_name = "",
	_id = "",
	_desc = "",
	_sprite = "",
	_dmg = ""
) {
	return [
		{
			type: "entity",
			name: _name,
			parent: "BaseSword",
			id: _id,
			description: _desc,
			components: [
				{
					type: "Sprite",
					sprite: _sprite,
				},
				{
					type: "MeleeWeapon",
					damage: {
						types: {
							Slash: _dmg,
						},
					},
					soundHit: {
						path: "/Audio/Weapons/bladeslice.ogg",
					},
				},
				{
					type: "Item",
					sprite: _sprite,
				},
				{
					type: "DisarmMalus",
				},
				{
					type: "Construction",
					node: "end",
				},
			],
		},
	];
}

// Example usage:
const indexer = new BladedWeaponIndexer(
	path.join(__dirname, "./../output/civ13_item.json")
);

// Wait for the index to load before accessing data.  No timeout needed since it's synchronous.
indexer.saveToYaml(path.join(__dirname, "bladed_weapons.yml"));

module.exports = BladedWeaponIndexer;
