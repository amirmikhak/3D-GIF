var getOuterHTML = function(el) {
    var tmpEl = document.createElement('div');
    tmpEl.appendChild(el.cloneNode(false));
    var outerHTML = tmpEl.innerHTML;
    tmpEl = null;
    return outerHTML;
};

var getClosest = function (elem, selector) {
    // http://gomakethings.com/ditching-jquery/

    var firstChar = selector instanceof HTMLElement ? '' : selector.charAt(0);

    // Get closest match
    for ( ; elem && elem !== document; elem = elem.parentNode ) {

        // If "selector" is an element
        if ( firstChar === '' ) {
            if ( elem === selector ) {
                return elem;
            }
        }

        // If selector is a class
        if ( firstChar === '.' ) {
            if ( elem.classList.contains( selector.substr(1) ) ) {
                return elem;
            }
        }

        // If selector is an ID
        if ( firstChar === '#' ) {
            if ( elem.id === selector.substr(1) ) {
                return elem;
            }
        }

        // If selector is a data attribute
        if ( firstChar === '[' ) {
            if ( elem.hasAttribute( selector.substr(1, selector.length - 2) ) ) {
                return elem;
            }
        }

        // If selector is a tag
        if ( elem.tagName.toLowerCase() === selector ) {
            return elem;
        }

    }

    return false;

};
