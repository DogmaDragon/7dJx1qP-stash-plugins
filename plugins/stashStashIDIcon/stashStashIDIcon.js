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
    .peformer-stashid-icon {
        position: absolute;
        top: .8rem;
        left: .8rem;
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
    `;

    function createCheckmarkElement() {
        return createElementFromHTML(`<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="circle-check" class="svg-inline--fa fa-circle-check fa-icon undefined" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="
    color: #0f9960;
    height: 24px;
    margin-left: 4px;
    vertical-align: text-top;
"><path fill="currentColor" d="M0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256zM371.8 211.8C382.7 200.9 382.7 183.1 371.8 172.2C360.9 161.3 343.1 161.3 332.2 172.2L224 280.4L179.8 236.2C168.9 225.3 151.1 225.3 140.2 236.2C129.3 247.1 129.3 264.9 140.2 275.8L204.2 339.8C215.1 350.7 232.9 350.7 243.8 339.8L371.8 211.8z"></path></svg>`);
    }

    function addPerformerStashIDIcons(performerDatas) {
        for (const performerCard of document.querySelectorAll('.performer-card')) {
            const performerLink = performerCard.querySelector('.thumbnail-section > a');
            if (performerLink) {
                const performerUrl = performerLink.href;
                const performerId = performerUrl.split('/').pop();
                const performerData = performerDatas[performerId];
                if (performerData?.stash_ids.length) {
                    const el = createElementFromHTML(`<div class="peformer-stashid-icon" title="Has StashID">`);
                    el.appendChild(createCheckmarkElement());
    
                    performerLink.parentElement.appendChild(el);
                }
            }
        }
    }

    function addStudioStashIDIcons(studioDatas) {
        for (const studioCard of document.querySelectorAll('.studio-card')) {
            const studioLink = studioCard.querySelector('.thumbnail-section > a');
            const studioUrl = studioLink.href;
            const studioId = studioUrl.split('/').pop();
            const studioData = studioDatas[studioId];
            if (studioData?.stash_ids.length) {
                const el = createElementFromHTML(`<div class="studio-stashid-icon" title="Has StashID">`);
                el.appendChild(createCheckmarkElement());

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
                el.appendChild(createCheckmarkElement());
                tagCard.appendChild(el);
            }
        }
    }

        // Ensures all tag cards have stash_ids loaded in stash.tags
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

    function addSceneStudioStashIDIcons(studioData) {
        for (const studioCard of document.querySelectorAll('.studio-logo')) {
            if (studioData?.stash_ids.length) {
                const el = createElementFromHTML(`<div class="studio-stashid-icon" title="Has StashID">`);
                el.appendChild(createCheckmarkElement());

                studioCard.parentElement.appendChild(el);
            }
        }
    }

    stash.addEventListener('page:scene', function () {
        waitForElementClass("performer-card", function () {
            const sceneId = window.location.pathname.split('/').pop();
            const performerDatas = {};
            for (const performerData of stash.scenes[sceneId].performers) {
                performerDatas[performerData.id] = stash.performers[performerData.id];
            }
            addPerformerStashIDIcons(performerDatas);
            if (stash.scenes[sceneId].studio) {
                addSceneStudioStashIDIcons(stash.scenes[sceneId].studio);
            }
        });
    });

    stash.addEventListener('page:performers', function () {
        waitForElementClass("performer-card", function () {
            addPerformerStashIDIcons(stash.performers);
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
        waitForElementClass("performer-card", function () {
            addPerformerStashIDIcons(stash.performers);
        });
    });

})();