console.log('===== BrowseNativeAI Content Script Loaded =====');

//Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
        console.log('Message received: ', request);
        if (request.action == 'applyPreset') {
            console.log('Applying Preset: ', request.preset);
            applyPreset(request.preset);
        } else if (request.action == 'reset') {
            resetStyles();
        }
    } catch (error) {
        console.log('Error in message handler: ', error);
    }
});

async function applyPreset(preset) {
    try {
        //Show loading indicator
        showLoadingIndicator('Analyzing page with AI...');

        //Analyze the page
        const analyzer = new DOMAnalyzer();
        const pageAnalysis = analyzer.analyzePage();

        console.log('Page analysis: ', pageAnalysis);

        //Send to background script for AI processing
        const response = await chrome.runtime.sendMessage({
            action: 'generateModifications',
            pageAnalysis: pageAnalysis,
            preset: preset
        });

        console.log('Received modifications: ', response);

        if (response.error) {
            showError('Error: ' + response.error);
            return
        }

        //Apply the CSS changes
        applyCSS(response.modifications.css);

        //Update loading indicator
        if (response.fromCache) {
            showSuccess('Applied (from cache)');
        } else if (response.isSimple) {
            showSuccess('Applied (simple mode)');
        } else {
            showSuccess('Applied (with AI)');
        }
    } catch (error) {
        console.error('Error applying preset: ', error);
        showError('Something went wrong');
    }
}

function applyCSS(css) {
    const styleID = 'browse-native-ai-styles';
    let styleElement = document.getElementById(styleID);

    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleID;
        document.head.appendChild(styleElement);
    }

    styleElement.textContent = css;
    console.log('CSS applied');
}

function resetStyles() {
    const styleElement = document.getElementById('browse-native-ai-styles');
    if (styleElement) {
        styleElement.remove();
        showSuccess('Style reset');
    }
}

function showLoadingIndicator(message) {
    let overlay = document.getElementById('browse-native-ai-overlay');

    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'browse-native-ai-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 999999;
            font-family: system-ui, sans-serif;
            font-size: 14px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        `;
        document.body.appendChild(overlay);
    }

    overlay.textContent = message;
    overlay.style.background = 'rgba(0, 0, 0, 0.9)';
}

function showSuccess(message) {
    const overlay = document.getElementById('browse-native-ai-overlay');
    if (overlay) {
        overlay.textContent = message;
        overlay.style.background = 'rgba(76, 175, 80, 0.9)';
        setTimeout(() => overlay.remove(), 3000);
    }
}

function showError(message) {
    const overlay = document.getElementById('browse-native-ai-overlay');
    if (overlay) {
        overlay.textContent = message;
        overlay.style.background = 'rgba(244, 67, 54, 0.9)';
        setTimeout(() => overlay.remove(), 4000);
    }
}