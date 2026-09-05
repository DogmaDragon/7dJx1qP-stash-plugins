import os
import platform
import stat
import subprocess
import sys

PROTOCOL = "stashopenmediaplayer"


def install_windows():
    import winreg

    pythonw = os.path.join(os.path.dirname(sys.executable), "pythonw.exe")
    client = os.path.abspath(os.path.join(os.path.dirname(__file__), "stashOpenMediaPlayerRemoteClient.py"))
    command = f'"{pythonw}" "{client}" "%1"'
    key = winreg.CreateKey(winreg.HKEY_CURRENT_USER, rf"Software\Classes\{PROTOCOL}")
    winreg.SetValueEx(key, "", 0, winreg.REG_SZ, "URL:Stash Open Media Player")
    winreg.SetValueEx(key, "URL Protocol", 0, winreg.REG_SZ, "")
    cmdkey = winreg.CreateKey(key, r"shell\open\command")
    winreg.SetValueEx(cmdkey, "", 0, winreg.REG_SZ, command)
    winreg.CloseKey(cmdkey)
    winreg.CloseKey(key)
    print("Windows protocol installed.")


def install_linux():
    client = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "stashOpenMediaPlayerRemoteClient.py"))

    desktop_dir = os.path.expanduser("~/.local/share/applications")
    os.makedirs(desktop_dir, exist_ok=True)
    desktop_file = os.path.join(desktop_dir, f"{PROTOCOL}.desktop")

    content = f"""[Desktop Entry]
        Name=Stash Open Media Player
        Exec=python3 "{client}" %u
        Type=Application
        Terminal=false
        MimeType=x-scheme-handler/{PROTOCOL};
        Categories=AudioVideo;
        """

    with open(desktop_file, "w", encoding="utf-8") as f:
        f.write(content)

    os.chmod(desktop_file, os.stat(desktop_file).st_mode | stat.S_IXUSR)

    subprocess.run(
        ["xdg-mime", "default", os.path.basename(desktop_file), f"x-scheme-handler/{PROTOCOL}"], 
        check=False
    )

    subprocess.run(
        ["update-desktop-database", desktop_dir],
        check=False
    )

    print("Linux protocol installed.")
    

system = platform.system()

if system == "Windows":
    install_windows()

elif system == "Linux":
    install_linux()

else:
    print(f"Unsupported platform: {system}")