import json
import log
import sys
import subprocess

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
    subprocess.Popen([mediaplayer_path, path])