console.log('popup.js....');

let rulerHeightEl = document.getElementById('input-height');
let saveBtnEl = document.getElementById('saveBtn');
let actionNameEl = document.getElementById('actionName');
let actionButtonEl = document.getElementById('actionButton');
let actionOutputEl = document.getElementById('actionOutput');
let rulerStateEl = document.getElementById('rulerState');

actionOutputEl.innerText = 'empty';

chrome.storage.session.get(['rulerOn']).then((result) => {
    let rulerOn = result.rulerOn;

    if (rulerOn) {
        console.log('message.action: true ->', rulerOn);
        rulerStateEl.checked = true;

        messageForeground({
            message: 'toggleRuler',
            action: true,
        });
    } else {
        // console.log('message.action: false ->', rulerOn);
        rulerStateEl.checked = false;
    }
});

rulerState.addEventListener('click', (e) => {
    // console.log('rulerState...', e);
    // console.log('rulerState...', rulerState.checked);

    let rulerToggle = rulerState.checked;

    messageForeground({
        message: 'toggleRuler',
        action: rulerToggle,
    });
});

saveBtnEl.addEventListener('click', (e) => {
    // console.log('save...', e.target);
    setRulerHeight(`${rulerHeightEl.value}`);
});

actionButtonEl.addEventListener('click', (e) => {
    // console.log('save...', e.target);
    // console.log('Msg...', e);

    messageForeground({ message: 'get transcript' });
});

chrome.storage.local.get('rulerHeight', (data) => {
    // console.log(data.rulerHeight);
    rulerHeightEl.value = `${data.rulerHeight}`;
    setRulerHeight(data.rulerHeight);
});

// chrome.runtime.sendMessage(
//     {
//         message: 'popup-open',
//     },
//     (response) => {
//         if (response) {
//             console.log('Response from background:', response);
//         }
//     }
// );

(async () => {
    const response = await chrome.runtime.sendMessage({ message: 'popup-open' }, (response) => {
        // do something with response here, not outside the function
        console.log('response ->', response);

        chrome.storage.onChanged.addListener((response) => {
            console.log('response -->', response.url.newValue);
            let url = response.url.newValue;

            if (url) {
                let urlFixed = new URL('/', url);
                console.log('url: true ->', urlFixed);

                actionNameEl.innerText = urlFixed.host;
            } else {
                console.log('message.action: false ->', url);
            }
        });

        chrome.storage.session.get(['url']).then((result) => {
            let url = result.url;

            if (url) {
                console.log('url: true ->', url);

                let urlFixed = new URL('/', url);
                actionNameEl.innerText = urlFixed.host;
            } else {
                console.log('url: false ->', url);
            }
        });
    });
})();

function setRulerHeight(rulerHeight) {
    // console.log('rulerHeight');

    rulerHeightEl.value = rulerHeight;

    // Message event listener
    chrome.runtime.sendMessage(
        {
            message: 'update-popup',
            rulerHeight: rulerHeight,
        },
        (response) => {
            if (response) {
                // console.log('Response:', response.message);
                document.querySelector('#popup').innerHTML = `<p>${response.message}</p>`;
            }
        }
    );
}

function messageForeground(messageObj) {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        // console.log('lastFocusedWindow', tabs);
        let url = tabs[0].url;
        // use `url` here inside the callback because it's asynchronous!
        console.log('url= ', url);
    });

    // Send message to 'tab' i.e foreground.js
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        // console.log('currentWindow', tabs);

        let rulerOn = messageObj.action;

        chrome.storage.session.set({ rulerOn: rulerOn }).then(() => {
            console.log('rulerOn set to ', rulerOn);
        });

        if (messageObj.action) {
            console.log('message.action: true -->', rulerOn);

            // chrome.storage.session.set({ rulerOn: true }).then(() => {
            //     console.log('rulerOn set to true');
            // });
        } else {
            console.log('message.action: false -->', rulerOn);

            // chrome.storage.session.set({ rulerOn: false }).then(() => {
            //     console.log('rulerOn set to false');
            // });
        }
        chrome.tabs.sendMessage(
            tabs[0].id,
            {
                message: messageObj.message,
                action: messageObj.action,
                url: tabs[0].url,
            },
            (response) => {
                console.log('foreground response: ', response);
                actionOutputEl.innerText = response.transcript;
            }
        );
    });
}
