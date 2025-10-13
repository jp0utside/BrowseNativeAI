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

        //Sort by importance score (not just count)
        Object.keys(result).forEach(key => {
            if (result[key] && Array.isArray(result[key])) {
                // Calculate importance score for each attribute group
                result[key].forEach(item => {
                    item.importanceScore = this.calculateImportanceScore(item);
                });
                
                // Sort by importance score (higher is better)
                result[key].sort((a, b) => b.importanceScore - a.importanceScore);
                result[key] = result[key].slice(0, 20); //Limiting to top 20 elements for UI display
            } else {
                result[key] = [];
            }
        });

        // Detect minimum sizes for basic controls
        result.minTextSize = this.detectMinTextSize(elementsToAnalyze);
        result.minButtonSize = this.detectMinButtonSize();

        return result;
    }
    
    detectMinTextSize(elements) {
        let minSize = Infinity;
        
        elements.forEach(el => {
            const hasText = Array.from(el.childNodes).some(
                node => node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0
            );
            
            if (hasText) {
                const style = window.getComputedStyle(el);
                const fontSize = parseFloat(style.fontSize);
                if (fontSize < minSize && fontSize > 0) {
                    minSize = fontSize;
                }
            }
        });
        
        return minSize === Infinity ? 12 : Math.round(minSize);
    }
    
    detectMinButtonSize() {
        const interactiveElements = document.querySelectorAll('button, a, input[type="button"], input[type="submit"], input[type="checkbox"], input[type="radio"], [role="button"]');
        let minSize = Infinity;
        
        interactiveElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const smallestDimension = Math.min(rect.width, rect.height);
            if (smallestDimension < minSize && smallestDimension > 0) {
                minSize = smallestDimension;
            }
        });
        
        return minSize === Infinity ? 24 : Math.round(minSize);
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

    // Calculate importance score for an attribute group
    calculateImportanceScore(attributeGroup) {
        const elements = attributeGroup.elementIds.map(id => 
            document.querySelector(`[data-browse-native-id="${id}"]`)
        ).filter(el => el); // Filter out nulls
        
        if (elements.length === 0) return 0;
        
        let score = 0;
        
        elements.forEach(el => {
            // Base score from element type (semantic elements are more important)
            const tag = el.tagName.toLowerCase();
            const tagScores = {
                'h1': 100, 'h2': 90, 'h3': 80, 'h4': 70, 'h5': 60, 'h6': 50,
                'p': 45, 'button': 85, 'a': 70,
                'article': 60, 'section': 55, 'header': 60, 'footer': 50, 'nav': 65,
                'main': 70, 'aside': 40,
                'li': 35, 'ul': 30, 'ol': 30,
                'span': 25, 'div': 20, 'td': 30, 'th': 40,
                'input': 75, 'label': 40, 'textarea': 70, 'select': 70
            };
            score += tagScores[tag] || 10;
            
            // Bonus for elements with text content (visible to user)
            const hasText = Array.from(el.childNodes).some(
                node => node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0
            );
            if (hasText) {
                score += 30;
            }
            
            // Bonus for larger elements (more visually prominent)
            const rect = el.getBoundingClientRect();
            const area = rect.width * rect.height;
            if (area > 10000) score += 20; // Large elements
            else if (area > 1000) score += 10; // Medium elements
            
            // Bonus for elements in viewport (currently visible)
            if (rect.top >= 0 && rect.top <= window.innerHeight) {
                score += 25;
            }
            
            // Penalty for elements that look like spacers
            const className = el.className || '';
            const isSpacer = /spacer|divider|separator|gap/i.test(className);
            if (isSpacer) {
                score -= 30;
            }
        });
        
        // Average score per element, but also consider total count
        const avgScore = score / elements.length;
        const countBonus = Math.min(elements.length * 2, 50); // Cap count bonus at 50
        
        return avgScore + countBonus;
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