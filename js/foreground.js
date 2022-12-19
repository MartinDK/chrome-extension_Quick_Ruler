// This script is injected into the page using a tab events listener
'use strict';
console.log('foreground.js starting...');

let rulerEl = document.createElement('div');
let rulerTxt = document.createElement('p');
let targetEl = document.querySelector('html');

rulerEl.appendChild(rulerTxt);

rulerEl.id = 'quickRuler';

// Track mouse
window.addEventListener('mouseup', handleMouseUp, false);

chrome.storage.local.get('rulerHeight', (data) => {
    console.log('setting ruler height..');
    setRulerHeight(data.rulerHeight);
});

chrome.storage.onChanged.addListener(function (changes, namespace) {
    // console.log('rulerHeight updated', changes.rulerHeight.newValue);
    if (changes.rulerHeight) {
        setRulerHeight(changes.rulerHeight.newValue);
    } else {
        console.log('No -', changes.rulerHeight);
    }
});

// Chrome Message Handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('foreground request', request);
    // console.log('sender',sender);

    // Get url details
    if (request.url) {
        const url = new URL(request.url);
        console.log('site', url);

        // handle urls
        switch (url.origin) {
            case 'https://www.chemistwarehouse.com.au':
                chemistwarehouseBlocker(request.url);
                console.log('Identified - Chemist Warehouse', request.url);

                break;

            case 'https://www.youtube.com':
                console.log('Identified - YouTube', request.url);
                break;

            default:
                console.log('Unrecognised website');
        }
    }

    // handle message
    switch (request.message) {
        case 'toggleRuler':
            console.log('toggleRuler', request);

            if (request.action) {
                rulerOn();
                sendResponse('ruler on.');
            } else {
                rulerOff();
                sendResponse('ruler off.');
            }

            break;

        case 'get transcript':
            sendResponse(youtubeTranscript());
            console.log('foreground.js switch processed - get transcript');
            break;

        case 'msg from popup.js!':
            sendResponse('msg from popup.js!');
            console.log('foreground.js switch processed - msg from popup.js!');
            break;

        default:
            console.log('No action taken');
            sendResponse(`foreground received -> ${request.url}`);
    }
});

function chemistwarehouseBlocker(url) {
    const idBlockList = [
        { elementID: 'page_skinning', action: 'removeBackgroundImage' },
        { elementID: 'left_pg_clickable_cont', action: 'removeElement' },
        { elementID: 'right_pg_clickable_cont', action: 'removeElement' },
    ];

    idBlockList.forEach((item) => {
        const el = document.getElementById(item.elementID);

        switch (item.action) {
            case 'removeBackgroundImage':
                console.log('removeBackgroundImage');
                removeBackgroundImage(el);
                break;

            case 'removeElement':
                console.log('removeElement');
                if (el) removeElement(el);
                break;

            default:
                console.log('Chemist Warehouse Blocker Actin not found');
        }
    });

    return;

    function removeBackgroundImage(elementID) {
        // console.log('execute removeBackgroundImage', elementID);
        elementID.style.backgroundImage = null;
        elementID.style.backgroundColor = 'wheat';
    }

    function removeElement(elementID) {
        // console.log('execute removeElement');
        elementID.remove();
    }
}

function youtubeTranscript() {
    console.log('Getting YouTube transcript');

    let transcript = '';
    const transcriptList = document.querySelectorAll(
        'yt-formatted-string.ytd-transcript-segment-renderer'
    );

    transcriptList.forEach((transcriptItem) => {
        transcript = `${transcript} ` + transcriptItem.innerText;
    });

    console.log({ message: 'transcript', trans: transcript });

    return { transcript: transcript };
}

function handleMouseUp(e) {
    console.log('mouse Y position:' + e.clientY);
    rulerEl.style.top = `${e.clientY}px`;
}

function setRulerHeight(rulerHeight) {
    // console.log('Setting ruler height:', rulerHeight);
    rulerEl.style.height = `${rulerHeight}px`;
    rulerTxt.innerText = `${rulerHeight}px`;
}

function rulerOn() {
    targetEl.appendChild(rulerEl);
}

function rulerOff() {
    rulerEl.remove();
}
