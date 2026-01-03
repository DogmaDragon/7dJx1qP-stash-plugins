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
        createElementFromHTML,
    } = window.stash7dJx1qP;

    function createTooltipElement() {
        const copyTooltip = document.createElement('span');
        copyTooltip.setAttribute('id', 'copy-tooltip');
        copyTooltip.innerText = 'Copied!';
        copyTooltip.classList.add('fade', 'hide');
        copyTooltip.style.position = "absolute";
        copyTooltip.style.left = '0px';
        copyTooltip.style.top = '0px';
        copyTooltip.style.marginLeft = '40px';
        copyTooltip.style.padding = '5px 12px';
        copyTooltip.style.backgroundColor = '#000000df';
        copyTooltip.style.borderRadius = '4px';
        copyTooltip.style.color = '#fff';
        copyTooltip.style.zIndex = 100;
        document.body.appendChild(copyTooltip);
        return copyTooltip;
    }

    function createCopyButton(copyTooltip, copyText) {
        const copyBtn = document.createElement('button');
        copyBtn.title = 'Copy to clipboard';
        copyBtn.innerHTML = `<svg class="svg-inline--fa" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.1.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path fill="#FFFFFF" d="M384 96L384 0h-112c-26.51 0-48 21.49-48 48v288c0 26.51 21.49 48 48 48H464c26.51 0 48-21.49 48-48V128h-95.1C398.4 128 384 113.6 384 96zM416 0v96h96L416 0zM192 352V128h-144c-26.51 0-48 21.49-48 48v288c0 26.51 21.49 48 48 48h192c26.51 0 48-21.49 48-48L288 416h-32C220.7 416 192 387.3 192 352z"/></svg>`;
        copyBtn.classList.add('btn', 'btn-secondary', 'btn-sm', 'minimal', 'ml-1');
        copyBtn.addEventListener('click', copyHandler(copyTooltip, copyText));
        return copyBtn;
    }

    function copyHandler(copyTooltip, copyText) {
        return evt => {
            navigator.clipboard.writeText(copyText);
            const rect = document.body.getBoundingClientRect();
            const rect2 = evt.currentTarget.getBoundingClientRect();
            const x = rect2.left - rect.left;
            const y = rect2.top - rect.top;
            copyTooltip.classList.add('show');
            copyTooltip.style.left = `${x}px`;
            copyTooltip.style.top = `${y}px`;
            setTimeout(() => {
                copyTooltip.classList.remove('show');
            }, 500);
        }
    }

    function createTooltipElement() {
        const copyTooltip = document.createElement('span');
        copyTooltip.setAttribute('id', 'copy-tooltip');
        copyTooltip.innerText = 'Copied!';
        copyTooltip.classList.add('fade', 'hide');
        copyTooltip.style.position = "absolute";
        copyTooltip.style.left = '0px';
        copyTooltip.style.top = '0px';
        copyTooltip.style.marginLeft = '40px';
        copyTooltip.style.padding = '5px 12px';
        copyTooltip.style.backgroundColor = '#000000df';
        copyTooltip.style.borderRadius = '4px';
        copyTooltip.style.color = '#fff';
        copyTooltip.style.zIndex = 100;
        document.body.appendChild(copyTooltip);
        return copyTooltip;
    }

    function createCopyButton(copyTooltip, copyText) {
        const copyBtn = document.createElement('button');
        copyBtn.title = 'Copy to clipboard';
        copyBtn.innerHTML = `<svg class="svg-inline--fa" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.1.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path fill="#FFFFFF" d="M384 96L384 0h-112c-26.51 0-48 21.49-48 48v288c0 26.51 21.49 48 48 48H464c26.51 0 48-21.49 48-48V128h-95.1C398.4 128 384 113.6 384 96zM416 0v96h96L416 0zM192 352V128h-144c-26.51 0-48 21.49-48 48v288c0 26.51 21.49 48 48 48h192c26.51 0 48-21.49 48-48L288 416h-32C220.7 416 192 387.3 192 352z"/></svg>`;
        copyBtn.classList.add('btn', 'btn-secondary', 'btn-sm', 'minimal', 'ml-1');
        copyBtn.addEventListener('click', copyHandler(copyTooltip, copyText));
        return copyBtn;
    }

    function copyHandler(copyTooltip, copyText) {
        return evt => {
            navigator.clipboard.writeText(copyText);
            const rect = document.body.getBoundingClientRect();
            const rect2 = evt.currentTarget.getBoundingClientRect();
            const x = rect2.left - rect.left;
            const y = rect2.top - rect.top;
            copyTooltip.classList.add('show');
            copyTooltip.style.left = `${x}px`;
            copyTooltip.style.top = `${y}px`;
            setTimeout(() => {
                copyTooltip.classList.remove('show');
            }, 500);
        }
    }

    function addCopyButtonsToStashIds() {
        const copyTooltip = createTooltipElement();
        const stashIdsResult = getElementsByXpath("//span[contains(@class, 'detail-item-value') and contains(@class, 'stash-ids')]//span[@class='stash-id-pill']/a");
        const stashIds = [];
        let node = null;
        while (node = stashIdsResult.iterateNext()) {
            stashIds.push(node);
        }
        for (const stashId of stashIds) {
            const copyBtn = createCopyButton(copyTooltip, stashId.innerText);
            stashId.parentElement.appendChild(copyBtn);
        }
    }

    function pageHandler() {
        waitForElementClass('detail-group', function () {
            addCopyButtonsToStashIds();
        });
    }
    stash.addEventListener('page:performer:any', pageHandler);
    stash.addEventListener('page:performer:details', pageHandler);
    stash.addEventListener('page:studio:any', pageHandler);
    stash.addEventListener('page:studio:details', pageHandler);
})();