const yaml = require("./js-yaml.min.js");
const fs = require("fs");

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
		},
	];
}
let _recipe = newRecipe(
	"Test Recipe",
	"test_recipe",
	"Test Description",
	"Test Category",
	"icons/obj/structures.dmi",
	"test",
	"construction"
);
let _graph = newGraph("test_recipe", "plasma", 1, 1);
save(_recipe, _graph, "test_recipe.yml");
function save(recipe, graph, filename) {
	let yamlStr = yaml.dump(recipe) + "\n" + yaml.dump(graph);
	fs.writeFileSync(filename, yamlStr, "utf8");
	console.log("Saved to " + filename);
}
