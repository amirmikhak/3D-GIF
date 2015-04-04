var Cube = function(size, playButton, clearButton) {
    var me = this;
    // 'this' can point to many, different things, so we grab an easy reference to the object
    // You can read more about 'this' at:
    // MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this
    // at http://www.quirksmode.org/js/this.html
    // and in a more detailed tutorial: http://javascriptissexy.com/understand-javascripts-this-with-clarity-and-master-it/

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

    this.size = size; // How many rows and columns do I have?

    this.resolution = 50; // size of our cells in pixels

    // The HTML display of the cube istelf
    this.html = document.createElement('div');
    this.html.id = 'cube';

    this.cells = [];
    for (var depth = 0; depth < this.size; depth++) {
        // Iterate over each Z-plane
        for (var row = 0; row < this.size; row++) {
            // Iterate over each row
            for (var column = 0; column < this.size; column++) {
                // Iterate over each column

                // Create a cell
                var cell = new Cell();
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

    document.querySelector('#container').appendChild(this.html); // Actually render the cube

    return this;
};

Cube.prototype.shiftPlane = function(direction) {
    var me = this;

    var nextState = me.cells.map(function(cell) {
        // We want to calculate the coordinates of the 'previous' cell along various directions
        var shiftedCoords = {
            'X': [], // Not yet implemented
            'Y': [], // Not yet implemented
            'Z': [cell.row, cell.column, (cell.depth - 1) >= 0 ? (cell.depth - 1) % 8 : (8 + cell.depth - 1) % 8]
        }[direction];

        // Once we have it, grab its on status and coolor and return it
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
    return this.cells[depth * this.size * this.size + row * this.size + column];
};

Cube.prototype.play = function(mode, options) {
    var cube = this;

    var defaultOptions = {
        delay: 250,
    };

    mode = typeof mode !== 'undefined' ? mode : 'back';
    options = typeof options !== 'undefined' ? options : defaultOptions;

    switch(mode)
    {
        case 'someYetToBeDefinedOtherMode':
            // placeholder for future playback modes
            break;
        case 'back':
        default:
            doAnimateBack();
    }

    /**
     * @amirmikhak
     * These functions can be "defined" after they are "called" above because of javascript's "hoisting".
     * Learn more: http://code.tutsplus.com/tutorials/javascript-hoisting-explained--net-15092
     */
    function doAnimateBack() {
        var numShifts = 0;
        var animateBack = setInterval(function() {
            cube.shiftPlane('Z');
            numShifts++;
            if (numShifts == 7) {
                numShifts = 0;
                clearInterval(animateBack);
            }
        }, options.delay ? options.delay : 250);
    };
};

Cube.prototype.clear = function() {
    this.cells.forEach(function(cell) {
        cell.on = false;
    });
};