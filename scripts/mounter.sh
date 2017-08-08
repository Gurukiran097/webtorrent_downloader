name=$1
sudo parted /dev/disk/by-id/scsi-0DO_Volume_$name mklabel gpt
sudo parted -a opt /dev/disk/by-id/scsi-0DO_Volume_$name mkpart primary 0% 100%
sudo mkfs.ext4 /dev/disk/by-id/scsi-0DO_Volume_$1-01-part1
sudo mkdir /mnt/$1-part1
sudo mount -o defaults,discard /dev/disk/by-id/scsi-0DO_Volume_$name-part1 /mnt/$name-part1
echo "success" | sudo tee /mnt/$name-part1/test_file
cat /mnt/$name-part1/test_file
