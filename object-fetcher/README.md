# object-fetcher

This collects all civ entities and tries to convert them to the ss14 format.

Before this, you need to compile civ13 on openDream, or use the file in [here](https://github.com/Civ13/Civ13/blob/opendream/civ13.json), placing it in this folder.

Run `civ13exporter.py` and `exporter_matcher.py`, then `object-fetcher.js` using Node.JS. Run the recipe-converter tool first!

Use the scripts in `creators/` to generate the .yml files.

Use `checkduplicates.py` afterwards to remove duplicates from the .yml files.
