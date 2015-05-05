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

JsStyleSheet.prototype.insertRule = function(_selector, _props, _index) {
    if (!_selector || (typeof _selector !== 'string'))
    {
        return;
    }

    function __propsToString(rules) {
        var frags = [];
        var keys = Object.keys(rules);
        for (var i = 0, numKeys = keys.length; i < numKeys; i++)
        {
            frags.push(keys[i] + ':' + rules[keys[i]] + ';');
        }
        return frags.join('');
    }

    var _prefix = _selector.charAt(0);
    var _selSansPrefix = _prefix === '&' ? _selector.substring(1) : _selector;
    var selector = _selSansPrefix;
    if (this._guid.length)
    {
        var guidSelectorPrefix = '.' + this._guid + (_prefix === '&' ? '' : ' ');
        selector = guidSelectorPrefix + selector;
    }
    var propsStr = _props && (typeof _props === 'object') ? __propsToString(_props) : _props;
    var rulesStr = selector + ' {' + propsStr + '}';
    console.log('JSS rule:', rulesStr);
    this.css.insertRule(rulesStr, _index);

    return this;
};

JsStyleSheet.prototype.destroy = function() {
    document.head.removeChild(this._styleEl);
};
