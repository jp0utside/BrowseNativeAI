console.log('===== BrowseNativeAI Content Script Loaded =====');

//Create DOM classes
const domAnalyzer = new DOMAnalyzer();
const domModifier = new DOMModifier();

//Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
        console.log('Message received: ', request);

        if (request.action == 'scanPage') {
            //Get scan from analyzer
            showLoadingIndicator('Scanning page...');

            const attributes = domAnalyzer.scanPageAttributes();
            
            sendResponse({ attributes: attributes });
            return true;
        } else if (request.action == 'highlightElement') {
            //Highlight with modifier
            domModifier.highlightElements(request.elementIds);
            sendResponse({ success: true });
            return true;
        } else if (request.action == 'clearHighlights') {
            //Clear with modifier
            domModifier.clearHighlights();
            sendResponse({ success: true });
            return true;
        } else if (request.action == 'applyChange') {
            //Change with modifier
            domModifier.applyAttributeChange(
                request.attributeType,
                request.oldValue,
                request.newValue,
                request.elementIds
            );

            sendResponse({ success: true });
            return true;
        } else if (request.action == 'reset') {
            //Reset with modifier
            domModifier.resetAllChanges();
            showSuccess('All changes reset!');
            sendResponse({ success: true });
            return true;
        }

    } catch (error) {
        console.log('Error in message handler: ', error);
        showError('Error' + error.message);
        sendResponse({ error: error.message });
        return true;
    }
});


// ====== Notification Methods ======
// Methods for managing notifications on screen

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