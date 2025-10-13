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
        document.querySelectorAll('[data-browse-native-original-font-size]').forEach(el => {
            el.style.fontSize = '';
            el.removeAttribute('data-browse-native-min-text');
            el.removeAttribute('data-browse-native-original-font-size');
        });
        
        document.querySelectorAll('[data-browse-native-original-width]').forEach(el => {
            el.style.minWidth = '';
            el.style.minHeight = '';
            el.removeAttribute('data-browse-native-min-button');
            el.removeAttribute('data-browse-native-original-width');
            el.removeAttribute('data-browse-native-original-height');
            el.removeAttribute('data-browse-native-original-min-width');
            el.removeAttribute('data-browse-native-original-min-height');
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
    
    applyMinTextSize(minSize, originalMinSize) {
        console.log(`Applying minimum text size: ${minSize}px (original min: ${originalMinSize}px)`);
        
        // Find all text elements
        const textElements = document.querySelectorAll('p, span, div, li, td, th, a, button, label, h1, h2, h3, h4, h5, h6');
        
        textElements.forEach(el => {
            // Skip if empty
            const hasText = Array.from(el.childNodes).some(
                node => node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0
            );
            
            if (!hasText) return;
            
            // Store original value if not already stored
            if (!el.hasAttribute('data-browse-native-original-font-size')) {
                const style = window.getComputedStyle(el);
                const originalSize = parseFloat(style.fontSize);
                el.setAttribute('data-browse-native-original-font-size', originalSize);
            }
            
            const originalSize = parseFloat(el.getAttribute('data-browse-native-original-font-size'));
            
            // Apply or restore based on threshold
            if (originalSize < minSize) {
                el.style.fontSize = `${minSize}px`;
                el.setAttribute('data-browse-native-min-text', 'true');
            } else if (originalSize >= minSize && el.hasAttribute('data-browse-native-min-text')) {
                // Restore original value if threshold moved up past it
                el.style.fontSize = `${originalSize}px`;
                el.removeAttribute('data-browse-native-min-text');
            }
        });
    }
    
    applyMinButtonSize(minSize, originalMinSize) {
        console.log(`Applying minimum button size: ${minSize}px (original min: ${originalMinSize}px)`);
        
        // Find all interactive elements
        const interactiveElements = document.querySelectorAll('button, a, input[type="button"], input[type="submit"], input[type="checkbox"], input[type="radio"], select, [role="button"]');
        
        interactiveElements.forEach(el => {
            // Store original dimensions if not already stored
            if (!el.hasAttribute('data-browse-native-original-width')) {
                const rect = el.getBoundingClientRect();
                const style = window.getComputedStyle(el);
                el.setAttribute('data-browse-native-original-width', rect.width);
                el.setAttribute('data-browse-native-original-height', rect.height);
                el.setAttribute('data-browse-native-original-min-width', style.minWidth);
                el.setAttribute('data-browse-native-original-min-height', style.minHeight);
            }
            
            const originalWidth = parseFloat(el.getAttribute('data-browse-native-original-width'));
            const originalHeight = parseFloat(el.getAttribute('data-browse-native-original-height'));
            const smallestDimension = Math.min(originalWidth, originalHeight);
            
            // Apply or restore based on threshold
            if (smallestDimension < minSize) {
                el.style.minWidth = `${minSize}px`;
                el.style.minHeight = `${minSize}px`;
                el.setAttribute('data-browse-native-min-button', 'true');
            } else if (smallestDimension >= minSize && el.hasAttribute('data-browse-native-min-button')) {
                // Restore original values if threshold moved up past it
                const origMinWidth = el.getAttribute('data-browse-native-original-min-width');
                const origMinHeight = el.getAttribute('data-browse-native-original-min-height');
                el.style.minWidth = origMinWidth === 'auto' || origMinWidth === '0px' ? '' : origMinWidth;
                el.style.minHeight = origMinHeight === 'auto' || origMinHeight === '0px' ? '' : origMinHeight;
                el.removeAttribute('data-browse-native-min-button');
            }
        });
    }
    
    applyTextContrast(contrastLevel) {
        console.log(`Applying text contrast level: ${contrastLevel}`);
        
        // Map level to boost: 0=Normal (0%), 1=High (50%), 2=Very High (100%)
        const boostMap = [0, 50, 100];
        const boost = boostMap[contrastLevel] || 0;
        
        if (boost === 0) {
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
                const contrastBoost = 1 + (boost / 100);
                el.style.filter = `contrast(${contrastBoost})`;
                el.setAttribute('data-browse-native-contrast', 'true');
            }
        });
    }
    
    applySpacing(spacingLevel) {
        console.log(`Applying spacing level: ${spacingLevel}`);
        
        // Map level to multiplier: 0=Normal (1.0x), 1=Spacious (1.5x), 2=Very Spacious (2.0x)
        const multiplierMap = [1.0, 1.5, 2.0];
        const multiplier = multiplierMap[spacingLevel] || 1.0;
        
        if (multiplier === 1.0) {
            // Reset spacing
            document.querySelectorAll('[data-browse-native-spacing]').forEach(el => {
                const origMarginTop = el.getAttribute('data-browse-native-original-margin-top');
                const origMarginBottom = el.getAttribute('data-browse-native-original-margin-bottom');
                const origPaddingTop = el.getAttribute('data-browse-native-original-padding-top');
                const origPaddingBottom = el.getAttribute('data-browse-native-original-padding-bottom');
                
                el.style.marginTop = origMarginTop === '0' ? '' : (origMarginTop + 'px');
                el.style.marginBottom = origMarginBottom === '0' ? '' : (origMarginBottom + 'px');
                el.style.paddingTop = origPaddingTop === '0' ? '' : (origPaddingTop + 'px');
                el.style.paddingBottom = origPaddingBottom === '0' ? '' : (origPaddingBottom + 'px');
                
                el.removeAttribute('data-browse-native-spacing');
                el.removeAttribute('data-browse-native-original-margin-top');
                el.removeAttribute('data-browse-native-original-margin-bottom');
                el.removeAttribute('data-browse-native-original-padding-top');
                el.removeAttribute('data-browse-native-original-padding-bottom');
            });
            return;
        }
        
        // Apply spacing to block elements
        const blockElements = document.querySelectorAll('p, div, section, article, header, footer, nav, ul, ol, li, h1, h2, h3, h4, h5, h6');
        
        blockElements.forEach(el => {
            // Store original values if not already stored
            if (!el.hasAttribute('data-browse-native-original-margin-top')) {
                const style = window.getComputedStyle(el);
                el.setAttribute('data-browse-native-original-margin-top', parseFloat(style.marginTop) || 0);
                el.setAttribute('data-browse-native-original-margin-bottom', parseFloat(style.marginBottom) || 0);
                el.setAttribute('data-browse-native-original-padding-top', parseFloat(style.paddingTop) || 0);
                el.setAttribute('data-browse-native-original-padding-bottom', parseFloat(style.paddingBottom) || 0);
            }
            
            const origMarginTop = parseFloat(el.getAttribute('data-browse-native-original-margin-top'));
            const origMarginBottom = parseFloat(el.getAttribute('data-browse-native-original-margin-bottom'));
            const origPaddingTop = parseFloat(el.getAttribute('data-browse-native-original-padding-top'));
            const origPaddingBottom = parseFloat(el.getAttribute('data-browse-native-original-padding-bottom'));
            
            if (origMarginTop > 0) {
                el.style.marginTop = `${origMarginTop * multiplier}px`;
            }
            if (origMarginBottom > 0) {
                el.style.marginBottom = `${origMarginBottom * multiplier}px`;
            }
            if (origPaddingTop > 0) {
                el.style.paddingTop = `${origPaddingTop * multiplier}px`;
            }
            if (origPaddingBottom > 0) {
                el.style.paddingBottom = `${origPaddingBottom * multiplier}px`;
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