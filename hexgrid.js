/*
 *  Functions and classes to display the hexagonal gameboard and interact with it
 *   - HexagonField is the main class storing the individual playing fields
 *   - HexagonBoard contains the entire game board (including an array of HexagonFields)
 *   - LetterSet is the class used to manage the letters of the two players
 */



/*
 *  HexagonField Class
 */
function HexagonField(draw_x, draw_y, radius, type) {

    this.draw_x = draw_x;   // Horizontal center of the field on the canvas
    this.draw_y = draw_y;   // Vertical center of the field on the canvas
    this.radius = radius;   // Radius of the hexagon

    this.type = type;       // "B"=Black, "W"=White, "N"=Neutral or "X"=Invisible
    this.letter = "";       // Letter displayed in the field

    this.active = false;    // Flag if field is active
    this.glow = false;      // Flag if field should glow on the board
                            // (not used yet, could be used to guid players in later versions)

    // Function to draw this hexagon
    this.draw = function(ctx) {
        drawHexagon(ctx, this.draw_x, this.draw_y, this.radius, this.type, this.active, this.glow, this.letter);
    };

    //Determine if a click at canvas coordinate (x,y) is inside of this hexagon
    this.containsCoordinate = function(x, y){
        return !(y < this.draw_y - this.radius || y > this.draw_y + this.radius ||
                 x < this.draw_x - 0.8660254 * this.radius || x > this.draw_x + 0.8660254 * this.radius ||
                 y < -0.57735 * (x - this.draw_x+0.86603*this.radius) + this.draw_y - 0.5 * this.radius ||
                 y >  0.57735 * (x - this.draw_x+0.86603*this.radius) + this.draw_y + 0.5 * this.radius ||
                 y <  0.57735 * (x - this.draw_x-0.86603*this.radius) + this.draw_y - 0.5 * this.radius ||
                 y > -0.57735 * (x - this.draw_x-0.86603*this.radius) + this.draw_y + 0.5 * this.radius);
    };
}

/*
 * Draw Hexagon on canvas centered at x,y with radius 'radius'
 * 'type' can be either "B" or "W" for black and white,
 * "N" for neutral and "X" for invisible
 */
function drawHexagon(canvasContext, x, y, radius, type, active, glow, letter) {

    if (type != "X") {  // type "X" means it's a piece that we want to never draw

        // Generate the hexagon shape
        var hexHeight = 0.5 * radius;
        var hexWidth = 0.8660254 * radius;
        canvasContext.beginPath();
        canvasContext.moveTo(x + hexWidth, y - hexHeight); canvasContext.lineTo(x, y - radius);
        canvasContext.lineTo(x - hexWidth, y - hexHeight); canvasContext.lineTo(x - hexWidth, y + hexHeight);
        canvasContext.lineTo(x, y + radius); canvasContext.lineTo(x + hexWidth, y + hexHeight);
        canvasContext.closePath();

        // Fill the field with the right color
        if (type == "B") { canvasContext.fillStyle = "#111"; }
        else if (type == "W") { canvasContext.fillStyle = "#eee"; }
        else if (type == "N") { canvasContext.fillStyle = "#666"; }
        else { canvasContext.fillStyle = "#f00"; } // Signals an unrecognized field type
        canvasContext.fill();

        //Draw field outline
        canvasContext.lineWidth = Math.max(3,radius/14);
        if (active) { canvasContext.strokeStyle = "#22a"; }
        else if (glow) { canvasContext.strokeStyle = "#00a"; }
        else { canvasContext.strokeStyle = "#888"; }
        canvasContext.stroke();

        //Draw field letter
        if (letter != "") {
            canvasContext.textAlign = "center";
            canvasContext.font = "bold " + Math.floor(radius*0.8) + "px sans-serif";
            if (type == "B") { canvasContext.fillStyle = "#eee"; }
            else if (type == "W") { canvasContext.fillStyle = "#111"; }
            else { canvasContext.fillStyle = "#f88"; }
            canvasContext.fillText(letter, x, y + radius / 2.7);
        }
    }
}


/*
 * HexagonBoard Class
 */
function HexagonBoard(sideLength) {

    this.sideLength = sideLength;    // Number of hexagon fields on each side of the board
    this.canvasContext = undefined;  // CanvasContext where the board will be drawn on
    this.active_row = -1;            // Designates the row index of the active field on the board
                                     // (if applicable, -1 else)
    this.active_col = -1;            // Designates the columns index of the active field on the board
                                     // (if applicable, -1 else)

    // Function to initialize the board
    // (Called upon construction)
    this.boardFieldArray = [];
    for(var i=0; i < this.sideLength * 2 + 1; i++){
        this.boardFieldArray.push([]);
        this.boardFieldArray[i].push( new Array(this.sideLength * 2 + 1));
        for(var j=0; j < this.sideLength * 2 + 1; j++) {  // make the board a little longer to compensate for offsets
            var field_type = "N";  // Default field type is "N"eutral
            if (i == 0 || j ==0 || i >= this.sideLength * 2  || j >= this.sideLength * 2 ) {
                field_type = "X";  // Surround board with "X" fields to simplify potential
                                   // boundary checking for other algorithms
            } else {
                // Designate the non-board fields
                // some offsets used for even/odd dielength of the board
                var first_field = (Math.abs(this.sideLength - j) + 1)/2;
                var last_field = 2 * this.sideLength - (Math.abs(this.sideLength - j) + 1)/2;
                if (this.sideLength % 2 == 1 && j % 2 == 0) { last_field -= 1; }
                if (this.sideLength % 2 == 0 && j % 2 == 1) { first_field += 1; }
                if (i < first_field || i > last_field) { field_type = "X"; }
            }
            // Once field type has been determined, add the field to the board
            this.boardFieldArray[i][j] = new HexagonField(i*10, j*10, 20, field_type);
        }
    }

    // Draw the entire board on a vanvas
    // Uses drawHexagonBoard subroutine once the canvas context is determined
    this.draw = function(c) {
        var ctx = c.getContext("2d");
        this.canvasContext = ctx;
        ctx.canvas.width  = $("#gameBoard").width() * 3;
        ctx.canvas.height = $("#gameBoard").height() * 3;
        drawHexagonBoard(ctx, this);
        if (this.active_col != -1 && this.active_row != -1) {
            this.redraw(this.active_col, this.active_row);
        }
    };

    // Redraw the board around a specified field
    this.redraw = function (i,j){
        this.boardFieldArray[i-1][j-1].draw(this.canvasContext);
        this.boardFieldArray[i][j-1].draw(this.canvasContext);
        this.boardFieldArray[i-1][j].draw(this.canvasContext);
        this.boardFieldArray[i+1][j].draw(this.canvasContext);
        this.boardFieldArray[i-1][j+1].draw(this.canvasContext);
        this.boardFieldArray[i][j+1].draw(this.canvasContext);
        this.boardFieldArray[i][j].draw(this.canvasContext);
    };

    // Activate a board field
    // (Activation is necessary to play on the board and only one field can be
    // active at the same time)
    this.activate = function(i,j) {
        if (this.boardFieldArray[i][j].type == "N") {
            this.boardFieldArray[i][j].active = true;
            this.redraw(i, j);
            this.active_col = i;
            this.active_row = j;
        }
    };

    // Returns whether the board has an 'activated' field
    // (i.e., a field has been previously clicked on and can now be played)
    this.hasActive = function() {
        return !(this.active_col == -1 || this.active_row == -1);
    };

    // Deactivate the active board field
    this.deactivate = function() {
        if (this.active_col != -1 && this.active_row != -1) {
            this.boardFieldArray[this.active_col][this.active_row].active = false;
            this.redraw(this.active_col, this.active_row);
            this.active_col = -1;
            this.active_row = -1;
        }
    };

    // Clear the contents of a field and set it to "N"eutral type
    this.clearField = function (i,j) {
        this.boardFieldArray[i][j].type = "N";
        this.boardFieldArray[i][j].active = false;
        this.boardFieldArray[i][j].letter="";
        this.redraw(i, j);
    };

}

// Draw the entire board
function drawHexagonBoard(ctx, hexagonBoard) {

    // determine dimensions and units on the canvas
    var canvasWidth = ctx.canvas.width;
    var canvasHeight = ctx.canvas.height;
    var x_center = canvasWidth / 2;
    var y_center = canvasHeight / 2;
    var max_width = Math.min(canvasWidth, canvasHeight / 1.73205080757 * 2);
    var x_spacing = max_width / (hexagonBoard.sideLength * 2);
    var x_start = x_center - hexagonBoard.sideLength * x_spacing - ((hexagonBoard.sideLength % 2 ==0) ? 0.5 * x_spacing : 0);
    var radius = x_spacing / 1.73205080757;
    var y_spacing = 1.5 * radius;
    var y_start = y_center - (hexagonBoard.sideLength) * y_spacing;

    //draw all the fields
    for (var i = 0; i != hexagonBoard.boardFieldArray.length; ++i) {
        for (var j = 0; j != hexagonBoard.boardFieldArray[i].length; ++j) {
            hexagonBoard.boardFieldArray[i][j].draw_x = x_start + i * x_spacing + ((j%2 == 0) ? 0.5 * x_spacing : 0);
            hexagonBoard.boardFieldArray[i][j].draw_y = y_start + j * y_spacing;
            hexagonBoard.boardFieldArray[i][j].radius = radius;
            //hexagonBoard.boardFieldArray[i][j].letter = i + "," + j;
            hexagonBoard.boardFieldArray[i][j].draw(ctx);
        }
    }
}



/*
 * Letterset to keep track of the letters for the players
 * and draw new ones
 */
function LetterSet() {

    this.letters =  ("EEEEEEEEEEEEAAAAAAAAAIIIIIIIIIOOOOOOOONNNNNNRRRRR" +
                     "RTTTTTTLLLLSSSSUUUUDDDDGGGBBCCMMPPFFHHVVWWYYKJXQZ").split('');
    this.letters_per_player = 12;
    this.letters_black = [];
    this.letters_white = [];

    //Update letter display on the page
    this.draw = function() {
        var piece_list = $("#black_pieces");
        piece_list.empty();
        $.each(this.letters_black, function(i, obj) { piece_list.append("<li>" + obj + "</li>"); });
        piece_list = $("#white_pieces");
        piece_list.empty();
        $.each(this.letters_white, function(i, obj) { piece_list.append("<li>" + obj + "</li>"); });
    };

    //Pull letters from bag to fill up a player's board
    this.pull_letters = function(player_array) {
        while(this.letters.length > 0 && player_array.length < this.letters_per_player ) {
            var index = Math.floor(Math.random() * this.letters.length);
            var letter = this.letters[index];
            player_array.push(letter);
            this.letters.splice(index, 1);
        }
        this.draw();
    };

    // Add a letter to the black letterset
    this.addToBlack = function(l) {
        this.letters_black.push(l);
        this.draw();
    };

    // Add a letter to the white letterset
    this.addToWhite = function(l) {
        this.letters_white.push(l);
        this.draw();
    };

    // Add a letter bag into the "bag" of letters
    this.addToBag = function(l) {
        this.letters += l;
        this.draw();
    };

    //Initialize letters
    if (this.letters.length < 2 * this.letter_per_player) {
        alert("Warning: Not enough letters to initialize both players");
    }
    this.pull_letters(this.letters_black, this.letters_per_player);
    this.pull_letters(this.letters_white, this.letters_per_player);
    this.draw();

}



/*
 * Initialization upon page load
 */
$(function() {

    //Get the canvas element
    var c = document.getElementById("gameBoard");

    //Initialize the board and draw it for the first time
    var board = new HexagonBoard(11);  // 11 is the default size, modify this to change default
    board.draw(c);

    //Initialize the letters
    var letterSet = new LetterSet();
    letterSet.letters_per_player = 12;

    //Add window scaling/resizing event listener
    window.addEventListener('resize', function() {board.draw(c)}, false);

    //Add click event listener to the main board
    $("#gameBoard").click(function(e) {

        var scale = 3;
        p = $("#gameBoard").offset();
        var click_x = Math.round((e.pageX - p.left) * scale);
        var click_y = Math.round((e.pageY - p.top) * scale);

        board.deactivate();

        for (var i = 0; i != board.boardFieldArray.length; ++i) {
            for (var j = 0; j != board.boardFieldArray[i].length; ++j) {
                if (board.boardFieldArray[i][j].type != "X" &&
                    board.boardFieldArray[i][j].containsCoordinate(click_x, click_y)) {
                        //Found a hexagon that was clicked on
                        var action_type = $('input[name=actiontype]:checked').val();
                        if (action_type == "removeToBag") {
                            letterSet.addToBag(board.boardFieldArray[i][j].letter);
                            board.clearField(i, j);
                        } else if (action_type == "removeToPlayer") {
                            if (board.boardFieldArray[i][j].type == "W") {
                                letterSet.addToWhite(board.boardFieldArray[i][j].letter);
                            } else if (board.boardFieldArray[i][j].type == "B") {
                                letterSet.addToBlack(board.boardFieldArray[i][j].letter);
                            }
                            board.clearField(i, j);
                        } else {
                            board.activate(i, j);
                        }
                }
            }
        }

    });

    //Detect keypress
    $(document).keypress(function(e) {
        var charCode = e.which;
        if ( ((charCode > 64 && charCode < 91) ||  (charCode > 96 && charCode < 123)) && board.hasActive()) {
            var action = $('input[name=actiontype]:checked').val();
            var upperCharStr = String.fromCharCode(charCode).toUpperCase();

            if (action == "play_black") {
                //Check if player has that letter and play it if yes
                for (var i = 0; i !=letterSet.letters_black.length; ++i) {
                    if (letterSet.letters_black[i] == upperCharStr) {
                        letterSet.letters_black.splice(i,1);
                        letterSet.draw();
                        board.boardFieldArray[board.active_col][board.active_row].letter = upperCharStr;
                        board.boardFieldArray[board.active_col][board.active_row].type = "B";
                        board.deactivate();
                        break;
                    }
                }
            }

            if (action == "play_white") {
                //Check if player has that letter and play it if yes
                for (var i = 0; i != letterSet.letters_white.length; ++i) {
                    if (letterSet.letters_white[i] == upperCharStr) {
                        letterSet.letters_white.splice(i, 1);
                        letterSet.draw();
                        board.boardFieldArray[board.active_col][board.active_row].letter = upperCharStr;
                        board.boardFieldArray[board.active_col][board.active_row].type = "W";
                        board.deactivate();
                        break;
                    }
                }
            }
        }
    });

    //Add reset event to the reset button in the sidebar
    $("#resetBoard").click(function(e) {
        var board_size = document.getElementById("sidelength").value;
        board = new HexagonBoard(board_size);
        letterSet = new LetterSet();
        board.draw(c)
    });

    //Add events to 'finish move' button
    $("#complete_move").click(function(e) {
        letterSet.pull_letters(letterSet.letters_white);
        letterSet.pull_letters(letterSet.letters_black);
    });

});

