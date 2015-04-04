window.addEventListener('load', function() { // When everything is loaded
    var cube = new Cube(8);
    document.getElementById('play').addEventListener('click', function(event) {
        var numShifts = 0;
        var animateBack = setInterval(function() {
            cube.shiftPlane('Z');
            numShifts++;
            if (numShifts == 7) {
                numShifts = 0;
                clearInterval(animateBack);
            }
        }, 250);

    });

    var xAngle = 0,
        yAngle = 0;

    document.body.addEventListener("keydown", function(event) {
        var nudgeAngle = 11.25;
        switch (event.keyCode) {
            case 37: // left
                yAngle -= nudgeAngle;
                break;

            case 38: // up
                xAngle += nudgeAngle;
                break;

            case 39: // right
                yAngle += nudgeAngle;
                break;

            case 40: // down
                xAngle -= nudgeAngle;
                break;
        };
        document.getElementById('cube').style.transform = [
            'rotateX(' + xAngle + 'deg' + ')',
            'rotateY(' + yAngle + 'deg' + ')'
        ].join(' ')
    }, false);
});
