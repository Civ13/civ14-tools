import yaml


def update_duplicate_ids(filepath):
    """
    Finds and updates duplicate IDs in a YAML file, adding sequential numbers.
    Handles various YAML structures, including lists of strings, lists of dictionaries, and dictionaries with an "entities" key.  Also handles cases where IDs might be dictionaries.
    Writes the updated data to a new file.

    Args:
        filepath: Path to the YAML file.
    """
    try:
        with open(filepath, "r", encoding="utf-8") as file:
            data = yaml.safe_load(file)
    except FileNotFoundError:
        print(f"Error: File not found: {filepath}")
        return
    except yaml.YAMLError as e:
        print(f"Error parsing YAML file: {e}")
        return

    # Handle different YAML structures
    if isinstance(data, list):
        updated_data = handle_list_structure(data)
    elif isinstance(data, dict) and "entities" in data:
        updated_data = handle_entities_structure(data)
    else:
        print("Error: Unsupported YAML structure.")
        return

    # Write updated data to a new file
    if updated_data:
        with open(filepath.replace(".yml", "_updated.yml"), "w", encoding="utf-8") as f:
            yaml.dump(updated_data, f, indent=2, default_flow_style=False)
        print(f"Updated YAML file saved to: {filepath.replace('.yml', '_updated.yml')}")


def handle_list_structure(data):
    """Handles the case where the YAML data is a list (e.g., recipes_clothing_uniform.yml)."""
    id_counts = {}
    duplicates = {}
    updated_data = []
    for item in data:
        item_id = str(item)  # Convert to string to handle various types
        id_counts[item_id] = id_counts.get(item_id, 0) + 1
    for item_id, count in id_counts.items():
        if count > 1:
            duplicates[item_id] = duplicates.get(item_id, 0) + 1
    for item in data:
        item_id = str(item)
        if item_id in duplicates:
            updated_data.append(f"{item_id}_{duplicates[item_id]}")
        else:
            updated_data.append(item)
    return updated_data


def handle_entities_structure(data):
    """Handles the case where the YAML data has an "entities" key (e.g., entities_clothing_uniform.yml)."""
    entity_counts = {}
    duplicates = {}
    updated_data = data.copy()
    entities = updated_data["entities"]
    for entity in entities:
        entity_id = entity.get("id")
        if entity_id:
            entity_id_str = str(entity_id)  # Convert to string if it's a dictionary
            entity_counts[entity_id_str] = entity_counts.get(entity_id_str, 0) + 1
    for entity_id_str, count in entity_counts.items():
        if count > 1:
            duplicates[entity_id_str] = duplicates.get(entity_id_str, 0) + 1
    for entity in updated_data["entities"]:
        entity_id = entity.get("id")
        if entity_id:
            entity_id_str = str(entity_id)
            if entity_id_str in duplicates:
                entity["id"] = f"{entity_id_str}_{duplicates[entity_id_str]}"
    return updated_data


# Example usage:
filepath = r"output/yml/entities_clothing_uniform.yml"
update_duplicate_ids(filepath)

filepath = r"output/yml/recipes_clothing_uniform.yml"
update_duplicate_ids(filepath)
