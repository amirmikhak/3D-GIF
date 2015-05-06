var UIDOMClearButton = function UIDOMClearButton(opts) {

    UIDOMLabelledButton.apply(this, arguments);

    var uiClearButton = this;

    var __defaultOptions = {
        label: 'Clear',
    };

    var __parentDefaultOptions = this.getDefaultOptions();
    var _parentOptionKeys = Object.keys(__parentDefaultOptions);
    for (var i = 0, numOpts = _parentOptionKeys.length; i < numOpts; i++) {
        __defaultOptions[_parentOptionKeys[i]] = (_parentOptionKeys[i] in __defaultOptions) ?
            __defaultOptions[_parentOptionKeys[i]] :
            __parentDefaultOptions[_parentOptionKeys[i]];
    }

    var _opts = opts || {};
    var _options = {};
    var _optionKeys = Object.keys(__defaultOptions);
    for (var i = 0, numOpts = _optionKeys.length; i < numOpts; i++) {
        _options[_optionKeys[i]] = (_optionKeys[i] in _opts) ?
            _opts[_optionKeys[i]] :
            __defaultOptions[_optionKeys[i]];
    }

    this.getDefaultOptions = function() {
        return __defaultOptions;
    };

    // init
    applyOptions.call(this, _options);

    return this;

};

UIDOMClearButton.prototype = Object.create(UIDOMLabelledButton.prototype);
UIDOMClearButton.prototype.constructor = UIDOMClearButton;
