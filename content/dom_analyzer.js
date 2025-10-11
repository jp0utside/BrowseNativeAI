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

        const allElements = document.querySelectorAll('*');
        const visibleElements = Array.from(allElements).filter(el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent != null;
        });

        console.log(`Analyzing ${visibleElements.length} visible elements...`);

        //Analyze elements
        visibleElements.forEach(el => {
            const style = window.getComputedStyle(el);

            //Font sizes (for elements w/ text) -- with checks for inconsistant trim results
            if(el.textContent && typeof el.textContent.trim === 'function'){
                const trimmedText = el.textContent.trim();
                if (trimmedText && trimmedText.length > 0) {
                    const fontSize = style.fontSize;
                    if (!attributes.fontSizes.has(fontSize)) {
                        attributes.fontSizes.set(fontSize, []);
                    }
                    attributes.fontSizes.get(fontSize).push(el);
            }}

            //Text colors
            const color = style.color;
            if(!attributes.colors.has(color)){
                attributes.colors.set(color, []);
            }
            attributes.colors.get(color).push(el);

            //Background Colors (non-transparent)
            const bgColor = style.backgroundColor;
            if(bgColor && bgColor !== 'rgba(0,0,0,0)' && bgColor !== 'transparent'){
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
                if(!attributes.margins.get(margin)){
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

    mapToArray(map) {
        const array = [];
        map.forEach((elements, value) => {
            array.push({
                value: value,
                count: elements.length,

                //Store element identifiers for page highlighting
                elementIds: elements.map((el, idx) => { 
                    const id = `browse-native-element-${Date.now()}-${idx}`;
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