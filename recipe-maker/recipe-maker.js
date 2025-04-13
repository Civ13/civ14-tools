const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

function removeCustomTags(yamlString) {
	const tagRegex = /!type:\w+/g;
	return yamlString.replace(tagRegex, "");
}

function loadEntities() {
	const inputDir = path.join(__dirname, "input");
	const entityIndex = {};

	if (!fs.existsSync(inputDir)) {
		throw new Error(`Input directory not found: ${inputDir}`);
	}

	const files = fs.readdirSync(inputDir);
	const yamlFiles = files.filter(
		(file) =>
			path.extname(file).toLowerCase() === ".yml" ||
			path.extname(file).toLowerCase() === ".yaml"
	);

	yamlFiles.forEach((file) => {
		const filePath = path.join(inputDir, file);
		try {
			let fileContent = fs.readFileSync(filePath, "utf8");
			fileContent = removeCustomTags(fileContent);
			const entityData = yaml.load(fileContent);
			const filename = path.basename(file, path.extname(file));
			entityIndex[filename] = entityData;
		} catch (error) {
			console.error(`Error processing YAML file ${file}:`, error);
		}
	});

	return entityIndex;
}

function generateOutputYAML(entityIndex) {
	const outputDir = path.join(__dirname, "output");
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir);
	}

	const outputData = [];

	for (const filename in entityIndex) {
		const entities = entityIndex[filename];

		entities.forEach((entity) => {
			if (entity.id && entity.name && entity.components) {
				const constructionEntry = {
					type: "construction",
					name: entity.name,
					id: entity.id,
					graph: entity.id,
					startNode: "start",
					targetNode: "end",
					category: "construction-category-misc",
					description: entity.description,
					icon: {},
					objectType: "Structure",
					placementMode: "SnapgridCenter",
					agemin: entity.agemin || 8,
					agemax: entity.agemax || 8,
				};

				const spriteComponent = entity.components.find(
					(c) => c.type === "Sprite"
				);
				if (spriteComponent && spriteComponent.sprite) {
					constructionEntry.icon.sprite = spriteComponent.sprite;
					if (
						spriteComponent.layers &&
						spriteComponent.layers.length > 0
					) {
						constructionEntry.icon.state =
							spriteComponent.layers[0].state || "default";
					} else {
						constructionEntry.icon.state = "default";
					}
				}

				const constructionComponent = entity.components.find(
					(c) => c.type === "Construction"
				);
				const material = constructionComponent?.material || "WoodPlank";
				const amount = constructionComponent?.cost || 5;
				const doAfter = constructionComponent?.time || 5; // Use time or default to 5
				const constructionGraphEntry = {
					type: "constructionGraph",
					id: entity.id,
					start: "start",
					graph: [
						{
							node: "start",
							edges: [
								{
									to: "end",
									steps: [
										{
											material: material,
											amount: amount,
											doAfter: doAfter, // Use the doAfter value
										},
									],
								},
							],
						},
						{
							node: "end",
							entity: entity.id,
						},
					],
				};

				outputData.push(constructionEntry);
				outputData.push(constructionGraphEntry);
			}
		});
	}

	const yamlOutput = yaml.dump(outputData);
	const outputFile = path.join(outputDir, "output.yml");
	fs.writeFileSync(outputFile, yamlOutput, "utf8");
	console.log(`Successfully wrote output to ${outputFile}`);
}

try {
	const entities = loadEntities();
	generateOutputYAML(entities);
} catch (error) {
	console.error("Error:", error.message);
}

module.exports = { loadEntities, generateOutputYAML };
