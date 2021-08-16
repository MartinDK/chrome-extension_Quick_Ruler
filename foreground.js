// This script is injected into the page using a tab events listener
console.log('foreground.js');

let rulerEl = document.createElement('div');
let rulerTxt = document.createElement('p');
let pageEl = document.querySelector('html');

rulerEl.id = 'quick-ruler';

rulerEl.appendChild(rulerTxt);
pageEl.appendChild(rulerEl);

// Track mouse
window.addEventListener('mouseup', handleMouseDown, false);

function handleMouseDown(e) {
    rulerEl.style.top = `${e.clientY}px`;
}
function setRulerWidths(widthY) {
    console.log('Setting ruler width', widthY);
    rulerEl.style.height = `${widthY}px`;
    rulerTxt.innerText = `${widthY}px`;
}

chrome.storage.local.get('widthY', (data) => {
    setRulerWidths(data.widthY);
});

chrome.storage.onChanged.addListener(function (changes, namespace) {
    console.log('chaniging widthY', changes.widthY.newValue);
    setRulerWidths(changes.widthY.newValue);
});
