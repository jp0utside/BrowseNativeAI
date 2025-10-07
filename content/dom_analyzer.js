class DOMAnalyzer {
    analyzepage() {
        return {
            domain: this.extractDomain(window.location.hostname),
            url: window.location.href,
            title: document.title,
            textInfo: this.analyzeText(),
            colorScheme: this.getColorScheme(),
            pageType: this.pageType()
        }
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