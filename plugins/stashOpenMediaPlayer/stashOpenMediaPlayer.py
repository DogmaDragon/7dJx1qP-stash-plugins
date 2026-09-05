import json
import log
import sys
import subprocess
import os

json_input = json.loads(sys.stdin.read())
name = json_input['args']['name']

if name == 'mediaplayer':
    mediaplayer_path = json_input['args']['mediaPlayerPath']
    path = json_input['args']['path']
    # Handle fileUrlPrefixMode default
    file_url_prefix_mode = json_input['args'].get('fileUrlPrefixMode')

    if file_url_prefix_mode is None or file_url_prefix_mode == 'undefined':
        file_url_prefix_mode = 'auto'
        
    log.debug(f"mediaplayer_path: {mediaplayer_path}")
    log.debug(f"fileUrlPrefixMode: {file_url_prefix_mode}")
    log.debug(f"{name}: {path}")
    
    # Check if media player path exists
    if not os.path.exists(mediaplayer_path):
        log.warning(f"Media player not found at: {mediaplayer_path}")
        log.info("If running Stash in a Docker container, ensure the media player path is valid in the container environment, or use a remote playback method.")
    
    try:
        log.debug(f"Attempting to launch: {mediaplayer_path} {path}")
        subprocess.Popen([mediaplayer_path, path])
        log.info("Media player launched successfully")
    except FileNotFoundError as e:
        log.error(f"Media player executable not found: {e}")
    except OSError as e:
        log.error(f"Failed to launch media player: {e}")
    except Exception as e:
        log.error(f"Unexpected error launching media player: {e}")