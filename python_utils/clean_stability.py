import json

# Manually edit this list to include the paths you want to keep.
target_paths = [
    "/v2beta/stable-image/generate/ultra",
    # Add other paths here if needed.
]

# Load the original OpenAPI JSON file.
with open("/home/ubuntu/stability_big.json", "r", encoding="utf-8") as infile:
    data = json.load(infile)

# Get the "paths" dictionary from the OpenAPI document.
all_paths = data.get("paths", {})

# Filter the paths to only keep those in our target_paths list.
filtered_paths = {path: all_paths[path] for path in target_paths if path in all_paths}

def remove_non_javascript_code_samples(obj):
    """
    Recursively traverse the object and, whenever an "x-codeSamples" key is encountered,
    remove any code samples where the "lang" is either "python" or "terminal".
    """
    if isinstance(obj, dict):
        new_obj = {}
        for key, value in obj.items():
            if key == "x-codeSamples" and isinstance(value, list):
                new_obj[key] = [
                    sample for sample in value
                    if sample.get("lang", "").lower() not in ("python", "terminal")
                ]
            else:
                new_obj[key] = remove_non_javascript_code_samples(value)
        return new_obj
    elif isinstance(obj, list):
        return [remove_non_javascript_code_samples(item) for item in obj]
    else:
        return obj

# Apply the code sample filter to the filtered paths.
filtered_paths = remove_non_javascript_code_samples(filtered_paths)

# Build a new OpenAPI structure containing only the filtered "paths".
filtered_openapi = {"paths": filtered_paths}

# Write the filtered data to a new file.
with open("/home/ubuntu/stability.json", "w", encoding="utf-8") as outfile:
    json.dump(filtered_openapi, outfile, indent=2)

print("Filtered OpenAPI file saved to 'openapi_filtered.json'")
