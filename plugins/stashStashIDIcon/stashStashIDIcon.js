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

    document.body.appendChild(document.createElement('style')).textContent = `
    .performer-stashid-icon {
        position: absolute;
        bottom: 1rem;
        left: 1rem;
    }
    .tag-stashid-icon {
        position: absolute;
        top: .8rem;
        left: .8rem;
    }
    .studio-stashid-icon {
        position: absolute;
        top: 10px;
        left: 5px;
    }
    .col-3.d-xl-none .studio-stashid-icon {
        position: relative;
        top: 0;
        right: 0;
    }
    .stashid-icon-btn {
        cursor: pointer;
        background: none;
        border: none;
        padding: 0;
        display: inline-flex;
        align-items: center;
        line-height: 0;
    }
    @media (min-width: 1200px), (max-width: 575px) {
        .performer-stashid-icon {
            bottom: .5rem;
            left: 1rem;
        }
        .performer-stashid-icon .stashid-icon-btn svg {
            height: 2rem;
            width: 2rem;
            filter: drop-shadow(0 0 2px rgba(0,0,0,.9));
        }
    }
    .stashid-icon-btn:focus {
        outline: none;
    }
    .stashid-popup {
        position: absolute;
        z-index: 9999;
        background-color: #30404d;
        color: #f5f8fa;
        background-clip: padding-box;
        border: 1px solid rgba(0,0,0,.2);
        border-radius: .3rem;
        outline: 0;
        padding: 8px 12px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.6);
        min-width: 150px;
        font-size: 13px;
    }
    .stashid-popup-title {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #888;
        margin-bottom: 6px;
    }
    .stashid-popup-table {
        width: 100%;
        border-collapse: collapse;
    }
    .stashid-popup-table tr + tr td {
        border-top: 1px solid #333;
    }
    .stashid-popup-table td {
        padding: 5px 4px;
        vertical-align: middle;
    }
    .stashid-popup-endpoint {
        word-break: break-all;
    }
    .stashid-popup-status {
        text-align: center;
        width: 24px;
        padding-left: 8px;
    }
    .stashid-popup-has {
        color: #0f9960;
        font-size: 16px;
    }
    .stashid-popup-missing {
        color: #555;
        font-size: 16px;
    }
    `;

    function createCheckmarkSVG() {
        return createElementFromHTML(`<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="circle-check" class="svg-inline--fa fa-circle-check fa-icon undefined" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="color: #0f9960; height: 24px; margin-left: 0; vertical-align: middle; display: block;"><path fill="currentColor" d="M0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256zM371.8 211.8C382.7 200.9 382.7 183.1 371.8 172.2C360.9 161.3 343.1 161.3 332.2 172.2L224 280.4L179.8 236.2C168.9 225.3 151.1 225.3 140.2 236.2C129.3 247.1 129.3 264.9 140.2 275.8L204.2 339.8C215.1 350.7 232.9 350.7 243.8 339.8L371.8 211.8z"></path></svg>`);
    }

    function getAllEndpoints(datas) {
        const endpoints = new Set();
        for (const data of Object.values(datas)) {
            if (Array.isArray(data?.stash_ids)) {
                for (const sid of data.stash_ids) {
                    if (sid.endpoint) endpoints.add(sid.endpoint);
                }
            }
        }
        return [...endpoints].sort();
    }

    let configuredStashBoxEndpoints = null;
    async function getConfiguredStashBoxEndpoints() {
        if (configuredStashBoxEndpoints) return configuredStashBoxEndpoints;

        const reqData = {
            operationName: "Configuration",
            variables: {},
            query: `query Configuration {\n  configuration {\n    general {\n      stashBoxes {\n        name\n        endpoint\n      }\n    }\n  }\n}`
        };

        try {
            const resp = await stash.callGQL(reqData);
            const boxes = resp?.data?.configuration?.general?.stashBoxes || [];
            configuredStashBoxEndpoints = boxes
                .map(box => ({
                    name: box.name || shortEndpoint(box.endpoint || ''),
                    endpoint: box.endpoint,
                }))
                .filter(box => box.endpoint);
            return configuredStashBoxEndpoints;
        } catch (e) {
            configuredStashBoxEndpoints = [];
            return configuredStashBoxEndpoints;
        }
    }

    function normalizeEndpointEntries(entries) {
        return (entries || [])
            .map(entry => typeof entry === 'string'
                ? { name: shortEndpoint(entry), endpoint: entry }
                : entry)
            .filter(entry => entry && entry.endpoint)
            .map(entry => ({
                name: entry.name || shortEndpoint(entry.endpoint),
                endpoint: entry.endpoint,
            }));
    }

    function shortEndpoint(endpoint) {
        return endpoint.replace(/^https?:\/\//, '').replace(/\/$/, '');
    }

    function createClickableIcon(stashIds, allEndpoints) {
        const btn = document.createElement('button');
        btn.className = 'stashid-icon-btn';
        btn.title = 'StashID - click for details';
        btn.appendChild(createCheckmarkSVG());

        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const existing = document.querySelector('.stashid-popup');
            if (existing) {
                const isOwn = existing.dataset.owner === btn.dataset.uid;
                existing.remove();
                if (isOwn) return;
            }

            const uid = Math.random().toString(36).slice(2);
            btn.dataset.uid = uid;

            const endpointMap = {};
            for (const sid of stashIds) {
                endpointMap[sid.endpoint] = sid.stash_id;
            }

            const endpointsToShow = normalizeEndpointEntries(allEndpoints).length > 0
                ? normalizeEndpointEntries(allEndpoints)
                : Object.keys(endpointMap).sort().map(endpoint => ({ name: shortEndpoint(endpoint), endpoint }));

            const popup = document.createElement('div');
            popup.className = 'stashid-popup';
            popup.dataset.owner = uid;

            let html = '<div class="stashid-popup-title">stash-box Endpoints</div>';
            html += '<table class="stashid-popup-table">';
            for (const item of endpointsToShow) {
                const hasId = endpointMap[item.endpoint];
                html += `<tr>
                    <td class="stashid-popup-endpoint">${item.name}</td>
                    <td class="stashid-popup-status ${hasId ? 'stashid-popup-has' : 'stashid-popup-missing'}">${hasId ? '✓' : '✗'}</td>
                </tr>`;
            }
            html += '</table>';
            popup.innerHTML = html;

            const rect = btn.getBoundingClientRect();
            popup.style.top = (rect.bottom + window.scrollY + 4) + 'px';
            popup.style.left = (rect.left + window.scrollX) + 'px';
            document.body.appendChild(popup);

            setTimeout(() => {
                document.addEventListener('click', function closePopup(ev) {
                    if (!popup.contains(ev.target) && ev.target !== btn) {
                        popup.remove();
                        document.removeEventListener('click', closePopup);
                    }
                });
            }, 0);
        });

        return btn;
    }

    async function addPerformerStashIDIcons(performerDatas, preferredEndpoints = []) {
        const configuredEndpoints = await getConfiguredStashBoxEndpoints();
        const localEndpoints = preferredEndpoints.length > 0 ? normalizeEndpointEntries(preferredEndpoints) : normalizeEndpointEntries(getAllEndpoints(performerDatas));
        const merged = new Map();
        for (const endpointInfo of [...configuredEndpoints, ...localEndpoints]) {
            if (!merged.has(endpointInfo.endpoint)) {
                merged.set(endpointInfo.endpoint, endpointInfo);
            }
        }
        const allEndpoints = [...merged.values()].sort((left, right) => left.name.localeCompare(right.name));
        for (const performerCard of document.querySelectorAll('.performer-card')) {
            const performerLink = performerCard.querySelector('.thumbnail-section > a');
            if (performerLink) {
                const performerUrl = performerLink.href;
                const performerId = performerUrl.split('/').pop();
                const performerData = performerDatas[performerId];
                if (performerData?.stash_ids?.length) {
                    const el = createElementFromHTML(`<div class="performer-stashid-icon">`);
                    el.appendChild(createClickableIcon(performerData.stash_ids, allEndpoints));
                    performerLink.parentElement.appendChild(el);
                }
            }
        }
    }

    function addStudioStashIDIcons(studioDatas) {
        for (const studioCard of document.querySelectorAll('.studio-card')) {
            const studioLink = studioCard.querySelector('.thumbnail-section > a');
            if (!studioLink) continue;
            const studioUrl = studioLink.href;
            const studioId = studioUrl.split('/').pop();
            const studioData = studioDatas[studioId];
            if (studioData?.stash_ids?.length) {
                const el = createElementFromHTML(`<div class="studio-stashid-icon" title="Has StashID">`);
                el.appendChild(createCheckmarkSVG());
                studioCard.appendChild(el);
            }
        }
    }

    function addTagStashIDIcons(tagDatas) {
        for (const tagCard of document.querySelectorAll('.tag-card')) {
            const tagLink = tagCard.querySelector('.thumbnail-section > a');
            if (!tagLink) continue;
            const tagUrl = tagLink.href;
            const tagId = tagUrl.split('/').pop();
            const tagData = tagDatas[tagId];
            if (Array.isArray(tagData?.stash_ids) && tagData.stash_ids.length > 0) {
                const el = createElementFromHTML(`<div class="tag-stashid-icon" title="Has StashID">`);
                el.appendChild(createCheckmarkSVG());
                tagCard.appendChild(el);
            }
        }
    }

    async function ensureTagsHaveStashIDs() {
        const tagCards = document.querySelectorAll('.tag-card .thumbnail-section > a');
        const tagIds = Array.from(tagCards).map(a => a.href.split('/').pop()).filter(id => id);
        const missing = tagIds.filter(id => !stash.tags[id] || typeof stash.tags[id].stash_ids === 'undefined');
        if (missing.length > 0) {
            const reqData = {
                operationName: "FindTags",
                variables: { ids: missing },
                query: `query FindTags($ids: [ID!]) {\n  findTags(ids: $ids) {\n    tags { id stash_ids { endpoint stash_id } } }\n}`
            };
            try {
                const resp = await stash.callGQL(reqData);
                if (resp && resp.data && resp.data.findTags) {
                    for (const tag of resp.data.findTags.tags) {
                        stash.tags[tag.id] = tag;
                    }
                }
            } catch (e) {
                // fail silently
            }
        }
    }

    async function ensurePerformersHaveStashIDs(performerIds) {
        const ids = (performerIds || []).filter(id => id);
        if (ids.length === 0) return;

        for (const id of ids) {
            const reqData = {
                operationName: "FindPerformer",
                variables: { id },
                query: `query FindPerformer($id: ID!) {\n  findPerformer(id: $id) {\n    id\n    stash_ids { endpoint stash_id }\n  }\n}`
            };

            try {
                const resp = await stash.callGQL(reqData);
                const performer = resp?.data?.findPerformer;
                if (!performer?.id) continue;

                stash.performers[performer.id] = {
                    ...(stash.performers[performer.id] || {}),
                    stash_ids: performer.stash_ids || []
                };
            } catch (e) {
                // fail silently
            }
        }
    }

    function addSceneStudioStashIDIcons(studioData) {
        if (!studioData?.stash_ids?.length) return;

        const target = document.querySelector('.scene-header-container h1.studio-logo > a')
            || document.querySelector('.scene-header-container h1.studio-logo');
        if (!target) return;

        if (target.querySelector('.studio-stashid-icon')) return;

        const el = createElementFromHTML(`<div class="studio-stashid-icon" title="Has StashID">`);
        el.appendChild(createCheckmarkSVG());
        target.appendChild(el);
    }

    stash.addEventListener('page:scene', function () {
        waitForElementClass("performer-card", async function () {
            const sceneId = window.location.pathname.split('/').pop();
            const scene = stash.scenes[sceneId];
            const performerIds = (scene?.performers || []).map(p => p.id).filter(id => id);
            await ensurePerformersHaveStashIDs(performerIds);

            const performerDatas = {};
            for (const performerData of (scene?.performers || [])) {
                performerDatas[performerData.id] = stash.performers[performerData.id];
            }
            await addPerformerStashIDIcons(performerDatas, getAllEndpoints(performerDatas));
            if (scene?.studio) {
                addSceneStudioStashIDIcons(scene.studio);
            }
        });
    });

    stash.addEventListener('page:performers', function () {
        waitForElementClass("performer-card", async function () {
            await addPerformerStashIDIcons(stash.performers);
        });
    });

    stash.addEventListener('page:studios', function () {
        waitForElementClass("studio-card", function () {
            addStudioStashIDIcons(stash.studios);
        });
    });

    stash.addEventListener('page:tags', function () {
        waitForElementClass("tag-card", async function () {
            await ensureTagsHaveStashIDs();
            addTagStashIDIcons(stash.tags);
        });
    });

    stash.addEventListener('page:studio:performers', function () {
        waitForElementClass("performer-card", async function () {
            await addPerformerStashIDIcons(stash.performers);
        });
    });

})();