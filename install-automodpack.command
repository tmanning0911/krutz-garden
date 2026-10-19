#!/bin/bash
JAR="$HOME/Downloads/automodpack-for-friend.jar"
if [ ! -f "$JAR" ]; then
  echo "Missing $JAR"
  exit 1
fi
python3 - "$JAR" << 'PY'
import json, os, sys
jar = sys.argv[1]
home = os.path.expanduser("~")
dirs = [os.path.join(home, "Library/Application Support/minecraft/mods")]
profiles = os.path.join(home, "Library/Application Support/minecraft/launcher_profiles.json")
if os.path.isfile(profiles):
    data = json.load(open(profiles))
    for prof in data.get("profiles", {}).values():
        gd = prof.get("gameDir") or ""
        if gd:
            dirs.append(os.path.join(os.path.expanduser(gd.replace("$HOME", home)), "mods"))
bases = [
    os.path.join(home, "Library/Application Support/com.modrinth.theseus/profiles"),
    os.path.join(home, "Library/Application Support/ModrinthApp/profiles"),
    os.path.join(home, "Documents/curseforge/minecraft/Instances"),
]
for base in bases:
    if not os.path.isdir(base):
        continue
    for root, subdirs, files in os.walk(base):
        if os.path.basename(root) == "mods":
            dirs.append(root)
seen = set()
payload = open(jar, "rb").read()
for dest_dir in dirs:
    if dest_dir in seen:
        continue
    seen.add(dest_dir)
    os.makedirs(dest_dir, exist_ok=True)
    dest = os.path.join(dest_dir, "automodpack-for-friend.jar")
    open(dest, "wb").write(payload)
    print("INSTALLED", dest)
print("DONE. Quit Minecraft completely, start Fabric 26.3, then join 192.168.1.28:25565")
PY
