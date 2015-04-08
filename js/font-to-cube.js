var FONT_FAMILY = 'Print Char 21';
var CUBE_SIZE = 8;
var CHAR_SIZE = 8;

var c;
var ctx;

var charVoxelMap = {
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
    '!': [],
    '"': [],
    '#': [],
    '$': [],
    '%': [],
    '&': [],
    '?': [],
    '¿': [],
    '<': [],
    '>': [],
    '=': [],
    '÷': [],
    '√': [],
    '-': [],
    '\'': [],
    '(': [],
    ')': [],
    '*': [],
    '+': [],
    ',': [],
    '.': [],
    '/': [],
    ':': [],
    ';': [],
    '@': [],
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
    'W': [],
    'X': [],
    'Y': [],
    'Z': [],
    '[': [],
    '\\': [],
    ']': [],
    '^': [],
    '_': [],
    '`': [],
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
    'w': [],
    'x': [],
    'y': [],
    'z': [],
    '{': [],
    '|': [],
    '}': [],
    '~': [],
    ' ': [],
};

var chars = Object.keys(charVoxelMap).slice();

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
    var ALPHA_THRESHOLD = 150;

    var imgd = ctx.getImageData(0, 0, CUBE_SIZE, CUBE_SIZE);
    var pix = imgd.data;

    var pixelStates = [];

    // Loop over each pixel and invert the color.
    for (var i = 0, n = pix.length; i < n; i += 4) {
        var cellIsOn = pix[i + 3] > ALPHA_THRESHOLD;
        pixelStates.push(cellIsOn);
    }

    var cells = [];

    for (var column = 0; column < CUBE_SIZE; column++)
    {
        for (var row = 0; row < CUBE_SIZE; row++)
        {
            var cell = new Cell(50);
            cell.on = pixelStates[(row * CUBE_SIZE) + column];
            cell.color = [0, 0, 255];
            cell.depth = 0;
            cells.push(cell);
        }
    }

    return JSON.stringify(cells);
}

function getRandomAnimationConfig() {
    var faces = ['front', 'back', 'left', 'right', 'top', 'bottom'];
    var directions = ['back', 'forward', 'right', 'left', 'down', 'up'];

    return {
        face: faces[Math.floor(Math.random() * faces.length)],
        direction: directions[Math.floor(Math.random() * directions.length)]
    };
}

function renderFont() {
    for (var i = 0; i < chars.length; i++)
    {
        var char = chars[i];
        drawChar(char);
        charVoxelMap[char] = grabPixels();
    }
}

function playChars(i) {
    if ((i < 0) || (i >= chars.length))
    {
        return;
    }

    var randAnim = getRandomAnimationConfig();

    cube.writeSlice(charVoxelMap[chars[i]], randAnim.face);
    /**
     * @amirmikhak
     * This code breaks with changes to cube.play(): removing the returned promise value
     */
    // cube.play({
    //     direction: randAnim.direction,
    //     delay: 50,
    // }).then(function() {
    //     playChars(i + 1);
    // });
}

window.addEventListener('load', function() {
    setupCanvas();

    renderFont();

    setTimeout(function() {
        cube.xAngle = -30;
        cube.yAngle = 30;
        playChars(0);
    }, 10);
});