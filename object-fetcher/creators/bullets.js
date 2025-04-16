const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");

class WeaponIndexer {
	constructor(filePath) {
		this.filePath = filePath;
		this.index = null;
		this.load();
	}

	load() {
		try {
			const data = fs.readFileSync(this.filePath, "utf8");
			const jsonData = JSON.parse(data);
			this.index = this.parseBullet(jsonData);
		} catch (err) {
			console.error(`Error loading or parsing ${this.filePath}:`, err);
			this.index = null;
		}
	}

	parseBullet(jsonData) {
		if (!jsonData || !jsonData.Types || !Array.isArray(jsonData.Types)) {
			console.error("Invalid JSON data format.");
			return {};
		}

		const Weapons = {};

		jsonData.Types.forEach((weapon) => {
			if (weapon.Path.startsWith("/obj/item/projectile/bullet/")) {
				const pathParts = weapon.Path.split("/");
				const weaponName = pathParts[pathParts.length - 1];
				Weapons[weaponName] = weapon;
			}
		});

		return Weapons;
	}

	saveToYaml(filepath) {
		if (this.index === null || Object.keys(this.index).length === 0) {
			console.error("No weapons found or index loading failed.");
			return;
		}
		let yamlStr = "";
		for (const weaponName in this.index) {
			const weapon = this.index[weaponName];
			if (!weapon.Variables) {
				continue;
			}
			let parsedName = weapon.Path.replace(
				"/obj/item/projectile/bullet/",
				""
			);
			parsedName = parsedName.replace("/", "_");
			console.log(parsedName);
			yamlStr += yaml.dump(
				convertToSS14("civ13_bullet_" + parsedName, weapon.Variables)
			);
		}
		fs.writeFileSync(
			"./../output/yml/entities_bullets.yml",
			yamlStr,
			"utf8"
		);
		console.log(`YAML data successfully written to ${filepath}`);
	}
}

function convertToSS14(_id = "", _vars = "") {
	let baseEntity = {
		type: "entity",
		id: _id,
		name: _id,
		parent: "BaseBullet",
		categories: ["HideSpawnMenu"],
		components: [
			{
				type: "Projectile",
				damage: {
					types: {
						Piercing: Math.round(_vars.damage / 3),
					},
				},
			},
		],
	};

	return [baseEntity];
}

// Example usage:
const indexer = new WeaponIndexer(
	path.join(__dirname, "./../output/civ13_item.json")
);

// Wait for the index to load before accessing data.  No timeout needed since it's synchronous.
indexer.saveToYaml(path.join(__dirname, "bullets.yml"));

module.exports = WeaponIndexer;
