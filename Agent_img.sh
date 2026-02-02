#!/bin/bash
set -e

IMAGE=agent.img
SRC=/home/r00t/Desktop/USBArmyKnife-master/publish
MNT=/tmp/mnt

# 1. Create disk image (500 MiB)
dd if=/dev/zero bs=1M count=50 of="$IMAGE"

# 2. Attach image to a free loop device
LOOP=$(sudo losetup --find --show "$IMAGE")

# 3. Create partition table + partition
sudo parted --script "$LOOP" \
  mktable msdos \
  mkpart primary fat32 2048s 100%

# 4. Reattach with partition scan
sudo losetup -d "$LOOP"
LOOP=$(sudo losetup --find --show -P "$IMAGE")

# 5. Format FAT32
sudo mkfs.vfat -F 32 "${LOOP}p1"

# 6. Mount
sudo mkdir -p "$MNT"
sudo mount "${LOOP}p1" "$MNT"

# 7. Copy files (FAT-safe, no chown errors)
sudo rsync -rv \
  --no-owner \
  --no-group \
  --no-perms \
  --exclude="$(basename "$IMAGE")" \
  "$SRC"/ "$MNT"/

# 8. Flush + cleanup
sync
sudo umount "$MNT"
sudo losetup -d "$LOOP"

echo "✔ agent.img created successfully"
