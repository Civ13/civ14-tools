import os
import sys
import shutil
import json

path1 = ""


def parse_line(line, line_parsed):
    tline = line.replace("RECIPE: ", "")
    if len(line_parsed) != 13:
        print("Error! This line does not have a length of 13 - {}".format(tline))
        return None  # Return None to indicate an error
    else:
        otype = line_parsed[0].replace("/material/", "").replace("/", "")
        try:
            cost = int(float(line_parsed[3]))  # Handle potential floats
        except ValueError:
            print(f"Error: Invalid cost value '{line_parsed[3]}' in line: {tline}")
            return None
        try:
            time = int(
                float(line_parsed[4]) * 100
            )  # Handle potential floats and convert to milliseconds
        except ValueError:
            print(f"Error: Invalid time value '{line_parsed[4]}' in line: {tline}")
            return None

        try:
            age1 = int(line_parsed[8])
        except ValueError:
            print(f"Error: Invalid age1 value '{line_parsed[8]}' in line: {tline}")
            return None
        try:
            age2 = int(line_parsed[9])
        except ValueError:
            print(f"Error: Invalid age2 value '{line_parsed[9]}' in line: {tline}")
            return None
        try:
            age3 = int(line_parsed[10])
        except ValueError:
            print(f"Error: Invalid age3 value '{line_parsed[10]}' in line: {tline}")
            return None
        try:
            last_age = int(line_parsed[11])
        except ValueError:
            print(f"Error: Invalid last_age value '{line_parsed[11]}' in line: {tline}")
            return None

        recipe_data = {
            "name": line_parsed[1],
            "template_name": line_parsed[2],
            "res_amount": cost,  # res_amount is the same as cost
            "time": time,
            "category": line_parsed[7],
            "age1": age1,
            "age2": age2,
            "age3": age3,
            "last_age": last_age,
            "material": otype,
        }
        return recipe_data


if __name__ == "__main__":
    masterdir = os.path.normpath(os.getcwd() + os.sep + os.pardir).replace("\\", "/")
    outputdir = masterdir + "/recipe-converter/"
    currdir = os.getcwd()

    file = open("{}/config.txt".format(masterdir), "r")
    lines = file.readlines()
    path1 = lines[1].replace("\\", "/").replace("\n", "")  # civ folder
    file.close()

    if path1 == "":
        print("Error! No configs found.")
        sys.exit()

    all_recipes = []
    material_list = []
    rfile = open("{}/config/crafting/material_recipes_global.txt".format(path1), "r")
    rlines = rfile.readlines()
    print("Reading recipe list...")
    for line in rlines:
        line = line.replace("\n", "")
        if line.find("RECIPE: ", 0, 10) != -1:
            if line != "":
                tline = line.replace("RECIPE: ", "")
                line_parsed = tline.split(",")
                recipe_data = parse_line(line, line_parsed)
                if recipe_data:
                    all_recipes.append(recipe_data)
                    otype = recipe_data["material"]
                    if otype not in material_list:
                        material_list.append(otype)
                        print("Added new material {}".format(otype))

    print("	done")

    for material in material_list:
        print("Writing {} recipes...".format(material))
        material_recipes = []
        for recipe in all_recipes:
            if recipe["material"] == material:
                material_recipes.append(recipe)

        # Create the 'recipes' directory if it doesn't exist
        recipes_dir = os.path.join(outputdir, "recipes")
        os.makedirs(recipes_dir, exist_ok=True)

        with open(os.path.join(recipes_dir, f"{material}.json"), "w") as crafting_file:
            json.dump(material_recipes, crafting_file, indent=4)

    print("All finished.")
    sys.exit()
