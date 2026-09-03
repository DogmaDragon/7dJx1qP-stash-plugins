(function () {
    'use strict';

    const {
        stash,
        Stash,
        waitForElementId,
        waitForElementClass,
        waitForElementByXpath,
        getElementByXpath,
        insertAfter,
        createElementFromHTML,
    } = window.stash7dJx1qP;

    function formatDuration(s) {
        const sec_num = parseInt(s, 10);
        let hours   = Math.floor(sec_num / 3600);
        let minutes = Math.floor((sec_num - (hours * 3600)) / 60);
        let seconds = sec_num - (hours * 3600) - (minutes * 60);
    
        if (hours < 10) { hours = "0" + hours; }
        if (minutes < 10) { minutes = "0" + minutes; }
        if (seconds < 10) { seconds = "0" + seconds; }
        return hours + ':' + minutes + ':' + seconds;
    }

    stash.addEventListener('tagger:searchitem', async function (evt) {
        const searchItem = evt.detail;
        const {
            urlNode,
            url,
            id,
            data,
            nameNode,
            name,
            queryInput,
            performerNodes
        } = stash.parseSearchItem(searchItem);

        const includeDuration = (localStorage.getItem('additions-duration') || 'true') === 'true';
        const includePath = (localStorage.getItem('additions-path') || 'true') === 'true';
        const includeUrl = (localStorage.getItem('additions-url') || 'true') === 'true';

        const originalSceneDetails = searchItem.querySelector('.original-scene-details');
        const detailsContainer = originalSceneDetails.firstChild.firstChild;

        function createDetailRow(label, valueNode, valueClass, isVisible) {
            const row = createElementFromHTML('<div class="scene-addition-row"></div>');
            row.style.display = isVisible ? 'flex' : 'none';
            row.style.alignItems = 'flex-start';
            row.style.gap = '0.4rem';
            row.style.fontWeight = 500;
            row.style.color = '#fff';
            row.style.lineHeight = 1.2;

            const labelNode = createElementFromHTML(`<span class="${valueClass}-label">${label}</span>`);
            labelNode.style.opacity = 0.75;
            labelNode.style.whiteSpace = 'nowrap';

            valueNode.classList.add(valueClass);
            valueNode.style.color = '#fff';
            valueNode.style.wordBreak = 'break-all';

            row.appendChild(labelNode);
            row.appendChild(valueNode);
            return row;
        }

        const urls = Array.isArray(data?.urls) ? data.urls : (data?.url ? [data.url] : []);
        if (!detailsContainer.querySelector('.scene-url')) {
            for (const sceneUrl of urls) {
                if (sceneUrl) {
                    const sceneUrlNode = createElementFromHTML(`<a href="${sceneUrl}" target="_blank">${sceneUrl}</a>`);
                    const urlRow = createDetailRow('URL:', sceneUrlNode, 'scene-url', includeUrl);
                    detailsContainer.appendChild(urlRow);
                }
            }
        }

        const paths = stash.compareVersion("0.17.0") >= 0 ? (data?.files || []).map(file => file.path) : [data?.path];
        if (!detailsContainer.querySelector('.scene-path')) {
            for (const path of paths) {
                if (path) {
                    const pathNode = createElementFromHTML(`<span>${path}</span>`);
                    const pathRow = createDetailRow('Path:', pathNode, 'scene-path', includePath);
                    detailsContainer.appendChild(pathRow);
                }
            }
        }

        const duration = stash.compareVersion("0.17.0") >= 0 ? data?.files?.[0]?.duration : data?.file?.duration;
        if (!detailsContainer.querySelector('.scene-duration') && duration) {
            const durationNode = createElementFromHTML(`<span>${formatDuration(duration)}</span>`);
            const durationRow = createDetailRow('Duration:', durationNode, 'scene-duration', includeDuration);
            detailsContainer.appendChild(durationRow);
        }

        const expandDetailsButton = originalSceneDetails.querySelector('button');
        if (!expandDetailsButton.classList.contains('.enhanced')) {
            expandDetailsButton.classList.add('enhanced');
            expandDetailsButton.addEventListener('click', evt => {
                const icon = expandDetailsButton.firstChild.dataset.icon;
                if (evt.shiftKey) {
                    evt.preventDefault();
                    evt.stopPropagation();
                    for (const button of document.querySelectorAll('.original-scene-details button')) {
                        if (button.firstChild.dataset.icon === icon) {
                            button.click();
                        }
                    }
                }
            });
        }
    });

    const additionsConfigId = 'additionsconfig';

    stash.addEventListener('tagger:configuration', evt => {
        const el = evt.detail;
        if (!document.getElementById(additionsConfigId)) {
            const configContainer = el.parentElement;
            const additionsConfig = createElementFromHTML(`
<div id="${additionsConfigId}" class="col-md-6 mt-4">
<h5>Tagger Additions Configuration</h5>
<div class="row">
    <div class="align-items-center form-group col-md-6">
        <div class="form-check">
            <input type="checkbox" id="additions-duration" class="form-check-input" data-default="true">
            <label title="" for="additions-duration" class="form-check-label">Duration</label>
        </div>
    </div>
    <div class="align-items-center form-group col-md-6">
        <div class="form-check">
            <input type="checkbox" id="additions-path" class="form-check-input" data-default="true">
            <label title="" for="additions-path" class="form-check-label">Filepath</label>
        </div>
    </div>
    <div class="align-items-center form-group col-md-6">
        <div class="form-check">
            <input type="checkbox" id="additions-url" class="form-check-input" data-default="true">
            <label title="" for="additions-url" class="form-check-label">URL</label>
        </div>
    </div>
</div>
</div>
            `);
            configContainer.appendChild(additionsConfig);
            loadSettings();
            document.getElementById('additions-duration').addEventListener('change', function () {
                for (const node of document.querySelectorAll('.scene-duration')) {
                    node.parentElement.style.display = this.checked ? 'flex' : 'none';
                }
            });
            document.getElementById('additions-path').addEventListener('change', function () {
                for (const node of document.querySelectorAll('.scene-path')) {
                    node.parentElement.style.display = this.checked ? 'flex' : 'none';
                }
            });
            document.getElementById('additions-url').addEventListener('change', function () {
                for (const node of document.querySelectorAll('.scene-url')) {
                    node.parentElement.style.display = this.checked ? 'flex' : 'none';
                }
            });
        }
    });

    async function loadSettings() {
        for (const input of document.querySelectorAll(`#${additionsConfigId} input`)) {
            input.checked = (localStorage.getItem(input.id) || input.dataset.default) === 'true';
            input.addEventListener('change', () => {
                localStorage.setItem(input.id, input.checked);
            });
        }
    }
})();