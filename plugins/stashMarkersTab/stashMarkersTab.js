(function () {
    'use strict';

    const {
        stash,
        waitForElementClass,
        createElementFromHTML,
    } = window.stash7dJx1qP;

    const supportedObjectTypes = {
        performers: { singular: 'performer' },
        tags: { singular: 'tag' },
    };

    function getCurrentObjectPage() {
        const match = window.location.pathname.match(/\/(performers|tags)\/(\d+)/);
        if (!match) {
            return null;
        }

        const [, objectType, objectId] = match;
        return { objectType, objectId };
    }

    function getObjectName() {
        const selectors = [
            '.detail-header h2',
            '.performer-head h2',
            '.tag-head h2',
            '.page-header h2',
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.innerText) {
                return element.innerText.trim();
            }
        }

        return document.title.split(' - ')[0]?.trim() || '';
    }

    async function getMarkersCount(objectType, objectId) {
        const reqData = {
            operationName: 'FindSceneMarkers',
            variables: {
                scene_marker_filter: {
                    [objectType]: {
                        value: [objectId],
                        modifier: 'INCLUDES_ALL',
                    },
                },
            },
            query: `query FindSceneMarkers($filter: FindFilterType, $scene_marker_filter: SceneMarkerFilterType) {
                findSceneMarkers(filter: $filter, scene_marker_filter: $scene_marker_filter) {
                    count
                }
            }`,
        };

        const response = await stash.callGQL(reqData);
        return response?.data?.findSceneMarkers?.count ?? 0;
    }

    function buildMarkersUrl(objectType, objectId, objectName) {
        return `${window.location.origin}/scenes/markers?c=("type":"${objectType}","modifier":"INCLUDES_ALL","value":("items":[("id":"${objectId}","label":"${objectName}")],"excluded":[]))&sortby=created_at&sortdir=desc&disp=2`;
    }

    function objectPageHandler() {
        const objectPage = getCurrentObjectPage();
        if (!objectPage) {
            return;
        }

        const { objectType, objectId } = objectPage;
        const objectConfig = supportedObjectTypes[objectType];
        if (!objectConfig) {
            return;
        }

        const markersTabId = `${objectConfig.singular}-details-tab-markers`;

        waitForElementClass('nav-tabs', async function (className, el) {
            const navTabs = el.item(0);
            if (!navTabs || document.getElementById(markersTabId)) {
                return;
            }

            const markerTab = createElementFromHTML(`<a id="${markersTabId}" href="#" role="tab" data-rb-event-key="markers" aria-controls="${objectConfig.singular}-details-tabpane-markers" aria-selected="false" class="nav-item nav-link">Markers<span class="left-spacing badge badge-pill badge-secondary">0</span></a>`);
            navTabs.appendChild(markerTab);

            const markersCount = await getMarkersCount(objectType, objectId);
            const badge = document.querySelector(`#${markersTabId} span`);
            if (badge) {
                badge.innerHTML = markersCount;
            }

            const objectName = getObjectName();
            markerTab.href = buildMarkersUrl(objectType, objectId, objectName);
        });
    }

    stash.addEventListener('page:performer:any', objectPageHandler);
    stash.addEventListener('page:performer:details', objectPageHandler);
    stash.addEventListener('page:tag:any', objectPageHandler);
    stash.addEventListener('page:tag', objectPageHandler);
})();