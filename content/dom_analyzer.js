class DOMAnalyzer {
    constructor() {
        this.highlightOverlay = null;
    }

    //Scan page and group elements by css attributes
    scanPageAttributes(){
        const attributes = {
            fontSizes: new Map(),
            colors: new Map(),
            backgrounds: new Map(),
            paddings: new Map(),
            margins: new Map()
        };

        // Exclude elements that don't need styling analysis
        const excludeSelectors = 'script, style, noscript, meta, link, head, [data-browse-native-id]';
        const allElements = document.querySelectorAll('body *');
        
        // More efficient visibility check - avoid getComputedStyle when possible
        const visibleElements = Array.from(allElements).filter(el => {
            // Skip excluded elements
            if (el.matches(excludeSelectors)) return false;
            
            // Quick check first (doesn't trigger style calculation)
            if (!el.offsetParent && el.tagName !== 'BODY') return false;
            
            return true;
        });

        console.log(`Analyzing ${visibleElements.length} visible elements...`);

        //Analyze elements - sample if too many
        const maxElements = 1000; // Limit to prevent freezing
        const elementsToAnalyze = visibleElements.length > maxElements 
            ? this.sampleElements(visibleElements, maxElements)
            : visibleElements;
        
        console.log(`Processing ${elementsToAnalyze.length} elements (${visibleElements.length} total visible)...`);

        //Analyze elements
        elementsToAnalyze.forEach(el => {
            const style = window.getComputedStyle(el);

            //Font sizes (only for elements with direct text content)
            const hasDirectText = Array.from(el.childNodes).some(
                node => node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0
            );
            
            if(hasDirectText) {
                const fontSize = style.fontSize;
                if (!attributes.fontSizes.has(fontSize)) {
                    attributes.fontSizes.set(fontSize, []);
                }
                attributes.fontSizes.get(fontSize).push(el);
            }

            //Text colors (only if element has text)
            if (hasDirectText) {
                const color = style.color;
                if(!attributes.colors.has(color)){
                    attributes.colors.set(color, []);
                }
                attributes.colors.get(color).push(el);
            }

            //Background Colors (non-transparent)
            const bgColor = style.backgroundColor;
            if(bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent'){
                if(!attributes.backgrounds.has(bgColor)){
                    attributes.backgrounds.set(bgColor, []);
                }
                attributes.backgrounds.get(bgColor).push(el);
            }

            //Paddings (non-zero)
            const padding = style.padding;
            if(padding && padding !== '0px'){
                if(!attributes.paddings.has(padding)){
                    attributes.paddings.set(padding, []);
                }
                attributes.paddings.get(padding).push(el);
            }

            //Margins (non-zero)
            const margin = style.margin;
            if(margin && margin !== '0px'){
                if(!attributes.margins.has(margin)){
                    attributes.margins.set(margin, []);
                }
                attributes.margins.get(margin).push(el);
            }
        });

        //Convert to array format
        const result = {
            fontSizes: this.mapToArray(attributes.fontSizes),
            colors: this.mapToArray(attributes.colors),
            backgrounds: this.mapToArray(attributes.backgrounds),
            paddings: this.mapToArray(attributes.paddings),
            margins: this.mapToArray(attributes.margins)
        }

        //Sort by element count
        Object.keys(result).forEach(key => {
            if (result[key] && Array.isArray(result[key])) {
                result[key].sort((a, b) => b.count - a.count);
                result[key] = result[key].slice(0, 20); //Limiting to top 20 elements for UI display
            } else {
                result[key] = [];
            }
        });

        return result;
    }

    // Helper to sample elements intelligently
    sampleElements(elements, maxCount) {
        // Prioritize certain element types
        const priority = elements.filter(el => {
            const tag = el.tagName.toLowerCase();
            return ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'button', 'a', 'span', 'div', 'section', 'article', 'header', 'footer', 'nav'].includes(tag);
        });
        
        if (priority.length <= maxCount) {
            return priority;
        }
        
        // If still too many, sample evenly
        const step = Math.floor(priority.length / maxCount);
        return priority.filter((_, i) => i % step === 0).slice(0, maxCount);
    }

    mapToArray(map) {
        const array = [];
        map.forEach((elements, value) => {
            array.push({
                value: value,
                count: elements.length,

                //Store element identifiers for page highlighting
                elementIds: elements.map((el, idx) => { 
                    const id = `browse-native-element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${idx}`;
                    el.setAttribute('data-browse-native-id', id);
                    return id;
                })
            });
        });
        return array;
    }

    //Helper method for getting page info
    analyzePage() {
        return {
            domain: this.extractDomain(window.location.hostname),
            url: window.location.href,
            title: document.title,
            textInfo: this.analyzeText(),
            colorScheme: this.getColorScheme(),
            pageType: this.pageType()
        };
    }

    extractDomain(hostname) {
        const parts = hostname.split('.');
        return parts.slice(-2).join('.');
    }

    analyzeText() {
        const body = document.body;
        const bodyStyle = window.getComputedStyle(body);

        //Get sample heading
        const h1 = document.querySelector('h1');
        const h1Style = h1 ? window.getComputedStyle(h1) : null;

        //Get sample paragraph
        const p = document.querySelector('p');
        const pStyle = p ? window.getComputedStyle(p) : null;

        return {
            bodyFontSize: bodyStyle.fontSize,
            bodyColor: bodyStyle.color,
            h1FontSize: h1Style ? h1Style.fontSize : null,
            pFontSize: pStyle ? pStyle.fontSize: null,
            pLineHeight: pStyle ? pStyle.lineHeight: null
        };
    }

    getColorScheme() {
        const bodyStyle = window.getComputedStyle(document.body);
        const bgColor = bodyStyle.backgroundColor;

        return {
            backgroundColor: bgColor,
            textColor: bodyStyle.color,
            isDark: this.isDarkBackground(bgColor)
        };
    }

    isDarkBackground(bgColor) {
        const rgb = bgColor.match(/\d+/g);
        if (!rgb || rgb.length < 3) {return false; } 

        const [r, g, b] = rgb.map(Number);
        const luminance = (0.299*r + 0.587*g + 0.114*b);

        return luminance < 128;
    }

    guessPageType() {
        const url = window.location.href.toLowerCase();

        if (url.includes('/product/') || url.includes('/item/')) {return 'product'}
        if (url.includes('/article/') || url.includes('/post/')) {return 'article'}
        if (url.includes('/search/')) {return 'search'}

        return 'general';
    }
}