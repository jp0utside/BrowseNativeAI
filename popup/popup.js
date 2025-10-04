checkAPIKey();

async function checkAPIKey(){
    const result = await chrome.storage.local.get('anthropic_api_key');
    if (result.anthropic_api_key) {
        document.getElementById('api-status').textContent = 'API Key Saved';
        document.getElementById('api-status').style.color = 'green';
    } else {
        document.getElementById('api-status').textContent = 'No API Key - Will Use Simple Mode';
        document.getElementById('api-status').style.color = 'orange';
    }
}

document.getElementById('save-api-key').addEventListener('click', async () => {
    const key = document.getElementById('api-key-input').value.trim();

    if (key) {
        await chrome.storage.local.set({ 'anthropic_api_key': key });
        document.getElementById('api-status').textContent = 'API Key Saved';
        document.getElementById('api-status').style.color = 'green';
        document.getElementById('api-key-input').value = '';
    }
})

// Basic button handling
document.getElementById('large-text').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true});

    document.getElementById('status').textContent = 'Applying...';

    chrome.tabs.sendMessage(tab.id, {
        action: 'applyPreset',
        preset: 'large-text'
    })

    setTimeout(() => {
        document.getElementById('status').textContent = 'Applied Large Text Mode!';
    }, 500);
});

document.getElementById('reset').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true});

    chrome.tabs.sendMessage(tab.id, {
        action: 'reset'
    })

    document.getElementById('status').textContent = 'Reset!';
});