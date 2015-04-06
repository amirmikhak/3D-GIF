var FONT_FAMILY = 'Print Char 21';
var CUBE_SIZE = 8;
var CHAR_SIZE = 8;

var c;
var ctx;

function setupCanvas() {
    c = document.createElement('canvas');
    c.id = "c";
    c.width = CUBE_SIZE;
    c.height = CUBE_SIZE;
    c.style.border = '1px solid #ccc';
    c.style.width = '100px';    // just for visibility
    c.style.height = '100px';
    document.body.appendChild(c);

    ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.font = CHAR_SIZE + 'px "' + FONT_FAMILY + '"';
}

function drawChar(char) {
    ctx.clearRect(0, 0, CUBE_SIZE, CUBE_SIZE);
    ctx.fillText(char, 0, CHAR_SIZE - 1);
}

function grabPixels() {
    // http://stackoverflow.com/questions/667045/getpixel-from-html-canvas
    var imgd = ctx.getImageData(0, 0, CUBE_SIZE, CUBE_SIZE);
    var pix = imgd.data;

    var pixelStates = [];

    // Loop over each pixel and invert the color.
    for (var i = 0, n = pix.length; i < n; i += 4) {
        var cellIsOn = pix[i + 3] > 200;
        pixelStates.push(cellIsOn);
    }

    var cells = [];

    for (var column = 0; column < CUBE_SIZE; column++)
    {
        for (var row = 0; row < CUBE_SIZE; row++)
        {
            var cell = new Cell(50);
            cell.on = pixelStates.shift();
            cell.color = [0, 0, 255];
            cell.depth = 0;
            cells.push(cell);
        }
    }

    return JSON.stringify(cells);
}

var charVoxelMap = {
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

window.addEventListener('load', function() {
    setupCanvas();

    var i = 0;
    var slices = [];

    var chars = Object.keys(charVoxelMap).slice();
    var charDrawInterval = setInterval(function() {
        var char = chars[i];
        drawChar(char);
        charVoxelMap[char] = grabPixels();
        slices.push(charVoxelMap[char]);
        // console.log(charVoxelMap[char]);
        cube.writeSlice(charVoxelMap[char], 'front');

        if (++i == chars.length)
        {
            clearInterval(charDrawInterval);
        }
    }, 10);
});