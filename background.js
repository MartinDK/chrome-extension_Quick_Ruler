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
    console.log('tabId:', tabId);
    thisTab = tabId;
    //    console.log(changeInfo);
    //    console.log(tabInfo);

    if (changeInfo.status === 'complete' && /^http/.test(tabInfo.url)) {
        // Inject service worker styles
        chrome.scripting
            .insertCSS({
                target: { tabId: tabId },
                files: ['./foreground.css'],
            })
            .then(() => {
                console.log('CSS Injected');
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

// Chrome Message Handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // console.log('request message:', request);
    // console.log('sender:', sender);

    // Foreground Response Handler
    switch (request.message) {
        case 'rulerOn-Off':
            console.log('Ruler On/Off', request);
            messageForeground({ message: 'ruler', action: request.state, tabId: thisTab });
            sendResponse({ message: 'updated ruler on/off' });
            break;

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

        case 'popup.js':
            console.log('sending message to popup.js');

            sendResponse({
                message: 'background.js to popup.js!',
            });
            break;

        case 'foreground.js':
            console.log('sending message to foreground.js');
            sendResponse({
                message: 'background.js to foreground.js!',
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
        // console.log('lastFocusedWindow', tabs);
        // use `url` here inside the callback because it's asynchronous!
    });

    // Send message to 'tab' i.e foreground.js
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        console.log('currentWindow', tabs);
        action.url = tabs[0].url;

        chrome.storage.session.set({ url: action.url }).then(() => {
            console.log('url is set to ' + action.url);
        });

        chrome.tabs.sendMessage(tabs[0].id, action, (response) => {
            console.log(response);
        });
    });
}

async function setCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    console.log('tab', tab.url);

    chrome.storage.session.set({ url: tab.url }).then(() => {
        console.log('url is set to ' + tab.url);
    });
}
