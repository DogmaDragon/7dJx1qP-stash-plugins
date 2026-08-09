(function () {
    'use strict';

    const {
        stash,
        Stash,
        waitForElementId,
        waitForElementClass,
        waitForElementByXpath,
        getElementByXpath,
    } = window.stash7dJx1qP;

    function safeDecodeURIComponent(value) {
        try {
            return decodeURIComponent(value);
        } catch (e) {
            return value;
        }
    }

    function isLikelyWindowsPlayer(mediaPlayerPath) {
        const p = (mediaPlayerPath || '').trim();
        return /^[A-Za-z]:\\/.test(p) || p.includes('\\');
    }

    function toCanonicalPaths(rawValue, preferWindowsNative) {
        const raw = (rawValue || '').trim();
        if (!raw) {
            return { nativePath: raw, fileUrl: raw };
        }

        const decodedRaw = safeDecodeURIComponent(raw);

        // file:// URL input
        if (/^file:\/\//i.test(decodedRaw)) {
            try {
                const url = new URL(decodedRaw);
                const host = url.hostname;
                const pathname = safeDecodeURIComponent(url.pathname || '');

                if (host) {
                    const uncSlash = `//${host}${pathname}`;
                    return {
                        nativePath: preferWindowsNative ? uncSlash.replace(/\//g, '\\\\') : uncSlash,
                        fileUrl: `file:${encodeURI(uncSlash)}`,
                    };
                }

                let localPath = pathname;
                if (/^\/[A-Za-z]:\//.test(localPath)) {
                    localPath = localPath.substring(1);
                    return {
                        nativePath: preferWindowsNative ? localPath.replace(/\//g, '\\\\') : localPath,
                        fileUrl: `file:///${encodeURI(localPath.replace(/\\/g, '/'))}`,
                    };
                }

                const unixPath = localPath || '/';
                return {
                    nativePath: unixPath,
                    fileUrl: `file://${encodeURI(unixPath)}`,
                };
            } catch (e) {
                // Fall through to generic handling.
            }
        }

        // smb:// URL input
        if (/^smb:\/\//i.test(decodedRaw)) {
            try {
                const url = new URL(decodedRaw);
                const host = url.hostname;
                const pathname = safeDecodeURIComponent(url.pathname || '');
                const uncSlash = `//${host}${pathname}`;
                return {
                    nativePath: preferWindowsNative ? uncSlash.replace(/\//g, '\\\\') : uncSlash,
                    fileUrl: `file:${encodeURI(uncSlash)}`,
                };
            } catch (e) {
                // Fall through to generic handling.
            }
        }

        // UNC path input (\\server\share or //server/share)
        if (/^(\\\\|\/\/)/.test(decodedRaw)) {
            const uncSlash = decodedRaw.replace(/^\\\\/, '//').replace(/\\/g, '/');
            return {
                nativePath: preferWindowsNative ? uncSlash.replace(/\//g, '\\\\') : uncSlash,
                fileUrl: `file:${encodeURI(uncSlash)}`,
            };
        }

        // Windows drive-letter path input
        if (/^[A-Za-z]:[\\/]/.test(decodedRaw)) {
            const slashPath = decodedRaw.replace(/\\/g, '/');
            return {
                nativePath: decodedRaw.replace(/\//g, '\\\\'),
                fileUrl: `file:///${encodeURI(slashPath)}`,
            };
        }

        // Unix-like path input
        if (decodedRaw.startsWith('/')) {
            return {
                nativePath: decodedRaw,
                fileUrl: `file://${encodeURI(decodedRaw)}`,
            };
        }

        // Fallback: preserve original behavior as much as possible.
        return {
            nativePath: decodedRaw,
            fileUrl: decodedRaw,
        };
    }

    async function openMediaPlayerTask(path) {
        const settings = await stash.getPluginConfig('stashOpenMediaPlayer');
        const prefixMode = settings?.fileUrlPrefixMode || 'auto';
        const mediaPlayerPath = (settings?.mediaPlayerPath || '').trim();
        const useRemoteProtocol = settings?.useRemoteProtocol === true;
        const pathMapFrom = (settings?.pathMapFrom || '').trim();
        const pathMapTo = (settings?.pathMapTo || '').trim();
        
        const preferWindowsNative =
            isLikelyWindowsPlayer(mediaPlayerPath);

        const canonical =
            toCanonicalPaths(path, preferWindowsNative);

        let filePath = canonical.nativePath;
        let useFileUrl = false;

        if (useRemoteProtocol) {
            useFileUrl = false;
        } else if (prefixMode === 'keep') {
            useFileUrl = true;
        } else if (prefixMode === 'remove') {
            useFileUrl = false;
        } else {
            const lower = mediaPlayerPath.toLowerCase();
        
            if (lower.includes('vlc')) {
                useFileUrl = true;
            } else if (lower.includes('mpc')) {
                useFileUrl = false;
            } else {
                useFileUrl = /^file:\/\//i.test(path);
            }
        }

        filePath = useFileUrl
            ? canonical.fileUrl
            : canonical.nativePath;

        if (pathMapFrom && pathMapTo) {
            const escapedPrefix =
                pathMapFrom.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    '\\$&'
                );

            filePath = filePath.replace(
                new RegExp(`^${escapedPrefix}`, 'i'),
                pathMapTo
            );
        }

        if (settings?.incrementPlayCount === true) {
            await incrementScenePlayCount();
        }

        if (useRemoteProtocol) {
            const protocolUrl =
                `stashopenmediaplayer://open?player=${encodeURIComponent(mediaPlayerPath)}&path=${encodeURIComponent(filePath)}`;

            console.log("Remote Protocol:", useRemoteProtocol);
            console.log("Player:", mediaPlayerPath);
            console.log("Mapped:", filePath);
            console.log("Launching:", protocolUrl);

            window.location.href = protocolUrl;
            return;
        }

        stash.runPluginTask(
            "stashOpenMediaPlayer",
            "Open in Media Player",
            [
                {
                    key: "path",
                    value: { str: filePath }
                },
                {
                    key: "mediaPlayerPath",
                    value: { str: mediaPlayerPath }
                }
            ]
        );
    }

    async function incrementScenePlayCount() {
        const idMatch =
            window.location.pathname.match(/\/scenes\/(\d+)/);

        if (!idMatch) {
            return;
        }

        const sceneId = idMatch[1];

        try {
            await stash.callGQL({
                query: `
                    mutation SceneIncrementPlayCount($id: ID!) {
                        sceneIncrementPlayCount(id: $id)
                    }
                `,
                variables: {
                    id: sceneId
                }
            });

            const playCountSpan = document.querySelector(
                '.count-button.increment-only .count-value span'
            );
            
            if (playCountSpan) {
                const current = parseInt(
                    playCountSpan.textContent,
                    10
                );
            
                if (!Number.isNaN(current)) {
                    playCountSpan.textContent =
                        String(current + 1);
                }
            }
        } catch (e) {
            console.error(
                "Failed to increment play count:",
                e
            );
        }
    }

    stash.openMediaPlayerTask = openMediaPlayerTask;
    function getSceneFilePath() {
        const dd = getElementByXpath("//dt[text()='Path']/following-sibling::dd");
        if (!dd) return null;

        const a = dd.querySelector('a');
        if (a) return a.href;

        const input = dd.querySelector('input, textarea');
        if (input) return input.value || input.getAttribute('value') || (input.textContent && input.textContent.trim()) || null;

        const text = dd.textContent ? dd.textContent.trim() : null;
        return text && text.length ? text : null;
    }

    function ensureMediaPlayerToolbarButton() {
        const toolbar = document.querySelector('.scene-toolbar');
        if (!toolbar) return;

        if (toolbar.querySelector('.open-media-player-btn')) return;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.title = 'Open in External Player';
        btn.className = 'minimal open-media-player-btn btn btn-secondary';
        btn.style.display = 'inline-flex';
        btn.style.alignItems = 'center';
        btn.style.gap = '0.25rem';
        btn.innerHTML = '<svg data-prefix="fas" data-icon="external-link" class="svg-inline--fa fa-external-link fa-icon" role="img" viewBox="0 0 512 512" aria-hidden="true" width="1em" height="1em"><path fill="currentColor" d="M432 320h-32a16 16 0 0 0-16 16v112H80V160h112a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16H64a64 64 0 0 0-64 64v304a64 64 0 0 0 64 64h368a64 64 0 0 0 64-64V336a16 16 0 0 0-16-16zM488 0H360a24 24 0 0 0-17 41l30 30L201 252a24 24 0 0 0 0 34l22 22a24 24 0 0 0 34 0L409 127l30 30A24 24 0 0 0 488 140V12a12 12 0 0 0-12-12z"></path></svg>';

        btn.addEventListener('click', async function (e) {
            e.preventDefault();
            const path = getSceneFilePath();
            if (!path) return;
            openMediaPlayerTask(path);
        });

        const playBtn = toolbar.querySelector('button[title="Play Count"]');
        if (playBtn) {
            const playGroup = playBtn.closest('.scene-toolbar-group');
            if (playGroup) {
                const playChildSpan = playBtn.closest('span');
                const wrapper = document.createElement('span');
                wrapper.appendChild(btn);
                if (playChildSpan && playChildSpan.parentNode === playGroup) {
                    playGroup.insertBefore(wrapper, playChildSpan);
                } else {
                    playGroup.appendChild(wrapper);
                }
                return;
            }
        }
        
        const group = document.createElement('span');
        group.className = 'scene-toolbar-group';
        const innerSpan = document.createElement('span');
        innerSpan.appendChild(btn);
        group.appendChild(innerSpan);
        toolbar.appendChild(group);
    }

    // scene filepath open with Media Player
    stash.addEventListener('page:scene', function () {
        waitForElementClass('scene-file-info', function () {
            // ensure toolbar button exists
            ensureMediaPlayerToolbarButton();

            // legacy: if Path is still a link, keep making that link clickable as before
            const a = getElementByXpath("//dt[text()='Path']/following-sibling::dd/a");
            if (a && !a.classList.contains('open-media-player')) {
                a.classList.add('open-media-player');
                a.addEventListener('click', async function (ev) {
                    ev.preventDefault();
                    openMediaPlayerTask(a.href);
                });
            }
        });
    });

    stash.registerHiddenPluginTask('Stash Open Media Player');
})();