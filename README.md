# Tools

This repo is an assortment of tools to help the development of [Civ14](https://github.com/Civ13/civ14).

Before using the tools, edit the `config.txt` file with your game's folders. Most of the tools are in Node.JS so you will need it installed. Some also need Python.

The tools are not properly documented and might not work out of the box (you might have to tweak some files), so you might have to go with trial-and-error, sorry.

## [object-fetcher](https://github.com/Civ13/civ14-tools/tree/master/object-fetcher)

This collects all civ entities and tries to convert them to the ss14 format.

Before this, you need to compile civ13 on openDream, or use the file in [here](https://github.com/Civ13/Civ13/blob/opendream/civ13.json), placing it in this folder.

Run `object-fetcher.js` using Node.JS. Run [recipe-converter](https://github.com/Civ13/civ14-tools/tree/master/recipe-converter) first!

## [recipe-converter](https://github.com/Civ13/civ14-tools/tree/master/recipe-converter)

Converts the `material_recipes.txt` file into JSON, so it can be further processed.

## [sprite-consolidator](https://github.com/Civ13/civ14-tools/tree/master/sprite-consolidator)

Takes the output from `rsi-editor` and tries to pair the sprites and place them in separate folders, including equipped sprites and inhands.

## [recipe-maker](https://github.com/Civ13/civ14-tools/tree/master/recipe-maker)

Reads civ14's ymls and generates crafting recipes for them.
Place the input files in `input/`

## [ss14-tileset-converter](https://github.com/Civ13/SS14TilesetConverter)

This project provides a PHP library for converting images specifically for the SS14 game. It includes functionality to transform images and generate corresponding JSON metadata.
