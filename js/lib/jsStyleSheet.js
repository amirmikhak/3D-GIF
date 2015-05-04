// adapted from http://davidwalsh.name/add-rules-stylesheets
var JsStyleSheet = function JsStyleSheet(guid) {
    this._guid = guid || '';
    this._styleEl = document.createElement("style");
    this._styleEl.appendChild(document.createTextNode("")); // WebKit hack :(
    this._styleEl.classList.add(this._guid);
    document.head.appendChild(this._styleEl);
    this.css = this._styleEl.sheet;
    return this;
};

JsStyleSheet.prototype.insertRule = function(_selector, _rules, _index) {
    if (!_selector || (typeof _selector !== 'string'))
    {
        return;
    }

    function __rulesToString(rules) {
        var frags = [];
        var keys = Object.keys(rules);
        for (var i = 0, numKeys = keys.length; i < numKeys; i++)
        {
            frags.push(`${keys[i]}:${rules[keys[i]]};`);
        }
        return frags.join('');
    }

    var selector = (this._guid.length && (_selector.indexOf(' ') === -1) ? `.${this._guid} ` : '') + _selector;
    if (_selector.indexOf(' ') !== -1)
    {
        console.warn('Cannot (yet) apply GUID-specific selector for selectors with nested rules.');
    }
    var rulesStr = _rules && (typeof _rules === 'object') ? __rulesToString(_rules) : _rules;
    this.css.insertRule(`${selector} {${rulesStr}}`, _index);
};

JsStyleSheet.prototype.destroy = function() {
    document.head.removeChild(this._styleEl);
};
