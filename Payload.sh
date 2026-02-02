#!/bin/bash
# create_payload.sh

# Define source directory
SOURCE_DIR="/home/r00t/Desktop/USBArmyKnife-master/publish"
SOURCE_FILES=("in1.bat" "PortableApp.dll" "turbojpeg.dll" "vcruntime140.dll")

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "Error: Source directory not found: $SOURCE_DIR"
    exit 1
fi

# Check if all required files exist
MISSING_FILES=()
for file in "${SOURCE_FILES[@]}"; do
    if [ ! -f "$SOURCE_DIR/$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo "Error: Missing required files:"
    for file in "${MISSING_FILES[@]}"; do
        echo "  - $file"
    done
    exit 1
fi

# Create image
echo "Creating agent.img..."
dd if=/dev/zero of=agent.img bs=1M count=50
mkfs.fat -F32 agent.img

# Mount and copy
mkdir -p /tmp/payload_mount
sudo mount -o loop agent.img /tmp/payload_mount

# Copy all required files
echo "Copying files to agent.img..."
for file in "${SOURCE_FILES[@]}"; do
    sudo cp "$SOURCE_DIR/$file" /tmp/payload_mount/
    echo "  - $file"
done

sudo umount /tmp/payload_mount
rmdir /tmp/payload_mount

echo "Done! agent.img created with files:"
echo "${SOURCE_FILES[@]}"
ls -lh agent.img
