# map-converter

Converts an image into a Civ14 map. Colors must match the indexed color list, and be 1 pixel per tile.

Place the image as `test.png` in this folder. Then run `node image2map.js` to create the `output.json` file. Finally, run `python json2yaml.py` to generate the readable map file for Civ14.

**dmm-extractor** is an app that reads the Civ13 map files in input/ and creates a JSON file with all the atoms in that map.
