// Basic button handling
document.getElementById('large-text').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true});

    chrome.tabs.sendMessage(tab.id, {
        action: 'applyPreset',
        preset: 'large-text'
    })

    document.getElementById('status').textContent = "Applied Large Text Mode!";
});

document.getElementById('reset').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true});

    chrome.tabs.sendMessage(tab.id, {
        action: 'reset'
    })

    document.getElementById('status').textContent = "Reset!";
});