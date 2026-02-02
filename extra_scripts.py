import gzip
import os
import re
import subprocess
import shutil

staticFiles = {}
headerFiles = []

Import("env")

def maybe_build_ui():
    if os.environ.get("AUTO_BUILD_UI") != "1":
        return

    pnpm = shutil.which("pnpm")
    if pnpm is None:
        pnpm = "/tmp/pnpm/node_modules/.bin/pnpm" if os.path.isfile("/tmp/pnpm/node_modules/.bin/pnpm") else None

    if pnpm is None:
        print("AUTO_BUILD_UI=1 but pnpm was not found; skipping UI build.")
        return

    print("AUTO_BUILD_UI=1 detected; building UI...")
    subprocess.check_call([pnpm, "-C", "ui", "build"])

maybe_build_ui()

def skip_esp32_libs_from_pi_builds(node):
    """
    `node.name` - a name of File System Node
    `node.get_path()` - a relative path
    `node.get_abspath()` - an absolute path
     to ignore file from a build process, just return None
    """

    if ("usb-ncm" in node.get_path() or "ESP32Marauder" in node.get_path()) and "raspberrypi" in env.GetProjectOption("platform"):
        # Return None for exclude
        print ("Ignoring /lib dir as platform is raspberrypi")
        return None

    return node

# Register callback
env.AddBuildMiddleware(skip_esp32_libs_from_pi_builds, "*")

def compress_to_c_array(srcFile, dstFile, varName, dataConvertFunc=None, urlPath=None):
    try:
        # Read the contents of the source file
        with open(srcFile, 'rb') as f:
            data = f.read()

        if dataConvertFunc:
            data = dataConvertFunc(data)

        # Compress the data using gzip
        compressed_data = gzip.compress(data)

        # Convert the compressed data to a C-style array string
        c_array_string = ', '.join(str(byte) for byte in compressed_data)

         # Create the required directories for the destination file
        os.makedirs(os.path.dirname(dstFile), exist_ok=True)

        # Write the C-style array string to the destination file
        try:
            os.remove(dstFile)
        except:
            pass
        with open(dstFile, 'w') as f:
            f.write(f"#pragma once\n\n#ifndef NO_WEB\n\nconst uint8_t PROGMEM {varName}[{len(compressed_data)}] = {{ {c_array_string} }};\n\n#endif")

        print(f"Compressed data written to {dstFile}")

        headerFiles.append(dstFile)
        if urlPath is None:
            staticFiles[srcFile.replace("ui/", "/")] = varName
        else:
            staticFiles[urlPath] = varName
    except FileNotFoundError as e:
        print("Error: Source file not found.")
        print (e)

def _sanitize_symbol(name):
    cleaned = re.sub(r'[^0-9A-Za-z_]', '_', name)
    if cleaned and cleaned[0].isdigit():
        cleaned = "_" + cleaned
    return cleaned

ui_new_dist = os.path.join("ui", "dist")
ui_new_index = os.path.join(ui_new_dist, "index.html")

if os.path.exists(ui_new_index):
    # Package the new Vite-built UI if present.
    for root, dirs, files in os.walk(ui_new_dist):
        for filename in files:
            src_path = os.path.join(root, filename).replace("\\", "/")
            rel_path = os.path.relpath(src_path, ui_new_dist).replace("\\", "/")
            url_path = "/" + rel_path
            symbol = _sanitize_symbol(rel_path)
            dst_path = os.path.join("src/html/ui", f"{symbol}.h")
            compress_to_c_array(src_path, dst_path, f"uiNew{symbol}Gz", urlPath=url_path)
else:
    print("Warning: ui/dist not found; no UI assets were packaged.")

# Define the directory path
directory_path = "ui/vnc"

# Recursively loop through every file in the directory
for root, dirs, files in os.walk(directory_path):
    for filename in files:
        # Get the full path to the file
        file_path = os.path.join(root, filename).replace("\\", "/")
        
        # Extract the file name without extension
        file_name = filename.replace(".", "").replace("-", "_")

        # Call the compress_to_c_array function
        compress_to_c_array(file_path, f"src/html/vnc/{file_name}.h", f"noVNC{file_name}Gz")

cpp_vector_code = "#ifndef NO_WEB\n\n#include <string>\n#include <unordered_map>\n#include <cstdint>\n#include <pgmspace.h>\n\n";
for header in headerFiles:
    cpp_vector_code += '#include "'+header.replace("src/html/", "")+'"\n'

cpp_vector_code += "\nstd::unordered_map<const char*,std::pair<const uint8_t*, size_t>> staticHtmlFilesLookup = {\n"
if staticFiles:
    lastFile = list(staticFiles.keys())[-1]
    for key, value in staticFiles.items():
        path = key.replace("/content/", "/")
        cpp_vector_code += f"    {{\"{path}\",{{ {value},sizeof({value}) }} }}"
        if key != lastFile:
            cpp_vector_code += ",\n"
        else:
            cpp_vector_code += "\n"
cpp_vector_code += "};\n\n#endif"

with open("src/html/htmlFiles.cpp", "w") as file:
    file.write(cpp_vector_code)

# Get the current git commit hash (best-effort; allow non-git builds)
try:
    commit_hash = subprocess.check_output(
        ['git', 'rev-parse', 'HEAD'],
        stderr=subprocess.DEVNULL
    ).strip().decode('utf-8')
except (subprocess.CalledProcessError, FileNotFoundError):
    commit_hash = "unknown"

# Define the content for the version.h file
header_content = f'#pragma once\nconst char GIT_COMMIT_HASH[] = "{commit_hash}";\n'

# Write the content to version.h
with open('src/version.h', 'w') as header_file:
    header_file.write(header_content)
