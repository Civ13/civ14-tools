import numpy as np
import yaml
import base64
import struct
import json
import os

# -----------------------------------------------------------------------------
# Tilemap
# -----------------------------------------------------------------------------
# Mapeamento baseado no tileset fornecido
TILEMAP = {
    # 0: "FloorWaterDeepEntity",
    # 1: "FloorWaterEntity",
    2: "FloorSnow",
    3: "FloorDesert",
    4: "FloorDirtRock",
    5: "WallRock",
    6: "FloorGrass",
    7: "FloorPlanetDryDirt",
    8: "FloorIce",
    # 9: "FloorWaterSwampEntity",
    10: "DryGrass",
}
TILEMAP_REVERSE = {v: k for k, v in TILEMAP.items()}


# -----------------------------------------------------------------------------
# Funções Auxiliares
# -----------------------------------------------------------------------------
def encode_tiles(tile_map):
    """Codifica os tiles em formato base64 para o YAML."""
    tile_bytes = bytearray()
    for y in range(tile_map.shape[0]):
        for x in range(tile_map.shape[1]):
            tile_id = tile_map[y, x]
            flags = 0
            variant = 0
            tile_bytes.extend(struct.pack("<I", tile_id))  # 4 bytes tile_id
            tile_bytes.append(flags)  # 1 byte flag
            tile_bytes.append(variant)  # 1 byte variant
    return base64.b64encode(tile_bytes).decode("utf-8")


def generate_atmosphere_tiles(width, height, chunk_size):
    """Gera os tiles de atmosfera com base no tamanho do mapa."""
    max_x = (width + chunk_size - 1) // chunk_size - 1
    max_y = (height + chunk_size - 1) // chunk_size - 1
    tiles = {}
    for y in range(-1, max_y + 1):
        for x in range(-1, max_x + 1):
            if x == -1 or x == max_x or y == -1 or y == max_y:
                tiles[f"{x},{y}"] = {0: 65535}
            else:
                tiles[f"{x},{y}"] = {1: 65535}
    return tiles


# Definir uniqueMixes para atmosfera
unique_mixes = [
    {
        "volume": 2500,
        "immutable": True,
        "temperature": 293.15,
        "moles": [21.82478, 82.10312, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    {
        "volume": 2500,
        "temperature": 293.15,
        "moles": [21.824879, 82.10312, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
]


def generate_main_entities(tile_map, chunk_size=16):
    """Gera as entidades principais, incluindo os chunks do mapa e a atmosfera."""
    h, w = tile_map.shape
    chunks = {}
    for cy in range(0, h, chunk_size):
        for cx in range(0, w, chunk_size):
            chunk_key = f"{cx//chunk_size},{cy//chunk_size}"
            chunk_tiles = tile_map[cy : cy + chunk_size, cx : cx + chunk_size]
            # Preenche chunks incompletos nas bordas
            if chunk_tiles.shape[0] < chunk_size or chunk_tiles.shape[1] < chunk_size:
                full_chunk = np.zeros((chunk_size, chunk_size), dtype=np.int32)
                full_chunk[: chunk_tiles.shape[0], : chunk_tiles.shape[1]] = chunk_tiles
                chunk_tiles = full_chunk
            chunks[chunk_key] = {
                "ind": f"{cx//chunk_size},{cy//chunk_size}",
                "tiles": encode_tiles(chunk_tiles),
                "version": 6,
            }

    atmosphere_chunk_size = 4
    atmosphere_tiles = generate_atmosphere_tiles(w, h, atmosphere_chunk_size)

    main = {
        "proto": "",
        "entities": [
            {
                "uid": 1,
                "components": [
                    {"type": "MetaData", "name": "Map Entity"},
                    {"type": "Transform"},
                    {"type": "LightCycle"},
                    {"type": "MapLight", "ambientLightColor": "#D8B059FF"},
                    {"type": "Map", "mapPaused": True},
                    {"type": "PhysicsMap"},
                    {"type": "GridTree"},
                    {"type": "MovedGrids"},
                    {"type": "Broadphase"},
                    {"type": "OccluderTree"},
                ],
            },
            {
                "uid": 2,
                "components": [
                    {"type": "MetaData", "name": "grid"},
                    {"type": "Transform", "parent": 1, "pos": "0,0"},
                    {"type": "MapGrid", "chunks": chunks},
                    {"type": "Broadphase"},
                    {
                        "type": "Physics",
                        "angularDamping": 0.05,
                        "bodyStatus": "InAir",
                        "bodyType": "Dynamic",
                        "fixedRotation": True,
                        "linearDamping": 0.05,
                    },
                    {"type": "Fixtures", "fixtures": {}},
                    {"type": "OccluderTree"},
                    {"type": "SpreaderGrid"},
                    {"type": "Shuttle"},
                    {"type": "SunShadow"},
                    {"type": "SunShadowCycle"},
                    {"type": "GridPathfinding"},
                    {
                        "type": "Gravity",
                        "gravityShakeSound": {
                            "!type:SoundPathSpecifier": {
                                "path": "/Audio/Effects/alert.ogg"
                            }
                        },
                        "inherent": True,
                        "enabled": True,
                    },
                    {"type": "BecomesStation", "id": "Nomads"},
                    {
                        "type": "DecalGrid",
                        "chunkCollection": {"version": 2, "nodes": []},
                    },
                    {
                        "type": "GridAtmosphere",
                        "version": 2,
                        "data": {
                            "tiles": atmosphere_tiles,
                            "uniqueMixes": unique_mixes,
                            "chunkSize": atmosphere_chunk_size,
                        },
                    },
                    {"type": "GasTileOverlay"},
                    {"type": "RadiationGridResistance"},
                ],
            },
        ],
    }
    return main


# -----------------------------------------------------------------------------
# Geração de Spawn Points
# -----------------------------------------------------------------------------
global_uid = 3


def next_uid():
    """Gera um UID único para cada entidade."""
    global global_uid
    uid = global_uid
    global_uid += 1
    return uid


def generate_spawn_points(tile_map, num_points=2):
    """Gera entidades SpawnPointNomads no centro do mapa."""
    h, w = tile_map.shape
    center_x = w // 2
    center_y = h // 2
    spawn_points = []
    for i in range(num_points):
        pos_x = center_x - 2.5
        pos_y = center_y - 0.5 - i
        spawn_points.append(
            {
                "uid": next_uid(),
                "components": [
                    {"type": "Transform", "parent": 2, "pos": f"{pos_x},{pos_y}"}
                ],
            }
        )
    return {"proto": "SpawnPointNomads", "entities": spawn_points}


# -----------------------------------------------------------------------------
# Salvar YAML
# -----------------------------------------------------------------------------
def represent_sound_path_specifier(dumper, data):
    """Representação personalizada para SoundPathSpecifier no YAML."""
    for key, value in data.items():
        if isinstance(key, str) and key.startswith("!type:"):
            tag = key
            if isinstance(value, dict) and "path" in value:
                return dumper.represent_mapping(tag, value)
    return dumper.represent_dict(data)


def save_map_to_yaml(
    tile_map, output_dir, filename="nomads_from_json.yml", chunk_size=16
):
    """Salva o mapa gerado em um arquivo YAML no diretório especificado."""
    main_entities = generate_main_entities(tile_map, chunk_size)
    spawn_points = generate_spawn_points(tile_map)
    all_entities = [main_entities, spawn_points]
    count = sum(len(group.get("entities", [])) for group in all_entities)
    map_data = {
        "meta": {
            "format": 7,
            "category": "Map",
            "engineVersion": "249.0.0",
            "forkId": "",
            "forkVersion": "",
            "time": "03/23/2025 18:21:23",
            "entityCount": count,
        },
        "maps": [1],
        "grids": [2],
        "orphans": [],
        "nullspace": [],
        "tilemap": TILEMAP,
        "entities": all_entities,
    }
    yaml.add_representer(dict, represent_sound_path_specifier)
    output_path = os.path.join(output_dir, filename)
    with open(output_path, "w") as outfile:
        yaml.dump(map_data, outfile, default_flow_style=False, sort_keys=False)


# -----------------------------------------------------------------------------
# Execução
# -----------------------------------------------------------------------------
# Determina o diretório do script
script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, "output.json")

# Lê o arquivo JSON
with open(json_path, "r") as f:
    data = json.load(f)
tilemap_data = data["tileMap"]

# Extrai as dimensões do tilemap
positions = [
    eval(pos) for pos in tilemap_data.keys()
]  # Converte "(x,y)" para tupla (x, y)
max_x = max(pos[0] for pos in positions)
max_y = max(pos[1] for pos in positions)
width = max_x + 1
height = max_y + 1

# Cria a matriz NumPy para o tilemap
tile_map = np.zeros((height, width), dtype=np.int32)
for pos_str, tile_info in tilemap_data.items():
    x, y = eval(pos_str)
    tile_id = tile_info["tile"]
    # Os IDs do JSON correspondem diretamente ao TILEMAP
    tile_map[y, x] = tile_id

# Define o diretório de saída
output_dir = os.path.join(script_dir, "output")
os.makedirs(output_dir, exist_ok=True)

# Salva o mapa em YAML
save_map_to_yaml(tile_map, output_dir, filename="nomads_from_json.yml", chunk_size=16)

print("Mapa gerado a partir do JSON e salvo com sucesso!")
