# 3D GIF

# Version 2 Functionality

Serve on local machine:
----------

Using npm:

Run these commands from the terminal while inside the root directory of the repository:

    npm install -g http-server
    http-server . -a 127.0.0.1 -p 9001


View on S3:
----------

[https://s3.amazonaws.com/dgmde15-amirmikhak/l3d/index.html](https://s3.amazonaws.com/dgmde15-amirmikhak/l3d/index.html)



Keyboard Actions
----------

- ARROWS: rotate the cube

- LETTERS / SYMBOLS / ETC.: put typed character on front face
- SPACEBAR: enter “ ” (space) character, which clears the front slice

- ENTER: toggle playback

- CTRL+EQUALS: next step
- CTRL+MINUS: previous step

- CTRL+SPACE: toggle playback

- CTRL+B: send content towards the back
- CTRL+F: send content towards the front
- CTRL+L: send content towards the left
- CTRL+R: send content towards the right
- CTRL+U: send content towards the top
- CTRL+D: send content towards the bottom

- CTRL+ALT+UP: send content towards the back
- CTRL+ALT+DOWN: send content towards the front

- BACKSPACE: clear front slice
- SHIFT+BACKSPACE: clear all contents of the cube
