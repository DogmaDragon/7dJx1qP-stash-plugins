import os
import platform
import subprocess
import sys
from urllib.parse import parse_qs, unquote, urlparse


def show_error(text):
    if platform.system() == "Windows":
        import ctypes

        ctypes.windll.user32.MessageBoxW( 0, text, "Stash Open Media Player", 0x10)

    print(text)


if len(sys.argv) < 2:
    sys.exit(1)

uri = unquote(sys.argv[1])
parsed = urlparse(uri)
params = parse_qs(parsed.query)
player = params.get("player", [None])[0]
path = params.get("path", [None])[0]

if not player:
    show_error("Player executable missing.")
    sys.exit(1)

if not path:
    show_error("Media path missing.")
    sys.exit(1)

if os.name == "nt":
    path = path.replace("/", "\\")

    if path.startswith("\\\\"):
        path = "\\\\" + path[2:].replace("\\\\", "\\")

if not os.path.exists(player):
    show_error(f"Player executable not found:\n\n{player}")
    sys.exit(1)

if not os.path.exists(path):
    show_error(f"Media file not found:\n\n{path}")
    sys.exit(1)

try:
    subprocess.Popen([player, path])

except Exception as e:
    show_error(f"Failed to launch player:\n\n{e}")