console.log('start background.js');

let thisTab = '';

// Initialise extension when extension is installed
chrome.runtime.onInstalled.addListener(() => {
    console.log('Execute on install');
    chrome.storage.local.set({
        install: 'Install 🟢',
        options: 'default',
        rulerHeight: '20',
    });
});

// Chrome Tabs event listener
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tabInfo) => {
    console.log('background.js - tabs.changeInfo ->', changeInfo);
    thisTab = tabId;

    if (changeInfo.status === 'complete' && /^http/.test(tabInfo.url)) {
        // Inject service worker styles
        chrome.scripting
            .insertCSS({
                target: { tabId: tabId },
                files: ['./styles/foreground.css'],
            })
            .then(() => {
                console.log('foreground CSS injected!!!');
            });
        // Inject service worker (foreground.js) script into page
        chrome.scripting
            .executeScript({
                target: { tabId: tabId },
                files: ['./js/foreground.js'],
            })
            .then(() => {
                console.log('Injected foreground.js from background.js');
                chrome.storage.session.get(['rulerOn']).then((result) => {
                    let rulerOn = result.rulerOn;

                    handleRulerOn(rulerOn);
                });
            })
            .catch((err) => console.log(err));
    }
});

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Foreground Response Handler
    switch (request.message) {
        case 'popup-open':
            setCurrentTab();
            sendResponse({ message: 'setting current tab' });

            break;

        case 'setRulerHeight':
            // console.log('setRulerHeight');
            sendResponse({
                message: `Ruler height set to ${request.rulerHeight}px ✅`,
            });

            chrome.storage.local.set({
                rulerHeight: request.rulerHeight,
            });
            break;

        case 'options.js':
            // console.log('Received Options message!');

            // Get 'install' data from local storage
            chrome.storage.local.get('install', (data) => {
                if (chrome.runtime.lastError) {
                    sendResponse({
                        message: 'fail',
                    });
                    return;
                }
                sendResponse({
                    install: `${data.install}`,
                    message: 'background.js to options.js!',
                });
            });
            break;

        case 'update-options':
            console.log('update-options-selected!!!');
            break;

        default:
            console.log('No Response from background switch ..', request);
    }
});

function handleRulerOn(rulerOn) {
    if (rulerOn) {
        // console.log('background.js - message.action: true ->', rulerOn);
        messageForeground({
            message: 'toggleRuler',
            action: true,
        });
    } else {
        // console.log('background.js - message.action: false ->', rulerOn);
        messageForeground({
            message: 'toggleRuler',
            action: false,
        });
    }
}

function messageForeground(action) {
    console.log('action', action);
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        if (tabs) {
            console.log('lastFocusedWindow', tabs);
            // use `url` here inside the callback because it's asynchronous!
        } else {
            console.log('No lastFocusedWindow !!!');
        }
    });

    // Send message to 'tab' i.e foreground.js
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.url) {
            console.log('currentWindow', tabs);
            action.url = tabs[0].url;

            chrome.storage.session.set({ url: action.url }).then(() => {
                console.log('url is set to ' + action.url);
            });
        }

        chrome.tabs.sendMessage(tabs[0].id, action, (response) => {
            console.log('response --->', response);
        });
    });
}

async function setCurrentTab() {
    let queryOptions = { active: true, currentWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    // console.log('tab', tab.url);

    chrome.storage.session.set({ url: tab.url }).then(() => {
        // console.log('url is set to ' + tab.url);
    });
}
