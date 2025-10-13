console.log('===== BrowseNativeAI Content Script Loaded =====');

//Create DOM classes
const domAnalyzer = new DOMAnalyzer();
const domModifier = new DOMModifier();

//Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
        console.log('Message received: ', request);

        if (request.action == 'scanPage') {
            //Get scan from analyzer (async to prevent blocking)
            showLoadingIndicator('Scanning page...');

            // Use setTimeout to allow UI to update and prevent blocking
            setTimeout(() => {
                try {
                    const attributes = domAnalyzer.scanPageAttributes();
                    
                    showSuccess('Scan complete!');
                    sendResponse({ attributes: attributes });
                } catch (error) {
                    console.error('Error during scan:', error);
                    showError('Scan failed: ' + error.message);
                    sendResponse({ error: error.message });
                }
            }, 100);
            
            return true; // Keep message channel open for async response
        } else if (request.action == 'highlightElements') {
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
        } else if (request.action == 'applyMinTextSize') {
            domModifier.applyMinTextSize(request.value, request.minValue);
            sendResponse({ success: true });
            return true;
        } else if (request.action == 'applyMinButtonSize') {
            domModifier.applyMinButtonSize(request.value, request.minValue);
            sendResponse({ success: true });
            return true;
        } else if (request.action == 'applyTextContrast') {
            domModifier.applyTextContrast(request.value);
            sendResponse({ success: true });
            return true;
        } else if (request.action == 'applySpacing') {
            domModifier.applySpacing(request.value);
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
let notificationTimeout = null;

function showLoadingIndicator(message) {
    // Clear any existing timeout
    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
        notificationTimeout = null;
    }

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
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(overlay);
    }

    overlay.textContent = message;
    overlay.style.background = 'rgba(0, 0, 0, 0.9)';
    overlay.style.opacity = '1';
}

function showSuccess(message) {
    const overlay = document.getElementById('browse-native-ai-overlay');
    if (overlay) {
        overlay.textContent = message;
        overlay.style.background = 'rgba(76, 175, 80, 0.9)';
        
        // Clear any existing timeout
        if (notificationTimeout) {
            clearTimeout(notificationTimeout);
        }
        
        // Fade out and remove
        notificationTimeout = setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.remove();
                }
                notificationTimeout = null;
            }, 300);
        }, 2000);
    }
}

function showError(message) {
    const overlay = document.getElementById('browse-native-ai-overlay');
    if (overlay) {
        overlay.textContent = message;
        overlay.style.background = 'rgba(244, 67, 54, 0.9)';
        
        // Clear any existing timeout
        if (notificationTimeout) {
            clearTimeout(notificationTimeout);
        }
        
        // Fade out and remove
        notificationTimeout = setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.remove();
                }
                notificationTimeout = null;
            }, 300);
        }, 3000);
    }
}