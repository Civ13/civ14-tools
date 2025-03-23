# Tools

This repo is an assortment of tools to help the development of [Civ14](https://github.com/Civ13/civ14).

Before using the tools, edit the `config.txt` file with your game's folders.

Most of the tools are in python so you will need it installed. Some also need Node.JS.

## [object-fetcher](https://github.com/Civ13/civ14-tools/tree/master/object-fetcher)

This collects all civ entities and tries to convert them to the ss14 format.

Before this, you need to compile civ13 on openDream, or use the file in [here](https://github.com/Civ13/Civ13/blob/opendream/civ13.json), placing it in this folder.

Run `object-fetcher.js` using Node.JS. Run [recipe-converter](https://github.com/Civ13/civ14-tools/tree/master/recipe-converter) first!

## [recipe-converter](https://github.com/Civ13/civ14-tools/tree/master/recipe-converter)

Converts the `material_recipes.txt` file into JSON, so it can be further processed.

## [recipe-consolidator](https://github.com/Civ13/civ14-tools/tree/master/recipe-consolidator)

Runs both `object-fetcher` and `recipe-converter`, then checks which objects listed in the .json files have been created in the `object-fetcher`'s .json files. Then it removes the ones that are orphaned (no matches).

## [ss14-tileset-converter](https://github.com/Civ13/SS14TilesetConverter)

This project provides a PHP library for converting images specifically for the SS14 game. It includes functionality to transform images and generate corresponding JSON metadata.
