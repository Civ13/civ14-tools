const fs = require("node:fs");
const yaml = require("js-yaml");

function newGraph(_id, _material, _amount, _timer) {
	return [
		{
			type: "constructionGraph",
			id: _id,
			start: "start",
			graph: [
				{
					node: "start",
					edges: [
						{
							to: "end",
							steps: [
								{
									material: _material,
									amount: _amount,
									doAfter: _timer,
								},
							],
						},
					],
				},
				{
					node: "end",
					entity: _id,
				},
			],
		},
	];
}
function newRecipe(
	name = "",
	id = "",
	desc = "",
	category = "",
	sprite = "",
	state = "",
	objtype = ""
) {
	return [
		{
			type: "construction",
			name: name,
			id: id,
			graph: id,
			startNode: "start",
			targetNode: "end",
			category: category,
			description: desc,
			icon: {
				sprite: sprite,
				state: state,
			},
			objectType: objtype,
			agemin: 8,
			agemax: 8,
		},
	];
}

function saveRecipe(recipe, graph, filename = "recipe.yaml") {
	let yamlStr = yaml.dump(recipe) + "\n" + yaml.dump(graph);
	fs.writeFileSync(filename, yamlStr, "utf8");
	console.log("Saved to " + filename);
}
function saveYAML(filename = "recipes.yaml", yamlStr) {
	yamlStr = yaml.dump(yamlStr);
	fs.writeFileSync(filename, yamlStr, "utf8");
	console.log("Saved to " + filename);
}

module.exports = { saveYAML, saveRecipe, newRecipe, newGraph };
