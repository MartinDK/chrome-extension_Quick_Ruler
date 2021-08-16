// Service worker - Service worker will deactivate and loose state after when not in use.

// Initialise extension when extension is installed
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
        install: 'Fresh Install 🟢',
        options: 'default',
        widthY: '20',
    });
});

// Chrome Tab event listener
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tabInfo) => {
    // console.log(tabId);
    // console.log(changeInfo);
    // console.log(tabInfo);
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
                console.log('Injecting foreground.js from background.js');
            })
            .catch((err) => console.log(err));
    }
});
// Chrome onMessage listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'options.js') {
        console.log('Recieved Options message!');

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

        return true;
    }
    if (request.message === 'popup.js') {
        // console.log("sending message to popup.js");
        sendResponse({
            message: 'background.js to popup.js!',
        });

        return true;
    }
    if (request.message === 'foreground.js') {
        // console.log("sending message to foreground.js");
        sendResponse({
            message: 'background.js to foreground.js!',
        });

        return true;
    }
    if (request.message === 'update-popup') {
        console.log('recieved popup.js update');
        sendResponse({
            message: `background.js recieved ${request.widthY}px ✅`,
        });

        console.log('savinging...', request.widthY);

        chrome.storage.local.set({
            widthY: request.widthY,
        });

        return true;
    }
    console.log("background.js didn't reply. ", request);
});
