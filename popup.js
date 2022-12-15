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

(async () => {
    chrome.runtime.sendMessage({ message: 'popup-open' }, (response) => {
        // do something with response here, not outside the function
        console.log('response ->', response);
    });

    chrome.storage.onChanged.addListener((response) => {
        console.log('storage.onChanged response -->', response);

        if (response.url) {
            console.log('response.url ->', response.url);
        } else {
            response.url = false;
            response.url.newValue = false;

            console.log('--', response.url);
        }

        if (response.url.newValue) {
            let urlFixed = new URL('/', response.url.newValue);
            console.log('url: true ->', urlFixed);
            actionNameEl.innerText = urlFixed.host;
        } else {
            console.log('response.url.newValue: false ->', response);
        }
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
    // Send message to 'tab' i.e foreground.js
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        // console.log('currentWindow', tabs);

        chrome.storage.session.set({ rulerOn: messageObj.action }).then(() => {
            console.log('rulerOn set to ', messageObj.action);
        });

        chrome.tabs.sendMessage(
            tabs[0].id,
            {
                message: messageObj.message,
                action: messageObj.action,
                url: tabs[0].url,
            },
            (response) => {
                console.log('foreground response: ', response);
                if (response) actionOutputEl.innerText = response.transcript;
            }
        );
    });
}
