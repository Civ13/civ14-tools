import json


def merge_clothing_data(clothing_file, item_file, output_file):
    """
    Merges clothing item data from clothing_file into item_file based on matching paths.
    Handles inconsistencies in item_file structure.

    Args:
        clothing_file (str): Path to the JSON file containing clothing item data.
        item_file (str): Path to the JSON file containing item data.
        output_file (str): Path to the output JSON file.
    """

    try:
        with open(clothing_file, "r", encoding="utf-8") as f:
            clothing_data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading clothing data: {e}")
        return

    try:
        with open(item_file, "r", encoding="utf-8") as f:
            item_data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading item data: {e}")
        return

    for item in item_data.get(
        "Types", []
    ):  # Handle case where "Types" might be missing
        path = item.get("Path")  # Handle case where "Path" might be missing
        if path and path in clothing_data:
            armor_data = clothing_data[path].get("armor")
            if armor_data:
                if "Variables" not in item:  # Create "Variables" if it doesn't exist
                    item["Variables"] = {}
                item["Variables"]["armor"] = armor_data

    try:
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(item_data, f, indent=2, ensure_ascii=False)
        print(f"Successfully merged data and exported to: {output_file}")
    except Exception as e:
        print(f"Error writing output: {e}")


# Example usage (replace with your actual file paths):
clothing_file = r"d:\GitHub\civ14-tools\object-fetcher\output\clothing_items.json"
item_file = r"d:\GitHub\civ14-tools\object-fetcher\output\civ13_item.json"
output_file = r"d:\GitHub\civ14-tools\object-fetcher\output\civ13_item_merged.json"

merge_clothing_data(clothing_file, item_file, output_file)
