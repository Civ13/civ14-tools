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
			this.index = this.parseMag(jsonData);
		} catch (err) {
			console.error(`Error loading or parsing ${this.filePath}:`, err);
			this.index = null;
		}
	}

	parseMag(jsonData) {
		if (!jsonData || !jsonData.Types || !Array.isArray(jsonData.Types)) {
			console.error("Invalid JSON data format.");
			return {};
		}

		const Weapons = {};

		jsonData.Types.forEach((weapon) => {
			if (weapon.Path.startsWith("/obj/item/ammo_magazine/")) {
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
			if (!weapon.Variables || !weapon.Variables.name) {
				continue;
			}
			let parsedName = weapon.Variables.name.replace(/[\s-]/g, "_");

			yamlStr += yaml.dump(
				convertToSS14(
					weapon.Variables.name,
					"civ13_magazine_" + parsedName,
					weapon.Variables
				)
			);
		}
		fs.writeFileSync(
			"./../output/yml/entities_magazines.yml",
			yamlStr,
			"utf8"
		);
		console.log(`YAML data successfully written to ${filepath}`);
	}
}

function convertToSS14(_name = "", _id = "", _vars = "") {
	let _cartridgeId = "CartridgePistol";
	let _capacity = 10;
	if (_vars.caliber) {
		_cartridgeId = "civ13_caliber_" + _vars.caliber;
	}
	if (_vars.max_ammo) {
		_capacity = _vars.max_ammo;
	}
	let baseEntity = {
		type: "entity",
		id: _id,
		name: _vars.name,
		parent: "BaseMagazinePistol",
		components: [
			{
				type: "BallisticAmmoProvider",
				mayTransfer: true,
				whitelist: {
					tags: [_cartridgeId],
				},
				capacity: _capacity,
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
indexer.saveToYaml(path.join(__dirname, "magazines.yml"));

module.exports = WeaponIndexer;
