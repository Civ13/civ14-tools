const fs = require("fs");
const path = require("path");
const yaml = require("./js-yaml.min.js");

/**
 * Reads YAML files from the input/ folder and loads their data into an index.
 *
 * @returns {object} An index where keys are filenames (without extension) and values are the parsed YAML data.
 * @throws {Error} If the input/ folder does not exist or if there's an error parsing a YAML file.
 */
function loadRecipes() {
	const inputDir = path.join(__dirname, "input");
	const recipeIndex = {};

	// Check if the input directory exists
	if (!fs.existsSync(inputDir)) {
		throw new Error(`Input directory not found: ${inputDir}`);
	}

	// Read all files in the input directory
	const files = fs.readdirSync(inputDir);

	// Filter for YAML files
	const yamlFiles = files.filter(
		(file) =>
			path.extname(file).toLowerCase() === ".yml" ||
			path.extname(file).toLowerCase() === ".yaml"
	);

	// Process each YAML file
	yamlFiles.forEach((file) => {
		const filePath = path.join(inputDir, file);
		try {
			// Read the file content
			const fileContent = fs.readFileSync(filePath, "utf8");

			// Parse the YAML content
			const recipeData = yaml.load(fileContent);

			// Extract the filename without extension as the key
			const filename = path.basename(file, path.extname(file));

			// Add the data to the index
			recipeIndex[filename] = recipeData;
		} catch (error) {
			throw new Error(
				`Error processing YAML file ${file}: ${error.message}`
			);
		}
	});

	return recipeIndex;
}

// Example usage (optional):
try {
	const recipes = loadRecipes();
	console.log("Recipe Index:", recipes);
	// You can now access recipe data like this:
	// if (recipes.hasOwnProperty('my-recipe')) {
	//   console.log(recipes['my-recipe']);
	// }
} catch (error) {
	console.error("Error loading recipes:", error.message);
}

module.exports = { loadRecipes };
