chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action == 'applyPreset') {
        console.log('Applying Preset: ', request.preset);
        applyPreset(request.preset);
    } else if (request.action == 'reset') {
        resetStyles();
    }
});

function applyPreset(preset) {
    const styleId = 'BrowseNativeAIStyles';
    let styleElement = document.getElementById(styleId);

    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
    }

    if (preset == 'large-text') {
        styleElement.textContent = `
            body * {
                font-size: 18px !important;
            }
            h1 { font-size: 32px !important; }
            h2 { font-size: 28px !important; }
            h3 { font-size: 24px !important; }
        `;
    }
}

function resetStyles() {
    const styleElement = document.getElementById('BrowseNativeAIStyles');
    if (styleElement) {
        styleElement.remove();
    }
}