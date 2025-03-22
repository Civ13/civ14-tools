# Tools

This repo is an assortment of tools to help the development of [Civ14](https://github.com/Civ13/civ14).

Before using the tools, edit the `config.txt` file with your game's folders.

Most of the tools are in python so you will need it installed. Some also need Node.JS.

## [object-fetcher](https://github.com/Civ13/civ14-tools/tree/master/object-fetcher)

Grab civ13's DMI assets and convert them to png/json using the `dmi2png-ts` tool. Then writes .atom files listing the objects it creates.

## [recipe-converter](https://github.com/Civ13/civ14-tools/tree/master/recipe-converter)

Converts the `material_recipes.txt` file into JSON, so it can be further processed.

## [recipe-consolidator](https://github.com/Civ13/civ14-tools/tree/master/recipe-consolidator)

Runs both `object-fetcher` and `recipe-converter`, then checks which objects listed in the .json files have been created in the `object-fetcher`'s .json files. Then it removes the ones that are orphaned (no matches).
