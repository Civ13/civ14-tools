# Tools

This repo is an assortment of tools to help the development of [Civ14](https://github.com/Civ13/civ14).

Before using the tools, edit the `config.txt` file with your game's folders. Most of the tools are in Node.JS so you will need it installed. Some also need Python.

The tools are not properly documented and might not work out of the box (you might have to tweak some files), so you might have to go with trial-and-error, sorry.

## [object-fetcher](https://github.com/Civ13/civ14-tools/tree/master/object-fetcher)

This collects all civ entities and tries to convert them to the ss14 format.

Before this, you need to compile civ13 on openDream, or use the file in [here](https://github.com/Civ13/Civ13/blob/opendream/civ13.json), placing it in this folder.

Run `civ13exporter.py` and `exporter_matcher.py`, then `object-fetcher.js` using Node.JS. Run [recipe-converter](https://github.com/Civ13/civ14-tools/tree/master/recipe-converter) first!

## [recipe-converter](https://github.com/Civ13/civ14-tools/tree/master/recipe-converter)

Converts the `material_recipes.txt` file into JSON, so it can be further processed.

## [sprite-consolidator](https://github.com/Civ13/civ14-tools/tree/master/sprite-consolidator)

Takes the output from `rsi-editor` and tries to pair the sprites and place them in separate folders, including equipped sprites and inhands.

## [recipe-maker](https://github.com/Civ13/civ14-tools/tree/master/recipe-maker)

Reads civ14's ymls and generates crafting recipes for them.
Place the input files in `input/`

## [map-converter](https://github.com/Civ13/civ14-tools/tree/master/map-converter)

Converts an image into a Civ14 Nomads' map. Colors must match the indexed color list, and be 1 pixel per tile.

## [ss14-tileset-converter](https://github.com/space-wizards/RSIEdit)

RSIEdit is a GUI application for creating and editing RSI files and converting existing DMI files to the RSI format.
