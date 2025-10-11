class DOMModifier {
    constructor() {
        this.highlightOverlays = [];
    }

    //Apply changes to specific attributes
    applyAttributeChange(attributeType, oldValue, newValue, elementIds) {
        console.log(`Changing ${attributeType} from ${oldValue} to ${newValue} for ${elementIds.length} elements`);

        elementIds.forEach(id => {
            const element = document.querySelector(`[data-browse-native-id="${id}"]`);

            if (element) {
                switch(attributeType) {
                    case 'fontSize':
                        element.style.fontSize = newValue;
                        break;
                    case 'color':
                        element.style.color = newValue;
                        break;
                    case 'backgroundColor':
                        element.style.backgroundColor = newValue;
                        break;
                    case 'padding':
                        element.style.padding = newValue;
                        break;
                    case 'margin':
                        element.style.margin = newValue;
                        break;
                }
            }
        });
    }

    //Highlight relevant elements on hover
    highlightElements(elementIds) {
        //Remove existing highlights
        this.clearHighlights()

        if(!elementIds || elementIds.length === 0) return;

        //Create overlay for each element
        elementIds.forEach(id => {
            const element = document.querySelector(`[data-browse-native-id="${id}"]`);
            if (element) {
                const rect = element.getBoundingClientRect();
                const overlay = document.createElement('div');
                overlay.className = 'browse-native-highlight-overlay';
                overlay.style.cssText = `
                    position: fixed;
                    top: ${rect.top}px;
                    left: ${rect.left}px;
                    width: ${rect.width}px;
                    height: ${rect.height}px;
                    background: rgba(66, 133, 244, 0.3);
                    border: 2px solid rgb(66, 133, 244);
                    pointer-events: none;
                    z-index: 999998;
                    box-sizing: border-box;
                `;
                document.body.appendChild(overlay);
                this.highlightOverlays.push(overlay);
            }
        });
    }

    //Clear existing highlights from page
    clearHighlights() {
        this.highlightOverlays.forEach(overlay => overlay.remove());
        this.highlightOverlays = [];
    }

    //Reset all modifications
    resetAllChanges() {
        document.querySelectorAll('[data-browse-native-id]').forEach(el => {
            el.style.fontSize = '';
            el.style.color = '';
            el.style.backgroundColor = '';
            el.style.padding = '';
            el.style.margin = '';
            el.removeAttribute('data-browse-native-id');
        });
        this.clearHighlights();
    }
}