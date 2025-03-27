import os
import re
import json
import chardet  # Import the chardet library


def parse_dm_file(filepath):
    """
    Parses a .dm file and extracts information about clothing items.
    Attempts to detect the file's encoding if UTF-8 fails.

    Args:
        filepath: The path to the .dm file.

    Returns:
        A dictionary containing the extracted clothing item data, or None if no relevant data is found.
    """
    clothing_items = {}
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
    except UnicodeDecodeError:
        print(
            f"Warning: Could not decode file {filepath} with utf-8. Attempting to detect encoding..."
        )
        try:
            with open(filepath, "rb") as f:  # Open in binary mode for detection
                rawdata = f.read()
                result = chardet.detect(rawdata)
                detected_encoding = result["encoding"]
                print(f"Detected encoding: {detected_encoding}")

            if detected_encoding:
                with open(filepath, "r", encoding=detected_encoding) as f:
                    content = f.read()
            else:
                print(f"Error: Could not detect encoding for {filepath}. Skipping.")
                return None
        except Exception as e:
            print(f"Error processing {filepath}: {e}")
            return None

    # Regular expression to find clothing item definitions
    pattern = r"/obj/item/clothing/(.*?)\n(.*?)(?=\n\n|\Z)"
    matches = re.findall(pattern, content, re.DOTALL)

    for match in matches:
        path = f"/obj/item/clothing/{match[0]}"
        variables_str = match[1]

        variables = {}
        # Extract variables and their values
        var_pattern = r"(\w+)\s*=\s*(.*?)(?=\n|$)"
        var_matches = re.findall(var_pattern, variables_str, re.DOTALL)
        for var_match in var_matches:
            var_name = var_match[0].strip()
            var_value = var_match[1].strip()

            # Handle list type variables
            if var_value.startswith("list("):
                list_content = var_value[5:-1]
                list_items = {}
                list_pattern = r"(\w+)\s*=\s*(.*?)(?:,|$)"
                list_matches = re.findall(list_pattern, list_content)
                for list_match in list_matches:
                    list_items[list_match[0].strip()] = parse_value(
                        list_match[1].strip()
                    )
                variables[var_name] = list_items
            elif var_value.upper() == "FALSE":
                variables[var_name] = False
            elif var_value.upper() == "TRUE":
                variables[var_name] = True
            elif var_value.upper() == "UPPER_TORSO|LOWER_TORSO":
                variables[var_name] = "UPPER_TORSO|LOWER_TORSO"
            else:
                variables[var_name] = parse_value(var_value)

        clothing_items[path] = variables

    return clothing_items if clothing_items else None


def parse_value(value_str):
    """
    Parses a string value and returns the appropriate Python type.

    Args:
        value_str: The string value to parse.

    Returns:
        The parsed value as a Python type (int, float, str, bool).
    """
    if value_str.isdigit():
        return int(value_str)
    elif re.match(r"^-?\d+\.\d+$", value_str):
        return float(value_str)
    elif value_str.startswith('"') and value_str.endswith('"'):
        return value_str[1:-1]
    elif value_str.upper() == "FALSE":
        return False
    elif value_str.upper() == "TRUE":
        return True
    else:
        return value_str


def find_clothing_items(directory):
    """
    Recursively searches a directory for .dm files and extracts clothing item data.

    Args:
        directory: The directory to search.

    Returns:
        A dictionary containing all extracted clothing item data.
    """
    all_clothing_data = {}
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".dm"):
                print("Reading file:", file)
                filepath = os.path.join(root, file)
                clothing_data = parse_dm_file(filepath)
                if clothing_data:
                    all_clothing_data.update(clothing_data)
    return all_clothing_data


def main():
    """
    Main function to run the script.
    """
    dm_directory = "input/dm/"
    output_filepath = "./output/clothing_items.json"

    all_clothing_data = find_clothing_items(dm_directory)

    if all_clothing_data:
        with open(output_filepath, "w", encoding="utf-8") as outfile:
            json.dump(all_clothing_data, outfile, indent=2)
        print(f"Clothing item data exported to {output_filepath}")
    else:
        print("No clothing item data found.")


if __name__ == "__main__":
    main()
