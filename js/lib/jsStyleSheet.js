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
    if (!_selector ||
        ((typeof _selector !== 'string') && !(_selector instanceof Array)))
    {
        console.error('Invalid Selector: must be either ' +
            '1) a string with a single selector, ' +
            '2) a string of comma-separated selectors, or ' +
            '3) an array of either 1 or 2', _selector);
        throw 'Invalid JSS rule';
    }

    if ((_selector instanceof Array) || (_selector.indexOf(',') !== -1))
    {
        var that = this;
        (_selector instanceof Array ? _selector : _selector.split(',')).forEach(function(sel) {
            that.insertRule(sel, _props, _index);
        });
        return this;
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
    var _selSansPrefix = (_prefix === '&' ? _selector.substring(1) : _selector).trim();
    var selector = _selSansPrefix;
    if (this._guid.length)
    {
        var guidSelectorPrefix = '.' + this._guid + (_prefix === '&' ? '' : ' ');
        selector = guidSelectorPrefix + selector;
    }
    var propsStr = _props && (typeof _props === 'object') ? __propsToString(_props) : _props;
    var rulesStr = selector + ' {' + propsStr + '}';
    console.info('JSS rule:', rulesStr);
    this.css.insertRule(rulesStr, _index);

    return this;
};

JsStyleSheet.prototype.destroy = function() {
    document.head.removeChild(this._styleEl);
};
