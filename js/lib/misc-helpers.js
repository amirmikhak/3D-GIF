String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

Object.defineProperty(Object.prototype, 'can', {
    enumerable: false,
    value: function(method) {
        return (typeof this[method] === 'function');
    }
});

function applyOptions(newOpts) {
    if (!(newOpts instanceof Object))
    {
        throw 'TypeError: Options must be object';
    }

    var opts = Object.keys(newOpts);
    for (var i = 0, numOpts = opts.length; i < numOpts; i++)
    {
        var key = opts[i];
        if (key in this)
        {
            this[key] = newOpts[key];
        } else
        {
            console.error('Invalid option for ' + this.constructor.name + ': ' + key);
        }
    }

    return this;
}

function sloppyOptionsAreEqual(a, b) {
    // a function for comparing simple and more complex types such as arrays
    return (
          ((a === null) || (b === null)) ||
          ((typeof a === 'undefined') || (typeof b === 'undefined')) ||
          ((typeof a === 'string') && (typeof b === 'string')) ||
          (!isNaN(a) && !isNaN(b))
      ) ?
        a === b :
        ((a instanceof Array) && (b instanceof Array) ?
            a.equals(b) :
            JSON.stringify(a) === JSON.stringify(b));   // we must be comparing objects or something...
}

function fetchJSONFile(path, successCb, failureCb) {
    /**
     * Helper function to make AJAX loading nicer. Grabbed from here: http://stackoverflow.com/questions/14388452/how-do-i-load-a-json-object-from-a-file-with-ajax
     */

    var NOOP = function() {};

    var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function() {
        if (httpRequest.readyState === 4)
        {
            if (httpRequest.status === 200)
            {
                var data = JSON.parse(httpRequest.responseText);

                successCb ? successCb(data) : NOOP();

                return;
            }
        }

        failureCb ? failureCb() : NOOP();
    };
    httpRequest.open('GET', path);
    httpRequest.send();

}

function tryJSON(data, validator) {

    var retData = data;

    if (typeof retData === 'string')
    {
        try
        {   // handle different types of data input: JSON or raw object
            retData = JSON.parse(retData);    // throws SyntaxError if not valid JSON string
        } catch (err)
        {   // pass
        }
    }

    if (!validator(retData))
    {
        console.trace();
        console.group('Malformed data');
        console.error('data', data);
        console.error('retData', retData);
        console.error('validator', validator);
        console.groupEnd();
        throw 'Malformed data';
    }

    return retData;

}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes
if (![].includes) {
  Array.prototype.includes = function(searchElement) {
    'use strict';
    var O = Object(this);
    var len = parseInt(O.length) || 0;
    if (len === 0) {
      return false;
    }
    var n = parseInt(arguments[1]) || 0;
    var k;
    if (n >= 0) {
      k = n;
    } else {
      k = len + n;
      if (k < 0) {k = 0;}
    }
    var currentElement;
    while (k < len) {
      currentElement = O[k];
      if (searchElement === currentElement ||
         (searchElement !== searchElement && currentElement !== currentElement)) {
        return true;
      }
      k++;
    }
    return false;
  };
}

// http://stackoverflow.com/questions/7837456/comparing-two-arrays-in-javascript
Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time
    if (this.length != array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;
        }
        else if (this[i] != array[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
}