console.log('popup.js');

let rulerWidthEl = document.getElementById('input-width');
let saveBtn = document.getElementById('saveBtn');

saveBtn.addEventListener('click', (e) => {
    console.log('save...', e.target);
    setRulerWidth(`${rulerWidthEl.value}`);
});

function setRulerWidth(widthY) {
    console.log(widthY);

    rulerWidthEl.value = widthY;

    // Message event listener
    chrome.runtime.sendMessage(
        {
            message: 'update-popup',
            widthY: widthY,
        },
        (response) => {
            if (response) {
                console.log('Response:', response.message);
                document.querySelector(
                    '#popup'
                ).innerHTML = `<p>${response.message}</p>`;
            }
        }
    );
}

chrome.storage.local.get('widthY', (data) => {
    console.log(data.widthY);
    setRulerWidth(data.widthY);
});
