const fs = require("fs");
const path = require("path");

// ... (Assuming copyAndRename is defined elsewhere) ...

const outputDir = "d:/GitHub/civ14-tools/recipe-consolidator/output"; // Adjust as needed

function processInhandItems(inhandsFolderPath) {
	console.log("processInhandItems function started");
	console.log("inhandsFolderPath:", inhandsFolderPath);

	try {
		const inhandFolders = fs.readdirSync(inhandsFolderPath);

		for (const inhandFolder of inhandFolders) {
			const inhandFolderPath = path.join(inhandsFolderPath, inhandFolder);
			const stats = fs.statSync(inhandFolderPath);

			if (stats.isDirectory()) {
				processInhandFolder(inhandFolderPath);
			}
		}
	} catch (error) {
		console.error("Error processing inhand items:", error);
	}
}

function processInhandFolder(inhandFolderPath) {
	const inhandFiles = fs.readdirSync(inhandFolderPath);

	for (const inhandFile of inhandFiles) {
		if (!inhandFile.endsWith(".png")) continue;

		const inhandItemPath = path.join(inhandFolderPath, inhandFile);
		const inhandItemName = path.basename(inhandFile, ".png");

		// Dynamically get consolidated folders from /items/
		const consolidatedFolders = fs
			.readdirSync(inhandFolderPath)
			.filter((item) =>
				fs.statSync(path.join(inhandFolderPath, item)).isDirectory()
			);

		const matchingFolder = consolidatedFolders.find(
			(folder) =>
				folder === inhandItemName.replace("-", "_") ||
				folder === inhandItemName.replace("_", "-")
		);

		if (matchingFolder) {
			const consolidatedSubfolderPath = path.join(
				outputDir,
				matchingFolder
			);

			const newInhandItemName = matchingFolder.startsWith("lefthand")
				? "inhand-left.png"
				: matchingFolder.startsWith("righthand")
				? "inhand-right.png"
				: null;

			if (newInhandItemName) {
				const newInhandItemPath = path.join(
					consolidatedSubfolderPath,
					newInhandItemName
				);
				copyAndRename(
					inhandItemPath,
					newInhandItemPath,
					newInhandItemName
				);
				console.log(`Copied ${inhandItemPath} to ${newInhandItemPath}`);
			}
		} else {
			console.warn(
				`Could not find matching folder for inhand item: ${inhandFile}`
			);
		}
	}
}

function main() {
	const inhandsFolderPath =
		"D:/GitHub/civ14-tools/rsi-editor/output/mob/items/";
	processInhandItems(inhandsFolderPath);
}

main();
