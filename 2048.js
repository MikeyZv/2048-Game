const gameBoard = document.querySelector("#gameBoard");
const ctx = gameBoard.getContext("2d");
const playerhighScore = document.querySelector("#highScore");
const playerScore = document.querySelector("#playerScore");
const gameWidth =  gameBoard.width;
const gameHeight = gameBoard.height;
const restartBtn = document.querySelector("#restartBtn");


class Tile {
    value;
    color;
    x;
    y;
    height = 150;
    width = 150;

    constructor(value, color, x, y) {
        this.value = value;
        this.color = color;
        this.x = x;
        this.y = y;
    }

    drawTile() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    
    clearTile() {
        ctx.fillStyle = "#121212";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    drawValue() {
        ctx.font = "550 50px 'Genos', sans-serif";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText(this.value, this.x + 75, this.y + 85);
    }
    
};

//stops scrolling from key inputs
window.addEventListener("keydown", function(e) {
    if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }
}, false);

let tiles = [];
let grid = [[{x:0, y:0, taken: 0, value: 1}, {x:150, y:0, taken: 0, value: 1}, {x:300, y:0, taken: 0, value: 1}, {x:450, y:0, taken: 0, value: 1}],
            [{x:0, y:150, taken: 0, value: 1}, {x:150, y:150, taken: 0, value: 1}, {x:300, y:150, taken: 0, value: 1}, {x:450, y:150, taken: 0, value: 1}],
            [{x:0, y:300, taken: 0, value: 1}, {x:150, y:300, taken: 0, value: 1}, {x:300, y:300, taken: 0, value: 1}, {x:450, y:300, taken: 0, value: 1}],
            [{x:0, y:450, taken: 0, value: 1}, {x:150, y:450, taken: 0, value: 1}, {x:300, y:450, taken: 0, value: 1}, {x:450, y:450, taken: 0, value: 1}]];
let mergePossible;
let tileMoved = false;
let tileMerged = false;
let score = 0;
let highScore = 0;

//prevents page from refreshing when submitting form
var form = document.getElementById("myForm");
form.addEventListener('submit', handleForm);
function handleForm(event) { 
    event.preventDefault(); 
};

function start() {
    if(document.getElementById("username").value.length > 0) {
        closeForm();
        window.addEventListener("keydown", moveBox);
        restartBtn.addEventListener("click", restartGame);
        randomStart();
    }
};

//randomly places two tiles on the board at the beginning of the game but they can't overlap
function randomStart() {
    randomIndex1A = Math.floor(Math.random() * 4);
    randomIndex1B = Math.floor(Math.random() * 4);

    randomIndex2A = Math.floor(Math.random() * 4);
    randomIndex2B = Math.floor(Math.random() * 4);
    
    while ((grid[randomIndex1A][randomIndex1B].x == grid[randomIndex2A][randomIndex2B].x) && (grid[randomIndex1A][randomIndex1B].y == grid[randomIndex2A][randomIndex2B].y)) {
        randomIndex1A = Math.floor(Math.random() * 4);
        randomIndex1B = Math.floor(Math.random() * 4);
    }

    let firstTile = new Tile(2, "#2ecc71", grid[randomIndex1A][randomIndex1B].x, grid[randomIndex1A][randomIndex1B].y);
    let secondTile = new Tile(2, "#2ecc71", grid[randomIndex2A][randomIndex2B].x, grid[randomIndex2A][randomIndex2B].y);

    grid[randomIndex1A][randomIndex1B].value = 2;
    grid[randomIndex2A][randomIndex2B].value = 2;
    grid[randomIndex1A][randomIndex1B].taken = 1;
    grid[randomIndex2A][randomIndex2B].taken = 1;

    tiles.push(firstTile);
    tiles.push(secondTile);

    tiles[0].drawTile();
    tiles[1].drawTile();
    tiles[0].drawValue();
    tiles[1].drawValue();
};

function checkTurn() {
    if ((tileMoved || tileMerged) && (tiles.length < 16)) { //if tile moves or tile merges and the length of tile array is less than 16
        randomNewTile(); //spawn new tile
        tileMoved = false; //tile hasn't moved
        tileMerged = false; //tile hasn't merged
    }
};

function checkGameOver() {
    if ((!mergePossible) && (tiles.length == 16)) {
        ctx.fillStyle = "white";
        ctx.font = "550 80px 'Genos', sans-serif";
        ctx.fillText("[GAME OVER]", gameWidth / 2, gameHeight - 300);
        ctx.font = "550 25px 'Genos', sans-serif";
        ctx.fillText("SUBMIT YOUR SCORE ->", gameWidth / 2, gameHeight - 275);
        ctx.textAlign = "center";
        sendData();
    }
};

//test function
function test() {
    if (!mergePossible) {
        ctx.font = "30px Courier, monospace";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText("no merge possible", gameWidth / 2, gameHeight - 100);
    }
};

//checks all tiles to see if there is one tile with the same value adjacent to it
function checkSurroundingTiles() {
    //top to bottom
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 4; j++) {
            if (i == 0) {
                if (grid[i+1][j].taken == 1) {
                    if (grid[i][j].value == grid[i+1][j].value) {
                        mergePossible = true;
                    }
                } else if (grid[i+2][j].taken == 1) {
                    if (grid[i][j].value == grid[i+2][j].value) {
                        mergePossible = true;
                    }
                } else if (grid[i+3][j].taken == 1) {
                    if (grid[i][j].value == grid[i+3][j].value) {
                        mergePossible = true;
                    }
                }
            } else if (i == 1) {
                if (grid[i+1][j].taken == 1) {
                    if (grid[i][j].value == grid[i+1][j].value) {
                        mergePossible = true;
                    }
                } else if (grid[i+2][j].taken == 1) {
                    if (grid[i][j].value == grid[i+2][j].value) {
                        mergePossible = true;
                    }
                }
            } else if (i == 2) {
                if (grid[i+1][j].taken == 1) {
                    if (grid[i][j].value == grid[i+1][j].value) {
                        mergePossible = true;
                    }
                } 
            }
        }
    }
    //bottom to top
    for (let i = 3; i > 0; i--) {
        for (let j = 0; j < 4; j++) {
            if (i == 3) {
                if (grid[i-1][j].taken == 1) {
                    if (grid[i][j].value == grid[i-1][j].value) {
                        mergePossible = true;
                    }
                } else if (grid[i-2][j].taken == 1) {
                    if (grid[i][j].value == grid[i-2][j].value) {
                        mergePossible = true;
                    }
                } else if (grid[i-3][j].taken == 1) {
                    if (grid[i][j].value == grid[i-3][j].value) {
                        mergePossible = true;
                    }
                }
            } else if (i == 2) {
                if (grid[i-1][j].taken == 1) {
                    if (grid[i][j].value == grid[i-1][j].value) {
                        mergePossible = true;
                    }
                } else if (grid[i-2][j].taken == 1) {
                    if (grid[i][j].value == grid[i-2][j].value) {
                        mergePossible = true;
                    }
                }
            } else if (i == 1) {
                if (grid[i-1][j].taken == 1) {
                    if (grid[i][j].value == grid[i-1][j].value) {
                        mergePossible = true;
                    }
                }
            }
        }
    }
    //left to right
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 3; j++) {
            if (j == 0) {
                if (grid[i][j+1].taken == 1) {
                    if (grid[i][j].value == grid[i][j+1].value) {
                        mergePossible = true;
                    } 
                } else if (grid[i][j+2].taken == 1) {
                    if (grid[i][j].value == grid[i][j+2].value) {
                        mergePossible = true;
                    } 
                } else if (grid[i][j+3].taken == 1) {
                    if (grid[i][j].value == grid[i][j+3].value) {
                        mergePossible = true;
                    }
                }
            } else if (j == 1) {
                if (grid[i][j+1].taken == 1) {
                    if (grid[i][j].value == grid[i][j+1].value) {
                        mergePossible = true;
                    } 
                } else if (grid[i][j+2].taken == 1) {
                    if (grid[i][j].value == grid[i][j+2].value) {
                        mergePossible = true;
                    }
                }
            } else if (j == 2) {
                if (grid[i][j+1].taken == 1) {
                    if (grid[i][j].value == grid[i][j+1].value) {
                        mergePossible = true;
                    }
                }
            }
        }
    }
    //right to left
    for (let i = 0; i < 4; i++) {
        for (let j = 3; j > 0; j--) {
            if (j == 3) {
                if (grid[i][j-1].taken == 1) {
                    if (grid[i][j].value == grid[i][j-1].value) {
                        mergePossible = true;
                    }
                } else if (grid[i][j-2].taken == 1) {
                    if (grid[i][j].value == grid[i][j-2].value) {
                        mergePossible = true;
                    }
                } else if (grid[i][j-3].taken == 1) {
                    if (grid[i][j].value == grid[i][j-3].value) {
                        mergePossible = true;
                    }
                }
            } else if (j == 2) {
                if (grid[i][j-1].taken == 1) {
                    if (grid[i][j].value == grid[i][j-1].value) {
                        mergePossible = true;
                    } 
                } else if (grid[i][j-2].taken == 1) {
                    if (grid[i][j].value == grid[i][j-2].value) {
                        mergePossible = true;
                    }
                }
            } else if (j == 1) {
                if (grid[i][j-1].taken == 1) {
                    if (grid[i][j].value == grid[i][j-1].value) {
                        mergePossible = true;
                    }
                }
            }
        }
    }
};

//spawns in a random tile on an available space
function randomNewTile() {
    //initial gridspace to spawn new tile
    randomIndexA = Math.floor(Math.random() * 4);
    randomIndexB = Math.floor(Math.random() * 4);
    
    if (tiles.length < 16) {
        //rerolls gridspace if initial gridspace is taken
        while (grid[randomIndexA][randomIndexB].taken == 1) {
            randomIndexA = Math.floor(Math.random() * 4);
            randomIndexB = Math.floor(Math.random() * 4);
        }

        let tileValue = 2;
        let tileColor = "#2ecc71";

        //10% chance that a tile with value 4 spawns
        chance = Math.floor(Math.random() * 10);
        if (chance == 0) {
            tileValue = 4;
            tileColor = "#27ae60";
        }
        
        //creates new tile with assigned values and pushes it into tile array
        let newTile = new Tile(tileValue, tileColor, grid[randomIndexA][randomIndexB].x, grid[randomIndexA][randomIndexB].y);
        grid[randomIndexA][randomIndexB].value = tileValue;
        grid[randomIndexA][randomIndexB].taken = 1;
        tiles.push(newTile);
    }
};

//draws all tiles on the board
function drawTiles() {
    for (let i = 0; i < tiles.length; i++) {
        tiles[i].drawTile();
        tiles[i].drawValue();
    }
};

function updateColors() {
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            for (let k = 0; k < tiles.length; k++) {
                if ((grid[i][j].x == tiles[k].x) && (grid[i][j].y == tiles[k].y)) {
                    switch(true) {
                        case(grid[i][j].value == 2):
                            tiles[k].color = "#2ecc71";
                            tiles[k].value = 2;
                            break;
                        case(grid[i][j].value == 4):
                            tiles[k].color = "#27ae60";
                            tiles[k].value = 4;
                            break;
                        case(grid[i][j].value == 8):
                            tiles[k].color = "#f1c40f";
                            tiles[k].value = 8;
                            break;
                        case(grid[i][j].value == 16):
                            tiles[k].color = "#f39c12";
                            tiles[k].value = 16;
                            break;
                        case(grid[i][j].value == 32):
                            tiles[k].color = "#e67e22";
                            tiles[k].value = 32;
                            break;
                        case(grid[i][j].value == 64):
                            tiles[k].color = "#d35400";
                            tiles[k].value = 64;
                            break;
                        case(grid[i][j].value == 128):
                            tiles[k].color = "#e74c3c";
                            tiles[k].value = 128;
                            break;
                        case(grid[i][j].value == 256):
                            tiles[k].color = "#c0392b";
                            tiles[k].value = 256;
                            break;
                        case(grid[i][j].value == 512):
                            tiles[k].color = "#3498db";
                            tiles[k].value = 512;
                            break;
                        case(grid[i][j].value == 1024):
                            tiles[k].color = "#1abc9c";
                            tiles[k].value = 1024;
                            break;
                        case(grid[i][j].value == 2048):
                            tiles[k].color = "#8e44ad";
                            tiles[k].value = 2048;
                            break;
                    }
                }
            }
        }
    }
};

function updateScore() {
    playerScore.textContent = score;
};

function updateHighScore() {
    playerhighScore.textContent = highScore;
};

function checkHighScore() {
    if (score >= highScore) {
        highScore = score;
        playerhighScore.textContent = score;
    }
}; 

function restartGame() {
    ctx.fillStyle = "#121212";
    ctx.fillRect(0, 0, gameWidth, gameHeight);
    tiles = [];
    grid = [[{x:0, y:0, taken: 0, value: 1}, {x:150, y:0, taken: 0, value: 1}, {x:300, y:0, taken: 0, value: 1}, {x:450, y:0, taken: 0, value: 1}],
            [{x:0, y:150, taken: 0, value: 1}, {x:150, y:150, taken: 0, value: 1}, {x:300, y:150, taken: 0, value: 1}, {x:450, y:150, taken: 0, value: 1}],
            [{x:0, y:300, taken: 0, value: 1}, {x:150, y:300, taken: 0, value: 1}, {x:300, y:300, taken: 0, value: 1}, {x:450, y:300, taken: 0, value: 1}],
            [{x:0, y:450, taken: 0, value: 1}, {x:150, y:450, taken: 0, value: 1}, {x:300, y:450, taken: 0, value: 1}, {x:450, y:450, taken: 0, value: 1}]];
    mergePossible = false;
    tileMoved = false;
    tileMerged = false;
    checkHighScore();
    score = 0;
    updateScore();
    randomStart();
};

//merges tiles if possible
function mergeDownTiles() {
    for (let i = 0; i < 4; i++) { //begins at first column
        for (let j = 2; j > -1; j--) { //begins at third row
            for (let k = 0; k < tiles.length; k++) { //traverses through tile array
                if ((grid[j][i].x == tiles[k].x) && (grid[j][i].y == tiles[k].y)) { //if gridbox coordinates equal tile coordinates
                    if (grid[j+1][i].taken == 1) { //if gridbox is taken in row below current gridbox 
                        if (grid[j][i].value == grid[j+1][i].value) { //if gridbox value is the same as the gridbox value below it
                            tiles[k].clearTile(); //clear current tile drawing
                            tiles.splice(k, 1); //delete current tile from array
                            grid[j][i].taken = 0; //current gridbox is now available
                            grid[j+1][i].value *= 2; //gridbox value below current gridbox has now doubled
                            grid[j][i].value = 1; //current gridbox value is now 1
                            score += grid[j+1][i].value; //increase player score by new gridbox value
                            tileMerged = true; //tile successfully merged
                        }
                    }
                }
            }
        }
    }
};

function mergeUpTiles() {
    for (let i = 0; i < 4; i++) {
        for (let j = 1; j < 4; j++) {
            for (let k = 0; k < tiles.length; k++) {
                if ((grid[j][i].x == tiles[k].x) && (grid[j][i].y == tiles[k].y)) {
                    if (grid[j-1][i].taken == 1) {
                        if (grid[j][i].value == grid[j-1][i].value) {
                            tiles[k].clearTile();
                            tiles.splice(k, 1);
                            grid[j][i].taken = 0;
                            grid[j-1][i].value *= 2;
                            grid[j][i].value = 1;
                            score += grid[j-1][i].value;
                            tileMerged = true;
                        }
                    }
                }
            }
        }
    }
};

function mergeRightTiles() {
    for (let i = 0; i < 4; i++) {
        for (let j = 2; j > -1; j--) {
            for (let k = 0; k < tiles.length; k++) {
                if ((grid[i][j].x == tiles[k].x) && (grid[i][j].y == tiles[k].y)) {
                    if (grid[i][j+1].taken == 1) {
                        if (grid[i][j].value == grid[i][j+1].value) {
                            tiles[k].clearTile();
                            tiles.splice(k, 1);
                            grid[i][j].taken = 0;
                            grid[i][j+1].value *= 2;
                            grid[i][j].value = 1;
                            score += grid[i][j+1].value;
                            tileMerged = true;
                        } 
                    }
                }
            }
        }
    }
};

function mergeLeftTiles() {
    for (let i = 0; i < 4; i++) {
        for (let j = 1; j < 4; j++) {
            for (let k = 0; k < tiles.length; k++) {
                if ((grid[i][j].x == tiles[k].x) && (grid[i][j].y == tiles[k].y)) {
                    if (grid[i][j-1].taken == 1) {
                        if (grid[i][j].value == grid[i][j-1].value) {
                            tiles[k].clearTile();
                            tiles.splice(k, 1);
                            grid[i][j].taken = 0;
                            grid[i][j-1].value *= 2;
                            grid[i][j].value = 1;
                            score += grid[i][j-1].value;
                            tileMerged = true;
                        } 
                    }
                }
            }
        }
    }
};


function moveDownAnimation(x, y, index) {
    let id = null;
    clearInterval(id);
    id = setInterval(frame, 4);
    function frame() {
        if (tiles[index].y == y) {
            clearInterval(id);
        } else {
            tiles[index].clearTile();
            tiles[index].y += 50;
            tiles[index].drawTile();
            tiles[index].drawValue();
        }
    }
}

function moveUpAnimation(x, y, index) {
    let id = null;
    clearInterval(id);
    id = setInterval(frame, 4);
    function frame() {
        if (tiles[index].y == y) {
            clearInterval(id);
        } else {
            tiles[index].clearTile();
            tiles[index].x = x;
            tiles[index].y -= 50;
            tiles[index].drawTile();
            tiles[index].drawValue();
        }
    }
};

function moveLeftAnimation(x, y, index) {
    let id = null;
    clearInterval(id);
    id = setInterval(frame, 4);
    function frame() {
        if (tiles[index].x == x) {
            clearInterval(id);
        } else {
            tiles[index].clearTile();
            tiles[index].x -= 50;
            tiles[index].y = y;
            tiles[index].drawTile();
            tiles[index].drawValue();
        }
    }
};

function moveRightAnimation(x, y, index) {
    let id = null;
    clearInterval(id);
    id = setInterval(frame, 4);
    function frame() {
        if (tiles[index].x == x) {
            clearInterval(id);
        } else {
            tiles[index].clearTile();
            tiles[index].x += 50;
            tiles[index].y = y;
            tiles[index].drawTile();
            tiles[index].drawValue();
        }
    }
};


//moves tiles
function moveDown() {
    for (let i = 0; i < 4; i++) { //begins at first column
        for (let j = 2; j > -1; j--) { //begins at third row
            for (let k = 0; k < tiles.length; k++) { //traverse through tile array
                if ((grid[j][i].x == tiles[k].x) && (grid[j][i].y == tiles[k].y)) { //if grid coordinates equal tile coordinates
                    if (j == 2) { //row 3
                        if (grid[j+1][i].taken == 0) { //if gridbox in row 3 is empty
                            grid[j+1][i].taken = grid[j][i].taken; //gridbox in row 4 is now taken
                            grid[j][i].taken = 0; //sets current gridbox taken back to 0 meaning 'empty'
                            grid[j+1][i].value = grid[j][i].value; //updates gridbox value in row 4 with current gridbox value
                            grid[j][i].value = 1; //sets current gridbox value back to 1
                            moveDownAnimation(grid[j+1][i].x, grid[j+1][i].y, k);
                            tiles[k].clearTile();
                            tileMoved = true; //tile successfully moved
                        }
                    } else if (j == 1) { //row 2
                        if (grid[j+2][i].taken == 0) {
                            grid[j+2][i].taken = grid[j][i].taken;
                            grid[j][i].taken = 0;
                            grid[j+2][i].value = grid[j][i].value;
                            grid[j][i].value = 1;
                            moveDownAnimation(grid[j+2][i].x, grid[j+2][i].y, k);
                            tiles[k].clearTile();
                            tileMoved = true;
                        } else if (grid[j+1][i].taken == 0) {
                            grid[j+1][i].taken = grid[j][i].taken;
                            grid[j][i].taken = 0;
                            grid[j+1][i].value = grid[j][i].value;
                            grid[j][i].value = 1;
                            moveDownAnimation(grid[j+1][i].x, grid[j+1][i].y, k);
                            tiles[k].clearTile();
                            tileMoved = true;
                        }
                    } else if (j == 0) { //row 1
                        if (grid[j+3][i].taken == 0) {
                            grid[j+3][i].taken = grid[j][i].taken;
                            grid[j][i].taken = 0;
                            grid[j+3][i].value = grid[j][i].value;
                            grid[j][i].value = 1;
                            moveDownAnimation(grid[j+3][i].x, grid[j+3][i].y, k);
                            tiles[k].clearTile();
                            tileMoved = true;
                        } else if (grid[j+2][i].taken == 0) {
                            grid[j+2][i].taken = grid[j][i].taken;
                            grid[j][i].taken = 0;
                            grid[j+2][i].value = grid[j][i].value;
                            grid[j][i].value = 1;
                            moveDownAnimation(grid[j+2][i].x, grid[j+2][i].y, k); 
                            tiles[k].clearTile();
                            tileMoved = true;
                        } else if (grid[j+1][i].taken == 0) {
                            grid[j+1][i].taken = grid[j][i].taken;
                            grid[j][i].taken = 0;
                            grid[j+1][i].value = grid[j][i].value;
                            grid[j][i].value = 1;
                            moveDownAnimation(grid[j+1][i].x, grid[j+1][i].y, k);
                            tiles[k].clearTile();
                            tileMoved = true;
                        }
                    }
                }
            }
        }
    }
};

function moveUp() {
    for (let i = 0; i < 4; i++) {
        for (let j = 1; j < 4; j++) {
            for (let k = 0; k < tiles.length; k++) {
                if ((grid[j][i].x == tiles[k].x) && (grid[j][i].y == tiles[k].y)) {
                    if (j == 1) {
                        if (grid[j-1][i].taken == 0) {
                            grid[j-1][i].taken = grid[j][i].taken;
                            grid[j][i].taken = 0;
                            grid[j-1][i].value = grid[j][i].value;
                            grid[j][i].value = 1;
                            moveUpAnimation(grid[j-1][i].x, grid[j-1][i].y, k);
                            tiles[k].clearTile();
                            tileMoved = true;
                        }
                    } else if (j == 2) {
                        if (grid[j-2][i].taken == 0) {
                            grid[j-2][i].taken = grid[j][i].taken;
                            grid[j][i].taken = 0;
                            grid[j-2][i].value = grid[j][i].value;
                            grid[j][i].value = 1;
                            moveUpAnimation(grid[j-2][i].x, grid[j-2][i].y, k);
                            tiles[k].clearTile();
                            tileMoved = true;
                        } else if (grid[j-1][i].taken == 0) {
                            grid[j-1][i].taken = grid[j][i].taken;
                            grid[j][i].taken = 0;
                            grid[j-1][i].value = grid[j][i].value;
                            grid[j][i].value = 1;
                            moveUpAnimation(grid[j-1][i].x, grid[j-1][i].y, k);
                            tiles[k].clearTile();
                            tileMoved = true;
                        }
                    } else if (j == 3) {
                        if (grid[j-3][i].taken == 0) {
                            grid[j-3][i].taken = grid[j][i].taken;
                            grid[j][i].taken = 0;
                            grid[j-3][i].value = grid[j][i].value;
                            grid[j][i].value = 1;
                            moveUpAnimation(grid[j-3][i].x, grid[j-3][i].y, k);
                            tiles[k].clearTile();
                            tileMoved = true;
                        } else if (grid[j-2][i].taken == 0) {
                            grid[j-2][i].taken = grid[j][i].taken;
                            grid[j][i].taken = 0;
                            grid[j-2][i].value = grid[j][i].value;
                            grid[j][i].value = 1;
                            moveUpAnimation(grid[j-2][i].x, grid[j-2][i].y, k);
                            tiles[k].clearTile();
                            tileMoved = true;
                        } else if (grid[j-1][i].taken == 0) {
                            grid[j-1][i].taken = grid[j][i].taken;
                            grid[j][i].taken = 0;
                            grid[j-1][i].value = grid[j][i].value;
                            grid[j][i].value = 1;
                            moveUpAnimation(grid[j-1][i].x, grid[j-1][i].y, k);
                            tiles[k].clearTile();
                            tileMoved = true;
                        }
                    }
                }
            }
        }
    }
};

function moveLeft() {
    for (let i = 0; i < 4; i++) {
        for (let j = 1; j < 4; j++) {
            for (let k = 0; k < tiles.length; k++) {
                if ((grid[i][j].x == tiles[k].x) && (grid[i][j].y == tiles[k].y)) {
                    if (j == 1) {
                        if (grid[i][j-1].taken == 0) {
                            grid[i][j-1].taken = grid[i][j].taken;
                            grid[i][j].taken = 0;
                            grid[i][j-1].value = grid[i][j].value;
                            grid[i][j].value = 1;
                            moveLeftAnimation(grid[i][j-1].x, grid[i][j-1].y, k);
                            tiles[k].clearTile();
                            tileMoved = true;
                        }
                    } else if (j == 2) {
                        if (grid[i][j-2].taken == 0) {
                            grid[i][j-2].taken = grid[i][j].taken;
                            grid[i][j].taken = 0;
                            grid[i][j-2].value = grid[i][j].value;
                            grid[i][j].value = 1;
                            moveLeftAnimation(grid[i][j-2].x, grid[i][j-2].y, k);
                            tiles[k].clearTile();
                            tileMoved = true;
                        } else if (grid[i][j-1].taken == 0) {
                            grid[i][j-1].taken = grid[i][j].taken;
                            grid[i][j].taken = 0;
                            grid[i][j-1].value = grid[i][j].value;
                            grid[i][j].value = 1;
                            moveLeftAnimation(grid[i][j-1].x, grid[i][j-1].y, k);
                            tiles[k].clearTile();
                            tileMoved = true;
                        }
                    } else if (j == 3) {
                        if (grid[i][j-3].taken == 0) {
                            grid[i][j-3].taken = grid[i][j].taken;
                            grid[i][j].taken = 0;
                            grid[i][j-3].value = grid[i][j].value;
                            grid[i][j].value = 1;
                            moveLeftAnimation(grid[i][j-3].x, grid[i][j-3].y, k);
                            tiles[k].clearTile();
                            tileMoved = true;
                        } else if (grid[i][j-2].taken == 0) {
                            grid[i][j-2].taken = grid[i][j].taken;
                            grid[i][j].taken = 0;
                            grid[i][j-2].value = grid[i][j].value;
                            grid[i][j].value = 1;
                            moveLeftAnimation(grid[i][j-2].x, grid[i][j-2].y, k);
                            tiles[k].clearTile();
                            tileMoved = true;
                        } else if (grid[i][j-1].taken == 0) {
                            grid[i][j-1].taken = grid[i][j].taken;
                            grid[i][j].taken = 0;
                            grid[i][j-1].value = grid[i][j].value;
                            grid[i][j].value = 1;
                            moveLeftAnimation(grid[i][j-1].x, grid[i][j-1].y, k);
                            tiles[k].clearTile();
                            tileMoved = true;
                        }
                    }
                }
            }
        }
    }
};

function moveRight() {
    for (let i = 0; i < 4; i++) {
        for (let j = 2; j > -1; j--) {
            for (let k = 0; k < tiles.length; k++) {
                if ((grid[i][j].x == tiles[k].x) && (grid[i][j].y == tiles[k].y)) {
                    if (j == 2) {
                        if (grid[i][j+1].taken == 0) {
                            grid[i][j+1].taken = grid[i][j].taken;
                            grid[i][j].taken = 0;
                            grid[i][j+1].value = grid[i][j].value;
                            grid[i][j].value = 1;
                            moveRightAnimation(grid[i][j+1].x, grid[i][j+1].y, k);
                            tiles[k].clearTile();
                            tileMoved = true;
                        }
                    } else if (j == 1) {
                        if (grid[i][j+2].taken == 0) {
                            grid[i][j+2].taken = grid[i][j].taken;
                            grid[i][j].taken = 0;
                            grid[i][j+2].value = grid[i][j].value;
                            grid[i][j].value = 1;
                            moveRightAnimation(grid[i][j+2].x, grid[i][j+2].y, k);
                            tiles[k].clearTile();
                            tileMoved = true;
                        } else if (grid[i][j+1].taken == 0) {
                            grid[i][j+1].taken = grid[i][j].taken;
                            grid[i][j].taken = 0;
                            grid[i][j+1].value = grid[i][j].value;
                            grid[i][j].value = 1;
                            moveRightAnimation(grid[i][j+1].x, grid[i][j+1].y, k);
                            tiles[k].clearTile();
                            tileMoved = true;
                        }
                    } else if (j == 0) {
                        if (grid[i][j+3].taken == 0) {
                            grid[i][j+3].taken = grid[i][j].taken;
                            grid[i][j].taken = 0;
                            grid[i][j+3].value = grid[i][j].value;
                            grid[i][j].value = 1;
                            moveRightAnimation(grid[i][j+3].x, grid[i][j+3].y, k);
                            tiles[k].clearTile();
                            tileMoved = true;
                        } else if (grid[i][j+2].taken == 0) {
                            grid[i][j+2].taken = grid[i][j].taken;
                            grid[i][j].taken = 0;
                            grid[i][j+2].value = grid[i][j].value;
                            grid[i][j].value = 1;
                            moveRightAnimation(grid[i][j+2].x, grid[i][j+2].y, k);
                            tiles[k].clearTile();
                            tileMoved = true;
                        } else if (grid[i][j+1].taken == 0) {
                            grid[i][j+1].taken = grid[i][j].taken;
                            grid[i][j].taken = 0;
                            grid[i][j+1].value = grid[i][j].value;
                            grid[i][j].value = 1;
                            moveRightAnimation(grid[i][j+1].x, grid[i][j+1].y, k);
                            tiles[k].clearTile();
                            tileMoved = true;
                        }
                    }
                }
            }
        }
    }
};

//test function
function color1() {
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            ctx.font = "20px Courier, monospace";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText(grid[i][j].value, grid[i][j].x + 10, grid[i][j].y + 50);
            ctx.fillText(grid[i][j].taken, grid[i][j].x + 10, grid[i][j].y + 15);

        }
    }
};

function openForm() {
    document.getElementById("myForm").style.display = "flex";
};

function closeForm() {
    document.getElementById("myForm").style.display = "none";
};

//"includes/scorehandler.inc.php"

function sendData() {
    //document.getElementById("submitbtn").disabled = false;
    var dataToSend = "username=" + document.getElementById("username").value + "&" + "score=" + highScore;
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "includes/scorehandler.inc.php", true);
    xhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhttp.send(dataToSend);
};

function moveBox(event) {
    const keyPressed = event.keyCode;
    const upArrow = 38;
    const downArrow = 40;
    const rightArrow = 39;
    const leftArrow = 37;
    const upW = 87;
    const downS = 83;
    const rightD = 68;
    const leftA = 65;

    switch(true) {
        case(keyPressed == downArrow || keyPressed == downS):
            window.removeEventListener("keydown", moveBox);
            mergePossible = false;
            moveDown();
            setTimeout(() => {
                mergeDownTiles();
                moveDown();
                setTimeout(() => {
                    updateColors();
                    checkTurn();
                    checkSurroundingTiles()
                    drawTiles();
                    updateScore();
                    checkHighScore();
                    checkGameOver();

                    // test();
                    // color1();
                    window.addEventListener("keydown", moveBox);
                }, 24);
            }, 48);

            break;
        case(keyPressed == upArrow || keyPressed == upW):
            window.removeEventListener("keydown", moveBox);
            mergePossible = false;
            moveUp();
            setTimeout(() => {
                mergeUpTiles();
                moveUp();
                setTimeout(() => {
                    updateColors();
                    checkTurn();
                    checkSurroundingTiles()
                    drawTiles();
                    updateScore();
                    checkHighScore();
                    checkGameOver();

                    // test();
                    // color1();
                    window.addEventListener("keydown", moveBox);
                }, 24);
            }, 48);

            break;
        case(keyPressed == rightArrow || keyPressed == rightD):
            window.removeEventListener("keydown", moveBox);
            mergePossible = false;
            moveRight();
            setTimeout(() => {
                mergeRightTiles();
                moveRight();
                setTimeout(() => {
                    updateColors();
                    checkTurn();
                    checkSurroundingTiles()
                    drawTiles();
                    updateScore();
                    checkHighScore();
                    checkGameOver();

                    // test();
                    // color1();
                    window.addEventListener("keydown", moveBox);
                }, 24);
            }, 48);

            break;
        case(keyPressed == leftArrow || keyPressed == leftA):
            window.removeEventListener("keydown", moveBox);
            mergePossible = false;
            moveLeft();
            setTimeout(() => {
                mergeLeftTiles();
                moveLeft();
                setTimeout(() => {
                    updateColors();
                    checkTurn();
                    checkSurroundingTiles()
                    drawTiles();
                    updateScore();
                    checkHighScore();
                    checkGameOver();

                    // test();
                    // color1();
                    window.addEventListener("keydown", moveBox);
                }, 24);
            }, 48);

            break;
        }

};