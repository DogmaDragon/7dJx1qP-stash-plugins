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

    async function openMediaPlayerTask(path) {
        const settings = await stash.getPluginConfig('stashOpenMediaPlayer');
        const prefixMode = settings?.fileUrlPrefixMode || 'auto';
        const mediaPlayerPath = settings?.mediaPlayerPath || '';

        let filePath = path;
        let useFileUrl = false;

        if (prefixMode === 'keep') {
            useFileUrl = true;
        } else if (prefixMode === 'remove') {
            useFileUrl = false;
        } else {
            // auto mode: detect by player path
            const lower = mediaPlayerPath.toLowerCase();
            if (lower.includes('vlc')) {
                useFileUrl = true;
            } else if (lower.includes('mpc')) {
                useFileUrl = false;
            } else {
                useFileUrl = path.startsWith('file:///');
            }
        }

        if (useFileUrl) {
            if (!filePath.startsWith('file:///')) {
                // Add prefix if missing
                filePath = 'file:///' + filePath.replace(/^([A-Za-z]:\\|\/)/, (m) => m.replace(/\\/g, '/'));
            }
        } else {
            if (filePath.startsWith('file:///')) {
                filePath = filePath.substring(8);
            }
        }

        // Decode the URI-encoded path (after prefix handling)
        const decodedPath = decodeURIComponent(filePath);

        stash.runPluginTask("stashOpenMediaPlayer", "Open in Media Player", [
            {"key":"path", "value": {"str": decodedPath}},
            {"key":"mediaPlayerPath", "value": {"str": mediaPlayerPath}}
        ]);
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