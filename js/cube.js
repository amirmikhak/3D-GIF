var Cube = function(size, parentElement, playButton, clearButton, cellOpts) {
    // 'this' can point to many, different things, so we grab an easy reference to the object
    // You can read more about 'this' at:
    // MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this
    // at http://www.quirksmode.org/js/this.html
    // and in a more detailed tutorial: http://javascriptissexy.com/understand-javascripts-this-with-clarity-and-master-it/
    var me = this;

    // DEFINE SOME PROPERTIES
    var defaultPlaybackOptions = {
        delay: 100,
        action: 'slide',
        direction: 'back',
        wrap: false,
    };

    var defaultCellOptions = {
        size: 50,
    };

    var defaultKeyListenerOptions = {
        keys: 'all',                // values: alpha, num, alphanum, all
        letterColor: [0, 0, 255],   // color of letter pixels on generated frame: rgb array
        backgroundColor: [0, 0, 0], // color of non-leter pixels on generated frame: rgb array
        startFace: 'front',         // values: front, back, left, right, bottom, top
        endFace: 'back',            // values: front, back, left, right, bottom, top
        animate: true,              // animate from frontFace to backFace: boolean
        animateRate: 100,           // delay between each playback frame
        stepSize: 1,                // number of steps for each animation
    };

    var playbackOptions = _.extend({}, defaultPlaybackOptions);
    var cellOptions = _.extend({}, defaultCellOptions);
    var keyListenerOptions = _.extend({}, defaultKeyListenerOptions);

    Object.defineProperty(this, 'playbackOptions', {
        get: function() {
            return playbackOptions;
        },
        set: function(newOptions) {
            _.extend(playbackOptions, newOptions);
        }
    });

    Object.defineProperty(this, 'cellOptions', {
        get: function() {
            return cellOptions;
        },
        set: function(newOptions) {
            _.extend(cellOptions, newOptions);
        }
    });


    Object.defineProperty(this, 'keyListenerOptions', {
        get: function() {
            return keyListenerOptions;
        },
        set: function(newOptions) {
            _.extend(keyListenerOptions, newOptions);
        }
    });

    // @amirmikhak
    // Note: there has _got_ to be a "nicer" way to do this. This code feels smelly.
    this.cellOptions = defaultCellOptions;  // copy in the default options
    this.cellOptions = typeof cellOpts !== 'undefined' ? cellOpts : {}; // copy in what the user wanted


    // CONFIGURE FOR ARGUMENTS
    if (!(parentElement instanceof HTMLElement))
    {
        parentElement = document.getElementsByTag('body');
        parentElement = parentElement.length ? parentElement[0] : null;
        if (!parentElement)
        {
            throw Error('No parent element for the cube');
        }
    }

    if (playButton instanceof HTMLElement)
    {
        playButton.addEventListener('click', function(event) {
            me.play();
        });
    }

    if (clearButton instanceof HTMLElement)
    {
        clearButton.addEventListener('click', function(event) {
            me.clear();
        });
    }

    // SET UP REST OF SELF
    this.size = size; // How many rows and columns do I have?

    this.resolution = this.cellOptions.size; // size of our cells in pixels

    var outerDimensions = this.size * this.resolution;

    // The HTML display of the cube istelf
    this.html = document.createElement('div');
    this.html.id = 'cube';

    this.html.style.height = outerDimensions + 'px';
    this.html.style.width = outerDimensions + 'px';
    this.html.style.transformStyle = 'preserve-3d';
    this.html.style.transformOrigin = [
        'calc(' + outerDimensions + 'px/2)',
        'calc(' + outerDimensions + 'px/2)',
        'calc(-1 * ' + outerDimensions + 'px/2)'
    ].join(' ');


    this.cells = [];
    for (var depth = 0; depth < this.size; depth++) {
        // Iterate over each Z-plane
        for (var row = 0; row < this.size; row++) {
            // Iterate over each row
            for (var column = 0; column < this.size; column++) {
                // Iterate over each column

                // Create a cell
                var cell = new Cell(this.resolution);
                cell.depth = depth;
                cell.column = column;
                cell.row = row;

                // Store the cell's coordinates in data attributes
                ['depth', 'column', 'row'].forEach(function(dimension) {
                    var attribute = 'data' + '-' + dimension;
                    cell.html.setAttribute(attribute, cell[dimension]);
                });

                // Manually position the cell in the right location via CSS
                cell.html.style.transform = ['X', 'Y', 'Z'].map(function(direction) {
                    var translation = {
                        'X': me.resolution * cell.column,
                        'Y': me.resolution * cell.row,
                        'Z': -1 * me.resolution * cell.depth
                    };
                    return 'translate' + direction + '(' + translation[direction] + 'px' + ')';
                }).join(' ');

                me.cells.push(cell);
                me.html.appendChild(cell.html); // Actually render the cell
            }
        }
    }

    parentElement.appendChild(this.html); // Actually render the cube

    return this;
};

Cube.prototype.shiftPlane = function(axis, stepSize, wrap) {
    stepSize = typeof stepSize !== 'undefined' ? stepSize : -1;
    wrap = typeof wrap !== 'undefined' ? !!wrap : true;

    var me = this;

    function getNewValueForShift(cell, axis) {
        if ((cell[axis] + stepSize) >= 0 && (cell[axis] + stepSize) < me.size)
        {   // your new coord originated from inside of bounds
            return (cell[axis] + stepSize) % me.size;
        } else
        {   // your new coord originated from outside of bounds
            if (wrap)
            {   // reach around the other side
                return (me.size + cell[axis] + stepSize) % me.size;
            } else
            {   // screw it, your new value is nothing
                return -1;
            }
        }
    };

    function getNewRowForXShift(cell) {
        return getNewValueForShift(cell, 'row');
    }

    function getNewColForYShift(cell) {
        return getNewValueForShift(cell, 'column');
    }

    function getNewDepthForZShift(cell) {
        return getNewValueForShift(cell, 'depth');
    }

    var nextState = me.cells.map(function(cell) {
        // We want to calculate the coordinates of the 'previous' cell along various directions
        var shiftedCoords = {
            'X': [
                getNewRowForXShift(cell),
                cell.column,
                cell.depth,
            ],
            'Y': [
                cell.row,
                getNewColForYShift(cell),
                cell.depth,
            ],
            'Z': [
                cell.row,
                cell.column,
                getNewDepthForZShift(cell),
            ]
        }[axis];

        // Once we have it, grab its on status and color and return it
        return {
            'on': me.getCellAt(shiftedCoords[0], shiftedCoords[1], shiftedCoords[2]).on,
            'color': me.getCellAt(shiftedCoords[0], shiftedCoords[1], shiftedCoords[2]).color
        };
    });

    // Iterate over all the cells and change their on status and color to their 'previous' neighbor's
    me.cells.forEach(function(cell, index) {
        cell.on = false;
        cell.on = nextState[index].on;
        if (cell.on) {
            cell.color = nextState[index].color;
        }
    });
};

Cube.prototype.getCellAt = function(row, column, depth) {
    if ((row < 0) || (row > this.size - 1) ||
        (column < 0) || (column > this.size - 1) ||
        (depth < 0) ||  (depth > this.size - 1))
    {
        /*
         * @amirmikhak
         * if impossible coordinate, return an object that _looks like_ an off cell.
         * this is likely very confusing behavior, but it works for what I need in
         * shiftPlane().
         */
        return {
            on: false,
            color: [0, 0, 0],
        }
    }
    return this.cells[depth * this.size * this.size + row * this.size + column];
};

Cube.prototype.nudge = function(direction, amount) {
    amount = !isNaN(parseFloat(amount, 10)) ? amount : 1;

    this.yAngle = this.yAngle ? this.yAngle : 0;
    this.xAngle = this.xAngle ? this.xAngle : 0;

    switch (direction) {
        case 'left':
            this.yAngle -= amount;
            break;
        case 'up':
            this.xAngle += amount;
            break;
        case 'right':
            this.yAngle += amount;
            break;
        case 'down':
            this.xAngle -= amount;
            break;
    };

    this.html.style.transform = [
        'rotateX(' + this.xAngle + 'deg' + ')',
        'rotateY(' + this.yAngle + 'deg' + ')'
    ].join(' ');
};

Cube.prototype.play = function(opts) {
    var cube = this;

    opts = typeof opts !== 'undefined' ? opts : {};

    this.playbackOptions = opts;

    if (this.playbackOptions.action === 'slide')
    {
        switch(this.playbackOptions.direction)
        {
            case 'up':
                loopOverCubeSize(function() {
                    cube.shiftPlane('X', 1, cube.playbackOptions.wrap);
                });
                break;
            case 'down':
                loopOverCubeSize(function() {
                    cube.shiftPlane('X', -1, cube.playbackOptions.wrap);
                });
                break;
            case 'left':
                loopOverCubeSize(function() {
                    cube.shiftPlane('Y', 1, cube.playbackOptions.wrap);
                });
                break;
            case 'right':
                loopOverCubeSize(function() {
                    cube.shiftPlane('Y', -1, cube.playbackOptions.wrap);
                });
                break;
            case 'forward':
                loopOverCubeSize(function() {
                    cube.shiftPlane('Z', 1, cube.playbackOptions.wrap);
                });
                break;
            case 'back':
            default:
                loopOverCubeSize(function() {
                    cube.shiftPlane('Z', -1, cube.playbackOptions.wrap);
                });
        }
    } else
    {
        console.error('animation action not supported');
    }


    var animateInterval;

    /**
     * @amirmikhak
     * These functions can be "defined" after they are "called" above because of javascript's "hoisting".
     * Learn more: http://code.tutsplus.com/tutorials/javascript-hoisting-explained--net-15092
     */
    function loopOverCubeSize(func) {
        var numOps = 0;
        clearInterval(animateInterval);
        animateInterval = setInterval(function() {
            func.apply(this);
            if (++numOps == cube.size)
            {
                clearInterval(animateInterval);
            }
        }, cube.playbackOptions.delay);
    }
};

Cube.prototype.clear = function() {
    this.cells.forEach(function(cell) {
        cell.on = false;
    });
};

Cube.prototype.buildPlaybackControls = function(parentEl) {
    var cube = this;

    parentEl.innerHTML = (
        '<div>' +
            'Direction: ' +
            '<select>' +
                '<option value="forward">Forward</option>' +
                '<option value="back">Back</option>' +
                '<option value="left">Left</option>' +
                '<option value="right">Right</option>' +
                '<option value="up">Up</option>' +
                '<option value="down">Down</option>' +
            '</select><br>' +
            '<label>Wrap?: <input type="checkbox"></label>' +
        '</div>'
        );

    parentEl.addEventListener('change', function(e) {
        if (e.target.nodeName === 'SELECT')
        {
            cube.playbackOptions = {
                direction: e.target.value,
            };
        } else if (e.target.nodeName === 'INPUT')
        {
            cube.playbackOptions = {
                wrap: e.target.checked,
            };
        }
    });

    function arrize(thing) {
        return Array.prototype.slice.apply(thing);
    }

    arrize(parentEl.querySelectorAll('select option')).forEach(function(el) {
        el.selected = (el.value == cube.playbackOptions.direction);
    });

    arrize(parentEl.querySelectorAll('input')).forEach(function(el) {
        el.checked = cube.playbackOptions.wrap;
    });
}

Cube.prototype.charVoxelMap = {
    'a': [],
    'b': [],
    'c': [],
    'd': [],
    'e': [],
    'f': [],
    'g': [],
    'h': [],
    'i': [],
    'j': [],
    'k': [],
    'l': [],
    'm': [],
    'n': [],
    'o': [],
    'p': [],
    'q': [],
    'r': [],
    's': [],
    't': [],
    'u': [],
    'v': [],
    'q': [],
    'r': [],
    's': [],
    't': [],
    'u': [],
    'v': [],
    'w': [],
    'x': [],
    'y': [],
    'z': [],
    'A': [],
    'B': [],
    'C': [],
    'D': [],
    'E': [],
    'F': [],
    'G': [],
    'H': [],
    'I': [],
    'J': [],
    'K': [],
    'L': [],
    'M': [],
    'N': [],
    'O': [],
    'P': [],
    'Q': [],
    'R': [],
    'S': [],
    'T': [],
    'U': [],
    'V': [],
    'Q': [],
    'R': [],
    'S': [],
    'T': [],
    'U': [],
    'V': [],
    'W': [],
    'X': [],
    'Y': [],
    'Z': [],
    '0': [],
    '1': [],
    '2': [],
    '3': [],
    '4': [],
    '5': [],
    '6': [],
    '7': [],
    '8': [],
    '9': [],
    '~': [],
    '`': [],
    '!': [],
    '@': [],
    '#': [],
    '$': [],
    '%': [],
    '^': [],
    '&': [],
    '*': [],
    '(': [],
    ')': [],
    '_': [],
    '+': [],
    '[': [],
    ']': [],
    '\\': [],
    ';': [],
    '\'': [],
    ',': [],
    '.': [],
    '/': [],
    '{': [],
    '}': [],
    '|': [],
    ':': [],
    '"': [],
    ',': [],
    '.': [],
    '/': [],
};

Cube.prototype.listenForKeystrokes = function(opts) {
    var cube = this;

    this.keyListenerOptions = opts;

    var validKeyFns = {
        alpha: function(e) {
            return e.keyCode >= 65 && e.keyCode <= 90;
        },
        num: function(e) {
            return (
                (e.keyCode >= 48 && e.keyCode <= 57) || // top row
                (e.keyCode >= 96 && e.keyCode <= 105)   // num pad
            );
        },
        symbols: function(e) {
            return (
                (e.keyCode >= 106 && e.keyCode <= 111) ||  // math operators
                (e.keyCode >= 186 && e.keyCode <= 222) ||  // punctuation
                (e.shiftKey && e.keyCode >= 48 && e.keyCode <= 57)    // "uppercase" numbers
            );
        },
        alphanum: function(e) {
            return validKeyFns.alpha(e) || validKeyFns.num(e);
        },
        all: function(e) {
            return validKeyFns.alphanum(e) || validKeyFns.symbols(e);
        },
    }

    this.keyListenerFn = function(e) {
        if (validKeyFns[cube.keyListenerOptions.keys](e))
        {
            var char = e.shiftKey ?
                String.fromCharCode(e.keyCode) :
                String.fromCharCode(e.keyCode).toLowerCase();
            console.log('listener for key matched', e.shiftKey, char);
        } else
        {
            console.log('listener for key NOT matched', e.shiftKey);
        }
    };

    if (!this.listeningForKeystrokes)
    {
        document.addEventListener('keydown', this.keyListenerFn);
        this.listeningForKeystrokes = true;
    }
};

Cube.prototype.stopListeningForKeystrokes = function() {
    if (this.keyListenerFn instanceof Function)
    {
        document.removeEventListener('keydown', this.keyListenerFn);
        this.listeningForKeystrokes = false;
    }
};

