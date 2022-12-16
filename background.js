let thisTab;

// Initialise extension when extension is installed
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
        install: 'Install 🟢',
        options: 'default',
        rulerHeight: '20',
    });
});

chrome.storage.local.set({
    rulerHeight: '21',
});

// Chrome Tab event listener
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tabInfo) => {
    thisTab = tabId;

    if (changeInfo.status === 'complete' && /^http/.test(tabInfo.url)) {
        // Inject service worker styles
        chrome.scripting
            .insertCSS({
                target: { tabId: tabId },
                files: ['./foreground.css'],
            })
            .then(() => {
                console.log('No CSS Injected!!!');
            });
        // Inject service worker (foreground.js) script into page
        chrome.scripting
            .executeScript({
                target: { tabId: tabId },
                files: ['./foreground.js'],
            })
            .then(() => {
                // console.log('Injected foreground.js from background.js');
                chrome.storage.session.get(['rulerOn']).then((result) => {
                    let rulerOn = result.rulerOn;

                    if (rulerOn) {
                        // console.log('rulerOn ->', rulerOn);

                        messageForeground({
                            message: 'toggleRuler',
                            action: true,
                        });
                    } else {
                        // console.log('rulerOn ->', rulerOn);

                        messageForeground({
                            message: 'toggleRuler',
                            action: false,
                        });
                    }
                });
            })
            .catch((err) => console.log(err));
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Foreground Response Handler
    switch (request.message) {
        case 'popup-open':
            setCurrentTab();
            sendResponse({ message: 'setting current tab' });

            break;

        case 'options.js':
            console.log('Received Options message!');

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

        case 'update-popup':
            console.log('received popup.js update');
            sendResponse({
                message: `background.js received ${request.rulerHeight}px ✅`,
            });

            chrome.storage.local.set({
                rulerHeight: request.rulerHeight,
            });
            break;

        case 'update-options':
            console.log('update-options-selected!!!');
            break;

        default:
            console.log('No Response from background switch ..', request);
    }
});

function messageForeground(action) {
    // console.log('action', action);
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

            chrome.tabs.sendMessage(tabs[0].id, action, (response) => {
                console.log('response --->', response);
            });
        } else {
            console.log('No currentWindow !!!');
        }
        chrome.storage.session.set({ url: action.url }).then(() => {
            // console.log('url is set to ' + action.url);
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
