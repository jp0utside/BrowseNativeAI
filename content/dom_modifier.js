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
        
        // Reset basic control modifications
        document.querySelectorAll('[data-browse-native-min-text]').forEach(el => {
            el.style.fontSize = '';
            el.removeAttribute('data-browse-native-min-text');
        });
        
        document.querySelectorAll('[data-browse-native-min-button]').forEach(el => {
            el.style.minWidth = '';
            el.style.minHeight = '';
            el.removeAttribute('data-browse-native-min-button');
        });
        
        document.querySelectorAll('[data-browse-native-contrast]').forEach(el => {
            el.style.filter = '';
            el.removeAttribute('data-browse-native-contrast');
        });
        
        document.querySelectorAll('[data-browse-native-spacing]').forEach(el => {
            el.style.marginTop = '';
            el.style.marginBottom = '';
            el.style.paddingTop = '';
            el.style.paddingBottom = '';
            el.removeAttribute('data-browse-native-spacing');
        });
        
        this.clearHighlights();
    }
    
    // === Basic Control Methods ===
    
    applyMinTextSize(minSize) {
        console.log(`Applying minimum text size: ${minSize}px`);
        
        // Find all text elements
        const textElements = document.querySelectorAll('p, span, div, li, td, th, a, button, label, h1, h2, h3, h4, h5, h6');
        
        textElements.forEach(el => {
            // Skip if empty
            const hasText = Array.from(el.childNodes).some(
                node => node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0
            );
            
            if (!hasText) return;
            
            const style = window.getComputedStyle(el);
            const currentSize = parseFloat(style.fontSize);
            
            if (currentSize < minSize) {
                el.style.fontSize = `${minSize}px`;
                el.setAttribute('data-browse-native-min-text', 'true');
            }
        });
    }
    
    applyMinButtonSize(minSize) {
        console.log(`Applying minimum button size: ${minSize}px`);
        
        // Find all interactive elements
        const interactiveElements = document.querySelectorAll('button, a, input[type="button"], input[type="submit"], input[type="checkbox"], input[type="radio"], select, [role="button"]');
        
        interactiveElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            
            if (rect.width < minSize || rect.height < minSize) {
                el.style.minWidth = `${minSize}px`;
                el.style.minHeight = `${minSize}px`;
                el.setAttribute('data-browse-native-min-button', 'true');
            }
        });
    }
    
    applyTextContrast(contrastLevel) {
        console.log(`Applying text contrast: ${contrastLevel}%`);
        
        if (contrastLevel === 0) {
            // Reset contrast
            document.querySelectorAll('[data-browse-native-contrast]').forEach(el => {
                el.style.filter = '';
                el.removeAttribute('data-browse-native-contrast');
            });
            return;
        }
        
        // Apply contrast to all text elements
        const textElements = document.querySelectorAll('p, span, div, li, td, th, a, button, label, h1, h2, h3, h4, h5, h6');
        
        textElements.forEach(el => {
            const hasText = Array.from(el.childNodes).some(
                node => node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0
            );
            
            if (!hasText) return;
            
            const style = window.getComputedStyle(el);
            const textColor = style.color;
            const bgColor = this.getEffectiveBackgroundColor(el);
            
            // Calculate contrast and adjust if needed
            const contrast = this.calculateContrast(textColor, bgColor);
            
            if (contrast < 4.5) {
                // Increase contrast by making text darker or lighter
                const contrastBoost = 1 + (contrastLevel / 100);
                el.style.filter = `contrast(${contrastBoost})`;
                el.setAttribute('data-browse-native-contrast', 'true');
            }
        });
    }
    
    applySpacing(spacingLevel) {
        console.log(`Applying spacing: ${spacingLevel}%`);
        
        if (spacingLevel === 0) {
            // Reset spacing
            document.querySelectorAll('[data-browse-native-spacing]').forEach(el => {
                el.style.marginTop = '';
                el.style.marginBottom = '';
                el.style.paddingTop = '';
                el.style.paddingBottom = '';
                el.removeAttribute('data-browse-native-spacing');
            });
            return;
        }
        
        // Apply spacing to block elements
        const blockElements = document.querySelectorAll('p, div, section, article, header, footer, nav, ul, ol, li, h1, h2, h3, h4, h5, h6');
        
        const multiplier = 1 + (spacingLevel / 100);
        
        blockElements.forEach(el => {
            const style = window.getComputedStyle(el);
            const currentMarginTop = parseFloat(style.marginTop);
            const currentMarginBottom = parseFloat(style.marginBottom);
            const currentPaddingTop = parseFloat(style.paddingTop);
            const currentPaddingBottom = parseFloat(style.paddingBottom);
            
            if (currentMarginTop > 0) {
                el.style.marginTop = `${currentMarginTop * multiplier}px`;
            }
            if (currentMarginBottom > 0) {
                el.style.marginBottom = `${currentMarginBottom * multiplier}px`;
            }
            if (currentPaddingTop > 0) {
                el.style.paddingTop = `${currentPaddingTop * multiplier}px`;
            }
            if (currentPaddingBottom > 0) {
                el.style.paddingBottom = `${currentPaddingBottom * multiplier}px`;
            }
            
            el.setAttribute('data-browse-native-spacing', 'true');
        });
    }
    
    // Helper to get effective background color
    getEffectiveBackgroundColor(element) {
        let el = element;
        while (el) {
            const style = window.getComputedStyle(el);
            const bgColor = style.backgroundColor;
            
            if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                return bgColor;
            }
            
            el = el.parentElement;
        }
        return 'rgb(255, 255, 255)'; // Default to white
    }
    
    // Calculate contrast ratio between two colors
    calculateContrast(color1, color2) {
        const getLuminance = (color) => {
            const rgb = color.match(/\d+/g);
            if (!rgb || rgb.length < 3) return 0;
            
            const [r, g, b] = rgb.map(v => {
                v = parseInt(v) / 255;
                return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
            });
            
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        
        const lum1 = getLuminance(color1);
        const lum2 = getLuminance(color2);
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);
        
        return (brightest + 0.05) / (darkest + 0.05);
    }
}