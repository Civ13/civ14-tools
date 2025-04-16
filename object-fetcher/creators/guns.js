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
			this.index = this.parseWeapons(jsonData);
		} catch (err) {
			console.error(`Error loading or parsing ${this.filePath}:`, err);
			this.index = null;
		}
	}

	parseWeapons(jsonData) {
		if (!jsonData || !jsonData.Types || !Array.isArray(jsonData.Types)) {
			console.error("Invalid JSON data format.");
			return {};
		}

		const Weapons = {};

		jsonData.Types.forEach((weapon) => {
			if (
				weapon.Path.startsWith(
					"/obj/item/weapon/gun/projectile/pistol/"
				)
			) {
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
		let yamlRecp = "";
		for (const weaponName in this.index) {
			const weapon = this.index[weaponName];
			if (!weapon.Variables || !weapon.Variables.name) {
				continue;
			}
			let parsedName = weapon.Variables.name.replace(/[\s-]/g, "_");

			yamlStr += yaml.dump(
				convertToSS14(
					weapon.Variables.name,
					"civ13_pistol_" + parsedName,
					weapon.Variables
				)
			);
		}
		fs.writeFileSync(
			"./../output/yml/entities_pistol.yml",
			yamlStr,
			"utf8"
		);
		console.log(`YAML data successfully written to ${filepath}`);
	}
}

function convertToSS14(_name = "", _id = "", _vars = "") {
	let _magId = "MagazinePistol";
	let _cartridgeId = "CartridgePistol";
	if (_vars.caliber) {
		_cartridgeId = "civ13_caliber_" + _vars.caliber;
	}
	if (_vars.magazine_type) {
		_magId = findMagVars(_vars.magazine_type.value);
	}
	let soundPath = "/Audio/Weapons/Guns/Gunshots/pistol.ogg";
	if (_vars.fire_sound && _vars.fire_sound.resourcePath) {
		soundPath = _vars.fire_sound.resourcePath.replace(
			"sound/weapons/guns/fire/",
			"/Audio/Weapons/Guns/Fire/"
		);
	}
	let fireDelay = 3;
	if (_vars.fire_delay) {
		fireDelay = Math.round(10 / _vars.fire_delay);
	}
	let baseEntity = {
		type: "entity",
		name: _name,
		parent: "BaseWeaponPistol",
		id: _id,
		description: _vars.desc,
		components: [
			{
				type: "Sprite",
				sprite: "Objects/Weapons/Guns/" + _vars.icon_state + ".rsi",
				layers: [
					{
						state: "icon",
						map: ["enum.GunVisualLayers.Base"],
					},
					{
						state: "mag",
						map: ["enum.GunVisualLayers.Mag"],
					},
				],
			},
			{
				type: "Clothing",
				sprite: "Objects/Weapons/Guns/" + _vars.icon_state + ".rsi",
				quickEquip: false,
				slots: ["suitStorage", "Belt"],
			},
			{
				type: "Gun",
				fireRate: fireDelay,
				selectedMode: "SemiAuto",
				availableModes: ["SemiAuto"],
				soundGunshot: {
					path: soundPath,
				},
			},
			{
				type: "ChamberMagazineAmmoProvider",
				soundRack: {
					path: "/Audio/Weapons/Guns/Cock/pistol_cock.ogg",
				},
			},
			{
				type: "ItemSlots",
				slots: {
					gun_magazine: {
						name: "Magazine",
						startingItem: _magId,
						insertSound:
							"/Audio/Weapons/Guns/MagIn/pistol_magin.ogg",
						ejectSound:
							"/Audio/Weapons/Guns/MagOut/pistol_magout.ogg",
						priority: 2,
						whitelist: {
							tags: [_magId],
						},
						whitelistFailPopup: "gun-magazine-whitelist-fail",
					},
					gun_chamber: {
						name: "Chamber",
						startingItem: _cartridgeId,
						priority: 1,
						whitelist: {
							tags: [_cartridgeId],
						},
					},
				},
			},
			{
				type: "MagazineVisuals",
				magState: "mag",
				steps: 1,
				zeroVisible: true,
			},
		],
	};

	return [baseEntity];
	function findMagVars(itemIndex) {
		for (var item in this.index) {
			if (this.index[item].index == itemIndex) {
				let parsedName = this.index[item].Variables.Path.replace(
					"/obj/item/ammo_magazine/",
					""
				);
				return "civ13_magazine_" + parsedName;
			}
		}
		return "civ13_magazine_default";
	}
}

// Example usage:
const indexer = new WeaponIndexer(
	path.join(__dirname, "./../output/civ13_item.json")
);

// Wait for the index to load before accessing data.  No timeout needed since it's synchronous.
indexer.saveToYaml(path.join(__dirname, "pistols.yml"));

module.exports = WeaponIndexer;
