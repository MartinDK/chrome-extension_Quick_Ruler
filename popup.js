console.log('popup.js....');

let rulerHeightEl = document.getElementById('input-height');
let saveBtnEl = document.getElementById('saveBtn');
let getTranscriptEl = document.getElementById('getTranscript');
let transcriptEl = document.getElementById('transcript');
let rulerStateEl = document.getElementById('rulerState');

transcriptEl.innerText = 'empty';

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
        console.log('message.action: false ->', rulerOn);
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

getTranscriptEl.addEventListener('click', (e) => {
    // console.log('save...', e.target);
    // console.log('Msg...', e);

    messageForeground({ message: 'get transcript' });
});

chrome.storage.local.get('rulerHeight', (data) => {
    // console.log(data.rulerHeight);
    rulerHeightEl.value = `${data.rulerHeight}`;
    setRulerHeight(data.rulerHeight);
});

chrome.runtime.sendMessage(
    {
        message: 'popup-open',
    },
    (response) => {
        console.log('popup received response');
        if (response) {
            console.log('Response:', response);
        }
    }
);

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
                transcriptEl.innerText = response.transcript;
            }
        );
    });
}
