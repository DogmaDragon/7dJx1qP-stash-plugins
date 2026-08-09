import os
import platform

PROTOCOL = "stashopenmediaplayer"

def uninstall_windows():
    import winreg

    def delete_key(root, subkey):
        try:
            with winreg.OpenKey(root, subkey, 0, winreg.KEY_ALL_ACCESS) as key:

                while True:
                    try:
                        child = winreg.EnumKey(key, 0)
                        delete_key(root, f"{subkey}\\{child}")

                    except OSError:
                        break

            winreg.DeleteKey(root, subkey)

        except FileNotFoundError:
            pass

    delete_key(winreg.HKEY_CURRENT_USER, rf"Software\Classes\{PROTOCOL}")
    print("Windows protocol removed.")


def uninstall_linux():
    desktop_file = os.path.expanduser(f"~/.local/share/applications/{PROTOCOL}.desktop")

    if os.path.exists(desktop_file):
        os.remove(desktop_file)

    print("Linux protocol removed.")


system = platform.system()

if system == "Windows":
    uninstall_windows()

elif system == "Linux":
    uninstall_linux()

else:
    print(f"Unsupported platform: {system}")