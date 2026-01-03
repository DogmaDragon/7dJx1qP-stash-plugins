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

    // scene filepath open with Media Player
    stash.addEventListener('page:scene', function () {
        waitForElementClass('scene-file-info', function () {
            const a = getElementByXpath("//dt[text()='Path']/following-sibling::dd/a");
            if (a && !a.classList.contains('open-media-player')) {
                a.classList.add('open-media-player');
                a.addEventListener('click', async function () {
                    openMediaPlayerTask(a.href);
                });
            }
        });
    });

    stash.registerHiddenPluginTask('Stash Open Media Player');
})();