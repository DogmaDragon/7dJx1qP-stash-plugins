(function () {
    'use strict';

    const {
        stash,
        Stash,
        waitForElementId,
        waitForElementClass,
        waitForElementByXpath,
        getElementByXpath,
        getElementsByXpath,
        getClosestAncestor,
        sortElementChildren,
        createElementFromHTML,
    } = window.stash7dJx1qP;

    document.body.appendChild(document.createElement('style')).textContent = `
    .search-item > div.row:first-child > div.col-md-6.my-1 > div:first-child { display: flex; flex-direction: column; }
    .tagger-remove { order: 10; }
    #progress-bar .progress-bar { display: flex; align-items: center; justify-content: center; font-weight: 600; text-align: center; white-space: nowrap; }
    `;

    let settings = null;
    async function loadSettings() {
        if (settings === null) {
            settings = await stash.getPluginConfig('stashBatchSave');
        }
        settings = settings || {};
        let hasSettingsChanges = false;
        if (settings?.enableFingerprints === undefined) {
            settings.enableFingerprints = false;
            hasSettingsChanges = true;
        }
        if (settings?.saveTimeoutMs === undefined) {
            settings.saveTimeoutMs = 50;
            hasSettingsChanges = true;
        }
        if (hasSettingsChanges) {
            await stash.updatePluginConfig('stashBatchSave', settings);
        }
        return settings?.enableFingerprints === true;
    }
    loadSettings();

    function isEnableFingerprints() {
        return settings?.enableFingerprints === true;
    }

    function getSaveTimeoutMs() {
        const timeoutMs = Number(settings?.saveTimeoutMs);
        return Number.isFinite(timeoutMs) && timeoutMs >= 0 ? timeoutMs : 50;
    }

    function updateProgress(value) {
        stash.setProgress(value);

        const progressValue = Number(value);
        const progressEl = document.querySelector('#progress-bar .progress-bar');
        if (!progressEl || !Number.isFinite(progressValue)) {
            return;
        }

        const boundedProgress = Math.max(0, Math.min(100, progressValue));
        progressEl.setAttribute('aria-valuenow', boundedProgress.toString());
        progressEl.textContent = (boundedProgress > 0 && boundedProgress <= 100) ? `${Math.round(boundedProgress)}%` : '';
    }

    let running = false;
    const buttons = [];
    let maxCount = 0;
    let sceneId = null;
    const removedFingerprints = [];

    function run() {
        if (!running) return;
        const button = buttons.pop();
        updateProgress((maxCount - buttons.length) / maxCount * 100);
        if (button) {
            const searchItem = getClosestAncestor(button, '.search-item');
            if (searchItem.classList.contains('d-none')) {
                setTimeout(() => {
                    run();
                }, 50);
                return;
            }

            const { id } = stash.parseSearchItem(searchItem);
            sceneId = id;
            if (!button.disabled) {
                button.click();
            }
            else {
                buttons.push(button);
            }
        }
        else {
            stop();
        }
    }

    function debounceAsync(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            return new Promise((resolve, reject) => {
                timeoutId = setTimeout(async () => {
                    try {
                        const result = await func.apply(this, args);
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                }, delay);
            });
        };
    }

    async function updateFingerprintQueue() {
        if (isEnableFingerprints()) return;

        const tagger = await localforage.getItem('tagger');
        if (Array.isArray(tagger?.fingerprintQueue?.[tagger?.selectedEndpoint])) {
            tagger.fingerprintQueue[tagger.selectedEndpoint] = tagger.fingerprintQueue[tagger.selectedEndpoint].filter(o => removedFingerprints.indexOf(o) < 0);
        }
        await localforage.setItem('tagger', tagger);

        const el = getElementByXpath("//span[contains(text(), 'Submit') and contains(text(), 'Fingerprint')]");
        if (el) {
            const fingerprintSet = new Set(tagger.fingerprintQueue[tagger.selectedEndpoint]);
            const removedFingerprintSet = new Set(removedFingerprints);
            el.innerText = `Submit ${fingerprintSet.size} Fingerprint${fingerprintSet.size !== 1 ? 's' : ''}`;
            el.innerText += removedFingerprintSet.size ? ` (${removedFingerprintSet.size} Batch Saved)` : '';
        }
    }

    const debouncedUpdateFingerprintQueue = debounceAsync(updateFingerprintQueue, 100);

    async function processSceneUpdate(evt) {
        if (running && evt.detail.data?.sceneUpdate?.id === sceneId) {
            removedFingerprints.push(sceneId);
            setTimeout(() => {
                run();
            }, getSaveTimeoutMs());
        }
    }

    stash.addEventListener('stash:request', async evt => {
        if (isEnableFingerprints()) return;
        if (evt.detail?.body) {
            const body = JSON.parse(evt.detail.body);
            if (body.operationName === "SubmitStashBoxFingerprints") {
                body.variables.input.scene_ids = body.variables.input.scene_ids.filter(o => removedFingerprints.indexOf(o) < 0);
                evt.detail.body = JSON.stringify(body);
            }
        }
    });

    const btnId = 'batch-save';
    const startLabel = 'Save All';
    const stopLabel = 'Stop Save';
    const btn = document.createElement("button");
    btn.setAttribute("id", btnId);
    btn.classList.add('btn', 'btn-primary', 'ml-3');
    btn.innerHTML = startLabel;
    btn.onclick = () => {
        if (running) {
            stop();
        }
        else {
            start();
        }
    };

    function start() {
        if (!confirm("Are you sure you want to batch save?")) return;
        btn.innerHTML = stopLabel;
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-danger');
        running = true;
        updateProgress(0);
        buttons.length = 0;
        for (const button of document.querySelectorAll('.btn.btn-primary')) {
            if (button.innerText === 'Save') {
                buttons.push(button);
            }
        }
        maxCount = buttons.length;
        stash.addEventListener('stash:response', processSceneUpdate);
        run();
    }

    function stop() {
        btn.innerHTML = startLabel;
        btn.classList.remove('btn-danger');
        btn.classList.add('btn-primary');
        running = false;
        updateProgress(0);
        sceneId = null;
        stash.removeEventListener('stash:response', processSceneUpdate);
    }

    stash.addEventListener('tagger:mutations:header', evt => {
        const el = getElementByXpath("//button[text()='Scrape All']");
        if (el && !document.getElementById(btnId)) {
            const container = el.parentElement;
            container.appendChild(btn);
            sortElementChildren(container);
            el.classList.add('ml-3');
        }
    });

    async function checkSaveButtonDisplay() {
        const taggerContainer = document.querySelector('.tagger-container');
        const saveButton = getElementByXpath("//button[text()='Save']", taggerContainer);
        btn.style.display = saveButton ? 'inline-block' : 'none';

        await debouncedUpdateFingerprintQueue();
    }

    stash.addEventListener('tagger:mutations:searchitems', checkSaveButtonDisplay);

    async function initRemoveButtons() {
        const nodes = getElementsByXpath("//button[contains(@class, 'btn-primary') and text()='Scrape by fragment']");
        const buttons = [];
        let node = null;
        while (node = nodes.iterateNext()) {
            buttons.push(node);
        }
        for (const button of buttons) {
            const searchItem = getClosestAncestor(button, '.search-item');

            const removeButtonExists = searchItem.querySelector('.tagger-remove');
            if (removeButtonExists) {
                continue;
            }

            const removeEl = createElementFromHTML('<div class="mt-2 text-right tagger-remove"><button class="btn btn-danger">Remove</button></div>');
            const removeButton = removeEl.querySelector('button');
            button.parentElement.parentElement.appendChild(removeEl);
            removeButton.addEventListener('click', async () => {
                searchItem.classList.add('d-none');
            });
        }
    }

    stash.addEventListener('page:studio:scenes', function () {
        waitForElementByXpath("//button[contains(@class, 'btn-primary') and text()='Scrape by fragment']", initRemoveButtons);
    });

    stash.addEventListener('page:tag:scenes', function () {
        waitForElementByXpath("//button[contains(@class, 'btn-primary') and text()='Scrape by fragment']", initRemoveButtons);
    });

    stash.addEventListener('page:performer:scenes', function () {
        waitForElementByXpath("//button[contains(@class, 'btn-primary') and text()='Scrape by fragment']", initRemoveButtons);
    });

    stash.addEventListener('page:scenes', function () {
        waitForElementByXpath("//button[contains(@class, 'btn-primary') and text()='Scrape by fragment']", initRemoveButtons);
    });

    // v0.24.3 compatibility
    stash.addEventListener('page:studio', function () {
        waitForElementByXpath("//button[contains(@class, 'btn-primary') and text()='Scrape by fragment']", initRemoveButtons);
    });
    stash.addEventListener('page:tag', function () {
        waitForElementByXpath("//button[contains(@class, 'btn-primary') and text()='Scrape by fragment']", initRemoveButtons);
    });
    stash.addEventListener('page:performer', function () {
        waitForElementByXpath("//button[contains(@class, 'btn-primary') and text()='Scrape by fragment']", initRemoveButtons);
    });

})();