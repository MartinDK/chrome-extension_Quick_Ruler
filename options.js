console.log('options.js');

document.getElementById('color').addEventListener('click', (e) => {
    chrome.runtime.sendMessage(
        {
            message: 'update-options',
            options: e.target.value,
        },
        (response) => {
            if (response) {
                console.log('Options Message Recieved:', response);
                e.target.checked
                    ? updateOptions('green')
                    : updateOptions('red');
            }
        }
    );
});

// Message event listener
chrome.runtime.sendMessage(
    {
        message: 'options.js',
    },
    (response) => {
        if (response) {
            document.querySelector(
                '#message'
            ).innerHTML = `<h1>Message:${response.message}</h1>`;
            document.querySelector(
                '#install'
            ).innerHTML = `<h4>Message:${response.install}</h4>`;
        }
    }
);

// Get 'options' data from local storage
chrome.storage.local.get('options', (data) => {
    updateOptions(data.options);
    console.log(data);
});

function updateOptions(options) {
    document.querySelector('#options').innerHTML = `${options}`;
    document.querySelector('#color').value = options;
}
